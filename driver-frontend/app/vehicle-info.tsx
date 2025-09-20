import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const vehicleTypes = [
  { label: "Car", icon: "car" },
  { label: "Bike", icon: "motorbike" },
  { label: "Rickshaw", icon: "rickshaw" },
];

export default function VehicleInfo() {
  const router = useRouter();
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehiclePhotos, setVehiclePhotos] = useState<string[]>([]);

  const handleNext = () => {
    if (
      !vehicleType ||
      !vehicleModel ||
      !vehicleColor ||
      vehicleNumber.length < 6 ||
      vehicleNumber.length > 8 ||
      vehiclePhotos.length < 1
    ) {
      Alert.alert(
        "Incomplete Details",
        "Please fill all fields and upload at least one photo."
      );
      return;
    }

    Alert.alert(
      "Submitted Successfully",
      "Your info has been sent to admin. Kindly wait for verification.",
      [
    {
      text: "OK",
      onPress: () => {
        router.replace("/docs-pending" as any); 
      }
    }
  ]
    );
  };

  const handlePhotoChoice = () => {
    if (vehiclePhotos.length >= 6) {
      Alert.alert("Limit Reached", "You can upload up to 6 photos only.");
      return;
    }

    Alert.alert("Upload Vehicle Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert("Permission required", "Camera access is needed.");
            return;
          }

          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.7,
          });

          if (!result.canceled) {
            setVehiclePhotos([...vehiclePhotos, result.assets[0].uri]);
          }
        },
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert("Permission required", "Gallery access is needed.");
            return;
          }

          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
          });

          if (!result.canceled) {
            setVehiclePhotos([...vehiclePhotos, result.assets[0].uri]);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleRetakeOrDelete = (index: number) => {
    Alert.alert("Photo Options", "What would you like to do?", [
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updated = [...vehiclePhotos];
          updated.splice(index, 1);
          setVehiclePhotos(updated);
        },
      },
      {
        text: "Retake",
        onPress: () => handleReplaceImage(index),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleReplaceImage = async (index: number) => {
    Alert.alert("Replace Vehicle Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.7,
          });
          if (!result.canceled) {
            const updated = [...vehiclePhotos];
            updated[index] = result.assets[0].uri;
            setVehiclePhotos(updated);
          }
        },
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
          });
          if (!result.canceled) {
            const updated = [...vehiclePhotos];
            updated[index] = result.assets[0].uri;
            setVehiclePhotos(updated);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Vehicle Type</Text>
        <View style={styles.iconRow}>
          {vehicleTypes.map((type) => (
            <TouchableOpacity
              key={type.label}
              style={[
                styles.iconBox,
                vehicleType === type.label && styles.iconBoxSelected,
              ]}
              onPress={() => setVehicleType(type.label)}
            >
              <MaterialCommunityIcons
                name={type.icon as any}
                size={32}
                color={vehicleType === type.label ? "#0286FF" : "#888"}
              />
              <Text style={styles.iconLabel}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Vehicle Model</Text>
        <TextInput
          style={styles.input}
          value={vehicleModel}
          onChangeText={setVehicleModel}
          placeholder="e.g. Honda Civic 2020"
          placeholderTextColor="#A9A9A9"
        />

        <Text style={styles.label}>Vehicle Color</Text>
        <TextInput
          style={styles.input}
          value={vehicleColor}
          onChangeText={setVehicleColor}
          placeholder="e.g. White"
          placeholderTextColor="#A9A9A9"
        />

        <Text style={styles.label}>Vehicle Registration Number</Text>
        <TextInput
          style={styles.input}
          value={vehicleNumber}
          onChangeText={(text) => {
            const raw = text.replace(/[^a-zA-Z0-9]/g, ""); // only alphanumeric
            if (raw.length <= 8) setVehicleNumber(raw);
          }}
          placeholder="e.g. LEB-1234"
          placeholderTextColor="#A9A9A9"
          maxLength={8}
        />

        <Text style={styles.label}>Upload Vehicle Photos (1–6)</Text>
        <View style={styles.photoRow}>
          {vehiclePhotos.map((uri, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleRetakeOrDelete(index)}
            >
              <Image source={{ uri }} style={styles.photo} />
            </TouchableOpacity>
          ))}
          {vehiclePhotos.length < 6 && (
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={handlePhotoChoice}
            >
              <MaterialCommunityIcons name="camera-plus" size={32} color="#888" />
              <Text style={styles.uploadText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextText}>Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: "#fff",
    flexGrow: 1,
    paddingTop: 10, 
  },
  label: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    height: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  iconBox: {
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 4,
  },
  iconBoxSelected: {
    borderColor: "#0286FF",
    backgroundColor: "#e6f0ff",
  },
  iconLabel: {
    marginTop: 6,
    fontSize: 14,
    color: "#444",
  },
  photoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  photo: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },
  uploadBox: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadText: {
    fontSize: 12,
    color: "#888",
  },
  buttonContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  nextButton: {
    backgroundColor: "#0286ff",
    padding: 14,
    borderRadius: 20,
    width: "40%",
    alignItems: "center",
  },
  nextText: {
    color: "#fff",
    fontWeight: "bold",
  },
});