import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface AlertModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string | React.ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  titleTextSize?: string;
  messageTextSize?: string;
}

const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  onClose,
  title,
  message,
  iconName = "alert-circle",
  iconColor = "orange",
  iconBgColor = "yellow-100",
  titleTextSize = "2xl",
  messageTextSize = "xl",
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/40 justify-center items-center">
        <View className="bg-white w-[85%] rounded-xl justify-center items-center p-6 shadow-md">
          <View
            className={`rounded-full bg-${iconBgColor} items-center justify-center p-2 shadow-md mb-4`}
          >
            <Ionicons name={iconName} size={64} color={iconColor} />
          </View>

          <Text
            className={`text-${titleTextSize} font-JakartaExtraBold text-center mb-2`}
          >
            {title}
          </Text>

          <Text
            className={`text-${messageTextSize} font-JakartaMedium text-center text-gray-700 mb-6`}
          >
            {message}
          </Text>

          <TouchableOpacity
            onPress={onClose}
            className="self-center bg-blue-500 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-JakartaBold text-xl">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AlertModal;
