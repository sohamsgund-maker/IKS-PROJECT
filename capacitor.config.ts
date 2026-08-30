import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aditya.cinevault',
  appName: 'CineVault',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-3940256099942544~3347511713', // Official Google AdMob sample App ID for verification
      initializeForTesting: true
    }
  }
};

export default config;
