import type { MiuiSceneId } from '../domain/miuiScenes';

const STORAGE_KEY = 'wix-miui-scene-id';

const VALID_IDS: MiuiSceneId[] = ['summer-rain', 'forest', 'fireplace', 'ocean'];

export function readMiuiSceneId(): MiuiSceneId | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && VALID_IDS.includes(raw as MiuiSceneId)) {
      return raw as MiuiSceneId;
    }
    // Migrate older builds that stored promo-page scene ids.
    if (raw === 'rain') {
      return 'summer-rain';
    }
    if (raw === 'beach') {
      return 'ocean';
    }
    if (raw === 'summer-night') {
      return 'summer-rain';
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function writeMiuiSceneId(id: MiuiSceneId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
