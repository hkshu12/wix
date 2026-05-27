import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import './BottomDrawer.css';

interface BottomDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function BottomDrawer({ open, title, onClose, children }: BottomDrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);

  useFocusTrap(panelRef, { active: open });

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  return (
    <>
      <button
        aria-hidden={!open}
        className={`bottom-drawer-scrim ${open ? 'open' : ''}`}
        tabIndex={-1}
        type="button"
        onClick={onClose}
      />
      <section
        ref={panelRef}
        aria-labelledby={titleId}
        aria-modal="true"
        className={`bottom-drawer ${open ? 'open' : ''}`}
        role="dialog"
      >
        <header className="bottom-drawer-header">
          <h2 id={titleId}>{title}</h2>
          <button className="bottom-drawer-close" type="button" onClick={onClose}>
            关闭
          </button>
        </header>
        <div className="bottom-drawer-body">{children}</div>
      </section>
    </>
  );
}
