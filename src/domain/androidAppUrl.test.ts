import { describe, expect, it } from 'vitest';
import { createInitialMixerState, toggleLayer } from './mixer';
import { serializeMixerShare } from './mixerShare';
import { encodeMixerShareForUrl } from './mixerShareUrl';
import {
  extractStudioShareRouteFromAppUrl,
  GITHUB_PAGES_ORIGIN,
  resolveMixerShareLinkBuildTarget
} from './androidAppUrl';
import { buildMixerShareUrl } from './mixerShareUrl';

describe('extractStudioShareRouteFromAppUrl', () => {
  const shareJson = serializeMixerShare(toggleLayer(createInitialMixerState(), 'rain'));
  const encoded = encodeMixerShareForUrl(shareJson);
  const search = `?share=${encoded}`;

  it('maps GitHub Pages studio links to in-app routes', () => {
    const url = `https://hkshu12.github.io/wix/studio${search}`;
    expect(extractStudioShareRouteFromAppUrl(url, '/wix/')).toEqual({
      pathname: '/studio',
      search
    });
  });

  it('maps Capacitor localhost studio links', () => {
    const url = `https://localhost/studio${search}`;
    expect(extractStudioShareRouteFromAppUrl(url, '/')).toEqual({
      pathname: '/studio',
      search
    });
  });

  it('ignores studio URLs without a share param', () => {
    expect(
      extractStudioShareRouteFromAppUrl('https://hkshu12.github.io/wix/studio', '/wix/')
    ).toBeNull();
  });

  it('ignores non-studio paths and other hosts', () => {
    expect(
      extractStudioShareRouteFromAppUrl(`https://hkshu12.github.io/wix/${search}`, '/wix/')
    ).toBeNull();
    expect(
      extractStudioShareRouteFromAppUrl(`https://example.com/wix/studio${search}`, '/wix/')
    ).toBeNull();
  });
});

describe('resolveMixerShareLinkBuildTarget', () => {
  it('uses the window origin on web', () => {
    expect(
      resolveMixerShareLinkBuildTarget({
        windowOrigin: 'https://hkshu12.github.io',
        appBasePath: '/wix/',
        isAndroidApp: false
      })
    ).toEqual({ origin: 'https://hkshu12.github.io', basePath: '/wix/' });
  });

  it('uses GitHub Pages origin and base on Android', () => {
    const target = resolveMixerShareLinkBuildTarget({
      windowOrigin: 'https://localhost',
      appBasePath: '/',
      isAndroidApp: true
    });

    expect(target).toEqual({ origin: GITHUB_PAGES_ORIGIN, basePath: '/wix/' });

    const url = buildMixerShareUrl({
      origin: target.origin,
      basePath: target.basePath,
      shareJson: '{}'
    });
    expect(url).toMatch(/^https:\/\/hkshu12\.github\.io\/wix\/studio\?share=/u);
  });
});
