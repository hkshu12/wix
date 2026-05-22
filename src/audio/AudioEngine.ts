import { createAudioGraphPlan, type AudioGraphLayer, type PlayableSound } from './audioGraphPlan';
import type { MixerState } from '../domain/mixer';
import type { BuiltInSound, ProceduralEngineKind } from '../domain/sounds';

interface ActiveLayer {
  source: AudioBufferSourceNode;
  gain: GainNode;
  panner: StereoPannerNode | null;
}

export class AudioEngine {
  private readonly context: AudioContext;
  private readonly master: GainNode;
  private readonly activeLayers = new Map<string, ActiveLayer>();
  private readonly bufferCache = new Map<string, AudioBuffer>();
  private syncVersion = 0;

  constructor(context: AudioContext = new AudioContext()) {
    this.context = context;
    this.master = context.createGain();
    this.master.connect(context.destination);
  }

  async resume(): Promise<void> {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  async sync(state: MixerState, sounds: PlayableSound[]): Promise<void> {
    const syncVersion = (this.syncVersion += 1);
    this.master.gain.value = state.masterVolume;

    if (!state.isPlaying || state.layers.length === 0) {
      this.stop();
      return;
    }

    await this.resume();

    const plan = createAudioGraphPlan(state, sounds);
    const plannedIds = new Set(plan.map((layer) => layer.soundId));

    for (const soundId of this.activeLayers.keys()) {
      if (!plannedIds.has(soundId)) {
        this.stopLayer(soundId);
      }
    }

    for (const layer of plan) {
      const active = this.activeLayers.get(layer.soundId) ?? (await this.startLayer(layer, syncVersion));
      if (!active || syncVersion !== this.syncVersion) {
        continue;
      }

      active.gain.gain.setTargetAtTime(layer.finalVolume, this.context.currentTime, 0.04);
      active.source.playbackRate.setTargetAtTime(layer.finalPlaybackRate, this.context.currentTime, 0.04);
      active.panner?.pan.setTargetAtTime(layer.finalPan, this.context.currentTime, 0.04);
    }
  }

  stop(): void {
    this.syncVersion += 1;
    for (const soundId of [...this.activeLayers.keys()]) {
      this.stopLayer(soundId);
    }
  }

  private async startLayer(layer: AudioGraphLayer, syncVersion: number): Promise<ActiveLayer | null> {
    const buffer = await this.resolveBuffer(layer.sound);
    if (syncVersion !== this.syncVersion) {
      return null;
    }

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    const panner = typeof this.context.createStereoPanner === 'function' ? this.context.createStereoPanner() : null;

    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = layer.finalPlaybackRate;
    gain.gain.value = 0;

    source.connect(gain);
    if (panner) {
      gain.connect(panner);
      panner.connect(this.master);
      panner.pan.value = layer.finalPan;
    } else {
      gain.connect(this.master);
    }

    source.start();

    const activeLayer = { source, gain, panner };
    this.activeLayers.set(layer.soundId, activeLayer);
    return activeLayer;
  }

  private stopLayer(soundId: string): void {
    const layer = this.activeLayers.get(soundId);
    if (!layer) {
      return;
    }

    layer.gain.gain.setTargetAtTime(0, this.context.currentTime, 0.02);
    try {
      layer.source.stop(this.context.currentTime + 0.08);
    } catch {
      // Stopping an already-finished source throws in some browser engines.
    }
    this.activeLayers.delete(soundId);
  }

  private async resolveBuffer(sound: PlayableSound): Promise<AudioBuffer> {
    const cacheKey = sound.kind === 'built-in' ? `built-in:${sound.id}` : `custom:${sound.id}:${sound.createdAt}`;
    const cached = this.bufferCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const buffer = sound.kind === 'built-in' ? this.createProceduralBuffer(sound) : await this.decodeCustomBuffer(sound.objectUrl);
    this.bufferCache.set(cacheKey, buffer);
    return buffer;
  }

  private async decodeCustomBuffer(objectUrl: string): Promise<AudioBuffer> {
    const response = await fetch(objectUrl);
    const data = await response.arrayBuffer();
    return this.context.decodeAudioData(data.slice(0));
  }

  private createProceduralBuffer(sound: BuiltInSound): AudioBuffer {
    const seconds = sound.engine.kind === 'surf' ? 6 : 3;
    const buffer = this.context.createBuffer(2, this.context.sampleRate * seconds, this.context.sampleRate);

    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const samples = buffer.getChannelData(channel);
      fillProceduralSamples(samples, sound.engine.kind, this.context.sampleRate, channel);
    }

    return buffer;
  }
}

function fillProceduralSamples(samples: Float32Array, kind: ProceduralEngineKind, sampleRate: number, channel: number): void {
  let brown = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const t = index / sampleRate;
    const white = Math.random() * 2 - 1;
    brown = (brown + 0.02 * white) / 1.02;

    const panOffset = channel === 0 ? 0 : 0.037;
    const slowWave = Math.sin((t + panOffset) * Math.PI * 0.45) * 0.5 + 0.5;
    const mediumWave = Math.sin((t + panOffset) * Math.PI * 2.1) * 0.5 + 0.5;

    switch (kind) {
      case 'crackle':
      case 'hearth':
        samples[index] = (white * 0.08 + brown * 1.8) + (Math.random() > 0.995 ? white * 0.7 : 0);
        break;
      case 'rain':
        samples[index] = white * (0.24 + mediumWave * 0.1);
        break;
      case 'surf':
        samples[index] = brown * (2.4 + slowWave * 2.2) + white * 0.025;
        break;
      case 'rumble':
        samples[index] = brown * 3.6 + Math.sin(t * Math.PI * 1.2) * 0.08;
        break;
      case 'forest':
        samples[index] = white * 0.06 + brown * 0.7 + Math.sin(t * Math.PI * (9 + channel)) * 0.015;
        break;
      case 'brown':
        samples[index] = brown * 3.2;
        break;
      case 'pink':
        samples[index] = brown * 1.5 + white * 0.12;
        break;
    }
  }
}
