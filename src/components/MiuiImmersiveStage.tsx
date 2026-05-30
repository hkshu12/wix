import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { assetUrl } from '../lib/assetUrl';
import type { MiuiScene, MiuiSceneId } from '../domain/miuiScenes';
import { MIUI_SCENES } from '../domain/miuiScenes';

const SWIPE_THRESHOLD_PX = 48;

interface MiuiImmersiveStageProps {
  activeSceneId: MiuiSceneId;
  activeScene: MiuiScene;
  isPlaying: boolean;
  timerLabel: string | null;
  onSelectScene: (id: MiuiSceneId) => void;
  onSwipeScene: (direction: 1 | -1) => void;
  onPlayToggle: () => void;
  onOpenTimer: () => void;
  onOpenMixer: () => void;
  activeLayerCount: number;
}

export function MiuiImmersiveStage({
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
}: MiuiImmersiveStageProps) {
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
      className="miui-stage"
      aria-label="MIUI 白噪音场景"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        touchStartY.current = null;
      }}
    >
      {MIUI_SCENES.map((scene) => (
        <div
          key={scene.id}
          className={`miui-stage__backdrop ${scene.id === activeSceneId ? 'miui-stage__backdrop--active' : ''}`}
          style={{ backgroundImage: `url(${assetUrl(scene.backgroundSrc)})` }}
          aria-hidden
        />
      ))}

      <div className="miui-stage__scrim" aria-hidden />

      <div className="miui-stage__hero">
        <h2 className="miui-stage__title">{activeScene.title}</h2>
        <p className="miui-stage__subtitle">{activeScene.subtitle}</p>
        <p className="miui-stage__hint">上下滑动切换场景</p>
      </div>

      <nav className="miui-scene-picker" aria-label="场景选择">
        {MIUI_SCENES.map((scene) => {
          const selected = scene.id === activeSceneId;
          return (
            <button
              key={scene.id}
              type="button"
              className={`miui-scene-picker__item ${selected ? 'miui-scene-picker__item--active' : ''}`}
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

      <footer className="miui-stage__controls" aria-label="播放控制">
        <button
          type="button"
          className={`miui-stage__timer ${timerLabel ? 'miui-stage__timer--active' : ''}`}
          aria-label={timerLabel ? `定时：${timerLabel}` : '睡眠定时'}
          onClick={onOpenTimer}
        >
          <span className="miui-stage__timer-icon" aria-hidden>
            ⏱
          </span>
          <span className="miui-stage__timer-label">{timerLabel ?? '定时'}</span>
        </button>

        <button
          type="button"
          className="miui-stage__play"
          aria-label={isPlaying ? '暂停' : '播放'}
          onClick={onPlayToggle}
        >
          <span aria-hidden>{isPlaying ? '❚❚' : '▶'}</span>
        </button>

        <button
          type="button"
          className="miui-stage__mixer"
          aria-label="混音"
          onClick={onOpenMixer}
        >
          <span aria-hidden>混音</span>
          {activeLayerCount > 0 ? (
            <span className="miui-stage__mixer-badge" aria-hidden>
              {activeLayerCount}
            </span>
          ) : null}
        </button>
      </footer>
    </section>
  );
}
