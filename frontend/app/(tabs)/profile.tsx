import React, { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, isAuthenticated, appReady } = useAuth();

  useEffect(() => {
    if (appReady && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, appReady]);

  // Show loading while checking authentication
  if (!appReady) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-lg text-gray-600">Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-lg text-gray-600">Redirecting to login...</Text>
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
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <View className="bg-white rounded-2xl p-6 shadow-sm">
        <Text className="text-2xl font-bold text-center text-gray-800 mb-6">
          Profile Information
        </Text>

        <View className="space-y-4">
          <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
            <Text className="text-gray-600 font-medium">Name</Text>
            <Text className="text-gray-800 font-semibold">{user.name}</Text>
          </View>

          <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
            <Text className="text-gray-600 font-medium">Email</Text>
            <Text className="text-gray-800 font-semibold">{user.email}</Text>
          </View>

          <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
            <Text className="text-gray-600 font-medium">Date of Birth</Text>
            <Text className="text-gray-800 font-semibold">
              {formatDate(user.date_of_birth)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
            <Text className="text-gray-600 font-medium">Member Since</Text>
            <Text className="text-gray-800 font-semibold">
              {formatDate(user.created_at)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-3">
            <Text className="text-gray-600 font-medium">Account Status</Text>
            <View className={`px-3 py-1 rounded-full ${
              user.is_active ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Text className={`font-semibold ${
                user.is_active ? 'text-green-800' : 'text-red-800'
              }`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-8 p-4 bg-blue-50 rounded-lg">
          <Text className="text-blue-800 text-sm text-center">
            💡 Your data is securely stored and synchronized across all your devices.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}