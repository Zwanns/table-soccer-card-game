import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.totalsoccermundial.game',
  appName: 'Total Soccer: Mundial',
  webDir: 'dist',
  plugins: {
    App: {
      disableBackButtonHandler: true
    }
  }
};

export default config;
