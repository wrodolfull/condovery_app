import type { ExpoConfig } from "expo/config";
const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
const config: ExpoConfig = {
  name: "Elevadoor",
  slug: "condovery-app",
  version: "1.0.0",
  scheme: "condovery",
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: "./assets/icon.png",
  ios: { bundleIdentifier: "com.wrodolfull.condovery", supportsTablet: true },
  android: {
    package: "com.wrodolfull.condovery",
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
      { icon: "./assets/notification-icon.png", color: "#FC6741" },
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
  extra: { ...(projectId ? { eas: { projectId } } : {}) },
  web: { bundler: "metro", output: "single" },
};
export default config;
