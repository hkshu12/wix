import { act, renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useFocusTrap } from './useFocusTrap';

describe('useFocusTrap', () => {
  let container: HTMLElement;
  let outsideButton: HTMLButtonElement;

  beforeEach(() => {
    outsideButton = document.createElement('button');
    outsideButton.type = 'button';
    outsideButton.textContent = '外部';
    document.body.appendChild(outsideButton);

    container = document.createElement('section');
    container.innerHTML = `
      <button type="button" id="first">首</button>
      <button type="button" id="last">尾</button>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    outsideButton.remove();
    container.remove();
  });

  it('wraps Tab while active', () => {
    const containerRef = createRef<HTMLElement>();
    containerRef.current = container;

    const { rerender } = renderHook(
      ({ active }) => useFocusTrap(containerRef, { active }),
      { initialProps: { active: false } },
    );

    outsideButton.focus();
    rerender({ active: true });

    const first = container.querySelector<HTMLButtonElement>('#first')!;
    const last = container.querySelector<HTMLButtonElement>('#last')!;

    expect(document.activeElement).toBe(first);

    act(() => {
      last.focus();
      container.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
      );
    });

    expect(document.activeElement).toBe(first);
  });

  it('returns focus to the previously focused element when deactivated', () => {
    const containerRef = createRef<HTMLElement>();
    containerRef.current = container;

    const { rerender, unmount } = renderHook(
      ({ active }) => useFocusTrap(containerRef, { active }),
      { initialProps: { active: false } },
    );

    outsideButton.focus();
    rerender({ active: true });
    rerender({ active: false });

    expect(document.activeElement).toBe(outsideButton);

    unmount();
  });
});
