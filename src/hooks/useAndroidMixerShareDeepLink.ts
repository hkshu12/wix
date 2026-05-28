import { App } from '@capacitor/app';
import { useEffect } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { extractStudioShareRouteFromAppUrl } from '../domain/androidAppUrl';
import { isAndroidApp } from '../lib/platform';

/**
 * When the Android app is opened from a mixer share link, navigate to Studio with
 * the `share` query so {@link useMixerShareDeepLink} can import the mix.
 */
export function useAndroidMixerShareDeepLink(navigate: NavigateFunction): void {
  useEffect(() => {
    if (!isAndroidApp()) {
      return;
    }

    const openShareRoute = (rawUrl: string) => {
      const route = extractStudioShareRouteFromAppUrl(rawUrl);
      if (!route) {
        return;
      }

      navigate({ pathname: route.pathname, search: route.search }, { replace: true });
    };

    void App.getLaunchUrl().then((result) => {
      if (result?.url) {
        openShareRoute(result.url);
      }
    });

    let removeListener: (() => void) | undefined;
    let cancelled = false;

    void App.addListener('appUrlOpen', (event) => {
      openShareRoute(event.url);
    }).then((handle) => {
      if (cancelled) {
        void handle.remove();
        return;
      }

      removeListener = () => {
        void handle.remove();
      };
    });

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [navigate]);
}
