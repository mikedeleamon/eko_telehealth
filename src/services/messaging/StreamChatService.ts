import { StreamChat } from 'stream-chat';
import { api } from '../../api';
import type { ChatAttachment, ChatMessage, PickedFile } from '../../api/types';
import { env } from '../../config/env';
import { useAuthStore } from '../../store/authStore';
import type { ChatService } from './types';

/** Stream message objects vary across SDK versions; we only read these fields. */
interface StreamMessageLike {
  id: string;
  text?: string;
  user?: { id?: string } | null;
  created_at?: string | Date;
  attachments?: { type?: string; image_url?: string; asset_url?: string; title?: string; fallback?: string; mime_type?: string }[];
}

const formatTime = (value: string | Date | undefined): string =>
  (value ? new Date(value) : new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/**
 * Stream Chat implementation of the ChatService interface. Pure JS SDK — no
 * native module, so it works in Expo Go and the dev client without a rebuild.
 *
 * Connects the signed-in user with a token minted by our backend
 * (POST /chat/token) and watches a `messaging` channel keyed by our
 * conversation id. Channel membership is the backend's job (it should add both
 * participants when a conversation is created, and persist transcripts for the
 * universal EMR); we create-or-watch here so demos work end to end meanwhile.
 */
export class StreamChatService implements ChatService {
  private client: StreamChat | null = null;
  private connecting: Promise<StreamChat> | null = null;

  private connect(): Promise<StreamChat> {
    if (this.client?.userID) return Promise.resolve(this.client);
    if (!this.connecting) {
      this.connecting = (async () => {
        const grant = await api.chat.token();
        const apiKey = grant.apiKey || env.streamApiKey;
        if (!apiKey) {
          throw new Error('Missing Stream API key — set EXPO_PUBLIC_STREAM_API_KEY or return it from /chat/token.');
        }
        const client = StreamChat.getInstance(apiKey);
        const user = useAuthStore.getState().session?.user;
        await client.connectUser(
          { id: grant.identity, name: user ? `${user.firstName} ${user.lastName}` : grant.identity },
          grant.token,
        );
        this.client = client;
        return client;
      })().catch((err) => {
        this.connecting = null; // allow a retry on the next call
        throw err;
      });
    }
    return this.connecting;
  }

  private channelFor(client: StreamChat, conversationId: string) {
    return client.channel('messaging', conversationId, { members: [client.userID!] });
  }

  /** This client only ever sends one attachment per message, so we only ever read the first. */
  private toAttachment(msg: StreamMessageLike): ChatAttachment | undefined {
    const a = msg.attachments?.[0];
    if (!a) return undefined;
    const isImage = a.type === 'image';
    const url = isImage ? a.image_url : a.asset_url;
    if (!url) return undefined;
    return { url, name: a.title ?? a.fallback ?? 'Attachment', mimeType: a.mime_type ?? '', kind: isImage ? 'image' : 'file' };
  }

  private toMessage(conversationId: string, msg: StreamMessageLike, myId: string | undefined): ChatMessage {
    return {
      id: msg.id,
      conversationId,
      text: msg.text ?? '',
      fromMe: !!myId && msg.user?.id === myId,
      time: formatTime(msg.created_at),
      attachment: this.toAttachment(msg),
    };
  }

  async loadMessages(conversationId: string): Promise<ChatMessage[]> {
    const client = await this.connect();
    const channel = this.channelFor(client, conversationId);
    await channel.watch();
    return channel.state.messages.map((m) =>
      this.toMessage(conversationId, m as unknown as StreamMessageLike, client.userID ?? undefined),
    );
  }

  async sendMessage(conversationId: string, text: string): Promise<ChatMessage> {
    const client = await this.connect();
    const channel = this.channelFor(client, conversationId);
    const res = await channel.sendMessage({ text });
    return this.toMessage(conversationId, res.message as unknown as StreamMessageLike, client.userID ?? undefined);
  }

  /**
   * Uploads the file to Stream's own CDN (its `sendImage`/`sendFile` accept a
   * plain RN `{uri, name, type}`-shaped source — here just the uri string
   * plus name/contentType args, which the SDK wraps the same way), then sends
   * a message whose only content is that attachment.
   */
  async sendAttachment(conversationId: string, file: PickedFile, kind: 'image' | 'file'): Promise<ChatMessage> {
    const client = await this.connect();
    const channel = this.channelFor(client, conversationId);
    const uploaded =
      kind === 'image'
        ? await channel.sendImage(file.uri, file.name, file.mimeType)
        : await channel.sendFile(file.uri, file.name, file.mimeType);
    const attachment =
      kind === 'image'
        ? { type: 'image', image_url: uploaded.file, fallback: file.name }
        : { type: 'file', asset_url: uploaded.file, title: file.name, mime_type: file.mimeType };
    const res = await channel.sendMessage({ text: '', attachments: [attachment] });
    return this.toMessage(conversationId, res.message as unknown as StreamMessageLike, client.userID ?? undefined);
  }

  onMessage(conversationId: string, handler: (message: ChatMessage) => void): () => void {
    let unsubscribe = () => {};
    this.connect()
      .then((client) => {
        const channel = this.channelFor(client, conversationId);
        const sub = channel.on('message.new', (event) => {
          const msg = event.message as unknown as StreamMessageLike | undefined;
          if (!msg) return;
          // The screen already appends our own sent messages; forward only others.
          if (msg.user?.id === client.userID) return;
          handler(this.toMessage(conversationId, msg, client.userID ?? undefined));
        });
        unsubscribe = () => sub.unsubscribe();
      })
      .catch(() => {});
    return () => unsubscribe();
  }

  onMessageUpdated(conversationId: string, handler: (message: ChatMessage) => void): () => void {
    let unsubscribe = () => {};
    this.connect()
      .then((client) => {
        const channel = this.channelFor(client, conversationId);
        // Unlike message.new, our OWN messages are the interesting case here:
        // the server rewrites them in place when the contact filter fires.
        const sub = channel.on('message.updated', (event) => {
          const msg = event.message as unknown as StreamMessageLike | undefined;
          if (!msg) return;
          handler(this.toMessage(conversationId, msg, client.userID ?? undefined));
        });
        unsubscribe = () => sub.unsubscribe();
      })
      .catch(() => {});
    return () => unsubscribe();
  }
}
