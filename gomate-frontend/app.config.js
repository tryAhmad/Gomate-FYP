import "dotenv/config";

export default {
  expo: {
    name: "Gomate",
    slug: "fyp-gomate",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "gomatefrontend",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.MAPS_API_KEY,
      },
    },
    android: {
      package: "com.tryahmad.gomate",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: "pan",
      config: {
        googleMaps: {
          apiKey: process.env.MAPS_API_KEY,
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
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      MAPS_API_KEY: process.env.MAPS_API_KEY,
      USER_IP: process.env.USER_IP,
      USER_TOKEN: process.env.USER_TOKEN,
      router: {},
      eas: {
        projectId: "a5880b66-c286-4142-9f6e-58f14d7ce086",
      },
    },
    owner: "tryahmad",
  },
};
