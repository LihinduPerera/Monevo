import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface SignInFormProps {
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export default function SignInForm({ onClose, onSwitchToRegister }: SignInFormProps) {
  const [idOrEmail, setIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!idOrEmail || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await login(idOrEmail, password);
      // Alert.alert('Success', 'Login successful!');
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="my-4">
      <Text className="text-black font-medium mb-2">ID or Email</Text>
      <View className="mb-4">
        <TextInput
          className="border border-gray-400 rounded-[25px] p-4 bg-gray-50"
          placeholder="Enter ID or Email"
          value={idOrEmail}
          onChangeText={setIdOrEmail}
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
      </View>

      <TouchableOpacity
        className={`min-h-14 rounded-[25px] flex-row items-center justify-center gap-2 ${
          loading ? 'bg-blue-400 opacity-50' : 'bg-blue-500'
        }`}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Text className="text-white text-base font-semibold">Sign In</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}