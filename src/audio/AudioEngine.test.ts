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

class FakeAudioParam {
  value = 0;

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
  private pendingDecode: ((buffer: FakeAudioBuffer) => void) | null = null;

  createGain(): FakeGainNode {
    return new FakeGainNode();
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
