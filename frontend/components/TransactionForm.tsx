import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Transaction } from '../services/database';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  backendAvailable?: boolean;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, backendAvailable = true }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const categories = {
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
    expense: ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Health', 'Other'],
  };

  const handleSubmit = async () => {
    if (!amount || !description || !category) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const transactionData: Omit<Transaction, 'id'> = {
      amount: parseFloat(amount),
      desc: description,
      type,
      category,
      date: new Date().toISOString(),
    };

    setLoading(true);
    try {
      await onSubmit(transactionData);
      setAmount('');
      setDescription('');
      setCategory('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="bg-[#1a1a2e] rounded-2xl p-6 border border-purple-900/50">
      <Text className="text-xl font-bold mb-4 text-white">Add New Transaction</Text>

      {isAuthenticated && backendAvailable && (
        <View className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-4 flex-row items-start">
          <Ionicons name="cloud-done-outline" size={20} color="#60a5fa" className="mt-0.5" />
          <Text className="text-blue-300 text-sm ml-2 flex-1">
            Transactions will be saved locally and synchronized with cloud storage.
          </Text>
        </View>
      )}

      {isAuthenticated && !backendAvailable && (
        <View className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-4 flex-row items-start">
          <Ionicons name="warning-outline" size={20} color="#fbbf24" className="mt-0.5" />
          <Text className="text-yellow-300 text-sm ml-2 flex-1">
            Cloud storage is unavailable. Transactions will be saved locally only.
          </Text>
        </View>
      )}

      {!isAuthenticated && (
        <View className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4 mb-4 flex-row items-start">
          <Ionicons name="lock-closed-outline" size={20} color="#fb923c" className="mt-0.5" />
          <Text className="text-orange-300 text-sm ml-2 flex-1">
            Please login to sync with cloud storage. Transactions will be saved locally only.
          </Text>
        </View>
      )}

      {/* Type Selector */}
      <View className="flex-row mb-6 rounded-2xl overflow-hidden border border-purple-900/50">
        <TouchableOpacity
          className={`flex-1 py-4 flex-row justify-center items-center ${
            type === 'expense' ? 'bg-red-500/20 border-r border-purple-900/50' : 'bg-[#0f0f23]'
          }`}
          onPress={() => setType('expense')}
        >
          <Ionicons 
            name="arrow-down" 
            size={20} 
            color={type === 'expense' ? '#ef4444' : '#6b7280'} 
          />
          <Text className={`ml-2 font-semibold ${
            type === 'expense' ? 'text-red-400' : 'text-gray-500'
          }`}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-4 flex-row justify-center items-center ${
            type === 'income' ? 'bg-green-500/20' : 'bg-[#0f0f23]'
          }`}
          onPress={() => setType('income')}
        >
          <Ionicons 
            name="arrow-up" 
            size={20} 
            color={type === 'income' ? '#10b981' : '#6b7280'} 
          />
          <Text className={`ml-2 font-semibold ${
            type === 'income' ? 'text-green-400' : 'text-gray-500'
          }`}>Income</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        className="bg-[#0f0f23] border border-purple-900/50 rounded-2xl p-4 mb-4 text-white placeholder-gray-400"
        placeholder="Amount"
        placeholderTextColor="#9ca3af"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <TextInput
        className="bg-[#0f0f23] border border-purple-900/50 rounded-2xl p-4 mb-6 text-white placeholder-gray-400"
        placeholder="Description"
        placeholderTextColor="#9ca3af"
        value={description}
        onChangeText={setDescription}
      />

      <Text className="font-semibold mb-3 text-white text-lg">Category</Text>
      <View className="flex-row flex-wrap mb-6">
        {categories[type].map((cat) => (
          <TouchableOpacity
            key={cat}
            className={`px-4 py-3 rounded-2xl m-1 border ${
              category === cat 
                ? type === 'income' 
                  ? 'bg-green-500/20 border-green-500' 
                  : 'bg-red-500/20 border-red-500'
                : 'bg-[#0f0f23] border-purple-900/50'
            }`}
            onPress={() => setCategory(cat)}
          >
            <Text className={category === cat 
              ? type === 'income' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'
              : 'text-gray-400'
            }>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        className={`bg-purple-600 rounded-2xl p-4 border border-purple-500 ${
          loading ? 'opacity-50' : ''
        }`}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text className="text-white text-center font-semibold text-lg">
          {loading ? 'Adding...' : 'Add Transaction'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default TransactionForm;