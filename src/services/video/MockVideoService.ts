import { api } from '../../api';
import type { CallEvents, CallState, VideoService } from './types';

/**
 * Development call backend: exercises the full lifecycle (token fetch →
 * connecting → connected → remote participant joins) with no media stack,
 * so the call screens behave realistically in demos.
 */
export class MockVideoService implements VideoService {
  private state: CallState = 'idle';
  private events: CallEvents = {};
  private joinTimer?: ReturnType<typeof setTimeout>;

  private setState(state: CallState) {
    this.state = state;
    this.events.onStateChange?.(state);
  }

  async join(roomName: string, opts: { audioOnly?: boolean } & CallEvents): Promise<void> {
    this.events = opts;
    this.setState('connecting');

    // Real implementations fetch a token the same way.
    await api.calls.token(roomName);

    this.setState('connected');
    this.joinTimer = setTimeout(() => {
      this.events.onRemoteJoined?.('remote-participant');
    }, 900);
  }

  async leave(): Promise<void> {
    if (this.joinTimer) clearTimeout(this.joinTimer);
    this.setState('ended');
    this.events = {};
  }

  async setMuted(_muted: boolean): Promise<void> {}
  async setCameraOff(_off: boolean): Promise<void> {}
  async setSpeakerOn(_on: boolean): Promise<void> {}
  async flipCamera(): Promise<void> {}

  getState(): CallState {
    return this.state;
  }
}
