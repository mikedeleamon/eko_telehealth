import type { CallEvents, CallState, VideoService } from './types';

/**
 * Twilio Video implementation — scaffold.
 *
 * To activate (see the integration guide PDF for the full walkthrough):
 *  1. `npm install react-native-twilio-video-webrtc` and rebuild the dev
 *     client (native module). Add camera/mic permission strings via the
 *     library's config plugin in app.json.
 *  2. Backend: expose POST /calls/token minting a Twilio Video access token
 *     (already contracted in src/api — api.calls.token()).
 *  3. Implement the TODOs below, then set EXPO_PUBLIC_REALTIME_PROVIDER=twilio.
 *
 * The call screens already run on the VideoService interface, so nothing
 * outside this file changes.
 */
export class TwilioVideoService implements VideoService {
  private state: CallState = 'idle';

  async join(_roomName: string, _opts: { audioOnly?: boolean } & CallEvents): Promise<void> {
    // TODO: const grant = await api.calls.token(roomName);
    // TwilioVideo.connect(grant.token, { roomName, audioOnly });
    throw new Error(
      'TwilioVideoService is not configured yet. Follow the steps in the integration guide, or keep EXPO_PUBLIC_REALTIME_PROVIDER=mock.',
    );
  }

  async leave(): Promise<void> {
    // TODO: TwilioVideo.disconnect();
    this.state = 'ended';
  }

  async setMuted(_muted: boolean): Promise<void> {
    // TODO: TwilioVideo.setLocalAudioEnabled(!muted);
  }

  async setCameraOff(_off: boolean): Promise<void> {
    // TODO: TwilioVideo.setLocalVideoEnabled(!off);
  }

  async setSpeakerOn(_on: boolean): Promise<void> {
    // TODO: TwilioVideo.toggleSoundSetup(on);
  }

  async flipCamera(): Promise<void> {
    // TODO: TwilioVideo.flipCamera();
  }

  getState(): CallState {
    return this.state;
  }
}
