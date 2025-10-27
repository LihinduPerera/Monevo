import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Goal } from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/utils/helpers';

interface GoalProgressProps {
  goal: Goal;
  currentIncome: number;
  currentExpenses: number;
  onEditGoal?: () => void;
  onDeleteGoal?: () => void;
}

const GoalProgress: React.FC<GoalProgressProps> = ({ 
  goal, 
  currentIncome, 
  currentExpenses, 
  onEditGoal, 
  onDeleteGoal 
}) => {
  const [progress, setProgress] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { isAuthenticated } = useAuth();

  const netIncome = currentIncome - currentExpenses;
  const progressPercentage = Math.min((netIncome / goal.target_amount) * 100, 100);
  
  // Check if the goal month has ended
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  
  const isMonthEnded = currentYear > goal.target_year || 
    (currentYear === goal.target_year && currentMonth > goal.target_month);
  
  // Goal is only achieved if the month has ended AND net income meets/exceeds target
  const isAchieved = isMonthEnded && netIncome >= goal.target_amount;
  const remainingAmount = Math.max(goal.target_amount - netIncome, 0);

  // Check if we're in the goal month (for progress display)
  const isCurrentMonth = currentYear === goal.target_year && currentMonth === goal.target_month;

  useEffect(() => {
    // Progress animation
    Animated.timing(progressAnim, {
      toValue: progressPercentage,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    // Pulse animation for achieved goals
    if (isAchieved) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [progressPercentage, isAchieved]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDeleteGoal,
        },
      ]
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getStatusMessage = () => {
    if (isAchieved) {
      return `You exceeded your goal by ${formatCurrency(netIncome - goal.target_amount)}!`;
    } else if (isMonthEnded) {
      return `You didn't reach your goal. You needed ${formatCurrency(remainingAmount)} more.`;
    } else if (isCurrentMonth) {
      return `${formatCurrency(remainingAmount)} more to reach your goal this month`;
    } else {
      return `Goal for ${monthNames[goal.target_month - 1]} ${goal.target_year} - ${formatCurrency(remainingAmount)} remaining`;
    }
  };

  const getStatusTitle = () => {
    if (isAchieved) {
      return '🎉 Goal Achieved!';
    } else if (isMonthEnded) {
      return 'Goal Not Met';
    } else if (isCurrentMonth) {
      return 'Keep Going!';
    } else {
      return 'Upcoming Goal';
    }
  };

  const getStatusColor = () => {
    if (isAchieved) {
      return { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' };
    } else if (isMonthEnded) {
      return { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-400' };
    } else {
      return { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400' };
    }
  };

  const getStatusIcon = () => {
    if (isAchieved) {
      return { name: 'trophy' as const, color: '#10b981' };
    } else if (isMonthEnded) {
      return { name: 'alert-circle' as const, color: '#ef4444' };
    } else {
      return { name: 'trending-up' as const, color: '#8b5cf6' };
    }
  };

  const statusColors = getStatusColor();
  const statusIcon = getStatusIcon();

  return (
    <View className="mb-6 overflow-hidden rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
      <LinearGradient
        colors={['#0a0a1a', '#1a1a2e', '#16213e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-3xl"
      >
        <BlurView intensity={40} style={{ borderRadius: 24 }}>
          <View className="p-6">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-xl font-bold text-white">
                  {monthNames[goal.target_month - 1]} {goal.target_year} Goal
                </Text>
                <Text className="text-gray-400 text-sm">
                  Target: {formatCurrency(goal.target_amount)}
                </Text>
                {!isMonthEnded && isCurrentMonth && (
                  <Text className="text-cyan-400 text-xs mt-1">
                    Current month • Ends in {new Date(currentYear, currentMonth, 0).getDate() - currentDate.getDate()} days
                  </Text>
                )}
                {!isMonthEnded && !isCurrentMonth && (
                  <Text className="text-yellow-400 text-xs mt-1">
                    Upcoming goal
                  </Text>
                )}
                {isMonthEnded && (
                  <Text className="text-gray-400 text-xs mt-1">
                    Month completed
                  </Text>
                )}
              </View>
              
              <View className="flex-row space-x-2">
                <TouchableOpacity onPress={onEditGoal} className="p-2">
                  <Ionicons name="create-outline" size={20} color="#8b5cf6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} className="p-2">
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Progress Bar */}
            <View className="mb-4">
              <View className="h-4 bg-gray-700 rounded-full overflow-hidden">
                <Animated.View
                  style={{
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: isAchieved ? '#10b981' : 
                                    isMonthEnded ? '#ef4444' : '#8b5cf6',
                  }}
                  className="h-full rounded-full"
                />
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-gray-400 text-sm">
                  {progressPercentage.toFixed(1)}%
                </Text>
                <Text className="text-gray-400 text-sm">
                  {formatCurrency(netIncome)} / {formatCurrency(goal.target_amount)}
                </Text>
              </View>
            </View>

            {/* Status */}
            <Animated.View 
              style={{ transform: [{ scale: isAchieved ? pulseAnim : 1 }] }}
              className={`rounded-2xl p-4 border ${statusColors.bg} ${statusColors.border}`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className={`text-lg font-bold ${statusColors.text}`}>
                    {getStatusTitle()}
                  </Text>
                  <Text className="text-gray-300 text-sm mt-1">
                    {getStatusMessage()}
                  </Text>
                </View>
                <Ionicons 
                  name={statusIcon.name} 
                  size={32} 
                  color={statusIcon.color} 
                />
              </View>
            </Animated.View>

            {/* Breakdown */}
            <View className="mt-4 flex-row justify-between">
              <View className="items-center">
                <Text className="text-emerald-400 text-lg font-bold">
                  {formatCurrency(currentIncome)}
                </Text>
                <Text className="text-gray-400 text-xs">Income</Text>
              </View>
              <View className="items-center">
                <Text className="text-rose-400 text-lg font-bold">
                  {formatCurrency(currentExpenses)}
                </Text>
                <Text className="text-gray-400 text-xs">Expenses</Text>
              </View>
              <View className="items-center">
                <Text className={`text-lg font-bold ${
                  netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatCurrency(netIncome)}
                </Text>
                <Text className="text-gray-400 text-xs">Net</Text>
              </View>
            </View>

            {/* Sync Status */}
            {isAuthenticated && !!goal.synced && (
              <View className="flex-row items-center mt-3 justify-center">
                <Ionicons name="cloud-done" size={16} color="#10b981" />
                <Text className="text-green-400 text-sm ml-2">
                  Synced with cloud
                </Text>
              </View>
            )}
            {isAuthenticated && !goal.synced && (
              <View className="flex-row items-center mt-3 justify-center">
                <Ionicons name="cloud-offline" size={16} color="#f59e0b" />
                <Text className="text-yellow-400 text-sm ml-2">
                  Local only - Sync pending
                </Text>
              </View>
            )}
          </View>
        </BlurView>
      </LinearGradient>
    </View>
  );
};

export default GoalProgress;