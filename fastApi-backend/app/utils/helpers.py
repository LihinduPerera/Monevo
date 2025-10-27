from datetime import datetime
from collections import defaultdict

def calculate_transaction_analytics(transactions):
    income_transactions = [t for t in transactions if t["type"] == "income"]
    expense_transactions = [t for t in transactions if t["type"] == "expense"]
    
    total_income = sum(t["amount"] for t in income_transactions)
    total_expenses = sum(t["amount"] for t in expense_transactions)
    net_income = total_income - total_expenses
    
    income_by_category = group_by_category(income_transactions)
    expenses_by_category = group_by_category(expense_transactions)
    
    top_income_categories = sorted(income_by_category.items(), key=lambda x: x[1], reverse=True)[:5]
    top_expense_categories = sorted(expenses_by_category.items(), key=lambda x: x[1], reverse=True)[:5]
    
    avg_income = total_income / len(income_transactions) if income_transactions else 0
    avg_expense = total_expenses / len(expense_transactions) if expense_transactions else 0
    
    return {
        "totals": {
            "income": total_income,
            "expenses": total_expenses,
            "net": net_income
        },
        "counts": {
            "income": len(income_transactions),
            "expenses": len(expense_transactions),
            "total": len(transactions)
        },
        "averages": {
            "income": avg_income,
            "expenses": avg_expense
        },
        "topCategories": {
            "income": top_income_categories,
            "expenses": top_expense_categories
        },
        "categoryBreakdown": {
            "income": income_by_category,
            "expenses": expenses_by_category
        }
    }

def calculate_monthly_summary(transactions, goal):
    analytics = calculate_transaction_analytics(transactions)
    
    goal_status = None
    if goal:
        goal_progress = (analytics["totals"]["net"] / goal["target_amount"]) * 100 if goal["target_amount"] else 0
        goal_status = {
            "target": goal["target_amount"],
            "progress": goal_progress,
            "achieved": analytics["totals"]["net"] >= goal["target_amount"],
            "remaining": max(goal["target_amount"] - analytics["totals"]["net"], 0)
        }
    
    return {
        **analytics["totals"],
        "goalStatus": goal_status,
        "transactionCount": analytics["counts"]["total"]
    }

def calculate_yearly_analytics(transactions, goals):
    analytics = calculate_transaction_analytics(transactions)
    
    savings_rate = (analytics["totals"]["net"] / analytics["totals"]["income"]) * 100 if analytics["totals"]["income"] > 0 else 0
    
    achieved_goals = 0
    for g in goals:
        month_transactions = [t for t in transactions if datetime.strptime(t["date"], "%Y-%m-%d").month == g["target_month"]]
        month_net = calculate_transaction_analytics(month_transactions)["totals"]["net"]
        if month_net >= g["target_amount"]:
            achieved_goals += 1
    
    goals_achievement_rate = (achieved_goals / len(goals)) * 100 if goals else 0
    
    return {
        **analytics["totals"],
        "savingsRate": savings_rate,
        "goalsAchievementRate": goals_achievement_rate,
        "totalGoals": len(goals),
        "achievedGoals": achieved_goals,
        "transactionCount": analytics["counts"]["total"]
    }

def calculate_monthly_breakdown(transactions, year):
    monthly_data = {}
    for month in range(1, 13):
        month_transactions = [t for t in transactions if datetime.strptime(t["date"], "%Y-%m-%d").month == month]
        analytics = calculate_transaction_analytics(month_transactions)
        monthly_data[month] = {
            "month": month,
            "monthName": datetime(2000, month, 1).strftime("%B"),
            **analytics["totals"],
            "transactionCount": analytics["counts"]["total"]
        }
    return monthly_data

def group_by_category(transactions):
    acc = defaultdict(float)
    for t in transactions:
        acc[t["category"]] += t["amount"]
    return dict(acc)

def generate_chart_data(transactions, month, year):
    from calendar import monthrange
    days_in_month = monthrange(year, month)[1]
    
    daily_data = []
    for day in range(1, days_in_month + 1):
        day_transactions = [t for t in transactions if datetime.strptime(t["date"], "%Y-%m-%d").day == day]
        day_income = sum(t["amount"] for t in day_transactions if t["type"] == "income")
        day_expenses = sum(t["amount"] for t in day_transactions if t["type"] == "expense")
        daily_data.append({
            "day": day,
            "income": day_income,
            "expenses": day_expenses,
            "net": day_income - day_expenses
        })
    
    weekly_data = []
    for week in range(5):
        week_start = week * 7 + 1
        week_end = min(week_start + 6, days_in_month)
        week_transactions = [t for t in transactions if week_start <= datetime.strptime(t["date"], "%Y-%m-%d").day <= week_end]
        week_income = sum(t["amount"] for t in week_transactions if t["type"] == "income")
        week_expenses = sum(t["amount"] for t in week_transactions if t["type"] == "expense")
        weekly_data.append({
            "week": week + 1,
            "income": week_income,
            "expenses": week_expenses,
            "net": week_income - week_expenses
        })
    
    return {
        "daily": daily_data,
        "weekly": weekly_data
    }