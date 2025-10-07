import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  TextInput,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import Constants from "expo-constants";

const userip = Constants.expoConfig?.extra?.USER_IP?.trim();
const usertoken = Constants.expoConfig?.extra?.USER_TOKEN?.trim();

export default function Profile() {
  const router = useRouter();

  // Simulated logged-in passenger ID (replace with auth context later)
  const passengerId = "688c69f20653ec0f43df6e2c";

  const [loading, setLoading] = useState(true);
  const [passenger, setPassenger] = useState<any>(null);

  // Editable fields
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profilePic, setProfilePic] = useState(
    "https://i.pravatar.cc/150?img=3"
  );

  // Original values to track changes
  const [originalUsername, setOriginalUsername] = useState("");
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState("");
  const [originalProfilePic, setOriginalProfilePic] = useState("");

  // Edit modes
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // Refs for input fields
  const usernameInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);

  // Check if any changes were made
  const hasChanges =
    username !== originalUsername ||
    phoneNumber !== originalPhoneNumber ||
    profilePic !== originalProfilePic;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `http://${userip}:3000/passengers/${passengerId}`,
          {
            headers: {
              Authorization: `Bearer ${usertoken}`,
            },
          }
        );
        const data = res.data.passenger;
        setPassenger(data);
        setUsername(data.username);
        setPhoneNumber(data.phoneNumber);

        // Set original values
        setOriginalUsername(data.username);
        setOriginalPhoneNumber(data.phoneNumber);
        setOriginalProfilePic(profilePic);
      } catch (err) {
        console.error("Error fetching profile:", err);
        Alert.alert("Error", "Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const res = await axios.patch(
        `http://${userip}:3000/passengers/${passengerId}`,
        {
          username,
          phoneNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${usertoken}`,
          },
        }
      );
      setPassenger(res.data.passenger);

      // Update original values after successful save
      setOriginalUsername(username);
      setOriginalPhoneNumber(phoneNumber);
      setOriginalProfilePic(profilePic);

      // Exit edit modes
      setIsEditingUsername(false);
      setIsEditingPhone(false);

      Alert.alert("Success", "Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleEditUsername = () => {
    setIsEditingUsername(true);
    // Focus the input field after state update
    setTimeout(() => {
      usernameInputRef.current?.focus();
    }, 100);
  };

  const handleEditPhone = () => {
    setIsEditingPhone(true);
    // Focus the input field after state update
    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 100);
  };

  const handleCancelChanges = () => {
    // Reset to original values
    setUsername(originalUsername);
    setPhoneNumber(originalPhoneNumber);
    setProfilePic(originalProfilePic);

    // Exit edit modes
    setIsEditingUsername(false);
    setIsEditingPhone(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "We need gallery access to change photo"
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
      // 👉 Later: upload to backend along with profile update
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white text-lg">Loading profile...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <View className="flex-row items-center justify-between mb-6 mt-[10%] px-6">
        {/* Back button */}
        <TouchableOpacity
          onPress={() => {
            console.log("Back pressed");
            router.back();
          }}
          className="bg-gray-200 p-2 rounded-full border-[1px] shadow-md left-1 top-3 z-10"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>

        {/* Profile title - centered */}
        <Text className="text-black text-4xl font-JakartaBold absolute left-0 right-0 text-center top-5">
          Profile
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 py-8 pt-[10%] pb-20">
        {/* Profile picture with pencil */}
        <View className="items-center mb-6">
          <View className="relative">
            <Image
              source={{ uri: profilePic }}
              className="w-28 h-28 rounded-full border-2 border-gray-500"
            />
            <TouchableOpacity
              onPress={pickImage}
              className="absolute bottom-1 right-1 bg-black p-2 rounded-full border-[1px] border-white"
            >
              <Ionicons name="pencil" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Username */}
        <InputField
          ref={usernameInputRef}
          label="Username :"
          value={username}
          onChangeText={setUsername}
          editable={isEditingUsername}
          className={`px-4 py-3 rounded-xl mb-4 text-lg ${
            isEditingUsername
              ? "bg-white border-2 border-blue-500 text-black"
              : "bg-gray-100 text-gray-700"
          }`}
          rightIcon={
            <TouchableOpacity onPress={handleEditUsername}>
              <MaterialCommunityIcons
                name={
                  isEditingUsername ? "check-circle" : "circle-edit-outline"
                }
                size={24}
                color={isEditingUsername ? "green" : "black"}
              />
            </TouchableOpacity>
          }
        />

        {/* Email (read-only) */}
        <InputField
          label="Email :"
          value={passenger.email}
          editable={false}
          className="bg-gray-50 text-gray-600 px-4 py-3 rounded-xl mb-4 text-lg border-2 border-gray-200"
        />

        {/* Phone Number */}
        <InputField
          ref={phoneInputRef}
          label="Phone Number :"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          editable={isEditingPhone}
          className={`px-4 py-3 rounded-xl mb-6 text-lg ${
            isEditingPhone
              ? "bg-white border-2 border-blue-500 text-black"
              : "bg-gray-100 text-gray-700 border-2 border-gray-300"
          }`}
          keyboardType="phone-pad"
          rightIcon={
            <TouchableOpacity onPress={handleEditPhone}>
              <MaterialCommunityIcons
                name={isEditingPhone ? "check-circle" : "circle-edit-outline"}
                size={24}
                color={isEditingPhone ? "green" : "black"}
              />
            </TouchableOpacity>
          }
        />
      </ScrollView>

      {/* Save and Cancel buttons - Only show when changes are made */}
      {hasChanges && (
        <View className="absolute bottom-6 left-0 right-0 p-6 bg-white border-t border-gray-200">
          <View className="flex-row space-x-3">
            <CustomButton
              title="Cancel"
              onPress={handleCancelChanges}
              className="flex-1 bg-gray-500"
            />
            <CustomButton
              title="Save Changes"
              onPress={handleSave}
              className="ml-2 flex-1"
            />
          </View>
        </View>
      )}
    </View>
  );
}
