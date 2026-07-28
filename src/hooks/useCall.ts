import { useCallback, useEffect, useRef, useState } from 'react';
import { videoService, type CallState, type ConnectionQuality } from '../services/video';
import { ApiError } from '../api/client';
import { useTranslation } from '../i18n/useTranslation';

interface UseCallOptions {
  /**
   * The visit being joined. The room is derived from this server-side, and the
   * token request doubles as the authorization check — so a screen that can't
   * name a real appointment can't start a call.
   */
  appointmentId?: string;
  audioOnly?: boolean;
}

/**
 * How long the connection has to stay poor before the fallback is offered.
 *
 * A single bad sample is a passing blip — an elevator, a lane change — and
 * offering to abandon video for it would be worse than the blip. Sustained
 * trouble is what the requirement means by "weak bandwidth".
 */
const POOR_CONNECTION_GRACE_MS = 8000;

/** After the user waves the prompt away, don't ask again for this long. */
const PROMPT_SNOOZE_MS = 60_000;

/**
 * Drives the audio/video call screens against the VideoService abstraction:
 * joins on mount, leaves on unmount, tracks call state, elapsed time, local
 * control toggles, and the weak-bandwidth fallback.
 *
 * The fallback is offered, never imposed: the user can drop to voice or move
 * to chat at any time from the call bar, and a sustained poor connection
 * raises a prompt suggesting it. Cutting someone's camera automatically
 * mid-examination — without them agreeing to it — would be worse than a laggy
 * picture, so nothing here switches modes on its own.
 */
export function useCall({ appointmentId, audioOnly = false }: UseCallOptions) {
  const { t } = useTranslation();
  const [state, setState] = useState<CallState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMutedState] = useState(false);
  const [cameraOff, setCameraOffState] = useState(false);
  const [speakerOn, setSpeakerOnState] = useState(!audioOnly);
  const [frontCamera, setFrontCamera] = useState(true);
  const [quality, setQuality] = useState<ConnectionQuality>('unknown');
  const [voiceOnly, setVoiceOnly] = useState(audioOnly);
  const [fallbackPrompted, setFallbackPrompted] = useState(false);
  /**
   * Set when the server accepted the request but the caller is a guest who
   * hasn't been let in yet (409 `awaiting_admission`). Distinct from 'failed':
   * nothing is wrong, someone just has to open the door.
   */
  const [awaitingAdmission, setAwaitingAdmission] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const poorSinceRef = useRef<number | null>(null);
  const snoozedUntilRef = useRef(0);

  useEffect(() => {
    // No appointment means no joinable visit — fail closed rather than
    // attempting a call the server would (correctly) refuse anyway.
    if (!appointmentId) {
      setState('failed');
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const attempt = () => {
      videoService
        .join(appointmentId, {
          audioOnly,
          onStateChange: (next) => {
            if (cancelled) return;
            setAwaitingAdmission(false);
            setState(next);
          },
          onQualityChange: (next) => {
            if (!cancelled) setQuality(next);
          },
          onError: () => {
            if (!cancelled) setState('failed');
          },
        })
        .catch((err) => {
          if (cancelled) return;
          // A guest whose invite hasn't been admitted yet waits at the door
          // and re-asks, rather than being told the call failed. The server
          // records the knock on the first of these, so the parties see them
          // waiting even while this loop is quiet.
          const waiting =
            err instanceof ApiError &&
            err.status === 409 &&
            (err.body as { details?: { code?: string } } | undefined)?.details?.code === 'awaiting_admission';
          if (waiting) {
            setAwaitingAdmission(true);
            setState('connecting');
            retryTimer = setTimeout(attempt, 4000);
            return;
          }
          setState('failed');
        });
    };

    attempt();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      videoService.leave().catch(() => {});
    };
  }, [appointmentId, audioOnly]);

  // Tick the call timer only while connected.
  useEffect(() => {
    if (state === 'connected') {
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  // Raise the fallback prompt once the connection has been poor for a while.
  // Recovery clears the clock, so a call that stabilises never gets asked.
  useEffect(() => {
    if (voiceOnly || state !== 'connected') return;
    if (quality !== 'poor') {
      poorSinceRef.current = null;
      return;
    }
    poorSinceRef.current = poorSinceRef.current ?? Date.now();
    const timer = setTimeout(() => {
      if (Date.now() >= snoozedUntilRef.current) setFallbackPrompted(true);
    }, POOR_CONNECTION_GRACE_MS);
    return () => clearTimeout(timer);
  }, [quality, state, voiceOnly]);

  const toggleMuted = useCallback(() => {
    setMutedState((v) => {
      videoService.setMuted(!v).catch(() => {});
      return !v;
    });
  }, []);

  const toggleCamera = useCallback(() => {
    setCameraOffState((v) => {
      videoService.setCameraOff(!v).catch(() => {});
      return !v;
    });
  }, []);

  const toggleSpeaker = useCallback(() => {
    setSpeakerOnState((v) => {
      videoService.setSpeakerOn(!v).catch(() => {});
      return !v;
    });
  }, []);

  const flipCamera = useCallback(() => {
    setFrontCamera((v) => !v);
    videoService.flipCamera().catch(() => {});
  }, []);

  /**
   * Drop to voice without leaving the call: the camera stops publishing, which
   * is the bandwidth that actually matters, and the conversation continues on
   * the same room and the same billed encounter.
   */
  const switchToVoice = useCallback(() => {
    setVoiceOnly(true);
    setCameraOffState(true);
    setFallbackPrompted(false);
    setSpeakerOnState(true);
    videoService.setCameraOff(true).catch(() => {});
    videoService.setSpeakerOn(true).catch(() => {});
  }, []);

  /** Restore video after a voice-only stretch — the connection may have recovered. */
  const restoreVideo = useCallback(() => {
    setVoiceOnly(false);
    setCameraOffState(false);
    videoService.setCameraOff(false).catch(() => {});
  }, []);

  const dismissFallback = useCallback(() => {
    setFallbackPrompted(false);
    snoozedUntilRef.current = Date.now() + PROMPT_SNOOZE_MS;
  }, []);

  const hangUp = useCallback(async () => {
    await videoService.leave().catch(() => {});
  }, []);

  const mm = Math.floor(elapsed / 60);
  const hh = Math.floor(mm / 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  const elapsedLabel = `${pad(hh)}:${pad(mm % 60)}:${pad(elapsed % 60)}`;

  const statusLabel =
    awaitingAdmission ? t('call.waitingToBeAdmitted')
    : state === 'connecting' ? t('call.connecting')
    : state === 'reconnecting' ? t('call.reconnecting')
    : state === 'failed' ? t('call.callFailed')
    : elapsedLabel;

  return {
    state,
    elapsedLabel,
    statusLabel,
    awaitingAdmission,
    muted,
    cameraOff,
    speakerOn,
    frontCamera,
    quality,
    voiceOnly,
    fallbackPrompted,
    toggleMuted,
    toggleCamera,
    toggleSpeaker,
    flipCamera,
    switchToVoice,
    restoreVideo,
    dismissFallback,
    hangUp,
  };
}
