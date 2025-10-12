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
    <View className="bg-white rounded-lg p-4 shadow-sm mb-4">
      <Text className="text-lg font-bold mb-3 text-gray-800">
        Income vs Expenses (Last 30)
      </Text>

      {labels.length > 0 ? (
        <LineChart
          data={{
            labels: displayLabels,
            datasets: [
              {
                data: incomeData,
                color: () => '#16a34a', // green for income
                strokeWidth: 2,
              },
              {
                data: expenseData,
                color: () => '#dc2626', // red for expense
                strokeWidth: 2,
              },
            ],
            legend: ['Income', 'Expenses'],
          }}
          width={screenWidth}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: {
              r: '3',
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      ) : (
        <Text className="text-gray-500">No data to display</Text>
      )}
    </View>
  );
};

export default TransactionsChart;
