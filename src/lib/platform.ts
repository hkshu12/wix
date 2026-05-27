import { Capacitor } from '@capacitor/core';

export type AppPlatform = 'android' | 'web';

export function getAppPlatform(): AppPlatform {
  return Capacitor.getPlatform() === 'android' ? 'android' : 'web';
}

export function isAndroidApp(): boolean {
  return getAppPlatform() === 'android';
}

export function shouldShowLandingPage(): boolean {
  return !isAndroidApp();
}
