import { useEffect, useRef, type RefObject } from 'react';
import { getFocusableElements, handleFocusTrapKeyDown } from '../lib/focusTrap';

interface UseFocusTrapOptions {
  active: boolean;
  onEscape?: () => void;
}

/**
 * Traps keyboard focus inside `containerRef` while `active`, restores focus on deactivate.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  { active, onEscape }: UseFocusTrapOptions,
): void {
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    const panel = containerRef.current;
    if (!panel) {
      return;
    }

    const trapRoot: HTMLElement = panel;

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusable = getFocusableElements(trapRoot);
    const initialFocus = focusable[0] ?? trapRoot;
    initialFocus.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onEscape?.();
        return;
      }
      handleFocusTrapKeyDown(event, trapRoot);
    }

    trapRoot.addEventListener('keydown', onKeyDown);

    return () => {
      trapRoot.removeEventListener('keydown', onKeyDown);
      const returnFocus = returnFocusRef.current;
      returnFocusRef.current = null;
      if (returnFocus?.isConnected) {
        returnFocus.focus();
      }
    };
  }, [active, containerRef, onEscape]);
}
