import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { backendService, ReportData, YearlyReportData } from './backend';
import { formatCurrency, getMonthName } from '@/utils/helpers';

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
          .chart-placeholder {
            background: #f3f4f6;
            padding: 40px;
            text-align: center;
            border-radius: 8px;
            margin: 20px 0;
            color: #6b7280;
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
          <h3 class="section-title">Monthly Chart Overview</h3>
          <div class="chart-placeholder">
            <p>📊 Financial Trends Chart</p>
            <p><small>Daily and weekly income vs expenses analysis</small></p>
            <p><em>Note: Interactive charts are available in the app</em></p>
          </div>
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
          <p>Generated by Finance Tracker App</p>
          <p>Report ID: ${reportData.generatedAt}</p>
        </div>
      </body>
      </html>
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
          <p>Generated by Finance Tracker App</p>
          <p>Report ID: ${reportData.generatedAt}</p>
        </div>
      </body>
      </html>
    `;
  }
}

export const reportService = new ReportService();