import {
  clearWakeTimer,
  shouldFinishWakeTimer,
  type WakeTimerState
} from '../domain/wakeTimer';

export const STORAGE_KEY_WAKE_TIMER_SNAPSHOT = 'wix.wakeTimerSnapshot';
const SNAPSHOT_VERSION = 1;

export interface WakeTimerSnapshotPayload {
  version: number;
  fadeStartsAt: number;
  endsAt: number;
  targetMasterVolume: number;
}

export function readWakeTimerSnapshot(): WakeTimerSnapshotPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WAKE_TIMER_SNAPSHOT);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return parseWakeTimerSnapshotPayload(parsed);
  } catch {
    return null;
  }
}

export function writeWakeTimerSnapshot(timer: WakeTimerState, targetMasterVolume: number): void {
  if (timer.fadeStartsAt === null || timer.endsAt === null) {
    clearWakeTimerSnapshot();
    return;
  }

  const payload: WakeTimerSnapshotPayload = {
    version: SNAPSHOT_VERSION,
    fadeStartsAt: timer.fadeStartsAt,
    endsAt: timer.endsAt,
    targetMasterVolume
  };

  localStorage.setItem(STORAGE_KEY_WAKE_TIMER_SNAPSHOT, JSON.stringify(payload));
}

export function clearWakeTimerSnapshot(): void {
  localStorage.removeItem(STORAGE_KEY_WAKE_TIMER_SNAPSHOT);
}

export interface HydratedWakeTimerSnapshot {
  timer: WakeTimerState;
  targetMasterVolume: number | null;
  /** Timer ended while the app was closed; caller should apply target master volume. */
  expiredWhileClosed: boolean;
}

/** Restores an active timer or clears storage when expired or invalid. */
export function hydrateWakeTimerSnapshot(
  snapshot: WakeTimerSnapshotPayload | null,
  nowMs: number
): HydratedWakeTimerSnapshot {
  if (!snapshot) {
    return { timer: clearWakeTimer(), targetMasterVolume: null, expiredWhileClosed: false };
  }

  const timer: WakeTimerState = {
    fadeStartsAt: snapshot.fadeStartsAt,
    endsAt: snapshot.endsAt
  };

  if (shouldFinishWakeTimer(timer, nowMs)) {
    clearWakeTimerSnapshot();
    return {
      timer: clearWakeTimer(),
      targetMasterVolume: snapshot.targetMasterVolume,
      expiredWhileClosed: true
    };
  }

  return { timer, targetMasterVolume: snapshot.targetMasterVolume, expiredWhileClosed: false };
}

function parseWakeTimerSnapshotPayload(value: unknown): WakeTimerSnapshotPayload | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (record.version !== SNAPSHOT_VERSION) {
    return null;
  }

  const fadeStartsAt = parseTimestamp(record.fadeStartsAt);
  const endsAt = parseTimestamp(record.endsAt);
  const targetMasterVolume = clampNumber(record.targetMasterVolume, 0, 1);

  if (fadeStartsAt === null || endsAt === null || targetMasterVolume === null) {
    return null;
  }

  if (endsAt <= fadeStartsAt) {
    return null;
  }

  return {
    version: SNAPSHOT_VERSION,
    fadeStartsAt,
    endsAt,
    targetMasterVolume
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
