import { Filesystem, Directory } from '@capacitor/filesystem';
import type { LatestReleaseInfo } from './githubRelease';
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

export async function downloadAndroidApk(
  release: LatestReleaseInfo,
  onProgress?: (loadedBytes: number, totalBytes: number) => void
): Promise<string> {
  const asset = release.androidApk;
  if (!asset) {
    throw new Error('当前发布未包含 Android APK 安装包');
  }

  const response = await fetch(asset.browserDownloadUrl);
  if (!response.ok) {
    throw new Error(`下载失败（${response.status}）`);
  }

  const totalBytes = Number(response.headers.get('content-length') ?? asset.size) || asset.size;
  const reader = response.body?.getReader();
  if (!reader) {
    const buffer = await response.arrayBuffer();
    onProgress?.(buffer.byteLength, totalBytes);
    const base64 = arrayBufferToBase64(buffer);
    const fileName = `wix-${release.version}.apk`;
    const saved = await Filesystem.writeFile({
      path: `updates/${fileName}`,
      data: base64,
      directory: Directory.Cache
    });
    return saved.uri;
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
  const fileName = `wix-${release.version}.apk`;
  const saved = await Filesystem.writeFile({
    path: `updates/${fileName}`,
    data: base64,
    directory: Directory.Cache
  });

  return saved.uri;
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
