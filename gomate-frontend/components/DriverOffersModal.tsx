import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import CustomButton from "@/components/CustomButton";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  profile_image_url: string;
  car_image_url: string;
  fare: number;
  time: string;
  distance: string;
  carMake: string;
  carModel: string;
}

interface RawOffer {
  counterFare: string;
  driverId: string;
  rideId: string;
}

interface DriverOffersModalProps {
  visible: boolean;
  onClose: () => void;
  onDriverAccepted: (driver: Driver) => void;
  rideDetails?: {
    pickup: string;
    dropoff: string;
    rideType: string;
    fare: string;
  };
  offers?: RawOffer[];
}

const DriverOffersModal: React.FC<DriverOffersModalProps> = ({
  visible,
  onClose,
  onDriverAccepted,
  rideDetails,
  offers = [],
}) => {
  const [loading, setLoading] = useState(false);
  const [fareOffer, setFareOffer] = useState<number>(0);

  // animation values (1 per driver card)
  const slideAnimsRef = useRef<Animated.Value[]>([]);

  // rebuild anim array whenever offers change
  useEffect(() => {
    slideAnimsRef.current = offers.map(() => new Animated.Value(-width));
  }, [offers]);

  // animate when modal opens
  useEffect(() => {
    if (visible) {
      setLoading(true);
      setFareOffer(0);

      slideAnimsRef.current.forEach((anim) => anim.setValue(-width));

      const timer = setTimeout(() => {
        setLoading(false);
        slideAnimsRef.current.forEach((anim, index) => {
          Animated.timing(anim, {
            toValue: 0,
            duration: 500,
            delay: index * 300,
            useNativeDriver: true,
          }).start();
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [visible, offers]);

  const adjustFare = (increase: boolean) => {
    setFareOffer((prev) => {
      const step = 10;
      const next = increase ? prev + step : prev - step;
      return Math.max(0, next);
    });
  };

  const acceptDriver = (driver: Driver) => {
    Alert.alert(
      "Ride Confirmed! 🚗",
      `Your ride with ${driver.first_name} ${driver.last_name} has been confirmed.`,
      [{ text: "Great!", onPress: () => onDriverAccepted(driver) }]
    );
  };

  const confirmFareIncrease = () => {
    Alert.alert(
      "Fare Updated",
      `Your fare offer is now PKR ${
        Number(rideDetails?.fare || 0) + fareOffer
      }. This will be broadcast to drivers.`,
      [{ text: "OK" }]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="pt-4 pb-4 bg-white border-b border-gray-100">
          <View className="flex-row items-center justify-between px-6">
            <View className="flex-1">
              <Text className="text-2xl font-JakartaExtraBold text-gray-800">
                Available Drivers
              </Text>
              {rideDetails && (
                <Text className="text-sm text-gray-600 font-JakartaMedium mt-1">
                  {rideDetails.pickup} → {rideDetails.dropoff}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            >
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Loader */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text className="mt-4 text-lg text-gray-700 font-JakartaMedium">
              Creating Ride....
            </Text>
          </View>
        ) : (
          <>
            {/* Driver list */}
            <ScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              className="flex-1 pt-4"
            >
              {offers.length === 0 && (
                <View className="flex-1 justify-center items-center">
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text className="mt-4 text-lg text-gray-700 font-JakartaMedium">
                    Finding nearby drivers...
                  </Text>
                  <Text className="mt-2 text-sm text-gray-500">
                    This may take a few moments
                  </Text>
                </View>
              )}

              {offers.map((offer, index) => {
                const anim =
                  slideAnimsRef.current[index] || new Animated.Value(0);
                return (
                  <Animated.View
                    key={offer.driverId || index}
                    style={{ transform: [{ translateX: anim }] }}
                    className="bg-white rounded-2xl p-5 mb-4 mx-4 shadow-sm border border-gray-100"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        {/* Temporary circle instead of image */}
                        <View className="w-16 h-16 rounded-full bg-gray-200 mr-4 items-center justify-center">
                          <Text className="text-gray-500 font-bold">D</Text>
                        </View>

                        <View className="flex-1">
                          <Text className="text-xl font-JakartaBold text-gray-800">
                            Driver {offer.driverId?.slice(-4)}
                          </Text>
                          <Text className="text-gray-600 font-JakartaMedium">
                            Ride ID: {offer.rideId}
                          </Text>
                        </View>
                      </View>

                      <View className="items-end">
                        <Text className="text-2xl font-JakartaExtraBold text-green-600">
                          Rs {offer.counterFare}
                        </Text>
                      </View>
                    </View>

                    <CustomButton
                      title="Accept Ride"
                      className="mt-4 bg-blue-600 py-3 rounded-xl"
                      onPress={() =>
                        acceptDriver({
                          id: offer.driverId,
                          first_name: "Driver",
                          last_name: offer.driverId?.slice(-4),
                          profile_image_url: "",
                          car_image_url: "",
                          fare: Number(offer.counterFare),
                          time: "",
                          distance: "",
                          carMake: "",
                          carModel: "",
                        })
                      }
                    />
                  </Animated.View>
                );
              })}
            </ScrollView>

            {/* Fare raise section */}
            <View className="bg-gray-50 px-4 py-4 border-t border-gray-200">
              <Text className="text-center font-JakartaBold text-gray-800 mb-2">
                Want to increase your chances?
              </Text>
              <Text className="text-center font-JakartaMedium text-gray-600 text-sm mb-4">
                Raise your fare to get more driver responses
              </Text>

              <View className="flex-row items-center justify-center mb-4">
                <TouchableOpacity
                  className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-gray-200"
                  onPress={() => adjustFare(false)}
                >
                  <Ionicons name="remove" size={20} color="#666" />
                </TouchableOpacity>

                <View className="mx-8 items-center bg-white px-6 py-3 rounded-full shadow-sm border border-gray-200">
                  <Text className="text-xs text-gray-500 font-JakartaMedium">
                    EXTRA FARE
                  </Text>
                  <Text className="text-2xl font-JakartaExtraBold text-gray-800">
                    PKR {Number(rideDetails?.fare || 0) + fareOffer}
                  </Text>
                </View>

                <TouchableOpacity
                  className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-gray-200"
                  onPress={() => adjustFare(true)}
                >
                  <Ionicons name="add" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View className="flex-row space-x-3">
                <View className="flex-1">
                  <CustomButton
                    title="Cancel"
                    className="bg-red-500 py-3 rounded-xl"
                    onPress={onClose}
                  />
                </View>
                {fareOffer > 0 && (
                  <View className="flex-1">
                    <CustomButton
                      title="Update Fare"
                      className="bg-green-600 py-3 rounded-xl"
                      onPress={confirmFareIncrease}
                    />
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

export default DriverOffersModal;
