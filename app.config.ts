
import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Elevadoor",
  slug: "elevadoor",
  owner: "wrodolfull",
  version: "1.0.0",

  // Manter para compatibilidade com o login atual
  scheme: "condovery",

  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: "./assets/icon.png",

  ios: {
    bundleIdentifier: "pro.elevadoor.app",
    supportsTablet: true,
  },

  android: {
    package: "pro.elevadoor.app",
    ...(process.env.GOOGLE_SERVICES_FILE
      ? { googleServicesFile: process.env.GOOGLE_SERVICES_FILE }
      : {}),
  },

  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    "expo-font",
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#FC6741",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Permitir escolher uma foto para seu perfil e anúncios de Desapego.",
        cameraPermission: false,
        microphonePermission: false,
      },
    ],
  ],

  extra: {
    eas: {
      projectId: "6f11fe6b-f0ab-4757-99f0-30396e9c9edc",
    },
  },

  web: {
    bundler: "metro",
    output: "single",
  },
};

export default config;
