import { createNoiseBuffer, type NoiseColor } from './noise'

export type BuiltInId =
  | 'rain'
  | 'ocean'
  | 'seaside'
  | 'campfire'
  | 'hearth'
  | 'forest_wind'
  | 'stream'
  | 'white'
  | 'pink'
  | 'brown'

export type BuiltInVoice = {
  /** Last node before the mixer inserts per-track gain + panner */
  output: AudioNode
  /** All buffer sources that should respect playback rate */
  sources: AudioBufferSourceNode[]
  start(): void
  stop(): void
  dispose(): void
}

export type BuiltInMeta = {
  id: BuiltInId
  label: string
  emoji: string
  hint: string
}

export const BUILTIN_CATALOG: BuiltInMeta[] = [
  { id: 'rain', label: '下雨', emoji: '🌧️', hint: '雨棚与远雷氛围' },
  { id: 'ocean', label: '深海', emoji: '🌊', hint: '低频涌动与浪花' },
  { id: 'seaside', label: '海边', emoji: '🏖️', hint: '海风与潮汐感' },
  { id: 'campfire', label: '篝火', emoji: '🔥', hint: '木柴噼啪与近距火焰' },
  { id: 'hearth', label: '壁炉', emoji: '🪵', hint: '更闷暖的室内炉火' },
  { id: 'forest_wind', label: '林风', emoji: '🌲', hint: '树冠层风声' },
  { id: 'stream', label: '溪流', emoji: '💧', hint: '水泡与潺潺' },
  { id: 'white', label: '白噪', emoji: '⬜', hint: '均匀白噪声' },
  { id: 'pink', label: '粉噪', emoji: '📶', hint: '更柔和的能量分布' },
  { id: 'brown', label: '棕噪', emoji: '🟫', hint: '厚重低频噪声' },
]

function chainNoise(
  ctx: AudioContext,
  color: NoiseColor,
  sec: number,
  chain: (src: AudioBufferSourceNode) => AudioNode,
): BuiltInVoice {
  const buf = createNoiseBuffer(ctx, sec, color)
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  const wet = chain(src)
  let running = false

  return {
    output: wet,
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
        /* already stopped */
      }
    },
    dispose() {
      this.stop()
    },
  }
}

function makeRain(ctx: AudioContext): BuiltInVoice {
  const buf = createNoiseBuffer(ctx, 2.8, 'white')
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 400
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 2200
  bp.Q.value = 0.35
  const wet = ctx.createGain()
  wet.gain.value = 0.55
  src.connect(hp)
  hp.connect(bp)
  bp.connect(wet)
  let running = false
  return {
    output: wet,
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

function makeOcean(ctx: AudioContext): BuiltInVoice {
  const v = chainNoise(ctx, 'pink', 3.2, (src) => {
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 420
    const g = ctx.createGain()
    g.gain.value = 0.35
    src.connect(lp)
    lp.connect(g)
    return g
  })
  const swell = v.output as GainNode
  let tid: number | undefined
  const schedule = () => {
    const sweep = 2.8 + Math.random() * 3.5
    const now = ctx.currentTime
    const g = swell.gain
    g.cancelScheduledValues(now)
    g.setValueAtTime(Math.max(0.12, g.value), now)
    g.linearRampToValueAtTime(0.82, now + sweep * 0.45)
    g.exponentialRampToValueAtTime(0.18, now + sweep)
    tid = window.setTimeout(schedule, sweep * 1000) as unknown as number
  }
  const origStart = v.start.bind(v)
  const origStop = v.stop.bind(v)
  const origDispose = v.dispose.bind(v)
  return {
    ...v,
    start() {
      origStart()
      schedule()
    },
    stop() {
      if (tid) window.clearTimeout(tid)
      tid = undefined
      origStop()
    },
    dispose() {
      if (tid) window.clearTimeout(tid)
      tid = undefined
      origDispose()
    },
  }
}

function makeSeaside(ctx: AudioContext): BuiltInVoice {
  const wind = chainNoise(ctx, 'pink', 3.4, (src) => {
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 900
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 3200
    bp.Q.value = 0.25
    const g = ctx.createGain()
    g.gain.value = 0.22
    src.connect(hp)
    hp.connect(bp)
    bp.connect(g)
    return g
  })
  const surf = chainNoise(ctx, 'white', 2.1, (src) => {
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1800
    const g = ctx.createGain()
    g.gain.value = 0.08
    src.connect(lp)
    lp.connect(g)
    return g
  })
  const bus = ctx.createGain()
  bus.gain.value = 1
  wind.output.connect(bus)
  surf.output.connect(bus)
  const sources = [...wind.sources, ...surf.sources]
  let running = false
  let tid: number | undefined
  const pulseSurf = () => {
    const g = (surf.output as GainNode).gain
    const now = ctx.currentTime
    const bump = 0.05 + Math.random() * 0.12
    g.cancelScheduledValues(now)
    g.setValueAtTime(g.value, now)
    g.linearRampToValueAtTime(0.18 + bump, now + 0.35)
    g.exponentialRampToValueAtTime(0.06, now + 2.2 + Math.random() * 2)
    tid = window.setTimeout(pulseSurf, 900 + Math.random() * 2200) as unknown as number
  }
  return {
    output: bus,
    sources,
    start() {
      if (running) return
      running = true
      wind.start()
      surf.start()
      pulseSurf()
    },
    stop() {
      if (!running) return
      running = false
      if (tid) window.clearTimeout(tid)
      tid = undefined
      wind.stop()
      surf.stop()
    },
    dispose() {
      this.stop()
      wind.dispose()
      surf.dispose()
    },
  }
}

function makeFire(ctx: AudioContext, bright: boolean): BuiltInVoice {
  const body = chainNoise(ctx, 'brown', 2.4, (src) => {
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = bright ? 180 : 120
    const g = ctx.createGain()
    g.gain.value = bright ? 0.55 : 0.42
    src.connect(hp)
    hp.connect(g)
    return g
  })
  const crackleBuf = createNoiseBuffer(ctx, 0.08, 'white')
  const crackleFilter = ctx.createBiquadFilter()
  crackleFilter.type = 'bandpass'
  crackleFilter.frequency.value = bright ? 4200 : 3000
  crackleFilter.Q.value = 1.2
  const bus = ctx.createGain()
  bus.gain.value = 1
  body.output.connect(bus)
  crackleFilter.connect(bus)

  const sources = [...body.sources]
  let running = false
  let tid: number | undefined

  const pop = () => {
    const src = ctx.createBufferSource()
    src.buffer = crackleBuf
    src.playbackRate.value = 0.85 + Math.random() * 0.5
    const g = ctx.createGain()
    const now = ctx.currentTime
    const peak = 0.04 + Math.random() * (bright ? 0.09 : 0.06)
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(peak, now + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05 + Math.random() * 0.06)
    src.connect(g)
    g.connect(crackleFilter)
    src.start(now)
    src.stop(now + 0.2)
    sources.push(src)
    tid = window.setTimeout(pop, 40 + Math.random() * (bright ? 120 : 200)) as unknown as number
  }

  return {
    output: bus,
    sources,
    start() {
      if (running) return
      running = true
      body.start()
      pop()
    },
    stop() {
      if (!running) return
      running = false
      if (tid) window.clearTimeout(tid)
      tid = undefined
      body.stop()
    },
    dispose() {
      this.stop()
      body.dispose()
    },
  }
}

function makeForestWind(ctx: AudioContext): BuiltInVoice {
  const buf = createNoiseBuffer(ctx, 3.6, 'pink')
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop = true
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 0.5
  bp.frequency.value = 620
  const g = ctx.createGain()
  g.gain.value = 0.36
  src.connect(bp)
  bp.connect(g)

  let running = false
  let raf = 0
  let t0 = 0
  const anim = () => {
    t0 += 0.018
    bp.frequency.value = 420 + Math.sin(t0) * 260 + (Math.random() - 0.5) * 40
    raf = requestAnimationFrame(anim)
  }

  return {
    output: g,
    sources: [src],
    start() {
      if (running) return
      running = true
      src.start()
      raf = requestAnimationFrame(anim)
    },
    stop() {
      if (!running) return
      running = false
      cancelAnimationFrame(raf)
      raf = 0
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

function makeStream(ctx: AudioContext): BuiltInVoice {
  return chainNoise(ctx, 'white', 1.9, (src) => {
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 2600
    bp.Q.value = 0.9
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 700
    const g = ctx.createGain()
    g.gain.value = 0.12
    src.connect(hp)
    hp.connect(bp)
    bp.connect(g)
    return g
  })
}

function makePlainNoise(ctx: AudioContext, color: NoiseColor): BuiltInVoice {
  return chainNoise(ctx, color, color === 'white' ? 1.2 : 2.4, (src) => {
    const g = ctx.createGain()
    g.gain.value = color === 'white' ? 0.22 : color === 'pink' ? 0.28 : 0.32
    src.connect(g)
    return g
  })
}

export function createBuiltInVoice(ctx: AudioContext, id: BuiltInId): BuiltInVoice {
  switch (id) {
    case 'rain':
      return makeRain(ctx)
    case 'ocean':
      return makeOcean(ctx)
    case 'seaside':
      return makeSeaside(ctx)
    case 'campfire':
      return makeFire(ctx, true)
    case 'hearth':
      return makeFire(ctx, false)
    case 'forest_wind':
      return makeForestWind(ctx)
    case 'stream':
      return makeStream(ctx)
    case 'white':
      return makePlainNoise(ctx, 'white')
    case 'pink':
      return makePlainNoise(ctx, 'pink')
    case 'brown':
      return makePlainNoise(ctx, 'brown')
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}
