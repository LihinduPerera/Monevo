import React from 'react';
import { View, Text } from 'react-native';
import { calculateSummary, formatCurrency } from '../utils/helpers';

interface SummaryCardProps {
  transactions: any[];
}

const SummaryCard: React.FC<SummaryCardProps> = ({ transactions }) => {
  const { income, expenses, balance } = calculateSummary(transactions);

  return (
    <View className="bg-white rounded-lg p-4 shadow-sm mb-4">
      <Text className="text-lg font-bold mb-3 text-gray-800">Financial Summary</Text>
      
      <View className="flex-row justify-between">
        <View className="items-center">
          <Text className="text-green-600 font-bold">{formatCurrency(income)}</Text>
          <Text className="text-gray-600 text-xs">Income</Text>
        </View>
        
        <View className="items-center">
          <Text className="text-red-600 font-bold">{formatCurrency(expenses)}</Text>
          <Text className="text-gray-600 text-xs">Expenses</Text>
        </View>
        
        <View className="items-center">
          <Text className={`font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(balance)}
          </Text>
          <Text className="text-gray-600 text-xs">Balance</Text>
        </View>
      </View>
    </View>
  );
};

export default SummaryCard;