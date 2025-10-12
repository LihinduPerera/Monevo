import React from 'react';
import { View, Text } from 'react-native';
import { calculateSummary, formatCurrency } from '../utils/helpers';

interface SummaryCardProps {
  transactions: any[];
}

const SummaryCard: React.FC<SummaryCardProps> = ({ transactions }) => {
  const { income, expenses, balance } = calculateSummary(transactions);

  return (
    <View className="bg-[#1a1a2e] rounded-2xl p-6 mb-6 border border-purple-900/50">
      <Text className="text-xl font-bold mb-4 text-white">Financial Summary</Text>
      
      <View className="flex-row justify-between">
        <View className="items-center flex-1">
          <View className="bg-green-500/20 p-3 rounded-full mb-2">
            <Text className="text-green-400 font-bold text-lg">{formatCurrency(income)}</Text>
          </View>
          <Text className="text-gray-300 text-sm">Income</Text>
        </View>
        
        <View className="items-center flex-1">
          <View className="bg-red-500/20 p-3 rounded-full mb-2">
            <Text className="text-red-400 font-bold text-lg">{formatCurrency(expenses)}</Text>
          </View>
          <Text className="text-gray-300 text-sm">Expenses</Text>
        </View>
        
        <View className="items-center flex-1">
          <View className={`p-3 rounded-full mb-2 ${
            balance >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            <Text className={`font-bold text-lg ${
              balance >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrency(balance)}
            </Text>
          </View>
          <Text className="text-gray-300 text-sm">Balance</Text>
        </View>
      </View>
    </View>
  );
};

export default SummaryCard;