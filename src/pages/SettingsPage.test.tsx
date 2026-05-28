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
    mixerPresets: [],
    saveMixerPreset: vi.fn(),
    loadMixerPreset: vi.fn(),
    deleteMixerPreset: vi.fn(),
    copyMixerShare: vi.fn(),
    copyMixerShareLink: vi.fn(),
    pasteMixerShareFromClipboard: vi.fn(),
    importMixerShare: vi.fn(),
    failedSoundIds: [],
    retryLayerLoad: vi.fn(),
    clearAllAppData: vi.fn().mockResolvedValue(undefined),
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
});
