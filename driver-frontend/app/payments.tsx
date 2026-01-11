import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import BurgerMenu from "@/components/BurgerMenu";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

interface ServiceFee {
  vehicleType: string;
  weeklyFee: number;
  isActive: boolean;
}

const DriverPaymentsScreen = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentRates, setPaymentRates] = useState<
    { vehicle: string; weeklyFee: string; color: string }[]
  >([]);
  const slideAnim = useRef(new Animated.Value(-width * 0.7)).current;

  // Fetch service fees from API
  useEffect(() => {
    const fetchServiceFees = async () => {
      try {
        const API_URL =
          process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
        const response = await fetch(`${API_URL}/service-fees`);
        const data = await response.json();

        if (response.ok && data.data) {
          const rates = data.data.map((fee: ServiceFee) => {
            let vehicle = "";
            let color = "";

            if (fee.vehicleType === "car") {
              vehicle = "Car";
              color = "#0286FF";
            } else if (fee.vehicleType === "motorcycle") {
              vehicle = "Bike";
              color = "#34C759";
            } else if (fee.vehicleType === "auto") {
              vehicle = "Auto Rickshaw";
              color = "#FF9500";
            }

            return {
              vehicle,
              weeklyFee: `PKR ${fee.weeklyFee}`,
              color,
            };
          });

          setPaymentRates(rates);
        } else {
          // Fallback to default values if API fails
          setPaymentRates([
            { vehicle: "Car", weeklyFee: "PKR 1000", color: "#0286FF" },
            { vehicle: "Bike", weeklyFee: "PKR 500", color: "#34C759" },
            {
              vehicle: "Auto Rickshaw",
              weeklyFee: "PKR 750",
              color: "#FF9500",
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching service fees:", error);
        // Fallback to default values
        setPaymentRates([
          { vehicle: "Car", weeklyFee: "PKR 1000", color: "#0286FF" },
          { vehicle: "Bike", weeklyFee: "PKR 500", color: "#34C759" },
          { vehicle: "Auto Rickshaw", weeklyFee: "PKR 750", color: "#FF9500" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceFees();
  }, []);

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

  const handleWhatsAppSupport = async () => {
    const phoneNumber = "923164037719";
    const message =
      "Hello, I have sent the payment screenshot for weekly dues.";
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "WhatsApp is not installed on your device.");
      }
    } catch (error) {
      Alert.alert("Error", "Unable to open WhatsApp.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0286FF" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openSidebar} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Information</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0286FF" />
            <Text style={styles.loadingText}>Loading payment rates...</Text>
          </View>
        ) : (
          <>
            {/* Weekly Payment Notice */}
            <View style={styles.noticeCard}>
              <View style={styles.noticeHeader}>
                <MaterialCommunityIcons
                  name="cash-clock"
                  size={40}
                  color="#0286FF"
                />
                <Text style={styles.noticeTitle}>Weekly Payment Required</Text>
              </View>
              <Text style={styles.noticeText}>
                All drivers are required to pay a weekly subscription fee to
                continue using the Gomate platform.
              </Text>
            </View>

            {/* Payment Rates Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weekly Payment Rates</Text>
              <Text style={styles.sectionSubtitle}>
                Payment rates vary by vehicle type
              </Text>

              {paymentRates.map((rate, index) => (
                <View
                  key={index}
                  style={[styles.rateCard, { borderLeftColor: rate.color }]}
                >
                  <View style={styles.rateLeft}>
                    <MaterialCommunityIcons
                      name={
                        rate.vehicle === "Car"
                          ? "car"
                          : rate.vehicle === "Bike"
                          ? "motorbike"
                          : "rickshaw"
                      }
                      size={32}
                      color={rate.color}
                    />
                    <Text style={styles.vehicleName}>{rate.vehicle}</Text>
                  </View>
                  <View style={styles.rateRight}>
                    <Text style={styles.weeklyFee}>{rate.weeklyFee}</Text>
                    <Text style={styles.perWeek}>per week</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Bank Details Section */}
            <View style={styles.section}>
              <View style={styles.bankHeader}>
                <Ionicons name="business" size={28} color="#0286FF" />
                <Text style={styles.sectionTitle}>Bank Details</Text>
              </View>

              <View style={styles.bankCard}>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Bank Name:</Text>
                  <Text style={styles.bankValue}>HBL (Habib Bank Limited)</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Account Title:</Text>
                  <Text style={styles.bankValue}>Gomate Driver Services</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Account Number:</Text>
                  <Text style={styles.bankValueHighlight}>12345678901234</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>IBAN:</Text>
                  <Text style={styles.bankValueSmall}>
                    PK36HABB0012345678901234
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment Instructions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Instructions</Text>

              <View style={styles.instructionCard}>
                <View style={styles.instructionStep}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Transfer the weekly payment according to your vehicle type
                    to the bank account above
                  </Text>
                </View>

                <View style={styles.instructionStep}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Take a clear screenshot of your payment receipt or
                    transaction confirmation
                  </Text>
                </View>

                <View style={styles.instructionStep}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Send the screenshot to our support WhatsApp number using the
                    button below
                  </Text>
                </View>

                <View style={styles.instructionStep}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>4</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Your account will be activated within 24 hours after
                    verification
                  </Text>
                </View>
              </View>
            </View>

            {/* WhatsApp Support Button */}
            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={handleWhatsAppSupport}
            >
              <Ionicons name="logo-whatsapp" size={24} color="#fff" />
              <Text style={styles.whatsappButtonText}>
                Send Payment Screenshot on WhatsApp
              </Text>
            </TouchableOpacity>

            {/* Important Notice */}
            <View style={styles.warningCard}>
              <Ionicons name="warning" size={24} color="#FF9500" />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Important Notice</Text>
                <Text style={styles.warningText}>
                  • Payment must be made weekly to avoid account suspension
                  {"\n"}• Overdue payments will result in temporary account
                  deactivation
                  {"\n"}• Always include your driver ID in payment remarks
                  {"\n"}• Keep payment receipts for your records
                </Text>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>

      {/* Burger Menu */}
      <BurgerMenu
        isVisible={sidebarVisible}
        onClose={closeSidebar}
        slideAnim={slideAnim}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0286FF",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButton: {
    padding: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  noticeCard: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#0286FF",
  },
  noticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0286FF",
    marginLeft: 12,
  },
  noticeText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  rateCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
  },
  rateLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
  },
  rateRight: {
    alignItems: "flex-end",
  },
  weeklyFee: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0286FF",
  },
  perWeek: {
    fontSize: 12,
    color: "#999",
  },
  bankHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  bankCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  bankRow: {
    marginBottom: 16,
  },
  bankLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  bankValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  bankValueHighlight: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0286FF",
    letterSpacing: 1,
  },
  bankValueSmall: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  instructionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionStep: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0286FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    paddingTop: 4,
  },
  whatsappButton: {
    backgroundColor: "#25D366",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  whatsappButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 12,
  },
  warningCard: {
    backgroundColor: "#FFF3E0",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    borderLeftWidth: 4,
    borderLeftColor: "#FF9500",
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF9500",
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: "#666",
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
});

export default DriverPaymentsScreen;
