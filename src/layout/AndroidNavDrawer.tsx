import { useEffect, useId } from 'react';
import { Link } from 'react-router-dom';
import { AppMenuNav } from './AppMenuNav';
import { ThemeToggle } from '../theme/ThemeToggle';
import { APP_DISPLAY_NAME } from '../lib/appMeta';
import './AndroidNavDrawer.css';

interface AndroidNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function AndroidNavDrawer({ open, onClose }: AndroidNavDrawerProps) {
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
        className={`android-nav-scrim ${open ? 'open' : ''}`}
        tabIndex={open ? 0 : -1}
        type="button"
        onClick={onClose}
      />
      <aside
        aria-labelledby={titleId}
        aria-modal="true"
        className={`android-nav-drawer ${open ? 'open' : ''}`}
        role="dialog"
      >
        <header className="android-nav-drawer__header">
          <div>
            <h2 id={titleId}>{APP_DISPLAY_NAME}</h2>
            <p>应用菜单</p>
          </div>
          <button className="android-nav-drawer__close" type="button" onClick={onClose}>
            关闭
          </button>
        </header>
        <AppMenuNav variant="drawer" onNavigate={onClose} />
        <footer className="android-nav-drawer__footer">
          <ThemeToggle />
          <Link className="android-nav-drawer__studio-link" to="/studio" onClick={onClose}>
            返回混音台
          </Link>
        </footer>
      </aside>
    </>
  );
}
