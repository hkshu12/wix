import { describe, expect, it } from 'vitest';
import type { PlayableSound } from '../audio/audioGraphPlan';
import { BUILT_IN_SOUNDS } from './sounds';
import { filterSoundsByQuery } from './soundSearch';

const customTrack: PlayableSound = {
  id: 'custom-abc',
  kind: 'custom',
  title: '宝宝摇篮曲',
  fileName: 'lullaby-final.mp3',
  mimeType: 'audio/mpeg',
  size: 1024,
  createdAt: 0,
  objectUrl: 'blob:mock'
};

describe('filterSoundsByQuery', () => {
  it('returns all sounds when query is empty or whitespace', () => {
    const sounds = [...BUILT_IN_SOUNDS.slice(0, 2), customTrack];
    expect(filterSoundsByQuery(sounds, '')).toEqual(sounds);
    expect(filterSoundsByQuery(sounds, '   ')).toEqual(sounds);
  });

  it('matches built-in title and subtitle case-insensitively', () => {
    const rain = BUILT_IN_SOUNDS.find((sound) => sound.id === 'rain')!;
    expect(filterSoundsByQuery(BUILT_IN_SOUNDS, '雨声')).toEqual([rain]);
    expect(filterSoundsByQuery(BUILT_IN_SOUNDS, '雨滴')).toEqual([rain]);
    expect(filterSoundsByQuery(BUILT_IN_SOUNDS, '雨夜')).toEqual(
      BUILT_IN_SOUNDS.filter((sound) => sound.id === 'thunder')
    );
    expect(filterSoundsByQuery(BUILT_IN_SOUNDS, '白噪音')).toEqual(
      BUILT_IN_SOUNDS.filter((sound) => sound.id === 'white-noise')
    );
    expect(filterSoundsByQuery(BUILT_IN_SOUNDS, 'OFFICE')).toEqual(
      BUILT_IN_SOUNDS.filter((sound) => sound.id === 'office')
    );
  });

  it('matches custom track title and file name', () => {
    expect(filterSoundsByQuery([customTrack], '摇篮')).toEqual([customTrack]);
    expect(filterSoundsByQuery([customTrack], 'lullaby')).toEqual([customTrack]);
    expect(filterSoundsByQuery([customTrack], 'zzz')).toEqual([]);
  });
});
