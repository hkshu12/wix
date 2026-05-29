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
import { fadeProgress, remainingFadeSeconds, type TimerAudioFade } from './timerAudioFade';

function readInitialSleepTimer(): HydratedSleepTimerSnapshot {
  return hydrateSleepTimerSnapshot(readSleepTimerSnapshot(), Date.now());
}

interface UseSleepTimerControllerOptions {
  mixer: MixerState;
  setMixer: Dispatch<SetStateAction<MixerState>>;
  timerAudio?: TimerAudioFade;
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

export function useSleepTimerController({
  mixer,
  setMixer,
  timerAudio
}: UseSleepTimerControllerOptions): SleepTimerController {
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
  const fadeRampStartedRef = useRef(false);

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
    fadeRampStartedRef.current = false;
    timerAudio?.setMasterVolumeImmediate(preFadeMasterVolumeRef.current);
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
    fadeRampStartedRef.current = false;
    return true;
  }

  useEffect(() => {
    if (!isSleepTimerActive(sleepTimer)) {
      setRemainingMs(0);
      setIsFading(false);
      fadeRampStartedRef.current = false;
      return;
    }

    const tick = () => {
      const now = Date.now();
      setRemainingMs(getSleepTimerRemainingMs(sleepTimer, now));

      if (shouldFinishSleepTimer(sleepTimer, now)) {
        clearSleepTimerSnapshot();
        setSleepTimer(clearSleepTimer());
        setIsFading(false);
        fadeRampStartedRef.current = false;
        timerAudio?.setMasterVolumeImmediate(preFadeMasterVolumeRef.current);
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
        const preFade = preFadeMasterVolumeRef.current;

        setIsFading(true);

        if (!fadeRampStartedRef.current) {
          fadeRampStartedRef.current = true;

          if (timerAudio) {
            const progress = fadeProgress(fadeStartsAt, fadeEndsAt, now);
            const fromVolume = preFade * (1 - progress);
            const remainingSeconds = remainingFadeSeconds(fadeStartsAt, fadeEndsAt, now);
            timerAudio.scheduleMasterRamp(fromVolume, 0, remainingSeconds);
          }
        }

        if (!timerAudio) {
          const progress = fadeProgress(fadeStartsAt, fadeEndsAt, now);
          const nextVolume = preFade * (1 - progress);
          setMixer((state) => setMasterVolume(state, nextVolume));
        }
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [mixer.isPlaying, setMixer, sleepTimer, timerAudio]);

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
