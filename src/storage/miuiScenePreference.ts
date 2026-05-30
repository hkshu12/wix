import type { MiuiSceneId } from '../domain/miuiScenes';

const STORAGE_KEY = 'wix-miui-scene-id';

export function readMiuiSceneId(): MiuiSceneId | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (
      raw === 'forest' ||
      raw === 'summer-night' ||
      raw === 'beach' ||
      raw === 'rain' ||
      raw === 'fireplace'
    ) {
      return raw;
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
