import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `http://192.168.1.49:3000/passengers/${passengerId}`,
          {
            headers: {
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFobWFkQGV4YW1wbGUuY29tIiwic3ViIjoiNjg4YzY5ZjIwNjUzZWMwZjQzZGY2ZTJjIiwicm9sZSI6InBhc3NlbmdlciIsImlhdCI6MTc1ODY5NzAzOSwiZXhwIjoxNzU4NzgzNDM5fQ.v7shJgB8qxOgqMqjyB8D67QFlyzROMth3ijZtOtgEd8`,
            },
          }
        );
        const data = res.data.passenger;
        setPassenger(data);
        setUsername(data.username);
        setPhoneNumber(data.phoneNumber);
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
        `http://192.168.1.49:3000/passengers/${passengerId}`,
        {
          username,
          phoneNumber,
        },
        {
          headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFobWFkQGV4YW1wbGUuY29tIiwic3ViIjoiNjg4YzY5ZjIwNjUzZWMwZjQzZGY2ZTJjIiwicm9sZSI6InBhc3NlbmdlciIsImlhdCI6MTc1ODY5NzAzOSwiZXhwIjoxNzU4NzgzNDM5fQ.v7shJgB8qxOgqMqjyB8D67QFlyzROMth3ijZtOtgEd8`,
          },
        }
      );
      setPassenger(res.data.passenger);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      Alert.alert("Error", "Failed to update profile");
    }
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
          className="bg-gray-200 p-2 rounded-full border-[1px] shadow-md"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>

        {/* Profile title - centered */}
        <Text className="text-black text-3xl font-JakartaBold absolute left-0 right-0 text-center">
          Profile
        </Text>

        {/* Empty view for balance */}
        <View style={{ width: 28 }} />
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
          label="Username :"
          value={username}
          onChangeText={setUsername}
          className="bg-gray-800 text-white px-4 py-3 rounded-xl mb-4 text-lg"
        />

        {/* Email (read-only) */}
        <InputField
          label="Email :"
          value={passenger.email}
          editable={false}
          className="bg-gray-900 text-gray-400 px-4 py-3 rounded-xl mb-4 text-lg"
        />

        {/* Phone Number */}
        <InputField
          label="Phone Number :"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          className="text-white px-4 py-3 rounded-xl mb-6 text-lg border-2 border-gray-700"
          keyboardType="phone-pad"
        />
      </ScrollView>

      {/* Save button - Fixed at bottom */}
      <View className="absolute bottom-6 left-0 right-0 p-6 bg-white">
        <CustomButton title="Save Changes" onPress={handleSave} />
      </View>
    </View>
  );
}
