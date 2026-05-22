import type { BuiltinSoundId } from './types'

/** Create looping ambient buffer from procedural synthesis */
export function createProceduralBuffer(
  ctx: AudioContext,
  type: BuiltinSoundId,
  duration = 4,
): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const length = Math.floor(sampleRate * duration)
  const buffer = ctx.createBuffer(2, length, sampleRate)
  const L = buffer.getChannelData(0)
  const R = buffer.getChannelData(1)

  switch (type) {
    case 'rain':
      fillRain(L, R, sampleRate)
      break
    case 'ocean':
      fillOcean(L, R, sampleRate)
      break
    case 'campfire':
      fillCampfire(L, R, sampleRate)
      break
    case 'fireplace':
      fillFireplace(L, R, sampleRate)
      break
    case 'wind':
      fillWind(L, R, sampleRate)
      break
    case 'forest':
      fillForest(L, R, sampleRate)
      break
    case 'thunder':
      fillThunder(L, R, sampleRate)
      break
    case 'stream':
      fillStream(L, R, sampleRate)
      break
    case 'night':
      fillNight(L, R, sampleRate)
      break
    case 'cafe':
      fillCafe(L, R, sampleRate)
      break
  }

  return buffer
}

function whiteNoise(): number {
  return Math.random() * 2 - 1
}

function pinkNoise(state: { b0: number; b1: number; b2: number }): number {
  const white = whiteNoise()
  state.b0 = 0.99886 * state.b0 + white * 0.0555179
  state.b1 = 0.99332 * state.b1 + white * 0.0750759
  state.b2 = 0.969 * state.b2 + white * 0.153852
  return (state.b0 + state.b1 + state.b2 + white * 0.3104856) * 0.11
}

function fillRain(L: Float32Array, R: Float32Array, sr: number) {
  const pink = { b0: 0, b1: 0, b2: 0 }
  for (let i = 0; i < L.length; i++) {
    const t = i / sr
    const mod = 0.7 + 0.3 * Math.sin(t * 0.5)
    const n = pinkNoise(pink) * mod
    const drip = Math.random() < 0.0008 ? (Math.random() - 0.5) * 0.4 : 0
    L[i] = n * 0.35 + drip
    R[i] = n * 0.33 + drip * 0.9
  }
}

function fillOcean(L: Float32Array, R: Float32Array, sr: number) {
  const pink = { b0: 0, b1: 0, b2: 0 }
  for (let i = 0; i < L.length; i++) {
    const t = i / sr
    const wave = Math.sin(t * 0.35) * 0.5 + Math.sin(t * 0.17) * 0.3
    const surf = Math.pow(Math.max(0, Math.sin(t * 0.9 + wave)), 2) * pinkNoise(pink)
    L[i] = surf * 0.45 + pinkNoise(pink) * 0.08
    R[i] = surf * 0.42 + pinkNoise(pink) * 0.07
  }
}

function fillCampfire(L: Float32Array, R: Float32Array, sr: number) {
  const pink = { b0: 0, b1: 0, b2: 0 }
  let crackle = 0
  for (let i = 0; i < L.length; i++) {
    if (Math.random() < 0.002) crackle = (Math.random() - 0.5) * 0.6
    crackle *= 0.92
    const base = pinkNoise(pink) * 0.15 + Math.sin(i / sr * 80) * 0.02
    L[i] = base + crackle
    R[i] = base * 0.95 + crackle * 0.85
  }
}

function fillFireplace(L: Float32Array, R: Float32Array, sr: number) {
  const pink = { b0: 0, b1: 0, b2: 0 }
  let rumble = 0
  for (let i = 0; i < L.length; i++) {
    const t = i / sr
    rumble = rumble * 0.995 + (Math.random() - 0.5) * 0.01
    const low = Math.sin(t * 2.1) * 0.08 + rumble
    const pop = Math.random() < 0.0015 ? (Math.random() - 0.5) * 0.35 : 0
    const hiss = pinkNoise(pink) * 0.12
    L[i] = low + hiss + pop
    R[i] = low * 0.98 + hiss * 0.95 + pop * 0.9
  }
}

function fillWind(L: Float32Array, R: Float32Array, sr: number) {
  const pink = { b0: 0, b1: 0, b2: 0 }
  let env = 0.3
  for (let i = 0; i < L.length; i++) {
    const t = i / sr
    env = env * 0.9995 + (Math.sin(t * 0.2) * 0.5 + 0.5) * 0.0005
    const n = pinkNoise(pink) * env
    L[i] = n * 0.4
    R[i] = n * 0.38
  }
}

function fillForest(L: Float32Array, R: Float32Array, sr: number) {
  const pink = { b0: 0, b1: 0, b2: 0 }
  for (let i = 0; i < L.length; i++) {
    const t = i / sr
    const wind = pinkNoise(pink) * 0.12
    const bird =
      Math.random() < 0.0003
        ? Math.sin(t * 2000 + Math.random() * 500) * Math.exp(-((i % 800) / 200)) * 0.15
        : 0
    L[i] = wind + bird
    R[i] = wind * 0.9 + bird * 0.8
  }
}

function fillThunder(L: Float32Array, R: Float32Array, sr: number) {
  const pink = { b0: 0, b1: 0, b2: 0 }
  let boom = 0
  for (let i = 0; i < L.length; i++) {
    if (Math.random() < 0.0004) boom = 0.7
    boom *= 0.985
    const rain = pinkNoise(pink) * 0.2
    L[i] = rain + boom * Math.sin(i / sr * 40) * 0.3
    R[i] = rain * 0.95 + boom * Math.sin(i / sr * 38) * 0.28
  }
}

function fillStream(L: Float32Array, R: Float32Array, sr: number) {
  const pink = { b0: 0, b1: 0, b2: 0 }
  for (let i = 0; i < L.length; i++) {
    const t = i / sr
    const flow = pinkNoise(pink) * (0.25 + Math.sin(t * 3) * 0.1)
    const bubble = Math.random() < 0.001 ? (Math.random() - 0.5) * 0.2 : 0
    L[i] = flow + bubble
    R[i] = flow * 0.92 + bubble
  }
}

function fillNight(L: Float32Array, R: Float32Array, sr: number) {
  const pink = { b0: 0, b1: 0, b2: 0 }
  for (let i = 0; i < L.length; i++) {
    const t = i / sr
    const cricket =
      Math.sin(t * 4000) * Math.max(0, Math.sin(t * 8)) * 0.03 * (Math.random() < 0.5 ? 1 : 0)
    const hum = pinkNoise(pink) * 0.06
    L[i] = hum + cricket
    R[i] = hum * 0.9 + cricket * 0.85
  }
}

function fillCafe(L: Float32Array, R: Float32Array, _sr: number) {
  void _sr
  const pink = { b0: 0, b1: 0, b2: 0 }
  for (let i = 0; i < L.length; i++) {
    const murmur = pinkNoise(pink) * 0.18
    const clink = Math.random() < 0.0005 ? (Math.random() - 0.5) * 0.25 : 0
    L[i] = murmur + clink
    R[i] = murmur * 0.95 + clink * 0.9
  }
}
