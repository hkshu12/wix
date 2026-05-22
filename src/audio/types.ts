export type SoundCategory = 'nature' | 'indoor' | 'urban' | 'custom'

export type BuiltinSoundId =
  | 'rain'
  | 'ocean'
  | 'campfire'
  | 'fireplace'
  | 'wind'
  | 'forest'
  | 'thunder'
  | 'stream'
  | 'night'
  | 'cafe'

export interface SoundMeta {
  id: string
  name: string
  nameEn: string
  category: SoundCategory
  icon: string
  builtin: boolean
  builtinType?: BuiltinSoundId
}

export interface TrackState {
  id: string
  active: boolean
  volume: number
  pan: number
  playbackRate: number
  muted: boolean
}

export interface MixerSettings {
  masterVolume: number
  masterMuted: boolean
  sleepTimerMinutes: number | null
}

export interface CustomSoundRecord {
  id: string
  name: string
  mimeType: string
  size: number
  createdAt: number
  blob: Blob
}
