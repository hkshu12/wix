import { registerPlugin } from '@capacitor/core';

export interface ApkInstallerPlugin {
  install(options: { uri: string }): Promise<void>;
  canInstall(): Promise<{ allowed: boolean }>;
  openInstallPermissionSettings(): Promise<void>;
}

export const ApkInstaller = registerPlugin<ApkInstallerPlugin>('ApkInstaller');
