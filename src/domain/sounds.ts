export type BuiltInSoundId =
  | 'campfire'
  | 'rain'
  | 'ocean'
  | 'fireplace'
  | 'thunder'
  | 'forest'
  | 'brown-noise'
  | 'pink-noise';

export type ProceduralEngineKind = 'crackle' | 'rain' | 'surf' | 'hearth' | 'rumble' | 'forest' | 'brown' | 'pink';

export interface BuiltInSound {
  id: BuiltInSoundId;
  kind: 'built-in';
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  engine: {
    kind: ProceduralEngineKind;
    filterFrequency: number;
    resonance: number;
  };
}

export const BUILT_IN_SOUNDS: BuiltInSound[] = [
  {
    id: 'campfire',
    kind: 'built-in',
    title: '篝火',
    subtitle: '跳动木柴与轻微爆裂',
    icon: '🔥',
    accent: '#ff9f43',
    engine: { kind: 'crackle', filterFrequency: 1800, resonance: 3.4 }
  },
  {
    id: 'rain',
    kind: 'built-in',
    title: '雨声',
    subtitle: '密集雨滴与窗外氛围',
    icon: '🌧️',
    accent: '#60a5fa',
    engine: { kind: 'rain', filterFrequency: 2600, resonance: 1.2 }
  },
  {
    id: 'ocean',
    kind: 'built-in',
    title: '海边',
    subtitle: '潮汐般起伏的浪声',
    icon: '🌊',
    accent: '#22d3ee',
    engine: { kind: 'surf', filterFrequency: 720, resonance: 0.8 }
  },
  {
    id: 'fireplace',
    kind: 'built-in',
    title: '壁炉',
    subtitle: '温暖室内燃烧声',
    icon: '🪵',
    accent: '#fb7185',
    engine: { kind: 'hearth', filterFrequency: 1250, resonance: 2.2 }
  },
  {
    id: 'thunder',
    kind: 'built-in',
    title: '远雷',
    subtitle: '低频滚动与雨夜空间',
    icon: '⛈️',
    accent: '#818cf8',
    engine: { kind: 'rumble', filterFrequency: 220, resonance: 4 }
  },
  {
    id: 'forest',
    kind: 'built-in',
    title: '森林',
    subtitle: '树叶、微风与远处鸟鸣',
    icon: '🌲',
    accent: '#34d399',
    engine: { kind: 'forest', filterFrequency: 3400, resonance: 0.9 }
  },
  {
    id: 'brown-noise',
    kind: 'built-in',
    title: '棕噪音',
    subtitle: '柔和低频专注底噪',
    icon: '🟤',
    accent: '#a16207',
    engine: { kind: 'brown', filterFrequency: 520, resonance: 0.7 }
  },
  {
    id: 'pink-noise',
    kind: 'built-in',
    title: '粉噪音',
    subtitle: '均衡舒缓的睡眠底噪',
    icon: '🌸',
    accent: '#f472b6',
    engine: { kind: 'pink', filterFrequency: 1400, resonance: 0.6 }
  }
];

export function getSoundById(id: string): BuiltInSound | undefined {
  return BUILT_IN_SOUNDS.find((sound) => sound.id === id);
}
