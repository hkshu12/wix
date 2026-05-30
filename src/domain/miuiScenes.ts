import type { BuiltInSoundId } from './sounds';

/** Built-in scenes shipped in com.miui.whitenoise (from APK prebuilt_scene_config.json). */
export type MiuiSceneId = 'summer-rain' | 'forest' | 'fireplace' | 'ocean';

export interface MiuiSceneLayer {
  soundId: BuiltInSoundId;
  volume: number;
}

export interface MiuiScene {
  id: MiuiSceneId;
  title: string;
  subtitle: string;
  backgroundSrc: string;
  iconSrc: string;
  iconActiveSrc: string;
  layers: MiuiSceneLayer[];
}

/**
 * Scene order and copy match the APK `assets/scene/prebuilt_scene_config.json`.
 * Line-audio layers are mapped to the closest built-in CC0 loops in this project.
 */
export const MIUI_SCENES: MiuiScene[] = [
  {
    id: 'summer-rain',
    title: '夏雨',
    subtitle: '六月与夏雨的邂逅',
    backgroundSrc: 'miui/scenes/summer-rain.jpg',
    iconSrc: 'miui/icons/summer-rain.png',
    iconActiveSrc: 'miui/icons/summer-rain-active.png',
    layers: [
      { soundId: 'stream', volume: 0.68 },
      { soundId: 'rain', volume: 0.72 },
      { soundId: 'thunder', volume: 0.38 }
    ]
  },
  {
    id: 'forest',
    title: '森林',
    subtitle: '把你的秘密藏进森林',
    backgroundSrc: 'miui/scenes/forest.jpg',
    iconSrc: 'miui/icons/forest.png',
    iconActiveSrc: 'miui/icons/forest-active.png',
    layers: [
      { soundId: 'forest', volume: 0.75 },
      { soundId: 'stream', volume: 0.58 }
    ]
  },
  {
    id: 'fireplace',
    title: '炉火',
    subtitle: '温暖冬日的闲暇时光',
    backgroundSrc: 'miui/scenes/fireplace.jpg',
    iconSrc: 'miui/icons/fireplace.png',
    iconActiveSrc: 'miui/icons/fireplace-active.png',
    layers: [
      { soundId: 'fireplace', volume: 0.72 },
      { soundId: 'fan', volume: 0.42 }
    ]
  },
  {
    id: 'ocean',
    title: '海洋',
    subtitle: '海边漫步的气息',
    backgroundSrc: 'miui/scenes/ocean.jpg',
    iconSrc: 'miui/icons/ocean.png',
    iconActiveSrc: 'miui/icons/ocean-active.png',
    layers: [{ soundId: 'ocean', volume: 0.78 }]
  }
];

export function getMiuiSceneById(id: MiuiSceneId): MiuiScene | undefined {
  return MIUI_SCENES.find((scene) => scene.id === id);
}

export function getMiuiSceneIndex(id: MiuiSceneId): number {
  return MIUI_SCENES.findIndex((scene) => scene.id === id);
}

export function getAdjacentMiuiScene(id: MiuiSceneId, direction: 1 | -1): MiuiScene {
  const index = getMiuiSceneIndex(id);
  const next = (index + direction + MIUI_SCENES.length) % MIUI_SCENES.length;
  return MIUI_SCENES[next]!;
}
