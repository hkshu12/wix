import { describe, expect, it } from 'vitest';
import { BUILT_IN_SOUNDS, getSoundById } from './sounds';

describe('built-in sound catalog', () => {
  it('ships the requested default ambience sounds', () => {
    expect(BUILT_IN_SOUNDS.map((sound) => sound.id)).toEqual(
      expect.arrayContaining(['campfire', 'rain', 'ocean', 'fireplace', 'fan', 'cafe', 'train', 'highway'])
    );
  });

  it('keeps sound ids unique and playable', () => {
    const ids = BUILT_IN_SOUNDS.map((sound) => sound.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(BUILT_IN_SOUNDS.every((sound) => sound.title && sound.src.startsWith('sounds/'))).toBe(true);
  });

  it('looks up built-in sounds by id', () => {
    expect(getSoundById('rain')?.title).toBe('雨声');
    expect(getSoundById('fan')?.title).toBe('风扇');
    expect(getSoundById('cafe')?.title).toBe('咖啡馆');
    expect(getSoundById('train')?.title).toBe('列车');
    expect(getSoundById('highway')?.title).toBe('公路');
    expect(getSoundById('missing')).toBeUndefined();
  });
});
