import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Transaction } from '../services/database';

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
      // Success alert is now handled in the hook with backend sync
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="bg-white rounded-lg p-4">
      <Text className="text-lg font-bold mb-4">Add New Transaction</Text>

      {/* Backend Status Indicator */}
      {backendAvailable && (
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <Text className="text-blue-800 text-sm">
            💡 Transactions will be saved locally and synchronized with cloud storage.
          </Text>
        </View>
      )}

      {!backendAvailable && (
        <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <Text className="text-yellow-800 text-sm">
            ⚠️ Cloud storage is unavailable. Transactions will be saved locally only.
          </Text>
        </View>
      )}

      {/* Type Selection */}
      <View className="flex-row mb-4">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-l-lg ${
            type === 'expense' ? 'bg-red-500' : 'bg-gray-300'
          }`}
          onPress={() => setType('expense')}
        >
          <Text className="text-center text-white font-semibold">Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 rounded-r-lg ${
            type === 'income' ? 'bg-green-500' : 'bg-gray-300'
          }`}
          onPress={() => setType('income')}
        >
          <Text className="text-center text-white font-semibold">Income</Text>
        </TouchableOpacity>
      </View>

      {/* Amount */}
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      {/* Description */}
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4"
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
      />

      {/* Category */}
      <Text className="font-semibold mb-2">Category</Text>
      <View className="flex-row flex-wrap mb-4">
        {categories[type].map((cat) => (
          <TouchableOpacity
            key={cat}
            className={`px-3 py-2 rounded-lg m-1 ${
              category === cat ? 'bg-blue-500' : 'bg-gray-200'
            }`}
            onPress={() => setCategory(cat)}
          >
            <Text className={category === cat ? 'text-white' : 'text-gray-700'}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        className={`bg-blue-500 rounded-lg p-4 ${
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