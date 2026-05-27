import { describe, expect, it } from 'vitest';
import {
  PWA_DISPLAY_ORIENTATION,
  STUDIO_LANDSCAPE_COMPACT_MQ,
  STUDIO_LANDSCAPE_WIDE_MQ
} from './studioLayoutMedia';

describe('studioLayoutMedia', () => {
  it('defines landscape compact media query for short viewports', () => {
    expect(STUDIO_LANDSCAPE_COMPACT_MQ).toContain('orientation: landscape');
    expect(STUDIO_LANDSCAPE_COMPACT_MQ).toContain('max-height: 520px');
  });

  it('defines landscape wide media query for tablets', () => {
    expect(STUDIO_LANDSCAPE_WIDE_MQ).toContain('orientation: landscape');
    expect(STUDIO_LANDSCAPE_WIDE_MQ).toContain('min-width: 641px');
  });

  it('allows PWA rotation', () => {
    expect(PWA_DISPLAY_ORIENTATION).toBe('any');
  });
});
