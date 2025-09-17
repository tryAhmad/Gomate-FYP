import { useColorScheme } from "@/hooks/useColorScheme";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#ffffff", 
          },
          headerTintColor: "#0286ff", 
          headerTitleStyle: {
            color: "#0286ff", 
          },
          contentStyle: {
            backgroundColor: "#ffffff", 
          },
          headerBackTitle: "Back",
        }}
      >
        <Stack.Screen name="index" options={{ title: "Register as Driver" }} />
        <Stack.Screen name="driver-basic-info" options={{ title: "Basic Info" }} />
        <Stack.Screen name="cnic-images" options={{ title: "CNIC Verification" }} />
        <Stack.Screen name="selfie-with-id" options={{ title: "ID Confirmation" }} />
        <Stack.Screen name="driver's-license" options={{ title: "Driver's License" }} />
        <Stack.Screen name="vehicle-info" options={{ title: "Vehicle Information" }} />
        <Stack.Screen
          name="docs-pending"
          options={{
            headerShown: false, 
          }}
        />
        <Stack.Screen
          name="landing_page"
          options={{
            headerShown: false, 
          }}
        />
      </Stack>
      <StatusBar style="dark" /> 
    </ThemeProvider>
  );
}

