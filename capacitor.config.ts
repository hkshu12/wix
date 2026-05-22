import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.whiteNoiseMixer.studio',
  appName: 'White Noise Mixer',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
