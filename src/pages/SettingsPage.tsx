import { useEffect, useState } from 'react';
import { hasFullAppBackupExportContent, readCurrentAppPreferencesForBackup } from '../domain/fullAppBackup';
import { getAppVersionInfo } from '../lib/appMeta';
import { isAndroidApp } from '../lib/platform';
import { useStudio } from '../layout/StudioContext';
import { mixerStateToSnapshotPayload } from '../storage/mixerSnapshot';
import { ThemeToggle } from '../theme/ThemeToggle';

export function SettingsPage() {
  const android = isAndroidApp();
  const {
    clearAllAppData,
    customTracks,
    exportCustomLibrary,
    importCustomLibraryBackup,
    exportMixerPresets,
    importMixerPresetsBackup,
    exportFullAppBackup,
    importFullAppBackup,
    mixer,
    mixerPresets
  } = useStudio();
  const [platformLabel, setPlatformLabel] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState('');
  const [backupStatus, setBackupStatus] = useState('');
  const [exportingBackup, setExportingBackup] = useState(false);
  const [importingBackup, setImportingBackup] = useState(false);
  const [presetBackupStatus, setPresetBackupStatus] = useState('');
  const [exportingPresets, setExportingPresets] = useState(false);
  const [importingPresets, setImportingPresets] = useState(false);
  const [fullBackupStatus, setFullBackupStatus] = useState('');
  const [exportingFullBackup, setExportingFullBackup] = useState(false);
  const [importingFullBackup, setImportingFullBackup] = useState(false);

  const hasFullBackupContent = hasFullAppBackupExportContent({
    customTrackCount: customTracks.length,
    presets: mixerPresets,
    mixerSnapshot: mixer.layers.length > 0 ? mixerStateToSnapshotPayload(mixer) : null,
    appPreferences: readCurrentAppPreferencesForBackup()
  });
  const backupBusy =
    exportingBackup ||
    importingBackup ||
    exportingPresets ||
    importingPresets ||
    exportingFullBackup ||
    importingFullBackup;

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

  async function handleExportBackup() {
    setExportingBackup(true);
    setBackupStatus('');
    try {
      const message = await exportCustomLibrary();
      setBackupStatus(message);
    } catch {
      setBackupStatus('导出失败，请稍后重试。');
    } finally {
      setExportingBackup(false);
    }
  }

  function handleExportPresets() {
    setExportingPresets(true);
    setPresetBackupStatus('');
    try {
      setPresetBackupStatus(exportMixerPresets());
    } finally {
      setExportingPresets(false);
    }
  }

  async function handleImportPresets(fileList: FileList | null) {
    const input = fileList?.[0];
    if (!input) {
      return;
    }

    setImportingPresets(true);
    setPresetBackupStatus('');
    try {
      const message = await importMixerPresetsBackup(fileList);
      if (message) {
        setPresetBackupStatus(message);
      }
    } catch {
      setPresetBackupStatus('导入场景预设失败，请检查文件格式。');
    } finally {
      setImportingPresets(false);
    }
  }

  async function handleExportFullBackup() {
    setExportingFullBackup(true);
    setFullBackupStatus('');
    try {
      const message = await exportFullAppBackup();
      setFullBackupStatus(message);
    } catch {
      setFullBackupStatus('导出失败，请稍后重试。');
    } finally {
      setExportingFullBackup(false);
    }
  }

  async function handleImportFullBackup(fileList: FileList | null) {
    const input = fileList?.[0];
    if (!input) {
      return;
    }

    setImportingFullBackup(true);
    setFullBackupStatus('');
    try {
      const message = await importFullAppBackup(fileList);
      if (message) {
        setFullBackupStatus(message);
      }
    } catch {
      setFullBackupStatus('导入完整备份失败，请检查文件格式。');
    } finally {
      setImportingFullBackup(false);
    }
  }

  async function handleImportBackup(fileList: FileList | null) {
    const input = fileList?.[0];
    if (!input) {
      return;
    }

    setImportingBackup(true);
    setBackupStatus('');
    try {
      const message = await importCustomLibraryBackup(fileList);
      if (message) {
        setBackupStatus(message);
      }
    } catch {
      setBackupStatus('导入备份失败，请检查文件格式。');
    } finally {
      setImportingBackup(false);
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
            <li>你导入的自定义音频与保存的场景预设也保存在本机；可在下方导出完整备份（推荐）或分别备份，换机或重装后导入恢复。</li>
            <li>若后台播放被系统中断，可在系统设置中为应用关闭电池限制或允许后台活动。</li>
          </ul>
        ) : (
          <ul>
            <li>混音状态、已保存的方案与主题偏好保存在浏览器本机存储中。</li>
            <li>导入的自定义音频与场景预设保存在本机；可在下方导出完整备份（推荐）或分别备份，换设备或重装后导入恢复。</li>
            <li>清除站点数据会删除这些内容。</li>
            <li>安装到主屏幕后，可离线使用已缓存的界面与内置环境声。</li>
          </ul>
        )}
      </section>

      <section className="app-page-card" aria-labelledby="settings-full-backup-title">
        <h2 id="settings-full-backup-title">完整备份（推荐）</h2>
        <p>
          将本机的自定义音频、场景预设、当前混音与偏好设置（主题、渐入、常亮、定时渐出时长）一并导出为单个 JSON 文件，换设备或重装后一次导入即可恢复会话，无需分别操作多个备份文件。
        </p>
        <div className="app-page-actions">
          <button
            className="app-page-btn"
            type="button"
            disabled={backupBusy || !hasFullBackupContent}
            onClick={() => void handleExportFullBackup()}
          >
            {exportingFullBackup ? '正在导出…' : '导出完整备份…'}
          </button>
          <label className="app-page-btn">
            {importingFullBackup ? '正在导入…' : '导入完整备份…'}
            <input
              type="file"
              accept=".json,application/json"
              hidden
              disabled={backupBusy}
              onChange={(event) => {
                void handleImportFullBackup(event.target.files);
                event.target.value = '';
              }}
            />
          </label>
        </div>
        {fullBackupStatus ? (
          <p className="app-page-status" role="status">
            {fullBackupStatus}
          </p>
        ) : null}
      </section>

      <section className="app-page-card" aria-labelledby="settings-backup-title">
        <h2 id="settings-backup-title">自定义音频备份</h2>
        <p>
          将本机导入的自定义音轨导出为 JSON 备份文件，可在换新设备、重装应用或清除数据前保存，之后从设置页导入恢复。
        </p>
        <div className="app-page-actions">
          <button
            className="app-page-btn"
            type="button"
            disabled={backupBusy || customTracks.length === 0}
            onClick={() => void handleExportBackup()}
          >
            {exportingBackup ? '正在导出…' : `导出 ${customTracks.length} 个音频…`}
          </button>
          <label className="app-page-btn">
            {importingBackup ? '正在导入…' : '导入备份…'}
            <input
              type="file"
              accept=".json,application/json"
              hidden
              disabled={backupBusy}
              onChange={(event) => {
                void handleImportBackup(event.target.files);
                event.target.value = '';
              }}
            />
          </label>
        </div>
        {backupStatus ? (
          <p className="app-page-status" role="status">
            {backupStatus}
          </p>
        ) : null}
      </section>

      <section className="app-page-card" aria-labelledby="settings-preset-backup-title">
        <h2 id="settings-preset-backup-title">场景预设备份</h2>
        <p>
          将混音台保存的最多 12 组场景预设导出为 JSON 文件，换设备或重装后可导入恢复。预设中的自定义音轨需另行导出自定义音频备份。
        </p>
        <div className="app-page-actions">
          <button
            className="app-page-btn"
            type="button"
            disabled={backupBusy || mixerPresets.length === 0}
            onClick={handleExportPresets}
          >
            {exportingPresets ? '正在导出…' : `导出 ${mixerPresets.length} 个预设…`}
          </button>
          <label className="app-page-btn">
            {importingPresets ? '正在导入…' : '导入预设…'}
            <input
              type="file"
              accept=".json,application/json"
              hidden
              disabled={backupBusy}
              onChange={(event) => {
                void handleImportPresets(event.target.files);
                event.target.value = '';
              }}
            />
          </label>
        </div>
        {presetBackupStatus ? (
          <p className="app-page-status" role="status">
            {presetBackupStatus}
          </p>
        ) : null}
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
