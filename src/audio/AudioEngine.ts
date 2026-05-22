import { BUILTIN_SOUNDS } from './builtinSounds'
import { createProceduralBuffer } from './proceduralGenerators'
import type { BuiltinSoundId, SoundMeta, TrackState } from './types'
import { getCustomSound } from '../db/customSounds'

interface ActiveTrack {
  id: string
  source: AudioBufferSourceNode | null
  gain: GainNode
  panner: StereoPannerNode
  buffer: AudioBuffer | null
  isBuiltin: boolean
  builtinType?: BuiltinSoundId
}

export class AudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private tracks = new Map<string, ActiveTrack>()
  private started = false
  private masterVolume = 0.8
  private masterMuted = false

  async ensureContext(): Promise<AudioContext> {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.masterGain.connect(this.ctx.destination)
      this.applyMasterGain()
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
    return this.ctx
  }

  get context(): AudioContext | null {
    return this.ctx
  }

  isPlaying(): boolean {
    return this.started
  }

  setMasterVolume(volume: number, muted: boolean) {
    this.masterVolume = volume
    this.masterMuted = muted
    this.applyMasterGain()
  }

  private applyMasterGain() {
    if (!this.masterGain) return
    this.masterGain.gain.value = this.masterMuted ? 0 : this.masterVolume
  }

  async start() {
    await this.ensureContext()
    this.started = true
  }

  async stop() {
    for (const [, track] of this.tracks) {
      this.stopTrackSource(track)
    }
    this.started = false
  }

  private stopTrackSource(track: ActiveTrack) {
    if (track.source) {
      try {
        track.source.stop()
      } catch {
        /* already stopped */
      }
      track.source.disconnect()
      track.source = null
    }
  }

  private async loadBuffer(
    meta: SoundMeta,
    ctx: AudioContext,
  ): Promise<AudioBuffer> {
    if (meta.builtin && meta.builtinType) {
      return createProceduralBuffer(ctx, meta.builtinType)
    }
    const record = await getCustomSound(meta.id)
    if (!record) throw new Error(`Custom sound not found: ${meta.id}`)
    const arrayBuffer = await record.blob.arrayBuffer()
    return ctx.decodeAudioData(arrayBuffer)
  }

  private ensureTrackNodes(id: string, ctx: AudioContext): ActiveTrack {
    let track = this.tracks.get(id)
    if (!track) {
      const gain = ctx.createGain()
      const panner = ctx.createStereoPanner()
      gain.connect(panner)
      panner.connect(this.masterGain!)
      track = {
        id,
        source: null,
        gain,
        panner,
        buffer: null,
        isBuiltin: false,
      }
      this.tracks.set(id, track)
    }
    return track
  }

  async syncTrack(meta: SoundMeta, state: TrackState) {
    const ctx = await this.ensureContext()
    const track = this.ensureTrackNodes(meta.id, ctx)
    track.isBuiltin = meta.builtin
    track.builtinType = meta.builtinType

    track.gain.gain.value = state.muted ? 0 : state.volume
    track.panner.pan.value = Math.max(-1, Math.min(1, state.pan))

    if (!state.active) {
      this.stopTrackSource(track)
      return
    }

    if (!this.started) return

    if (!track.buffer) {
      track.buffer = await this.loadBuffer(meta, ctx)
    }

    if (!track.source) {
      this.startLoop(track, state.playbackRate)
    } else {
      track.source.playbackRate.value = state.playbackRate
    }
  }

  private startLoop(track: ActiveTrack, playbackRate: number) {
    const ctx = this.ctx!
    const source = ctx.createBufferSource()
    source.buffer = track.buffer!
    source.loop = true
    source.playbackRate.value = playbackRate
    source.connect(track.gain)
    source.start(0)
    track.source = source
  }

  async removeTrack(id: string) {
    const track = this.tracks.get(id)
    if (track) {
      this.stopTrackSource(track)
      track.gain.disconnect()
      track.panner.disconnect()
      this.tracks.delete(id)
    }
  }

  /** Preset: activate multiple builtins at once */
  async applyPreset(
    _soundIds: string[],
    trackStates: Map<string, TrackState>,
    metas: SoundMeta[],
  ) {
    for (const meta of metas) {
      const state = trackStates.get(meta.id)
      if (state) await this.syncTrack(meta, state)
    }
  }

  static getBuiltinMeta(id: string): SoundMeta | undefined {
    return BUILTIN_SOUNDS.find((s) => s.id === id)
  }
}

export const audioEngine = new AudioEngine()
