import socket from "@/utils/socket";
import { Redirect, router } from "expo-router";
import { useEffect } from "react";
import { View, Text, TouchableOpacity, LogBox } from "react-native";

LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
  "`expo-notifications` functionality is not fully supported in Expo Go",
]);

const Home = () => {

  const passengerId = "688c69f20653ec0f43df6e2c";

  useEffect(() => {
    // connect once when component mounts
    if (!socket.connected) {
      socket.connect();
    }

    socket.on("connect", () => {
      console.log("Passenger connected:", socket.id);

      // tell backend this socket belongs to passenger
      socket.emit("registerPassenger", { passengerId });
    });

    // cleanup to avoid duplicate listeners
    return () => {
      socket.off("connect");
    };
  }, [passengerId]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <Text className="text-black text-2xl font-JakartaSemiBold">
        Go to registration Page
      </Text>
      <Redirect href="/(screens)/newHome" />
      <TouchableOpacity
        onPress={() => router.push("/(screens)/newHome")}
        // style={{
        //   marginTop: 20,
        //   padding: 10,
        //   backgroundColor: "black",
        //   borderRadius: 5,
        // }}
        className="mt-5 p-4 bg-primary-500 rounded-full shadow-md shadow-neutral-400"
      >
        <Text className="text-2xl text-white font-JakartaBold">Press here</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Home;
