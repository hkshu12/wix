import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRouter } from '../router/AppRouter';
import { renderWithRouter } from '../test/renderWithRouter';

const resumeMock = vi.fn().mockResolvedValue(undefined);

vi.mock('../audio/AudioEngine', () => ({
  AudioEngine: vi.fn().mockImplementation(function MockAudioEngine() {
    return {
      resume: resumeMock,
      sync: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn()
    };
  })
}));

describe('StudioPage', () => {
  beforeEach(() => {
    resumeMock.mockClear();
    localStorage.clear();
  });

  it('renders studio without marketing stat grid', () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    expect(screen.queryByLabelText('应用能力概览')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /雨声/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/导入自定义音乐/)).toBeInTheDocument();
  });

  it('selects multiple sounds and exposes per-layer volume controls in the mixer drawer', () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    fireEvent.click(screen.getByRole('button', { name: /雨声/ }));
    fireEvent.click(screen.getByRole('button', { name: /海边/ }));
    fireEvent.click(screen.getByRole('button', { name: /混音与导入/ }));

    const activePanel = screen.getByLabelText('当前混音轨道');

    expect(within(activePanel).getByText('雨声')).toBeInTheDocument();
    expect(within(activePanel).getByText('海边')).toBeInTheDocument();
    expect(within(activePanel).getByLabelText('雨声音量')).toHaveValue('65');
    expect(within(activePanel).getByLabelText('海边音量')).toHaveValue('65');
  });

  it('unlocks audio from the play button user gesture', async () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    fireEvent.click(screen.getByRole('button', { name: '播放' }));

    await waitFor(() => expect(resumeMock).toHaveBeenCalledTimes(1));
  });
});
