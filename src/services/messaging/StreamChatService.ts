import { StreamChat } from 'stream-chat';
import { api } from '../../api';
import type { ChatMessage } from '../../api/types';
import { env } from '../../config/env';
import { useAuthStore } from '../../store/authStore';
import type { ChatService } from './types';

/** Stream message objects vary across SDK versions; we only read these fields. */
interface StreamMessageLike {
  id: string;
  text?: string;
  user?: { id?: string } | null;
  created_at?: string | Date;
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

  private toMessage(conversationId: string, msg: StreamMessageLike, myId: string | undefined): ChatMessage {
    return {
      id: msg.id,
      conversationId,
      text: msg.text ?? '',
      fromMe: !!myId && msg.user?.id === myId,
      time: formatTime(msg.created_at),
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
}
