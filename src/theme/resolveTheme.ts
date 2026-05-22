export type ThemePreference = 'system' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

export const STORAGE_KEY_THEME = 'wix.themePreference';

export function readThemePreference(): ThemePreference {
  const raw = localStorage.getItem(STORAGE_KEY_THEME);
  if (raw === 'light' || raw === 'dark' || raw === 'system') {
    return raw;
  }
  return 'system';
}

export function resolveEffectiveTheme(
  preference: ThemePreference,
  prefersDark: boolean
): EffectiveTheme {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return prefersDark ? 'dark' : 'light';
}
