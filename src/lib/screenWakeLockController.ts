export type WakeLockHandle = { release: () => Promise<void> };

export interface ScreenWakeLockNavigator {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockHandle>;
  };
}

export async function requestScreenWakeLock(
  navigatorLike: ScreenWakeLockNavigator
): Promise<WakeLockHandle | null> {
  if (!navigatorLike.wakeLock) {
    return null;
  }

  try {
    return await navigatorLike.wakeLock.request('screen');
  } catch {
    return null;
  }
}

export async function releaseScreenWakeLock(handle: WakeLockHandle | null): Promise<void> {
  if (!handle) {
    return;
  }

  try {
    await handle.release();
  } catch {
    // already released
  }
}
