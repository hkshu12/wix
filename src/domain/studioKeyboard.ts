export interface StudioKeyboardOverlayState {
  drawerOpen: boolean;
  navOpen: boolean;
}

export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }

  if (target.isContentEditable) {
    return true;
  }

  return false;
}

/** Space toggles playback when no overlay is open and focus is not in a text field. */
export function shouldTogglePlaybackWithSpace(
  event: Pick<KeyboardEvent, 'key' | 'code' | 'ctrlKey' | 'metaKey' | 'altKey'>,
  overlay: StudioKeyboardOverlayState,
  target: EventTarget | null
): boolean {
  if (overlay.drawerOpen || overlay.navOpen) {
    return false;
  }

  if (event.key !== ' ' && event.code !== 'Space') {
    return false;
  }

  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }

  if (isEditableKeyboardTarget(target)) {
    return false;
  }

  return true;
}
