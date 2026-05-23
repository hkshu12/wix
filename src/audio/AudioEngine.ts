import { createAudioGraphPlan, type AudioGraphLayer, type PlayableSound } from './audioGraphPlan';
import type { MixerState } from '../domain/mixer';
import type { BuiltInSound } from '../domain/sounds';
import { assetUrl } from '../lib/assetUrl';

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
    const cacheKey =
      sound.kind === 'built-in' ? `built-in:${sound.id}` : `custom:${sound.id}:${sound.createdAt}`;
    const cached = this.bufferCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const buffer =
      sound.kind === 'built-in'
        ? await this.decodeBuiltInBuffer(sound)
        : await this.decodeCustomBuffer(sound.objectUrl);
    this.bufferCache.set(cacheKey, buffer);
    return buffer;
  }

  private async decodeBuiltInBuffer(sound: BuiltInSound): Promise<AudioBuffer> {
    return this.decodeFromUrl(assetUrl(sound.src));
  }

  private async decodeCustomBuffer(objectUrl: string): Promise<AudioBuffer> {
    return this.decodeFromUrl(objectUrl);
  }

  private async decodeFromUrl(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load audio (${response.status}): ${url}`);
    }
    const data = await response.arrayBuffer();
    return this.context.decodeAudioData(data.slice(0));
  }
}
