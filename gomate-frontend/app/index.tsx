import { getSocket } from "@/utils/socket";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  LogBox,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import * as Notifications from "expo-notifications";

LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
  "`expo-notifications` functionality is not fully supported in Expo Go",
]);

const Home = () => {
  const passengerId = "688c69f20653ec0f43df6e2c";
  const socket = getSocket();

  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Enable notifications in settings.");
      }

      // Setup channel for Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          sound: "default",
        });
      }
    })();
  }, []);

    useEffect(() => {
      if (!passengerId) return;

      // Only show connecting if socket isn't already connected
      if (!socket.connected) {
        setIsConnecting(true);
        setConnectionError(null);
      } else {
        setIsConnecting(false);
        setIsConnected(true);
      }

      // ✅ Event Handlers
      const handleConnect = () => {
        console.log("✅ Passenger connected:", socket.id);
        socket.emit("registerPassenger", { passengerId });
        setIsConnecting(false);
        setIsConnected(true);
      };

      const handleConnectError = (error: any) => {
        console.log("❌ Connection error:", error.message);
        setIsConnecting(false);
        setConnectionError("Failed to connect. Please try again.");
        setIsConnected(false);
      };

      const handleDisconnect = (reason: string) => {
        console.log("⚠️ Disconnected:", reason);
        setIsConnected(false);
        if (reason === "io server disconnect") {
          // Let singleton handle auto-reconnect
          console.log("Attempting manual reconnect...");
          socket.connect();
        }
      };

      // ✅ Always clear old listeners first
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);

      // ✅ Attach fresh listeners
      socket.on("connect", handleConnect);
      socket.on("connect_error", handleConnectError);
      socket.on("disconnect", handleDisconnect);

      // ✅ Ensure the socket is connected (singleton handles this safely)
      if (!socket.connected) socket.connect();

      // Cleanup on unmount
      return () => {
        socket.off("connect", handleConnect);
        socket.off("connect_error", handleConnectError);
        socket.off("disconnect", handleDisconnect);
      };
    }, [passengerId]);

    // 🔄 Manual retry (optional)
    const handleRetryConnection = () => {
      console.log("🔄 Retrying connection...");
      setConnectionError(null);
      setIsConnecting(true);
      socket.connect();
    };

  const handleNavigateToHome = () => {
    router.replace("/(screens)/newHome");
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <StatusBar barStyle="dark-content" />

      {/* Loading State */}
      {isConnecting && (
        <View className="items-center">
          <ActivityIndicator size="large" color="#0286FF" />
          <Text className="text-black text-xl font-JakartaSemiBold mt-4">
            Connecting...
          </Text>
          <Text className="text-gray-500 font-JakartaRegular mt-2">
            Please wait while we connect you
          </Text>
        </View>
      )}

      {/* Connection Error State */}
      {connectionError && (
        <View className="items-center px-8">
          <Text className="text-red-500 text-xl font-JakartaSemiBold mb-4">
            Connection Failed
          </Text>
          <Text className="text-gray-600 font-JakartaRegular text-center mb-6">
            {connectionError}
          </Text>
          <TouchableOpacity
            onPress={handleRetryConnection}
            className="px-6 py-3 bg-red-500 rounded-full"
          >
            <Text className="text-white font-JakartaBold">
              Retry Connection
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Connected State */}
      {isConnected && !isConnecting && (
        <View className="items-center">
          <Text className="text-black text-2xl font-JakartaSemiBold mb-6">
            Connected Successfully!
          </Text>
          <TouchableOpacity
            onPress={handleNavigateToHome}
            className="mt-5 p-4 bg-primary-500 rounded-full shadow-md shadow-neutral-400"
          >
            <Text className="text-2xl text-white font-JakartaBold">
              Continue to App
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default Home;
