import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { setMasterVolume, setPlaying, type MixerState } from '../domain/mixer';
import {
  clampWakeTimerFadeSeconds,
  clearWakeTimer,
  formatWakeTimerRemaining,
  getWakeTimerRemainingMs,
  isWakeTimerActive,
  isValidWakeTimerMinutes,
  shouldFinishWakeTimer,
  shouldStartWakeFade,
  startWakeTimer,
  type WakeTimerState
} from '../domain/wakeTimer';
import { readWakeTimerFadeSeconds, writeWakeTimerFadeSeconds } from '../storage/wakeTimerPreferences';
import {
  clearWakeTimerSnapshot,
  hydrateWakeTimerSnapshot,
  readWakeTimerSnapshot,
  writeWakeTimerSnapshot,
  type HydratedWakeTimerSnapshot
} from '../storage/wakeTimerSnapshot';

function readInitialWakeTimer(): HydratedWakeTimerSnapshot {
  return hydrateWakeTimerSnapshot(readWakeTimerSnapshot(), Date.now());
}

interface UseWakeTimerControllerOptions {
  mixer: MixerState;
  setMixer: Dispatch<SetStateAction<MixerState>>;
}

export interface WakeTimerController {
  wakeTimer: WakeTimerState;
  remainingLabel: string;
  isActive: boolean;
  isFading: boolean;
  fadeSeconds: number;
  setFadeSeconds: (seconds: number) => void;
  start: (minutes: number) => boolean;
  cancel: () => void;
}

export function useWakeTimerController({ mixer, setMixer }: UseWakeTimerControllerOptions): WakeTimerController {
  const initialWakeTimer = useRef(readInitialWakeTimer());
  const [wakeTimer, setWakeTimer] = useState<WakeTimerState>(() => initialWakeTimer.current.timer);
  const [remainingMs, setRemainingMs] = useState(() =>
    getWakeTimerRemainingMs(initialWakeTimer.current.timer, Date.now())
  );
  const [isFading, setIsFading] = useState(false);
  const [fadeSeconds, setFadeSecondsState] = useState(readWakeTimerFadeSeconds);
  const targetMasterVolumeRef = useRef(
    initialWakeTimer.current.targetMasterVolume ?? mixer.masterVolume
  );
  const fadeStartedRef = useRef(false);

  function setFadeSeconds(seconds: number) {
    const clamped = clampWakeTimerFadeSeconds(seconds);
    writeWakeTimerFadeSeconds(clamped);
    setFadeSecondsState(clamped);
  }

  useEffect(() => {
    if (!initialWakeTimer.current.expiredWhileClosed) {
      return;
    }

    const target = initialWakeTimer.current.targetMasterVolume;
    if (target === null) {
      return;
    }

    targetMasterVolumeRef.current = target;
    setMixer((state) => setMasterVolume(state, target));
    initialWakeTimer.current.expiredWhileClosed = false;
  }, [setMixer]);

  function cancel() {
    clearWakeTimerSnapshot();
    setWakeTimer(clearWakeTimer());
    setIsFading(false);
    fadeStartedRef.current = false;
  }

  function start(minutes: number): boolean {
    if (!isValidWakeTimerMinutes(minutes)) {
      return false;
    }

    targetMasterVolumeRef.current = mixer.masterVolume;
    const timer = startWakeTimer(Date.now(), minutes, fadeSeconds);
    writeWakeTimerSnapshot(timer, targetMasterVolumeRef.current);
    setWakeTimer(timer);
    setIsFading(false);
    fadeStartedRef.current = false;
    return true;
  }

  useEffect(() => {
    if (!isWakeTimerActive(wakeTimer)) {
      setRemainingMs(0);
      setIsFading(false);
      fadeStartedRef.current = false;
      return;
    }

    const tick = () => {
      const now = Date.now();
      setRemainingMs(getWakeTimerRemainingMs(wakeTimer, now));

      if (shouldFinishWakeTimer(wakeTimer, now)) {
        clearWakeTimerSnapshot();
        setWakeTimer(clearWakeTimer());
        setIsFading(false);
        fadeStartedRef.current = false;
        const target = targetMasterVolumeRef.current;
        setMixer((state) => {
          const withVolume = setMasterVolume(state, target);
          return state.isPlaying ? withVolume : setPlaying(withVolume, true);
        });
        return;
      }

      if (shouldStartWakeFade(wakeTimer, now)) {
        const fadeStartsAt = wakeTimer.fadeStartsAt!;
        const fadeEndsAt = wakeTimer.endsAt!;
        const fadeDuration = fadeEndsAt - fadeStartsAt;
        const progress = fadeDuration > 0 ? Math.min(1, (now - fadeStartsAt) / fadeDuration) : 1;
        const target = targetMasterVolumeRef.current;
        const nextVolume = target * progress;

        if (!fadeStartedRef.current) {
          fadeStartedRef.current = true;
          setIsFading(true);
          setMixer((state) => {
            const atZero = setMasterVolume(state, 0);
            return state.isPlaying ? atZero : setPlaying(atZero, true);
          });
          return;
        }

        setIsFading(true);
        setMixer((state) => setMasterVolume(state, nextVolume));
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [setMixer, wakeTimer]);

  return {
    wakeTimer,
    remainingLabel: formatWakeTimerRemaining(remainingMs),
    isActive: isWakeTimerActive(wakeTimer),
    isFading,
    fadeSeconds,
    setFadeSeconds,
    start,
    cancel
  };
}
