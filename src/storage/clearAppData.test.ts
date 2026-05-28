import { beforeEach, describe, expect, it } from 'vitest';
import { saveCustomTrack } from './customLibrary';
import { readMixerPresets, saveMixerPreset } from './mixerPresets';
import { readMixerSnapshot, writeMixerSnapshot } from './mixerSnapshot';
import { writeSleepTimerFadeSeconds } from './sleepTimerPreferences';
import { writeSleepTimerSnapshot } from './sleepTimerSnapshot';
import { createInitialMixerState } from '../domain/mixer';
import { startSleepTimer } from '../domain/sleepTimer';
import { markEnteredStudio } from './onboarding';
import { APP_DATA_LOCAL_STORAGE_KEYS, clearAllAppData } from './clearAppData';
import { STORAGE_KEY_THEME } from '../theme/resolveTheme';

describe('clearAllAppData', () => {
  beforeEach(async () => {
    localStorage.clear();
    await clearAllAppData();
  });

  it('removes all app localStorage keys and the custom library database', async () => {
    writeMixerSnapshot(createInitialMixerState());
    saveMixerPreset('测试', createInitialMixerState());
    writeSleepTimerFadeSeconds(60);
    const timer = startSleepTimer(Date.now(), 30, 60);
    writeSleepTimerSnapshot(timer, 0.8);
    markEnteredStudio();
    localStorage.setItem(STORAGE_KEY_THEME, 'dark');

    await saveCustomTrack(new File(['x'], 'clip.mp3', { type: 'audio/mpeg' }));

    expect(readMixerSnapshot()).not.toBeNull();
    expect(readMixerPresets()).toHaveLength(1);

    await clearAllAppData();

    for (const key of APP_DATA_LOCAL_STORAGE_KEYS) {
      expect(localStorage.getItem(key)).toBeNull();
    }
  });
});
