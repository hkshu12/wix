import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialMixerState, toggleLayer } from '../domain/mixer';
import { encodeMixerShareForUrl } from '../domain/mixerShareUrl';
import { serializeMixerShare } from '../domain/mixerShare';
import { AppRouter } from '../router/AppRouter';
import { renderWithRouter } from '../test/renderWithRouter';

const resumeMock = vi.fn().mockResolvedValue(undefined);
let mockSyncResult: { failedSoundIds: string[] } = { failedSoundIds: [] };
const syncMock = vi.fn().mockImplementation(async () => mockSyncResult);
const invalidateCachedBufferMock = vi.fn();

vi.mock('../audio/AudioEngine', () => ({
  AudioEngine: vi.fn().mockImplementation(function MockAudioEngine() {
    return {
      resume: resumeMock,
      sync: syncMock,
      invalidateCachedBuffer: invalidateCachedBufferMock,
      stop: vi.fn()
    };
  })
}));

describe('StudioPage', () => {
  beforeEach(() => {
    resumeMock.mockClear();
    syncMock.mockClear();
    invalidateCachedBufferMock.mockClear();
    mockSyncResult = { failedSoundIds: [] };
    localStorage.clear();
  });

  it('renders studio without marketing stat grid', () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    expect(screen.queryByLabelText('应用能力概览')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /雨声/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/导入自定义音乐/)).toBeInTheDocument();
  });

  it('filters sound cards by search query', () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    expect(screen.getByRole('button', { name: /雨声/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /海边/ })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('搜索环境声'), { target: { value: '雨' } });

    expect(screen.getByRole('button', { name: /雨声/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /海边/ })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('搜索环境声'), { target: { value: '不存在的关键词' } });
    expect(screen.getByText(/没有匹配/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /雨声/ })).not.toBeInTheDocument();
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

  it('announces play/pause and layer toggles in the playback status region', async () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    const status = screen.getByLabelText('混音播放状态');

    fireEvent.click(screen.getByRole('button', { name: '播放' }));
    await waitFor(() => expect(status).toHaveTextContent('已开始播放'));

    fireEvent.click(screen.getByRole('button', { name: /雨声/ }));
    await waitFor(() => expect(status).toHaveTextContent('已添加 雨声'));

    fireEvent.click(screen.getByRole('button', { name: '暂停' }));
    await waitFor(() => expect(status).toHaveTextContent('已暂停播放'));

    fireEvent.click(screen.getByRole('button', { name: /雨声/ }));
    await waitFor(() => expect(status).toHaveTextContent('已移除 雨声，混音已清空'));
  });

  it('starts a sleep timer from the mixer drawer and shows remaining time in the dock', () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    fireEvent.click(screen.getByRole('button', { name: /混音与导入/ }));
    fireEvent.click(screen.getByRole('button', { name: '30 分钟' }));

    expect(screen.getByText(/定时 · 30:00/)).toBeInTheDocument();
    expect(screen.getByText(/剩余 30:00/)).toBeInTheDocument();
  });

  it('announces sleep timer start and cancel in the playback status region', async () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    const status = screen.getByLabelText('混音播放状态');

    fireEvent.click(screen.getByRole('button', { name: /混音与导入/ }));
    fireEvent.click(screen.getByRole('button', { name: '30 分钟' }));
    await waitFor(() => expect(status).toHaveTextContent('已设置睡眠定时 30 分钟'));

    fireEvent.click(screen.getByRole('button', { name: '取消定时' }));
    await waitFor(() => expect(status).toHaveTextContent('已取消睡眠定时'));
  });

  it('saves and loads a named mixer preset from the drawer', () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    fireEvent.click(screen.getByRole('button', { name: /雨声/ }));
    fireEvent.click(screen.getByRole('button', { name: /混音与导入/ }));

    fireEvent.change(screen.getByLabelText('预设名称'), { target: { value: '雨夜专注' } });
    fireEvent.click(screen.getByRole('button', { name: '保存当前混音' }));

    expect(screen.getByText(/已保存预设「雨夜专注」/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /海边/ }));
    fireEvent.click(screen.getByRole('button', { name: '加载预设 雨夜专注' }));

    const activePanel = screen.getByLabelText('当前混音轨道');
    expect(within(activePanel).getByText('雨声')).toBeInTheDocument();
    expect(within(activePanel).queryByText('海边')).not.toBeInTheDocument();
  });

  it('imports a mix from a ?share= deep link on studio load', async () => {
    let state = createInitialMixerState();
    state = toggleLayer(state, 'rain');
    state = toggleLayer(state, 'ocean');
    const shareParam = encodeMixerShareForUrl(serializeMixerShare(state));

    renderWithRouter(<AppRouter />, {
      routerProps: { initialEntries: [`/studio?share=${shareParam}`] }
    });

    await waitFor(() => {
      expect(screen.getByText(/已导入混音（2 轨）/)).toBeInTheDocument();
    });

    const activePanel = screen.getByLabelText('当前混音轨道');
    expect(within(activePanel).getByText('雨声')).toBeInTheDocument();
    expect(within(activePanel).getByText('海边')).toBeInTheDocument();
  });

  it('imports a mixer share code from the drawer', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText, readText: vi.fn() }
    });

    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    fireEvent.click(screen.getByRole('button', { name: /雨声/ }));
    fireEvent.click(screen.getByRole('button', { name: /海边/ }));
    fireEvent.click(screen.getByRole('button', { name: /混音与导入/ }));

    fireEvent.click(screen.getByRole('button', { name: '复制分享码' }));
    expect(writeText).toHaveBeenCalled();
    const shareCodeCall = writeText.mock.calls.find((call) => {
      const text = call[0] as string;
      return text.includes('wix-mixer-share');
    });
    expect(shareCodeCall).toBeDefined();

    const shareCode = shareCodeCall?.[0] as string;
    expect(shareCode).toContain('wix-mixer-share');

    fireEvent.click(screen.getByRole('button', { name: /雨声/ }));
    fireEvent.click(screen.getByRole('button', { name: /海边/ }));

    const activePanel = screen.getByLabelText('当前混音轨道');
    expect(within(activePanel).queryByText('雨声')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('混音分享码'), { target: { value: shareCode } });
    fireEvent.click(screen.getByRole('button', { name: '导入混音' }));

    expect(screen.getByText(/已导入混音（2 轨）/)).toBeInTheDocument();
    expect(within(activePanel).getByText('雨声')).toBeInTheDocument();
    expect(within(activePanel).getByText('海边')).toBeInTheDocument();
  });

  it('toggles playback with Space when the mixer drawer is closed', async () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    await waitFor(() => expect(resumeMock).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: '暂停' })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: ' ', code: 'Space' });
    await waitFor(() => expect(screen.getByRole('button', { name: '播放' })).toBeInTheDocument());
  });

  it('does not toggle playback with Space while the mixer drawer is open', async () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    fireEvent.click(screen.getByRole('button', { name: /混音与导入/ }));
    fireEvent.keyDown(window, { key: ' ', code: 'Space' });

    expect(resumeMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '播放' })).toBeInTheDocument();
  });

  it('does not toggle playback with Space while typing in the drawer', async () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    fireEvent.click(screen.getByRole('button', { name: /混音与导入/ }));
    const presetInput = screen.getByLabelText('预设名称');
    presetInput.focus();
    fireEvent.keyDown(presetInput, { key: ' ', code: 'Space' });

    expect(resumeMock).not.toHaveBeenCalled();
  });

  it('opens keyboard shortcuts help with ? and closes with Escape', () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    expect(screen.queryByRole('dialog', { name: '键盘快捷键' })).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: '?', code: 'Slash', shiftKey: true });

    const dialog = screen.getByRole('dialog', { name: '键盘快捷键' });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/Space/)).toBeInTheDocument();

    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByRole('dialog', { name: '键盘快捷键' })).not.toBeInTheDocument();
  });

  it('does not toggle playback with Space while keyboard help is open', async () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    fireEvent.keyDown(window, { key: '?', code: 'Slash', shiftKey: true });
    fireEvent.keyDown(window, { key: ' ', code: 'Space' });

    expect(resumeMock).not.toHaveBeenCalled();
  });

  it('toggles the mixer drawer with M', () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    const drawer = screen.getByRole('dialog', { name: '混音与导入' });
    expect(drawer).not.toHaveClass('open');

    fireEvent.keyDown(window, { key: 'm', code: 'KeyM' });
    expect(drawer).toHaveClass('open');

    fireEvent.keyDown(window, { key: 'm', code: 'KeyM' });
    expect(drawer).not.toHaveClass('open');
  });

  it('adjusts master volume with + and − keys', () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    const masterSlider = screen.getByLabelText('主音量');
    expect(masterSlider).toHaveValue('82');

    fireEvent.keyDown(window, { key: '=', code: 'Equal' });
    expect(masterSlider).toHaveValue('87');

    fireEvent.keyDown(window, { key: '-', code: 'Minus' });
    expect(masterSlider).toHaveValue('82');
  });

  it('announces master volume changes from +/− keys in the playback status region', async () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    const status = screen.getByLabelText('混音播放状态');

    fireEvent.keyDown(window, { key: '=', code: 'Equal' });
    await waitFor(() => expect(status).toHaveTextContent('主音量 87%'));

    fireEvent.keyDown(window, { key: '-', code: 'Minus' });
    await waitFor(() => expect(status).toHaveTextContent('主音量 82%'));
  });

  it('does not toggle the mixer drawer with M while typing in the drawer', () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    fireEvent.click(screen.getByRole('button', { name: /混音与导入/ }));
    const presetInput = screen.getByLabelText('预设名称');
    presetInput.focus();
    fireEvent.keyDown(presetInput, { key: 'm', code: 'KeyM' });

    expect(screen.getByRole('dialog', { name: '混音与导入' })).toBeInTheDocument();
  });

  it('shows per-layer retry when a track fails to load during playback', async () => {
    mockSyncResult = { failedSoundIds: ['rain'] };

    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    fireEvent.click(screen.getByRole('button', { name: /雨声/ }));
    fireEvent.click(screen.getByRole('button', { name: '播放' }));

    fireEvent.click(screen.getByRole('button', { name: /混音与导入/ }));

    const activePanel = screen.getByLabelText('当前混音轨道');
    await waitFor(() => {
      expect(within(activePanel).getByText(/该轨道未能加载/)).toBeInTheDocument();
    });

    mockSyncResult = { failedSoundIds: [] };
    fireEvent.click(within(activePanel).getByRole('button', { name: '重试加载' }));

    await waitFor(() => expect(invalidateCachedBufferMock).toHaveBeenCalled());
    await waitFor(() => expect(syncMock.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  it('cancels an active sleep timer', () => {
    renderWithRouter(<AppRouter />, { routerProps: { initialEntries: ['/studio'] } });

    fireEvent.click(screen.getByRole('button', { name: /混音与导入/ }));
    fireEvent.click(screen.getByRole('button', { name: '15 分钟' }));
    fireEvent.click(screen.getByRole('button', { name: '取消定时' }));

    expect(screen.queryByText(/定时 ·/)).not.toBeInTheDocument();
  });
});
