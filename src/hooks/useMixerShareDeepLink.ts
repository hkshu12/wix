import { useEffect, useRef } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { readMixerShareFromSearch, stripMixerShareFromSearch } from '../domain/mixerShareUrl';

export interface MixerShareDeepLinkOptions {
  pathname: string;
  search: string;
  navigate: NavigateFunction;
  ready: boolean;
  onImportShare: (shareJson: string) => void;
}

/**
 * Redirects non-studio routes that carry `?share=` to `/studio`, then imports once
 * custom tracks are hydrated and removes the query param from the address bar.
 */
export function useMixerShareDeepLink({
  pathname,
  search,
  navigate,
  ready,
  onImportShare
}: MixerShareDeepLinkOptions): void {
  const consumedRef = useRef(false);
  const importRef = useRef(onImportShare);
  importRef.current = onImportShare;

  useEffect(() => {
    const shareJson = readMixerShareFromSearch(search);
    if (!shareJson) {
      return;
    }

    if (pathname !== '/studio') {
      navigate({ pathname: '/studio', search }, { replace: true });
      return;
    }

    if (!ready || consumedRef.current) {
      return;
    }

    consumedRef.current = true;
    importRef.current(shareJson);

    const nextSearch = stripMixerShareFromSearch(search);
    navigate({ pathname: '/studio', search: nextSearch }, { replace: true });
  }, [navigate, pathname, ready, search]);
}
