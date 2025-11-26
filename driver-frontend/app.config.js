import "dotenv/config";

export default {
  expo: {
    name: "Driver",
    slug: "Driver",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "driver",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      package: "com.maheera.driver",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "INTERNET",
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      "expo-font",
      "expo-web-browser",
      [
        "expo-build-properties",
        {
          android: {
            extraMavenRepos: [],
          },
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            manifestApplicationMetaData: [
              {
                name: "com.google.android.geo.API_KEY",
                value: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
              },
            ],
          },
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
    },
    extra: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY, // For mapsApi.ts
      BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL,
      eas: {
        projectId: "36030896-40c2-4ba5-9dd2-b824c19e182f",
      },
    },
  },
};
