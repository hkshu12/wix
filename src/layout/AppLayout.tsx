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
import { useMixerShareDeepLink } from '../hooks/useMixerShareDeepLink';
import { createInitialMixerState, setPlaying, type MixerState } from '../domain/mixer';
import { BUILT_IN_SOUNDS } from '../domain/sounds';
import {
  deleteCustomTrack,
  listCustomTracks,
  revokeCustomTrackUrls,
  saveCustomTrack,
  type CustomTrack
} from '../storage/customLibrary';
import {
  deleteMixerPreset,
  readMixerPresets,
  saveMixerPreset,
  type MixerPreset
} from '../storage/mixerPresets';
import { formatFileReadPercent } from '../lib/readFileWithProgress';
import { useMediaSessionSync } from '../hooks/useMediaSessionSync';
import { useSleepTimerController } from '../hooks/useSleepTimerController';
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

  const sleepTimerController = useSleepTimerController({ mixer, setMixer });

  const allSounds = useMemo<PlayableSound[]>(() => [...BUILT_IN_SOUNDS, ...customTracks], [customTracks]);
  const selectedLayers = mixer.layers
    .map((layer) => ({ layer, sound: allSounds.find((sound) => sound.id === layer.soundId) }))
    .filter((entry): entry is { layer: MixerState['layers'][number]; sound: PlayableSound } => Boolean(entry.sound));

  function replaceCustomTracks(nextTracks: CustomTrack[]) {
    revokeCustomTrackUrls(customTracksRef.current);
    customTracksRef.current = nextTracks;
    setCustomTracks(nextTracks);
  }

  function getAudioEngine() {
    engineRef.current ??= new AudioEngine();
    return engineRef.current;
  }

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

    void engineRef.current
      ?.sync(mixer, allSounds)
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
  }, [allSounds, mixer]);

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
    setImportStatus(`已保存预设「${result.preset.name}」。`);
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

  useMixerShareDeepLink({
    pathname: location.pathname,
    search: location.search,
    navigate,
    ready: customTracksReady,
    onImportShare: handleImportMixerShare
  });

  const handleClearAllAppData = useCallback(async () => {
    sleepTimerController.cancel();
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
  }, [sleepTimerController]);

  async function handleCopyMixerShareLink() {
    const text = serializeMixerShare(mixer);
    const url = buildMixerShareUrl({
      origin: window.location.origin,
      basePath: import.meta.env.BASE_URL,
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
    handleDeleteCustomTrack,
    handlePlayToggle,
    sleepTimerRemainingLabel: sleepTimerController.remainingLabel,
    sleepTimerActive: sleepTimerController.isActive,
    sleepTimerFading: sleepTimerController.isFading,
    sleepTimerFadeSeconds: sleepTimerController.fadeSeconds,
    setSleepTimerFadeSeconds: sleepTimerController.setFadeSeconds,
    startSleepTimer: sleepTimerController.start,
    cancelSleepTimer: sleepTimerController.cancel,
    mixerPresets,
    saveMixerPreset: handleSaveMixerPreset,
    loadMixerPreset: handleLoadMixerPreset,
    deleteMixerPreset: handleDeleteMixerPreset,
    copyMixerShare: handleCopyMixerShare,
    copyMixerShareLink: handleCopyMixerShareLink,
    pasteMixerShareFromClipboard: handlePasteMixerShareFromClipboard,
    importMixerShare: handleImportMixerShare,
    failedSoundIds,
    retryLayerLoad,
    clearAllAppData: handleClearAllAppData
  };

  return (
    <UpdateProvider>
      <StudioProvider value={studioValue}>
        <Outlet />
      </StudioProvider>
    </UpdateProvider>
  );
}
