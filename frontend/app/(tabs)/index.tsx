import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import SummaryCard from '../../components/SummaryCard';
import TransactionList from '../../components/TransactionList';
import { useTransactions } from '../../hooks/useTransaction';

const HomeScreen: React.FC = () => {
  const { transactions, loading, deleteTransaction, refreshTransactions } = useTransactions();

  const recentTransactions = transactions.slice(0, 10);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshTransactions} />
        }
      >
        <Text className="text-2xl font-bold mb-4 text-gray-800">Finance Dashboard</Text>
        
        <SummaryCard transactions={transactions} />
        
        <Text className="text-lg font-semibold mb-3 text-gray-800">Recent Transactions</Text>
        <TransactionList
          transactions={recentTransactions}
          onDelete={deleteTransaction}
        />
      </ScrollView>
    </View>
  );
};

export default HomeScreen;