import { STORAGE_KEY_ENTERED_STUDIO } from './onboarding';
import { STORAGE_KEY_MIXER_PRESETS } from './mixerPresets';
import { STORAGE_KEY_MIXER_SNAPSHOT } from './mixerSnapshot';
import { STORAGE_KEY_PLAYBACK_FADE_IN_SECONDS } from './playbackFadeInPreferences';
import { STORAGE_KEY_SCREEN_WAKE_LOCK } from './screenWakeLockPreferences';
import { STORAGE_KEY_SLEEP_TIMER_FADE_SECONDS } from './sleepTimerPreferences';
import { STORAGE_KEY_SLEEP_TIMER_SNAPSHOT } from './sleepTimerSnapshot';
import { clearCustomLibrary, CUSTOM_LIBRARY_DATABASE_NAME } from './customLibrary';
import { STORAGE_KEY_THEME } from '../theme/resolveTheme';

/** localStorage keys cleared by {@link clearAllAppData}. */
export const APP_DATA_LOCAL_STORAGE_KEYS = [
  STORAGE_KEY_MIXER_SNAPSHOT,
  STORAGE_KEY_MIXER_PRESETS,
  STORAGE_KEY_SLEEP_TIMER_SNAPSHOT,
  STORAGE_KEY_SLEEP_TIMER_FADE_SECONDS,
  STORAGE_KEY_PLAYBACK_FADE_IN_SECONDS,
  STORAGE_KEY_SCREEN_WAKE_LOCK,
  STORAGE_KEY_ENTERED_STUDIO,
  STORAGE_KEY_THEME
] as const;

/** Removes mixer snapshots, presets, sleep timer, onboarding flag, theme, and custom audio DB. */
export async function clearAllAppData(): Promise<void> {
  for (const key of APP_DATA_LOCAL_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }

  await clearCustomLibrary(CUSTOM_LIBRARY_DATABASE_NAME);
}
