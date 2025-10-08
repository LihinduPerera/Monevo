import React from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useTransactions } from '../../hooks/useTransaction';
import TransactionForm from '../../components/TransactionForm';
import TransactionList from '../../components/TransactionList';

const TransactionScreen: React.FC = () => {
  const { 
    transactions, 
    loading, 
    addTransaction, 
    deleteTransaction, 
    refreshTransactions,
    syncPendingTransactions,
    backendAvailable 
  } = useTransactions();

  const handleSync = async () => {
    await syncPendingTransactions();
  };

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
};

export default TransactionScreen;