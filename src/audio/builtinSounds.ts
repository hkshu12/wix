import type { SoundMeta } from './types'

export const BUILTIN_SOUNDS: SoundMeta[] = [
  { id: 'rain', name: '下雨', nameEn: 'Rain', category: 'nature', icon: '🌧️', builtin: true, builtinType: 'rain' },
  { id: 'ocean', name: '海边', nameEn: 'Ocean', category: 'nature', icon: '🌊', builtin: true, builtinType: 'ocean' },
  { id: 'campfire', name: '篝火', nameEn: 'Campfire', category: 'nature', icon: '🔥', builtin: true, builtinType: 'campfire' },
  { id: 'fireplace', name: '壁炉', nameEn: 'Fireplace', category: 'indoor', icon: '🪵', builtin: true, builtinType: 'fireplace' },
  { id: 'wind', name: '风声', nameEn: 'Wind', category: 'nature', icon: '💨', builtin: true, builtinType: 'wind' },
  { id: 'forest', name: '森林', nameEn: 'Forest', category: 'nature', icon: '🌲', builtin: true, builtinType: 'forest' },
  { id: 'thunder', name: '雷鸣', nameEn: 'Thunder', category: 'nature', icon: '⛈️', builtin: true, builtinType: 'thunder' },
  { id: 'stream', name: '溪流', nameEn: 'Stream', category: 'nature', icon: '💧', builtin: true, builtinType: 'stream' },
  { id: 'night', name: '夜晚', nameEn: 'Night', category: 'nature', icon: '🌙', builtin: true, builtinType: 'night' },
  { id: 'cafe', name: '咖啡馆', nameEn: 'Café', category: 'urban', icon: '☕', builtin: true, builtinType: 'cafe' },
]
