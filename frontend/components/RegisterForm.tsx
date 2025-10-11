import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface RegisterFormProps {
  onClose: () => void;
  onSwitchToSignIn: () => void;
}

export default function RegisterForm({ onClose, onSwitchToSignIn }: RegisterFormProps) {
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

    // Simple date validation
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(dateOfBirth)) {
      Alert.alert('Error', 'Please enter date in YYYY-MM-DD format');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, dateOfBirth);
      Alert.alert('Success', 'Registration successful! Please login.');
      onSwitchToSignIn(); // Switch to sign in form after successful registration
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="my-4">
      <Text className="text-black font-medium mb-2">Full Name</Text>
      <View className="mb-4">
        <TextInput
          className="border border-gray-400 rounded-[25px] p-4 bg-gray-50"
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      </View>

      <Text className="text-black font-medium mb-2">Email</Text>
      <View className="mb-4">
        <TextInput
          className="border border-gray-400 rounded-[25px] p-4 bg-gray-50"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <Text className="text-black font-medium mb-2">Password</Text>
      <View className="mb-4">
        <TextInput
          className="border border-gray-400 rounded-[25px] p-4 bg-gray-50"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Text className="text-gray-500 text-xs mt-1 ml-2">
          Must be at least 6 characters long
        </Text>
      </View>

      <Text className="text-black font-medium mb-2">Date of Birth</Text>
      <View className="mb-6">
        <TextInput
          className="border border-gray-400 rounded-[25px] p-4 bg-gray-50"
          placeholder="YYYY-MM-DD"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
        />
        <Text className="text-gray-500 text-xs mt-1 ml-2">
          Format: YYYY-MM-DD
        </Text>
      </View>

      <TouchableOpacity
        className={`min-h-14 rounded-[25px] flex-row items-center justify-center gap-2 ${
          loading ? 'bg-green-400 opacity-50' : 'bg-green-500'
        }`}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Text className="text-white text-base font-semibold">Create Account</Text>
            <Ionicons name="person-add" size={20} color="white" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}