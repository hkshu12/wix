import { describe, expect, it } from 'vitest';
import { getAdjacentMiuiScene, MIUI_SCENES } from './miuiScenes';

describe('miuiScenes', () => {
  it('cycles scenes in order', () => {
    expect(getAdjacentMiuiScene('forest', 1).id).toBe('summer-night');
    expect(getAdjacentMiuiScene('forest', -1).id).toBe('fireplace');
    expect(getAdjacentMiuiScene('fireplace', 1).id).toBe('forest');
  });

  it('defines five flagship scenes', () => {
    expect(MIUI_SCENES).toHaveLength(5);
  });
});
