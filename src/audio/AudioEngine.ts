import { createAudioGraphPlan, type AudioGraphLayer, type PlayableSound } from './audioGraphPlan';
import type { MixerState } from '../domain/mixer';
import type { BuiltInSound } from '../domain/sounds';
import { assetUrl } from '../lib/assetUrl';
import { decodeAudioDataWithRetry, fetchArrayBufferWithRetry } from './loadAudioWithRetry';

interface ActiveLayer {
  source: AudioBufferSourceNode;
  gain: GainNode;
  panner: StereoPannerNode | null;
}

export interface AudioSyncOptions {
  /** When > 0, ramps master gain from silence to {@link MixerState.masterVolume} over this many seconds. */
  fadeInSeconds?: number;
}

export interface AudioSyncResult {
  /** Sound IDs that could not be loaded or decoded during this sync. */
  failedSoundIds: string[];
}

export class AudioEngine {
  private readonly context: AudioContext;
  private readonly master: GainNode;
  private readonly activeLayers = new Map<string, ActiveLayer>();
  private readonly bufferCache = new Map<string, AudioBuffer>();
  private syncVersion = 0;
  private masterFadeEndsAt: number | null = null;

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

  async sync(
    state: MixerState,
    sounds: PlayableSound[],
    options: AudioSyncOptions = {}
  ): Promise<AudioSyncResult> {
    const syncVersion = (this.syncVersion += 1);
    this.applyMasterVolume(state.masterVolume, options.fadeInSeconds ?? 0);

    if (!state.isPlaying || state.layers.length === 0) {
      this.stop();
      return { failedSoundIds: [] };
    }

    await this.resume();

    const plan = createAudioGraphPlan(state, sounds);
    const plannedIds = new Set(plan.map((layer) => layer.soundId));
    const failedSoundIds: string[] = [];

    for (const soundId of this.activeLayers.keys()) {
      if (!plannedIds.has(soundId)) {
        this.stopLayer(soundId);
      }
    }

    for (const layer of plan) {
      try {
        const active = this.activeLayers.get(layer.soundId) ?? (await this.startLayer(layer, syncVersion));
        if (!active || syncVersion !== this.syncVersion) {
          continue;
        }

        active.gain.gain.setTargetAtTime(layer.finalVolume, this.context.currentTime, 0.04);
        active.source.playbackRate.setTargetAtTime(layer.finalPlaybackRate, this.context.currentTime, 0.04);
        active.panner?.pan.setTargetAtTime(layer.finalPan, this.context.currentTime, 0.04);
      } catch {
        this.stopLayer(layer.soundId);
        failedSoundIds.push(layer.soundId);
      }
    }

    return { failedSoundIds };
  }

  /** Drops a cached decode so the next sync refetches the audio. */
  invalidateCachedBuffer(sound: PlayableSound): void {
    this.bufferCache.delete(this.bufferCacheKey(sound));
  }

  stop(): void {
    this.syncVersion += 1;
    this.clearMasterFade();
    for (const soundId of [...this.activeLayers.keys()]) {
      this.stopLayer(soundId);
    }
  }

  /**
   * Schedules a linear master-gain ramp (sleep/wake timers). While active, {@link sync}
   * does not overwrite the master gain until the ramp ends.
   */
  scheduleMasterVolumeRamp(targetVolume: number, durationSeconds: number): void {
    const now = this.context.currentTime;
    const duration = Math.max(0, durationSeconds);

    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);

    if (duration <= 0) {
      this.master.gain.setValueAtTime(targetVolume, now);
      this.clearMasterFade();
      return;
    }

    this.master.gain.linearRampToValueAtTime(targetVolume, now + duration);
    this.masterFadeEndsAt = now + duration;
  }

  /** Cancels a scheduled master ramp and sets gain immediately (timer cancel / restore). */
  setMasterVolumeImmediate(volume: number): void {
    const now = this.context.currentTime;
    this.clearMasterFade();
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(volume, now);
  }

  private applyMasterVolume(targetVolume: number, fadeInSeconds: number): void {
    const now = this.context.currentTime;

    if (fadeInSeconds > 0) {
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setValueAtTime(0, now);
      this.master.gain.linearRampToValueAtTime(targetVolume, now + fadeInSeconds);
      this.masterFadeEndsAt = now + fadeInSeconds;
      return;
    }

    if (this.masterFadeEndsAt !== null && now < this.masterFadeEndsAt) {
      return;
    }

    this.clearMasterFade();
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(targetVolume, now);
  }

  private clearMasterFade(): void {
    this.masterFadeEndsAt = null;
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

  private bufferCacheKey(sound: PlayableSound): string {
    return sound.kind === 'built-in' ? `built-in:${sound.id}` : `custom:${sound.id}:${sound.createdAt}`;
  }

  private async resolveBuffer(sound: PlayableSound): Promise<AudioBuffer> {
    const cacheKey = this.bufferCacheKey(sound);
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
    const data = await fetchArrayBufferWithRetry(url);
    return decodeAudioDataWithRetry(this.context, data);
  }
}
