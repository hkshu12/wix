import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { BottomDrawer } from './BottomDrawer';

function DrawerHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        打开抽屉
      </button>
      <BottomDrawer open={open} title="测试抽屉" onClose={() => setOpen(false)}>
        <button type="button">抽屉内操作</button>
      </BottomDrawer>
    </>
  );
}

describe('BottomDrawer', () => {
  it('moves focus into the panel when opened', async () => {
    render(<DrawerHarness />);

    fireEvent.click(screen.getByRole('button', { name: '打开抽屉' }));

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('button', { name: '关闭' }));
    });
  });

  it('restores focus to the opener when closed with Escape', async () => {
    render(<DrawerHarness />);

    const opener = screen.getByRole('button', { name: '打开抽屉' });
    opener.focus();
    fireEvent.click(opener);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveClass('open');
    });

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).not.toHaveClass('open');
      expect(document.activeElement).toBe(opener);
    });
  });
});
