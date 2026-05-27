/** Query parameter carrying a base64url-encoded mixer share JSON payload. */
export const MIXER_SHARE_QUERY_KEY = 'share';

export function encodeMixerShareForUrl(shareJson: string): string {
  const bytes = new TextEncoder().encode(shareJson);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

export function decodeMixerShareFromUrlParam(param: string): string | null {
  const trimmed = param.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const base64 = trimmed.replace(/-/g, '+').replace(/_/g, '/');
    const padding = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padding);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export function readMixerShareFromSearch(search: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const encoded = params.get(MIXER_SHARE_QUERY_KEY);
  if (!encoded) {
    return null;
  }

  return decodeMixerShareFromUrlParam(encoded);
}

export function stripMixerShareFromSearch(search: string): string {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  params.delete(MIXER_SHARE_QUERY_KEY);
  const next = params.toString();
  return next ? `?${next}` : '';
}

export interface BuildMixerShareUrlOptions {
  origin: string;
  basePath: string;
  shareJson: string;
}

/** Builds an absolute `/studio?share=…` link respecting Vite `BASE_URL`. */
export function buildMixerShareUrl({ origin, basePath, shareJson }: BuildMixerShareUrlOptions): string {
  const base = !basePath || basePath === '/' ? '' : basePath.replace(/\/$/, '');
  const path = `${base}/studio`;
  const url = new URL(path, origin);
  url.searchParams.set(MIXER_SHARE_QUERY_KEY, encodeMixerShareForUrl(shareJson));
  return url.href;
}
