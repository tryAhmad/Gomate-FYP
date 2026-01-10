import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
  StatusBar,
  StyleSheet,
  Animated,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BurgerMenu from "@/components/BurgerMenu";
import { useAuth } from "@/contexts/AuthContext";

const { width, height } = Dimensions.get("window");

interface Notification {
  _id: string;
  type: "Promotion" | "System" | "Ride" | "Payment";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: any;
}

export default function DriverNotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { driver } = useAuth();

  // Burger menu states - Using same animation as ride history page
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.7)).current;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    if (!driver?._id) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://192.168.100.5:3000/notifications/driver/${driver._id}`
      );
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

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

  const openNotification = async (notification: Notification) => {
    setSelectedNotification(notification);

    // Mark as read if unread
    if (!notification.read) {
      try {
        await fetch(
          `http://192.168.100.5:3000/notifications/${notification._id}/read`,
          { method: "PATCH" }
        );

        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, read: true } : n
          )
        );
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "System":
        return (
          <Ionicons
            name="checkmark-circle"
            size={28}
            color="#10b981" // Green for system
          />
        );
      case "Ride":
        return (
          <Ionicons
            name="car"
            size={28}
            color="#1e40af" // Dark blue for ride
          />
        );
      case "Promotion":
        return (
          <Ionicons
            name="ticket"
            size={28}
            color="#f59e0b" // Orange for promotion
          />
        );
      case "Payment":
        return (
          <Ionicons
            name="wallet"
            size={28}
            color="#ef4444" // Red for payment
          />
        );
      default:
        return <Ionicons name="notifications" size={28} color="#0286FF" />;
    }
  };

  const getModalIcon = (type: string) => {
    switch (type) {
      case "System":
        return <Ionicons name="checkmark-circle" size={64} color="#10b981" />;
      case "Ride":
        return <Ionicons name="car" size={64} color="#1e40af" />;
      case "Promotion":
        return <Ionicons name="ticket" size={64} color="#f59e0b" />;
      case "Payment":
        return <Ionicons name="wallet" size={64} color="#ef4444" />;
      default:
        return <Ionicons name="notifications" size={64} color="#0286FF" />;
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read ? styles.unreadNotification : styles.readNotification,
      ]}
      onPress={() => openNotification(item)}
    >
      {/* Icon */}
      <View
        style={[
          styles.notificationIcon,
          !item.read && styles.unreadNotificationIcon,
        ]}
      >
        {getNotificationIcon(item.type)}
      </View>

      {/* Text Content */}
      <View style={styles.notificationContent}>
        <Text
          style={[styles.notificationTitle, !item.read && styles.unreadTitle]}
        >
          {item.title}
        </Text>
        <Text
          style={[
            styles.notificationMessage,
            !item.read && styles.unreadMessage,
          ]}
          numberOfLines={2}
        >
          {item.message}
        </Text>
      </View>

      {/* Unread indicator */}
      {!item.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" barStyle="dark-content" />

      {/* Header - Same as ride history page */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={openSidebar}>
          <Ionicons name="menu" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Notification List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0286FF" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderNotificationItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0286FF"]}
            />
          }
        />
      )}

      {/* Notification Detail Modal */}
      <Modal visible={!!selectedNotification} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              {selectedNotification && getModalIcon(selectedNotification.type)}
            </View>
            <Text style={styles.modalTitle}>{selectedNotification?.title}</Text>
            <Text style={styles.modalMessage}>
              {selectedNotification?.message}
            </Text>

            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedNotification(null)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Burger Menu - Same as ride history page */}
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
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop:
      Platform.OS === "ios"
        ? 60
        : StatusBar.currentHeight
        ? StatusBar.currentHeight + 10
        : 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
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
  headerRightPlaceholder: {
    width: 40, // Same as menu button for balance
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
  },
  unreadNotification: {
    backgroundColor: "#f0f9ff", // Light blue for unread
  },
  readNotification: {
    backgroundColor: "#fff", // White for read
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  unreadNotificationIcon: {
    backgroundColor: "#e0f2fe", // Slightly darker blue for unread icons
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#64748b", // Gray for read titles
    marginBottom: 4,
  },
  unreadTitle: {
    color: "#1e293b", // Darker for unread titles
    fontWeight: "800",
  },
  notificationMessage: {
    fontSize: 16,
    color: "#94a3b8", // Lighter gray for read messages
    fontWeight: "500",
    lineHeight: 20,
  },
  unreadMessage: {
    color: "#475569", // Darker for unread messages
    fontWeight: "600",
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0286FF",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: "#999",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalIcon: {
    borderRadius: 40,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 18,
    fontWeight: "500",
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  closeButton: {
    backgroundColor: "#0286FF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
