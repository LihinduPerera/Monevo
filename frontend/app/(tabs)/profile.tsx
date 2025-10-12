import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '@/components/CustomHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, isAuthenticated, appReady, logout } = useAuth();

  // Animation refs for the 5 orbs
  const glowAnim1 = useRef(new Animated.Value(0)).current;
  const glowAnim2 = useRef(new Animated.Value(0)).current;
  const glowAnim3 = useRef(new Animated.Value(0)).current;
  const glowAnim4 = useRef(new Animated.Value(0)).current;
  const glowAnim5 = useRef(new Animated.Value(0)).current;

  // Generate random positions and movements for the orbs
  const orbConfigs = useRef([
    {
      x: [Math.random() * screenWidth, Math.random() * screenWidth, Math.random() * screenWidth],
      y: [Math.random() * screenHeight, Math.random() * screenHeight, Math.random() * screenHeight],
      size: 180,
      colors: ['rgba(147, 51, 234, 0.4)', 'rgba(147, 51, 234, 0.1)', 'transparent'] as const,
      duration: 4000,
      delay: 0
    },
    {
      x: [Math.random() * screenWidth, Math.random() * screenWidth, Math.random() * screenWidth],
      y: [Math.random() * screenHeight, Math.random() * screenHeight, Math.random() * screenHeight],
      size: 150,
      colors: ['rgba(6, 182, 212, 0.4)', 'rgba(6, 182, 212, 0.1)', 'transparent'] as const,
      duration: 5000,
      delay: 1000
    },
    {
      x: [Math.random() * screenWidth, Math.random() * screenWidth, Math.random() * screenWidth],
      y: [Math.random() * screenHeight, Math.random() * screenHeight, Math.random() * screenHeight],
      size: 200,
      colors: ['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.1)', 'transparent'] as const,
      duration: 6000,
      delay: 2000
    },
    {
      x: [Math.random() * screenWidth, Math.random() * screenWidth, Math.random() * screenWidth],
      y: [Math.random() * screenHeight, Math.random() * screenHeight, Math.random() * screenHeight],
      size: 160,
      colors: ['rgba(244, 63, 94, 0.3)', 'rgba(244, 63, 94, 0.1)', 'transparent'] as const,
      duration: 4500,
      delay: 1500
    },
    {
      x: [Math.random() * screenWidth, Math.random() * screenWidth, Math.random() * screenWidth],
      y: [Math.random() * screenHeight, Math.random() * screenHeight, Math.random() * screenHeight],
      size: 190,
      colors: ['rgba(168, 85, 247, 0.4)', 'rgba(168, 85, 247, 0.1)', 'transparent'] as const,
      duration: 5500,
      delay: 2500
    }
  ]).current;

  useEffect(() => {
    if (appReady && !isAuthenticated) {
      router.replace('/landing');
    }
  }, [isAuthenticated, appReady]);

  // Create orb animations
  useEffect(() => {
    const createOrbAnimation = (animValue: Animated.Value, duration: number, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = [
      createOrbAnimation(glowAnim1, orbConfigs[0].duration, orbConfigs[0].delay),
      createOrbAnimation(glowAnim2, orbConfigs[1].duration, orbConfigs[1].delay),
      createOrbAnimation(glowAnim3, orbConfigs[2].duration, orbConfigs[2].delay),
      createOrbAnimation(glowAnim4, orbConfigs[3].duration, orbConfigs[3].delay),
      createOrbAnimation(glowAnim5, orbConfigs[4].duration, orbConfigs[4].delay),
    ];

    animations.forEach(animation => animation.start());

    return () => {
      animations.forEach(animation => animation.stop());
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/landing');
  };

  // Create animated orbs
  const renderAnimatedOrbs = () => {
    const orbs = [
      { anim: glowAnim1, config: orbConfigs[0] },
      { anim: glowAnim2, config: orbConfigs[1] },
      { anim: glowAnim3, config: orbConfigs[2] },
      { anim: glowAnim4, config: orbConfigs[3] },
      { anim: glowAnim5, config: orbConfigs[4] },
    ];

    return orbs.map((orb, index) => {
      const x = orb.anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: orb.config.x,
      });

      const y = orb.anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: orb.config.y,
      });

      const opacity = orb.anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.3, 0.6, 0.3],
      });

      return (
        <Animated.View
          key={index}
          style={{
            position: 'absolute',
            width: orb.config.size,
            height: orb.config.size,
            transform: [{ translateX: x }, { translateY: y }],
            opacity: opacity,
          }}
        >
          <LinearGradient
            colors={orb.config.colors}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, borderRadius: orb.config.size / 2 }}
          />
        </Animated.View>
      );
    });
  };

  // Show loading while checking authentication
  if (!appReady) {
    return (
      <View className="flex-1 bg-[#030014] justify-center items-center">
        <Text className="text-lg text-purple-200">Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <View className="flex-1 bg-[#030014] justify-center items-center">
        <Text className="text-lg text-purple-200">Redirecting to login...</Text>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View className="flex-1">
      {/* Animated Background */}
      <View className="absolute inset-0">
        <LinearGradient
          colors={['#0a0a1a', '#1a1a2e', '#16213e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
        {renderAnimatedOrbs()}
      </View>

      {/* Glass-like Content */}
      <BlurView intensity={50} tint="dark" className="flex-1">
        {/* <CustomHeader title="Profile" /> */}
        
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View className="items-center mb-6 mt-28">
            <View className="bg-purple-600/80 w-24 h-24 rounded-full items-center justify-center mb-4 border-4 border-purple-500/30 backdrop-blur-lg">
              <Ionicons name="person" size={40} color="#ffffff" />
            </View>
            <Text className="text-2xl font-bold text-white mb-1">{user.name}</Text>
            <Text className="text-purple-300/80">{user.email}</Text>
          </View>

          {/* Profile Information Card */}
          <View className="bg-[#1a1a2e]/70 rounded-2xl p-6 mb-6 border border-purple-900/30 backdrop-blur-lg">
            <Text className="text-xl font-bold text-center text-white mb-6">
              Profile Information
            </Text>

            <View className="space-y-4">
              <View className="flex-row justify-between items-center py-3 border-b border-purple-900/30">
                <View className="flex-row items-center">
                  <Ionicons name="person-outline" size={20} color="#8b5cf6" />
                  <Text className="text-gray-300 font-medium ml-2">Name</Text>
                </View>
                <Text className="text-white font-semibold">{user.name}</Text>
              </View>

              <View className="flex-row justify-between items-center py-3 border-b border-purple-900/30">
                <View className="flex-row items-center">
                  <Ionicons name="mail-outline" size={20} color="#8b5cf6" />
                  <Text className="text-gray-300 font-medium ml-2">Email</Text>
                </View>
                <Text className="text-white font-semibold">{user.email}</Text>
              </View>

              <View className="flex-row justify-between items-center py-3 border-b border-purple-900/30">
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={20} color="#8b5cf6" />
                  <Text className="text-gray-300 font-medium ml-2">Date of Birth</Text>
                </View>
                <Text className="text-white font-semibold">
                  {formatDate(user.date_of_birth)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-3 border-b border-purple-900/30">
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={20} color="#8b5cf6" />
                  <Text className="text-gray-300 font-medium ml-2">Member Since</Text>
                </View>
                <Text className="text-white font-semibold">
                  {formatDate(user.created_at)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-3">
                <View className="flex-row items-center">
                  <Ionicons name="shield-checkmark-outline" size={20} color="#8b5cf6" />
                  <Text className="text-gray-300 font-medium ml-2">Account Status</Text>
                </View>
                <View className={`px-3 py-1 rounded-full backdrop-blur-lg ${
                  user.is_active ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  <Text className={`font-semibold ${
                    user.is_active ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Info Card */}
          <View className="bg-blue-500/20 border border-blue-500/20 rounded-2xl p-4 mb-6 backdrop-blur-lg">
            <View className="flex-row items-start">
              <Ionicons name="information-circle-outline" size={20} color="#60a5fa" className="mt-0.5" />
              <Text className="text-blue-300 text-sm ml-2 flex-1">
                Your data is securely stored and synchronized across all your devices.
              </Text>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-500/20 border border-red-500/20 rounded-2xl p-4 flex-row justify-center items-center mb-8 backdrop-blur-lg"
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="text-red-400 font-semibold text-lg ml-2">Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </BlurView>
    </View>
  );
}