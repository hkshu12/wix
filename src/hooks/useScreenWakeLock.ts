import { useEffect, useRef } from 'react';
import { isScreenWakeLockSupported, shouldHoldScreenWakeLock } from '../domain/screenWakeLock';
import {
  releaseScreenWakeLock,
  requestScreenWakeLock,
  type WakeLockHandle
} from '../lib/screenWakeLockController';

export function useScreenWakeLock(enabled: boolean, isPlaying: boolean): void {
  const handleRef = useRef<WakeLockHandle | null>(null);
  const holdRef = useRef(false);

  useEffect(() => {
    holdRef.current = shouldHoldScreenWakeLock(enabled, isPlaying);
  }, [enabled, isPlaying]);

  useEffect(() => {
    if (!isScreenWakeLockSupported()) {
      return;
    }

    let cancelled = false;

    async function syncLock() {
      if (!holdRef.current) {
        await releaseScreenWakeLock(handleRef.current);
        handleRef.current = null;
        return;
      }

      if (handleRef.current) {
        return;
      }

      const lock = await requestScreenWakeLock(navigator);
      if (cancelled) {
        await releaseScreenWakeLock(lock);
        return;
      }

      handleRef.current = lock;
    }

    void syncLock();

    function onVisibilityChange() {
      if (document.visibilityState !== 'visible' || !holdRef.current) {
        return;
      }

      void (async () => {
        await releaseScreenWakeLock(handleRef.current);
        handleRef.current = null;
        if (!cancelled && holdRef.current) {
          handleRef.current = await requestScreenWakeLock(navigator);
        }
      })();
    }

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      void releaseScreenWakeLock(handleRef.current).then(() => {
        handleRef.current = null;
      });
    };
  }, [enabled, isPlaying]);
}
