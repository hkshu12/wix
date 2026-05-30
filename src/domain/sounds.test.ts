import { describe, expect, it } from 'vitest';
import { BUILT_IN_SOUNDS, getSoundById } from './sounds';

describe('built-in sound catalog', () => {
  it('ships studio ambience loops and focus noise presets', () => {
    expect(BUILT_IN_SOUNDS.map((sound) => sound.id)).toEqual(
      expect.arrayContaining([
        'rain',
        'summer-rain',
        'river',
        'ocean',
        'ocean-near',
        'fireplace',
        'forest',
        'stream',
        'fan',
        'cafe',
        'train',
        'highway',
        'airplane',
        'office',
        'construction-site',
        'white-noise'
      ])
    );
  });

  it('keeps sound ids unique and playable', () => {
    const ids = BUILT_IN_SOUNDS.map((sound) => sound.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(
      BUILT_IN_SOUNDS.every(
        (sound) => sound.title && (sound.src.startsWith('sounds/studio/') || sound.src.startsWith('sounds/'))
      )
    ).toBe(true);
  });

  it('looks up built-in sounds by id', () => {
    expect(getSoundById('rain')?.title).toBe('雨声');
    expect(getSoundById('rain')?.src).toBe('sounds/studio/summer-rain.mp3');
    expect(getSoundById('fan')?.title).toBe('风扇');
    expect(getSoundById('cafe')?.title).toBe('咖啡馆');
    expect(getSoundById('train')?.title).toBe('列车');
    expect(getSoundById('highway')?.title).toBe('公路');
    expect(getSoundById('airplane')?.title).toBe('飞机舱');
    expect(getSoundById('office')?.title).toBe('办公室');
    expect(getSoundById('construction-site')?.title).toBe('工地');
    expect(getSoundById('white-noise')?.title).toBe('白噪音');
    expect(getSoundById('stream')?.title).toBe('溪流');
    expect(getSoundById('missing')).toBeUndefined();
  });
});
