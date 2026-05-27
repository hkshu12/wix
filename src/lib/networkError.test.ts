import { describe, expect, it } from 'vitest';
import { formatNetworkError } from './networkError';

describe('formatNetworkError', () => {
  it('maps failed to fetch to a friendly message', () => {
    expect(formatNetworkError(new TypeError('Failed to fetch'), '失败')).toBe('网络连接失败，请检查网络后重试');
  });

  it('keeps other error messages', () => {
    expect(formatNetworkError(new Error('无法获取发布信息（403）'), '失败')).toBe('无法获取发布信息（403）');
  });

  it('uses fallback for non-errors', () => {
    expect(formatNetworkError(null, '检查更新失败')).toBe('检查更新失败');
  });
});
