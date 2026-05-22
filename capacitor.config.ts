import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ambientmix.app',
  appName: 'Ambient Mix',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config
