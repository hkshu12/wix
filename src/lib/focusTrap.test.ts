import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getFocusableElements, handleFocusTrapKeyDown } from './focusTrap';

describe('focusTrap', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('lists focusable controls inside the container', () => {
    container.innerHTML = `
      <button type="button" id="first">A</button>
      <button type="button" disabled id="off">Off</button>
      <button type="button" id="last">B</button>
    `;

    const focusable = getFocusableElements(container);
    expect(focusable.map((element) => element.id)).toEqual(['first', 'last']);
  });

  it('wraps Tab from the last focusable element to the first', () => {
    container.innerHTML = `
      <button type="button" id="first">A</button>
      <button type="button" id="last">B</button>
    `;
    const first = container.querySelector<HTMLButtonElement>('#first')!;
    const last = container.querySelector<HTMLButtonElement>('#last')!;
    last.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    handleFocusTrapKeyDown(event, container);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it('wraps Shift+Tab from the first focusable element to the last', () => {
    container.innerHTML = `
      <button type="button" id="first">A</button>
      <button type="button" id="last">B</button>
    `;
    const first = container.querySelector<HTMLButtonElement>('#first')!;
    const last = container.querySelector<HTMLButtonElement>('#last')!;
    first.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    handleFocusTrapKeyDown(event, container);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
  });
});
