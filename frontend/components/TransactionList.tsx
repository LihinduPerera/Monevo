import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Transaction } from '../services/database';
import { formatCurrency, formatDate } from '../utils/helpers';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

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
      <View className="bg-[#1a1a2e] rounded-2xl p-8 items-center border border-purple-900/50">
        <Ionicons name="receipt-outline" size={48} color="#8b5cf6" />
        <Text className="text-gray-300 text-lg mt-4">No transactions yet</Text>
        <Text className="text-gray-400 mt-2 text-center">Add your first transaction to get started</Text>
      </View>
    );
  }

  return (
    <ScrollView className="bg-[#1a1a2e] rounded-2xl border border-purple-900/50">
      {transactions.map((transaction) => (
        <View
          key={transaction.id}
          className="flex-row justify-between items-center p-4 border-b border-purple-900/30"
        >
          <View className="flex-1">
            <Text className="font-semibold text-white">
              {transaction.desc}
            </Text>
            <Text className="text-gray-400 text-sm">
              {transaction.category} • {formatDate(transaction.date)}
            </Text>
            {isAuthenticated && !!transaction.synced && (
              <View className="flex-row items-center mt-1">
                <Ionicons name="cloud-done" size={12} color="#10b981" />
                <Text className="text-green-400 text-xs ml-1">
                  Synced with cloud
                </Text>
              </View>
            )}
            {isAuthenticated && !transaction.synced && (
              <View className="flex-row items-center mt-1">
                <Ionicons name="cloud-offline" size={12} color="#f59e0b" />
                <Text className="text-yellow-400 text-xs ml-1">
                  Local only - Sync pending
                </Text>
              </View>
            )}
            {!isAuthenticated && (
              <View className="flex-row items-center mt-1">
                <Ionicons name="lock-closed" size={12} color="#f97316" />
                <Text className="text-orange-400 text-xs ml-1">
                  Login to sync
                </Text>
              </View>
            )}
          </View>
          
          <View className="items-end mr-3">
            <Text
              className={`font-bold text-lg ${
                transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => handleDelete(transaction)}
            className="p-2"
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

export default TransactionList;