export const STORAGE_KEY_SCREEN_WAKE_LOCK = 'wix.screenWakeLockWhilePlaying';

export function readScreenWakeLockEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_SCREEN_WAKE_LOCK) === '1';
  } catch {
    return false;
  }
}

export function writeScreenWakeLockEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY_SCREEN_WAKE_LOCK, enabled ? '1' : '0');
}
