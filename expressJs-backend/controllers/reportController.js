const Transaction = require('../models/transactionModel');
const Goal = require('../models/goalModel');

const reportController = {
  
  generateReport: async (req, res) => {
    try {
      const userId = req.user.id;
      const { month, year } = req.query;
      
      const targetMonth = parseInt(month) || new Date().getMonth() + 1;
      const targetYear = parseInt(year) || new Date().getFullYear();

      // Get transactions for the month
      const transactions = await Transaction.getByMonth(userId, targetMonth, targetYear);
      
      // Get goal for the month
      const goal = await Goal.getByUserAndMonth(userId, targetMonth, targetYear);

      // Calculate analytics
      const analytics = calculateTransactionAnalytics(transactions);
      const monthlySummary = calculateMonthlySummary(transactions, goal);

      // Generate chart data
      const chartData = generateChartData(transactions, targetMonth, targetYear);

      const report = {
        success: true,
        data: {
          period: {
            month: targetMonth,
            year: targetYear,
            monthName: getMonthName(targetMonth)
          },
          summary: monthlySummary,
          analytics: analytics,
          chartData: chartData,
          transactions: transactions.slice(0, 50), // Limit to 50 transactions
          generatedAt: new Date().toISOString()
        }
      };

      res.json(report);
    } catch (error) {
      console.error('Generate report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        error: error.message
      });
    }
  },

  getYearlyReport: async (req, res) => {
    try {
      const userId = req.user.id;
      const { year } = req.query;
      
      const targetYear = parseInt(year) || new Date().getFullYear();

      // Get all transactions for the year
      const allTransactions = await Transaction.getAll(userId);
      const yearTransactions = allTransactions.filter(t => {
        const transDate = new Date(t.date);
        return transDate.getFullYear() === targetYear;
      });

      // Get all goals for the year
      const allGoals = await Goal.getUserGoals(userId);
      const yearGoals = allGoals.filter(g => g.target_year === targetYear);

      // Calculate yearly analytics
      const yearlyAnalytics = calculateYearlyAnalytics(yearTransactions, yearGoals);
      const monthlyBreakdown = calculateMonthlyBreakdown(yearTransactions, targetYear);

      const report = {
        success: true,
        data: {
          period: {
            year: targetYear,
            type: 'yearly'
          },
          summary: yearlyAnalytics,
          monthlyBreakdown: monthlyBreakdown,
          goalsProgress: yearGoals,
          generatedAt: new Date().toISOString()
        }
      };

      res.json(report);
    } catch (error) {
      console.error('Generate yearly report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate yearly report',
        error: error.message
      });
    }
  }
};

// Helper functions
function calculateTransactionAnalytics(transactions) {
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netIncome = totalIncome - totalExpenses;

  // Category breakdown
  const incomeByCategory = groupByCategory(incomeTransactions);
  const expensesByCategory = groupByCategory(expenseTransactions);

  // Top categories
  const topIncomeCategories = Object.entries(incomeByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  const topExpenseCategories = Object.entries(expensesByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Average transaction values
  const avgIncome = incomeTransactions.length > 0 ? totalIncome / incomeTransactions.length : 0;
  const avgExpense = expenseTransactions.length > 0 ? totalExpenses / expenseTransactions.length : 0;

  return {
    totals: {
      income: totalIncome,
      expenses: totalExpenses,
      net: netIncome
    },
    counts: {
      income: incomeTransactions.length,
      expenses: expenseTransactions.length,
      total: transactions.length
    },
    averages: {
      income: avgIncome,
      expenses: avgExpense
    },
    topCategories: {
      income: topIncomeCategories,
      expenses: topExpenseCategories
    },
    categoryBreakdown: {
      income: incomeByCategory,
      expenses: expensesByCategory
    }
  };
}

function calculateMonthlySummary(transactions, goal) {
  const analytics = calculateTransactionAnalytics(transactions);
  
  let goalStatus = null;
  if (goal) {
    const goalProgress = (analytics.totals.net / goal.target_amount) * 100;
    goalStatus = {
      target: goal.target_amount,
      progress: goalProgress,
      achieved: analytics.totals.net >= goal.target_amount,
      remaining: Math.max(goal.target_amount - analytics.totals.net, 0)
    };
  }

  return {
    ...analytics.totals,
    goalStatus,
    transactionCount: analytics.counts.total
  };
}

function calculateYearlyAnalytics(transactions, goals) {
  const analytics = calculateTransactionAnalytics(transactions);
  
  // Calculate savings rate
  const savingsRate = analytics.totals.income > 0 
    ? (analytics.totals.net / analytics.totals.income) * 100 
    : 0;

  // Goals achievement rate
  const achievedGoals = goals.filter(g => {
    const monthTransactions = transactions.filter(t => {
      const transDate = new Date(t.date);
      return transDate.getMonth() + 1 === g.target_month && transDate.getFullYear() === g.target_year;
    });
    const monthNet = calculateTransactionAnalytics(monthTransactions).totals.net;
    return monthNet >= g.target_amount;
  }).length;

  const goalsAchievementRate = goals.length > 0 ? (achievedGoals / goals.length) * 100 : 0;

  return {
    ...analytics.totals,
    savingsRate,
    goalsAchievementRate,
    totalGoals: goals.length,
    achievedGoals,
    transactionCount: analytics.counts.total
  };
}

function calculateMonthlyBreakdown(transactions, year) {
  const monthlyData = {};
  
  for (let month = 1; month <= 12; month++) {
    const monthTransactions = transactions.filter(t => {
      const transDate = new Date(t.date);
      return transDate.getMonth() + 1 === month && transDate.getFullYear() === year;
    });
    
    const analytics = calculateTransactionAnalytics(monthTransactions);
    
    monthlyData[month] = {
      month,
      monthName: getMonthName(month),
      ...analytics.totals,
      transactionCount: analytics.counts.total
    };
  }
  
  return monthlyData;
}

function groupByCategory(transactions) {
  return transactions.reduce((acc, transaction) => {
    const { category, amount } = transaction;
    acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {});
}

function generateChartData(transactions, month, year) {
  // Daily breakdown for the month
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyData = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dayTransactions = transactions.filter(t => {
      const transDate = new Date(t.date);
      return transDate.getDate() === day;
    });
    
    const dayIncome = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const dayExpenses = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    dailyData.push({
      day,
      income: dayIncome,
      expenses: dayExpenses,
      net: dayIncome - dayExpenses
    });
  }

  // Weekly breakdown
  const weeklyData = [];
  for (let week = 0; week < 5; week++) {
    const weekStart = week * 7 + 1;
    const weekEnd = Math.min(weekStart + 6, daysInMonth);
    
    const weekTransactions = transactions.filter(t => {
      const transDate = new Date(t.date);
      const day = transDate.getDate();
      return day >= weekStart && day <= weekEnd;
    });
    
    const weekIncome = weekTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const weekExpenses = weekTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    weeklyData.push({
      week: week + 1,
      income: weekIncome,
      expenses: weekExpenses,
      net: weekIncome - weekExpenses
    });
  }

  return {
    daily: dailyData,
    weekly: weeklyData
  };
}

function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}

module.exports = reportController;