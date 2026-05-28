export function isScreenWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

export function shouldHoldScreenWakeLock(enabled: boolean, isPlaying: boolean): boolean {
  return enabled && isPlaying;
}
