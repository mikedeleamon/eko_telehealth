import { env } from '../../config/env';
import { MockVideoService } from './MockVideoService';
import { TwilioVideoService } from './TwilioVideoService';
import type { VideoService } from './types';

export type { CallControls, CallState, VideoService } from './types';

/** Singleton video service chosen by EXPO_PUBLIC_REALTIME_PROVIDER. */
export const videoService: VideoService =
  env.realtimeProvider === 'twilio' ? new TwilioVideoService() : new MockVideoService();
