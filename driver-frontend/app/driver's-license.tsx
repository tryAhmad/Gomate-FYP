import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function DriverLicense() {
  const router = useRouter();
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);

  const pickImage = async (side: "front" | "back") => {
    Alert.alert(
      "Upload License",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
            if (!cameraPermission.granted) {
              Alert.alert("Permission required", "Camera access is needed.");
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.7,
            });

            if (!result.canceled) {
              const uri = result.assets[0].uri;
              side === "front" ? setFrontImage(uri) : setBackImage(uri);
            }
          },
        },
        {
          text: "Choose from Gallery",
          onPress: async () => {
            const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!galleryPermission.granted) {
              Alert.alert("Permission required", "Gallery access is needed.");
              return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.7,
            });

            if (!result.canceled) {
              const uri = result.assets[0].uri;
              side === "front" ? setFrontImage(uri) : setBackImage(uri);
            }
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const handleRetakePrompt = (side: "front" | "back") => {
    Alert.alert("Retake Image", "Do you want to replace this image?", [
      { text: "Cancel", style: "cancel" },
      { text: "Retake", onPress: () => pickImage(side) },
    ]);
  };

  const handleNext = () => {
    if (!frontImage || !backImage) {
      Alert.alert("Both sides required", "Please upload both sides of your license.");
      return;
    }

    // TODO: send to backend
    router.push("/vehicle-info" as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Driver’s License</Text>
      <Text style={styles.subtitle}>Both sides must be clear and visible.</Text>

      <Text style={styles.label}>License Front</Text>
      {frontImage ? (
        <TouchableOpacity onPress={() => handleRetakePrompt("front")}>
          <Image source={{ uri: frontImage }} style={styles.image} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => pickImage("front")}
        >
          <Text style={styles.uploadText}>Upload Front</Text>
          <MaterialIcons name="add-photo-alternate" size={36} color="#888" />
        </TouchableOpacity>
      )}

      <Text style={styles.label}>License Back</Text>
      {backImage ? (
        <TouchableOpacity onPress={() => handleRetakePrompt("back")}>
          <Image source={{ uri: backImage }} style={styles.image} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => pickImage("back")}
        >
          <Text style={styles.uploadText}>Upload Back</Text>
          <MaterialIcons name="add-photo-alternate" size={36} color="#888" />
        </TouchableOpacity>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.nextButtonSingle} onPress={handleNext}>
          <Text style={styles.nextText}>Next</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 20,
    color: "#555",
  },
  label: {
    fontSize: 16,
    marginTop: 20,
    marginBottom: 5,
    fontWeight: "600",
  },
  uploadBox: {
    height: 160,
    backgroundColor: "#f1f1f1",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderColor: "#ccc",
    borderWidth: 1,
  },
  uploadText: {
    color: "#888",
    fontSize: 15,
    marginBottom: 8,
  },
  image: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    resizeMode: "cover",
  },
  nextButtonSingle: {
    backgroundColor: "#0286ff",
    padding: 14,
    borderRadius: 20,
    alignItems: "center",
    alignSelf: "center",
    width: "40%",
  },
  buttonRow: {
    marginTop: 30,
  },
  nextText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
