import { env } from '../../config/env';
import { MockChatService } from './MockChatService';
import { TwilioChatService } from './TwilioChatService';
import type { ChatService } from './types';

export type { ChatService } from './types';

/** Singleton chat service chosen by EXPO_PUBLIC_REALTIME_PROVIDER. */
export const chatService: ChatService =
  env.realtimeProvider === 'twilio' ? new TwilioChatService() : new MockChatService();
