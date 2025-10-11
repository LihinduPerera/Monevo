import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Link, router } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      Alert.alert('Success', 'Login successful!');
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="flex-1 min-h-screen p-6 justify-center">
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-3xl font-bold text-center text-gray-800 mb-2">
            Welcome Back
          </Text>
          <Text className="text-gray-600 text-center mb-8">
            Sign in to your account
          </Text>

          <View className="space-y-4">
            <View>
              <Text className="text-gray-700 font-medium mb-2">Email</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-4 bg-gray-50"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Password</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-4 bg-gray-50"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              className={`bg-blue-500 rounded-lg p-4 mt-4 ${
                loading ? 'opacity-50' : ''
              }`}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-4">
              <Text className="text-gray-600">Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text className="text-blue-500 font-semibold">Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}