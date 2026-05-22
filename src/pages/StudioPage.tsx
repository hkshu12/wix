import { Link } from 'react-router-dom';
import { Slider } from '../components/Slider';
import {
  setGlobalPlaybackRate,
  setLayerControl,
  setMasterVolume,
  setStereoWidth,
  toggleLayer
} from '../domain/mixer';
import { useStudio } from '../layout/StudioContext';
import { ThemeToggle } from '../theme/ThemeToggle';
import './StudioPage.css';

export function StudioPage() {
  const {
    mixer,
    setMixer,
    importStatus,
    allSounds,
    selectedLayers,
    handleImport,
    handleDeleteCustomTrack,
    handlePlayToggle
  } = useStudio();

  return (
    <main className="studio-page">
      <header className="studio-topbar">
        <div className="studio-topbar-start">
          <img className="studio-mark" src="/icon.svg" alt="" width={28} height={28} />
          <span className="studio-title">白噪音混音器</span>
        </div>
        <div className="studio-topbar-actions">
          <button className="studio-btn studio-btn--primary" type="button" onClick={() => void handlePlayToggle()}>
            {mixer.isPlaying ? '暂停' : '播放'}
          </button>
          <label className="studio-btn studio-btn--secondary">
            导入
            <input
              aria-label="导入自定义音乐"
              type="file"
              accept="audio/*"
              onChange={(event) => void handleImport(event.target.files)}
            />
          </label>
          <Link className="studio-btn studio-btn--ghost" to="/" state={{ fromIntro: true }}>
            介绍
          </Link>
          <ThemeToggle />
        </div>
        <p className="studio-import-status">{importStatus}</p>
      </header>

      <section className="studio-grid">
        <section className="panel catalog-panel" aria-labelledby="catalog-title">
          <div className="panel-heading">
            <h2 id="catalog-title">选择并混合声音</h2>
          </div>
          <div className="sound-grid">
            {allSounds.map((sound) => {
              const selected = mixer.layers.some((layer) => layer.soundId === sound.id);
              const accent = sound.kind === 'built-in' ? sound.accent : '#a78bfa';
              const icon = sound.kind === 'built-in' ? sound.icon : '🎵';
              const subtitle =
                sound.kind === 'built-in' ? sound.subtitle : `${formatBytes(sound.size)} · ${sound.fileName}`;

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

function formatBytes(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
