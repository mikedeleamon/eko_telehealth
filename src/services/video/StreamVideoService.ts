import type { Call, StreamVideoClient } from '@stream-io/video-react-native-sdk';
import { api } from '../../api';
import { env } from '../../config/env';
import type { CallEvents, CallState, ConnectionQuality, VideoService } from './types';

/**
 * Stream reports connection quality as an SfuModels.ConnectionQuality enum:
 * 0 UNSPECIFIED, 1 POOR, 2 GOOD, 3 EXCELLENT. Mapped by value rather than by
 * importing the enum, so the numbers can't drag the native SDK into a mock
 * build through a type-only path.
 */
function toQuality(raw: unknown): ConnectionQuality {
  switch (raw) {
    case 1:
      return 'poor';
    case 2:
      return 'fair';
    case 3:
      return 'good';
    default:
      return 'unknown';
  }
}

/**
 * Stream Video implementation of the VideoService interface.
 *
 * The native SDK (@stream-io/video-react-native-sdk → @stream-io/react-native-webrtc)
 * is loaded with a dynamic import() *inside* join(), so it only initialises when
 * a call actually starts. Mock mode and the chat-only path never pull in the
 * WebRTC native module, and the app boots without it.
 *
 * To activate on a device:
 *   1. It's already installed. Rebuild the dev client so the native modules link:
 *        npx expo prebuild -p ios --clean && npm run ios   (and/or android)
 *   2. Set EXPO_PUBLIC_REALTIME_PROVIDER=stream and EXPO_PUBLIC_STREAM_API_KEY.
 *
 * The call screens render placeholder avatars today; to show real video frames,
 * wire Stream's <StreamCall> + <ParticipantView> into VideoCallScreen using the
 * `call` exposed here (see getCall()).
 */
export class StreamVideoService implements VideoService {
  private state: CallState = 'idle';
  private events: CallEvents = {};
  private client: StreamVideoClient | null = null;
  private call: Call | null = null;
  private unsubscribers: Array<() => void> = [];

  private setState(state: CallState) {
    this.state = state;
    this.events.onStateChange?.(state);
  }

  async join(appointmentId: string, opts: { audioOnly?: boolean } & CallEvents): Promise<void> {
    this.events = opts;
    this.setState('connecting');

    try {
      // This call is the authorization gate: it 404s if the caller isn't a
      // party to the visit and 409s if the visit isn't open (unpaid, or over).
      const grant = await api.calls.token(appointmentId);
      const apiKey = grant.apiKey || env.streamApiKey;
      if (!apiKey) {
        throw new Error('Missing Stream API key — set EXPO_PUBLIC_STREAM_API_KEY or return it from /calls/token.');
      }

      // Lazy native import: keeps WebRTC out of mock/chat builds until a call starts.
      const sdk = await import('@stream-io/video-react-native-sdk');
      const client = new sdk.StreamVideoClient({
        apiKey,
        user: { id: grant.identity },
        token: grant.token,
      });
      // The server's room, never a client-side one — that indirection is what
      // stops a caller joining a room they simply named.
      const call = client.call(grant.callType || 'default', grant.roomName);

      this.unsubscribers.push(
        call.on('call.session_participant_joined', (event) => {
          const participant = (event as { participant?: { user_id?: string } }).participant;
          this.events.onRemoteJoined?.(participant?.user_id ?? 'participant');
        }),
        call.on('call.session_participant_left', (event) => {
          const participant = (event as { participant?: { user_id?: string } }).participant;
          this.events.onRemoteLeft?.(participant?.user_id ?? 'participant');
        }),
      );

      // Local connection quality, for the weak-bandwidth fallback. Subscribed
      // defensively: this is an observable on Stream's call state rather than
      // an event, and a provider that stops publishing it must degrade to
      // "we don't know" rather than taking the call screen down with it.
      try {
        const localParticipant$ = (call.state as { localParticipant$?: { subscribe: (fn: (p: unknown) => void) => { unsubscribe: () => void } } })
          .localParticipant$;
        if (localParticipant$) {
          let last: ConnectionQuality = 'unknown';
          const sub = localParticipant$.subscribe((participant) => {
            const quality = toQuality((participant as { connectionQuality?: unknown } | undefined)?.connectionQuality);
            // Only forward transitions — the observable re-emits on every
            // participant change, and a per-frame callback would defeat the
            // debounce the prompt relies on.
            if (quality !== last) {
              last = quality;
              this.events.onQualityChange?.(quality);
            }
          });
          this.unsubscribers.push(() => sub.unsubscribe());
        }
      } catch {
        // No quality signal from this SDK version — the manual "switch to
        // voice" / "continue in chat" controls still work without it.
      }

      await call.join({ create: true });
      if (opts.audioOnly) await call.camera.disable();

      this.client = client;
      this.call = call;
      this.setState('connected');
    } catch (err) {
      this.setState('failed');
      this.events.onError?.(err instanceof Error ? err : new Error('Call failed to connect'));
      throw err;
    }
  }

  async leave(): Promise<void> {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    try {
      await this.call?.leave();
    } catch {
      // already left / never fully joined — fall through to cleanup
    } finally {
      await this.client?.disconnectUser().catch(() => {});
      this.call = null;
      this.client = null;
      this.setState('ended');
      this.events = {};
    }
  }

  async setMuted(muted: boolean): Promise<void> {
    if (!this.call) return;
    await (muted ? this.call.microphone.disable() : this.call.microphone.enable());
  }

  async setCameraOff(off: boolean): Promise<void> {
    if (!this.call) return;
    await (off ? this.call.camera.disable() : this.call.camera.enable());
  }

  async setSpeakerOn(_on: boolean): Promise<void> {
    // Stream RN routes call audio automatically (earpiece vs. loudspeaker) via
    // the in-call manager; there's no explicit client speakerphone toggle, so
    // this is a no-op. The UI still reflects the user's chosen preference.
  }

  async flipCamera(): Promise<void> {
    await this.call?.camera.flip();
  }

  getState(): CallState {
    return this.state;
  }

  /** The connected Stream Video client, for the <StreamVideo> provider. */
  getClient(): StreamVideoClient | null {
    return this.client;
  }

  /** The active Stream Call, for the <StreamCall> provider + <ParticipantView>. */
  getCall(): Call | null {
    return this.call;
  }
}
