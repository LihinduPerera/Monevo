import React, { useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import SummaryCard from '@/components/SummaryCard';
import TransactionList from '@/components/TransactionList';
import { useTransactions } from '@/hooks/useTransaction';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import TransactionsChart from '@/components/TransactionsChart';

export default function HomeScreen() {
  const { transactions, loading, deleteTransaction, refreshTransactions, syncPendingTransactions } = useTransactions();
  const { user, isAuthenticated, appReady } = useAuth();

  const recentTransactions = transactions.slice(0, 10);

  useEffect(() => {
    // Only navigate when app is ready and user is not authenticated
    if (appReady && !isAuthenticated) {
      router.replace('/landing');
    }
  }, [isAuthenticated, appReady]);

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
  };

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
        
        <SummaryCard transactions={transactions} />

        <TransactionsChart transactions={transactions} />
        
        <Text className="text-lg font-semibold mb-3 text-white">Recent Transactions</Text>
        <TransactionList
          transactions={recentTransactions}
          onDelete={handleDelete}
        />
      </ScrollView>
    </View>
  );
}