import { describe, expect, it } from 'vitest';
import {
  isEditableKeyboardTarget,
  isQuestionMarkKey,
  shouldToggleKeyboardHelp,
  shouldTogglePlaybackWithSpace
} from './studioKeyboard';

function spaceEvent(overrides: Partial<KeyboardEvent> = {}): Pick<KeyboardEvent, 'key' | 'code' | 'ctrlKey' | 'metaKey' | 'altKey'> {
  return {
    key: ' ',
    code: 'Space',
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    ...overrides
  };
}

describe('studioKeyboard', () => {
  it('detects editable targets', () => {
    const input = document.createElement('input');
    const button = document.createElement('button');

    expect(isEditableKeyboardTarget(input)).toBe(true);
    expect(isEditableKeyboardTarget(button)).toBe(false);
  });

  it('allows Space when overlays are closed', () => {
    expect(
      shouldTogglePlaybackWithSpace(spaceEvent(), { drawerOpen: false, navOpen: false }, document.body)
    ).toBe(true);
  });

  it('blocks Space when drawer or nav is open', () => {
    expect(
      shouldTogglePlaybackWithSpace(spaceEvent(), { drawerOpen: true, navOpen: false }, document.body)
    ).toBe(false);
    expect(
      shouldTogglePlaybackWithSpace(spaceEvent(), { drawerOpen: false, navOpen: true }, document.body)
    ).toBe(false);
  });

  it('blocks Space in text fields and with modifiers', () => {
    const input = document.createElement('input');

    expect(
      shouldTogglePlaybackWithSpace(spaceEvent(), { drawerOpen: false, navOpen: false }, input)
    ).toBe(false);
    expect(
      shouldTogglePlaybackWithSpace(
        spaceEvent({ ctrlKey: true }),
        { drawerOpen: false, navOpen: false },
        document.body
      )
    ).toBe(false);
  });

  it('ignores non-Space keys', () => {
    expect(
      shouldTogglePlaybackWithSpace(
        spaceEvent({ key: 'Enter', code: 'Enter' }),
        { drawerOpen: false, navOpen: false },
        document.body
      )
    ).toBe(false);
  });

  it('blocks Space while keyboard help is open', () => {
    expect(
      shouldTogglePlaybackWithSpace(spaceEvent(), { drawerOpen: false, navOpen: false, keyboardHelpOpen: true }, document.body)
    ).toBe(false);
  });

  it('detects question mark keys', () => {
    expect(isQuestionMarkKey({ key: '?', code: 'Slash', shiftKey: true })).toBe(true);
    expect(isQuestionMarkKey({ key: '/', code: 'Slash', shiftKey: true })).toBe(true);
    expect(isQuestionMarkKey({ key: '/', code: 'Slash', shiftKey: false })).toBe(false);
  });

  it('allows ? to toggle help when overlays are closed', () => {
    expect(
      shouldToggleKeyboardHelp(
        { key: '?', code: 'Slash', shiftKey: true, ctrlKey: false, metaKey: false, altKey: false },
        { drawerOpen: false, navOpen: false },
        document.body
      )
    ).toBe(true);
  });

  it('blocks ? when drawer or nav is open or focus is in a text field', () => {
    const input = document.createElement('input');

    expect(
      shouldToggleKeyboardHelp(
        { key: '?', code: 'Slash', shiftKey: true, ctrlKey: false, metaKey: false, altKey: false },
        { drawerOpen: true, navOpen: false },
        document.body
      )
    ).toBe(false);
    expect(
      shouldToggleKeyboardHelp(
        { key: '?', code: 'Slash', shiftKey: true, ctrlKey: false, metaKey: false, altKey: false },
        { drawerOpen: false, navOpen: false },
        input
      )
    ).toBe(false);
  });
});
