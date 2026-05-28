export type BuiltInSoundId =
  | 'campfire'
  | 'rain'
  | 'ocean'
  | 'fireplace'
  | 'thunder'
  | 'forest'
  | 'brown-noise'
  | 'pink-noise'
  | 'fan'
  | 'cafe'
  | 'train'
  | 'highway'
  | 'airplane'
  | 'office';

export interface BuiltInSound {
  id: BuiltInSoundId;
  kind: 'built-in';
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  /** Path under `public/`, e.g. `sounds/rain.ogg` */
  src: string;
}

export const BUILT_IN_SOUNDS: BuiltInSound[] = [
  {
    id: 'campfire',
    kind: 'built-in',
    title: '篝火',
    subtitle: '跳动木柴与轻微爆裂',
    icon: '🔥',
    accent: '#ff9f43',
    src: 'sounds/campfire.ogg'
  },
  {
    id: 'rain',
    kind: 'built-in',
    title: '雨声',
    subtitle: '密集雨滴与窗外氛围',
    icon: '🌧️',
    accent: '#60a5fa',
    src: 'sounds/rain.ogg'
  },
  {
    id: 'ocean',
    kind: 'built-in',
    title: '海边',
    subtitle: '潮汐般起伏的浪声',
    icon: '🌊',
    accent: '#22d3ee',
    src: 'sounds/ocean.ogg'
  },
  {
    id: 'fireplace',
    kind: 'built-in',
    title: '壁炉',
    subtitle: '温暖室内燃烧声',
    icon: '🪵',
    accent: '#fb7185',
    src: 'sounds/fireplace.ogg'
  },
  {
    id: 'thunder',
    kind: 'built-in',
    title: '远雷',
    subtitle: '低频滚动与雨夜空间',
    icon: '⛈️',
    accent: '#818cf8',
    src: 'sounds/thunder.ogg'
  },
  {
    id: 'forest',
    kind: 'built-in',
    title: '森林',
    subtitle: '树叶、微风与远处鸟鸣',
    icon: '🌲',
    accent: '#34d399',
    src: 'sounds/forest.ogg'
  },
  {
    id: 'brown-noise',
    kind: 'built-in',
    title: '棕噪音',
    subtitle: '柔和低频专注底噪',
    icon: '🟤',
    accent: '#a16207',
    src: 'sounds/brown-noise.ogg'
  },
  {
    id: 'pink-noise',
    kind: 'built-in',
    title: '粉噪音',
    subtitle: '均衡舒缓的睡眠底噪',
    icon: '🌸',
    accent: '#f472b6',
    src: 'sounds/pink-noise.ogg'
  },
  {
    id: 'fan',
    kind: 'built-in',
    title: '风扇',
    subtitle: '稳定气流声，助眠与屏蔽环境噪音',
    icon: '🌀',
    accent: '#94a3b8',
    src: 'sounds/fan.ogg'
  },
  {
    id: 'cafe',
    kind: 'built-in',
    title: '咖啡馆',
    subtitle: '店内氛围底噪，适合专注、阅读与远程办公',
    icon: '☕',
    accent: '#d97706',
    src: 'sounds/cafe.ogg'
  },
  {
    id: 'train',
    kind: 'built-in',
    title: '列车',
    subtitle: '车厢节奏与轨道声，适合旅途、阅读与屏蔽外界噪音',
    icon: '🚆',
    accent: '#64748b',
    src: 'sounds/train.ogg'
  },
  {
    id: 'highway',
    kind: 'built-in',
    title: '公路',
    subtitle: '平稳车流底噪，适合通勤、旅途与屏蔽外界杂音',
    icon: '🛣️',
    accent: '#78716c',
    src: 'sounds/highway.ogg'
  },
  {
    id: 'airplane',
    kind: 'built-in',
    title: '飞机舱',
    subtitle: '机舱稳定嗡鸣，适合长途飞行、专注与屏蔽外界噪音',
    icon: '✈️',
    accent: '#0ea5e9',
    src: 'sounds/airplane.ogg'
  },
  {
    id: 'office',
    kind: 'built-in',
    title: '办公室',
    subtitle: '空调与低频嗡鸣，适合办公专注与屏蔽环境噪音',
    icon: '🏢',
    accent: '#6b7280',
    src: 'sounds/office.ogg'
  }
];

export function getSoundById(id: string): BuiltInSound | undefined {
  return BUILT_IN_SOUNDS.find((sound) => sound.id === id);
}
