// components/BurgerMenu.tsx
import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

interface BurgerMenuProps {
  passengerName?: string;
  profilePic?: string;
  style?: string;
  onLogout?: () => void;
}

export default function BurgerMenu({
  passengerName,
  profilePic,
  onLogout,
  style,
}: BurgerMenuProps) {
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;

  const openMenu = () => {
    setVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  return (
    <>
      {/* Round Burger Button */}
      <TouchableOpacity
        className={`absolute ${style} w-12 h-12 rounded-full bg-white justify-center items-center z-0`}
        onPress={openMenu}
      >
        <Ionicons name="menu" size={34} color="black" />
      </TouchableOpacity>

      {/* Overlay + Sliding Menu */}
      {visible && (
        <Modal visible={visible} transparent>
          <View className="absolute inset-0 flex-row h-full w-full">
            {/* Semi-transparent overlay */}
            <TouchableWithoutFeedback onPress={closeMenu}>
              <View className="flex-1 bg-black/40" />
            </TouchableWithoutFeedback>

            {/* Sliding menu */}
            <Animated.View
              style={{
                transform: [{ translateX: slideAnim }],
              }}
              className="absolute h-full w-[70%] bg-white pt-12 px-4 border-r border-gray-300"
            >
              {/* Profile Section */}
              <TouchableOpacity
                onPress={() => {
                  closeMenu();
                  router.push("/profile");
                }}
                className="flex-row items-center mb-5"
              >
                <Image
                  source={{
                    uri: profilePic || "https://via.placeholder.com/60",
                  }}
                  className="w-16 h-16 rounded-full mr-3"
                />
                <Text className="text-2xl font-JakartaExtraBold">
                  {passengerName || "Passenger"}
                </Text>
              </TouchableOpacity>

              {/* Menu Options */}
              <TouchableOpacity
                onPress={() => {
                  closeMenu();
                  router.push("/newHome");
                }}
                className="flex-row items-center my-4"
              >
                <Ionicons name="car" size={22} color="black" />
                <Text className="ml-3 text-2xl font-JakartaSemiBold">
                  Book Ride
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  closeMenu();
                  router.push("/rideHistory");
                }}
                className="flex-row items-center my-4"
              >
                <Ionicons name="time" size={22} color="black" />
                <Text className="ml-3 text-2xl font-JakartaSemiBold">
                  Ride History
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  closeMenu();
                  router.push("/notifications");
                }}
                className="flex-row items-center my-4"
              >
                <Ionicons name="notifications" size={22} color="black" />
                <Text className="ml-3 text-2xl font-JakartaSemiBold">
                  Notifications
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  closeMenu();
                  router.push("/supportScreen");
                }}
                className="flex-row items-center my-4"
              >
                <Ionicons name="call" size={22} color="black" />
                <Text className="ml-3 text-2xl font-JakartaSemiBold">
                  Support
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  onLogout?.();
                  closeMenu();
                }}
                className="flex-row items-center my-4"
              >
                <Ionicons name="log-out" size={22} color="black" />
                <Text className="ml-3 text-2xl font-JakartaSemiBold text-red-500">
                  Logout
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      )}
    </>
  );
}
