import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, Dimensions, Animated } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Transaction } from '@/services/database';
import { formatDate } from '@/utils/helpers';

interface Props {
  transactions: Transaction[];
}

const screenWidth = Dimensions.get('window').width - 32;

const TransactionsChart: React.FC<Props> = ({ transactions }) => {
  // Animation values
  const glowAnim1 = useRef(new Animated.Value(0)).current;
  const glowAnim2 = useRef(new Animated.Value(0)).current;
  const glowAnim3 = useRef(new Animated.Value(0)).current;
  const chartFadeAnim = useRef(new Animated.Value(0)).current;
  const chartScaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Use last 30 transactions
  const recent = useMemo(() => transactions.slice(-30).reverse(), [transactions]);

  // Group by date
  const grouped = useMemo(() => {
    const result: Record<string, { income: number; expense: number; net: number }> = {};

    recent.forEach(t => {
      const date = formatDate(t.date);
      if (!result[date]) result[date] = { income: 0, expense: 0, net: 0 };

      if (t.type === 'income') {
        result[date].income += t.amount;
        result[date].net += t.amount;
      } else {
        result[date].expense += t.amount;
        result[date].net -= t.amount;
      }
    });

    return result;
  }, [recent]);

  const labels = Object.keys(grouped);
  const incomeData = labels.map(d => grouped[d].income);
  const expenseData = labels.map(d => grouped[d].expense);
  const netData = labels.map(d => grouped[d].net);

  // Smart label formatting - show fewer labels to avoid clutter
  const displayLabels = useMemo(() => {
    const step = Math.max(1, Math.floor(labels.length / 5));
    return labels.map((label, index) =>
      index % step === 0 ? label.split('/').slice(0, 2).join('/') : ''
    );
  }, [labels]);

  // Calculate some stats for the header
  const totalIncome = incomeData.reduce((a, b) => a + b, 0);
  const totalExpense = expenseData.reduce((a, b) => a + b, 0);
  const netProfit = totalIncome - totalExpense;

  // Multiple glowing orbs moving around
  useEffect(() => {
    const createGlowAnimation = (animValue: Animated.Value, duration: number, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const glow1 = createGlowAnimation(glowAnim1, 4000, 0);
    const glow2 = createGlowAnimation(glowAnim2, 5000, 1000);
    const glow3 = createGlowAnimation(glowAnim3, 6000, 2000);

    // Pulse animation for stats
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    glow1.start();
    glow2.start();
    glow3.start();
    pulse.start();

    return () => {
      glow1.stop();
      glow2.stop();
      glow3.stop();
      pulse.stop();
    };
  }, [glowAnim1, glowAnim2, glowAnim3, pulseAnim]);

  // Chart entrance animation
  useEffect(() => {
    chartFadeAnim.setValue(0);
    chartScaleAnim.setValue(0.95);

    Animated.parallel([
      Animated.timing(chartFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(chartScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [transactions]);

  // Interpolate glow positions
  const glow1X = glowAnim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-50, screenWidth * 0.7, screenWidth + 50],
  });

  const glow1Y = glowAnim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [50, 200, 100],
  });

  const glow2X = glowAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [screenWidth + 50, screenWidth * 0.3, -50],
  });

  const glow2Y = glowAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [150, 50, 250],
  });

  const glow3X = glowAnim3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [screenWidth / 2, -50, screenWidth + 50],
  });

  const glow3Y = glowAnim3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [300, 150, 200],
  });

  const glow1Opacity = glowAnim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  const glow2Opacity = glowAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.7, 0.4],
  });

  const glow3Opacity = glowAnim3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 0.5, 0.2],
  });

  if (labels.length === 0) {
    return (
      <View className="mb-6 overflow-hidden rounded-3xl">
        <LinearGradient
          colors={['#1a1a2e', '#16213e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10"
        >
          <View className="p-6">
            <View className="bg-[#0f0f23]/80 rounded-2xl p-8 items-center justify-center min-h-[200px]">
              <View className="w-16 h-16 bg-cyan-500/20 rounded-full items-center justify-center mb-4">
                <Text className="text-cyan-400 text-2xl">📊</Text>
              </View>
              <Text className="text-gray-400 text-center text-base leading-6">
                No data to display yet.{'\n'}
                <Text className="text-cyan-400">Add transactions</Text> to see your financial trends
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View className="mb-6 overflow-hidden rounded-3xl">
      {/* Base gradient background */}
      <LinearGradient
        colors={['#0a0a1a', '#1a1a2e', '#16213e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10"
      >
        {/* Animated glowing orbs */}
        <View className="absolute inset-0 overflow-hidden rounded-3xl">
          {/* Glow 1 - Cyan */}
          <Animated.View
            style={{
              position: 'absolute',
              width: 180,
              height: 180,
              transform: [
                { translateX: glow1X },
                { translateY: glow1Y },
              ],
              opacity: glow1Opacity,
            }}
          >
            <LinearGradient
              colors={['rgba(6, 182, 212, 0.4)', 'rgba(6, 182, 212, 0.1)', 'transparent']}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, borderRadius: 90 }}
            />
          </Animated.View>

          {/* Glow 2 - Emerald */}
          <Animated.View
            style={{
              position: 'absolute',
              width: 150,
              height: 150,
              transform: [
                { translateX: glow2X },
                { translateY: glow2Y },
              ],
              opacity: glow2Opacity,
            }}
          >
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.4)', 'rgba(16, 185, 129, 0.1)', 'transparent']}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, borderRadius: 75 }}
            />
          </Animated.View>

          {/* Glow 3 - Rose */}
          <Animated.View
            style={{
              position: 'absolute',
              width: 200,
              height: 200,
              transform: [
                { translateX: glow3X },
                { translateY: glow3Y },
              ],
              opacity: glow3Opacity,
            }}
          >
            <LinearGradient
              colors={['rgba(244, 63, 94, 0.3)', 'rgba(244, 63, 94, 0.1)', 'transparent']}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, borderRadius: 100 }}
            />
          </Animated.View>
        </View>

        {/* Content with glass effect */}
        <BlurView intensity={50} style={{ borderRadius: 24 }}>
          <View className="p-6">
            {/* Header with stats */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-2xl font-bold text-white">
                  Financial Overview
                </Text>
                <Animated.View
                  style={{ transform: [{ scale: pulseAnim }] }}
                  className="flex-row items-center bg-cyan-500/10 px-3 py-1 rounded-full"
                >
                  <Text className="text-cyan-400 text-sm font-medium">
                    Last 30 Days
                  </Text>
                </Animated.View>
              </View>

              <View className="flex-row justify-between">
                <View className="items-center">
                  <Text className="text-emerald-400 text-lg font-bold">${totalIncome.toLocaleString()}</Text>
                  <Text className="text-gray-400 text-xs">Income</Text>
                </View>
                <View className="items-center">
                  <Text className="text-rose-400 text-lg font-bold">${totalExpense.toLocaleString()}</Text>
                  <Text className="text-gray-400 text-xs">Expenses</Text>
                </View>
                <View className="items-center">
                  <Text className={`text-lg font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${Math.abs(netProfit).toLocaleString()}
                  </Text>
                  <Text className="text-gray-400 text-xs">{netProfit >= 0 ? 'Profit' : 'Loss'}</Text>
                </View>
              </View>
            </View>

            {/* Chart with animation */}
            <Animated.View
              className="items-center justify-center"
              style={{
                opacity: chartFadeAnim,
                transform: [{ scale: chartScaleAnim }],
              }}
            >
              <View className="items-center justify-center">
                <LineChart
                  data={{
                    labels: displayLabels,
                    datasets: [
                      {
                        data: incomeData,
                        color: () => '#10b981', // emerald
                        strokeWidth: 4,
                      },
                      {
                        data: expenseData,
                        color: () => '#f43f5e', // rose
                        strokeWidth: 4,
                      },
                      {
                        data: netData,
                        color: () => '#38bdf8', // cyan
                        strokeWidth: 3,
                      },

                    ],
                  }}
                  width={screenWidth - 50}
                  height={240}
                  chartConfig={{
                    backgroundGradientFromOpacity: 0,
                    backgroundGradientToOpacity: 0.5,
                    backgroundGradientFrom: "#1E2923",
                    backgroundGradientTo: "#08130D",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
                    style: { borderRadius: 20 },
                    propsForDots: {
                      r: '6',
                      strokeWidth: '2',
                      stroke: '#0f172a',
                    },
                    propsForBackgroundLines: {
                      stroke: '#334155',
                      strokeWidth: 1,
                      strokeDasharray: '4 8',
                    },
                    propsForLabels: {
                      fontSize: 10,
                      fontWeight: '500',
                    },
                    fillShadowGradient: '#000000',
                    fillShadowGradientOpacity: 0.1,
                    useShadowColorFromDataset: true,
                  }}
                  bezier
                  withVerticalLines={false}
                  withHorizontalLines={true}
                  withHorizontalLabels={true}
                  withVerticalLabels={true}
                  withInnerLines={true}
                  withOuterLines={false}
                  withShadow={true}
                  withDots={true}
                  style={{
                    marginLeft: -10,
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                  decorator={() => (
                    <View className="absolute -top-2 -right-2">
                      <View className="bg-cyan-500/20 rounded-full p-1">
                        <Text className="text-cyan-400 text-xs">💰</Text>
                      </View>
                    </View>
                  )}
                />
              </View>
            </Animated.View>

            {/* Custom Legend */}
            <View className="flex-row justify-center space-x-6 mt-4">
              <View className="flex-row items-center mr-3">
                <View className="w-3 h-3 bg-emerald-400 rounded-full mr-2 shadow shadow-emerald-400/50" />
                <Text className="text-gray-300 text-sm font-medium">Income</Text>
              </View>
              <View className="flex-row items-center mr-3">
                <View className="w-3 h-3 bg-rose-400 rounded-full mr-2 shadow shadow-rose-400/50" />
                <Text className="text-gray-300 text-sm font-medium">Expenses</Text>
              </View>
              <View className="flex-row items-center mr-3">
                <View className="w-3 h-3 bg-cyan-400 rounded-full mr-2 shadow shadow-cyan-400/50" />
                <Text className="text-gray-300 text-sm font-medium">Net</Text>
              </View>
            </View>

            {/* Trend Indicator */}
            <View className="mt-4 flex-row items-center justify-center">
              <View className="bg-cyan-500/10 rounded-full px-3 py-1 flex-row items-center">
                <Text className="text-cyan-400 text-xs mr-1">
                  {netProfit >= 0 ? '📈' : '📉'}
                </Text>
                <Text className="text-cyan-400 text-xs font-medium">
                  {netProfit >= 0 ? 'Positive Trend' : 'Needs Attention'}
                </Text>
              </View>
            </View>
          </View>
        </BlurView>
      </LinearGradient>
    </View>
  );
};

export default TransactionsChart;