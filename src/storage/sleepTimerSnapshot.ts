import {
  clearSleepTimer,
  shouldFinishSleepTimer,
  type SleepTimerState
} from '../domain/sleepTimer';

export const STORAGE_KEY_SLEEP_TIMER_SNAPSHOT = 'wix.sleepTimerSnapshot';
const SNAPSHOT_VERSION = 1;

export interface SleepTimerSnapshotPayload {
  version: number;
  fadeStartsAt: number;
  endsAt: number;
  preFadeMasterVolume: number;
}

export function readSleepTimerSnapshot(): SleepTimerSnapshotPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SLEEP_TIMER_SNAPSHOT);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return parseSleepTimerSnapshotPayload(parsed);
  } catch {
    return null;
  }
}

export function writeSleepTimerSnapshot(timer: SleepTimerState, preFadeMasterVolume: number): void {
  if (timer.fadeStartsAt === null || timer.endsAt === null) {
    clearSleepTimerSnapshot();
    return;
  }

  const payload: SleepTimerSnapshotPayload = {
    version: SNAPSHOT_VERSION,
    fadeStartsAt: timer.fadeStartsAt,
    endsAt: timer.endsAt,
    preFadeMasterVolume
  };

  localStorage.setItem(STORAGE_KEY_SLEEP_TIMER_SNAPSHOT, JSON.stringify(payload));
}

export function clearSleepTimerSnapshot(): void {
  localStorage.removeItem(STORAGE_KEY_SLEEP_TIMER_SNAPSHOT);
}

export interface HydratedSleepTimerSnapshot {
  timer: SleepTimerState;
  preFadeMasterVolume: number | null;
  /** Timer ended while the app was closed; caller should restore pre-fade master volume. */
  expiredWhileClosed: boolean;
}

/** Restores an active timer or clears storage when expired or invalid. */
export function hydrateSleepTimerSnapshot(
  snapshot: SleepTimerSnapshotPayload | null,
  nowMs: number
): HydratedSleepTimerSnapshot {
  if (!snapshot) {
    return { timer: clearSleepTimer(), preFadeMasterVolume: null, expiredWhileClosed: false };
  }

  const timer: SleepTimerState = {
    fadeStartsAt: snapshot.fadeStartsAt,
    endsAt: snapshot.endsAt
  };

  if (shouldFinishSleepTimer(timer, nowMs)) {
    clearSleepTimerSnapshot();
    return {
      timer: clearSleepTimer(),
      preFadeMasterVolume: snapshot.preFadeMasterVolume,
      expiredWhileClosed: true
    };
  }

  return { timer, preFadeMasterVolume: snapshot.preFadeMasterVolume, expiredWhileClosed: false };
}

function parseSleepTimerSnapshotPayload(value: unknown): SleepTimerSnapshotPayload | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (record.version !== SNAPSHOT_VERSION) {
    return null;
  }

  const fadeStartsAt = parseTimestamp(record.fadeStartsAt);
  const endsAt = parseTimestamp(record.endsAt);
  const preFadeMasterVolume = clampNumber(record.preFadeMasterVolume, 0, 1);

  if (fadeStartsAt === null || endsAt === null || preFadeMasterVolume === null) {
    return null;
  }

  if (endsAt <= fadeStartsAt) {
    return null;
  }

  return {
    version: SNAPSHOT_VERSION,
    fadeStartsAt,
    endsAt,
    preFadeMasterVolume
  };
}

function parseTimestamp(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
}

function clampNumber(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  return Math.min(max, Math.max(min, value));
}
