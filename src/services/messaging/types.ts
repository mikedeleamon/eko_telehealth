import type { ChatMessage } from '../../api/types';

/**
 * Realtime chat abstraction. The UI only ever talks to this interface, so
 * swapping the mock for Twilio Conversations (or a WebSocket backend) is a
 * one-file change in src/services/messaging/index.ts.
 */
export interface ChatService {
  /** Load history for a conversation (REST-backed). */
  loadMessages(conversationId: string): Promise<ChatMessage[]>;

  /** Send a message; resolves with the persisted message. */
  sendMessage(conversationId: string, text: string): Promise<ChatMessage>;

  /**
   * Subscribe to incoming messages for a conversation.
   * Returns an unsubscribe function — call it on unmount.
   */
  onMessage(conversationId: string, handler: (message: ChatMessage) => void): () => void;
}
