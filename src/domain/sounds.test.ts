import { describe, expect, it } from 'vitest';
import { BUILT_IN_SOUNDS, getSoundById } from './sounds';

describe('built-in sound catalog', () => {
  it('ships the requested default ambience sounds', () => {
    expect(BUILT_IN_SOUNDS.map((sound) => sound.id)).toEqual(
      expect.arrayContaining(['campfire', 'rain', 'ocean', 'fireplace'])
    );
  });

  it('keeps sound ids unique and playable', () => {
    const ids = BUILT_IN_SOUNDS.map((sound) => sound.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(BUILT_IN_SOUNDS.every((sound) => sound.title && sound.engine.kind)).toBe(true);
  });

  it('looks up built-in sounds by id', () => {
    expect(getSoundById('rain')?.title).toBe('雨声');
    expect(getSoundById('missing')).toBeUndefined();
  });
});
