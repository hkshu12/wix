import type { BuiltInSoundId } from './sounds';

export type FlagshipSceneId = 'summer-rain' | 'forest' | 'fireplace' | 'ocean';

export interface FlagshipSceneLayer {
  soundId: BuiltInSoundId;
  volume: number;
}

export interface FlagshipScene {
  id: FlagshipSceneId;
  title: string;
  subtitle: string;
  backgroundSrc: string;
  iconSrc: string;
  iconActiveSrc: string;
  layers: FlagshipSceneLayer[];
}

export const FLAGSHIP_SCENES: FlagshipScene[] = [
  {
    id: 'summer-rain',
    title: '夏雨',
    subtitle: '六月与夏雨的邂逅',
    backgroundSrc: 'immersive/scenes/summer-rain.jpg',
    iconSrc: 'immersive/icons/summer-rain.png',
    iconActiveSrc: 'immersive/icons/summer-rain-active.png',
    layers: [
      { soundId: 'river', volume: 0.68 },
      { soundId: 'summer-rain', volume: 0.72 },
      { soundId: 'rain-on-leaves', volume: 0.55 }
    ]
  },
  {
    id: 'forest',
    title: '森林',
    subtitle: '把你的秘密藏进森林',
    backgroundSrc: 'immersive/scenes/forest.jpg',
    iconSrc: 'immersive/icons/forest.png',
    iconActiveSrc: 'immersive/icons/forest-active.png',
    layers: [
      { soundId: 'birds', volume: 0.62 },
      { soundId: 'forest', volume: 0.75 },
      { soundId: 'stream', volume: 0.58 }
    ]
  },
  {
    id: 'fireplace',
    title: '炉火',
    subtitle: '温暖冬日的闲暇时光',
    backgroundSrc: 'immersive/scenes/fireplace.jpg',
    iconSrc: 'immersive/icons/fireplace.png',
    iconActiveSrc: 'immersive/icons/fireplace-active.png',
    layers: [
      { soundId: 'clock-tick', volume: 0.45 },
      { soundId: 'fireplace', volume: 0.72 },
      { soundId: 'window-wind', volume: 0.42 }
    ]
  },
  {
    id: 'ocean',
    title: '海洋',
    subtitle: '海边漫步的气息',
    backgroundSrc: 'immersive/scenes/ocean.jpg',
    iconSrc: 'immersive/icons/ocean.png',
    iconActiveSrc: 'immersive/icons/ocean-active.png',
    layers: [
      { soundId: 'air-hum', volume: 0.35 },
      { soundId: 'ocean-near', volume: 0.72 },
      { soundId: 'ocean-far', volume: 0.65 }
    ]
  }
];

export function getFlagshipSceneById(id: FlagshipSceneId): FlagshipScene | undefined {
  return FLAGSHIP_SCENES.find((scene) => scene.id === id);
}

export function getFlagshipSceneIndex(id: FlagshipSceneId): number {
  return FLAGSHIP_SCENES.findIndex((scene) => scene.id === id);
}

export function getAdjacentFlagshipScene(id: FlagshipSceneId, direction: 1 | -1): FlagshipScene {
  const index = getFlagshipSceneIndex(id);
  const next = (index + direction + FLAGSHIP_SCENES.length) % FLAGSHIP_SCENES.length;
  return FLAGSHIP_SCENES[next]!;
}
