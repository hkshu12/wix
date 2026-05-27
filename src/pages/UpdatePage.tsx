import { useMemo } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { MarkdownContent } from '../components/MarkdownContent';
import { GITHUB_RELEASES_URL } from '../lib/appMeta';
import { isAndroidApp } from '../lib/platform';
import { useAppUpdate } from '../layout/UpdateContext';

export function UpdatePage() {
  const android = isAndroidApp();

  if (android) {
    return <AndroidUpdatePanel />;
  }

  return <WebUpdatePanel />;
}

function ReleaseNotes({ notes }: { notes: string }) {
  return (
    <details className="app-release-notes">
      <summary>更新说明</summary>
      <MarkdownContent source={notes} />
    </details>
  );
}

function AndroidUpdatePanel() {
  const {
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
  } = useAppUpdate();

  const statusText = useMemo(() => {
    switch (phase) {
      case 'checking':
        return '正在检查新版本…';
      case 'downloading':
        return `正在下载更新包${downloadProgress != null ? `（${downloadProgress}%）` : ''}…`;
      case 'installing':
        return '正在打开系统安装程序…';
      case 'error':
        return errorMessage;
      case 'ready':
        return updateAvailable ? '发现新版本，可下载并安装。' : '当前已是最新版本。';
      default:
        return updateAvailable ? '后台检测到新版本。' : '启动时会自动检查更新。';
    }
  }, [phase, updateAvailable, errorMessage, downloadProgress]);

  return (
    <>
      <section className="app-page-card" aria-labelledby="update-android-title">
        <h2 id="update-android-title">应用更新</h2>
        <p>
          当前版本 <strong>{currentVersion || '…'}</strong>
          {latestRelease ? (
            <>
              {' '}
              · 最新版本 <strong>{latestRelease.version}</strong>
            </>
          ) : null}
        </p>
        <p className={`app-page-status ${phase === 'error' ? 'app-page-status--error' : ''}`}>{statusText}</p>
        {phase === 'downloading' && downloadProgress != null ? (
          <div className="app-page-progress" aria-hidden>
            <span style={{ width: `${downloadProgress}%` }} />
          </div>
        ) : null}
        <div className="app-page-actions">
          <button
            className="app-page-btn"
            type="button"
            disabled={phase === 'checking' || phase === 'downloading'}
            onClick={() => void checkForUpdates()}
          >
            检查更新
          </button>
          <button
            className="app-page-btn app-page-btn--primary"
            type="button"
            disabled={!updateAvailable || phase === 'downloading' || phase === 'checking'}
            onClick={() => void downloadUpdate()}
          >
            下载更新
          </button>
          <button
            className="app-page-btn app-page-btn--primary"
            type="button"
            disabled={!downloadedApkUri || phase === 'installing'}
            onClick={() => void installUpdate()}
          >
            安装更新
          </button>
        </div>
        {latestRelease?.releaseNotes ? <ReleaseNotes notes={latestRelease.releaseNotes} /> : null}
      </section>

      <section className="app-page-card">
        <h2>安装提示</h2>
        <ul>
          <li>首次安装或更新前，请在系统设置中允许本应用「安装未知应用」。</li>
          <li>下载完成后点击「安装更新」，按系统向导完成覆盖安装。</li>
          <li>请始终通过本应用或官方发布页获取安装包，以保证版本连续可升级。</li>
        </ul>
        <div className="app-page-actions">
          <a className="app-page-btn" href={GITHUB_RELEASES_URL} rel="noreferrer" target="_blank">
            在浏览器中查看发布页
          </a>
        </div>
      </section>
    </>
  );
}

function WebUpdatePanel() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker
  } = useRegisterSW();
  const { currentVersion, checkForUpdates, latestRelease, phase, updateAvailable } = useAppUpdate();

  return (
    <>
      <section className="app-page-card" aria-labelledby="update-web-title">
        <h2 id="update-web-title">网页版更新</h2>
        <p>
          当前版本 <strong>{currentVersion || '…'}</strong>。有新版本时会在后台准备好，无需手动下载安装包。
        </p>
        {needRefresh ? (
          <p className="app-page-status">新版本已就绪，点击下方按钮即可立即使用。</p>
        ) : (
          <p className="app-page-status">若页面长时间未变化，可尝试强制刷新（Ctrl/Cmd + Shift + R）。</p>
        )}
        <div className="app-page-actions">
          <button
            className="app-page-btn app-page-btn--primary"
            type="button"
            disabled={!needRefresh}
            onClick={() => void updateServiceWorker(true)}
          >
            立即更新并刷新
          </button>
        </div>
      </section>

      <section className="app-page-card" aria-labelledby="update-android-download-title">
        <h2 id="update-android-download-title">Android 安装包</h2>
        <p>在手机上使用完整功能，请下载官方 Android 安装包并安装到设备。</p>
        <div className="app-page-actions">
          <button className="app-page-btn" type="button" disabled={phase === 'checking'} onClick={() => void checkForUpdates()}>
            查询最新版本
          </button>
          <a className="app-page-btn app-page-btn--primary" href={GITHUB_RELEASES_URL} rel="noreferrer" target="_blank">
            前往下载页面
          </a>
        </div>
        {latestRelease ? (
          <>
            <p className="app-page-status">
              最新 <strong>{latestRelease.version}</strong>
              {updateAvailable ? '（高于当前网页版）' : '（与当前网页版一致或无法比较）'}
            </p>
            {latestRelease.releaseNotes ? <ReleaseNotes notes={latestRelease.releaseNotes} /> : null}
          </>
        ) : null}
      </section>
    </>
  );
}
