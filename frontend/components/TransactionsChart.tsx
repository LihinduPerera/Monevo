import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Transaction } from '@/services/database';
import { formatDate } from '@/utils/helpers';

interface Props {
  transactions: Transaction[];
}

const screenWidth = Dimensions.get('window').width - 32;

const TransactionsChart: React.FC<Props> = ({ transactions }) => {
  // Use last 30 transactions
  const recent = transactions.slice(-30);

  // Group by date
  const grouped: Record<string, { income: number; expense: number }> = {};

  recent.forEach(t => {
    const date = formatDate(t.date);
    if (!grouped[date]) grouped[date] = { income: 0, expense: 0 };

    if (t.type === 'income') grouped[date].income += t.amount;
    else grouped[date].expense += t.amount;
  });

  const labels = Object.keys(grouped);
  const incomeData = labels.map(d => grouped[d].income);
  const expenseData = labels.map(d => grouped[d].expense);

  // If too many labels, show fewer to avoid clutter
  const step = Math.ceil(labels.length / 6);
  const displayLabels = labels.map((label, index) =>
    index % step === 0 ? label : ''
  );

  return (
    <View className="bg-[#1a1a2e] rounded-2xl p-6 mb-6 border border-purple-900/50">
      <Text className="text-xl font-bold mb-4 text-white">
        Income vs Expenses (Last 30)
      </Text>

      {labels.length > 0 ? (
        <LineChart
          data={{
            labels: displayLabels,
            datasets: [
              {
                data: incomeData,
                color: () => '#10b981', // green for income
                strokeWidth: 3,
              },
              {
                data: expenseData,
                color: () => '#ef4444', // red for expense
                strokeWidth: 3,
              },
            ],
            legend: ['Income', 'Expenses'],
          }}
          width={screenWidth}
          height={220}
          chartConfig={{
            backgroundColor: '#1a1a2e',
            backgroundGradientFrom: '#1a1a2e',
            backgroundGradientTo: '#1a1a2e',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
            },
            propsForBackgroundLines: {
              stroke: '#374151',
              strokeDasharray: '',
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      ) : (
        <View className="bg-[#0f0f23] rounded-xl p-8 items-center">
          <Text className="text-gray-400 text-center">No data to display yet. Add some transactions to see your financial trends.</Text>
        </View>
      )}
    </View>
  );
};

export default TransactionsChart;