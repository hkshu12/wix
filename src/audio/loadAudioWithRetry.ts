const DEFAULT_MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 200;

export interface LoadAudioRetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

export function isRetryableHttpStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export async function fetchArrayBufferWithRetry(
  url: string,
  options: LoadAudioRetryOptions = {}
): Promise<ArrayBuffer> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseDelayMs = options.baseDelayMs ?? BASE_DELAY_MS;
  const sleep = options.sleep ?? delay;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const error = new Error(`Failed to load audio (${response.status}): ${url}`);
        if (!isRetryableHttpStatus(response.status) || attempt === maxAttempts) {
          throw error;
        }
        lastError = error;
      } else {
        return response.arrayBuffer();
      }
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error(String(error));
      const httpStatus = parseHttpStatusFromLoadError(normalized);
      if (httpStatus !== null && !isRetryableHttpStatus(httpStatus)) {
        throw normalized;
      }
      lastError = normalized;
      if (attempt === maxAttempts) {
        throw lastError;
      }
    }

    await sleep(baseDelayMs * 2 ** (attempt - 1));
  }

  throw lastError ?? new Error(`Failed to load audio: ${url}`);
}

export async function decodeAudioDataWithRetry(
  context: AudioContext,
  data: ArrayBuffer,
  options: LoadAudioRetryOptions = {}
): Promise<AudioBuffer> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseDelayMs = options.baseDelayMs ?? BASE_DELAY_MS;
  const sleep = options.sleep ?? delay;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await context.decodeAudioData(data.slice(0));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === maxAttempts) {
        throw lastError;
      }
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }

  throw lastError ?? new Error('Failed to decode audio');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function parseHttpStatusFromLoadError(error: Error): number | null {
  const match = /Failed to load audio \((\d+)\)/.exec(error.message);
  return match ? Number(match[1]) : null;
}
