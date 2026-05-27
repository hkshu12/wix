import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
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
import { setPlaying, type MixerState } from '../domain/mixer';
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
import { useSleepTimerController } from '../hooks/useSleepTimerController';
import { StudioProvider, type StudioContextValue } from './StudioContext';
import { UpdateProvider } from './UpdateContext';

export function AppLayout() {
  const [mixer, setMixer] = useState<MixerState>(() => hydrateMixerState(readMixerSnapshot()));
  const [customTracks, setCustomTracks] = useState<CustomTrack[]>([]);
  const [importStatus, setImportStatus] = useState('支持 MP3、WAV、M4A 等浏览器可解码音频');
  const [importProgress, setImportProgress] = useState<number | null>(null);
  const [mixerPresets, setMixerPresets] = useState<MixerPreset[]>(() => readMixerPresets());
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
        }
      })
      .catch(() => setImportStatus('无法读取已导入音频，请检查浏览器存储权限。'));

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

    void engineRef.current?.sync(mixer, allSounds).catch(() => {
      setMixer((state) => setPlaying(state, false));
      setImportStatus('音频加载失败（已自动重试），请检查网络后重新播放或更换文件。');
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

  async function handlePlayToggle() {
    if (!mixer.isPlaying) {
      await getAudioEngine().resume();
    }

    setMixer((state) => setPlaying(state, !state.isPlaying));
  }

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

  function handleImportMixerShare(text: string) {
    const result = parseMixerShare(text);
    if (!result.ok) {
      const messages: Record<typeof result.reason, string> = {
        empty: '请粘贴混音分享码后再导入。',
        'invalid-json': '分享码不是有效的 JSON，请检查后重试。',
        'wrong-type': '不是白噪音混音器的分享码。',
        'unsupported-version': '分享码版本过新，请更新应用后再导入。',
        'invalid-payload': '分享码内容无效或已损坏。'
      };
      setImportStatus(messages[result.reason]);
      return;
    }

    const allowedSoundIds = new Set(allSounds.map((sound) => sound.id));
    const requestedCount = result.snapshot.layers.length;
    const next = applyMixerPreset(mixer, result.snapshot, allowedSoundIds);
    const appliedCount = next.layers.length;
    const skipped = requestedCount - appliedCount;

    setMixer(next);

    if (appliedCount === 0) {
      setImportStatus(
        skipped > 0
          ? '已导入，但分享码中的声轨在本机不可用（多为自定义音频），未添加任何轨道。'
          : '已导入空的混音配方。'
      );
      return;
    }

    setImportStatus(
      skipped > 0
        ? `已导入混音（${appliedCount} 轨）；${skipped} 轨因本机无对应音频已跳过。`
        : `已导入混音（${appliedCount} 轨）。`
    );
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
    startSleepTimer: sleepTimerController.startPreset,
    cancelSleepTimer: sleepTimerController.cancel,
    mixerPresets,
    saveMixerPreset: handleSaveMixerPreset,
    loadMixerPreset: handleLoadMixerPreset,
    deleteMixerPreset: handleDeleteMixerPreset,
    copyMixerShare: handleCopyMixerShare,
    pasteMixerShareFromClipboard: handlePasteMixerShareFromClipboard,
    importMixerShare: handleImportMixerShare
  };

  return (
    <UpdateProvider>
      <StudioProvider value={studioValue}>
        <Outlet />
      </StudioProvider>
    </UpdateProvider>
  );
}
