import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const resumeMock = vi.fn().mockResolvedValue(undefined);

vi.mock('./audio/AudioEngine', () => ({
  AudioEngine: vi.fn().mockImplementation(function MockAudioEngine() {
    return {
      resume: resumeMock,
      sync: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn()
    };
  })
}));

describe('App', () => {
  beforeEach(() => {
    resumeMock.mockClear();
  });

  it('renders the white-noise mixer shell and default ambience catalog', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /白噪音混音器/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /开始播放/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /雨声/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /篝火/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/导入自定义音乐/)).toBeInTheDocument();
  });

  it('selects multiple sounds and exposes per-layer volume controls', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /雨声/ }));
    fireEvent.click(screen.getByRole('button', { name: /海边/ }));

    const activePanel = screen.getByLabelText('当前混音轨道');

    expect(within(activePanel).getByText('雨声')).toBeInTheDocument();
    expect(within(activePanel).getByText('海边')).toBeInTheDocument();
    expect(within(activePanel).getByLabelText('雨声音量')).toHaveValue('65');
    expect(within(activePanel).getByLabelText('海边音量')).toHaveValue('65');
  });

  it('unlocks audio from the play button user gesture', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /开始播放/ }));

    await waitFor(() => expect(resumeMock).toHaveBeenCalledTimes(1));
  });
});
