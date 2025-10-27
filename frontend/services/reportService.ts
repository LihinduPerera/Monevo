import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { backendService, ReportData, YearlyReportData } from './backend';
import { formatCurrency, getMonthName, getShortMonthName } from '@/utils/helpers';

class ReportService {
  async generateMonthlyReport(month: number, year: number): Promise<string> {
    try {
      const reportData = await backendService.generateReport(month, year);
      const html = this.generateMonthlyHTML(reportData);
      return await this.createPDF(html, `finance-report-${getMonthName(month)}-${year}.pdf`);
    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw new Error('Failed to generate report');
    }
  }

  async generateYearlyReport(year: number): Promise<string> {
    try {
      const reportData = await backendService.generateYearlyReport(year);
      const html = this.generateYearlyHTML(reportData);
      return await this.createPDF(html, `finance-yearly-report-${year}.pdf`);
    } catch (error) {
      console.error('Error generating yearly report:', error);
      throw new Error('Failed to generate yearly report');
    }
  }

  private async createPDF(html: string, fileName: string): Promise<string> {
    try {
      const { uri } = await Print.printToFileAsync({ html });
      
      // Rename file to include proper name
      const newUri = uri.replace(/Print\.pdf$/, fileName);
      // Note: In React Native, you might need to use FileSystem to properly rename
      
      return newUri;
    } catch (error) {
      console.error('Error creating PDF:', error);
      throw new Error('Failed to create PDF');
    }
  }

  async sharePDF(pdfUri: string): Promise<void> {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri);
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      throw new Error('Failed to share PDF');
    }
  }

  private generateMonthlyHTML(reportData: ReportData): string {
    const { period, summary, analytics, chartData, transactions } = reportData;
    
    // Generate chart for last 30 days
    const chartHTML = this.generateLast30DaysChart(transactions, period);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Finance Report - ${period.monthName} ${period.year}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            color: #333;
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 20px; 
            margin-bottom: 30px;
          }
          .summary-card { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 10px; 
            text-align: center;
            border-left: 4px solid #4f46e5;
          }
          .amount { 
            font-size: 24px; 
            font-weight: bold; 
            margin: 10px 0;
          }
          .income { color: #10b981; }
          .expense { color: #ef4444; }
          .net { color: #3b82f6; }
          .section { 
            margin-bottom: 30px; 
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .section-title { 
            color: #1f2937; 
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .analytics-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 20px;
          }
          .category-item { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .transaction-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .transaction-date { color: #6b7280; font-size: 14px; }
          .transaction-amount.income { color: #10b981; }
          .transaction-amount.expense { color: #ef4444; }
          .goal-status { 
            background: #dbeafe; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 15px 0;
          }
          .chart-container {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #e5e7eb;
          }
          .chart-title {
            text-align: center;
            font-weight: bold;
            margin-bottom: 15px;
            color: #1f2937;
            font-size: 18px;
          }
          .chart-legend {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 15px;
          }
          .legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12px;
          }
          .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 2px;
          }
          .legend-income { background: #10b981; }
          .legend-expense { background: #ef4444; }
          .legend-net { background: #3b82f6; }
          .trend-indicator {
            text-align: center;
            margin-top: 15px;
            padding: 8px 16px;
            background: #dbeafe;
            border-radius: 20px;
            display: inline-block;
            font-size: 12px;
            color: #1e40af;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
          .no-data {
            text-align: center;
            padding: 40px;
            color: #6b7280;
            background: #f3f4f6;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Financial Report</h1>
          <h2>${period.monthName} ${period.year}</h2>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <h3>Total Income</h3>
            <div class="amount income">${formatCurrency(summary.income)}</div>
            <p>${analytics.counts.income} transactions</p>
          </div>
          <div class="summary-card">
            <h3>Total Expenses</h3>
            <div class="amount expense">${formatCurrency(summary.expenses)}</div>
            <p>${analytics.counts.expenses} transactions</p>
          </div>
          <div class="summary-card">
            <h3>Net Income</h3>
            <div class="amount net">${formatCurrency(summary.net)}</div>
            <p>${analytics.counts.total} total transactions</p>
          </div>
        </div>

        ${summary.goalStatus ? `
        <div class="section">
          <h3 class="section-title">Goal Progress</h3>
          <div class="goal-status">
            <h4>Monthly Income Goal: ${formatCurrency(summary.goalStatus.target)}</h4>
            <p><strong>Progress:</strong> ${summary.goalStatus.progress.toFixed(1)}%</p>
            <p><strong>Status:</strong> ${summary.goalStatus.achieved ? '🎉 Achieved!' : 'In Progress'}</p>
            ${!summary.goalStatus.achieved ? `<p><strong>Remaining:</strong> ${formatCurrency(summary.goalStatus.remaining)}</p>` : ''}
          </div>
        </div>
        ` : ''}

        <div class="section">
          <h3 class="section-title">Financial Analytics</h3>
          <div class="analytics-grid">
            <div>
              <h4>Average Values</h4>
              <p>Average Income: ${formatCurrency(analytics.averages.income)}</p>
              <p>Average Expense: ${formatCurrency(analytics.averages.expenses)}</p>
            </div>
            <div>
              <h4>Savings Rate</h4>
              <p>${((summary.net / summary.income) * 100 || 0).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Top Categories</h3>
          <div class="analytics-grid">
            <div>
              <h4>Income Categories</h4>
              ${analytics.topCategories.income.map(([category, amount]) => `
                <div class="category-item">
                  <span>${category}</span>
                  <span class="income">${formatCurrency(amount)}</span>
                </div>
              `).join('')}
            </div>
            <div>
              <h4>Expense Categories</h4>
              ${analytics.topCategories.expenses.map(([category, amount]) => `
                <div class="category-item">
                  <span>${category}</span>
                  <span class="expense">${formatCurrency(amount)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Last 30 Days Financial Trends</h3>
          ${chartHTML}
        </div>

        <div class="section">
          <h3 class="section-title">Recent Transactions</h3>
          ${transactions.slice(0, 20).map(transaction => `
            <div class="transaction-row">
              <div>
                <div>${transaction.desc}</div>
                <div class="transaction-date">${new Date(transaction.date).toLocaleDateString()} • ${transaction.category}</div>
              </div>
              <div class="transaction-amount ${transaction.type}">
                ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
              </div>
            </div>
          `).join('')}
          ${transactions.length > 20 ? `<p style="text-align: center; margin-top: 15px; color: #6b7280;">... and ${transactions.length - 20} more transactions</p>` : ''}
        </div>

        <div class="footer">
          <p>Report ID: ${reportData.generatedAt}</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateLast30DaysChart(transactions: any[], period: any): string {
    // Get last 30 days
    const dates = [];
    const current = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(current);
      d.setDate(d.getDate() - i);
      dates.push(d.toLocaleDateString());
    }

    const recentTransactions = transactions
      .filter(t => new Date(t.date) >= new Date(current.getTime() - 30 * 24 * 60 * 60 * 1000))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (recentTransactions.length === 0) {
      return `
        <div class="no-data">
          <p>📊 No transaction data available for the last 30 days</p>
          <p><small>Add transactions to see your financial trends</small></p>
        </div>
      `;
    }

    // Group by date, initialize all dates
    const grouped: Record<string, { income: number; expense: number; net: number }> = {};
    dates.forEach(date => {
      grouped[date] = { income: 0, expense: 0, net: 0 };
    });

    recentTransactions.forEach(t => {
      const date = new Date(t.date).toLocaleDateString();
      if (grouped[date]) {
        if (t.type === 'income') {
          grouped[date].income += t.amount;
          grouped[date].net += t.amount;
        } else {
          grouped[date].expense += t.amount;
          grouped[date].net -= t.amount;
        }
      }
    });

    const labels = dates;
    const incomeData = labels.map(d => grouped[d].income);
    const expenseData = labels.map(d => grouped[d].expense);
    const netData = labels.map(d => grouped[d].net);

    // Calculate stats
    const totalIncome = incomeData.reduce((a, b) => a + b, 0);
    const totalExpense = expenseData.reduce((a, b) => a + b, 0);
    const netProfit = totalIncome - totalExpense;

    // For chart scaling
    const allValues = [...incomeData, ...expenseData, ...netData];
    let maxY = Math.max(...allValues, 1);
    let minY = Math.min(...allValues, 0);
    const rangeY = maxY - minY;

    // Chart dimensions
    const chartWidth = 700;
    const chartHeight = 250;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const drawWidth = chartWidth - padding.left - padding.right;
    const drawHeight = chartHeight - padding.top - padding.bottom;

    const getX = (index: number) => padding.left + (index / (labels.length - 1)) * drawWidth;
    const getY = (value: number) => padding.top + ((maxY - value) / rangeY) * drawHeight;

    // Points for lines
    const incomePoints = labels.map((_, i) => `${getX(i)},${getY(incomeData[i])}`).join(' ');
    const expensePoints = labels.map((_, i) => `${getX(i)},${getY(expenseData[i])}`).join(' ');
    const netPoints = labels.map((_, i) => `${getX(i)},${getY(netData[i])}`).join(' ');

    // SVG chart
    const svgChart = `
      <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}">
        <!-- Y axis -->
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + drawHeight}" stroke="#e5e7eb" />
        <!-- X axis -->
        <line x1="${padding.left}" y1="${padding.top + drawHeight}" x2="${padding.left + drawWidth}" y2="${padding.top + drawHeight}" stroke="#e5e7eb" />
        ${minY < 0 ? `<line x1="${padding.left}" y1="${getY(0)}" x2="${padding.left + drawWidth}" y2="${getY(0)}" stroke="#ccc" stroke-dasharray="5,5" />` : ''}
        
        <!-- Y ticks and labels -->
        ${Array.from({ length: 6 }).map((_, i) => {
          const val = minY + (i / 5) * rangeY;
          const y = getY(val);
          return `
            <line x1="${padding.left - 5}" y1="${y}" x2="${padding.left}" y2="${y}" stroke="#e5e7eb" />
            <text x="${padding.left - 10}" y="${y + 3}" text-anchor="end" font-size="10" fill="#6b7280">${formatCurrency(val).replace(/^\$/, '')}</text>
          `;
        }).join('')}
        
        <!-- X labels -->
        ${labels.map((label, i) => {
          if (i % Math.max(1, Math.floor(labels.length / 5)) !== 0) return '';
          const x = getX(i);
          return `
            <text x="${x}" y="${padding.top + drawHeight + 15}" text-anchor="middle" font-size="10" fill="#6b7280">${new Date(label).getDate()}</text>
          `;
        }).join('')}
        
        <!-- Lines -->
        <polyline points="${incomePoints}" fill="none" stroke="#10b981" stroke-width="2" />
        <polyline points="${expensePoints}" fill="none" stroke="#ef4444" stroke-width="2" />
        <polyline points="${netPoints}" fill="none" stroke="#3b82f6" stroke-width="2" />
      </svg>
    `;

    return `
      <div class="chart-container">
        <div class="chart-title">Financial Overview - Last 30 Days</div>
        
        <!-- Summary Stats -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; text-align: center;">
          <div>
            <div style="color: #10b981; font-weight: bold; font-size: 16px;">${formatCurrency(totalIncome)}</div>
            <div style="color: #6b7280; font-size: 12px;">Income</div>
          </div>
          <div>
            <div style="color: #ef4444; font-weight: bold; font-size: 16px;">${formatCurrency(totalExpense)}</div>
            <div style="color: #6b7280; font-size: 12px;">Expenses</div>
          </div>
          <div>
            <div style="color: ${netProfit >= 0 ? '#10b981' : '#ef4444'}; font-weight: bold; font-size: 16px;">
              ${formatCurrency(Math.abs(netProfit))}
            </div>
            <div style="color: #6b7280; font-size: 12px;">${netProfit >= 0 ? 'Profit' : 'Loss'}</div>
          </div>
        </div>

        <!-- Chart -->
        ${svgChart}

        <!-- Legend -->
        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color legend-income"></div>
            <span>Income</span>
          </div>
          <div class="legend-item">
            <div class="legend-color legend-expense"></div>
            <span>Expenses</span>
          </div>
          <div class="legend-item">
            <div class="legend-color legend-net"></div>
            <span>Net</span>
          </div>
        </div>

        <!-- Trend Indicator -->
        <div style="text-align: center; margin-top: 15px;">
          <div class="trend-indicator">
            ${netProfit >= 0 ? '📈' : '📉'} 
            ${netProfit >= 0 ? 'Positive Trend' : 'Needs Attention'}
          </div>
        </div>
      </div>
    `;
  }

  private generateYearlyHTML(reportData: YearlyReportData): string {
    const { period, summary, monthlyBreakdown, goalsProgress } = reportData;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Yearly Finance Report - ${period.year}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            color: #333;
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 20px; 
            margin-bottom: 30px;
          }
          .summary-card { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 10px; 
            text-align: center;
            border-left: 4px solid #4f46e5;
          }
          .amount { 
            font-size: 20px; 
            font-weight: bold; 
            margin: 10px 0;
          }
          .income { color: #10b981; }
          .expense { color: #ef4444; }
          .net { color: #3b82f6; }
          .savings { color: #8b5cf6; }
          .section { 
            margin-bottom: 30px; 
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .section-title { 
            color: #1f2937; 
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .monthly-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
          }
          .month-card {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
          }
          .goal-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            margin: 5px 0;
            background: #f0f9ff;
            border-radius: 6px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Yearly Financial Report</h1>
          <h2>${period.year}</h2>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <h3>Total Income</h3>
            <div class="amount income">${formatCurrency(summary.income)}</div>
          </div>
          <div class="summary-card">
            <h3>Total Expenses</h3>
            <div class="amount expense">${formatCurrency(summary.expenses)}</div>
          </div>
          <div class="summary-card">
            <h3>Net Income</h3>
            <div class="amount net">${formatCurrency(summary.net)}</div>
          </div>
          <div class="summary-card">
            <h3>Savings Rate</h3>
            <div class="amount savings">${summary.savingsRate.toFixed(1)}%</div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Monthly Breakdown</h3>
          <div class="monthly-grid">
            ${Object.values(monthlyBreakdown).map(monthData => `
              <div class="month-card">
                <h4>${monthData.monthName}</h4>
                <p class="income">+${formatCurrency(monthData.income)}</p>
                <p class="expense">-${formatCurrency(monthData.expenses)}</p>
                <p class="net">${formatCurrency(monthData.net)}</p>
                <small>${monthData.transactionCount} transactions</small>
              </div>
            `).join('')}
          </div>
        </div>

        ${goalsProgress.length > 0 ? `
        <div class="section">
          <h3 class="section-title">Goals Progress</h3>
          <p><strong>Achievement Rate:</strong> ${summary.goalsAchievementRate.toFixed(1)}%</p>
          <p><strong>Completed:</strong> ${summary.achievedGoals} of ${summary.totalGoals} goals</p>
          ${goalsProgress.map(goal => {
            const monthData = monthlyBreakdown[goal.target_month];
            const achieved = monthData && monthData.net >= goal.target_amount;
            return `
              <div class="goal-item">
                <div>
                  <strong>${getMonthName(goal.target_month)}</strong>
                  <br>
                  <small>Target: ${formatCurrency(goal.target_amount)}</small>
                </div>
                <div>
                  ${achieved ? '✅' : '⏳'}
                  <br>
                  <small>${achieved ? 'Achieved' : 'Pending'}</small>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        ` : ''}

        <div class="section">
          <h3 class="section-title">Yearly Insights</h3>
          <p><strong>Total Transactions:</strong> ${summary.transactionCount}</p>
          <p><strong>Average Monthly Income:</strong> ${formatCurrency(summary.income / 12)}</p>
          <p><strong>Average Monthly Expenses:</strong> ${formatCurrency(summary.expenses / 12)}</p>
          <p><strong>Best Month:</strong> ${
            Object.values(monthlyBreakdown).reduce((best, current) => 
              current.net > best.net ? current : best
            ).monthName
          }</p>
        </div>

        <div class="footer">
          <p>Report ID: ${reportData.generatedAt}</p>
        </div>
      </body>
      </html>
    `;
  }
}

export const reportService = new ReportService();