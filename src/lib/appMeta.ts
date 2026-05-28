import { App } from '@capacitor/app';
import { isAndroidApp } from './platform';

export const APP_DISPLAY_NAME = '白噪音混音器';
/** ASCII identifier for HTTP headers (must be ISO-8859-1; display name is not). */
export const APP_USER_AGENT_SLUG = 'white-noise-mixer';
export const GITHUB_REPO = __GITHUB_REPO__;
export const APP_VERSION = __APP_VERSION__;
export const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;
export const GITHUB_LATEST_RELEASE_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export function githubApiHeaders(): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': `${APP_USER_AGENT_SLUG}/${APP_VERSION}`
  };
}

export interface AppVersionInfo {
  version: string;
  build?: string;
  platformLabel: string;
}

export async function getAppVersionInfo(): Promise<AppVersionInfo> {
  if (isAndroidApp()) {
    try {
      const info = await App.getInfo();
      return {
        version: info.version,
        build: info.build,
        platformLabel: 'Android 应用'
      };
    } catch {
      return {
        version: APP_VERSION,
        platformLabel: 'Android 应用'
      };
    }
  }

  return {
    version: APP_VERSION,
    platformLabel: 'Web / PWA'
  };
}
