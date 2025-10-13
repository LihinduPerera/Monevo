import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import SummaryCard from '@/components/SummaryCard';
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
import { formatCurrency } from '@/utils/helpers';

export default function HomeScreen() {
  const { transactions, loading, deleteTransaction, refreshTransactions, syncPendingTransactions } = useTransactions();
  const { goals, addGoal, deleteGoal, refreshGoals, syncPendingGoals } = useGoals();
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

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTransaction(id),
        },
      ]
    );
  };

  const handleSync = async () => {
    await syncPendingTransactions();
    await syncPendingGoals();
  };

  const handleAddGoal = async (goalData: any) => {
    await addGoal(goalData);
    setShowGoalForm(false);
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
            onRefresh={refreshTransactions}
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
              onPress={() => {
                if (selectedMonth > 1) {
                  setSelectedMonth(selectedMonth - 1);
                } else {
                  setSelectedMonth(12);
                  setSelectedYear(selectedYear - 1);
                }
              }}
              className="p-2"
            >
              <Ionicons name="chevron-back" size={24} color="#8b5cf6" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (selectedMonth < 12) {
                  setSelectedMonth(selectedMonth + 1);
                } else {
                  setSelectedMonth(1);
                  setSelectedYear(selectedYear + 1);
                }
              }}
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
          <Ionicons name="cloud-upload-outline" size={24} color="#ffffff" />
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
            onEditGoal={() => setShowGoalForm(true)}
            onDeleteGoal={() => deleteGoal(currentGoal.id!)}
          />
        ) : (
          <TouchableOpacity
            onPress={() => setShowGoalForm(true)}
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
          <View className="absolute inset-0 bg-black/70 z-50 justify-center p-4">
            <GoalForm
              onSubmit={handleAddGoal}
              existingGoal={currentGoal}
              onCancel={() => setShowGoalForm(false)}
            />
          </View>
        )}

        {/* Monthly Summary */}
        <View className="bg-[#1a1a2e] rounded-2xl p-4 mb-6 border border-purple-900/50">
          <Text className="text-lg font-semibold mb-3 text-white text-center">
            {monthNames[selectedMonth - 1]} Summary
          </Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-emerald-400 text-xl font-bold">{formatCurrency(monthIncome)}</Text>
              <Text className="text-gray-400 text-sm">Income</Text>
            </View>
            <View className="items-center">
              <Text className="text-rose-400 text-xl font-bold">{formatCurrency(monthExpenses)}</Text>
              <Text className="text-gray-400 text-sm">Expenses</Text>
            </View>
            <View className="items-center">
              <Text className={`text-xl font-bold ${
                monthIncome - monthExpenses >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {formatCurrency(monthIncome - monthExpenses)}
              </Text>
              <Text className="text-gray-400 text-sm">Net</Text>
            </View>
          </View>
        </View>

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