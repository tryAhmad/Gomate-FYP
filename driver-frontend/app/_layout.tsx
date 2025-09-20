import { StatusBar } from 'expo-status-bar';
import { Platform, useColorScheme } from 'react-native';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['right', 'bottom', 'left']}>
          <Stack
            screenOptions={{
              headerStyle: { 
                backgroundColor: '#ffffff',
              },
              headerTintColor: '#007AFF',
              headerTitleAlign: 'center',
              headerTitleStyle: { fontWeight: '600', fontSize: 18, color: '#007AFF' },
              contentStyle: { 
                backgroundColor: '#ffffff',
              },
              headerBackTitle: 'Back',
              headerShadowVisible: true,
            }}
          >
            <Stack.Screen name="index" options={{ title: 'Register as Driver' }} />
            <Stack.Screen name="driver-basic-info" options={{ title: 'Basic Info' }} />
            <Stack.Screen name="cnic-images" options={{ title: 'CNIC Verification' }} />
            <Stack.Screen name="selfie-with-id" options={{ title: 'ID Confirmation' }} />
            <Stack.Screen name="driver\'s-license" options={{ title: 'Driver\'s License' }} />
            <Stack.Screen name="vehicle-info" options={{ title: 'Vehicle Information' }} />
            <Stack.Screen name="docs-pending" options={{ headerShown: false }} />
            <Stack.Screen name="landing_page" options={{ headerShown: false }} />
            <Stack.Screen name="ride-request" options={{ title: 'Ride Request Details' }} />
            <Stack.Screen name="pickup" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="dark" />
        </SafeAreaView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

