import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

export default function DriverBasicInfo() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access media library is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // Auto-format Date of Birth as DD-MM-YYYY
  const handleDobChange = (input: string) => {
    // Remove non-digit characters
    const digits = input.replace(/\D/g, "");

    let formatted = "";

    // Format based on the number of digits
    if (digits.length <= 2) {
      formatted = digits;
    } else if (digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
    } else {
      formatted = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
    }

    // If user just typed the 2nd or 4th digit, auto-insert hyphen
    if (
      (digits.length === 2 && !input.endsWith("-")) ||
      (digits.length === 4 && input.length === 5 && !input.endsWith("-"))
    ) {
      formatted += "-";
    }

    setDob(formatted);
  };

  // Restrict phone number to 12 digits, avoid flashing 13th digit
  const handlePhoneChange = (input: string) => {
    const digits = input.replace(/\D/g, "").slice(0, 11); // limit to 11 digits max

    let formatted = "";
    if (digits.length <= 4) {
      formatted = digits;
    } else {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }

    // Auto-add hyphen after 4 digits if not already
    if (digits.length === 4 && !input.endsWith("-")) {
      formatted += "-";
    }

    setPhone(formatted);
  };

  const handleNext = () => {
    if (!photoUri || !fullName || !phone || !dob) {
      alert("Please fill out all fields and upload a photo before proceeding.");
      return;
    }

    // DOB validation
    const dobParts = dob.split("-");
    if (dobParts.length !== 3) {
      alert("Enter correct Date of Birth");
      return;
    }

    const [dayStr, monthStr, yearStr] = dobParts;
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    const currentYear = new Date().getFullYear();

    const isValidDate =
      !isNaN(day) &&
      !isNaN(month) &&
      !isNaN(year) &&
      day >= 1 &&
      day <= 31 &&
      month >= 1 &&
      month <= 12 &&
      year >= 1947 &&
      year <= currentYear;

    if (!isValidDate) {
      alert("Enter correct Date of Birth");
      return;
    }

    router.push("/cnic-images" as any);
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Driver Information</Text>

        {/* Profile Picture Circle */}
        <View style={styles.profileContainer}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.profileCircle} />
          ) : (
            <View style={styles.profileCircle}>
              <MaterialCommunityIcons name="account" size={64} color="#ccc" />
            </View>
          )}

          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Text style={styles.uploadText}>Upload Photo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          placeholderTextColor="#A9A9A9"
          style={styles.input}
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          value={phone}
          onChangeText={handlePhoneChange}
          placeholder="03xx-xxxxxxx"
          placeholderTextColor="#A9A9A9"
          keyboardType="phone-pad"
          maxLength={12}
          style={styles.input}
        />

        <Text style={styles.label}>Date of Birth</Text>
        <TextInput
          value={dob}
          onChangeText={handleDobChange}
          placeholder="DD-MM-YYYY"
          placeholderTextColor="#A9A9A9"
          keyboardType="numeric"
          maxLength={10}
          style={styles.input}
        />

        <View style={styles.singleButtonWrapper}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  profileContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  uploadButton: {
    marginTop: 10,
    backgroundColor: "#0286ff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  uploadText: {
    color: "#fff",
    fontWeight: "bold",
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#000",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
  },
  singleButtonWrapper: {
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
