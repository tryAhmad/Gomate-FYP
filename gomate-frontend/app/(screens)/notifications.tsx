// app/notifications.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BurgerMenu from "@/components/BurgerMenu";

const { width } = Dimensions.get("window");

interface Notification {
  id: string;
  type: "Promotion" | "System";
  title: string;
  message: string;
  read: boolean;
}

const sampleNotifications: Notification[] = [
  {
    id: "1",
    type: "Promotion",
    title: "Promotion",
    message: "Invite friends - Get 3 coupons each!",
    read: false,
  },
  {
    id: "2",
    type: "System",
    title: "System",
    message: "Your booking #1234 has been successfully confirmed.",
    read: true,
  },
  {
    id: "3",
    type: "Promotion",
    title: "Promotion",
    message: "Discount - Enjoy 15% discount on your next ride!",
    read: false,
  },
];

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(sampleNotifications);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  const openNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      {/* Header */}
      <View className="p-4 border-b border-gray-200 items-center mt-[10%]">
        <BurgerMenu
          passengerName="Ahmad"
          profilePic="https://i.pravatar.cc/150?img=3"
          style="left-2 ml-3"
          onLogout={() => console.log("Logged out")}
        />
        <Text className="text-3xl font-JakartaExtraBold text-blue-500">
          Notifications
        </Text>
      </View>

      {/* Notification List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openNotification(item)}
            className="flex-row items-center p-4 border-b border-gray-200"
          >
            {/* Icon */}
            <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-3">
              {item.type === "System" ? (
                <Ionicons
                  name="checkmark-circle"
                  size={28}
                  color={item.read ? "blue" : "gray"}
                />
              ) : (
                <Ionicons name="ticket" size={28} color="green" />
              )}
            </View>

            {/* Text */}
            <View className="flex-1">
              <Text className="font-JakartaBold text-xl">{item.title}</Text>
              <Text
                className="text-gray-600 font-JakartaMedium text-lg"
                numberOfLines={1}
              >
                {item.message}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Modal */}
      <Modal visible={!!selectedNotification} transparent animationType="fade">
        <View className="flex-1 bg-black/40 justify-center items-center">
          <View className="bg-white w-[85%] rounded-xl p-6 shadow-md">
            <Text className="text-3xl font-JakartaExtraBold text-center mb-2">
              {selectedNotification?.title}
            </Text>
            <Text className="text-xl font-JakartaMedium text-center text-gray-700 mb-6">
              {selectedNotification?.message}
            </Text>

            {/* Close button */}
            <TouchableOpacity
              onPress={() => setSelectedNotification(null)}
              className="self-center bg-blue-500 px-6 py-3 rounded-full"
            >
              <Text className="text-white font-JakartaBold text-xl">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
