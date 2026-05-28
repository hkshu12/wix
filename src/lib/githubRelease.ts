import { isNewerVersion } from './semver';
import { APP_VERSION, GITHUB_LATEST_RELEASE_API, githubApiHeaders } from './appMeta';
import { formatNetworkError } from './networkError';

export interface ReleaseAsset {
  name: string;
  browserDownloadUrl: string;
  size: number;
}

export interface LatestReleaseInfo {
  tagName: string;
  version: string;
  name: string;
  publishedAt: string;
  htmlUrl: string;
  releaseNotes: string;
  androidApk: ReleaseAsset | null;
  isUpdateAvailable: boolean;
}

interface GithubReleasePayload {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  body: string | null;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
  }>;
}

const ANDROID_APK_PATTERN = /^wix-v\d+\.\d+\.\d+-android\.apk$/i;

export function pickAndroidApkAsset(assets: ReleaseAsset[]): ReleaseAsset | null {
  return assets.find((asset) => ANDROID_APK_PATTERN.test(asset.name)) ?? null;
}

export function normalizeGithubRelease(payload: GithubReleasePayload, currentVersion = APP_VERSION): LatestReleaseInfo {
  const version = payload.tag_name.replace(/^v/i, '');
  const assets: ReleaseAsset[] = payload.assets.map((asset) => ({
    name: asset.name,
    browserDownloadUrl: asset.browser_download_url,
    size: asset.size
  }));

  const androidApk = pickAndroidApkAsset(assets);

  return {
    tagName: payload.tag_name,
    version,
    name: payload.name,
    publishedAt: payload.published_at,
    htmlUrl: payload.html_url,
    releaseNotes: payload.body?.trim() ?? '',
    androidApk,
    isUpdateAvailable: isNewerVersion(version, currentVersion)
  };
}

export async function fetchLatestRelease(currentVersion = APP_VERSION): Promise<LatestReleaseInfo> {
  let response: Response;

  try {
    response = await fetch(GITHUB_LATEST_RELEASE_API, {
      headers: githubApiHeaders()
    });
  } catch (error) {
    if (error instanceof Error) {
      error.message = formatNetworkError(error, '无法获取版本信息');
      throw error;
    }
    throw new Error(formatNetworkError(error, '无法获取版本信息'), { cause: error });
  }

  if (!response.ok) {
    throw new Error(`无法获取版本信息（${response.status}）`);
  }

  const payload = (await response.json()) as GithubReleasePayload;
  return normalizeGithubRelease(payload, currentVersion);
}
