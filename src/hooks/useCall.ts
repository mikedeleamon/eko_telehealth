import { useCallback, useEffect, useRef, useState } from 'react';
import { videoService, type CallState } from '../services/video';
import { useTranslation } from '../i18n/useTranslation';

interface UseCallOptions {
  roomName: string;
  audioOnly?: boolean;
}

/**
 * Drives the audio/video call screens against the VideoService abstraction:
 * joins on mount, leaves on unmount, tracks call state, elapsed time and
 * local control toggles.
 */
export function useCall({ roomName, audioOnly = false }: UseCallOptions) {
  const { t } = useTranslation();
  const [state, setState] = useState<CallState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMutedState] = useState(false);
  const [cameraOff, setCameraOffState] = useState(false);
  const [speakerOn, setSpeakerOnState] = useState(!audioOnly);
  const [frontCamera, setFrontCamera] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    videoService
      .join(roomName, {
        audioOnly,
        onStateChange: setState,
        onError: () => setState('failed'),
      })
      .catch(() => setState('failed'));

    return () => {
      videoService.leave().catch(() => {});
    };
  }, [roomName, audioOnly]);

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

  const hangUp = useCallback(async () => {
    await videoService.leave().catch(() => {});
  }, []);

  const mm = Math.floor(elapsed / 60);
  const hh = Math.floor(mm / 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  const elapsedLabel = `${pad(hh)}:${pad(mm % 60)}:${pad(elapsed % 60)}`;

  const statusLabel =
    state === 'connecting' ? t('call.connecting')
    : state === 'reconnecting' ? t('call.reconnecting')
    : state === 'failed' ? t('call.callFailed')
    : elapsedLabel;

  return {
    state,
    elapsedLabel,
    statusLabel,
    muted,
    cameraOff,
    speakerOn,
    frontCamera,
    toggleMuted,
    toggleCamera,
    toggleSpeaker,
    flipCamera,
    hangUp,
  };
}
