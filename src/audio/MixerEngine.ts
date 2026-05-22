import { createBuiltInVoice, type BuiltInId, type BuiltInVoice } from './builtins'

export type TrackKind = 'builtin' | 'custom'

const builtinPrefix = 'b:'
const customPrefix = 'c:'

export function trackIdBuiltin(id: BuiltInId): string {
  return `${builtinPrefix}${id}`
}

export function trackIdCustom(id: string): string {
  return `${customPrefix}${id}`
}

export function parseBuiltinTrackId(id: string): BuiltInId | undefined {
  if (!id.startsWith(builtinPrefix)) return undefined
  return id.slice(builtinPrefix.length) as BuiltInId
}

export function parseCustomTrackId(id: string): string | undefined {
  if (!id.startsWith(customPrefix)) return undefined
  return id.slice(customPrefix.length)
}

function createCustomVoice(ctx: AudioContext, buffer: AudioBuffer): BuiltInVoice {
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  src.playbackRate.value = 1
  const out = ctx.createGain()
  out.gain.value = 1
  src.connect(out)
  let running = false
  return {
    output: out,
    sources: [src],
    start() {
      if (running) return
      running = true
      src.start()
    },
    stop() {
      if (!running) return
      running = false
      try {
        src.stop()
      } catch {
        /* noop */
      }
    },
    dispose() {
      this.stop()
    },
  }
}

type ActiveTrack = {
  voice: BuiltInVoice
  trackGain: GainNode
  panner: StereoPannerNode
  basePlaybackRate: number
}

export class MixerEngine {
  private ctx: AudioContext | null = null

  private masterGain: GainNode | null = null

  private masterTone: BiquadFilterNode | null = null

  private tracks = new Map<string, ActiveTrack>()

  private globalRate = 1

  async unlock(): Promise<AudioContext> {
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) throw new Error('Web Audio API 不可用')
      this.ctx = new AC()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.85
      this.masterTone = this.ctx.createBiquadFilter()
      this.masterTone.type = 'lowpass'
      this.masterTone.frequency.value = 20000
      this.masterTone.Q.value = 0.7
      this.masterGain.connect(this.masterTone)
      this.masterTone.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume()
    return this.ctx
  }

  get audioContext(): AudioContext | null {
    return this.ctx
  }

  private bus(): { gain: GainNode; tone: BiquadFilterNode; ctx: AudioContext } {
    if (!this.ctx || !this.masterGain || !this.masterTone) {
      throw new Error('请先解锁音频')
    }
    return { gain: this.masterGain, tone: this.masterTone, ctx: this.ctx }
  }

  setMasterVolume(v: number) {
    if (!this.masterGain || !this.ctx) return
    const x = Math.max(0, Math.min(1, v))
    this.masterGain.gain.setTargetAtTime(x, this.ctx.currentTime, 0.02)
  }

  /** 0 = 闷 / 暗，1 = 明亮全开 */
  setMasterToneBrightness(v: number) {
    if (!this.masterTone || !this.ctx) return
    const hz = 900 + Math.max(0, Math.min(1, v)) * 19400
    this.masterTone.frequency.setTargetAtTime(hz, this.ctx.currentTime, 0.04)
  }

  setGlobalPlaybackRate(r: number) {
    this.globalRate = Math.max(0.25, Math.min(2.5, r))
    for (const [, t] of this.tracks) {
      this.applyPlaybackRate(t)
    }
  }

  private applyPlaybackRate(t: ActiveTrack) {
    const m = t.basePlaybackRate * this.globalRate
    for (const s of t.voice.sources) {
      s.playbackRate.setValueAtTime(m, this.ctx?.currentTime ?? 0)
    }
  }

  hasTrack(id: string): boolean {
    return this.tracks.has(id)
  }

  addBuiltIn(id: BuiltInId, volume = 0.65, pan = 0, playbackRate = 1) {
    const tid = trackIdBuiltin(id)
    if (this.tracks.has(tid)) return
    const { ctx, gain: master } = this.bus()
    const voice = createBuiltInVoice(ctx, id)
    const trackGain = ctx.createGain()
    const panner = ctx.createStereoPanner()
    trackGain.gain.value = volume
    panner.pan.value = pan
    voice.output.connect(trackGain)
    trackGain.connect(panner)
    panner.connect(master)
    const t: ActiveTrack = { voice, trackGain, panner, basePlaybackRate: playbackRate }
    this.tracks.set(tid, t)
    this.applyPlaybackRate(t)
    voice.start()
  }

  addCustom(dbId: string, buffer: AudioBuffer, volume = 0.75, pan = 0, playbackRate = 1) {
    const tid = trackIdCustom(dbId)
    if (this.tracks.has(tid)) return
    const { ctx, gain: master } = this.bus()
    const voice = createCustomVoice(ctx, buffer)
    const trackGain = ctx.createGain()
    const panner = ctx.createStereoPanner()
    trackGain.gain.value = volume
    panner.pan.value = pan
    voice.output.connect(trackGain)
    trackGain.connect(panner)
    panner.connect(master)
    const t: ActiveTrack = { voice, trackGain, panner, basePlaybackRate: playbackRate }
    this.tracks.set(tid, t)
    this.applyPlaybackRate(t)
    voice.start()
  }

  removeTrack(id: string) {
    const t = this.tracks.get(id)
    if (!t) return
    t.voice.dispose()
    try {
      t.voice.output.disconnect()
    } catch {
      /* noop */
    }
    try {
      t.trackGain.disconnect()
    } catch {
      /* noop */
    }
    try {
      t.panner.disconnect()
    } catch {
      /* noop */
    }
    this.tracks.delete(id)
  }

  setTrackVolume(id: string, v: number) {
    const t = this.tracks.get(id)
    if (!t || !this.ctx) return
    t.trackGain.gain.setTargetAtTime(Math.max(0, Math.min(1, v)), this.ctx.currentTime, 0.03)
  }

  setTrackPan(id: string, pan: number) {
    const t = this.tracks.get(id)
    if (!t || !this.ctx) return
    t.panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime, 0.03)
  }

  setTrackPlaybackRate(id: string, rate: number) {
    const t = this.tracks.get(id)
    if (!t) return
    t.basePlaybackRate = Math.max(0.25, Math.min(2.5, rate))
    this.applyPlaybackRate(t)
  }

  getTrackIds(): string[] {
    return [...this.tracks.keys()]
  }

  disposeAll() {
    for (const id of [...this.tracks.keys()]) {
      this.removeTrack(id)
    }
  }
}

export const mixerEngine = new MixerEngine()
