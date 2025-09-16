import { Stack } from "expo-router"

const Layout = () => {
    return (
        <Stack>
            <Stack.Screen name="home" options={{ headerShown: false }} />
            <Stack.Screen name="newHome" options={{ headerShown: false }} />
            <Stack.Screen name="offers" options={{ headerShown: false }} />
            <Stack.Screen name="rideHistory" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="supportScreen" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
    )
}

export default Layout;