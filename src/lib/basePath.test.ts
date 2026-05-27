import { describe, expect, it } from 'vitest';
import { joinBasePath, pwaScopeFromBase } from './basePath';

describe('joinBasePath', () => {
  it('keeps root paths when base is /', () => {
    expect(joinBasePath('/', 'icon-192.png')).toBe('/icon-192.png');
    expect(joinBasePath('/', '/icon.svg')).toBe('/icon.svg');
  });

  it('prefixes paths with a GitHub Pages subpath', () => {
    expect(joinBasePath('/wix/', 'icon-192.png')).toBe('/wix/icon-192.png');
    expect(joinBasePath('/wix', 'icon.svg')).toBe('/wix/icon.svg');
  });
});

describe('pwaScopeFromBase', () => {
  it('uses / for site root deployments', () => {
    expect(pwaScopeFromBase('/')).toEqual({ start_url: '/', scope: '/' });
  });

  it('uses trailing slash scope for subdirectory deployments', () => {
    expect(pwaScopeFromBase('/wix/')).toEqual({ start_url: '/wix/', scope: '/wix/' });
    expect(pwaScopeFromBase('/wix')).toEqual({ start_url: '/wix/', scope: '/wix/' });
  });
});
