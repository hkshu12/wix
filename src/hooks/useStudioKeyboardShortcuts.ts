import { useEffect } from 'react';
import { shouldTogglePlaybackWithSpace, type StudioKeyboardOverlayState } from '../domain/studioKeyboard';

export function useStudioKeyboardShortcuts(
  overlay: StudioKeyboardOverlayState,
  onTogglePlayback: () => void
): void {
  const { drawerOpen, navOpen } = overlay;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!shouldTogglePlaybackWithSpace(event, { drawerOpen, navOpen }, event.target)) {
        return;
      }

      event.preventDefault();
      onTogglePlayback();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, navOpen, onTogglePlayback]);
}
