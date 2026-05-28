import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import type { LatestReleaseInfo } from './githubRelease';
import { formatNetworkError } from './networkError';
import { ApkInstaller } from '../plugins/apkInstaller';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function apkFilePath(version: string): string {
  return `updates/wix-${version}.apk`;
}

async function resolveDownloadedApkUri(path: string): Promise<string> {
  const { uri } = await Filesystem.getUri({
    path,
    directory: Directory.Cache
  });
  return uri;
}

async function downloadApkWithFilesystem(
  release: LatestReleaseInfo,
  onProgress?: (loadedBytes: number, totalBytes: number) => void
): Promise<string> {
  const asset = release.androidApk;
  if (!asset) {
    throw new Error('当前发布未包含 Android APK 安装包');
  }

  const path = apkFilePath(release.version);
  const progressListener = await Filesystem.addListener('progress', (status) => {
    if (status.url === asset.browserDownloadUrl) {
      onProgress?.(status.bytes, status.contentLength);
    }
  });

  try {
    await Filesystem.downloadFile({
      url: asset.browserDownloadUrl,
      path,
      directory: Directory.Cache,
      progress: true,
      recursive: true
    });
  } catch (error) {
    if (error instanceof Error) {
      error.message = formatNetworkError(error, '下载更新包失败');
      throw error;
    }
    throw new Error(formatNetworkError(error, '下载更新包失败'), { cause: error });
  } finally {
    await progressListener.remove();
  }

  return resolveDownloadedApkUri(path);
}

async function downloadApkWithFetch(
  release: LatestReleaseInfo,
  onProgress?: (loadedBytes: number, totalBytes: number) => void
): Promise<string> {
  const asset = release.androidApk;
  if (!asset) {
    throw new Error('当前发布未包含 Android APK 安装包');
  }

  let response: Response;

  try {
    response = await fetch(asset.browserDownloadUrl);
  } catch (error) {
    if (error instanceof Error) {
      error.message = formatNetworkError(error, '下载更新包失败');
      throw error;
    }
    throw new Error(formatNetworkError(error, '下载更新包失败'), { cause: error });
  }

  if (!response.ok) {
    throw new Error(`下载失败（${response.status}）`);
  }

  const totalBytes = Number(response.headers.get('content-length') ?? asset.size) || asset.size;
  const reader = response.body?.getReader();
  if (!reader) {
    const buffer = await response.arrayBuffer();
    onProgress?.(buffer.byteLength, totalBytes);
    const base64 = arrayBufferToBase64(buffer);
    const path = apkFilePath(release.version);
    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Cache
    });
    return resolveDownloadedApkUri(path);
  }

  const chunks: Uint8Array[] = [];
  let loadedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (value) {
      chunks.push(value);
      loadedBytes += value.length;
      onProgress?.(loadedBytes, totalBytes);
    }
  }

  const merged = new Uint8Array(loadedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  const base64 = arrayBufferToBase64(merged.buffer);
  const path = apkFilePath(release.version);
  await Filesystem.writeFile({
    path,
    data: base64,
    directory: Directory.Cache
  });

  return resolveDownloadedApkUri(path);
}

export async function downloadAndroidApk(
  release: LatestReleaseInfo,
  onProgress?: (loadedBytes: number, totalBytes: number) => void
): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    return downloadApkWithFilesystem(release, onProgress);
  }

  return downloadApkWithFetch(release, onProgress);
}

export async function ensureInstallPermission(): Promise<boolean> {
  const { allowed } = await ApkInstaller.canInstall();
  if (allowed) {
    return true;
  }

  await ApkInstaller.openInstallPermissionSettings();
  const recheck = await ApkInstaller.canInstall();
  return recheck.allowed;
}

export async function installDownloadedApk(uri: string): Promise<void> {
  const allowed = await ensureInstallPermission();
  if (!allowed) {
    throw new Error('需要允许「安装未知应用」权限后才能更新');
  }

  await ApkInstaller.install({ uri });
}
