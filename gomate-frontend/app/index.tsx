import socket from "@/utils/socket";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  LogBox,
  StatusBar,
  ActivityIndicator,
} from "react-native";

LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
  "`expo-notifications` functionality is not fully supported in Expo Go",
]);

const Home = () => {
  const passengerId = "688c69f20653ec0f43df6e2c";
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const connectPassenger = () => {
      // Reset states
      setIsConnecting(true);
      setConnectionError(null);

      // Connect if not already connected
      if (!socket.connected) {
        socket.connect();
      }

      // Handle successful connection
      socket.on("connect", () => {
        console.log("Passenger connected:", socket.id);

        // Register this socket as belonging to passenger
        socket.emit("registerPassenger", { passengerId });

        setIsConnecting(false);
        setIsConnected(true);
      });

      // Handle connection errors
      socket.on("connect_error", (error) => {
        console.log("Connection error:", error);
        setIsConnecting(false);
        setConnectionError("Failed to connect. Please try again.");
      });

      // Handle disconnection
      socket.on("disconnect", (reason) => {
        console.log("Disconnected:", reason);
        setIsConnected(false);
        if (reason === "io server disconnect") {
          // Server disconnected, need to reconnect manually
          setIsConnecting(true);
          socket.connect();
        }
      });
    };

    connectPassenger();

    // Cleanup listeners on unmount
    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
    };
  }, [passengerId]);

  const handleRetryConnection = () => {
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
