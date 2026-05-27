import { describe, expect, it, vi } from 'vitest';
import {
  decodeAudioDataWithRetry,
  fetchArrayBufferWithRetry,
  isRetryableHttpStatus
} from './loadAudioWithRetry';

describe('isRetryableHttpStatus', () => {
  it('treats transient and server errors as retryable', () => {
    expect(isRetryableHttpStatus(408)).toBe(true);
    expect(isRetryableHttpStatus(429)).toBe(true);
    expect(isRetryableHttpStatus(500)).toBe(true);
    expect(isRetryableHttpStatus(503)).toBe(true);
  });

  it('does not retry client errors', () => {
    expect(isRetryableHttpStatus(404)).toBe(false);
    expect(isRetryableHttpStatus(403)).toBe(false);
  });
});

describe('fetchArrayBufferWithRetry', () => {
  it('returns buffer on first successful response', async () => {
    const buffer = new ArrayBuffer(8);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(buffer)
      })
    );

    await expect(fetchArrayBufferWithRetry('/sounds/rain.ogg')).resolves.toBe(buffer);
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('retries on 503 then succeeds', async () => {
    const buffer = new ArrayBuffer(4);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(buffer)
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchArrayBufferWithRetry('/sounds/rain.ogg', { sleep: async () => undefined })
    ).resolves.toBe(buffer);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  it('does not retry on 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 })
    );

    await expect(
      fetchArrayBufferWithRetry('/missing.ogg', { sleep: async () => undefined })
    ).rejects.toThrow('404');
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('retries network failures up to maxAttempts', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchArrayBufferWithRetry('/sounds/rain.ogg', {
        maxAttempts: 2,
        sleep: async () => undefined
      })
    ).rejects.toThrow('network down');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
});

describe('decodeAudioDataWithRetry', () => {
  it('retries decode failures', async () => {
    const buffer = {} as AudioBuffer;
    const decode = vi
      .fn()
      .mockRejectedValueOnce(new Error('decode failed'))
      .mockResolvedValueOnce(buffer);
    const context = { decodeAudioData: decode } as unknown as AudioContext;

    await expect(
      decodeAudioDataWithRetry(context, new ArrayBuffer(4), { sleep: async () => undefined })
    ).resolves.toBe(buffer);
    expect(decode).toHaveBeenCalledTimes(2);
  });
});
