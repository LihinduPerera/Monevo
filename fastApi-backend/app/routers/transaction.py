from fastapi import APIRouter, HTTPException, Body, Path, Query
from pydantic import BaseModel

from app.models.transaction import Transaction
from app.middleware.auth import authenticate_token
from fastapi import Depends

router = APIRouter()

class TransactionRequest(BaseModel):
    amount: float
    desc: str
    type: str
    category: str
    date: str

@router.post("/transactions")
async def create_transaction(body: TransactionRequest = Body(...), user: dict = Depends(authenticate_token)):
    try:
        if not all([body.amount, body.desc, body.type, body.category, body.date]):
            raise HTTPException(400, {"success": False, "message": "All fields are required"})
        
        if body.type not in ["income", "expense"]:
            raise HTTPException(400, {"success": False, "message": 'Type must be either "income" or "expense"'})
        
        transaction_id = await Transaction.create({**body.dict(), "user_id": user["id"]})
        
        return {"success": True, "message": "Transaction created successfully", "data": {"id": transaction_id}}, 201
    except Exception as e:
        raise HTTPException(500, {"success": False, "message": "Failed to create transaction", "error": str(e)})

@router.get("/transactions")
async def get_transactions(user: dict = Depends(authenticate_token)):
    try:
        transactions = await Transaction.get_all(user["id"])
        return {"success": True, "data": transactions}
    except Exception as e:
        raise HTTPException(500, {"success": False, "message": "Failed to fetch transactions", "error": str(e)})

@router.get("/transactions/{id}")
async def get_transaction_by_id(id: int = Path(...), user: dict = Depends(authenticate_token)):
    try:
        transaction = await Transaction.get_by_id(id, user["id"])
        if not transaction:
            raise HTTPException(404, {"success": False, "message": "Transaction not found"})
        return {"success": True, "data": transaction}
    except Exception as e:
        raise HTTPException(500, {"success": False, "message": "Failed to fetch transaction", "error": str(e)})

@router.get("/transactions/month/{month}/{year}")
async def get_transactions_by_month(month: int = Path(...), year: int = Path(...), user: dict = Depends(authenticate_token)):
    try:
        transactions = await Transaction.get_by_month(user["id"], month, year)
        return {"success": True, "data": transactions}
    except Exception as e:
        raise HTTPException(500, {"success": False, "message": "Failed to fetch transactions", "error": str(e)})

@router.put("/transactions/{id}")
async def update_transaction(id: int = Path(...), body: TransactionRequest = Body(...), user: dict = Depends(authenticate_token)):
    try:
        if not all([body.amount, body.desc, body.type, body.category, body.date]):
            raise HTTPException(400, {"success": False, "message": "All fields are required"})
        
        if body.type not in ["income", "expense"]:
            raise HTTPException(400, {"success": False, "message": 'Type must be either "income" or "expense"'})
        
        updated = await Transaction.update(id, body.dict(), user["id"])
        if not updated:
            raise HTTPException(404, {"success": False, "message": "Transaction not found"})
        
        return {"success": True, "message": "Transaction updated successfully"}
    except Exception as e:
        raise HTTPException(500, {"success": False, "message": "Failed to update transaction", "error": str(e)})

@router.delete("/transactions/{id}")
async def delete_transaction(id: int = Path(...), user: dict = Depends(authenticate_token)):
    try:
        deleted = await Transaction.delete(id, user["id"])
        if not deleted:
            raise HTTPException(404, {"success": False, "message": "Transaction not found"})
        
        return {"success": True, "message": "Transaction deleted successfully"}
    except Exception as e:
        raise HTTPException(500, {"success": False, "message": "Failed to delete transaction", "error": str(e)})