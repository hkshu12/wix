import { describe, expect, it } from 'vitest';
import { formatMediaSessionArtist, formatMediaSessionTitle } from './mediaSessionCopy';

describe('mediaSessionCopy', () => {
  it('formats title for empty, single, dual, and many tracks', () => {
    expect(formatMediaSessionTitle([])).toBe('白噪音混音器');
    expect(formatMediaSessionTitle(['雨声'])).toBe('雨声');
    expect(formatMediaSessionTitle(['雨声', '篝火'])).toBe('雨声 · 篝火');
    expect(formatMediaSessionTitle(['雨声', '篝火', '森林'])).toBe('雨声 等 3 轨');
  });

  it('formats artist with play state, track count, and sleep timer', () => {
    expect(
      formatMediaSessionArtist({ isPlaying: false, trackCount: 2, sleepTimerLabel: null })
    ).toBe('已暂停');
    expect(
      formatMediaSessionArtist({ isPlaying: true, trackCount: 0, sleepTimerLabel: null })
    ).toBe('未选择声轨');
    expect(
      formatMediaSessionArtist({ isPlaying: true, trackCount: 3, sleepTimerLabel: null })
    ).toBe('白噪音混音器 · 3 轨混音');
    expect(
      formatMediaSessionArtist({
        isPlaying: true,
        trackCount: 1,
        sleepTimerLabel: '29:59'
      })
    ).toBe('睡眠定时 · 29:59');
  });
});
