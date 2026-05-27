import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { downloadAndroidApk, installDownloadedApk } from '../lib/androidApkUpdate';
import { fetchLatestRelease, type LatestReleaseInfo } from '../lib/githubRelease';
import { getAppVersionInfo } from '../lib/appMeta';
import { formatNetworkError } from '../lib/networkError';
import { isAndroidApp } from '../lib/platform';

export type UpdatePhase = 'idle' | 'checking' | 'ready' | 'downloading' | 'installing' | 'error';

export interface UpdateContextValue {
  phase: UpdatePhase;
  currentVersion: string;
  latestRelease: LatestReleaseInfo | null;
  updateAvailable: boolean;
  errorMessage: string | null;
  downloadProgress: number | null;
  downloadedApkUri: string | null;
  checkForUpdates: (options?: { silent?: boolean }) => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
}

const UpdateContext = createContext<UpdateContextValue | null>(null);

export function UpdateProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<UpdatePhase>('idle');
  const [currentVersion, setCurrentVersion] = useState('');
  const [latestRelease, setLatestRelease] = useState<LatestReleaseInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadedApkUri, setDownloadedApkUri] = useState<string | null>(null);

  const updateAvailable = Boolean(latestRelease?.isUpdateAvailable);

  const checkForUpdates = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setPhase('checking');
    }
    setErrorMessage(null);

    try {
      const versionInfo = await getAppVersionInfo();
      setCurrentVersion(versionInfo.version);
      const release = await fetchLatestRelease(versionInfo.version);
      setLatestRelease(release);
      setPhase(release.isUpdateAvailable ? 'ready' : 'idle');
    } catch (error) {
      setPhase('error');
      setErrorMessage(formatNetworkError(error, '检查更新失败'));
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    if (!latestRelease?.androidApk) {
      setErrorMessage('未找到可下载的 APK');
      setPhase('error');
      return;
    }

    setPhase('downloading');
    setErrorMessage(null);
    setDownloadProgress(0);

    try {
      const uri = await downloadAndroidApk(latestRelease, (loaded, total) => {
        if (total > 0) {
          setDownloadProgress(Math.min(100, Math.round((loaded / total) * 100)));
        }
      });
      setDownloadedApkUri(uri);
      setDownloadProgress(100);
      setPhase('ready');
    } catch (error) {
      setPhase('error');
      setErrorMessage(formatNetworkError(error, '下载更新失败'));
      setDownloadProgress(null);
    }
  }, [latestRelease]);

  const installUpdate = useCallback(async () => {
    if (!downloadedApkUri) {
      setErrorMessage('请先下载更新包');
      setPhase('error');
      return;
    }

    setPhase('installing');
    setErrorMessage(null);

    try {
      await installDownloadedApk(downloadedApkUri);
      setPhase('ready');
    } catch (error) {
      setPhase('error');
      setErrorMessage(error instanceof Error ? error.message : '无法启动安装程序');
    }
  }, [downloadedApkUri]);

  useEffect(() => {
    void getAppVersionInfo().then((info) => setCurrentVersion(info.version));
    if (isAndroidApp()) {
      void checkForUpdates({ silent: true });
    }
  }, [checkForUpdates]);

  const value = useMemo<UpdateContextValue>(
    () => ({
      phase,
      currentVersion,
      latestRelease,
      updateAvailable,
      errorMessage,
      downloadProgress,
      downloadedApkUri,
      checkForUpdates,
      downloadUpdate,
      installUpdate
    }),
    [
      phase,
      currentVersion,
      latestRelease,
      updateAvailable,
      errorMessage,
      downloadProgress,
      downloadedApkUri,
      checkForUpdates,
      downloadUpdate,
      installUpdate
    ]
  );

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
}

export function useAppUpdate(): UpdateContextValue {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useAppUpdate must be used within UpdateProvider');
  }

  return context;
}
