import { describe, expect, it, vi } from 'vitest';
import { formatFileReadPercent, readFileAsArrayBuffer } from './readFileWithProgress';

describe('readFileWithProgress', () => {
  it('formats loaded/total as a capped percentage', () => {
    expect(formatFileReadPercent({ loaded: 0, total: 100 })).toBe(0);
    expect(formatFileReadPercent({ loaded: 50, total: 200 })).toBe(25);
    expect(formatFileReadPercent({ loaded: 200, total: 200 })).toBe(100);
    expect(formatFileReadPercent({ loaded: 999, total: 100 })).toBe(100);
    expect(formatFileReadPercent({ loaded: 10, total: 0 })).toBe(0);
  });

  it('reads file bytes and reports progress', async () => {
    const onProgress = vi.fn();
    const file = new File(['hello'], 'clip.mp3', { type: 'audio/mpeg' });

    const bytes = await readFileAsArrayBuffer(file, onProgress);

    expect(new TextDecoder().decode(bytes)).toBe('hello');
    expect(onProgress).toHaveBeenCalled();
    const last = onProgress.mock.calls.at(-1)?.[0];
    expect(last?.loaded).toBeGreaterThan(0);
    expect(last?.total).toBeGreaterThan(0);
  });
});
