import { describe, expect, it } from 'vitest';
import { getAdjacentFlagshipScene, FLAGSHIP_SCENES } from './flagshipScenes';

describe('flagshipScenes', () => {
  it('cycles scenes in catalog order (夏雨 → 森林 → 炉火 → 海洋)', () => {
    expect(getAdjacentFlagshipScene('summer-rain', 1).id).toBe('forest');
    expect(getAdjacentFlagshipScene('forest', 1).id).toBe('fireplace');
    expect(getAdjacentFlagshipScene('fireplace', 1).id).toBe('ocean');
    expect(getAdjacentFlagshipScene('ocean', 1).id).toBe('summer-rain');
    expect(getAdjacentFlagshipScene('summer-rain', -1).id).toBe('ocean');
  });

  it('defines four curated immersive scenes', () => {
    expect(FLAGSHIP_SCENES).toHaveLength(4);
    expect(FLAGSHIP_SCENES.map((s) => s.title)).toEqual(['夏雨', '森林', '炉火', '海洋']);
  });
});
