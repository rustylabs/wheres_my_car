import type {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig =
{
  appId: 'com.wheres_my_car.app',
  appName: "Where's my Car",
  webDir: 'dist',

  plugins:
  {
    LocalNotifications:
    {
      smallIcon: "warning"
    },
    SplashScreen:
    {
      /*
      //androidScaleType: "CENTER_CROP",
      splashFullScreen: false,
      splashImmersive: false,
      //splashMode: "full",
      layoutName: "launch_screen",
      useDialog: false,
      */
      launchShowDuration: 3000,
      launchAutoHide: true,
      launchFadeOutDuration: 3000,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
  },

};

export default config;
