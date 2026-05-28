import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { setMasterVolume, setPlaying, type MixerState } from '../domain/mixer';
import {
  clampSleepTimerFadeSeconds,
  clearSleepTimer,
  formatSleepTimerRemaining,
  getSleepTimerRemainingMs,
  isSleepTimerActive,
  shouldFinishSleepTimer,
  shouldStartSleepFade,
  isValidSleepTimerMinutes,
  startSleepTimer,
  type SleepTimerState
} from '../domain/sleepTimer';
import {
  readSleepTimerFadeSeconds,
  writeSleepTimerFadeSeconds
} from '../storage/sleepTimerPreferences';
import {
  clearSleepTimerSnapshot,
  hydrateSleepTimerSnapshot,
  readSleepTimerSnapshot,
  writeSleepTimerSnapshot,
  type HydratedSleepTimerSnapshot
} from '../storage/sleepTimerSnapshot';

function readInitialSleepTimer(): HydratedSleepTimerSnapshot {
  return hydrateSleepTimerSnapshot(readSleepTimerSnapshot(), Date.now());
}

interface UseSleepTimerControllerOptions {
  mixer: MixerState;
  setMixer: Dispatch<SetStateAction<MixerState>>;
}

export interface SleepTimerController {
  sleepTimer: SleepTimerState;
  remainingLabel: string;
  isActive: boolean;
  isFading: boolean;
  fadeSeconds: number;
  setFadeSeconds: (seconds: number) => void;
  start: (minutes: number) => boolean;
  cancel: () => void;
}

export function useSleepTimerController({ mixer, setMixer }: UseSleepTimerControllerOptions): SleepTimerController {
  const initialSleepTimer = useRef(readInitialSleepTimer());
  const [sleepTimer, setSleepTimer] = useState<SleepTimerState>(() => initialSleepTimer.current.timer);
  const [remainingMs, setRemainingMs] = useState(() =>
    getSleepTimerRemainingMs(initialSleepTimer.current.timer, Date.now())
  );
  const [isFading, setIsFading] = useState(false);
  const [fadeSeconds, setFadeSecondsState] = useState(readSleepTimerFadeSeconds);
  const preFadeMasterVolumeRef = useRef(
    initialSleepTimer.current.preFadeMasterVolume ?? mixer.masterVolume
  );

  function setFadeSeconds(seconds: number) {
    const clamped = clampSleepTimerFadeSeconds(seconds);
    writeSleepTimerFadeSeconds(clamped);
    setFadeSecondsState(clamped);
  }

  useEffect(() => {
    if (!initialSleepTimer.current.expiredWhileClosed) {
      return;
    }

    const preFade = initialSleepTimer.current.preFadeMasterVolume;
    if (preFade === null) {
      return;
    }

    preFadeMasterVolumeRef.current = preFade;
    setMixer((state) => setMasterVolume(state, preFade));
    initialSleepTimer.current.expiredWhileClosed = false;
  }, [setMixer]);

  function cancel() {
    clearSleepTimerSnapshot();
    setSleepTimer(clearSleepTimer());
    setIsFading(false);
    if (preFadeMasterVolumeRef.current !== undefined) {
      setMixer((state) => setMasterVolume(state, preFadeMasterVolumeRef.current));
    }
  }

  function start(minutes: number): boolean {
    if (!isValidSleepTimerMinutes(minutes)) {
      return false;
    }

    preFadeMasterVolumeRef.current = mixer.masterVolume;
    const timer = startSleepTimer(Date.now(), minutes, fadeSeconds);
    writeSleepTimerSnapshot(timer, preFadeMasterVolumeRef.current);
    setSleepTimer(timer);
    setIsFading(false);
    return true;
  }

  useEffect(() => {
    if (!isSleepTimerActive(sleepTimer)) {
      setRemainingMs(0);
      setIsFading(false);
      return;
    }

    const tick = () => {
      const now = Date.now();
      setRemainingMs(getSleepTimerRemainingMs(sleepTimer, now));

      if (shouldFinishSleepTimer(sleepTimer, now)) {
        clearSleepTimerSnapshot();
        setSleepTimer(clearSleepTimer());
        setIsFading(false);
        if (mixer.isPlaying) {
          setMixer((state) =>
            setPlaying(setMasterVolume(state, preFadeMasterVolumeRef.current), false)
          );
        } else {
          setMixer((state) => setMasterVolume(state, preFadeMasterVolumeRef.current));
        }
        return;
      }

      if (mixer.isPlaying && shouldStartSleepFade(sleepTimer, now)) {
        const fadeStartsAt = sleepTimer.fadeStartsAt!;
        const fadeEndsAt = sleepTimer.endsAt!;
        const fadeDuration = fadeEndsAt - fadeStartsAt;
        const progress = fadeDuration > 0 ? Math.min(1, (now - fadeStartsAt) / fadeDuration) : 1;
        const nextVolume = preFadeMasterVolumeRef.current * (1 - progress);

        setIsFading(true);
        setMixer((state) => setMasterVolume(state, nextVolume));
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [mixer.isPlaying, setMixer, sleepTimer]);

  return {
    sleepTimer,
    remainingLabel: formatSleepTimerRemaining(remainingMs),
    isActive: isSleepTimerActive(sleepTimer),
    isFading,
    fadeSeconds,
    setFadeSeconds,
    start,
    cancel
  };
}
