export interface StudioKeyboardOverlayState {
  drawerOpen: boolean;
  navOpen: boolean;
  keyboardHelpOpen?: boolean;
}

/** Master volume step per + / − key press (0–1 scale). */
export const MASTER_VOLUME_KEYBOARD_STEP = 0.05;

/** Minimum percent change before re-announcing master volume while dragging the slider. */
export const MASTER_VOLUME_ANNOUNCE_STEP_PERCENT = 5;

export function shouldAnnounceMasterVolumePercent(
  lastAnnouncedPercent: number | null,
  nextPercent: number
): boolean {
  if (lastAnnouncedPercent === null) {
    return true;
  }

  return Math.abs(nextPercent - lastAnnouncedPercent) >= MASTER_VOLUME_ANNOUNCE_STEP_PERCENT;
}

function hasKeyboardModifier(
  event: Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'altKey'>
): boolean {
  return event.ctrlKey || event.metaKey || event.altKey;
}

function overlayBlocksStudioShortcuts(
  overlay: Pick<StudioKeyboardOverlayState, 'navOpen' | 'keyboardHelpOpen'>
): boolean {
  return overlay.navOpen || Boolean(overlay.keyboardHelpOpen);
}

export function isQuestionMarkKey(
  event: Pick<KeyboardEvent, 'key' | 'code' | 'shiftKey'>
): boolean {
  return (
    event.key === '?' ||
    (event.key === '/' && event.shiftKey) ||
    (event.code === 'Slash' && event.shiftKey)
  );
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

/** ? toggles the shortcuts help when mixer drawer and nav are closed. */
export function shouldToggleKeyboardHelp(
  event: Pick<KeyboardEvent, 'key' | 'code' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey'>,
  overlay: Pick<StudioKeyboardOverlayState, 'drawerOpen' | 'navOpen'>,
  target: EventTarget | null
): boolean {
  if (overlay.drawerOpen || overlay.navOpen) {
    return false;
  }

  if (!isQuestionMarkKey(event)) {
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

/** Space toggles playback when no overlay is open and focus is not in a text field. */
export function shouldTogglePlaybackWithSpace(
  event: Pick<KeyboardEvent, 'key' | 'code' | 'ctrlKey' | 'metaKey' | 'altKey'>,
  overlay: StudioKeyboardOverlayState,
  target: EventTarget | null
): boolean {
  if (overlay.drawerOpen || overlay.navOpen || overlay.keyboardHelpOpen) {
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

export function isMixerDrawerKey(
  event: Pick<KeyboardEvent, 'key' | 'code'>
): boolean {
  return event.key === 'm' || event.key === 'M' || event.code === 'KeyM';
}

export function isMasterVolumeUpKey(
  event: Pick<KeyboardEvent, 'key' | 'code'>
): boolean {
  return (
    event.key === '+' ||
    event.key === '=' ||
    event.code === 'Equal' ||
    event.code === 'NumpadAdd'
  );
}

export function isMasterVolumeDownKey(
  event: Pick<KeyboardEvent, 'key' | 'code'>
): boolean {
  return event.key === '-' || event.code === 'Minus' || event.code === 'NumpadSubtract';
}

export function masterVolumeDeltaFromKey(
  event: Pick<KeyboardEvent, 'key' | 'code'>
): -1 | 0 | 1 {
  if (isMasterVolumeUpKey(event)) {
    return 1;
  }

  if (isMasterVolumeDownKey(event)) {
    return -1;
  }

  return 0;
}

export function adjustMasterVolumeStep(currentVolume: number, delta: -1 | 1): number {
  const next = currentVolume + delta * MASTER_VOLUME_KEYBOARD_STEP;
  return Math.min(1, Math.max(0, next));
}

/** M toggles the mixer drawer when nav and shortcuts help are closed. */
export function shouldToggleMixerDrawer(
  event: Pick<KeyboardEvent, 'key' | 'code' | 'ctrlKey' | 'metaKey' | 'altKey'>,
  overlay: Pick<StudioKeyboardOverlayState, 'navOpen' | 'keyboardHelpOpen'>,
  target: EventTarget | null
): boolean {
  if (overlayBlocksStudioShortcuts(overlay)) {
    return false;
  }

  if (!isMixerDrawerKey(event)) {
    return false;
  }

  if (hasKeyboardModifier(event)) {
    return false;
  }

  if (isEditableKeyboardTarget(target)) {
    return false;
  }

  return true;
}

/** + / − adjust master volume when nav and shortcuts help are closed. */
export function shouldAdjustMasterVolume(
  event: Pick<KeyboardEvent, 'key' | 'code' | 'ctrlKey' | 'metaKey' | 'altKey'>,
  overlay: Pick<StudioKeyboardOverlayState, 'navOpen' | 'keyboardHelpOpen'>,
  target: EventTarget | null
): boolean {
  if (overlayBlocksStudioShortcuts(overlay)) {
    return false;
  }

  if (masterVolumeDeltaFromKey(event) === 0) {
    return false;
  }

  if (hasKeyboardModifier(event)) {
    return false;
  }

  if (isEditableKeyboardTarget(target)) {
    return false;
  }

  return true;
}
