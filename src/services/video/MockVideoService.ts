import { api } from '../../api';
import { env } from '../../config/env';
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
  private qualityTimers: ReturnType<typeof setTimeout>[] = [];

  private setState(state: CallState) {
    this.state = state;
    this.events.onStateChange?.(state);
  }

  async join(appointmentId: string, opts: { audioOnly?: boolean } & CallEvents): Promise<void> {
    this.events = opts;
    this.setState('connecting');

    // Real implementations fetch a token the same way — and the token call is
    // what enforces that this user may join this visit at all.
    await api.calls.token(appointmentId);

    this.setState('connected');
    this.events.onQualityChange?.('good');
    this.joinTimer = setTimeout(() => {
      this.events.onRemoteJoined?.('remote-participant');
    }, 900);

    // A scripted network degradation, so the weak-bandwidth fallback can be
    // demonstrated without actually having bad internet. Off unless explicitly
    // asked for: a demo call that spontaneously offers to drop video reads as
    // a bug, not a feature.
    if (env.simulatePoorConnection) {
      this.qualityTimers.push(
        setTimeout(() => this.events.onQualityChange?.('fair'), 6000),
        setTimeout(() => this.events.onQualityChange?.('poor'), 10000),
        setTimeout(() => this.events.onQualityChange?.('good'), 45000),
      );
    }
  }

  async leave(): Promise<void> {
    if (this.joinTimer) clearTimeout(this.joinTimer);
    this.qualityTimers.forEach(clearTimeout);
    this.qualityTimers = [];
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
