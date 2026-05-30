import type { BuiltInSoundId } from './sounds';

export type MiuiSceneId = 'forest' | 'summer-night' | 'beach' | 'rain' | 'fireplace';

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

/** Five flagship scenes from MIUI White Noise (森林 / 夏夜 / 海滩 / 细雨 / 炉火). */
export const MIUI_SCENES: MiuiScene[] = [
  {
    id: 'forest',
    title: '森林',
    subtitle: '树叶、微风与远处鸟鸣',
    backgroundSrc: 'miui/scenes/forest.jpg',
    iconSrc: 'miui/icons/scene-0.png',
    iconActiveSrc: 'miui/icons/scene-0-active.png',
    layers: [{ soundId: 'forest', volume: 0.72 }]
  },
  {
    id: 'summer-night',
    title: '夏夜',
    subtitle: '蛙鸣、虫声与远处闷雷',
    backgroundSrc: 'miui/scenes/summer-night.jpg',
    iconSrc: 'miui/icons/scene-1.png',
    iconActiveSrc: 'miui/icons/scene-1-active.png',
    layers: [
      { soundId: 'thunder', volume: 0.42 },
      { soundId: 'forest', volume: 0.38 }
    ]
  },
  {
    id: 'beach',
    title: '海滩',
    subtitle: '潮汐起伏的浪声',
    backgroundSrc: 'miui/scenes/beach.jpg',
    iconSrc: 'miui/icons/scene-2.png',
    iconActiveSrc: 'miui/icons/scene-2-active.png',
    layers: [{ soundId: 'ocean', volume: 0.75 }]
  },
  {
    id: 'rain',
    title: '细雨',
    subtitle: '密集雨滴与窗外氛围',
    backgroundSrc: 'miui/scenes/rain.jpg',
    iconSrc: 'miui/icons/scene-3.png',
    iconActiveSrc: 'miui/icons/scene-3-active.png',
    layers: [{ soundId: 'rain', volume: 0.78 }]
  },
  {
    id: 'fireplace',
    title: '炉火',
    subtitle: '温暖室内燃烧声',
    backgroundSrc: 'miui/scenes/fireplace.jpg',
    iconSrc: 'miui/icons/scene-4.png',
    iconActiveSrc: 'miui/icons/scene-4-active.png',
    layers: [{ soundId: 'fireplace', volume: 0.7 }]
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
