import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '@/components/CustomHeader';

export default function ProfileScreen() {
  const { user, isAuthenticated, appReady, logout } = useAuth();

  useEffect(() => {
    if (appReady && !isAuthenticated) {
      router.replace('/landing');
    }
  }, [isAuthenticated, appReady]);

  const handleLogout = async () => {
    await logout();
    router.replace('/landing');
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
    <View className="flex-1 bg-[#030014]">
      <CustomHeader title="Profile" />
      
      <ScrollView className="flex-1 p-4">
        {/* Profile Header */}
        <View className="items-center mb-6 mt-32">
          <View className="bg-purple-600 w-24 h-24 rounded-full items-center justify-center mb-4 border-4 border-purple-500/50">
            <Ionicons name="person" size={40} color="#ffffff" />
          </View>
          <Text className="text-2xl font-bold text-white mb-1">{user.name}</Text>
          <Text className="text-purple-300">{user.email}</Text>
        </View>

        {/* Profile Information Card */}
        <View className="bg-[#1a1a2e] rounded-2xl p-6 mb-6 border border-purple-900/50">
          <Text className="text-xl font-bold text-center text-white mb-6">
            Profile Information
          </Text>

          <View className="space-y-4">
            <View className="flex-row justify-between items-center py-3 border-b border-purple-900/50">
              <View className="flex-row items-center">
                <Ionicons name="person-outline" size={20} color="#8b5cf6" />
                <Text className="text-gray-300 font-medium ml-2">Name</Text>
              </View>
              <Text className="text-white font-semibold">{user.name}</Text>
            </View>

            <View className="flex-row justify-between items-center py-3 border-b border-purple-900/50">
              <View className="flex-row items-center">
                <Ionicons name="mail-outline" size={20} color="#8b5cf6" />
                <Text className="text-gray-300 font-medium ml-2">Email</Text>
              </View>
              <Text className="text-white font-semibold">{user.email}</Text>
            </View>

            <View className="flex-row justify-between items-center py-3 border-b border-purple-900/50">
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={20} color="#8b5cf6" />
                <Text className="text-gray-300 font-medium ml-2">Date of Birth</Text>
              </View>
              <Text className="text-white font-semibold">
                {formatDate(user.date_of_birth)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-3 border-b border-purple-900/50">
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
              <View className={`px-3 py-1 rounded-full ${
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
        <View className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-4 mb-6">
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
          className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4 flex-row justify-center items-center mb-8"
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text className="text-red-400 font-semibold text-lg ml-2">Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}