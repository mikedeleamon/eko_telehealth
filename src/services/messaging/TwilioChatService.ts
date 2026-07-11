import { api } from '../../api';
import type { ChatMessage } from '../../api/types';
import type { ChatService } from './types';

/**
 * Twilio Conversations implementation — scaffold.
 *
 * To activate (see the integration guide PDF for the full walkthrough):
 *  1. `npx expo install @twilio/conversations`
 *  2. Backend: expose POST /chat/token that mints a Conversations access
 *     token (grant: Chat) for the signed-in user.
 *  3. Implement the TODOs below, then set EXPO_PUBLIC_REALTIME_PROVIDER=twilio.
 *
 * The UI is already wired to the ChatService interface, so nothing outside
 * this file changes.
 */
export class TwilioChatService implements ChatService {
  async loadMessages(conversationId: string): Promise<ChatMessage[]> {
    // History can keep coming from our own API (universal EMR requires the
    // backend to store transcripts anyway), or from conversation.getMessages().
    return api.messaging.messages(conversationId);
  }

  async sendMessage(_conversationId: string, _text: string): Promise<ChatMessage> {
    // TODO: const client = await this.getClient();
    // const conversation = await client.getConversationBySid(conversationId);
    // await conversation.sendMessage(text);
    throw new Error(
      'TwilioChatService is not configured yet. Follow the steps in the integration guide, or keep EXPO_PUBLIC_REALTIME_PROVIDER=mock.',
    );
  }

  onMessage(_conversationId: string, _handler: (message: ChatMessage) => void): () => void {
    // TODO: subscribe to client 'messageAdded' events and forward them.
    return () => {};
  }
}
