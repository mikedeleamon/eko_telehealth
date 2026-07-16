/**
 * Video/audio call abstraction. The call screens drive this interface only;
 * the Stream Video SDK slots in behind it without touching UI code.
 */
export type CallState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'ended' | 'failed';

export interface CallControls {
  muted: boolean;
  cameraOff: boolean;
  speakerOn: boolean;
  frontCamera: boolean;
}

export interface CallEvents {
  onStateChange?: (state: CallState) => void;
  onRemoteJoined?: (identity: string) => void;
  onRemoteLeft?: (identity: string) => void;
  onError?: (error: Error) => void;
}

export interface VideoService {
  /**
   * Join a room. `audioOnly` powers the audio-call screen.
   * Token acquisition (POST /calls/token) happens inside the service.
   */
  join(roomName: string, opts: { audioOnly?: boolean } & CallEvents): Promise<void>;

  leave(): Promise<void>;

  setMuted(muted: boolean): Promise<void>;
  setCameraOff(off: boolean): Promise<void>;
  setSpeakerOn(on: boolean): Promise<void>;
  flipCamera(): Promise<void>;

  getState(): CallState;
}
