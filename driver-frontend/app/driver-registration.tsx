import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const steps = [
  { title: "Driver Information", icon: "person" },
  { title: "CNIC", icon: "credit-card" },
  { title: "Selfie with ID", icon: "photo-camera" },
  { title: "Driver’s License", icon: "badge" },
  { title: "Vehicle Information", icon: "directions-car" },
];

export default function DriverRegistration() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Registration</Text>

      <View style={styles.stepList}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <MaterialIcons name={step.icon as any} size={24} color="#000" />
            <Text style={styles.stepText}>{step.title}</Text>
          </View>
        ))}
      </View>

      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push("/driver-basic-info" as never)}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    flexGrow: 1,
    backgroundColor: "#fff",
  },
  buttonWrapper: {
    marginTop: 32,
    marginBottom: 40,
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 29,
  },
  stepList: {
    gap: 15,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    gap: 12,
  },
  stepText: {
    fontSize: 16,
  },
  continueButton: {
    marginTop: 29,
    backgroundColor: "#0286ff",
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  continueText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
