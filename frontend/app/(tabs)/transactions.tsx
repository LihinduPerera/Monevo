import React from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useTransactions } from '../../hooks/useTransaction';
import TransactionForm from '../../components/TransactionForm';
import TransactionList from '../../components/TransactionList';

const TransactionScreen: React.FC = () => {
  const { transactions, loading, addTransaction, deleteTransaction, refreshTransactions } = useTransactions();

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshTransactions} />
        }
      >
        <TransactionForm onSubmit={addTransaction} />
        
        <View className="mt-6">
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