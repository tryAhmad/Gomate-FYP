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

export default function SelfieWithID() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
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
      setImage(result.assets[0].uri);
    }
  };

  const handleImagePress = () => {
    Alert.alert(
      "Retake Selfie",
      "Do you want to retake your selfie?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Retake", onPress: pickImage },
      ]
    );
  };

  const handleNext = () => {
    if (!image) {
      Alert.alert("Upload Required", "Please take a selfie holding your ID.");
      return;
    }

    // TODO: send image to backend here
    router.push("/driver's-license" as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selfie with ID</Text>
      <Text style={styles.subtitle}>
        Take a clear selfie while holding your CNIC.
      </Text>

      {image ? (
        <TouchableOpacity onPress={handleImagePress}>
          <Image source={{ uri: image }} style={styles.previewImage} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
          <Text style={styles.uploadText}>Tap to Take Selfie</Text>
          <MaterialIcons name="add-a-photo" size={36} color="#888" />
        </TouchableOpacity>
      )}

      <View style={styles.singleButtonContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
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
  uploadBox: {
    height: 200,
    backgroundColor: "#f1f1f1",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  uploadText: {
    color: "#888",
    fontSize: 16,
    marginBottom: 8,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    resizeMode: "cover",
  },
  retakeButton: {
    marginTop: 12,
    alignSelf: "center",
    backgroundColor: "#0286ff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retakeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  singleButtonContainer: {
    alignItems: "center",
    marginTop: 30,
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
