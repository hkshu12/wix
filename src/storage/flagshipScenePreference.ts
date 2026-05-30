import type { FlagshipSceneId } from '../domain/flagshipScenes';

const STORAGE_KEY = 'wix-flagship-scene-id';

const VALID_IDS: FlagshipSceneId[] = ['summer-rain', 'forest', 'fireplace', 'ocean'];

export function readFlagshipSceneId(): FlagshipSceneId | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && VALID_IDS.includes(raw as FlagshipSceneId)) {
      return raw as FlagshipSceneId;
    }
    const legacy = localStorage.getItem('wix-miui-scene-id');
    if (legacy && VALID_IDS.includes(legacy as FlagshipSceneId)) {
      return legacy as FlagshipSceneId;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function writeFlagshipSceneId(id: FlagshipSceneId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
