import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import TransactionList from '@/components/TransactionList';
import { useTransactions } from '@/hooks/useTransaction';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import TransactionsChart from '@/components/TransactionsChart';
import GoalProgress from '@/components/GoalProgress';
import GoalForm from '@/components/GoalForm';
import { useGoals } from '@/hooks/useGoal';
import { Ionicons } from '@expo/vector-icons';
import { getTransactionsByMonth } from '@/services/database';
import * as Haptics from 'expo-haptics'; // Added expo-haptics import


export default function HomeScreen() {
  const { transactions, loading, deleteTransaction, refreshTransactions, performFullDataSync } = useTransactions();
  const { goals, addGoal, deleteGoal, refreshGoals } = useGoals();
  const { user, isAuthenticated, appReady } = useAuth();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthTransactions, setMonthTransactions] = useState<any[]>([]);

  const recentTransactions = transactions.slice(0, 10);

  useEffect(() => {
    if (appReady && !isAuthenticated) {
      router.replace('/landing');
    }
  }, [isAuthenticated, appReady]);

  useEffect(() => {
    loadMonthTransactions();
  }, [selectedMonth, selectedYear, transactions]);

  const loadMonthTransactions = async () => {
    try {
      const monthData = await getTransactionsByMonth(selectedMonth, selectedYear);
      setMonthTransactions(monthData);
    } catch (error) {
      console.error('Error loading month transactions:', error);
      setMonthTransactions([]);
    }
  };

  // Haptic feedback for delete transaction
  const handleDelete = async (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Medium impact for delete attempt
    
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) // Light impact on cancel
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); // Warning for delete
            deleteTransaction(id);
          },
        },
      ]
    );
  };

  // Haptic feedback for sync
  const handleSync = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Medium impact for sync
    await performFullDataSync(); // Updated to use full sync
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Success when sync completes
  };

  // Haptic feedback for adding goal
  const handleAddGoal = async (goalData: any) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Success when goal is added
    await addGoal(goalData);
    setShowGoalForm(false);
  };

  // Haptic feedback for month navigation
  const handlePreviousMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Light impact for navigation
    if (selectedMonth > 1) {
      setSelectedMonth(selectedMonth - 1);
    } else {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    }
  };

  const handleNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Light impact for navigation
    if (selectedMonth < 12) {
      setSelectedMonth(selectedMonth + 1);
    } else {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    }
  };

  // Haptic feedback for opening goal form
  const handleOpenGoalForm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Medium impact for opening form
    setShowGoalForm(true);
  };

  // Haptic feedback for closing goal form
  const handleCloseGoalForm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Light impact for closing form
    setShowGoalForm(false);
  };

  // Haptic feedback for refresh
  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Light impact for refresh
    refreshTransactions();
    refreshGoals();
  };

  // Haptic feedback for delete goal
  const handleDeleteGoal = (goalId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); // Heavy impact for destructive action
    deleteGoal(goalId);
  };

  const currentGoal = goals.find(
    goal => goal.target_month === selectedMonth && goal.target_year === selectedYear
  );

  const monthIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Show loading while checking authentication
  if (!appReady) {
    return (
      <View className="flex-1 bg-[#030014] justify-center items-center">
        <Text className="text-lg text-purple-200">Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-[#030014] justify-center items-center">
        <Text className="text-lg text-purple-200">Redirecting to login...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#030014]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={handleRefresh}
            tintColor="#8b5cf6"
            colors={['#8b5cf6']}
          />
        }
      >
        <Text className="text-2xl font-bold mb-2 text-white mt-14">
          Welcome back, {user?.name}!
        </Text>
        <Text className="text-purple-200 mb-4">Here's your financial overview</Text>
        
        {/* Month Selector */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-semibold text-white">
            {monthNames[selectedMonth - 1]} {selectedYear}
          </Text>
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={handlePreviousMonth}
              className="p-2"
            >
              <Ionicons name="chevron-back" size={24} color="#8b5cf6" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNextMonth}
              className="p-2"
            >
              <Ionicons name="chevron-forward" size={24} color="#8b5cf6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sync Button */}
        <TouchableOpacity
          onPress={handleSync}
          className="bg-purple-600 rounded-2xl p-4 mb-6 flex-row justify-center items-center border border-purple-500/50"
        >
          {/* <Ionicons name="cloud-sync-outline" size={24} color="#ffffff" /> */}
          <Text className="text-white text-center font-semibold text-lg ml-2">
            Sync All Data
          </Text>
        </TouchableOpacity>

        {/* Goal Section */}
        {currentGoal ? (
          <GoalProgress
            goal={currentGoal}
            currentIncome={monthIncome}
            currentExpenses={monthExpenses}
            onEditGoal={handleOpenGoalForm}
            onDeleteGoal={() => handleDeleteGoal(currentGoal.id!)}
          />
        ) : (
          <TouchableOpacity
            onPress={handleOpenGoalForm}
            className="bg-purple-500/20 border border-purple-500/50 rounded-2xl p-6 mb-6 items-center"
          >
            <Ionicons name="trophy-outline" size={32} color="#8b5cf6" />
            <Text className="text-white text-lg font-semibold mt-2">
              Set Monthly Goal
            </Text>
            <Text className="text-purple-300 text-center mt-1">
              Track your income target for {monthNames[selectedMonth - 1]}
            </Text>
          </TouchableOpacity>
        )}

        {/* Goal Form Modal */}
        {showGoalForm && (
          <View className="absolute inset-0 bg-black/70 z-50 justify-start pt-20 p-4">
            <GoalForm
              onSubmit={handleAddGoal}
              existingGoal={currentGoal}
              onCancel={handleCloseGoalForm}
            />
          </View>
        )}

        <TransactionsChart transactions={transactions} />
        
        <View className='mb-32'>
          <Text className="text-lg font-semibold mb-3 text-white">Recent Transactions</Text>
          <TransactionList
            transactions={recentTransactions}
            onDelete={handleDelete}
          />
        </View>
      </ScrollView>
    </View>
  );
}