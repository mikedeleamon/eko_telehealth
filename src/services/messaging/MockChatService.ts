import { api } from '../../api';
import type { ChatMessage, PickedFile } from '../../api/types';
import type { ChatService } from './types';

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/**
 * Development chat backend: loads history from the (mock) API and echoes a
 * canned doctor reply shortly after every sent message so the conversation
 * feels alive in demos.
 */
export class MockChatService implements ChatService {
  private handlers = new Map<string, Set<(m: ChatMessage) => void>>();

  loadMessages(conversationId: string): Promise<ChatMessage[]> {
    return api.messaging.messages(conversationId);
  }

  async sendMessage(conversationId: string, text: string): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: Date.now().toString(),
      conversationId,
      text,
      fromMe: true,
      time: now(),
    };

    setTimeout(() => {
      const reply: ChatMessage = {
        id: `${Date.now()}-reply`,
        conversationId,
        text: "Thank you, I'll review your information shortly.",
        fromMe: false,
        time: now(),
      };
      this.handlers.get(conversationId)?.forEach((h) => h(reply));
    }, 1200);

    return message;
  }

  /** No R2/Stream CDN in mock mode — the local file uri IS the attachment, which <Image> renders fine on-device. */
  async sendAttachment(conversationId: string, file: PickedFile, kind: 'image' | 'file'): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: Date.now().toString(),
      conversationId,
      text: '',
      fromMe: true,
      time: now(),
      attachment: { url: file.uri, name: file.name, mimeType: file.mimeType, kind },
    };
    return message;
  }

  onMessage(conversationId: string, handler: (message: ChatMessage) => void): () => void {
    if (!this.handlers.has(conversationId)) this.handlers.set(conversationId, new Set());
    this.handlers.get(conversationId)!.add(handler);
    return () => {
      this.handlers.get(conversationId)?.delete(handler);
    };
  }

  /**
   * No-op: message edits come from the server's contact filter, which only
   * exists on the real backend. Nothing in the mock flow rewrites a message.
   */
  onMessageUpdated(): () => void {
    return () => {};
  }
}
