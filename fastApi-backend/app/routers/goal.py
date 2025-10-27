from fastapi import APIRouter, HTTPException, Body, Path
from pydantic import BaseModel

from app.models.goal import Goal
from app.middleware.auth import authenticate_token
from fastapi import Depends

router = APIRouter()

class GoalRequest(BaseModel):
    target_amount: float
    target_month: int
    target_year: int

@router.post("/goals")
async def create_goal(body: GoalRequest = Body(...), user: dict = Depends(authenticate_token)):
    try:
        if not all([body.target_amount, body.target_month, body.target_year]):
            raise HTTPException(400, {"success": False, "message": "All fields are required"})
        
        if body.target_month < 1 or body.target_month > 12:
            raise HTTPException(400, {"success": False, "message": "Month must be between 1 and 12"})
        
        goal_id = await Goal.create({**body.dict(), "user_id": user["id"]})
        
        return {"success": True, "message": "Goal created successfully", "data": {"id": goal_id}}, 201
    except Exception as e:
        raise HTTPException(500, {"success": False, "message": "Failed to create goal", "error": str(e)})

@router.get("/goals")
async def get_goals(user: dict = Depends(authenticate_token)):
    try:
        goals = await Goal.get_user_goals(user["id"])
        return {"success": True, "data": goals}
    except Exception as e:
        raise HTTPException(500, {"success": False, "message": "Failed to fetch goals", "error": str(e)})

@router.get("/goals/{month}/{year}")
async def get_goal_by_month(month: int = Path(...), year: int = Path(...), user: dict = Depends(authenticate_token)):
    try:
        goal = await Goal.get_by_user_and_month(user["id"], month, year)
        return {"success": True, "data": goal}
    except Exception as e:
        raise HTTPException(500, {"success": False, "message": "Failed to fetch goal", "error": str(e)})

@router.put("/goals/{id}")
async def update_goal(id: int = Path(...), body: GoalRequest = Body(...), user: dict = Depends(authenticate_token)):
    try:
        if not all([body.target_amount, body.target_month, body.target_year]):
            raise HTTPException(400, {"success": False, "message": "All fields are required"})
        
        if body.target_month < 1 or body.target_month > 12:
            raise HTTPException(400, {"success": False, "message": "Month must be between 1 and 12"})
        
        updated = await Goal.update(id, body.dict(), user["id"])
        if not updated:
            raise HTTPException(404, {"success": False, "message": "Goal not found"})
        
        return {"success": True, "message": "Goal updated successfully"}
    except Exception as e:
        raise HTTPException(500, {"success": False, "message": "Failed to update goal", "error": str(e)})

@router.delete("/goals/{id}")
async def delete_goal(id: int = Path(...), user: dict = Depends(authenticate_token)):
    try:
        deleted = await Goal.delete(id, user["id"])
        if not deleted:
            raise HTTPException(404, {"success": False, "message": "Goal not found"})
        
        return {"success": True, "message": "Goal deleted successfully"}
    except Exception as e:
        raise HTTPException(500, {"success": False, "message": "Failed to delete goal", "error": str(e)})