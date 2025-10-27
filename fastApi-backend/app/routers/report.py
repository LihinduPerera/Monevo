from fastapi import APIRouter, HTTPException, Query
from datetime import datetime

from app.models.transaction import Transaction
from app.models.goal import Goal
from app.utils.helpers import calculate_transaction_analytics, calculate_monthly_summary, generate_chart_data, calculate_yearly_analytics, calculate_monthly_breakdown
from app.middleware.auth import authenticate_token
from fastapi import Depends

router = APIRouter()

@router.get("/report")
async def generate_report(month: int = Query(None), year: int = Query(None), user: dict = Depends(authenticate_token)):
    try:
        target_month = month or datetime.now().month
        target_year = year or datetime.now().year
        
        transactions = await Transaction.get_by_month(user["id"], target_month, target_year)
        goal = await Goal.get_by_user_and_month(user["id"], target_month, target_year)
        
        analytics = calculate_transaction_analytics(transactions)
        monthly_summary = calculate_monthly_summary(transactions, goal)
        chart_data = generate_chart_data(transactions, target_month, target_year)
        
        return {
            "success": True,
            "data": {
                "period": {
                    "month": target_month,
                    "year": target_year,
                    "monthName": datetime(2000, target_month, 1).strftime("%B")
                },
                "summary": monthly_summary,
                "analytics": analytics,
                "chartData": chart_data,
                "transactions": transactions[:50],
                "generatedAt": datetime.now().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(500, {"success": False, "message": "Failed to generate report", "error": str(e)})

@router.get("/report/yearly")
async def get_yearly_report(year: int = Query(None), user: dict = Depends(authenticate_token)):
    try:
        target_year = year or datetime.now().year
        
        all_transactions = await Transaction.get_all(user["id"])
        year_transactions = [t for t in all_transactions if datetime.strptime(t["date"], "%Y-%m-%d").year == target_year]
        
        all_goals = await Goal.get_user_goals(user["id"])
        year_goals = [g for g in all_goals if g["target_year"] == target_year]
        
        yearly_analytics = calculate_yearly_analytics(year_transactions, year_goals)
        monthly_breakdown = calculate_monthly_breakdown(year_transactions, target_year)
        
        return {
            "success": True,
            "data": {
                "period": {
                    "year": target_year,
                    "type": "yearly"
                },
                "summary": yearly_analytics,
                "monthlyBreakdown": monthly_breakdown,
                "goalsProgress": year_goals,
                "generatedAt": datetime.now().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(500, {"success": False, "message": "Failed to generate yearly report", "error": str(e)})