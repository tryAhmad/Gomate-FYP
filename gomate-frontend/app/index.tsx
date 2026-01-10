import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

const Home = () => {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // User is logged in, go to main app
        router.replace("/(screens)/newHome");
      } else {
        // User is not logged in, show welcome screen
        router.replace("/(screens)/(auth)/welcome");
      }
    }
  }, [isLoading, isAuthenticated]);

  // Show loading screen while checking auth
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
      }}
    >
      <ActivityIndicator size="large" color="#0286FF" />
    </View>
  );
};

export default Home;
