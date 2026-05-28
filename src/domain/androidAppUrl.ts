import { readMixerShareFromSearch } from './mixerShareUrl';

export interface StudioShareRoute {
  pathname: '/studio';
  search: string;
}

/** Hostnames that may open the Android app via VIEW intents (GitHub Pages + Capacitor dev). */
export const ANDROID_MIXER_SHARE_HOSTS = ['hkshu12.github.io', 'localhost'] as const;

function normalizeBasePath(basePath: string): string {
  if (!basePath || basePath === '/') {
    return '';
  }

  return basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
}

/** Public origin for mixer share links copied from the Android APK. */
export const GITHUB_PAGES_ORIGIN = 'https://hkshu12.github.io';

/** GitHub Pages deploy path when the APK was built with `BASE_URL=/`. */
export const GITHUB_PAGES_REPO_BASE = '/wix';

export interface MixerShareLinkBuildTarget {
  origin: string;
  basePath: string;
}

/**
 * Android serves the WebView from `https://localhost`; share links must use the
 * GitHub Pages origin and `/wix` base so friends can open them in a browser or app.
 */
export function resolveMixerShareLinkBuildTarget(options: {
  windowOrigin: string;
  appBasePath: string;
  isAndroidApp: boolean;
}): MixerShareLinkBuildTarget {
  if (!options.isAndroidApp) {
    return { origin: options.windowOrigin, basePath: options.appBasePath };
  }

  return {
    origin: GITHUB_PAGES_ORIGIN,
    basePath: `${GITHUB_PAGES_REPO_BASE}/`
  };
}

function isStudioPath(pathname: string, basePath: string): boolean {
  const normalized = pathname.replace(/\/$/, '') || '/';
  const base = normalizeBasePath(basePath);
  const candidates = new Set<string>([
    '/studio',
    `${base}/studio`.replace(/\/+/g, '/'),
    `${GITHUB_PAGES_REPO_BASE}/studio`
  ]);

  return candidates.has(normalized);
}

/**
 * Maps an external app URL (https GitHub Pages link or Capacitor localhost) to the
 * in-app React Router location when it carries a mixer `share` query param.
 */
export function extractStudioShareRouteFromAppUrl(
  rawUrl: string,
  basePath: string = import.meta.env.BASE_URL
): StudioShareRoute | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return null;
  }

  if (!ANDROID_MIXER_SHARE_HOSTS.includes(url.hostname as (typeof ANDROID_MIXER_SHARE_HOSTS)[number])) {
    return null;
  }

  if (!isStudioPath(url.pathname, basePath)) {
    return null;
  }

  const shareJson = readMixerShareFromSearch(url.search);
  if (!shareJson) {
    return null;
  }

  const search = url.search.startsWith('?') ? url.search : `?${url.search}`;
  return { pathname: '/studio', search };
}
