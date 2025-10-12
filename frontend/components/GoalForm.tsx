import React, { useState, useRef, useEffect } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View, Animated, Dimensions } from 'react-native';
import { Goal } from '../services/database';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Kaede } from 'react-native-textinput-effects';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface GoalFormProps {
  onSubmit: (goal: Omit<Goal, 'id'>) => Promise<void>;
  backendAvailable?: boolean;
  existingGoal?: Goal | null;
  onCancel?: () => void;
}

const GoalForm: React.FC<GoalFormProps> = ({ 
  onSubmit, 
  backendAvailable = true, 
  existingGoal,
  onCancel 
}) => {
  const [targetAmount, setTargetAmount] = useState(existingGoal?.target_amount.toString() || '');
  const [targetMonth, setTargetMonth] = useState(existingGoal?.target_month.toString() || '');
  const [targetYear, setTargetYear] = useState(existingGoal?.target_year.toString() || '');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Animation refs
  const glowAnim1 = useRef(new Animated.Value(0)).current;
  const glowAnim2 = useRef(new Animated.Value(0)).current;
  const glowAnim3 = useRef(new Animated.Value(0)).current;

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

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleSubmit = async () => {
    if (!targetAmount || !targetMonth || !targetYear) {
      return Alert.alert('Error', 'Please fill all fields');
    }

    const parsedAmount = parseFloat(targetAmount);
    const parsedMonth = parseInt(targetMonth);
    const parsedYear = parseInt(targetYear);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return Alert.alert('Error', 'Please enter a valid target amount');
    }

    if (parsedMonth < 1 || parsedMonth > 12) {
      return Alert.alert('Error', 'Please enter a valid month (1-12)');
    }

    if (parsedYear < currentYear || parsedYear > currentYear + 5) {
      return Alert.alert('Error', 'Please enter a valid year');
    }

    const goalData: Omit<Goal, 'id'> = {
      target_amount: parsedAmount,
      target_month: parsedMonth,
      target_year: parsedYear,
    };

    setLoading(true);
    try {
      await onSubmit(goalData);
      setTargetAmount('');
      setTargetMonth('');
      setTargetYear('');
      if (onCancel) onCancel();
    } catch {
      Alert.alert('Error', 'Failed to save goal');
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
      message: 'Goals will be saved locally and synchronized with cloud storage.',
    };
    if (isAuthenticated && !backendAvailable) return {
      bg: 'bg-yellow-500/20 border-yellow-500/20',
      icon: 'warning-outline',
      color: '#fbbf24',
      text: 'text-yellow-300',
      message: 'Cloud storage is unavailable. Goals will be saved locally only.',
    };
    if (!isAuthenticated) return {
      bg: 'bg-orange-500/20 border-orange-500/20',
      icon: 'lock-closed-outline',
      color: '#fb923c',
      text: 'text-orange-300',
      message: 'Please login to sync with cloud storage. Goals will be saved locally only.',
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
            {existingGoal ? 'Edit Goal' : 'Set Monthly Goal'}
          </Text>

          {alertConfig && (
            <View className={`border rounded-2xl p-4 mb-6 flex-row items-start backdrop-blur-lg ${alertConfig.bg}`}>
              <Ionicons name={alertConfig.icon as any} size={20} color={alertConfig.color} className="mt-0.5" />
              <Text className={`text-sm ml-3 flex-1 ${alertConfig.text}`}>{alertConfig.message}</Text>
            </View>
          )}

          {/* Target Amount Input */}
          <View className="mb-6 rounded-2xl overflow-hidden border border-purple-900/30 backdrop-blur-lg shadow-lg">
            <Kaede
              label={'Target Amount'}
              value={targetAmount}
              onChangeText={setTargetAmount}
              keyboardType="numeric"
              labelStyle={{ color: '#9ca3af', backgroundColor: 'transparent', fontWeight: '600', fontSize: 14 }}
              inputStyle={{ color: '#ffffff', backgroundColor: 'transparent', paddingVertical: 12 }}
              style={{ backgroundColor: 'transparent', height: 70 }}
            />
          </View>

          {/* Month Selection */}
          <View className="mb-6">
            <Text className="font-semibold mb-3 text-white text-lg ml-1">Target Month</Text>
            <View className="flex-row flex-wrap">
              {months.map((month, index) => (
                <TouchableOpacity
                  key={month}
                  className={`px-3 py-3 rounded-2xl m-1 border backdrop-blur-lg ${
                    targetMonth === (index + 1).toString()
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : 'bg-[#0f0f23]/80 border-purple-900/30'
                  } shadow-lg`}
                  onPress={() => setTargetMonth((index + 1).toString())}
                >
                  <Text
                    className={`text-sm font-medium ${
                      targetMonth === (index + 1).toString() ? 'text-purple-400' : 'text-gray-400'
                    }`}
                  >
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Year Selection */}
          <View className="mb-8">
            <Text className="font-semibold mb-3 text-white text-lg ml-1">Target Year</Text>
            <View className="flex-row flex-wrap">
              {[currentYear, currentYear + 1, currentYear + 2].map((year) => (
                <TouchableOpacity
                  key={year}
                  className={`px-4 py-3 rounded-2xl m-1 border backdrop-blur-lg ${
                    targetYear === year.toString()
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : 'bg-[#0f0f23]/80 border-purple-900/30'
                  } shadow-lg`}
                  onPress={() => setTargetYear(year.toString())}
                >
                  <Text
                    className={`text-sm font-medium ${
                      targetYear === year.toString() ? 'text-purple-400' : 'text-gray-400'
                    }`}
                  >
                    {year}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-4">
            {onCancel && (
              <TouchableOpacity
                className="flex-1 rounded-2xl p-4 border border-gray-500/50 backdrop-blur-lg shadow-lg"
                onPress={onCancel}
              >
                <Text className="text-gray-300 text-center font-bold text-lg">
                  Cancel
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className={`flex-1 rounded-2xl p-4 border backdrop-blur-lg shadow-lg ${
                loading ? 'opacity-70' : ''
              } bg-purple-500/20 border-purple-500/50`}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text className="text-white text-center font-bold text-lg">
                {loading ? 'Saving...' : (existingGoal ? 'Update Goal' : 'Set Goal')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </BlurView>
    </View>
  );
};

export default GoalForm;