import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Transaction } from '../services/database';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Kaede } from 'react-native-textinput-effects';

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
    if (!amount || !description || !category) return Alert.alert('Error', 'Please fill all fields');
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return Alert.alert('Error', 'Please enter a valid amount');

    const transactionData: Omit<Transaction, 'id'> = {
      amount: parsedAmount,
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
    } catch {
      Alert.alert('Error', 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const getAlertConfig = () => {
    if (isAuthenticated && backendAvailable) return {
      bg: 'bg-blue-500/20 border-blue-500/30',
      icon: 'cloud-done-outline',
      color: '#60a5fa',
      text: 'text-blue-300',
      message: 'Transactions will be saved locally and synchronized with cloud storage.',
    };
    if (isAuthenticated && !backendAvailable) return {
      bg: 'bg-yellow-500/20 border-yellow-500/30',
      icon: 'warning-outline',
      color: '#fbbf24',
      text: 'text-yellow-300',
      message: 'Cloud storage is unavailable. Transactions will be saved locally only.',
    };
    if (!isAuthenticated) return {
      bg: 'bg-orange-500/20 border-orange-500/30',
      icon: 'lock-closed-outline',
      color: '#fb923c',
      text: 'text-orange-300',
      message: 'Please login to sync with cloud storage. Transactions will be saved locally only.',
    };
    return null;
  };

  const alertConfig = getAlertConfig();

  return (
    <ScrollView className="bg-[#1a1a2e] rounded-2xl p-5 border border-purple-900/30 shadow-lg">
      <Text className="text-xl font-bold mb-4 text-white tracking-wide">Add Transaction</Text>

      {alertConfig && (
        <View className={`border rounded-xl p-3 mb-4 flex-row items-start ${alertConfig.bg}`}>
          {/* <Ionicons name={alertConfig.icon} size={18} color={alertConfig.color} className="mt-0.5" /> */}
          <Text className={`text-sm ml-2 flex-1 ${alertConfig.text}`}>{alertConfig.message}</Text>
        </View>
      )}

      {/* Type Selector */}
      <View className="flex-row mb-5 rounded-full overflow-hidden border border-purple-900/30 shadow-sm">
        <TouchableOpacity
          className={`flex-1 py-3 flex-row justify-center items-center ${
            type === 'expense' ? 'bg-red-500/10' : 'bg-[#0f0f23]'
          }`}
          onPress={() => setType('expense')}
        >
          <Ionicons name="arrow-down" size={18} color={type === 'expense' ? '#ef4444' : '#6b7280'} />
          <Text className={`ml-1.5 font-medium text-sm ${type === 'expense' ? 'text-red-400' : 'text-gray-500'}`}>
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 flex-row justify-center items-center ${
            type === 'income' ? 'bg-green-500/10' : 'bg-[#0f0f23]'
          }`}
          onPress={() => setType('income')}
        >
          <Ionicons name="arrow-up" size={18} color={type === 'income' ? '#10b981' : '#6b7280'} />
          <Text className={`ml-1.5 font-medium text-sm ${type === 'income' ? 'text-green-400' : 'text-gray-500'}`}>
            Income
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount Input */}
      <View className="mb-5 rounded-full overflow-hidden border border-purple-900/30 shadow-sm">
        <Kaede
          label={'Amount'}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          labelStyle={{ color: '#9ca3af', backgroundColor: '#0f0f23', fontWeight: '500', fontSize: 14 }}
          inputStyle={{ color: '#ffffff', backgroundColor: '#0f0f23', paddingVertical: 8 }}
          style={{ backgroundColor: '#0f0f23', height: 60 }}
        />
      </View>

      {/* Description Input */}
      <View className="mb-5 rounded-full overflow-hidden border border-purple-900/30 shadow-sm">
        <Kaede
          label={'Description'}
          value={description}
          onChangeText={setDescription}
          labelStyle={{ color: '#9ca3af', backgroundColor: '#0f0f23', fontWeight: '500', fontSize: 14 }}
          inputStyle={{ color: '#ffffff', backgroundColor: '#0f0f23', paddingVertical: 8 }}
          style={{ backgroundColor: '#0f0f23', height: 60 }}
        />
      </View>

      <Text className="font-semibold mb-2.5 text-white text-base">Category</Text>
      <View className="flex-row flex-wrap mb-5">
        {categories[type].map((cat) => (
          <TouchableOpacity
            key={cat}
            className={`px-3 py-2 rounded-full m-1 border ${
              category === cat
                ? type === 'income'
                  ? 'bg-green-500/10 border-green-500/50'
                  : 'bg-red-500/10 border-red-500/50'
                : 'bg-[#0f0f23] border-purple-900/30'
            } shadow-sm`}
            onPress={() => setCategory(cat)}
          >
            <Text
              className={`text-sm ${
                category === cat
                  ? type === 'income'
                    ? 'text-green-400 font-medium'
                    : 'text-red-400 font-medium'
                  : 'text-gray-400'
              }`}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        className={`bg-purple-600 rounded-full p-3.5 border border-purple-500/50 shadow-md ${
          loading ? 'opacity-70' : ''
        }`}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text className="text-white text-center font-semibold text-base">
          {loading ? 'Adding...' : 'Add Transaction'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default TransactionForm;