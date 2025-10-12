import React, { useState, useRef, useEffect } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View, Animated, Dimensions } from 'react-native';
import { Transaction } from '../services/database';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Kaede } from 'react-native-textinput-effects';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  backendAvailable?: boolean;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, backendAvailable = true }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Animation refs for the 3 orbs
  const glowAnim1 = useRef(new Animated.Value(0)).current;
  const glowAnim2 = useRef(new Animated.Value(0)).current;
  const glowAnim3 = useRef(new Animated.Value(0)).current;

  const categories = {
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
    expense: ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Health', 'Other'],
  };

  // Generate random positions and movements for the orbs
  const orbConfigs = useRef([
    {
      x: [Math.random() * screenWidth * 0.8, Math.random() * screenWidth * 0.8, Math.random() * screenWidth * 0.8],
      y: [Math.random() * 300, Math.random() * 300, Math.random() * 300],
      size: 120,
      colors: ['rgba(147, 51, 234, 0.4)', 'rgba(147, 51, 234, 0.1)', 'transparent'] as const,
      duration: 4000,
      delay: 0
    },
    {
      x: [Math.random() * screenWidth * 0.8, Math.random() * screenWidth * 0.8, Math.random() * screenWidth * 0.8],
      y: [Math.random() * 300, Math.random() * 300, Math.random() * 300],
      size: 100,
      colors: ['rgba(6, 182, 212, 0.4)', 'rgba(6, 182, 212, 0.1)', 'transparent'] as const,
      duration: 5000,
      delay: 1000
    },
    {
      x: [Math.random() * screenWidth * 0.8, Math.random() * screenWidth * 0.8, Math.random() * screenWidth * 0.8],
      y: [Math.random() * 300, Math.random() * 300, Math.random() * 300],
      size: 140,
      colors: ['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.1)', 'transparent'] as const,
      duration: 6000,
      delay: 2000
    }
  ]).current;

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
    ];

    animations.forEach(animation => animation.start());

    return () => {
      animations.forEach(animation => animation.stop());
    };
  }, []);

  const handleSubmit = async () => {
    if (!amount || !description || !category) return Alert.alert('Error', 'Please fill all fields');
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return Alert.alert('Error', 'Please enter a valid amount');

    const transactionData: Omit<Transaction, 'id'> = {
      amount: parsedAmount,
      desc: description,
      type,
      category,
      date: new Date().toISOString(),
    };

    setLoading(true);
    try {
      await onSubmit(transactionData);
      setAmount('');
      setDescription('');
      setCategory('');
    } catch {
      Alert.alert('Error', 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const getAlertConfig = () => {
    if (isAuthenticated && backendAvailable) return {
      bg: 'bg-blue-500/20 border-blue-500/20',
      icon: 'cloud-done-outline',
      color: '#60a5fa',
      text: 'text-blue-300',
      message: 'Transactions will be saved locally and synchronized with cloud storage.',
    };
    if (isAuthenticated && !backendAvailable) return {
      bg: 'bg-yellow-500/20 border-yellow-500/20',
      icon: 'warning-outline',
      color: '#fbbf24',
      text: 'text-yellow-300',
      message: 'Cloud storage is unavailable. Transactions will be saved locally only.',
    };
    if (!isAuthenticated) return {
      bg: 'bg-orange-500/20 border-orange-500/20',
      icon: 'lock-closed-outline',
      color: '#fb923c',
      text: 'text-orange-300',
      message: 'Please login to sync with cloud storage. Transactions will be saved locally only.',
    };
    return null;
  };

  // Create animated orbs
  const renderAnimatedOrbs = () => {
    const orbs = [
      { anim: glowAnim1, config: orbConfigs[0] },
      { anim: glowAnim2, config: orbConfigs[1] },
      { anim: glowAnim3, config: orbConfigs[2] },
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

  const alertConfig = getAlertConfig();

  return (
    <View className="rounded-3xl overflow-hidden border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
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

      {/* Glass-like Form Content */}
      <BlurView intensity={40} tint="dark" style={{ borderRadius: 24 }}>
        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
          <Text className="text-2xl font-bold mb-6 text-white text-center tracking-wide">
            Add Transaction
          </Text>

          {alertConfig && (
            <View className={`border rounded-2xl p-4 mb-6 flex-row items-start backdrop-blur-lg ${alertConfig.bg}`}>
              <Ionicons name={alertConfig.icon as any} size={20} color={alertConfig.color} className="mt-0.5" />
              <Text className={`text-sm ml-3 flex-1 ${alertConfig.text}`}>{alertConfig.message}</Text>
            </View>
          )}

          {/* Type Selector */}
          <View className="flex-row mb-6 rounded-2xl overflow-hidden border border-purple-900/30 backdrop-blur-lg shadow-lg">
            <TouchableOpacity
              className={`flex-1 py-4 flex-row justify-center items-center ${
                type === 'expense' ? 'bg-red-500/20' : 'bg-[#0f0f23]/80'
              }`}
              onPress={() => setType('expense')}
            >
              <Ionicons name="arrow-down" size={20} color={type === 'expense' ? '#ef4444' : '#6b7280'} />
              <Text className={`ml-2 font-semibold text-base ${type === 'expense' ? 'text-red-400' : 'text-gray-500'}`}>
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-4 flex-row justify-center items-center ${
                type === 'income' ? 'bg-green-500/20' : 'bg-[#0f0f23]/80'
              }`}
              onPress={() => setType('income')}
            >
              <Ionicons name="arrow-up" size={20} color={type === 'income' ? '#10b981' : '#6b7280'} />
              <Text className={`ml-2 font-semibold text-base ${type === 'income' ? 'text-green-400' : 'text-gray-500'}`}>
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View className="mb-6 rounded-2xl overflow-hidden border border-purple-900/30 backdrop-blur-lg shadow-lg">
            <Kaede
              label={'Amount'}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              labelStyle={{ color: '#9ca3af', backgroundColor: 'transparent', fontWeight: '600', fontSize: 14 }}
              inputStyle={{ color: '#ffffff', backgroundColor: 'transparent', paddingVertical: 12 }}
              style={{ backgroundColor: 'transparent', height: 70 }}
            />
          </View>

          {/* Description Input */}
          <View className="mb-6 rounded-2xl overflow-hidden border border-purple-900/30 backdrop-blur-lg shadow-lg">
            <Kaede
              label={'Description'}
              value={description}
              onChangeText={setDescription}
              labelStyle={{ color: '#9ca3af', backgroundColor: 'transparent', fontWeight: '600', fontSize: 14 }}
              inputStyle={{ color: '#ffffff', backgroundColor: 'transparent', paddingVertical: 12 }}
              style={{ backgroundColor: 'transparent', height: 70 }}
            />
          </View>

          <Text className="font-semibold mb-4 text-white text-lg ml-1">Category</Text>
          <View className="flex-row flex-wrap mb-8">
            {categories[type].map((cat) => (
              <TouchableOpacity
                key={cat}
                className={`px-4 py-3 rounded-2xl m-1.5 border backdrop-blur-lg ${
                  category === cat
                    ? type === 'income'
                      ? 'bg-green-500/20 border-green-500/50'
                      : 'bg-red-500/20 border-red-500/50'
                    : 'bg-[#0f0f23]/80 border-purple-900/30'
                } shadow-lg`}
                onPress={() => setCategory(cat)}
              >
                <Text
                  className={`text-sm font-medium ${
                    category === cat
                      ? type === 'income'
                        ? 'text-green-400'
                        : 'text-red-400'
                      : 'text-gray-400'
                  }`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            className={`rounded-2xl p-4 border backdrop-blur-lg shadow-lg ${
              loading ? 'opacity-70' : ''
            } ${
              type === 'income' 
                ? 'bg-green-500/20 border-green-500/50' 
                : 'bg-purple-500/20 border-purple-500/50'
            }`}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text className="text-white text-center font-bold text-lg">
              {loading ? 'Adding Transaction...' : 'Add Transaction'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </BlurView>
    </View>
  );
};

export default TransactionForm;