import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { BottomDrawer } from '../components/BottomDrawer';
import { KeyboardShortcutsDialog } from '../components/KeyboardShortcutsDialog';
import { Slider } from '../components/Slider';
import { AndroidNavDrawer } from '../layout/AndroidNavDrawer';
import { useAppUpdate } from '../layout/UpdateContext';
import { isAndroidApp } from '../lib/platform';
import {
  setGlobalPlaybackRate,
  setLayerControl,
  setMasterVolume,
  setStereoWidth,
  toggleLayer
} from '../domain/mixer';
import {
  formatLayerToggleAnnouncement,
  formatPlayToggleAnnouncement
} from '../domain/playbackAnnouncement';
import { usePlaybackAnnouncer } from '../hooks/usePlaybackAnnouncer';
import { adjustMasterVolumeStep } from '../domain/studioKeyboard';
import { useStudioKeyboardShortcuts } from '../hooks/useStudioKeyboardShortcuts';
import { APP_DISPLAY_NAME } from '../lib/appMeta';
import { assetUrl } from '../lib/assetUrl';
import {
  clampSleepTimerMinutes,
  SLEEP_TIMER_FADE_PRESETS_SECONDS,
  SLEEP_TIMER_MAX_MINUTES,
  SLEEP_TIMER_MIN_MINUTES,
  SLEEP_TIMER_PRESETS_MINUTES
} from '../domain/sleepTimer';
import { useStudio } from '../layout/StudioContext';
import { ThemeToggle } from '../theme/ThemeToggle';
import './StudioPage.css';

export function StudioPage() {
  const {
    mixer,
    setMixer,
    importStatus,
    importProgress,
    allSounds,
    selectedLayers,
    handleImport,
    handleDeleteCustomTrack,
    handlePlayToggle,
    sleepTimerRemainingLabel,
    sleepTimerActive,
    sleepTimerFading,
    sleepTimerFadeSeconds,
    setSleepTimerFadeSeconds,
    startSleepTimer,
    cancelSleepTimer,
    mixerPresets,
    saveMixerPreset,
    loadMixerPreset,
    deleteMixerPreset,
    copyMixerShare,
    copyMixerShareLink,
    pasteMixerShareFromClipboard,
    importMixerShare,
    failedSoundIds,
    retryLayerLoad
  } = useStudio();

  async function handlePasteShareFromClipboard() {
    const text = await pasteMixerShareFromClipboard();
    if (text !== null) {
      setSharePaste(text);
    }
  }
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [keyboardHelpOpen, setKeyboardHelpOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [sharePaste, setSharePaste] = useState('');
  const [customSleepMinutes, setCustomSleepMinutes] = useState('90');
  const [customSleepError, setCustomSleepError] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const { updateAvailable } = useAppUpdate();
  const android = isAndroidApp();
  const { message: playbackAnnouncement, announce: announcePlayback } = usePlaybackAnnouncer();

  const activeCount = mixer.layers.length;

  const handlePlayToggleWithAnnouncement = useCallback(async () => {
    const nextPlaying = !mixer.isPlaying;
    await handlePlayToggle();
    announcePlayback(formatPlayToggleAnnouncement(nextPlaying));
  }, [announcePlayback, handlePlayToggle, mixer.isPlaying]);

  useStudioKeyboardShortcuts(
    { drawerOpen, navOpen, keyboardHelpOpen },
    {
      onTogglePlayback: () => {
        void handlePlayToggleWithAnnouncement();
      },
      onToggleKeyboardHelp: () => {
        setKeyboardHelpOpen((open) => !open);
      },
      onToggleMixerDrawer: () => {
        setDrawerOpen((open) => !open);
      },
      onAdjustMasterVolume: (delta) => {
        setMixer((state) =>
          setMasterVolume(state, adjustMasterVolumeStep(state.masterVolume, delta))
        );
      }
    }
  );

  function handleStartCustomSleepTimer() {
    const parsed = Number.parseInt(customSleepMinutes.trim(), 10);
    if (!Number.isFinite(parsed)) {
      setCustomSleepError(`请输入 ${SLEEP_TIMER_MIN_MINUTES}–${SLEEP_TIMER_MAX_MINUTES} 之间的整数分钟`);
      return;
    }

    const minutes = clampSleepTimerMinutes(parsed);
    const started = startSleepTimer(minutes);
    if (!started) {
      setCustomSleepError(`请输入 ${SLEEP_TIMER_MIN_MINUTES}–${SLEEP_TIMER_MAX_MINUTES} 之间的整数分钟`);
      return;
    }

    setCustomSleepMinutes(String(minutes));
    setCustomSleepError(null);
  }

  function handleLayerToggle(soundId: string, soundTitle: string) {
    const wasSelected = mixer.layers.some((layer) => layer.soundId === soundId);
    const nextSelected = !wasSelected;
    const nextCount = nextSelected ? mixer.layers.length + 1 : mixer.layers.length - 1;

    setMixer((state) => toggleLayer(state, soundId));
    announcePlayback(formatLayerToggleAnnouncement(soundTitle, nextSelected, nextCount));
  }

  return (
    <main className="studio-page studio-remote">
      <p
        className="sr-only"
        role="status"
        aria-label="混音播放状态"
        aria-live="polite"
        aria-atomic="true"
      >
        {playbackAnnouncement}
      </p>
      <header className="studio-topbar">
        <div className="studio-topbar-start">
          <img className="studio-mark" src={assetUrl('icon.svg')} alt="" width={28} height={28} />
          <div>
            <span className="studio-title">{APP_DISPLAY_NAME}</span>
            <p className="studio-subtitle">远程声景 · 点选即播</p>
          </div>
        </div>
        <div className="studio-topbar-actions">
          {android ? (
            <button
              className="studio-btn studio-btn--ghost studio-menu-btn"
              type="button"
              aria-expanded={navOpen}
              onClick={() => setNavOpen(true)}
            >
              菜单
              {updateAvailable ? <span className="studio-menu-btn__badge" aria-hidden /> : null}
            </button>
          ) : (
            <>
              <Link className="studio-btn studio-btn--ghost" to="/" state={{ fromIntro: true }}>
                介绍
              </Link>
              <Link className="studio-btn studio-btn--ghost" to="/settings">
                设置
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </header>

      <section className="studio-stage" aria-labelledby="remote-sounds-title">
        <div className="studio-stage-heading">
          <h2 id="remote-sounds-title">选择环境声</h2>
          <p>像遥控器一样叠加远处声景，无需在页面间来回切换。</p>
        </div>
        <div className="sound-grid sound-grid--remote">
          {allSounds.map((sound) => {
            const selected = mixer.layers.some((layer) => layer.soundId === sound.id);
            const accent = sound.kind === 'built-in' ? sound.accent : '#a78bfa';
            const icon = sound.kind === 'built-in' ? sound.icon : '🎵';
            const subtitle =
              sound.kind === 'built-in' ? sound.subtitle : `${formatBytes(sound.size)} · ${sound.fileName}`;

            return (
              <button
                className={`sound-card sound-card--remote ${selected ? 'selected' : ''}`}
                key={sound.id}
                style={{ '--accent': accent } as React.CSSProperties}
                type="button"
                aria-pressed={selected}
                onClick={() => handleLayerToggle(sound.id, sound.title)}
              >
                <span className="sound-icon">{icon}</span>
                <span className="sound-card-copy">
                  <strong>{sound.title}</strong>
                  <small>{subtitle}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="studio-dock" aria-label="播放与混音控制">
        {sleepTimerActive ? (
          <p className="studio-dock-timer" aria-live="polite">
            {sleepTimerFading ? '渐出中' : '定时'} · {sleepTimerRemainingLabel}
          </p>
        ) : null}
        <button className="studio-dock-play" type="button" onClick={() => void handlePlayToggleWithAnnouncement()}>
          <span className="studio-dock-play-icon" aria-hidden>
            {mixer.isPlaying ? '❚❚' : '▶'}
          </span>
          <span>{mixer.isPlaying ? '暂停' : '播放'}</span>
        </button>
        <button className="studio-dock-mixer" type="button" onClick={() => setDrawerOpen(true)}>
          <span>混音与导入</span>
          {activeCount > 0 ? <span className="studio-dock-badge">{activeCount}</span> : null}
        </button>
      </footer>

      {android ? <AndroidNavDrawer open={navOpen} onClose={() => setNavOpen(false)} /> : null}

      <KeyboardShortcutsDialog open={keyboardHelpOpen} onClose={() => setKeyboardHelpOpen(false)} />

      <BottomDrawer open={drawerOpen} title="混音与导入" onClose={() => setDrawerOpen(false)}>
        <p className="drawer-hint drawer-hint--muted">桌面端按 <kbd>?</kbd> 可查看键盘快捷键。</p>
        <section className="drawer-section" aria-labelledby="drawer-import-title">
          <h3 id="drawer-import-title">添加到本机</h3>
          <p className="drawer-hint">从底部抽屉导入音频，混音台与轨道调节都在此完成。</p>
          <label className="studio-btn studio-btn--secondary drawer-import-btn">
            导入音频
            <input
              aria-label="导入自定义音乐"
              type="file"
              accept="audio/*"
              onChange={(event) => void handleImport(event.target.files)}
            />
          </label>
          {importProgress != null ? (
            <div
              className="studio-import-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={importProgress}
              aria-label={`正在读取音频 ${importProgress}%`}
            >
              <span style={{ width: `${importProgress}%` }} />
            </div>
          ) : null}
          <p className="studio-import-status">{importStatus}</p>
        </section>

        <section className="drawer-section" aria-labelledby="drawer-presets-title">
          <h3 id="drawer-presets-title">场景预设</h3>
          <p className="drawer-hint">保存当前声轨组合与主音量，一键切换专注、睡眠等固定搭配。</p>
          <div className="mixer-preset-save">
            <label className="mixer-preset-name-label">
              预设名称
              <input
                aria-label="预设名称"
                className="mixer-preset-name-input"
                maxLength={40}
                placeholder="例如：雨夜专注"
                type="text"
                value={presetName}
                onChange={(event) => setPresetName(event.target.value)}
              />
            </label>
            <button
              className="studio-btn studio-btn--secondary"
              type="button"
              onClick={() => {
                saveMixerPreset(presetName);
                setPresetName('');
              }}
            >
              保存当前混音
            </button>
          </div>
          {mixerPresets.length > 0 ? (
            <ul className="mixer-preset-list" aria-label="已保存的场景预设">
              {mixerPresets.map((preset) => (
                <li className="mixer-preset-item" key={preset.id}>
                  <button
                    aria-label={`加载预设 ${preset.name}`}
                    className="mixer-preset-load studio-btn studio-btn--secondary"
                    type="button"
                    onClick={() => loadMixerPreset(preset.id)}
                  >
                    {preset.name}
                    <span className="mixer-preset-meta">{preset.layers.length} 轨</span>
                  </button>
                  <button
                    aria-label={`删除预设 ${preset.name}`}
                    className="ghost-button mixer-preset-delete"
                    type="button"
                    onClick={() => deleteMixerPreset(preset.id)}
                  >
                    删除
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="drawer-hint drawer-hint--muted">尚无预设，调好混音后点击保存。</p>
          )}
        </section>

        <section className="drawer-section" aria-labelledby="drawer-share-title">
          <h3 id="drawer-share-title">分享混音</h3>
          <p className="drawer-hint">
            复制分享链接或 JSON 分享码即可还原当前混音（仅内置环境声；自定义音频需各自导入）。打开带
            <code>?share=</code> 的链接会自动导入。
          </p>
          <div className="mixer-share-actions">
            <button
              className="studio-btn studio-btn--secondary"
              type="button"
              onClick={() => void copyMixerShareLink()}
            >
              复制分享链接
            </button>
            <button
              className="studio-btn studio-btn--secondary"
              type="button"
              onClick={() => void copyMixerShare()}
            >
              复制分享码
            </button>
            <button
              className="studio-btn studio-btn--secondary"
              type="button"
              onClick={() => void handlePasteShareFromClipboard()}
            >
              从剪贴板粘贴
            </button>
          </div>
          <label className="mixer-share-paste-label">
            分享码
            <textarea
              aria-label="混音分享码"
              className="mixer-share-paste"
              placeholder='{"type":"wix-mixer-share",...}'
              rows={4}
              value={sharePaste}
              onChange={(event) => setSharePaste(event.target.value)}
            />
          </label>
          <button
            className="studio-btn studio-btn--secondary"
            type="button"
            onClick={() => {
              importMixerShare(sharePaste);
              setSharePaste('');
            }}
          >
            导入混音
          </button>
        </section>

        <section className="drawer-section" aria-labelledby="drawer-sleep-timer-title">
          <h3 id="drawer-sleep-timer-title">睡眠定时</h3>
          <p className="drawer-hint">
            到时自动将主音量在 {sleepTimerFadeSeconds} 秒内渐弱并暂停播放，避免突然静音惊醒。
          </p>
          <p className="drawer-hint sleep-timer-fade-label" id="sleep-timer-fade-label">
            渐出时长
          </p>
          <div
            className="sleep-timer-presets sleep-timer-fade-presets"
            role="group"
            aria-labelledby="sleep-timer-fade-label"
          >
            {SLEEP_TIMER_FADE_PRESETS_SECONDS.map((seconds) => (
              <button
                key={seconds}
                aria-pressed={sleepTimerFadeSeconds === seconds}
                className="studio-btn studio-btn--secondary sleep-timer-preset"
                type="button"
                onClick={() => setSleepTimerFadeSeconds(seconds)}
              >
                {seconds} 秒
              </button>
            ))}
          </div>
          <div className="sleep-timer-presets" role="group" aria-label="睡眠定时预设">
            {SLEEP_TIMER_PRESETS_MINUTES.map((minutes) => (
              <button
                key={minutes}
                className="studio-btn studio-btn--secondary sleep-timer-preset"
                type="button"
                onClick={() => {
                  setCustomSleepError(null);
                  startSleepTimer(minutes);
                }}
              >
                {minutes} 分钟
              </button>
            ))}
          </div>
          <form
            className="sleep-timer-custom"
            onSubmit={(event) => {
              event.preventDefault();
              handleStartCustomSleepTimer();
            }}
          >
            <label className="sleep-timer-custom-label" htmlFor="sleep-timer-custom-minutes">
              自定义时长（分钟）
            </label>
            <div className="sleep-timer-custom-row">
              <input
                aria-describedby={customSleepError ? 'sleep-timer-custom-error' : 'sleep-timer-custom-hint'}
                aria-invalid={customSleepError ? true : undefined}
                className="sleep-timer-custom-input"
                id="sleep-timer-custom-minutes"
                inputMode="numeric"
                max={SLEEP_TIMER_MAX_MINUTES}
                min={SLEEP_TIMER_MIN_MINUTES}
                type="number"
                value={customSleepMinutes}
                onChange={(event) => {
                  setCustomSleepMinutes(event.target.value);
                  setCustomSleepError(null);
                }}
              />
              <button className="studio-btn studio-btn--secondary" type="submit">
                开始
              </button>
            </div>
            <p className="drawer-hint" id="sleep-timer-custom-hint">
              支持 {SLEEP_TIMER_MIN_MINUTES}–{SLEEP_TIMER_MAX_MINUTES} 分钟，例如午睡 90 分钟或哄娃 120 分钟。
            </p>
            {customSleepError ? (
              <p className="sleep-timer-custom-error" id="sleep-timer-custom-error" role="alert">
                {customSleepError}
              </p>
            ) : null}
          </form>
          {sleepTimerActive ? (
            <div className="sleep-timer-active">
              <p aria-live="polite">
                {sleepTimerFading ? '正在渐出…' : '剩余'} {sleepTimerRemainingLabel}
              </p>
              <button className="ghost-button" type="button" onClick={cancelSleepTimer}>
                取消定时
              </button>
            </div>
          ) : null}
        </section>

        <section className="drawer-section panel mixer-panel" aria-label="当前混音轨道">
          <h3>混音控制台</h3>
          <div className="global-controls">
            <Slider
              label="主音量"
              value={Math.round(mixer.masterVolume * 100)}
              min={0}
              max={100}
              onChange={(value) => setMixer((state) => setMasterVolume(state, value / 100))}
            />
            <Slider
              label="立体声宽度"
              value={Math.round(mixer.stereoWidth * 100)}
              min={0}
              max={100}
              onChange={(value) => setMixer((state) => setStereoWidth(state, value / 100))}
            />
            <Slider
              label="全局速度"
              value={Math.round(mixer.playbackRate * 100)}
              min={50}
              max={175}
              onChange={(value) => setMixer((state) => setGlobalPlaybackRate(state, value / 100))}
            />
          </div>

          <div className="layers">
            {selectedLayers.length === 0 ? (
              <div className="empty-state">
                <span>📡</span>
                <p>在上方选择声音后，可在此调节每轨音量与声像。</p>
              </div>
            ) : (
              selectedLayers.map(({ layer, sound }) => {
                const loadFailed = failedSoundIds.includes(layer.soundId);

                return (
                <article className={`layer-card ${loadFailed ? 'layer-card--load-failed' : ''}`} key={layer.soundId}>
                  <div className="layer-title">
                    <span>{sound.kind === 'built-in' ? sound.icon : '🎵'}</span>
                    <div>
                      <h4>{sound.title}</h4>
                      <p>{sound.kind === 'built-in' ? sound.subtitle : sound.fileName}</p>
                    </div>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() => setMixer((state) => setLayerControl(state, layer.soundId, { muted: !layer.muted }))}
                    >
                      {layer.muted ? '取消静音' : '静音'}
                    </button>
                  </div>
                  {loadFailed ? (
                    <div className="layer-load-error" role="alert">
                      <p>该轨道未能加载（已自动重试）。请检查网络后手动重试。</p>
                      <button
                        className="studio-btn studio-btn--secondary layer-load-retry"
                        type="button"
                        onClick={() => retryLayerLoad(layer.soundId)}
                      >
                        重试加载
                      </button>
                    </div>
                  ) : null}
                  <Slider
                    label={`${sound.title}音量`}
                    value={Math.round(layer.volume * 100)}
                    min={0}
                    max={100}
                    onChange={(value) =>
                      setMixer((state) => setLayerControl(state, layer.soundId, { volume: value / 100 }))
                    }
                  />
                  <Slider
                    label={`${sound.title}声像`}
                    value={Math.round((layer.pan + 1) * 50)}
                    min={0}
                    max={100}
                    onChange={(value) =>
                      setMixer((state) => setLayerControl(state, layer.soundId, { pan: value / 50 - 1 }))
                    }
                  />
                  <Slider
                    label={`${sound.title}速度`}
                    value={Math.round(layer.playbackRate * 100)}
                    min={50}
                    max={175}
                    onChange={(value) =>
                      setMixer((state) => setLayerControl(state, layer.soundId, { playbackRate: value / 100 }))
                    }
                  />
                  {sound.kind === 'custom' ? (
                    <button className="danger-button" type="button" onClick={() => void handleDeleteCustomTrack(sound)}>
                      删除导入音频
                    </button>
                  ) : null}
                </article>
              );
              })
            )}
          </div>
        </section>
      </BottomDrawer>
    </main>
  );
}

function formatBytes(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
