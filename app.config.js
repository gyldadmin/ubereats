export default {
  expo: {
    name: "Gyld Native",
    slug: "gyld-native",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: false,
          splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      },
    assetBundlePatterns: [
      "**/*"
    ],
          plugins: [
    "expo-font"
  ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.gyld.native",
      infoPlist: {
        UIBackgroundModes: ["remote-notification"],
        ITSAppUsesNonExemptEncryption: false
      },
      entitlements: {
        "aps-environment": "development"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
      EXPO_PUBLIC_PROJECT_ID: "30fdedf3-f7d6-4b60-8601-2b1cdcf878e1",
      eas: {
        projectId: "30fdedf3-f7d6-4b60-8601-2b1cdcf878e1"
      }
    }
  }
}; 