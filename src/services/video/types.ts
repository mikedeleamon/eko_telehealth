/**
 * Video/audio call abstraction. The call screens drive this interface only;
 * the Stream Video SDK slots in behind it without touching UI code.
 */
export type CallState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'ended' | 'failed';

/**
 * How well the local connection is holding up. Drives the weak-bandwidth
 * fallback: sustained 'poor' is what offers the user a drop to voice or chat.
 * 'unknown' is the honest answer before the first sample and whenever the
 * provider doesn't report quality at all — it must never be treated as bad,
 * or every call would open by suggesting the user give up on video.
 */
export type ConnectionQuality = 'unknown' | 'good' | 'fair' | 'poor';

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
  onQualityChange?: (quality: ConnectionQuality) => void;
  onError?: (error: Error) => void;
}

export interface VideoService {
  /**
   * Join the call for one appointment. `audioOnly` powers the audio-call screen.
   *
   * Takes the APPOINTMENT id, not a room name: the room is derived server-side
   * during token acquisition (POST /calls/token), which also enforces that the
   * caller is a party to that visit — or a guest who has been admitted to it.
   * Callers never choose a room.
   */
  join(appointmentId: string, opts: { audioOnly?: boolean } & CallEvents): Promise<void>;

  leave(): Promise<void>;

  setMuted(muted: boolean): Promise<void>;
  setCameraOff(off: boolean): Promise<void>;
  setSpeakerOn(on: boolean): Promise<void>;
  flipCamera(): Promise<void>;

  getState(): CallState;
}
