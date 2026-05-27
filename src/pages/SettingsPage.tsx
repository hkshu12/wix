import { useEffect, useState } from 'react';
import { getAppVersionInfo } from '../lib/appMeta';
import { isAndroidApp } from '../lib/platform';
import { ThemeToggle } from '../theme/ThemeToggle';

export function SettingsPage() {
  const android = isAndroidApp();
  const [platformLabel, setPlatformLabel] = useState('');

  useEffect(() => {
    void getAppVersionInfo().then((info) => setPlatformLabel(info.platformLabel));
  }, []);

  return (
    <>
      <section className="app-page-card" aria-labelledby="settings-appearance-title">
        <h2 id="settings-appearance-title">外观</h2>
        <p>在浅色与深色主题之间切换，偏好会保存在本机。</p>
        <div className="app-page-actions">
          <ThemeToggle />
        </div>
      </section>

      <section className="app-page-card" aria-labelledby="settings-storage-title">
        <h2 id="settings-storage-title">数据与存储</h2>
        {android ? (
          <ul>
            <li>混音状态与主题偏好保存在应用 WebView 本地存储中。</li>
            <li>导入的自定义音频保存在设备 IndexedDB，卸载应用会一并清除。</li>
            <li>后台播放能力受系统省电策略影响，可在系统设置中为应用关闭电池优化。</li>
          </ul>
        ) : (
          <ul>
            <li>混音快照与主题偏好保存在浏览器 localStorage。</li>
            <li>导入音频保存在 IndexedDB；清除站点数据会删除自定义曲库。</li>
            <li>安装为 PWA 后，可在离线状态下继续使用已缓存的界面与内置环境声。</li>
          </ul>
        )}
      </section>

      <section className="app-page-card" aria-labelledby="settings-platform-title">
        <h2 id="settings-platform-title">平台说明</h2>
        <p>
          当前运行环境：<strong>{platformLabel || '…'}</strong>
        </p>
        {android ? (
          <p>
            Android 版直接进入混音台，不展示营销落地页。应用更新通过 GitHub Release 分发 APK，请在「更新」页检查并安装。
          </p>
        ) : (
          <p>
            Web 版提供功能介绍落地页；版本更新由 Service Worker 自动拉取，也可在「更新」页手动刷新或前往 Release 下载 Android 安装包。
          </p>
        )}
      </section>
    </>
  );
}
