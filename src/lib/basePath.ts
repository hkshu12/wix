/** Join Vite `base` with a site-root-relative asset path for PWA manifest entries. */
export function joinBasePath(base: string, path: string): string {
  const normalizedPath = path.replace(/^\//, '');

  if (!base || base === '/') {
    return `/${normalizedPath}`;
  }

  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${normalizedPath}`;
}

/** PWA `start_url` and `scope` must match the deployed base path (e.g. GitHub Pages subpath). */
export function pwaScopeFromBase(base: string): { start_url: string; scope: string } {
  const scope = !base || base === '/' ? '/' : base.endsWith('/') ? base : `${base}/`;

  return { start_url: scope, scope };
}
