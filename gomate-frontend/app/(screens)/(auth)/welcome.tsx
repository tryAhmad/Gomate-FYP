import React, { useState, useRef } from "react";
import { Image, Text, TouchableOpacity, View, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import CustomButton from "@/components/CustomButton";
import { onboarding } from "@/constants/index";
import { router } from "expo-router";

const { width } = Dimensions.get("window");

const Onboarding = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<Swiper>(null);

  const isLastSlide = activeIndex === onboarding.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      router.replace("/(screens)/(auth)/login");
    } else {
      swiperRef.current?.scrollBy(1, true); // move to next slide
    }
  };

  return (
    <SafeAreaView className="flex h-full items-center justify-between bg-white">
      {/* Skip */}
      <TouchableOpacity
        onPress={() => router.replace("/(screens)/(auth)/login")}
        className="w-full flex justify-end items-end p-5"
      >
        <Text className="text-black text-xl font-JakartaBold">Skip</Text>
      </TouchableOpacity>

      {/* Swiper */}
      <Swiper
        ref={swiperRef}
        loop={false}
        index={0}
        onIndexChanged={(idx) => setActiveIndex(idx)}
        dot={<View className="w-3 h-3 rounded-full bg-gray-300 mx-1" />}
        activeDot={<View className="w-3 h-3 rounded-full bg-blue-500 mx-1" />}
        paginationStyle={{ bottom: 100 }} // adjust dot position
      >
        {onboarding.map((item, idx) => (
          <View key={idx} className="flex items-center justify-center p-5 mt-[10%]">
            <Image
              source={item.image}
              className="w-full h-[300px]"
              resizeMode="contain"
            />

            <View className="flex flex-row items-center justify-center w-full mt-10">
              <Text className="text-black text-4xl font-JakartaExtraBold mx-10 text-center">
                {item.title.includes("GoMate") ? (
                  <>
                    {item.title.split("GoMate")[0]}
                    <Text className="text-blue-500">GoMate</Text>
                    {item.title.split("GoMate")[1]}
                  </>
                ) : (
                  item.title
                )}
              </Text>
            </View>

            <Text className="text-lg font-JakartaSemiBold text-center text-[#858585] mx-10 mt-3">
              {item.description}
            </Text>
          </View>
        ))}
      </Swiper>

      {/* Next / Get Started */}
      <CustomButton
        title={isLastSlide ? "Get Started" : "Next"}
        onPress={handleNext}
        className="max-w-xs mt-10 mb-10"
      />
    </SafeAreaView>
  );
};

export default Onboarding;
