import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { assetUrl } from '../lib/assetUrl';
import { FLAGSHIP_SCENES, type FlagshipScene, type FlagshipSceneId } from '../domain/flagshipScenes';

const SWIPE_THRESHOLD_PX = 48;

interface ImmersiveSceneStageProps {
  activeSceneId: FlagshipSceneId;
  activeScene: FlagshipScene;
  isPlaying: boolean;
  timerLabel: string | null;
  onSelectScene: (id: FlagshipSceneId) => void;
  onSwipeScene: (direction: 1 | -1) => void;
  onPlayToggle: () => void;
  onOpenTimer: () => void;
  onOpenMixer: () => void;
  activeLayerCount: number;
}

export function ImmersiveSceneStage({
  activeSceneId,
  activeScene,
  isPlaying,
  timerLabel,
  onSelectScene,
  onSwipeScene,
  onPlayToggle,
  onOpenTimer,
  onOpenMixer,
  activeLayerCount
}: ImmersiveSceneStageProps) {
  const touchStartY = useRef<number | null>(null);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    touchStartY.current = event.clientY;
  }, []);

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (touchStartY.current == null) {
        return;
      }

      const delta = event.clientY - touchStartY.current;
      touchStartY.current = null;

      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) {
        return;
      }

      onSwipeScene(delta < 0 ? 1 : -1);
    },
    [onSwipeScene]
  );

  return (
    <section
      className="immersive-stage"
      aria-label="沉浸式场景"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        touchStartY.current = null;
      }}
    >
      {FLAGSHIP_SCENES.map((scene) => (
        <div
          key={scene.id}
          className={`immersive-stage__backdrop ${scene.id === activeSceneId ? 'immersive-stage__backdrop--active' : ''}`}
          style={{ backgroundImage: `url(${assetUrl(scene.backgroundSrc)})` }}
          aria-hidden
        />
      ))}

      <div className="immersive-stage__scrim" aria-hidden />

      <div className="immersive-stage__hero">
        <h2 className="immersive-stage__title">{activeScene.title}</h2>
        <p className="immersive-stage__subtitle">{activeScene.subtitle}</p>
        <p className="immersive-stage__hint">上下滑动切换场景</p>
      </div>

      <nav className="immersive-scene-picker" aria-label="场景选择">
        {FLAGSHIP_SCENES.map((scene) => {
          const selected = scene.id === activeSceneId;
          return (
            <button
              key={scene.id}
              type="button"
              className={`immersive-scene-picker__item ${selected ? 'immersive-scene-picker__item--active' : ''}`}
              aria-label={scene.title}
              aria-pressed={selected}
              onClick={() => onSelectScene(scene.id)}
            >
              <img
                src={assetUrl(selected ? scene.iconActiveSrc : scene.iconSrc)}
                alt=""
                width={40}
                height={40}
              />
            </button>
          );
        })}
      </nav>

      <footer className="immersive-stage__controls" aria-label="播放控制">
        <button
          type="button"
          className={`immersive-stage__timer ${timerLabel ? 'immersive-stage__timer--active' : ''}`}
          aria-label={timerLabel ? `定时：${timerLabel}` : '睡眠定时'}
          onClick={onOpenTimer}
        >
          <span className="immersive-stage__timer-icon" aria-hidden>
            ⏱
          </span>
          <span className="immersive-stage__timer-label">{timerLabel ?? '定时'}</span>
        </button>

        <button
          type="button"
          className="immersive-stage__play"
          aria-label={isPlaying ? '暂停' : '播放'}
          onClick={onPlayToggle}
        >
          <span aria-hidden>{isPlaying ? '❚❚' : '▶'}</span>
        </button>

        <button
          type="button"
          className="immersive-stage__mixer"
          aria-label="混音"
          onClick={onOpenMixer}
        >
          <span aria-hidden>混音</span>
          {activeLayerCount > 0 ? (
            <span className="immersive-stage__mixer-badge" aria-hidden>
              {activeLayerCount}
            </span>
          ) : null}
        </button>
      </footer>
    </section>
  );
}
