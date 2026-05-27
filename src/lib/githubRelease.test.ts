import { describe, expect, it } from 'vitest';
import { normalizeGithubRelease, pickAndroidApkAsset } from './githubRelease';

describe('githubRelease', () => {
  it('picks android apk asset by naming convention', () => {
    const assets = [
      { name: 'white-noise-mixer-web-v1.0.0.zip', browserDownloadUrl: 'https://example.com/web.zip', size: 1 },
      { name: 'wix-v1.4.0-android.apk', browserDownloadUrl: 'https://example.com/app.apk', size: 2 }
    ];

    expect(pickAndroidApkAsset(assets)?.name).toBe('wix-v1.4.0-android.apk');
  });

  it('marks update when release version is newer', () => {
    const release = normalizeGithubRelease(
      {
        tag_name: 'v1.4.0',
        name: 'wix v1.4.0',
        published_at: '2026-05-01T00:00:00Z',
        html_url: 'https://github.com/hkshu12/wix/releases/tag/v1.4.0',
        body: 'Fixes',
        assets: [
          {
            name: 'wix-v1.4.0-android.apk',
            browser_download_url: 'https://example.com/app.apk',
            size: 100
          }
        ]
      },
      '1.3.0'
    );

    expect(release.isUpdateAvailable).toBe(true);
    expect(release.androidApk?.name).toBe('wix-v1.4.0-android.apk');
  });
});
