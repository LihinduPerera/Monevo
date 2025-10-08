import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Transaction } from '../service/database';
import { formatCurrency, formatDate } from '../utils/helpers';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: number) => Promise<void>;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete }) => {
  const handleDelete = (transaction: Transaction) => {
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete "${transaction.desc}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(transaction.id!),
        },
      ]
    );
  };

  if (transactions.length === 0) {
    return (
      <View className="bg-white rounded-lg p-8 items-center">
        <Text className="text-gray-500 text-lg">No transactions yet</Text>
        <Text className="text-gray-400 mt-2">Add your first transaction to get started</Text>
      </View>
    );
  }

  return (
    <ScrollView className="bg-white rounded-lg">
      {transactions.map((transaction) => (
        <View
          key={transaction.id}
          className="flex-row justify-between items-center p-4 border-b border-gray-100"
        >
          <View className="flex-1">
            <Text className="font-semibold text-gray-800">
              {transaction.desc}
            </Text>
            <Text className="text-gray-500 text-sm">
              {transaction.category} • {formatDate(transaction.date)}
            </Text>
          </View>
          
          <View className="items-end">
            <Text
              className={`font-bold ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => handleDelete(transaction)}
            className="ml-3 p-2"
          >
            <Text className="text-red-500">Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

export default TransactionList;