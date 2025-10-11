import React, { useEffect } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useTransactions } from '@/hooks/useTransaction';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function TransactionScreen() {
  const { 
    transactions, 
    loading, 
    addTransaction, 
    deleteTransaction, 
    refreshTransactions,
    syncPendingTransactions,
    backendAvailable 
  } = useTransactions();
  
  const { isAuthenticated, appReady } = useAuth();

  useEffect(() => {
    if (appReady && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, appReady]);

  const handleSync = async () => {
    await syncPendingTransactions();
  };

  // Show loading while checking authentication
  if (!appReady) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-lg text-gray-600">Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-lg text-gray-600">Redirecting to login...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshTransactions} />
        }
      >
        {/* Sync Button */}
        <TouchableOpacity
          onPress={handleSync}
          className="bg-green-500 rounded-lg p-4 mb-4"
        >
          <Text className="text-white text-center font-semibold text-lg">
            🔄 Sync Pending Transactions
          </Text>
        </TouchableOpacity>

        <TransactionForm 
          onSubmit={addTransaction} 
          backendAvailable={backendAvailable} 
        />
        
        <View className="mt-6">
          <Text className="text-lg font-semibold mb-3 text-gray-800">All Transactions</Text>
          <TransactionList
            transactions={transactions}
            onDelete={deleteTransaction}
          />
        </View>
      </ScrollView>
    </View>
  );
}