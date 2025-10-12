import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Transaction } from '../services/database';
import { formatCurrency, formatDate } from '../utils/helpers';
import { useAuth } from '@/contexts/AuthContext';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: number) => Promise<void>;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete }) => {
  const { isAuthenticated } = useAuth();

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
            {isAuthenticated && !!transaction.synced && (
              <Text className="text-green-500 text-xs mt-1">
                ✓ Synced with cloud
              </Text>
            )}
            {isAuthenticated && !transaction.synced && (
              <Text className="text-yellow-500 text-xs mt-1">
                ⚠ Local only - Sync pending
              </Text>
            )}
            {!isAuthenticated && (
              <Text className="text-orange-500 text-xs mt-1">
                🔐 Login to sync
              </Text>
            )}
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