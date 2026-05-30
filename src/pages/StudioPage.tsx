import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BottomDrawer } from '../components/BottomDrawer';
import { KeyboardShortcutsDialog } from '../components/KeyboardShortcutsDialog';
import { ImmersiveSceneStage } from '../components/ImmersiveSceneStage';
import { Slider } from '../components/Slider';
import { applyFlagshipScene } from '../domain/applyFlagshipScene';
import {
  getAdjacentFlagshipScene,
  getFlagshipSceneById,
  type FlagshipSceneId
} from '../domain/flagshipScenes';
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
  formatPlayToggleAnnouncement,
  formatMasterVolumeAnnouncement,
  formatSleepTimerCancelAnnouncement,
  formatSleepTimerCompleteAnnouncement,
  formatSleepTimerClockStartAnnouncement,
  formatSleepTimerStartAnnouncement,
  formatWakeTimerCancelAnnouncement,
  formatWakeTimerClockStartAnnouncement,
  formatWakeTimerCompleteAnnouncement,
  formatWakeTimerStartAnnouncement
} from '../domain/playbackAnnouncement';
import { usePlaybackAnnouncer } from '../hooks/usePlaybackAnnouncer';
import { filterSoundsByQuery } from '../domain/soundSearch';
import {
  adjustMasterVolumeStep,
  shouldAnnounceMasterVolumePercent
} from '../domain/studioKeyboard';
import { useStudioKeyboardShortcuts } from '../hooks/useStudioKeyboardShortcuts';
import { APP_DISPLAY_NAME } from '../lib/appMeta';
import { readFlagshipSceneId, writeFlagshipSceneId } from '../storage/flagshipScenePreference';
import {
  PLAYBACK_FADE_IN_OFF,
  PLAYBACK_FADE_IN_PRESETS_SECONDS
} from '../domain/playbackFadeIn';
import {
  clampSleepTimerMinutes,
  SLEEP_TIMER_FADE_PRESETS_SECONDS,
  SLEEP_TIMER_MAX_MINUTES,
  SLEEP_TIMER_MIN_MINUTES,
  parseSleepClockTimeInput,
  SLEEP_TIMER_PRESETS_MINUTES
} from '../domain/sleepTimer';
import {
  clampWakeTimerMinutes,
  parseWakeClockTimeInput,
  WAKE_TIMER_FADE_PRESETS_SECONDS,
  WAKE_TIMER_MAX_MINUTES,
  WAKE_TIMER_MIN_MINUTES,
  WAKE_TIMER_PRESETS_MINUTES
} from '../domain/wakeTimer';
import { useStudio } from '../layout/StudioContext';
import { ThemeToggle } from '../theme/ThemeToggle';
import './StudioPage.css';

const DEFAULT_FLAGSHIP_SCENE_ID: FlagshipSceneId = 'summer-rain';

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
    playbackFadeInSeconds,
    setPlaybackFadeInSeconds,
    screenWakeLockEnabled,
    screenWakeLockSupported,
    setScreenWakeLockEnabled,
    startSleepTimer,
    startSleepTimerAtClock,
    cancelSleepTimer,
    wakeTimerRemainingLabel,
    wakeTimerActive,
    wakeTimerFading,
    wakeTimerFadeSeconds,
    setWakeTimerFadeSeconds,
    startWakeTimer,
    startWakeTimerAtClock,
    cancelWakeTimer,
    mixerPresets,
    saveMixerPreset,
    loadMixerPreset,
    renameMixerPreset,
    duplicateMixerPreset,
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
  const [soundSearchQuery, setSoundSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [keyboardHelpOpen, setKeyboardHelpOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [renamingPresetId, setRenamingPresetId] = useState<string | null>(null);
  const [renamingPresetName, setRenamingPresetName] = useState('');
  const [sharePaste, setSharePaste] = useState('');
  const [customSleepMinutes, setCustomSleepMinutes] = useState('90');
  const [customSleepError, setCustomSleepError] = useState<string | null>(null);
  const [customWakeMinutes, setCustomWakeMinutes] = useState('90');
  const [customWakeError, setCustomWakeError] = useState<string | null>(null);
  const [sleepClockTime, setSleepClockTime] = useState('23:00');
  const [sleepClockError, setSleepClockError] = useState<string | null>(null);
  const [wakeClockTime, setWakeClockTime] = useState('07:30');
  const [wakeClockError, setWakeClockError] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState<FlagshipSceneId>(
    () => readFlagshipSceneId() ?? DEFAULT_FLAGSHIP_SCENE_ID
  );
  const initialSceneAppliedRef = useRef(false);
  const { updateAvailable } = useAppUpdate();
  const android = isAndroidApp();
  const { message: playbackAnnouncement, announce: announcePlayback } = usePlaybackAnnouncer();
  const sleepTimerWasActiveRef = useRef(sleepTimerActive);
  const sleepTimerCancelledByUserRef = useRef(false);
  const wakeTimerWasActiveRef = useRef(wakeTimerActive);
  const wakeTimerCancelledByUserRef = useRef(false);
  const lastAnnouncedMasterPercentRef = useRef<number | null>(null);

  const activeCount = mixer.layers.length;
  const visibleSounds = useMemo(
    () => filterSoundsByQuery(allSounds, soundSearchQuery),
    [allSounds, soundSearchQuery]
  );
  const soundSearchActive = soundSearchQuery.trim().length > 0;

  const handleStartSleepTimer = useCallback(
    (minutes: number) => {
      const started = startSleepTimer(minutes);
      if (started) {
        announcePlayback(formatSleepTimerStartAnnouncement(minutes));
      }
      return started;
    },
    [announcePlayback, startSleepTimer]
  );

  const handleCancelSleepTimer = useCallback(() => {
    sleepTimerCancelledByUserRef.current = true;
    cancelSleepTimer();
    announcePlayback(formatSleepTimerCancelAnnouncement());
  }, [announcePlayback, cancelSleepTimer]);

  const handleStartWakeTimer = useCallback(
    (minutes: number) => {
      const started = startWakeTimer(minutes);
      if (started) {
        announcePlayback(formatWakeTimerStartAnnouncement(minutes));
      }
      return started;
    },
    [announcePlayback, startWakeTimer]
  );

  const handleCancelWakeTimer = useCallback(() => {
    wakeTimerCancelledByUserRef.current = true;
    cancelWakeTimer();
    announcePlayback(formatWakeTimerCancelAnnouncement());
  }, [announcePlayback, cancelWakeTimer]);

  const handleStartCustomWakeTimer = useCallback(() => {
    const parsed = Number.parseInt(customWakeMinutes, 10);
    if (!Number.isFinite(parsed)) {
      setCustomWakeError('请输入有效的分钟数。');
      return;
    }

    const minutes = clampWakeTimerMinutes(parsed);
    if (minutes !== parsed) {
      setCustomWakeError(`请输入 ${WAKE_TIMER_MIN_MINUTES}–${WAKE_TIMER_MAX_MINUTES} 之间的整数。`);
      return;
    }

    setCustomWakeError(null);
    handleStartWakeTimer(minutes);
  }, [customWakeMinutes, handleStartWakeTimer]);

  const handleStartSleepClockTimer = useCallback(() => {
    const parsed = parseSleepClockTimeInput(sleepClockTime);
    if (!parsed) {
      setSleepClockError('请选择有效的时刻。');
      return;
    }

    const started = startSleepTimerAtClock(parsed.hour, parsed.minute);
    if (!started) {
      setSleepClockError('请选择至少 1 分钟后的停止时刻。');
      return;
    }

    setSleepClockError(null);
    announcePlayback(formatSleepTimerClockStartAnnouncement(parsed.hour, parsed.minute));
  }, [announcePlayback, sleepClockTime, startSleepTimerAtClock]);

  const handleStartWakeClockTimer = useCallback(() => {
    const parsed = parseWakeClockTimeInput(wakeClockTime);
    if (!parsed) {
      setWakeClockError('请选择有效的时刻。');
      return;
    }

    const started = startWakeTimerAtClock(parsed.hour, parsed.minute);
    if (!started) {
      setWakeClockError('请选择至少 1 分钟后的叫醒时刻。');
      return;
    }

    setWakeClockError(null);
    announcePlayback(formatWakeTimerClockStartAnnouncement(parsed.hour, parsed.minute));
  }, [announcePlayback, startWakeTimerAtClock, wakeClockTime]);

  const handleMasterVolumeSliderChange = useCallback(
    (value: number) => {
      const volume = value / 100;
      const percent = Math.round(volume * 100);

      setMixer((state) => setMasterVolume(state, volume));

      if (shouldAnnounceMasterVolumePercent(lastAnnouncedMasterPercentRef.current, percent)) {
        announcePlayback(formatMasterVolumeAnnouncement(volume));
        lastAnnouncedMasterPercentRef.current = percent;
      }
    },
    [announcePlayback, setMixer]
  );

  const handleMasterVolumeSliderCommit = useCallback(
    (value: number) => {
      const volume = value / 100;
      const percent = Math.round(volume * 100);

      if (lastAnnouncedMasterPercentRef.current === percent) {
        return;
      }

      announcePlayback(formatMasterVolumeAnnouncement(volume));
      lastAnnouncedMasterPercentRef.current = percent;
    },
    [announcePlayback]
  );

  useEffect(() => {
    const wasActive = sleepTimerWasActiveRef.current;
    sleepTimerWasActiveRef.current = sleepTimerActive;

    if (wasActive && !sleepTimerActive && !sleepTimerCancelledByUserRef.current) {
      announcePlayback(formatSleepTimerCompleteAnnouncement());
    }

    if (!sleepTimerActive) {
      sleepTimerCancelledByUserRef.current = false;
    }
  }, [announcePlayback, sleepTimerActive]);

  useEffect(() => {
    const wasActive = wakeTimerWasActiveRef.current;
    wakeTimerWasActiveRef.current = wakeTimerActive;

    if (wasActive && !wakeTimerActive && !wakeTimerCancelledByUserRef.current) {
      announcePlayback(formatWakeTimerCompleteAnnouncement());
    }

    if (!wakeTimerActive) {
      wakeTimerCancelledByUserRef.current = false;
    }
  }, [announcePlayback, wakeTimerActive]);

  const handlePlayToggleWithAnnouncement = useCallback(async () => {
    const nextPlaying = !mixer.isPlaying;
    await handlePlayToggle();
    announcePlayback(formatPlayToggleAnnouncement(nextPlaying));
  }, [announcePlayback, handlePlayToggle, mixer.isPlaying]);

  const applySceneById = useCallback(
    (sceneId: FlagshipSceneId) => {
      const scene = getFlagshipSceneById(sceneId);
      if (!scene) {
        return;
      }

      setActiveSceneId(sceneId);
      writeFlagshipSceneId(sceneId);
      setMixer((state) => applyFlagshipScene(state, scene));
      announcePlayback(`已切换至 ${scene.title}`);
    },
    [announcePlayback, setMixer]
  );

  const handleSelectScene = useCallback(
    (sceneId: FlagshipSceneId) => {
      applySceneById(sceneId);
    },
    [applySceneById]
  );

  const handleSwipeScene = useCallback(
    (direction: 1 | -1) => {
      applySceneById(getAdjacentFlagshipScene(activeSceneId, direction).id);
    },
    [activeSceneId, applySceneById]
  );

  useEffect(() => {
    if (initialSceneAppliedRef.current || mixer.layers.length > 0) {
      return;
    }

    initialSceneAppliedRef.current = true;
    const scene = getFlagshipSceneById(activeSceneId) ?? getFlagshipSceneById(DEFAULT_FLAGSHIP_SCENE_ID)!;
    setMixer((state) => applyFlagshipScene(state, scene));
  }, [activeSceneId, mixer.layers.length, setMixer]);

  const activeScene = getFlagshipSceneById(activeSceneId) ?? getFlagshipSceneById(DEFAULT_FLAGSHIP_SCENE_ID)!;
  const timerDockLabel =
    sleepTimerActive || wakeTimerActive
      ? sleepTimerActive
        ? `${sleepTimerFading ? '渐出' : '睡眠'} ${sleepTimerRemainingLabel}`
        : `${wakeTimerFading ? '渐入' : '唤醒'} ${wakeTimerRemainingLabel}`
      : null;

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
        setMixer((state) => {
          const nextVolume = adjustMasterVolumeStep(state.masterVolume, delta);
          const percent = Math.round(nextVolume * 100);
          announcePlayback(formatMasterVolumeAnnouncement(nextVolume));
          lastAnnouncedMasterPercentRef.current = percent;
          return setMasterVolume(state, nextVolume);
        });
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
    const started = handleStartSleepTimer(minutes);
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
    <main className="studio-page studio-immersive">
      <p
        className="sr-only"
        role="status"
        aria-label="混音播放状态"
        aria-live="polite"
        aria-atomic="true"
      >
        {playbackAnnouncement}
      </p>
      <header className="immersive-topbar">
        <span className="immersive-topbar__brand">{APP_DISPLAY_NAME}</span>
        <div className="immersive-topbar__actions">
          {android ? (
            <button
              className="immersive-topbar__btn studio-menu-btn"
              type="button"
              aria-expanded={navOpen}
              onClick={() => setNavOpen(true)}
            >
              菜单
              {updateAvailable ? <span className="studio-menu-btn__badge" aria-hidden /> : null}
            </button>
          ) : (
            <>
              <Link className="immersive-topbar__btn" to="/" state={{ fromIntro: true }}>
                介绍
              </Link>
              <Link className="immersive-topbar__btn" to="/settings">
                设置
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </header>

      <ImmersiveSceneStage
        activeSceneId={activeSceneId}
        activeScene={activeScene}
        isPlaying={mixer.isPlaying}
        timerLabel={timerDockLabel}
        activeLayerCount={activeCount}
        onSelectScene={handleSelectScene}
        onSwipeScene={handleSwipeScene}
        onPlayToggle={() => void handlePlayToggleWithAnnouncement()}
        onOpenTimer={() => setDrawerOpen(true)}
        onOpenMixer={() => setDrawerOpen(true)}
      />

      {android ? <AndroidNavDrawer open={navOpen} onClose={() => setNavOpen(false)} /> : null}

      <KeyboardShortcutsDialog open={keyboardHelpOpen} onClose={() => setKeyboardHelpOpen(false)} />

      <BottomDrawer open={drawerOpen} title="混音与导入" onClose={() => setDrawerOpen(false)}>
        <p className="drawer-hint drawer-hint--muted">桌面端按 <kbd>?</kbd> 可查看键盘快捷键。</p>

        <section className="drawer-section" aria-labelledby="drawer-sounds-title">
          <h3 id="drawer-sounds-title">更多环境声</h3>
          <p className="drawer-hint">在精选场景之外自由叠加、混搭任意内置或导入音频。</p>
          <label className="studio-sound-search">
            <span className="sr-only">搜索环境声</span>
            <input
              aria-label="搜索环境声"
              className="studio-sound-search-input"
              placeholder="搜索名称或描述…"
              type="search"
              value={soundSearchQuery}
              onChange={(event) => setSoundSearchQuery(event.target.value)}
            />
          </label>
          {soundSearchActive && visibleSounds.length === 0 ? (
            <p className="studio-sound-search-empty" aria-live="polite">
              没有匹配「{soundSearchQuery.trim()}」的环境声，请换个关键词。
            </p>
          ) : null}
          <div className="sound-grid sound-grid--drawer">
            {visibleSounds.map((sound) => {
              const selected = mixer.layers.some((layer) => layer.soundId === sound.id);
              const accent = sound.kind === 'built-in' ? sound.accent : '#a78bfa';
              const icon = sound.kind === 'built-in' ? sound.icon : '🎵';
              const subtitle =
                sound.kind === 'built-in' ? sound.subtitle : `${formatBytes(sound.size)} · ${sound.fileName}`;

              return (
                <button
                  className={`sound-card sound-card--drawer ${selected ? 'selected' : ''}`}
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
          <p className="drawer-hint">
            保存当前声轨组合与主音量，一键切换专注、睡眠等固定搭配。同名再次保存会覆盖该预设；可复制或重命名预设而不改声轨（最多 12 个）。
          </p>
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
                  {renamingPresetId === preset.id ? (
                    <form
                      className="mixer-preset-rename"
                      onSubmit={(event) => {
                        event.preventDefault();
                        renameMixerPreset(preset.id, renamingPresetName);
                        setRenamingPresetId(null);
                        setRenamingPresetName('');
                      }}
                    >
                      <input
                        aria-label={`重命名预设 ${preset.name}`}
                        autoFocus
                        className="mixer-preset-name-input"
                        maxLength={40}
                        type="text"
                        value={renamingPresetName}
                        onChange={(event) => setRenamingPresetName(event.target.value)}
                      />
                      <div className="mixer-preset-rename-actions">
                        <button className="studio-btn studio-btn--secondary" type="submit">
                          保存
                        </button>
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() => {
                            setRenamingPresetId(null);
                            setRenamingPresetName('');
                          }}
                        >
                          取消
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
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
                        aria-label={`复制预设 ${preset.name}`}
                        className="ghost-button mixer-preset-duplicate"
                        type="button"
                        onClick={() => duplicateMixerPreset(preset.id)}
                      >
                        复制
                      </button>
                      <button
                        aria-label={`重命名预设 ${preset.name}`}
                        className="ghost-button mixer-preset-rename-trigger"
                        type="button"
                        onClick={() => {
                          setRenamingPresetId(preset.id);
                          setRenamingPresetName(preset.name);
                        }}
                      >
                        重命名
                      </button>
                      <button
                        aria-label={`删除预设 ${preset.name}`}
                        className="ghost-button mixer-preset-delete"
                        type="button"
                        onClick={() => deleteMixerPreset(preset.id)}
                      >
                        删除
                      </button>
                    </>
                  )}
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

        <section className="drawer-section" aria-labelledby="drawer-playback-fade-title">
          <h3 id="drawer-playback-fade-title">播放渐入</h3>
          <p className="drawer-hint">
            开始播放时主音量从静音渐强，适合睡眠、哄娃等避免突然起声的场景（默认关闭，与睡眠定时渐出无关）。
          </p>
          <p className="drawer-hint sleep-timer-fade-label" id="playback-fade-in-label">
            渐入时长
          </p>
          <div
            className="sleep-timer-presets sleep-timer-fade-presets"
            role="group"
            aria-labelledby="playback-fade-in-label"
          >
            {PLAYBACK_FADE_IN_PRESETS_SECONDS.map((seconds) => (
              <button
                key={seconds}
                aria-pressed={playbackFadeInSeconds === seconds}
                className="studio-btn studio-btn--secondary sleep-timer-preset"
                type="button"
                onClick={() => setPlaybackFadeInSeconds(seconds)}
              >
                {seconds === PLAYBACK_FADE_IN_OFF ? '关' : `${seconds} 秒`}
              </button>
            ))}
          </div>
        </section>

        {screenWakeLockSupported ? (
          <section className="drawer-section" aria-labelledby="drawer-wake-lock-title">
            <h3 id="drawer-wake-lock-title">屏幕常亮</h3>
            <p className="drawer-hint">
              播放时防止屏幕自动熄灭，适合床头、婴儿房等需要长时间看着混音台或锁屏界面的场景（仅在本机生效，暂停后自动释放）。
            </p>
            <div className="app-page-actions">
              <button
                aria-pressed={screenWakeLockEnabled}
                className="studio-btn studio-btn--secondary"
                type="button"
                onClick={() => setScreenWakeLockEnabled(!screenWakeLockEnabled)}
              >
                {screenWakeLockEnabled ? '播放时保持常亮：开' : '播放时保持常亮：关'}
              </button>
            </div>
          </section>
        ) : null}

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
                  handleStartSleepTimer(minutes);
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
          <form
            className="sleep-timer-custom"
            onSubmit={(event) => {
              event.preventDefault();
              handleStartSleepClockTimer();
            }}
          >
            <label className="sleep-timer-custom-label" htmlFor="sleep-timer-clock-time">
              按时刻停止
            </label>
            <div className="sleep-timer-custom-row">
              <input
                aria-describedby={sleepClockError ? 'sleep-timer-clock-error' : 'sleep-timer-clock-hint'}
                aria-invalid={sleepClockError ? true : undefined}
                className="sleep-timer-custom-input sleep-timer-clock-input"
                id="sleep-timer-clock-time"
                type="time"
                value={sleepClockTime}
                onChange={(event) => {
                  setSleepClockTime(event.target.value);
                  setSleepClockError(null);
                }}
              />
              <button className="studio-btn studio-btn--secondary" type="submit">
                开始
              </button>
            </div>
            <p className="drawer-hint" id="sleep-timer-clock-hint">
              例如设置 23:00，将在该时刻（若已过则为次日）渐弱并暂停；与上方「N 分钟后」二选一。
            </p>
            {sleepClockError ? (
              <p className="sleep-timer-custom-error" id="sleep-timer-clock-error" role="alert">
                {sleepClockError}
              </p>
            ) : null}
          </form>
          {sleepTimerActive ? (
            <div className="sleep-timer-active">
              <p aria-live="polite">
                {sleepTimerFading ? '正在渐出…' : '剩余'} {sleepTimerRemainingLabel}
              </p>
              <button className="ghost-button" type="button" onClick={handleCancelSleepTimer}>
                取消睡眠定时
              </button>
            </div>
          ) : null}
        </section>

        <section className="drawer-section" aria-labelledby="drawer-wake-timer-title">
          <h3 id="drawer-wake-timer-title">唤醒定时</h3>
          <p className="drawer-hint">
            到时自动开始播放（若已暂停）并在 {wakeTimerFadeSeconds} 秒内将主音量从静音渐强至当前设定，适合午睡后或清晨温和叫醒。
          </p>
          <p className="drawer-hint sleep-timer-fade-label" id="wake-timer-fade-label">
            渐入时长
          </p>
          <div
            className="sleep-timer-presets sleep-timer-fade-presets"
            role="group"
            aria-labelledby="wake-timer-fade-label"
          >
            {WAKE_TIMER_FADE_PRESETS_SECONDS.map((seconds) => (
              <button
                key={seconds}
                aria-pressed={wakeTimerFadeSeconds === seconds}
                className="studio-btn studio-btn--secondary sleep-timer-preset"
                type="button"
                onClick={() => setWakeTimerFadeSeconds(seconds)}
              >
                {seconds} 秒
              </button>
            ))}
          </div>
          <div className="sleep-timer-presets" role="group" aria-label="唤醒定时预设">
            {WAKE_TIMER_PRESETS_MINUTES.map((minutes) => (
              <button
                key={minutes}
                className="studio-btn studio-btn--secondary sleep-timer-preset"
                type="button"
                onClick={() => {
                  setCustomWakeError(null);
                  handleStartWakeTimer(minutes);
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
              handleStartCustomWakeTimer();
            }}
          >
            <label className="sleep-timer-custom-label" htmlFor="wake-timer-custom-minutes">
              自定义时长（分钟）
            </label>
            <div className="sleep-timer-custom-row">
              <input
                aria-describedby={customWakeError ? 'wake-timer-custom-error' : 'wake-timer-custom-hint'}
                aria-invalid={customWakeError ? true : undefined}
                className="sleep-timer-custom-input"
                id="wake-timer-custom-minutes"
                inputMode="numeric"
                max={WAKE_TIMER_MAX_MINUTES}
                min={WAKE_TIMER_MIN_MINUTES}
                type="number"
                value={customWakeMinutes}
                onChange={(event) => {
                  setCustomWakeMinutes(event.target.value);
                  setCustomWakeError(null);
                }}
              />
              <button className="studio-btn studio-btn--secondary" type="submit">
                开始
              </button>
            </div>
            <p className="drawer-hint" id="wake-timer-custom-hint">
              支持 {WAKE_TIMER_MIN_MINUTES}–{WAKE_TIMER_MAX_MINUTES} 分钟，例如午睡 90 分钟后渐强叫醒。
            </p>
            {customWakeError ? (
              <p className="sleep-timer-custom-error" id="wake-timer-custom-error" role="alert">
                {customWakeError}
              </p>
            ) : null}
          </form>
          <form
            className="sleep-timer-custom"
            onSubmit={(event) => {
              event.preventDefault();
              handleStartWakeClockTimer();
            }}
          >
            <label className="sleep-timer-custom-label" htmlFor="wake-timer-clock-time">
              按时刻叫醒
            </label>
            <div className="sleep-timer-custom-row">
              <input
                aria-describedby={wakeClockError ? 'wake-timer-clock-error' : 'wake-timer-clock-hint'}
                aria-invalid={wakeClockError ? true : undefined}
                className="sleep-timer-custom-input sleep-timer-clock-input"
                id="wake-timer-clock-time"
                type="time"
                value={wakeClockTime}
                onChange={(event) => {
                  setWakeClockTime(event.target.value);
                  setWakeClockError(null);
                }}
              />
              <button className="studio-btn studio-btn--secondary" type="submit">
                开始
              </button>
            </div>
            <p className="drawer-hint" id="wake-timer-clock-hint">
              例如设置 07:30，将在该时刻（若已过则为次日）渐强叫醒；与上方「N 分钟后」二选一。
            </p>
            {wakeClockError ? (
              <p className="sleep-timer-custom-error" id="wake-timer-clock-error" role="alert">
                {wakeClockError}
              </p>
            ) : null}
          </form>
          {wakeTimerActive ? (
            <div className="sleep-timer-active">
              <p aria-live="polite">
                {wakeTimerFading ? '正在渐入…' : '剩余'} {wakeTimerRemainingLabel}
              </p>
              <button className="ghost-button" type="button" onClick={handleCancelWakeTimer}>
                取消唤醒定时
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
              onChange={handleMasterVolumeSliderChange}
              onCommit={handleMasterVolumeSliderCommit}
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
