import { useEffect, useId, type ReactNode } from 'react';
import './BottomDrawer.css';

interface BottomDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function BottomDrawer({ open, title, onClose, children }: BottomDrawerProps) {
  const titleId = useId();

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
        tabIndex={open ? 0 : -1}
        type="button"
        onClick={onClose}
      />
      <section
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
