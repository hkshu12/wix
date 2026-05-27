import { useEffect } from 'react';
import {
  shouldToggleKeyboardHelp,
  shouldTogglePlaybackWithSpace,
  type StudioKeyboardOverlayState
} from '../domain/studioKeyboard';

export interface StudioKeyboardShortcutHandlers {
  onTogglePlayback: () => void;
  onToggleKeyboardHelp: () => void;
}

export function useStudioKeyboardShortcuts(
  overlay: StudioKeyboardOverlayState,
  handlers: StudioKeyboardShortcutHandlers
): void {
  const { drawerOpen, navOpen, keyboardHelpOpen } = overlay;
  const { onTogglePlayback, onToggleKeyboardHelp } = handlers;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (shouldToggleKeyboardHelp(event, { drawerOpen, navOpen }, event.target)) {
        event.preventDefault();
        onToggleKeyboardHelp();
        return;
      }

      if (
        !shouldTogglePlaybackWithSpace(
          event,
          { drawerOpen, navOpen, keyboardHelpOpen },
          event.target
        )
      ) {
        return;
      }

      event.preventDefault();
      onTogglePlayback();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen, keyboardHelpOpen, navOpen, onToggleKeyboardHelp, onTogglePlayback]);
}
