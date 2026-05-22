import { useEffect, useMemo, useRef, useState } from 'react';
import { AudioEngine } from './audio/AudioEngine';
import type { PlayableSound } from './audio/audioGraphPlan';
import {
  createInitialMixerState,
  setGlobalPlaybackRate,
  setLayerControl,
  setMasterVolume,
  setPlaying,
  setStereoWidth,
  toggleLayer,
  type MixerState
} from './domain/mixer';
import { BUILT_IN_SOUNDS } from './domain/sounds';
import {
  deleteCustomTrack,
  listCustomTracks,
  revokeCustomTrackUrls,
  saveCustomTrack,
  type CustomTrack
} from './storage/customLibrary';
import './App.css';

const heroStats = [
  ['8', '内置声景'],
  ['∞', '可叠加混音'],
  ['PWA', '离线安装'],
  ['APK', '安卓封装']
];

export default function App() {
  const [mixer, setMixer] = useState<MixerState>(() => createInitialMixerState());
  const [customTracks, setCustomTracks] = useState<CustomTrack[]>([]);
  const [importStatus, setImportStatus] = useState('支持 MP3、WAV、M4A 等浏览器可解码音频');
  const engineRef = useRef<AudioEngine | null>(null);
  const customTracksRef = useRef<CustomTrack[]>([]);

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

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Cross-platform ambient studio</p>
          <h1>白噪音混音器</h1>
          <p className="hero-text">
            将雨声、海浪、篝火、壁炉与自定义音乐叠加成专属声景。所有版本共享同一套 Web Audio
            核心，可安装为 PWA，并通过 Capacitor 打包到 Android。
          </p>
          <div className="hero-actions">
            <button
              className="primary-action"
              type="button"
              onClick={() => void handlePlayToggle()}
            >
              {mixer.isPlaying ? '暂停播放' : '开始播放'}
            </button>
            <label className="secondary-action">
              导入自定义音乐
              <input
                aria-label="导入自定义音乐"
                type="file"
                accept="audio/*"
                onChange={(event) => void handleImport(event.target.files)}
              />
            </label>
          </div>
          <p className="import-status">{importStatus}</p>
        </div>
        <div className="hero-card" aria-label="应用能力概览">
          {heroStats.map(([value, label]) => (
            <div className="stat-card" key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="studio-grid">
        <section className="panel catalog-panel" aria-labelledby="catalog-title">
          <div className="panel-heading">
            <p className="eyebrow">Sound palette</p>
            <h2 id="catalog-title">选择并混合声音</h2>
          </div>
          <div className="sound-grid">
            {allSounds.map((sound) => {
              const selected = mixer.layers.some((layer) => layer.soundId === sound.id);
              const accent = sound.kind === 'built-in' ? sound.accent : '#a78bfa';
              const icon = sound.kind === 'built-in' ? sound.icon : '🎵';
              const subtitle = sound.kind === 'built-in' ? sound.subtitle : `${formatBytes(sound.size)} · ${sound.fileName}`;

              return (
                <button
                  className={`sound-card ${selected ? 'selected' : ''}`}
                  key={sound.id}
                  style={{ '--accent': accent } as React.CSSProperties}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setMixer((state) => toggleLayer(state, sound.id))}
                >
                  <span className="sound-icon">{icon}</span>
                  <span>
                    <strong>{sound.title}</strong>
                    <small>{subtitle}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel mixer-panel" aria-label="当前混音轨道">
          <div className="panel-heading">
            <p className="eyebrow">Live mix</p>
            <h2>混音控制台</h2>
          </div>

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
                <span>🎚️</span>
                <p>从左侧选择一个或多个声音开始混音。</p>
              </div>
            ) : (
              selectedLayers.map(({ layer, sound }) => (
                <article className="layer-card" key={layer.soundId}>
                  <div className="layer-title">
                    <span>{sound.kind === 'built-in' ? sound.icon : '🎵'}</span>
                    <div>
                      <h3>{sound.title}</h3>
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
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function Slider({ label, value, min, max, onChange }: SliderProps) {
  return (
    <label className="slider-row">
      <span>{label}</span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
      <output>{value}</output>
    </label>
  );
}

function formatBytes(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
