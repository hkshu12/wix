import { useEffect, useState } from 'react';
import { getAppVersionInfo } from '../lib/appMeta';
import { isAndroidApp } from '../lib/platform';
import { useStudio } from '../layout/StudioContext';
import { ThemeToggle } from '../theme/ThemeToggle';

export function SettingsPage() {
  const android = isAndroidApp();
  const { clearAllAppData } = useStudio();
  const [platformLabel, setPlatformLabel] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState('');

  useEffect(() => {
    void getAppVersionInfo().then((info) => setPlatformLabel(info.platformLabel));
  }, []);

  async function handleConfirmClear() {
    setClearing(true);
    setClearError('');
    try {
      await clearAllAppData();
    } catch {
      setClearing(false);
      setClearError('清除失败，请稍后重试。');
    }
  }

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

      <section className="app-page-card app-page-card--danger" aria-labelledby="settings-reset-title">
        <h2 id="settings-reset-title">清除本机数据</h2>
        <p>
          将删除混音快照、场景预设、睡眠与唤醒定时、主题偏好、功能介绍访问记录，以及本机导入的全部自定义音频。内置环境声不受影响。此操作不可撤销。
        </p>
        {!confirmClear ? (
          <div className="app-page-actions">
            <button
              className="app-page-btn app-page-btn--danger"
              type="button"
              onClick={() => {
                setConfirmClear(true);
                setClearError('');
              }}
            >
              清除全部本机数据…
            </button>
          </div>
        ) : (
          <div className="app-page-actions app-page-actions--stack">
            <p className="app-page-status app-page-status--warning" role="status">
              确认要清除吗？清除后页面将自动刷新。
            </p>
            <div className="app-page-actions">
              <button
                className="app-page-btn app-page-btn--danger"
                type="button"
                disabled={clearing}
                onClick={() => void handleConfirmClear()}
              >
                {clearing ? '正在清除…' : '确认清除'}
              </button>
              <button
                className="app-page-btn"
                type="button"
                disabled={clearing}
                onClick={() => setConfirmClear(false)}
              >
                取消
              </button>
            </div>
          </div>
        )}
        {clearError ? (
          <p className="app-page-status app-page-status--error" role="alert">
            {clearError}
          </p>
        ) : null}
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
