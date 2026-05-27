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
import { setPlaying, type MixerState } from '../domain/mixer';
import { BUILT_IN_SOUNDS } from '../domain/sounds';
import {
  deleteCustomTrack,
  listCustomTracks,
  revokeCustomTrackUrls,
  saveCustomTrack,
  type CustomTrack
} from '../storage/customLibrary';
import { useSleepTimerController } from '../hooks/useSleepTimerController';
import { StudioProvider, type StudioContextValue } from './StudioContext';

export function AppLayout() {
  const [mixer, setMixer] = useState<MixerState>(() => hydrateMixerState(readMixerSnapshot()));
  const [customTracks, setCustomTracks] = useState<CustomTrack[]>([]);
  const [importStatus, setImportStatus] = useState('支持 MP3、WAV、M4A 等浏览器可解码音频');
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
      setImportStatus('音频启动失败，请重新点击播放或更换导入文件。');
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

    setImportStatus(`正在导入 ${file.name}...`);
    try {
      await saveCustomTrack(file);
      const tracks = await listCustomTracks();
      replaceCustomTracks(tracks);
      setImportStatus(`${file.name} 已持久化到本机音频库。`);
    } catch {
      setImportStatus('导入失败：当前环境无法保存该文件。');
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

  const studioValue: StudioContextValue = {
    mixer,
    setMixer,
    customTracks,
    importStatus,
    allSounds,
    selectedLayers,
    handleImport,
    handleDeleteCustomTrack,
    handlePlayToggle,
    sleepTimerRemainingLabel: sleepTimerController.remainingLabel,
    sleepTimerActive: sleepTimerController.isActive,
    sleepTimerFading: sleepTimerController.isFading,
    startSleepTimer: sleepTimerController.startPreset,
    cancelSleepTimer: sleepTimerController.cancel
  };

  return (
    <StudioProvider value={studioValue}>
      <Outlet />
    </StudioProvider>
  );
}
