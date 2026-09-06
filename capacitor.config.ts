import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cinevault.app',
  appName: 'CineVault',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      '*.tmdb.org',
      '*.themoviedb.org',
      '*.2embed.cc',
      '*.peachify.top',
      '*.supabase.co',
      '*.googleapis.com',
      '*'
    ]
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
