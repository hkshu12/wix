import { describe, expect, it } from 'vitest';
import { createInitialMixerState, toggleLayer } from './mixer';
import {
  buildMixerShareUrl,
  decodeMixerShareFromUrlParam,
  encodeMixerShareForUrl,
  readMixerShareFromSearch,
  stripMixerShareFromSearch
} from './mixerShareUrl';
import { parseMixerShare, serializeMixerShare } from './mixerShare';

describe('mixerShareUrl', () => {
  it('round-trips share JSON through base64url', () => {
    let state = createInitialMixerState();
    state = toggleLayer(state, 'rain');
    const json = serializeMixerShare(state);
    const encoded = encodeMixerShareForUrl(json);
    const decoded = decodeMixerShareFromUrlParam(encoded);

    expect(decoded).toBe(json);
    expect(parseMixerShare(decoded ?? '').ok).toBe(true);
  });

  it('reads and strips the share query parameter', () => {
    const json = serializeMixerShare(createInitialMixerState());
    const encoded = encodeMixerShareForUrl(json);
    const search = `?share=${encoded}&utm=1`;

    expect(readMixerShareFromSearch(search)).toBe(json);
    expect(stripMixerShareFromSearch(search)).toBe('?utm=1');
    expect(stripMixerShareFromSearch(`?share=${encoded}`)).toBe('');
  });

  it('builds studio URLs with optional GitHub Pages base path', () => {
    const json = serializeMixerShare(createInitialMixerState());
    const url = buildMixerShareUrl({
      origin: 'https://hkshu12.github.io',
      basePath: '/wix/',
      shareJson: json
    });

    expect(url).toMatch(/^https:\/\/hkshu12\.github\.io\/wix\/studio\?share=/u);
    const param = new URL(url).searchParams.get('share');
    expect(decodeMixerShareFromUrlParam(param ?? '')).toBe(json);
  });

  it('returns null for invalid encoded payloads', () => {
    expect(decodeMixerShareFromUrlParam('not-valid-base64!!!')).toBeNull();
    expect(readMixerShareFromSearch('?share=')).toBeNull();
  });
});
