import { describe, expect, it } from 'vitest';
import { getAdjacentMiuiScene, MIUI_SCENES } from './miuiScenes';

describe('miuiScenes', () => {
  it('cycles scenes in APK order (夏雨 → 森林 → 炉火 → 海洋)', () => {
    expect(getAdjacentMiuiScene('summer-rain', 1).id).toBe('forest');
    expect(getAdjacentMiuiScene('forest', 1).id).toBe('fireplace');
    expect(getAdjacentMiuiScene('fireplace', 1).id).toBe('ocean');
    expect(getAdjacentMiuiScene('ocean', 1).id).toBe('summer-rain');
    expect(getAdjacentMiuiScene('summer-rain', -1).id).toBe('ocean');
  });

  it('defines four built-in scenes from the APK', () => {
    expect(MIUI_SCENES).toHaveLength(4);
    expect(MIUI_SCENES.map((s) => s.title)).toEqual(['夏雨', '森林', '炉火', '海洋']);
  });
});
