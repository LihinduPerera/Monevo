import React, { useState } from 'react';
import { View, Text, Image, Dimensions, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Marquee } from '@animatereactnative/marquee';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import SignInForm from '@/components/SignInForm';

const { width, height } = Dimensions.get('window');

export default function LandingScreen() {
  const [isSignInDialogShown, setIsSignInDialogShown] = useState(false);

  const contentTop = useSharedValue(0);
  const dialogTranslateY = useSharedValue(-height);

  const generateRandomChars = (length: number) => {
    return Array.from({ length }, () => String.fromCharCode(33 + Math.floor(Math.random() * 94))).join(' ');
  };

  const randomChars1 = generateRandomChars(50);
  const randomChars2 = generateRandomChars(50);

  const handleButtonPress = () => {
    contentTop.value = withTiming(-50, { duration: 240 });
    dialogTranslateY.value = withTiming(0, { duration: 300 });
    setIsSignInDialogShown(true);
  };

  const closeDialog = () => {
    contentTop.value = withTiming(0, { duration: 240 });
    dialogTranslateY.value = withTiming(-height, { duration: 300 });
    setTimeout(() => setIsSignInDialogShown(false), 300);
  };

  const animatedContentStyle = useAnimatedStyle(() => ({
    top: contentTop.value,
  }));

  const animatedDialogStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dialogTranslateY.value }],
  }));

  return (
    <View className="flex-1">
      {/* Background image */}
      <View 
        className="absolute left-[100px] bottom-[200px]"
        style={{ width: width * 1.7 }}
      >
        <Image
          source={require('../../assets/backgrounds/spline.png')}
          className="w-full"
          resizeMode="contain"
        />
      </View>

      {/* Marquee background layers */}
      <View className="absolute inset-0">
        <Marquee speed={0.5} spacing={20}>
          <Text className="text-[100px] opacity-20 text-gray-500">{randomChars1}</Text>
        </Marquee>
      </View>
      <View className="absolute inset-0">
        <Marquee speed={0.8} spacing={20} reverse={true}>
          <Text className="text-[80px] opacity-20 text-[#87A4E3]">{randomChars2}</Text>
        </Marquee>
      </View>

      <BlurView intensity={30} tint="light" className="absolute inset-0" />

      {/* Main content */}
      <Animated.View 
        className="absolute left-0"
        style={[{ height: height, width: width }, animatedContentStyle]}
      >
        <SafeAreaView className="flex-1">
          <View className="px-8 flex-1">
            <View className="flex-1" />
            
            {/* Title section */}
            <View className="w-[280px]">
              <Text className="text-[40px] font-bold leading-[48px]" style={{ fontFamily: 'Poppins-Bold' }}>
                Your Money, Simplified
              </Text>
              <View className="h-5" />
              <Text className="text-base text-gray-800">
                Track income, monitor expenses, and stay in control of your finances — all in one smart dashboard.
              </Text>
            </View>

            <View className="flex-[2]" />

            {/* Sign In button */}
            <TouchableOpacity 
              className="bg-[#4a30ca] rounded-[10px] p-4"
              onPress={handleButtonPress}
            >
              <Text className="text-white text-center text-base font-semibold">
                Get Started
              </Text>
            </TouchableOpacity>

            {/* Footer text */}
            <View className="py-6">
              <Text className="text-sm text-gray-500 text-center" style={{ fontFamily: 'Poppins' }}>
                Take charge of your spending habits and reach your financial goals effortlessly.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Sign In Dialog */}
      {isSignInDialogShown && (
        <Animated.View 
          className="absolute inset-0 justify-center items-center bg-transparent"
          style={animatedDialogStyle}
        >
          <View className="h-[560px] mx-4 py-8 px-6 bg-white rounded-[40px] overflow-hidden">
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <Text className="text-[34px] font-bold text-center" style={{ fontFamily: 'Poppins' }}>
                Welcome Back
              </Text>
              <View className="py-4">
                <Text className="text-center text-gray-500">
                  Sign in to access your income and expense reports, budgets, and insights.
                </Text>
              </View>

              <SignInForm onClose={closeDialog} />

              <View className="flex-row items-center my-4">
                <View className="flex-1 h-[1px] bg-gray-300" />
                <Text className="px-2.5 text-gray-600">New Here?</Text>
                <View className="flex-1 h-[1px] bg-gray-300" />
              </View>

              <View className="pt-2.5 px-2">
                <Text className="text-center text-sm text-gray-500" style={{ fontFamily: 'Poppins' }}>
                  Don't have an account yet? Create one to start managing your finances smarter.
                </Text>
              </View>
            </ScrollView>
          </View>

          {/* Close button */}
          <View 
            className="absolute self-center"
            style={{ bottom: height / 2 - 280 - 16 }}
          >
            <TouchableOpacity 
              className="w-8 h-8 rounded-full bg-white justify-center items-center"
              onPress={closeDialog}
            >
              <Ionicons name="close" size={20} color="black" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}