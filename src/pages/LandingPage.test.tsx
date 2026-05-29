import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppRouter } from '../router/AppRouter';
import { getHasEnteredStudio } from '../storage/onboarding';
import { renderWithRouter } from '../test/renderWithRouter';

vi.mock('../audio/AudioEngine', () => ({
  AudioEngine: vi.fn().mockImplementation(function MockAudioEngine() {
    return {
      resume: vi.fn().mockResolvedValue(undefined),
      sync: vi.fn().mockResolvedValue({ failedSoundIds: [] }),
      stop: vi.fn(),
      invalidateCachedBuffer: vi.fn()
    };
  })
}));

describe('LandingPage', () => {
  it('lists current studio capabilities in features', () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/'] } });

    const features = screen.getByRole('region', { name: '能做什么' });

    expect(features).toHaveTextContent(/睡眠与唤醒定时（5–480 分钟）/);
    expect(features).toHaveTextContent(/十六种内置环境声/);
    expect(features).toHaveTextContent(/白噪音/);
    expect(features).toHaveTextContent(/工地/);
    expect(features).toHaveTextContent(/搜索框/);
    expect(features).toHaveTextContent(/播放渐入/);
    expect(features).toHaveTextContent(/飞机舱/);
    expect(features).toHaveTextContent(/公路/);
    expect(features).toHaveTextContent(/列车/);
    expect(features).toHaveTextContent(/咖啡馆/);
    expect(features).toHaveTextContent(/命名场景预设/);
    expect(features).toHaveTextContent(/刷新后自动恢复/);
    expect(features).toHaveTextContent(/自动继续播放/);
    expect(features).toHaveTextContent(/\?share=/);
    expect(features).toHaveTextContent(/键盘快捷键/);
    expect(features).toHaveTextContent(/锁屏/);
  });

  it('marks entered studio and navigates on 开始使用', async () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/'] } });

    fireEvent.click(screen.getAllByRole('button', { name: '开始使用' })[0]);

    await waitFor(() => expect(screen.getByRole('button', { name: /雨声/ })).toBeInTheDocument());
    expect(getHasEnteredStudio()).toBe(true);
  });
});
