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
            <li>混音状态、已保存的方案与主题偏好保存在本机。</li>
            <li>你导入的自定义音频也保存在本机；卸载应用会一并删除。</li>
            <li>若后台播放被系统中断，可在系统设置中为应用关闭电池限制或允许后台活动。</li>
          </ul>
        ) : (
          <ul>
            <li>混音状态、已保存的方案与主题偏好保存在浏览器本机存储中。</li>
            <li>导入的自定义音频保存在本机；清除站点数据会删除这些内容。</li>
            <li>安装到主屏幕后，可离线使用已缓存的界面与内置环境声。</li>
          </ul>
        )}
      </section>

      <section className="app-page-card" aria-labelledby="settings-platform-title">
        <h2 id="settings-platform-title">使用说明</h2>
        <p>
          当前运行环境：<strong>{platformLabel || '…'}</strong>
        </p>
        {android ? (
          <p>Android 版打开后直接进入混音台。有新版本时，请到「更新」页检查并安装。</p>
        ) : (
          <p>网页版提供功能介绍页；更新可在「更新」页一键刷新，或下载 Android 安装包在手机上使用。</p>
        )}
      </section>
    </>
  );
}
