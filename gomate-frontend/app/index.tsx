import { router } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";

const Home = () => {
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
      <TouchableOpacity
        onPress={() => router.push("/(screens)/(auth)/login")}
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
