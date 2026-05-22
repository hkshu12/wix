import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BuiltInId } from '../audio/builtins'

export type LayerSnapshot = {
  on: boolean
  volume: number
  pan: number
  rate: number
}

export type MixerStoreState = {
  audioReady: boolean
  /** Increment after custom buffers load so the audio bridge re-runs */
  assetGeneration: number
  layers: Record<string, LayerSnapshot>
  masterVolume: number
  toneBrightness: number
  globalRate: number
  setAudioReady: (v: boolean) => void
  bumpAssets: () => void
  setLayerField: (trackId: string, patch: Partial<LayerSnapshot>) => void
  toggleBuiltIn: (id: BuiltInId) => void
  toggleCustom: (id: string) => void
  setMasterVolume: (v: number) => void
  setToneBrightness: (v: number) => void
  setGlobalRate: (v: number) => void
  ensureLayer: (trackId: string, defaults?: Partial<LayerSnapshot>) => void
  removeLayerState: (trackId: string) => void
}

const defaultLayer = (): LayerSnapshot => ({
  on: false,
  volume: 0.62,
  pan: 0,
  rate: 1,
})

export const useMixerStore = create<MixerStoreState>()(
  persist(
    (set, get) => ({
      audioReady: false,
      assetGeneration: 0,
      layers: {},
      masterVolume: 0.82,
      toneBrightness: 0.92,
      globalRate: 1,
      setAudioReady: (v) => set({ audioReady: v }),
      bumpAssets: () => set((s) => ({ assetGeneration: s.assetGeneration + 1 })),
      ensureLayer: (trackId, defaults) =>
        set((s) => {
          if (s.layers[trackId]) return s
          return {
            layers: {
              ...s.layers,
              [trackId]: { ...defaultLayer(), ...defaults },
            },
          }
        }),
      setLayerField: (trackId, patch) =>
        set((s) => ({
          layers: {
            ...s.layers,
            [trackId]: { ...(s.layers[trackId] ?? defaultLayer()), ...patch },
          },
        })),
      toggleBuiltIn: (id) => {
        const tid = `b:${id}`
        get().ensureLayer(tid)
        const cur = get().layers[tid] ?? defaultLayer()
        set((s) => ({
          layers: {
            ...s.layers,
            [tid]: { ...(s.layers[tid] ?? defaultLayer()), on: !cur.on },
          },
        }))
      },
      toggleCustom: (id) => {
        const tid = `c:${id}`
        get().ensureLayer(tid)
        const cur = get().layers[tid] ?? defaultLayer()
        set((s) => ({
          layers: {
            ...s.layers,
            [tid]: { ...(s.layers[tid] ?? defaultLayer()), on: !cur.on },
          },
        }))
      },
      setMasterVolume: (v) => set({ masterVolume: v }),
      setToneBrightness: (v) => set({ toneBrightness: v }),
      setGlobalRate: (v) => set({ globalRate: v }),
      removeLayerState: (trackId) =>
        set((s) => {
          const next = { ...s.layers }
          delete next[trackId]
          return { layers: next }
        }),
    }),
    {
      name: 'ambient-mixer-v1',
      partialize: (s) => ({
        layers: s.layers,
        masterVolume: s.masterVolume,
        toneBrightness: s.toneBrightness,
        globalRate: s.globalRate,
      }),
    },
  ),
)
