
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pitchperfectai.app',
  appName: 'PitchPerfect AI',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://ac4815ee-3287-4227-becd-7ec7f5c2d508.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
