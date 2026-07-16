import { env } from '../../config/env';
import { MockVideoService } from './MockVideoService';
import { StreamVideoService } from './StreamVideoService';
import type { VideoService } from './types';

export type { CallControls, CallState, VideoService } from './types';

/**
 * Singleton video service chosen by EXPO_PUBLIC_REALTIME_PROVIDER.
 *
 * StreamVideoService is safe to import here even in mock mode: it only pulls in
 * the native WebRTC SDK via a dynamic import() when a call actually starts, so
 * this line never initialises native modules on its own.
 */
export const videoService: VideoService =
  env.realtimeProvider === 'stream' ? new StreamVideoService() : new MockVideoService();
