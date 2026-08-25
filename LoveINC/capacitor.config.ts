import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.loveincnewberg.app',
  appName: 'Love INC',
  webDir: 'www',
  backgroundColor: '#ffffff',
  ios: {
    backgroundColor: '#ffffff',
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      androidIsEncryption: false,
    },
    CapacitorUpdater: {
      // Check on every foreground and apply immediately when an update is found -
      // this app can stay open for weeks without a cold start, so we don't wait for
      // one. A reload resets the JS context (router included); app.component.ts
      // saves/restores the current route across it so users land back where they
      // were instead of bouncing to the home screen.
      autoUpdate: 'always',
      updateUrl: 'https://api.grovlink.com/api/public-ota/update-check',
      // For local device testing against a locally-running GrovLink API, temporarily
      // point this at your Mac's LAN IP instead, e.g. 'http://192.168.1.23:3000/api/public-ota/update-check'.
      // This is native config baked in at `cap sync` time, not an Angular environment
      // file - changing it requires cap sync + a fresh Xcode build, not just a JS reload.
      appReadyTimeout: 10000,
    },
    SplashScreen: {
      launchShowDuration: 1000,
      launchFadeOutDuration: 1000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: true,
      autoHide: true,
    },
  },
};

export default config;
