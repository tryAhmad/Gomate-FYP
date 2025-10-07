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
  currentScreen?: string;
}

export default function BurgerMenu({
  passengerName,
  profilePic,
  onLogout,
  style,
  currentScreen,
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

  // Helper function to handle navigation safely
  const handleNavigation = (target: string) => {
    if (currentScreen === target) {
      // Prevent navigating to the same screen again
      closeMenu();
      return;
    }
    closeMenu();
    
    // Map target names to actual route paths
    const routeMap: { [key: string]: string } = {
      newHome: "/(screens)/newHome",
      rideHistory: "/(screens)/rideHistory",
      notifications: "/(screens)/notifications",
      supportScreen: "/(screens)/supportScreen",
      profile: "/(screens)/profile",
    };
    
    const route = routeMap[target];
    if (route) {
      router.push(route as any);
    }
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
        <Modal visible={visible} transparent statusBarTranslucent>
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
              className="absolute h-full w-[70%] bg-white pt-16 px-4 border-r border-gray-300"
            >
              {/* Profile Section */}
              <TouchableOpacity
                onPress={() => handleNavigation("profile")}
                className="flex-row items-center mb-6"
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
              <View className="h-[1px] bg-gray-300 w-full mb-6" />

              {/* Menu Options */}
              <MenuOption
                icon="car"
                label="Book Ride"
                onPress={() => handleNavigation("newHome")}
                disabled={currentScreen === "newHome"}
              />
              <MenuOption
                icon="time"
                label="Ride History"
                onPress={() => handleNavigation("rideHistory")}
                disabled={currentScreen === "rideHistory"}
              />
              <MenuOption
                icon="notifications"
                label="Notifications"
                onPress={() => handleNavigation("notifications")}
                disabled={currentScreen === "notifications"}
              />
              <MenuOption
                icon="call"
                label="Support"
                onPress={() => handleNavigation("supportScreen")}
                disabled={currentScreen === "supportScreen"}
              />

              <TouchableOpacity
                onPress={() => {
                  onLogout?.();
                  closeMenu();
                }}
                className="flex-row items-center my-2 p-4"
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

function MenuOption({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
      className={`flex-row items-center my-2 p-4 rounded-full`}
      style={disabled ? { backgroundColor: "#007AFF" } : undefined}
    >
      <Ionicons
        name={icon}
        size={22}
        color={`${disabled ? "white" : "black"}`}
      />
      <Text
        className={`ml-3 text-2xl font-JakartaSemiBold ${disabled ? "text-white" : ""}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
