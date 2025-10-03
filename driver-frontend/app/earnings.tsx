import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router"; 
import BurgerMenu from "@/components/BurgerMenu";

const { width, height } = Dimensions.get("window");

interface EarningsData {
  weekly: number;
  monthly: number;
  total: number;
  trends: {
    month: string;
    amount: number;
  }[];
}

export default function EarningsScreen() {
  const router = useRouter();
  const [earnings, setEarnings] = useState<EarningsData>({
    weekly: 0,
    monthly: 0,
    total: 0,
    trends: [],
  });
  const [loading, setLoading] = useState(true);

  // Burger menu states
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

  // Calculate earnings from ride history
  const calculateEarnings = async () => {
    try {
      const cached = await AsyncStorage.getItem("driverRideHistory");
      if (cached) {
        const rides = JSON.parse(cached);
        
        // Filter only completed rides
        const completedRides = rides.filter((ride: any) => ride.status === "completed");
        
        // Get current date
        const now = new Date();
        const currentWeek = getWeekNumber(now);
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Calculate weekly earnings (current week)
        const weeklyEarnings = completedRides
          .filter((ride: any) => {
            const rideDate = new Date(ride.createdAt);
            return (
              getWeekNumber(rideDate) === currentWeek &&
              rideDate.getFullYear() === currentYear
            );
          })
          .reduce((sum: number, ride: any) => sum + ride.fare, 0);

        // Calculate monthly earnings (current month)
        const monthlyEarnings = completedRides
          .filter((ride: any) => {
            const rideDate = new Date(ride.createdAt);
            return (
              rideDate.getMonth() === currentMonth &&
              rideDate.getFullYear() === currentYear
            );
          })
          .reduce((sum: number, ride: any) => sum + ride.fare, 0);

        // Calculate total earnings
        const totalEarnings = completedRides.reduce(
          (sum: number, ride: any) => sum + ride.fare,
          0
        );

        // Calculate trends (last 6 months)
        const trends = calculateTrends(completedRides);

        setEarnings({
          weekly: weeklyEarnings,
          monthly: monthlyEarnings,
          total: totalEarnings,
          trends,
        });
      }
    } catch (error) {
      console.error("Error calculating earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get week number
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Calculate trends for last 6 months
  const calculateTrends = (rides: any[]) => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    
    const trends = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const monthlyEarnings = rides
        .filter((ride: any) => {
          const rideDate = new Date(ride.createdAt);
          return (
            rideDate.getMonth() === month &&
            rideDate.getFullYear() === year
          );
        })
        .reduce((sum: number, ride: any) => sum + ride.fare, 0);
      
      trends.push({
        month: months[month],
        amount: monthlyEarnings,
      });
    }
    
    return trends;
  };

  useEffect(() => {
    calculateEarnings();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      calculateEarnings();
    }, [])
  );

  const maxTrendAmount = Math.max(...earnings.trends.map(t => t.amount), 1);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Calculating earnings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" />

      {/* Header with burger menu */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={openSidebar}>
          <Ionicons name="menu" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Earnings</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* This Week Earnings */}
        <View style={styles.earningsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={24} color="#030303ff" />
            <Text style={styles.cardTitle}>This Week</Text>
          </View>
          <Text style={styles.earningsAmount}>PKR {earnings.weekly.toLocaleString()}</Text>
          <Text style={styles.cardSubtitle}>Total earnings from completed rides this week</Text>
        </View>

        {/* This Month Earnings */}
        <View style={styles.earningsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={24} color="#111111ff" />
            <Text style={styles.cardTitle}>This Month</Text>
          </View>
          <Text style={styles.earningsAmount}>PKR {earnings.monthly.toLocaleString()}</Text>
          <Text style={styles.cardSubtitle}>Total earnings from completed rides this month</Text>
        </View>

        {/* Total Earnings */}
        <View style={styles.earningsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet-outline" size={24} color="#111212ff" />
            <Text style={styles.cardTitle}>Earnings to Date</Text>
          </View>
          <Text style={styles.earningsAmount}>PKR {earnings.total.toLocaleString()}</Text>
          <Text style={styles.cardSubtitle}>All-time earnings from completed rides</Text>
        </View>

        {/* Earnings Trends */}
        <View style={styles.trendsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="trending-up" size={24} color="#0286FF" />
            <Text style={styles.cardTitle}>Earnings Trends</Text>
          </View>
          
          <View style={styles.trendsHeader}>
            <Text style={styles.trendsAmount}>PKR {earnings.total.toLocaleString()}</Text>
            <View style={styles.trendsBadge}>
              <Ionicons name="arrow-up" size={12} color="#fff" />
              <Text style={styles.trendsBadgeText}>+12%</Text>
            </View>
          </View>
          <Text style={styles.trendsSubtitle}>Last 6 months</Text>

          {/* Bar Graph */}
          <View style={styles.graphContainer}>
            {earnings.trends.map((trend, index) => (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max((trend.amount / maxTrendAmount) * 100, 10)}%`,
                        backgroundColor: "#0286FF",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.monthLabel}>{trend.month}</Text>
                <Text style={styles.amountLabel}>PKR {trend.amount}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Burger Menu */}
      <BurgerMenu 
        isVisible={sidebarVisible} 
        onClose={closeSidebar} 
        slideAnim={slideAnim} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0286FF",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  earningsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trendsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 12,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0286FF",
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  trendsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  trendsAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  trendsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendsBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 4,
  },
  trendsSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 24,
  },
  graphContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 150,
    marginTop: 16,
  },
  barContainer: {
    alignItems: "center",
    flex: 1,
  },
  barWrapper: {
    height: 100,
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 8,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    minHeight: 10,
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginTop: 4,
  },
  amountLabel: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },
});