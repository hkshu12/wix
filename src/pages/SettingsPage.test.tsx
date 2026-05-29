import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SettingsPage } from './SettingsPage';
import { StudioProvider, type StudioContextValue } from '../layout/StudioContext';
import { ThemeProvider } from '../theme/ThemeProvider';
import { createInitialMixerState } from '../domain/mixer';

function createStudioStub(overrides: Partial<StudioContextValue> = {}): StudioContextValue {
  return {
    mixer: createInitialMixerState(),
    setMixer: vi.fn(),
    customTracks: [],
    importStatus: '',
    importProgress: null,
    allSounds: [],
    selectedLayers: [],
    handleImport: vi.fn(),
    exportCustomLibrary: vi.fn().mockResolvedValue('已导出 1 个自定义音频。'),
    importCustomLibraryBackup: vi.fn().mockResolvedValue('已从备份导入 1 个自定义音频。'),
    exportMixerPresets: vi.fn().mockReturnValue('已导出 1 个场景预设。'),
    importMixerPresetsBackup: vi.fn().mockResolvedValue('已从备份恢复 1 个场景预设。'),
    exportFullAppBackup: vi.fn().mockResolvedValue('已导出完整备份（1 个自定义音频、1 个场景预设）。'),
    importFullAppBackup: vi.fn().mockResolvedValue('已从完整备份恢复 1 个自定义音频、1 个场景预设。'),
    handleDeleteCustomTrack: vi.fn(),
    handlePlayToggle: vi.fn(),
    sleepTimerRemainingLabel: '',
    sleepTimerActive: false,
    sleepTimerFading: false,
    sleepTimerFadeSeconds: 30,
    setSleepTimerFadeSeconds: vi.fn(),
    playbackFadeInSeconds: 0,
    setPlaybackFadeInSeconds: vi.fn(),
    screenWakeLockEnabled: false,
    screenWakeLockSupported: false,
    setScreenWakeLockEnabled: vi.fn(),
    startSleepTimer: vi.fn(() => true),
    cancelSleepTimer: vi.fn(),
    wakeTimerRemainingLabel: '',
    wakeTimerActive: false,
    wakeTimerFading: false,
    wakeTimerFadeSeconds: 30,
    setWakeTimerFadeSeconds: vi.fn(),
    startWakeTimer: vi.fn(() => true),
    cancelWakeTimer: vi.fn(),
    mixerPresets: [],
    saveMixerPreset: vi.fn(),
    loadMixerPreset: vi.fn(),
    renameMixerPreset: vi.fn(),
    deleteMixerPreset: vi.fn(),
    copyMixerShare: vi.fn(),
    copyMixerShareLink: vi.fn(),
    pasteMixerShareFromClipboard: vi.fn(),
    importMixerShare: vi.fn(),
    failedSoundIds: [],
    retryLayerLoad: vi.fn(),
    clearAllAppData: vi.fn().mockResolvedValue(undefined),
    primeAudioContext: vi.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

function renderSettings(studio: StudioContextValue) {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={['/settings']}>
        <StudioProvider value={studio}>
          <Routes>
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </StudioProvider>
      </MemoryRouter>
    </ThemeProvider>
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('requires confirmation before clearing all app data', async () => {
    const clearAllAppData = vi.fn().mockResolvedValue(undefined);
    renderSettings(createStudioStub({ clearAllAppData }));

    fireEvent.click(screen.getByRole('button', { name: '清除全部本机数据…' }));
    expect(clearAllAppData).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '确认清除' }));

    await waitFor(() => {
      expect(clearAllAppData).toHaveBeenCalledTimes(1);
    });
  });

  it('shows an error when clear fails', async () => {
    const clearAllAppData = vi.fn().mockRejectedValue(new Error('blocked'));
    renderSettings(createStudioStub({ clearAllAppData }));

    fireEvent.click(screen.getByRole('button', { name: '清除全部本机数据…' }));
    fireEvent.click(screen.getByRole('button', { name: '确认清除' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('清除失败');
  });

  it('exports custom library backup from settings', async () => {
    const exportCustomLibrary = vi.fn().mockResolvedValue('已导出 2 个自定义音频。');
    renderSettings(
      createStudioStub({
        exportCustomLibrary,
        customTracks: [
          {
            id: 'track-1',
            kind: 'custom',
            title: 'loop-a',
            fileName: 'loop-a.mp3',
            mimeType: 'audio/mpeg',
            size: 10,
            createdAt: 1,
            objectUrl: 'blob:track-1'
          },
          {
            id: 'track-2',
            kind: 'custom',
            title: 'loop-b',
            fileName: 'loop-b.mp3',
            mimeType: 'audio/mpeg',
            size: 20,
            createdAt: 2,
            objectUrl: 'blob:track-2'
          }
        ]
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '导出 2 个音频…' }));

    await waitFor(() => {
      expect(exportCustomLibrary).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('status')).toHaveTextContent('已导出 2 个自定义音频');
    });
  });

  it('disables export when there are no custom tracks', () => {
    renderSettings(createStudioStub({ customTracks: [] }));

    expect(screen.getByRole('button', { name: '导出 0 个音频…' })).toBeDisabled();
  });

  it('exports mixer presets from settings', () => {
    const exportMixerPresets = vi.fn().mockReturnValue('已导出 2 个场景预设。');
    renderSettings(
      createStudioStub({
        exportMixerPresets,
        mixerPresets: [
          {
            id: 'p1',
            name: '睡眠',
            createdAt: 1,
            masterVolume: 0.8,
            stereoWidth: 1,
            playbackRate: 1,
            layers: []
          },
          {
            id: 'p2',
            name: '专注',
            createdAt: 2,
            masterVolume: 0.7,
            stereoWidth: 1,
            playbackRate: 1,
            layers: []
          }
        ]
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '导出 2 个预设…' }));

    expect(exportMixerPresets).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent('已导出 2 个场景预设');
  });

  it('disables preset export when there are no presets', () => {
    renderSettings(createStudioStub({ mixerPresets: [] }));

    expect(screen.getByRole('button', { name: '导出 0 个预设…' })).toBeDisabled();
  });

  it('exports full backup when custom tracks or presets exist', async () => {
    const exportFullAppBackup = vi
      .fn()
      .mockResolvedValue('已导出完整备份（2 个自定义音频、1 个场景预设）。');
    renderSettings(
      createStudioStub({
        exportFullAppBackup,
        customTracks: [
          {
            id: 'track-1',
            kind: 'custom',
            title: 'loop-a',
            fileName: 'loop-a.mp3',
            mimeType: 'audio/mpeg',
            size: 10,
            createdAt: 1,
            objectUrl: 'blob:track-1'
          }
        ],
        mixerPresets: [
          {
            id: 'p1',
            name: '睡眠',
            createdAt: 1,
            masterVolume: 0.8,
            stereoWidth: 1,
            playbackRate: 1,
            layers: []
          }
        ]
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '导出完整备份…' }));

    await waitFor(() => {
      expect(exportFullAppBackup).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('status')).toHaveTextContent('已导出完整备份');
    });
  });

  it('disables full backup export when there is nothing to back up', () => {
    renderSettings(createStudioStub({ customTracks: [], mixerPresets: [] }));

    expect(screen.getByRole('button', { name: '导出完整备份…' })).toBeDisabled();
  });
});
