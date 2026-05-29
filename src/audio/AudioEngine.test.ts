import { describe, expect, it, vi } from 'vitest';
import { AudioEngine } from './AudioEngine';
import type { MixerState } from '../domain/mixer';
import type { CustomTrack } from '../storage/customLibrary';

describe('AudioEngine lifecycle', () => {
  it('does not start a custom layer if playback stops while decoding', async () => {
    const context = new FakeAudioContext();
    const engine = new AudioEngine(context as unknown as AudioContext);
    const customSound: CustomTrack = {
      id: 'custom-1',
      kind: 'custom',
      title: 'custom',
      fileName: 'custom.mp3',
      mimeType: 'audio/mpeg',
      size: 4,
      createdAt: 1,
      objectUrl: 'blob:custom-1'
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(4))
      })
    );

    const decoding = engine.sync(createState(true), [customSound]);
    await waitForPendingDecode(context);

    await engine.sync(createState(false), [customSound]);
    context.resolveDecode();
    await decoding;

    expect(context.sources.every((source) => !source.started)).toBe(true);
    vi.unstubAllGlobals();
  });

  it('reports failed sound ids when one layer cannot load and keeps other layers playing', async () => {
    const context = new FakeAudioContext({ immediateDecode: true });
    const engine = new AudioEngine(context as unknown as AudioContext);
    const customSound: CustomTrack = {
      id: 'custom-ok',
      kind: 'custom',
      title: 'ok',
      fileName: 'ok.mp3',
      mimeType: 'audio/mpeg',
      size: 4,
      createdAt: 1,
      objectUrl: 'blob:custom-ok'
    };
    const failingSound: CustomTrack = {
      id: 'custom-fail',
      kind: 'custom',
      title: 'fail',
      fileName: 'fail.mp3',
      mimeType: 'audio/mpeg',
      size: 4,
      createdAt: 2,
      objectUrl: 'blob:custom-fail'
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('custom-fail')) {
          return Promise.reject(new Error('network'));
        }

        return Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(4))
        });
      })
    );

    const result = await engine.sync(
      {
        isPlaying: true,
        masterVolume: 1,
        stereoWidth: 1,
        playbackRate: 1,
        layers: [
          { soundId: 'custom-ok', volume: 1, pan: 0, playbackRate: 1, muted: false },
          { soundId: 'custom-fail', volume: 1, pan: 0, playbackRate: 1, muted: false }
        ]
      },
      [customSound, failingSound]
    );

    expect(result.failedSoundIds).toEqual(['custom-fail']);
    expect(context.sources.filter((source) => source.started)).toHaveLength(1);

    engine.invalidateCachedBuffer(failingSound);
    vi.unstubAllGlobals();
  });

  it('ramps master gain from silence when fadeInSeconds is set', async () => {
    const context = new FakeAudioContext({ immediateDecode: true });
    const engine = new AudioEngine(context as unknown as AudioContext);
    const customSound: CustomTrack = {
      id: 'custom-1',
      kind: 'custom',
      title: 'custom',
      fileName: 'custom.mp3',
      mimeType: 'audio/mpeg',
      size: 4,
      createdAt: 1,
      objectUrl: 'blob:custom-1'
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(4))
      })
    );

    await engine.sync(
      {
        isPlaying: true,
        masterVolume: 0.8,
        stereoWidth: 1,
        playbackRate: 1,
        layers: [{ soundId: 'custom-1', volume: 1, pan: 0, playbackRate: 1, muted: false }]
      },
      [customSound],
      { fadeInSeconds: 4 }
    );

    const master = context.masterGain!;
    expect(master.gain.scheduled).toEqual([
      { type: 'cancel', time: 0 },
      { type: 'set', time: 0, value: 0 },
      { type: 'linearRamp', time: 4, value: 0.8 }
    ]);

    vi.unstubAllGlobals();
  });

  it('applies a new master volume while a playback fade-in ramp is still active', async () => {
    const context = new FakeAudioContext({ immediateDecode: true });
    const engine = new AudioEngine(context as unknown as AudioContext);
    const customSound: CustomTrack = {
      id: 'custom-1',
      kind: 'custom',
      title: 'custom',
      fileName: 'custom.mp3',
      mimeType: 'audio/mpeg',
      size: 4,
      createdAt: 1,
      objectUrl: 'blob:custom-1'
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(4))
      })
    );

    const playingState: MixerState = {
      isPlaying: true,
      masterVolume: 0.8,
      stereoWidth: 1,
      playbackRate: 1,
      layers: [{ soundId: 'custom-1', volume: 1, pan: 0, playbackRate: 1, muted: false }]
    };

    await engine.sync(playingState, [customSound], { fadeInSeconds: 4 });

    context.currentTime = 1;
    await engine.sync({ ...playingState, masterVolume: 0.35 }, [customSound]);

    const master = context.masterGain!;
    expect(master.gain.scheduled.at(-1)).toEqual({ type: 'set', time: 1, value: 0.35 });

    vi.unstubAllGlobals();
  });
});

async function waitForPendingDecode(context: FakeAudioContext): Promise<void> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (context.hasPendingDecode()) {
      return;
    }

    await Promise.resolve();
  }

  throw new Error('Expected decodeAudioData to be pending');
}

function createState(isPlaying: boolean): MixerState {
  return {
    isPlaying,
    masterVolume: 1,
    stereoWidth: 1,
    playbackRate: 1,
    layers: [{ soundId: 'custom-1', volume: 1, pan: 0, playbackRate: 1, muted: false }]
  };
}

type GainScheduleStep =
  | { type: 'cancel'; time: number }
  | { type: 'set'; time: number; value: number }
  | { type: 'linearRamp'; time: number; value: number };

class FakeAudioParam {
  value = 0;
  scheduled: GainScheduleStep[] = [];

  cancelScheduledValues(time: number): void {
    this.scheduled.push({ type: 'cancel', time });
  }

  setValueAtTime(value: number, time: number): void {
    this.scheduled.push({ type: 'set', time, value });
    this.value = value;
  }

  linearRampToValueAtTime(value: number, time: number): void {
    this.scheduled.push({ type: 'linearRamp', time, value });
  }

  setTargetAtTime(value: number): void {
    this.value = value;
  }
}

class FakeAudioNode {
  connect(): FakeAudioNode {
    return this;
  }
}

class FakeAudioBufferSourceNode extends FakeAudioNode {
  buffer: FakeAudioBuffer | null = null;
  loop = false;
  playbackRate = new FakeAudioParam();
  started = false;
  stopped = false;

  start(): void {
    this.started = true;
  }

  stop(): void {
    this.stopped = true;
  }
}

class FakeGainNode extends FakeAudioNode {
  gain = new FakeAudioParam();
}

class FakeStereoPannerNode extends FakeAudioNode {
  pan = new FakeAudioParam();
}

class FakeAudioBuffer {
  numberOfChannels = 2;

  getChannelData(): Float32Array {
    return new Float32Array(16);
  }
}

class FakeAudioContext {
  state: AudioContextState = 'running';
  sampleRate = 16;
  currentTime = 0;
  destination = new FakeAudioNode();
  sources: FakeAudioBufferSourceNode[] = [];
  masterGain: FakeGainNode | null = null;
  private pendingDecode: ((buffer: FakeAudioBuffer) => void) | null = null;
  private readonly immediateDecode: boolean;

  constructor(options: { immediateDecode?: boolean } = {}) {
    this.immediateDecode = options.immediateDecode ?? false;
  }

  createGain(): FakeGainNode {
    const gain = new FakeGainNode();
    if (!this.masterGain) {
      this.masterGain = gain;
    }
    return gain;
  }

  createStereoPanner(): FakeStereoPannerNode {
    return new FakeStereoPannerNode();
  }

  createBufferSource(): FakeAudioBufferSourceNode {
    const source = new FakeAudioBufferSourceNode();
    this.sources.push(source);
    return source;
  }

  createBuffer(): FakeAudioBuffer {
    return new FakeAudioBuffer();
  }

  decodeAudioData(): Promise<FakeAudioBuffer> {
    if (this.immediateDecode) {
      return Promise.resolve(new FakeAudioBuffer());
    }

    return new Promise((resolve) => {
      this.pendingDecode = resolve;
    });
  }

  hasPendingDecode(): boolean {
    return this.pendingDecode !== null;
  }

  resume(): Promise<void> {
    return Promise.resolve();
  }

  resolveDecode(): void {
    this.pendingDecode?.(new FakeAudioBuffer());
  }
}
