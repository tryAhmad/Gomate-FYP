import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  TextInput,
  Image,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import BurgerMenu from "@/components/BurgerMenu";

const { width } = Dimensions.get("window");

interface DriverProfile {
  profilePhoto?: string;
  username: string;
  email: string;
  phone: string;
  vehicle: {
    company: string;
    model: string;
    registrationNumber: string;
    color: string;
  };
}

export default function ProfileScreen() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<DriverProfile>({
    username: "Ahmad",
    email: "ahmad@example.com",
    phone: "+92 300 1234567",
    vehicle: {
      company: "Toyota",
      model: "Corolla",
      registrationNumber: "ABC-123",
      color: "White"
    }
  });
  
  const scrollViewRef = useRef<ScrollView>(null);
  const phoneInputRef = useRef<TextInput>(null);

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(-width * 0.7))[0];

  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: -width * 0.7,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSidebarVisible(false);
    });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem("driverProfile");
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const saveProfile = async () => {
    try {
      await AsyncStorage.setItem("driverProfile", JSON.stringify(profile));
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile");
    }
  };

  const handlePhotoAction = async () => {
    if (!isEditing) return;

    if (profile.profilePhoto) {
      // options to change or remove photo
      Alert.alert(
        "Profile Photo",
        "What would you like to do?",
        [
          {
            text: "Change Photo",
            onPress: pickImage,
          },
          {
            text: "Remove Photo",
            style: "destructive",
            onPress: removeProfilePhoto,
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    } else {
      pickImage();
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const updatedProfile = {
          ...profile,
          profilePhoto: result.assets[0].uri
        };
        setProfile(updatedProfile);
        await AsyncStorage.setItem("driverProfile", JSON.stringify(updatedProfile));
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to update profile photo");
    }
  };

  const removeProfilePhoto = async () => {
    try {
      const updatedProfile = {
        ...profile,
        profilePhoto: undefined
      };
      setProfile(updatedProfile);
      await AsyncStorage.setItem("driverProfile", JSON.stringify(updatedProfile));
    } catch (error) {
      console.error("Error removing profile photo:", error);
      Alert.alert("Error", "Failed to remove profile photo");
    }
  };

  const handleInputChange = (field: keyof Omit<DriverProfile, 'vehicle'>, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Auto-scroll to input field when focused
  const handleInputFocus = (inputName: string) => {
    setTimeout(() => {
      if (inputName === 'phone') {
        scrollViewRef.current?.scrollTo({ y: 300, animated: true });
      }
    }, 100);
  };

  const getInitial = (name: string) => name?.charAt(0).toUpperCase() || "A";

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" />

      {/* Header with burger + centered title + edit button on right */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={openSidebar}>
          <Ionicons name="menu" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity 
          style={[styles.editButton, isEditing && styles.editButtonActive]} 
          onPress={() => isEditing ? saveProfile() : setIsEditing(true)}
        >
          <Text style={[styles.editButtonText, isEditing && styles.editButtonTextActive]}>
            {isEditing ? "Save" : "Edit"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Photo Section */}
          <View style={styles.profilePhotoSection}>
            <TouchableOpacity onPress={handlePhotoAction} disabled={!isEditing}>
              {profile.profilePhoto ? (
                <Image source={{ uri: profile.profilePhoto }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileInitial}>
                    {getInitial(profile.username)}
                  </Text>
                </View>
              )}
              {isEditing && (
                <View style={styles.editPhotoBadge}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.profileName}>{profile.username}</Text>
            <Text style={styles.profileRole}>Driver</Text>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            {isEditing ? (
              // Editing mode 
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username</Text>
                  <TextInput
                    style={styles.input}
                    value={profile.username}
                    onChangeText={(value) => handleInputChange('username', value)}
                    placeholder="Enter username"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={profile.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    placeholder="Enter email"
                    keyboardType="email-address"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    ref={phoneInputRef}
                    style={styles.input}
                    value={profile.phone}
                    onChangeText={(value) => handleInputChange('phone', value)}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    onFocus={() => handleInputFocus('phone')}
                  />
                </View>
              </>
            ) : (
              // Non-editing mode
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Username</Text>
                  <Text style={styles.value}>{profile.username}</Text>
                </View>
                <View style={styles.separator} />
                
                <View style={styles.row}>
                  <Text style={styles.label}>Email</Text>
                  <Text style={styles.value}>{profile.email}</Text>
                </View>
                <View style={styles.separator} />
                
                <View style={styles.row}>
                  <Text style={styles.label}>Phone Number</Text>
                  <Text style={styles.value}>{profile.phone}</Text>
                </View>
              </>
            )}
          </View>

          {/* Vehicle Information - Always non-editable */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Company</Text>
              <Text style={styles.value}>{profile.vehicle.company}</Text>
            </View>
            <View style={styles.separator} />
            
            <View style={styles.row}>
              <Text style={styles.label}>Model</Text>
              <Text style={styles.value}>{profile.vehicle.model}</Text>
            </View>
            <View style={styles.separator} />
            
            <View style={styles.row}>
              <Text style={styles.label}>Registration Number</Text>
              <Text style={styles.value}>{profile.vehicle.registrationNumber}</Text>
            </View>
            <View style={styles.separator} />
            
            <View style={styles.row}>
              <Text style={styles.label}>Color</Text>
              <Text style={styles.value}>{profile.vehicle.color}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Burger Menu */}
      <BurgerMenu 
        isVisible={sidebarVisible} 
        onClose={closeSidebar} 
        slideAnim={slideAnim} 
        profile={profile}  
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
    paddingBottom: 12,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  menuButton: { 
    padding: 8, 
    borderRadius: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#0286FF", 
    textAlign: "center" 
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#6b7280",
    backgroundColor: "#f8fafc",
  },
  editButtonActive: {
    backgroundColor: "#6b7280",
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  editButtonTextActive: {
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profilePhotoSection: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#f8fafc",
    marginBottom: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  profileInitial: {
    color: "#0286FF",
    fontWeight: "600",
    fontSize: 40,
  },
  editPhotoBadge: {
    position: "absolute",
    bottom: 20,
    right: 0,
    backgroundColor: "#0286FF",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: "#64748b",
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0286FF",
    marginBottom: 20,
    textAlign: "center",
  },
  // Row layout for non-editing mode
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  value: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "400",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  separator: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 4,
  },
  // Input layout for editing mode
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#f8fafc",
    marginTop: 8,
  },
});