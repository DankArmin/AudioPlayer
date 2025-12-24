import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

export const packagerConfig = {
  asar: true,
};
export const rebuildConfig = {};
export const makers = [
  {
    name: '@electron-forge/maker-squirrel',
    config: {
        name: 'dankophone',
        setupIcon: './assets/icon.ico',
        description: 'A lightweight desktop audio player built with Electron',
    },
  },
  {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {
        name: 'Dankophone',             
        icon: './assets/icon.icns'     
      }
    },
  {
    name: '@electron-forge/maker-deb',
    config: {
      icon: './assets/icon.png'
    },
  },
  {
    name: '@electron-forge/maker-rpm',
    config: {
      icon: './assets/icon.png'
    },
  },
];
export const plugins = [
  {
    name: '@electron-forge/plugin-auto-unpack-natives',
    config: {},
  },
  // Fuses are used to enable/disable various Electron functionality
  // at package time, before code signing the application
  new FusesPlugin({
    version: FuseVersion.V1,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableCookieEncryption]: true,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
  }),
];
