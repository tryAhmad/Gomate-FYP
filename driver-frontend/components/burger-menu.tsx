import type React from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Animated } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"   

const { width } = Dimensions.get("window")

interface BurgerMenuProps {
  isVisible: boolean
  onClose: () => void
  slideAnim: Animated.Value
}

const BurgerMenu: React.FC<BurgerMenuProps> = ({ isVisible, onClose, slideAnim }) => {
  
  // Handlers for menu buttons
  const handleProfileClick = () => {
    console.log("Opening profile...")
    // router.push("/profile") 
  }

  const handleBookRide = () => {
    console.log("Navigating to Book Ride...")
    onClose()
    router.push("/landing-page" as any) 
  }

  const handleRideHistory = () => {
    console.log("Opening ride history...")
    router.push("/ride-history") 
    onClose()
  }

  const handleEarnings = () => {
    console.log("Opening earnings...")
    // router.push("/earnings") 
  }

  const handleNotifications = () => {
    console.log("Opening notifications...")
    // router.push("/notifications")
  }

  const handleSupport = () => {
    console.log("Opening support...")
    // router.push("/support")
  }

  const handleLogout = () => {
    console.log("Logging out...")
    // add logout logic here
  }

  return (
    <Modal animationType="none" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <Animated.View
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={{ flex: 1 }}>
            {/* Profile Section */}
            <View style={styles.sidebarHeader}>
              <TouchableOpacity style={styles.profileSection} onPress={handleProfileClick}>
                <View style={styles.profileImage}>
                  <Text style={styles.profileInitial}>A</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>Ahmad</Text>
                  <View style={styles.ratingContainer}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons key={i} name="star" size={12} color="#FFD700" />
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={styles.menuItems}>
              
              <TouchableOpacity style={styles.menuItem} onPress={handleBookRide}>
                <Ionicons name="car" size={22} color="black" />
                <Text style={styles.menuText}>Book Ride</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={handleRideHistory}>
                <Ionicons name="time" size={20} color="black" />
                <Text style={styles.menuText}>Ride History</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={handleEarnings}>
                <Ionicons name="cash" size={20} color="black" />
                <Text style={styles.menuText}>Earnings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={handleNotifications}>
                <Ionicons name="notifications" size={20} color="black" />
                <Text style={styles.menuText}>Notifications</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={handleSupport}>
                <Ionicons name="call" size={20} color="black" />
                <Text style={styles.menuText}>Support</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Ionicons name="log-out" size={20} color="black" />
                <Text style={[styles.menuText, { color: "red" }]}>Log out</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  sidebar: {
    width: width * 0.7,
    height: "100%",
    backgroundColor: "#fff",
    paddingTop: 40,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sidebarHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  profileInitial: {
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 20,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 2,
    justifyContent: "flex-start",
  },
  menuItems: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  menuText: {
    fontSize: 16,
    color: "#333",
  },
})

export default BurgerMenu
