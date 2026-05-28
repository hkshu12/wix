import { useEffect, useId, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import './KeyboardShortcutsDialog.css';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: 'Space', description: '播放或暂停（混音抽屉与 Android 菜单关闭时）' },
  { keys: 'M', description: '打开或关闭混音抽屉（Android 菜单与快捷键说明关闭时）' },
  { keys: '+ / −', description: '主音量每次 ±5%（在输入框内输入时不生效）' },
  { keys: '?', description: '打开或关闭本说明' },
  { keys: 'Esc', description: '关闭本说明或混音抽屉' }
];

export function KeyboardShortcutsDialog({ open, onClose }: KeyboardShortcutsDialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);

  useFocusTrap(panelRef, { active: open, onEscape: onClose });

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <>
      <button
        aria-hidden={!open}
        className="keyboard-shortcuts-scrim open"
        tabIndex={-1}
        type="button"
        onClick={onClose}
      />
      <section
        ref={panelRef}
        aria-labelledby={titleId}
        aria-modal="true"
        className="keyboard-shortcuts-dialog open"
        role="dialog"
      >
        <header className="keyboard-shortcuts-header">
          <h2 id={titleId}>键盘快捷键</h2>
          <button className="keyboard-shortcuts-close" type="button" onClick={onClose}>
            关闭
          </button>
        </header>
        <ul className="keyboard-shortcuts-list">
          {SHORTCUTS.map((item) => (
            <li key={item.keys}>
              <kbd>{item.keys}</kbd>
              <span>{item.description}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
