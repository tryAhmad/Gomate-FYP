import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { DocumentProvider } from "@/utils/DocumentContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

function RootLayoutNav() {
  const { isAuthenticated, loading, driver } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to welcome screen if not authenticated
      router.replace("/(auth)/welcome");
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect authenticated users away from auth screens
      // Check driver status and redirect appropriately
      if (driver) {
        const hasDocuments =
          driver.documents?.cnic || driver.documents?.drivingLicense;

        if (!hasDocuments) {
          router.replace("/driver-registration");
        } else if (driver.verificationStatus === "pending") {
          router.replace("/docs-pending");
        } else if (driver.verificationStatus === "approved") {
          router.replace("/");
        } else {
          router.replace("/driver-registration");
        }
      } else {
        router.replace("/driver-registration");
      }
    }
  }, [isAuthenticated, loading, segments, driver]);

  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#ffffff" }}
        edges={["right", "bottom", "left"]}
      >
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#ffffff" },
            headerTintColor: "#007AFF",
            headerTitleAlign: "center",
            headerTitleStyle: {
              fontWeight: "600",
              fontSize: 18,
              color: "#007AFF",
            },
            contentStyle: { backgroundColor: "#ffffff" },
            headerBackTitle: "Back",
            headerShadowVisible: true,
          }}
        >
          {/* Auth screens */}
          <Stack.Screen
            name="(auth)/welcome"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />

          {/* Protected screens */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="driver-registration"
            options={{ title: "Complete Registration" }}
          />
          <Stack.Screen
            name="driver-basic-info"
            options={{ title: "Basic Info" }}
          />
          <Stack.Screen
            name="cnic-images"
            options={{ title: "CNIC Verification" }}
          />
          <Stack.Screen
            name="selfie-with-id"
            options={{ title: "ID Confirmation" }}
          />
          <Stack.Screen
            name="driver's-license"
            options={{ title: "Driver's License" }}
          />
          <Stack.Screen
            name="vehicle-info"
            options={{ title: "Vehicle Information" }}
          />
          <Stack.Screen name="docs-pending" options={{ headerShown: false }} />
          <Stack.Screen
            name="ride-request"
            options={{ title: "Ride Request Details" }}
          />
          <Stack.Screen name="pickup" options={{ headerShown: false }} />
          <Stack.Screen
            name="ride-completed"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="ride-history" options={{ headerShown: false }} />
          <Stack.Screen name="earnings" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="support" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="dark" />
      </SafeAreaView>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DocumentProvider>
          <RootLayoutNav />
        </DocumentProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
