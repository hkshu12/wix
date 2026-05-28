import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createInitialMixerState, toggleLayer } from '../domain/mixer';
import { serializeMixerShare } from '../domain/mixerShare';
import { encodeMixerShareForUrl } from '../domain/mixerShareUrl';
import { useAndroidMixerShareDeepLink } from './useAndroidMixerShareDeepLink';

const getLaunchUrl = vi.fn();
const addListener = vi.fn();

vi.mock('@capacitor/app', () => ({
  App: {
    getLaunchUrl: (...args: unknown[]) => getLaunchUrl(...args),
    addListener: (...args: unknown[]) => addListener(...args)
  }
}));

vi.mock('../lib/platform', () => ({
  isAndroidApp: () => true
}));

describe('useAndroidMixerShareDeepLink', () => {
  beforeEach(() => {
    getLaunchUrl.mockReset();
    addListener.mockReset();
    addListener.mockResolvedValue({ remove: vi.fn() });
  });

  it('navigates to studio when launched from a share URL', async () => {
    const shareJson = serializeMixerShare(toggleLayer(createInitialMixerState(), 'rain'));
    const search = `?share=${encodeMixerShareForUrl(shareJson)}`;
    const launchUrl = `https://hkshu12.github.io/wix/studio${search}`;

    getLaunchUrl.mockResolvedValue({ url: launchUrl });

    const navigate = vi.fn();

    renderHook(() => useAndroidMixerShareDeepLink(navigate));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ pathname: '/studio', search }, { replace: true });
    });
  });

  it('navigates on appUrlOpen events', async () => {
    getLaunchUrl.mockResolvedValue(undefined);

    let urlHandler: ((event: { url: string }) => void) | undefined;
    addListener.mockImplementation(async (_event, handler) => {
      urlHandler = handler;
      return { remove: vi.fn() };
    });

    const shareJson = serializeMixerShare(createInitialMixerState());
    const search = `?share=${encodeMixerShareForUrl(shareJson)}`;
    const navigate = vi.fn();

    renderHook(() => useAndroidMixerShareDeepLink(navigate));

    await waitFor(() => {
      expect(urlHandler).toBeDefined();
    });

    urlHandler?.({ url: `https://localhost/studio${search}` });

    expect(navigate).toHaveBeenCalledWith({ pathname: '/studio', search }, { replace: true });
  });
});
