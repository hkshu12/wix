export type BuiltInSoundId =
  | 'rain'
  | 'summer-rain'
  | 'river'
  | 'rain-on-leaves'
  | 'birds'
  | 'ocean'
  | 'ocean-near'
  | 'ocean-far'
  | 'stream'
  | 'fireplace'
  | 'forest'
  | 'clock-tick'
  | 'window-wind'
  | 'air-hum'
  | 'piano'
  | 'brown-noise'
  | 'pink-noise'
  | 'white-noise'
  | 'fan'
  | 'cafe'
  | 'train'
  | 'highway'
  | 'airplane'
  | 'office'
  | 'construction-site';

export interface BuiltInSound {
  id: BuiltInSoundId;
  kind: 'built-in';
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  /** Path under `public/`, e.g. `sounds/studio/rain.mp3` */
  src: string;
}

const STUDIO = 'sounds/studio';

export const BUILT_IN_SOUNDS: BuiltInSound[] = [
  {
    id: 'rain',
    kind: 'built-in',
    title: '雨声',
    subtitle: '密集夏雨与窗外氛围',
    icon: '🌧️',
    accent: '#60a5fa',
    src: `${STUDIO}/summer-rain.mp3`
  },
  {
    id: 'summer-rain',
    kind: 'built-in',
    title: '夏雨',
    subtitle: '六月与夏雨的邂逅',
    icon: '🌦️',
    accent: '#38bdf8',
    src: `${STUDIO}/summer-rain.mp3`
  },
  {
    id: 'river',
    kind: 'built-in',
    title: '河流',
    subtitle: '湍急水流与河谷回响',
    icon: '🏞️',
    accent: '#2dd4bf',
    src: `${STUDIO}/river.mp3`
  },
  {
    id: 'rain-on-leaves',
    kind: 'built-in',
    title: '叶上雨',
    subtitle: '树叶上的细雨滴答',
    icon: '🍃',
    accent: '#4ade80',
    src: `${STUDIO}/rain-on-leaves.mp3`
  },
  {
    id: 'birds',
    kind: 'built-in',
    title: '鸟鸣',
    subtitle: '林间清晨与远处鸟叫',
    icon: '🐦',
    accent: '#a3e635',
    src: `${STUDIO}/birds.mp3`
  },
  {
    id: 'ocean',
    kind: 'built-in',
    title: '海边',
    subtitle: '潮汐般起伏的浪声',
    icon: '🌊',
    accent: '#22d3ee',
    src: `${STUDIO}/ocean-near.mp3`
  },
  {
    id: 'ocean-near',
    kind: 'built-in',
    title: '近海浪',
    subtitle: '拍岸碎浪与湿润气息',
    icon: '🌊',
    accent: '#06b6d4',
    src: `${STUDIO}/ocean-near.mp3`
  },
  {
    id: 'ocean-far',
    kind: 'built-in',
    title: '远海浪',
    subtitle: '远处起伏的潮汐底噪',
    icon: '🌅',
    accent: '#0ea5e9',
    src: `${STUDIO}/ocean-far.mp3`
  },
  {
    id: 'stream',
    kind: 'built-in',
    title: '溪流',
    subtitle: '潺潺流水，适合冥想、放松与自然氛围',
    icon: '💧',
    accent: '#2dd4bf',
    src: `${STUDIO}/stream.mp3`
  },
  {
    id: 'fireplace',
    kind: 'built-in',
    title: '壁炉',
    subtitle: '温暖室内燃烧声',
    icon: '🪵',
    accent: '#fb7185',
    src: `${STUDIO}/fireplace.mp3`
  },
  {
    id: 'forest',
    kind: 'built-in',
    title: '森林',
    subtitle: '树叶、微风与远处鸟鸣',
    icon: '🌲',
    accent: '#34d399',
    src: `${STUDIO}/forest.mp3`
  },
  {
    id: 'clock-tick',
    kind: 'built-in',
    title: '钟摆',
    subtitle: '安静室内的机械滴答',
    icon: '🕰️',
    accent: '#cbd5e1',
    src: `${STUDIO}/clock-tick.mp3`
  },
  {
    id: 'window-wind',
    kind: 'built-in',
    title: '窗风',
    subtitle: '窗外风声与冬季氛围',
    icon: '🌬️',
    accent: '#94a3b8',
    src: `${STUDIO}/window-wind.mp3`
  },
  {
    id: 'air-hum',
    kind: 'built-in',
    title: '气流嗡鸣',
    subtitle: '柔和稳定的空间底噪',
    icon: '💨',
    accent: '#64748b',
    src: `${STUDIO}/air-hum.mp3`
  },
  {
    id: 'piano',
    kind: 'built-in',
    title: '钢琴',
    subtitle: '轻柔键盘氛围，适合阅读与放松',
    icon: '🎹',
    accent: '#c084fc',
    src: `${STUDIO}/piano.mp3`
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
    id: 'white-noise',
    kind: 'built-in',
    title: '白噪音',
    subtitle: '明亮均匀频谱，专注、哄娃与屏蔽突发噪音',
    icon: '⚪',
    accent: '#e2e8f0',
    src: 'sounds/white-noise.ogg'
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
  },
  {
    id: 'construction-site',
    kind: 'built-in',
    title: '工地',
    subtitle: '远处施工与机械底噪，适合屏蔽街道装修与营造城市氛围',
    icon: '🏗️',
    accent: '#ca8a04',
    src: 'sounds/construction-site.ogg'
  }
];

export function getSoundById(id: string): BuiltInSound | undefined {
  return BUILT_IN_SOUNDS.find((sound) => sound.id === id);
}
