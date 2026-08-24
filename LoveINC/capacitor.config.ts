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
      // Apply a downloaded bundle only at cold start, never mid-session - keeps the
      // SQLite migration gate (see app.component.ts) simple and never reloads the
      // webview out from under an active user.
      autoUpdate: 'onLaunch',
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
