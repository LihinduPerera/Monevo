import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Link, router } from 'expo-router';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password || !dateOfBirth) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, dateOfBirth);
      Alert.alert('Success', 'Registration successful! Please login.');
      router.replace('/(auth)/login');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="flex-1 min-h-screen p-6 justify-center">
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-3xl font-bold text-center text-gray-800 mb-2">
            Create Account
          </Text>
          <Text className="text-gray-600 text-center mb-8">
            Sign up to get started
          </Text>

          <View className="space-y-4">
            <View>
              <Text className="text-gray-700 font-medium mb-2">Full Name</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-4 bg-gray-50"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
              />
            </View>

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
              <Text className="text-gray-500 text-xs mt-1">
                Must be at least 6 characters long
              </Text>
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Date of Birth</Text>
              <TextInput
                className="border border-gray-300 rounded-lg p-4 bg-gray-50"
                placeholder="YYYY-MM-DD"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
              />
              <Text className="text-gray-500 text-xs mt-1">
                Format: YYYY-MM-DD
              </Text>
            </View>

            <TouchableOpacity
              className={`bg-green-500 rounded-lg p-4 mt-4 ${
                loading ? 'opacity-50' : ''
              }`}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-4">
              <Text className="text-gray-600">Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-blue-500 font-semibold">Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}