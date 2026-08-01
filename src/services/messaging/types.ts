import type { ChatMessage, PickedFile } from '../../api/types';

/**
 * What the server's anti-disintermediation filter substitutes for contact
 * details. Must stay in sync with REDACTION_PLACEHOLDER in the backend's
 * src/lib/contactFilter.ts — the app matches on it to tell the sender their
 * message was edited.
 */
export const REDACTION_PLACEHOLDER = '[contact details removed]';

/**
 * Realtime chat abstraction. The UI only ever talks to this interface, so
 * swapping the mock for Stream Chat (or a WebSocket backend) is a
 * one-file change in src/services/messaging/index.ts.
 */
export interface ChatService {
  /** Load history for a conversation (REST-backed). */
  loadMessages(conversationId: string): Promise<ChatMessage[]>;

  /** Send a message; resolves with the persisted message. */
  sendMessage(conversationId: string, text: string): Promise<ChatMessage>;

  /** Send a picked photo/document as an attachment; resolves with the persisted message. */
  sendAttachment(conversationId: string, file: PickedFile, kind: 'image' | 'file'): Promise<ChatMessage>;

  /**
   * Subscribe to incoming messages for a conversation.
   * Returns an unsubscribe function — call it on unmount.
   */
  onMessage(conversationId: string, handler: (message: ChatMessage) => void): () => void;

  /**
   * Subscribe to edits of messages already in the thread. The server rewrites a
   * message in place when the contact filter masks it, so this is how the
   * sender's own client learns its text changed after it was sent.
   * Returns an unsubscribe function — call it on unmount.
   */
  onMessageUpdated(conversationId: string, handler: (message: ChatMessage) => void): () => void;
}
