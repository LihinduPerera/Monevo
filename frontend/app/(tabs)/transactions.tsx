import React, { useEffect } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useTransactions } from '@/hooks/useTransaction';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import CustomHeader from '@/components/CustomHeader';
import * as Haptics from 'expo-haptics'; // Added expo-haptics import

export default function TransactionScreen() {
  const { 
    transactions, 
    loading, 
    addTransaction, 
    deleteTransaction, 
    refreshTransactions,
    performFullDataSync, // Updated to use full sync
    backendAvailable 
  } = useTransactions();
  
  const { isAuthenticated, appReady } = useAuth();

  useEffect(() => {
    if (appReady && !isAuthenticated) {
      router.replace('/landing');
    }
  }, [isAuthenticated, appReady]);

  // Haptic feedback for sync
  const handleSync = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Medium impact for sync
    await performFullDataSync(); // Updated to use full sync
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Success when sync completes
  };

  // Haptic feedback for refresh
  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // Light impact for refresh
    refreshTransactions();
  };

  // Haptic feedback for delete transaction
  const handleDeleteTransaction = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Medium impact for delete
    deleteTransaction(id);
  };

  // Haptic feedback for add transaction (passed to TransactionForm)
  const handleAddTransaction = async (transaction: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Medium impact before adding
    try {
      await addTransaction(transaction);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Success when added
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // Error if failed
      throw error; // Re-throw to let TransactionForm handle the error
    }
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
      <CustomHeader title="Transactions" />
      
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
        {/* Sync Button */}
        <TouchableOpacity
          onPress={handleSync}
          className="rounded-2xl mt-32 p-4 mb-6 flex-row justify-center items-center border bg-purple-500/20 border-purple-500/50"
        >
          {/* <Ionicons name="cloud-sync-outline" size={24} color="#ffffff" /> */}
          <Text className="text-white text-center font-semibold text-lg ml-2">
            Sync All Data
          </Text>
        </TouchableOpacity>

        <TransactionForm 
          onSubmit={handleAddTransaction}
          backendAvailable={backendAvailable} 
        />
        
        <View className="mt-6 mb-32">
          <Text className="text-xl font-bold mb-4 text-white">All Transactions</Text>
          <TransactionList
            transactions={transactions}
            onDelete={deleteTransaction}
          />
        </View>
      </ScrollView>
    </View>
  );
}