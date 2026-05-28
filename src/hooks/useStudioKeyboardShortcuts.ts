import { useEffect } from 'react';
import {
  masterVolumeDeltaFromKey,
  shouldAdjustMasterVolume,
  shouldToggleKeyboardHelp,
  shouldToggleMixerDrawer,
  shouldTogglePlaybackWithSpace,
  type StudioKeyboardOverlayState
} from '../domain/studioKeyboard';

export interface StudioKeyboardShortcutHandlers {
  onTogglePlayback: () => void;
  onToggleKeyboardHelp: () => void;
  onToggleMixerDrawer: () => void;
  onAdjustMasterVolume: (delta: -1 | 1) => void;
}

export function useStudioKeyboardShortcuts(
  overlay: StudioKeyboardOverlayState,
  handlers: StudioKeyboardShortcutHandlers
): void {
  const { drawerOpen, navOpen, keyboardHelpOpen } = overlay;
  const { onTogglePlayback, onToggleKeyboardHelp, onToggleMixerDrawer, onAdjustMasterVolume } =
    handlers;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (shouldToggleKeyboardHelp(event, { drawerOpen, navOpen }, event.target)) {
        event.preventDefault();
        onToggleKeyboardHelp();
        return;
      }

      if (shouldToggleMixerDrawer(event, { navOpen, keyboardHelpOpen }, event.target)) {
        event.preventDefault();
        onToggleMixerDrawer();
        return;
      }

      if (shouldAdjustMasterVolume(event, { navOpen, keyboardHelpOpen }, event.target)) {
        const delta = masterVolumeDeltaFromKey(event);
        if (delta !== 0) {
          event.preventDefault();
          onAdjustMasterVolume(delta);
        }
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
  }, [
    drawerOpen,
    keyboardHelpOpen,
    navOpen,
    onAdjustMasterVolume,
    onToggleKeyboardHelp,
    onToggleMixerDrawer,
    onTogglePlayback
  ]);
}
