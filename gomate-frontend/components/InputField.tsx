import { InputFieldProps } from "@/types/type";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const InputField = ({
  label,
  labelStyle = "",
  icon,
  secureTextEntry = false,
  containerStyle = "",
  inputStyle = "",
  iconStyle = "",
  className = "",
  keyboardType = "default",
  rightIcon,
  ...props
}: InputFieldProps & { rightIcon?: React.ReactNode }) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <KeyboardAvoidingView>
      <TouchableWithoutFeedback>
        <View className="my-2 w-full">
          {label && (
            <Text
              className={`text-2xl font-JakartaSemiBold mb-3 ${labelStyle}`}
            >
              {label}
            </Text>
          )}
          <View
            className={`flex flex-row justify-start items-center relative bg-neutral-100 rounded-full border ${
              isFocused ? "border-primary-500" : "border-neutral-100"
            } ${containerStyle}`}
          >
            {icon && (
              <Image source={icon} className={`w-6 h-6 ml-4 ${iconStyle}`} />
            )}

            <TextInput
              className={`rounded-full p-4 py-6 font-JakartaSemiBold text-xl flex-1 ${inputStyle} text-left`}
              secureTextEntry={secureTextEntry && !showPassword}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              keyboardType={keyboardType}
              {...props}
            />

            {/* Right-side icon*/}
            {rightIcon && (
              <TouchableOpacity
                activeOpacity={0.7}
                className="mr-3 p-2 rounded-full"
              >
                {rightIcon}
              </TouchableOpacity>
            )}

            {/* Password toggle */}
            {secureTextEntry && (
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="mr-5"
              >
                <Image
                  source={
                    showPassword
                      ? require("@/assets/icons/view.png")
                      : require("@/assets/icons/hide.png")
                  }
                  className="w-8 h-8"
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default InputField;
