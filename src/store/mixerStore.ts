import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BUILTIN_SOUNDS } from '../audio/builtinSounds'
import { audioEngine } from '../audio/AudioEngine'
import { deleteCustomSound, listCustomSounds, saveCustomSound } from '../db/customSounds'
import type { MixerSettings, SoundMeta, TrackState } from '../audio/types'

function defaultTrack(id: string): TrackState {
  return {
    id,
    active: false,
    volume: 0.7,
    pan: 0,
    playbackRate: 1,
    muted: false,
  }
}

interface MixerStore {
  sounds: SoundMeta[]
  tracks: Record<string, TrackState>
  settings: MixerSettings
  isPlaying: boolean
  customLoaded: boolean

  init: () => Promise<void>
  togglePlay: () => Promise<void>
  toggleTrack: (id: string) => Promise<void>
  setTrackVolume: (id: string, volume: number) => Promise<void>
  setTrackPan: (id: string, pan: number) => Promise<void>
  setTrackRate: (id: string, rate: number) => Promise<void>
  toggleTrackMute: (id: string) => Promise<void>
  setMasterVolume: (v: number) => void
  toggleMasterMute: () => void
  importSound: (file: File) => Promise<void>
  removeCustomSound: (id: string) => Promise<void>
  applyPreset: (ids: string[]) => Promise<void>
  setSleepTimer: (minutes: number | null) => void
  syncAudio: () => Promise<void>
}

const PRESETS: Record<string, { name: string; ids: string[] }> = {
  cozy: { name: '温馨小屋', ids: ['fireplace', 'rain', 'wind'] },
  beach: { name: '海边度假', ids: ['ocean', 'wind', 'night'] },
  forest: { name: '深林漫步', ids: ['forest', 'stream', 'wind'] },
  storm: { name: '暴风雨夜', ids: ['rain', 'thunder', 'wind'] },
  focus: { name: '专注咖啡', ids: ['cafe', 'rain'] },
}

export { PRESETS }

async function syncAllTracks(
  sounds: SoundMeta[],
  tracks: Record<string, TrackState>,
) {
  for (const meta of sounds) {
    const state = tracks[meta.id]
    if (state) await audioEngine.syncTrack(meta, state)
  }
  audioEngine.setMasterVolume(
    useMixerStore.getState().settings.masterVolume,
    useMixerStore.getState().settings.masterMuted,
  )
}

export const useMixerStore = create<MixerStore>()(
  persist(
    (set, get) => ({
      sounds: [...BUILTIN_SOUNDS],
      tracks: Object.fromEntries(BUILTIN_SOUNDS.map((s) => [s.id, defaultTrack(s.id)])),
      settings: {
        masterVolume: 0.85,
        masterMuted: false,
        sleepTimerMinutes: null,
      },
      isPlaying: false,
      customLoaded: false,

      init: async () => {
        const customs = await listCustomSounds()
        const customMetas: SoundMeta[] = customs.map((c) => ({
          id: c.id,
          name: c.name,
          nameEn: c.name,
          category: 'custom',
          icon: '🎵',
          builtin: false,
        }))
        const tracks = { ...get().tracks }
        for (const m of customMetas) {
          if (!tracks[m.id]) tracks[m.id] = defaultTrack(m.id)
        }
        set({
          sounds: [...BUILTIN_SOUNDS, ...customMetas],
          tracks,
          customLoaded: true,
        })
      },

      syncAudio: async () => {
        const { sounds, tracks, isPlaying } = get()
        if (!isPlaying) return
        await syncAllTracks(sounds, tracks)
      },

      togglePlay: async () => {
        const playing = get().isPlaying
        if (playing) {
          await audioEngine.stop()
          set({ isPlaying: false })
        } else {
          await audioEngine.start()
          set({ isPlaying: true })
          await syncAllTracks(get().sounds, get().tracks)
        }
      },

      toggleTrack: async (id) => {
        const tracks = { ...get().tracks }
        const t = tracks[id] ?? defaultTrack(id)
        tracks[id] = { ...t, active: !t.active }
        set({ tracks })
        if (get().isPlaying) {
          const meta = get().sounds.find((s) => s.id === id)
          if (meta) await audioEngine.syncTrack(meta, tracks[id])
        }
      },

      setTrackVolume: async (id, volume) => {
        const tracks = { ...get().tracks }
        tracks[id] = { ...(tracks[id] ?? defaultTrack(id)), volume }
        set({ tracks })
        if (get().isPlaying) {
          const meta = get().sounds.find((s) => s.id === id)
          if (meta) await audioEngine.syncTrack(meta, tracks[id])
        }
      },

      setTrackPan: async (id, pan) => {
        const tracks = { ...get().tracks }
        tracks[id] = { ...(tracks[id] ?? defaultTrack(id)), pan }
        set({ tracks })
        if (get().isPlaying) {
          const meta = get().sounds.find((s) => s.id === id)
          if (meta) await audioEngine.syncTrack(meta, tracks[id])
        }
      },

      setTrackRate: async (id, rate) => {
        const tracks = { ...get().tracks }
        tracks[id] = { ...(tracks[id] ?? defaultTrack(id)), playbackRate: rate }
        set({ tracks })
        if (get().isPlaying) {
          const meta = get().sounds.find((s) => s.id === id)
          if (meta) await audioEngine.syncTrack(meta, tracks[id])
        }
      },

      toggleTrackMute: async (id) => {
        const tracks = { ...get().tracks }
        const t = tracks[id] ?? defaultTrack(id)
        tracks[id] = { ...t, muted: !t.muted }
        set({ tracks })
        if (get().isPlaying) {
          const meta = get().sounds.find((s) => s.id === id)
          if (meta) await audioEngine.syncTrack(meta, tracks[id])
        }
      },

      setMasterVolume: (v) => {
        const settings = { ...get().settings, masterVolume: v }
        set({ settings })
        audioEngine.setMasterVolume(v, settings.masterMuted)
      },

      toggleMasterMute: () => {
        const settings = { ...get().settings, masterMuted: !get().settings.masterMuted }
        set({ settings })
        audioEngine.setMasterVolume(settings.masterVolume, settings.masterMuted)
      },

      importSound: async (file) => {
        const name = file.name.replace(/\.[^.]+$/, '')
        const record = await saveCustomSound(name, file)
        const meta: SoundMeta = {
          id: record.id,
          name: record.name,
          nameEn: record.name,
          category: 'custom',
          icon: '🎵',
          builtin: false,
        }
        const sounds = [...get().sounds, meta]
        const tracks = { ...get().tracks, [meta.id]: defaultTrack(meta.id) }
        set({ sounds, tracks })
      },

      removeCustomSound: async (id) => {
        await deleteCustomSound(id)
        await audioEngine.removeTrack(id)
        const sounds = get().sounds.filter((s) => s.id !== id)
        const tracks = { ...get().tracks }
        delete tracks[id]
        set({ sounds, tracks })
      },

      applyPreset: async (ids) => {
        const tracks = { ...get().tracks }
        for (const key of Object.keys(tracks)) {
          tracks[key] = { ...tracks[key], active: ids.includes(key) }
        }
        set({ tracks })
        if (!get().isPlaying) {
          await audioEngine.start()
          set({ isPlaying: true })
        }
        await syncAllTracks(get().sounds, tracks)
      },

      setSleepTimer: (minutes) => {
        set({ settings: { ...get().settings, sleepTimerMinutes: minutes } })
        if (minutes) {
          setTimeout(
            () => {
              if (get().settings.sleepTimerMinutes === minutes) {
                void get().togglePlay()
                set({ settings: { ...get().settings, sleepTimerMinutes: null } })
              }
            },
            minutes * 60 * 1000,
          )
        }
      },
    }),
    {
      name: 'ambient-mix-storage',
      partialize: (state) => ({
        tracks: state.tracks,
        settings: state.settings,
      }),
    },
  ),
)
