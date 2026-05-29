import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createInitialMixerState, toggleLayer } from '../domain/mixer';
import { serializeMixerShare } from '../domain/mixerShare';
import { encodeMixerShareForUrl } from '../domain/mixerShareUrl';
import { useMixerShareDeepLink } from './useMixerShareDeepLink';

function buildSearch(state = createInitialMixerState()) {
  const shareJson = serializeMixerShare(state);
  return `?share=${encodeMixerShareForUrl(shareJson)}`;
}

describe('useMixerShareDeepLink', () => {
  it('redirects non-studio routes that carry ?share= to /studio', async () => {
    const search = buildSearch();
    const navigate = vi.fn();
    const onImportShare = vi.fn();

    renderHook(() =>
      useMixerShareDeepLink({
        pathname: '/settings',
        search,
        navigate,
        ready: true,
        onImportShare
      })
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ pathname: '/studio', search }, { replace: true });
    });
    expect(onImportShare).not.toHaveBeenCalled();
  });

  it('imports share once on /studio when custom tracks are ready', async () => {
    const state = toggleLayer(createInitialMixerState(), 'rain');
    const search = buildSearch(state);
    const shareJson = serializeMixerShare(state);
    const navigate = vi.fn();
    const onImportShare = vi.fn();

    renderHook(() =>
      useMixerShareDeepLink({
        pathname: '/studio',
        search,
        navigate,
        ready: true,
        onImportShare
      })
    );

    await waitFor(() => {
      expect(onImportShare).toHaveBeenCalledWith(shareJson);
    });

    expect(navigate).toHaveBeenCalledWith(
      { pathname: '/studio', search: '' },
      { replace: true }
    );
  });

  it('waits for ready before importing on /studio', async () => {
    const search = buildSearch();
    const navigate = vi.fn();
    const onImportShare = vi.fn();

    const { rerender } = renderHook(
      ({ ready }) =>
        useMixerShareDeepLink({
          pathname: '/studio',
          search,
          navigate,
          ready,
          onImportShare
        }),
      { initialProps: { ready: false } }
    );

    expect(onImportShare).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();

    rerender({ ready: true });

    await waitFor(() => {
      expect(onImportShare).toHaveBeenCalledTimes(1);
    });
  });

  it('preserves other query params when stripping share', async () => {
    const state = createInitialMixerState();
    const shareJson = serializeMixerShare(state);
    const encoded = encodeMixerShareForUrl(shareJson);
    const search = `?share=${encoded}&utm=1`;
    const navigate = vi.fn();
    const onImportShare = vi.fn();

    renderHook(() =>
      useMixerShareDeepLink({
        pathname: '/studio',
        search,
        navigate,
        ready: true,
        onImportShare
      })
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(
        { pathname: '/studio', search: '?utm=1' },
        { replace: true }
      );
    });
  });

  it('does nothing when there is no share query param', () => {
    const navigate = vi.fn();
    const onImportShare = vi.fn();

    renderHook(() =>
      useMixerShareDeepLink({
        pathname: '/studio',
        search: '?utm=1',
        navigate,
        ready: true,
        onImportShare
      })
    );

    expect(navigate).not.toHaveBeenCalled();
    expect(onImportShare).not.toHaveBeenCalled();
  });
});
