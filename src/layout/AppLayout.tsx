import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AudioEngine } from '../audio/AudioEngine';
import type { PlayableSound } from '../audio/audioGraphPlan';
import {
  hydrateMixerState,
  readMixerSnapshot,
  writeMixerSnapshot,
  filterMixerLayersToSounds
} from '../storage/mixerSnapshot';
import { applyMixerPreset } from '../domain/applyMixerPreset';
import { parseMixerShare, serializeMixerShare } from '../domain/mixerShare';
import { buildMixerShareUrl } from '../domain/mixerShareUrl';
import { resolveMixerShareLinkBuildTarget } from '../domain/androidAppUrl';
import { useAndroidMixerShareDeepLink } from '../hooks/useAndroidMixerShareDeepLink';
import { useMixerShareDeepLink } from '../hooks/useMixerShareDeepLink';
import { createInitialMixerState, setPlaying, type MixerState } from '../domain/mixer';
import { BUILT_IN_SOUNDS } from '../domain/sounds';
import {
  deleteCustomTrack,
  importStoredCustomTrack,
  listCustomTracks,
  listStoredCustomTracks,
  revokeCustomTrackUrls,
  saveCustomTrack,
  type CustomTrack
} from '../storage/customLibrary';
import {
  downloadCustomLibraryBackup,
  formatCustomLibraryBackupFilename,
  parseCustomLibraryBackup,
  serializeCustomLibraryBackup
} from '../domain/customLibraryBackup';
import {
  downloadMixerPresetsBackup,
  formatMixerPresetsBackupFilename,
  parseMixerPresetsBackup,
  serializeMixerPresetsBackup
} from '../domain/mixerPresetsBackup';
import {
  downloadFullAppBackup,
  formatFullAppBackupFilename,
  parseFullAppBackup,
  serializeFullAppBackup
} from '../domain/fullAppBackup';
import {
  deleteMixerPreset,
  readMixerPresets,
  renameMixerPreset,
  replaceMixerPresets,
  saveMixerPreset,
  type MixerPreset
} from '../storage/mixerPresets';
import { formatFileReadPercent } from '../lib/readFileWithProgress';
import { isAndroidApp } from '../lib/platform';
import { useAutoplay } from '../hooks/useAutoplay';
import { useAudioContextResume } from '../hooks/useAudioContextResume';
import { useMediaSessionSync } from '../hooks/useMediaSessionSync';
import { useScreenWakeLock } from '../hooks/useScreenWakeLock';
import { clampPlaybackFadeInSeconds } from '../domain/playbackFadeIn';
import { isScreenWakeLockSupported } from '../domain/screenWakeLock';
import { useSleepTimerController } from '../hooks/useSleepTimerController';
import type { TimerAudioFade } from '../hooks/timerAudioFade';
import { useWakeTimerController } from '../hooks/useWakeTimerController';
import {
  readPlaybackFadeInSeconds,
  writePlaybackFadeInSeconds
} from '../storage/playbackFadeInPreferences';
import {
  readScreenWakeLockEnabled,
  writeScreenWakeLockEnabled
} from '../storage/screenWakeLockPreferences';
import { clearAllAppData as clearPersistedAppData } from '../storage/clearAppData';
import { StudioProvider, type StudioContextValue } from './StudioContext';
import { UpdateProvider } from './UpdateContext';

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mixer, setMixer] = useState<MixerState>(() => hydrateMixerState(readMixerSnapshot()));
  const [customTracks, setCustomTracks] = useState<CustomTrack[]>([]);
  const [customTracksReady, setCustomTracksReady] = useState(false);
  const [importStatus, setImportStatus] = useState('支持 MP3、WAV、M4A 等浏览器可解码音频');
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [mixerPresets, setMixerPresets] = useState<MixerPreset[]>(() => readMixerPresets());
  const [failedSoundIds, setFailedSoundIds] = useState<string[]>([]);
  const engineRef = useRef<AudioEngine | null>(null);
  const customTracksRef = useRef<CustomTrack[]>([]);
  const wasPlayingRef = useRef(mixer.isPlaying);
  const [playbackFadeInSeconds, setPlaybackFadeInSecondsState] = useState(readPlaybackFadeInSeconds);
  const [screenWakeLockEnabled, setScreenWakeLockEnabledState] = useState(readScreenWakeLockEnabled);
  const screenWakeLockSupported = isScreenWakeLockSupported();

  function getAudioEngine() {
    engineRef.current ??= new AudioEngine();
    return engineRef.current;
  }

  const timerAudio = useMemo<TimerAudioFade>(
    () => ({
      scheduleMasterRamp(fromVolume, toVolume, durationSeconds) {
        const engine = getAudioEngine();
        engine.setMasterVolumeImmediate(fromVolume);
        engine.scheduleMasterVolumeRamp(toVolume, durationSeconds);
      },
      setMasterVolumeImmediate(volume) {
        getAudioEngine().setMasterVolumeImmediate(volume);
      }
    }),
    []
  );

  const wakeTimerController = useWakeTimerController({ mixer, setMixer, timerAudio });
  const sleepTimerController = useSleepTimerController({ mixer, setMixer, timerAudio });

  const startSleepTimerWithExclusion = useCallback(
    (minutes: number) => {
      wakeTimerController.cancel();
      return sleepTimerController.start(minutes);
    },
    [sleepTimerController, wakeTimerController]
  );

  const startSleepTimerAtClockWithExclusion = useCallback(
    (hour: number, minute: number) => {
      wakeTimerController.cancel();
      return sleepTimerController.startAtClock(hour, minute);
    },
    [sleepTimerController, wakeTimerController]
  );

  const startWakeTimerWithExclusion = useCallback(
    (minutes: number) => {
      sleepTimerController.cancel();
      return wakeTimerController.start(minutes);
    },
    [sleepTimerController, wakeTimerController]
  );

  const startWakeTimerAtClockWithExclusion = useCallback(
    (hour: number, minute: number) => {
      sleepTimerController.cancel();
      return wakeTimerController.startAtClock(hour, minute);
    },
    [sleepTimerController, wakeTimerController]
  );

  useScreenWakeLock(screenWakeLockEnabled, mixer.isPlaying);

  function setPlaybackFadeInSeconds(seconds: number) {
    const clamped = clampPlaybackFadeInSeconds(seconds);
    writePlaybackFadeInSeconds(clamped);
    setPlaybackFadeInSecondsState(clamped);
  }

  function setScreenWakeLockEnabled(enabled: boolean) {
    writeScreenWakeLockEnabled(enabled);
    setScreenWakeLockEnabledState(enabled);
  }

  const allSounds = useMemo<PlayableSound[]>(() => [...BUILT_IN_SOUNDS, ...customTracks], [customTracks]);
  const mixerRef = useRef(mixer);
  const allSoundsRef = useRef(allSounds);
  const selectedLayers = mixer.layers
    .map((layer) => ({ layer, sound: allSounds.find((sound) => sound.id === layer.soundId) }))
    .filter((entry): entry is { layer: MixerState['layers'][number]; sound: PlayableSound } => Boolean(entry.sound));

  function replaceCustomTracks(nextTracks: CustomTrack[]) {
    revokeCustomTrackUrls(customTracksRef.current);
    customTracksRef.current = nextTracks;
    setCustomTracks(nextTracks);
  }

  const resumeAudio = useCallback(async () => {
    await getAudioEngine().resume();
  }, []);

  const { primeAudioContext } = useAutoplay({
    mixer,
    setMixer,
    customTracksReady,
    resumeAudio
  });

  useEffect(() => {
    mixerRef.current = mixer;
  }, [mixer]);

  useEffect(() => {
    allSoundsRef.current = allSounds;
  }, [allSounds]);

  const handleAudioContextResume = useCallback(async () => {
    const engine = engineRef.current;
    const currentMixer = mixerRef.current;
    if (!engine || !currentMixer.isPlaying) {
      return;
    }

    await engine.resume();
    const result = await engine.sync(currentMixer, allSoundsRef.current);
    setFailedSoundIds(result.failedSoundIds);
  }, []);

  useAudioContextResume(mixer.isPlaying, handleAudioContextResume);

  useEffect(() => {
    let cancelled = false;

    listCustomTracks()
      .then((tracks) => {
        if (!cancelled) {
          replaceCustomTracks(tracks);
          const allowedSoundIds = new Set([
            ...BUILT_IN_SOUNDS.map((sound) => sound.id),
            ...tracks.map((track) => track.id)
          ]);
          setMixer((state) => filterMixerLayersToSounds(state, allowedSoundIds));
          setCustomTracksReady(true);
        }
      })
      .catch(() => {
        setImportStatus('无法读取已导入音频，请检查浏览器存储权限。');
        if (!cancelled) {
          setCustomTracksReady(true);
        }
      });

    return () => {
      cancelled = true;
      revokeCustomTrackUrls(customTracksRef.current);
      customTracksRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!engineRef.current && mixer.isPlaying) {
      getAudioEngine();
    }

    const fadeInSeconds =
      mixer.isPlaying && !wasPlayingRef.current && playbackFadeInSeconds > 0 ? playbackFadeInSeconds : 0;
    wasPlayingRef.current = mixer.isPlaying;

    void engineRef.current
      ?.sync(mixer, allSounds, { fadeInSeconds })
      .then((result) => {
        if (!result) {
          return;
        }

        setFailedSoundIds(result.failedSoundIds);
        if (result.failedSoundIds.length === 0) {
          return;
        }

        const allLayersFailed =
          mixer.layers.length > 0 &&
          mixer.layers.every((layer) => result.failedSoundIds.includes(layer.soundId));

        if (allLayersFailed && mixer.isPlaying) {
          setMixer((state) => setPlaying(state, false));
          setImportStatus('环境声加载失败（已自动重试），可在混音台点击「重试」或检查网络。');
          return;
        }

        setImportStatus('部分环境声加载失败，可在混音台为对应轨道点击「重试」。');
      })
      .catch(() => {
        setFailedSoundIds([]);
        setMixer((state) => setPlaying(state, false));
        setImportStatus('音频加载失败，请检查网络后重新播放或更换文件。');
      });

    return () => {
      if (!mixer.isPlaying) {
        engineRef.current?.stop();
      }
    };
  }, [allSounds, mixer, playbackFadeInSeconds]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      writeMixerSnapshot(mixer);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [mixer]);

  async function handleImport(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    setImportStatus(`正在读取 ${file.name}…`);
    setImportProgress(0);
    try {
      await saveCustomTrack(file, {
        onReadProgress: (progress) => {
          setImportProgress(formatFileReadPercent(progress));
        }
      });
      const tracks = await listCustomTracks();
      replaceCustomTracks(tracks);
      setImportStatus(`${file.name} 已持久化到本机音频库。`);
    } catch {
      setImportStatus('导入失败：当前环境无法保存该文件。');
    } finally {
      setImportProgress(null);
    }
  }

  async function handleExportCustomLibrary(): Promise<string> {
    const storedTracks = await listStoredCustomTracks();
    if (storedTracks.length === 0) {
      return '暂无自定义音频可导出。';
    }

    const exportedAt = Date.now();
    const json = serializeCustomLibraryBackup(storedTracks, exportedAt);
    downloadCustomLibraryBackup(json, formatCustomLibraryBackupFilename(exportedAt));
    return `已导出 ${storedTracks.length} 个自定义音频。`;
  }

  async function handleImportCustomLibraryBackup(fileList: FileList | null): Promise<string> {
    const file = fileList?.[0];
    if (!file) {
      return '';
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      return '无法读取备份文件，请重试。';
    }

    const result = parseCustomLibraryBackup(text);
    if (!result.ok) {
      const messages: Record<typeof result.reason, string> = {
        empty: '备份文件为空，请选择有效的 wix 自定义音频备份。',
        'invalid-json': '备份文件不是有效的 JSON，请检查后重试。',
        'wrong-type': '不是 wix 自定义音频备份文件。',
        'unsupported-version': '备份版本过新，请更新应用后再导入。',
        'invalid-payload': '备份内容无效或已损坏。'
      };
      return messages[result.reason];
    }

    for (const track of result.tracks) {
      await importStoredCustomTrack(track);
    }

    const tracks = await listCustomTracks();
    replaceCustomTracks(tracks);
    const allowedSoundIds = new Set([
      ...BUILT_IN_SOUNDS.map((sound) => sound.id),
      ...tracks.map((track) => track.id)
    ]);
    setMixer((state) => filterMixerLayersToSounds(state, allowedSoundIds));
    return `已从备份导入 ${result.tracks.length} 个自定义音频。`;
  }

  function handleExportMixerPresets(): string {
    const presets = readMixerPresets();
    if (presets.length === 0) {
      return '暂无场景预设可导出。';
    }

    const exportedAt = Date.now();
    const json = serializeMixerPresetsBackup(presets, exportedAt);
    downloadMixerPresetsBackup(json, formatMixerPresetsBackupFilename(exportedAt));
    return `已导出 ${presets.length} 个场景预设。`;
  }

  async function handleImportMixerPresetsBackup(fileList: FileList | null): Promise<string> {
    const file = fileList?.[0];
    if (!file) {
      return '';
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      return '无法读取备份文件，请重试。';
    }

    const result = parseMixerPresetsBackup(text);
    if (!result.ok) {
      const messages: Record<typeof result.reason, string> = {
        empty: '备份文件为空，请选择有效的 wix 场景预设备份。',
        'invalid-json': '备份文件不是有效的 JSON，请检查后重试。',
        'wrong-type': '不是 wix 场景预设备份文件。',
        'unsupported-version': '备份版本过新，请更新应用后再导入。',
        'invalid-payload': '备份内容无效或已损坏。'
      };
      return messages[result.reason];
    }

    replaceMixerPresets(result.presets);
    refreshMixerPresets();
    return `已从备份恢复 ${result.presets.length} 个场景预设。`;
  }

  async function handleExportFullAppBackup(): Promise<string> {
    const storedTracks = await listStoredCustomTracks();
    const presets = readMixerPresets();

    if (storedTracks.length === 0 && presets.length === 0) {
      return '暂无自定义音频或场景预设可导出。';
    }

    const exportedAt = Date.now();
    const json = serializeFullAppBackup(storedTracks, presets, exportedAt);
    if (!json) {
      return '暂无自定义音频或场景预设可导出。';
    }

    downloadFullAppBackup(json, formatFullAppBackupFilename(exportedAt));
    const parts: string[] = [];
    if (storedTracks.length > 0) {
      parts.push(`${storedTracks.length} 个自定义音频`);
    }
    if (presets.length > 0) {
      parts.push(`${presets.length} 个场景预设`);
    }
    return `已导出完整备份（${parts.join('、')}）。`;
  }

  async function handleImportFullAppBackup(fileList: FileList | null): Promise<string> {
    const file = fileList?.[0];
    if (!file) {
      return '';
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      return '无法读取备份文件，请重试。';
    }

    const result = parseFullAppBackup(text);
    if (!result.ok) {
      const messages: Record<typeof result.reason, string> = {
        empty: '备份文件为空，请选择有效的 wix 完整备份。',
        'invalid-json': '备份文件不是有效的 JSON，请检查后重试。',
        'wrong-type': '不是 wix 完整备份文件。',
        'unsupported-version': '备份版本过新，请更新应用后再导入。',
        'invalid-payload': '备份内容无效或已损坏。',
        'nothing-to-export': '备份内容无效或已损坏。'
      };
      return messages[result.reason];
    }

    if (result.tracks.length > 0) {
      for (const track of result.tracks) {
        await importStoredCustomTrack(track);
      }

      const tracks = await listCustomTracks();
      replaceCustomTracks(tracks);
      const allowedSoundIds = new Set([
        ...BUILT_IN_SOUNDS.map((sound) => sound.id),
        ...tracks.map((track) => track.id)
      ]);
      setMixer((state) => filterMixerLayersToSounds(state, allowedSoundIds));
    }

    if (result.presets.length > 0) {
      replaceMixerPresets(result.presets);
      refreshMixerPresets();
    }

    const parts: string[] = [];
    if (result.tracks.length > 0) {
      parts.push(`${result.tracks.length} 个自定义音频`);
    }
    if (result.presets.length > 0) {
      parts.push(`${result.presets.length} 个场景预设`);
    }
    return `已从完整备份恢复 ${parts.join('、')}。`;
  }

  async function handleDeleteCustomTrack(track: CustomTrack) {
    await deleteCustomTrack(track.id);
    setMixer((state) => ({
      ...state,
      layers: state.layers.filter((layer) => layer.soundId !== track.id)
    }));
    replaceCustomTracks(await listCustomTracks());
  }

  const handlePlayToggle = useCallback(async () => {
    if (!mixer.isPlaying) {
      await getAudioEngine().resume();
    }

    setMixer((state) => setPlaying(state, !state.isPlaying));
  }, [mixer.isPlaying]);

  const retryLayerLoad = useCallback(
    (soundId: string) => {
      const sound = allSounds.find((entry) => entry.id === soundId);
      if (!sound) {
        return;
      }

      getAudioEngine().invalidateCachedBuffer(sound);

      if (!mixer.isPlaying) {
        setImportStatus(`已清除缓存，开始播放时将重新加载「${sound.title}」。`);
        return;
      }

      setImportStatus(`正在重新加载「${sound.title}」…`);

      void getAudioEngine()
        .sync(mixer, allSounds)
        .then((result) => {
          setFailedSoundIds(result.failedSoundIds);
          if (result.failedSoundIds.includes(soundId)) {
            setImportStatus(`「${sound.title}」仍无法加载，请检查网络后重试。`);
            return;
          }

          setImportStatus(`「${sound.title}」已重新加载。`);
        })
        .catch(() => {
          setImportStatus(`「${sound.title}」加载失败，请稍后重试。`);
        });
    },
    [allSounds, mixer]
  );

  const mediaSessionTrackTitles = useMemo(
    () => selectedLayers.map(({ sound }) => sound.title),
    [selectedLayers]
  );

  const mediaSessionSleepLabel = sleepTimerController.isActive
    ? sleepTimerController.remainingLabel
    : null;

  const mediaSessionWakeLabel = wakeTimerController.isActive
    ? wakeTimerController.remainingLabel
    : null;

  const handleMediaSessionPlay = useCallback(() => {
    if (!mixer.isPlaying) {
      void handlePlayToggle();
    }
  }, [handlePlayToggle, mixer.isPlaying]);

  const handleMediaSessionPause = useCallback(() => {
    if (mixer.isPlaying) {
      void handlePlayToggle();
    }
  }, [handlePlayToggle, mixer.isPlaying]);

  useMediaSessionSync({
    isPlaying: mixer.isPlaying,
    trackTitles: mediaSessionTrackTitles,
    sleepTimerLabel: mediaSessionSleepLabel,
    wakeTimerLabel: mediaSessionWakeLabel,
    onPlay: handleMediaSessionPlay,
    onPause: handleMediaSessionPause
  });

  function refreshMixerPresets() {
    setMixerPresets(readMixerPresets());
  }

  function handleSaveMixerPreset(name: string) {
    const result = saveMixerPreset(name, mixer);
    if (!result.ok) {
      if (result.reason === 'empty-name') {
        setImportStatus('请输入预设名称后再保存。');
      } else {
        setImportStatus('预设已满（最多 12 个），请先删除旧预设。');
      }
      return;
    }

    refreshMixerPresets();
    setImportStatus(
      result.overwritten
        ? `已更新预设「${result.preset.name}」（同名覆盖）。`
        : `已保存预设「${result.preset.name}」。`
    );
  }

  function handleLoadMixerPreset(id: string) {
    const preset = mixerPresets.find((entry) => entry.id === id);
    if (!preset) {
      return;
    }

    const allowedSoundIds = new Set(allSounds.map((sound) => sound.id));
    setMixer((state) => applyMixerPreset(state, preset, allowedSoundIds));
    setImportStatus(`已加载预设「${preset.name}」。`);
  }

  function handleRenameMixerPreset(id: string, name: string) {
    const result = renameMixerPreset(id, name);
    if (!result.ok) {
      if (result.reason === 'empty-name') {
        setImportStatus('请输入预设名称后再重命名。');
      } else if (result.reason === 'duplicate-name') {
        setImportStatus('已有同名预设，请换一个名称。');
      }
      return;
    }

    refreshMixerPresets();
    setImportStatus(`已将预设重命名为「${result.preset.name}」。`);
  }

  function handleDeleteMixerPreset(id: string) {
    const preset = mixerPresets.find((entry) => entry.id === id);
    deleteMixerPreset(id);
    refreshMixerPresets();
    if (preset) {
      setImportStatus(`已删除预设「${preset.name}」。`);
    }
  }

  async function handlePasteMixerShareFromClipboard(): Promise<string | null> {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text.trim()) {
          setImportStatus('已从剪贴板填入分享码，点击导入混音即可。');
          return text;
        }
      }
    } catch {
      // fall through
    }

    setImportStatus('无法读取剪贴板，请手动粘贴到下方输入框。');
    return null;
  }

  async function handleCopyMixerShare() {
    const text = serializeMixerShare(mixer);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setImportStatus('混音配方已复制到剪贴板，可粘贴给好友导入。');
        return;
      }
    } catch {
      // fall through to manual copy hint
    }

    setImportStatus('无法写入剪贴板，请手动复制下方分享码。');
  }

  const handleImportMixerShare = useCallback(
    (text: string) => {
      const result = parseMixerShare(text);
      if (!result.ok) {
        const messages: Record<typeof result.reason, string> = {
          empty: '请粘贴混音分享码后再导入。',
          'invalid-json': '分享码不是有效的 JSON，请检查后重试。',
          'wrong-type': '不是 wix 的分享码。',
          'unsupported-version': '分享码版本过新，请更新应用后再导入。',
          'invalid-payload': '分享码内容无效或已损坏。'
        };
        setImportStatus(messages[result.reason]);
        return;
      }

      const allowedSoundIds = new Set(allSounds.map((sound) => sound.id));
      const requestedCount = result.snapshot.layers.length;
      setMixer((current) => {
        const next = applyMixerPreset(current, result.snapshot, allowedSoundIds);
        const appliedCount = next.layers.length;
        const skipped = requestedCount - appliedCount;

        if (appliedCount === 0) {
          setImportStatus(
            skipped > 0
              ? '已导入，但分享码中的声轨在本机不可用（多为自定义音频），未添加任何轨道。'
              : '已导入空的混音配方。'
          );
          return next;
        }

        setImportStatus(
          skipped > 0
            ? `已导入混音（${appliedCount} 轨）；${skipped} 轨因本机无对应音频已跳过。`
            : `已导入混音（${appliedCount} 轨）。`
        );
        return next;
      });
    },
    [allSounds]
  );

  useAndroidMixerShareDeepLink(navigate);

  useMixerShareDeepLink({
    pathname: location.pathname,
    search: location.search,
    navigate,
    ready: customTracksReady,
    onImportShare: handleImportMixerShare
  });

  const handleClearAllAppData = useCallback(async () => {
    sleepTimerController.cancel();
    wakeTimerController.cancel();
    engineRef.current?.stop();
    revokeCustomTrackUrls(customTracksRef.current);
    replaceCustomTracks([]);
    setMixer(createInitialMixerState());
    setMixerPresets([]);
    setFailedSoundIds([]);
    setImportStatus('支持 MP3、WAV、M4A 等浏览器可解码音频');
    setImportProgress(null);
    await clearPersistedAppData();
    window.location.reload();
  }, [sleepTimerController, wakeTimerController]);

  async function handleCopyMixerShareLink() {
    const text = serializeMixerShare(mixer);
    const { origin, basePath } = resolveMixerShareLinkBuildTarget({
      windowOrigin: window.location.origin,
      appBasePath: import.meta.env.BASE_URL,
      isAndroidApp: isAndroidApp()
    });
    const url = buildMixerShareUrl({
      origin,
      basePath,
      shareJson: text
    });

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setImportStatus('分享链接已复制，好友打开即可导入混音。');
        return;
      }
    } catch {
      // fall through
    }

    setImportStatus('无法写入剪贴板，请手动复制浏览器地址栏中的分享链接。');
  }

  const studioValue: StudioContextValue = {
    mixer,
    setMixer,
    customTracks,
    importStatus,
    importProgress,
    allSounds,
    selectedLayers,
    handleImport,
    exportCustomLibrary: handleExportCustomLibrary,
    importCustomLibraryBackup: handleImportCustomLibraryBackup,
    exportMixerPresets: handleExportMixerPresets,
    importMixerPresetsBackup: handleImportMixerPresetsBackup,
    exportFullAppBackup: handleExportFullAppBackup,
    importFullAppBackup: handleImportFullAppBackup,
    handleDeleteCustomTrack,
    handlePlayToggle,
    sleepTimerRemainingLabel: sleepTimerController.remainingLabel,
    sleepTimerActive: sleepTimerController.isActive,
    sleepTimerFading: sleepTimerController.isFading,
    sleepTimerFadeSeconds: sleepTimerController.fadeSeconds,
    setSleepTimerFadeSeconds: sleepTimerController.setFadeSeconds,
    playbackFadeInSeconds,
    setPlaybackFadeInSeconds,
    screenWakeLockEnabled,
    screenWakeLockSupported,
    setScreenWakeLockEnabled,
    startSleepTimer: startSleepTimerWithExclusion,
    startSleepTimerAtClock: startSleepTimerAtClockWithExclusion,
    cancelSleepTimer: sleepTimerController.cancel,
    wakeTimerRemainingLabel: wakeTimerController.remainingLabel,
    wakeTimerActive: wakeTimerController.isActive,
    wakeTimerFading: wakeTimerController.isFading,
    wakeTimerFadeSeconds: wakeTimerController.fadeSeconds,
    setWakeTimerFadeSeconds: wakeTimerController.setFadeSeconds,
    startWakeTimer: startWakeTimerWithExclusion,
    startWakeTimerAtClock: startWakeTimerAtClockWithExclusion,
    cancelWakeTimer: wakeTimerController.cancel,
    mixerPresets,
    saveMixerPreset: handleSaveMixerPreset,
    loadMixerPreset: handleLoadMixerPreset,
    renameMixerPreset: handleRenameMixerPreset,
    deleteMixerPreset: handleDeleteMixerPreset,
    copyMixerShare: handleCopyMixerShare,
    copyMixerShareLink: handleCopyMixerShareLink,
    pasteMixerShareFromClipboard: handlePasteMixerShareFromClipboard,
    importMixerShare: handleImportMixerShare,
    failedSoundIds,
    retryLayerLoad,
    clearAllAppData: handleClearAllAppData,
    primeAudioContext
  };

  return (
    <UpdateProvider>
      <StudioProvider value={studioValue}>
        <Outlet />
      </StudioProvider>
    </UpdateProvider>
  );
}
