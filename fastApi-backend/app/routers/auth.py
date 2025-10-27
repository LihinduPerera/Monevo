from fastapi import APIRouter, HTTPException, Body, Depends
import jwt
import os
from datetime import timedelta, datetime

from app.models.user import User
from pydantic import BaseModel
from app.middleware.auth import authenticate_token

router = APIRouter()

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    date_of_birth: str

class LoginRequest(BaseModel):
    email: str
    password: str

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_EXPIRES_IN = os.getenv("JWT_EXPIRES_IN", "7d")  # e.g., '7d'

@router.post("/register")
async def register(body: RegisterRequest = Body(...)):
    try:
        if not all([body.name, body.email, body.password, body.date_of_birth]):
            raise HTTPException(400, {"success": False, "message": "All fields are required"})
        
        import re
        if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", body.email):
            raise HTTPException(400, {"success": False, "message": "Invalid email format"})
        
        if len(body.password) < 6:
            raise HTTPException(400, {"success": False, "message": "Password must be at least 6 characters long"})
        
        user_id = await User.create(body.dict())
        
        return {"success": True, "message": "User registered successfully", "data": {"id": user_id}}, 201
    except ValueError as e:
        raise HTTPException(400, {"success": False, "message": str(e)})
    except Exception as e:
        raise HTTPException(500, {"success": False, "message": "Failed to register user", "error": str(e)})

@router.post("/login")
async def login(body: LoginRequest = Body(...)):
    try:
        if not all([body.email, body.password]):
            raise HTTPException(400, {"success": False, "message": "Email and password are required"})
        
        user = await User.get_by_email(body.email)
        if not user:
            raise HTTPException(401, {"success": False, "message": "Invalid email or password"})
        
        if not user["is_active"]:
            raise HTTPException(401, {"success": False, "message": "Account is deactivated"})
        
        if not User.compare_password(body.password, user["password"]):
            raise HTTPException(401, {"success": False, "message": "Invalid email or password"})
        
        await User.update_last_login(user["id"])
        
        # Calculate expiration
        expires_delta = timedelta(days=int(JWT_EXPIRES_IN[:-1])) if JWT_EXPIRES_IN.endswith('d') else timedelta(days=7)
        expire = datetime.utcnow() + expires_delta
        
        token = jwt.encode({
            "userId": user["id"],
            "email": user["email"],
            "exp": expire
        }, JWT_SECRET, algorithm="HS256")
        
        user_without_password = {k: v for k, v in user.items() if k != "password"}
        
        return {
            "success": True,
            "message": "Login successful",
            "data": {
                "user": user_without_password,
                "token": token,
                "expiresIn": JWT_EXPIRES_IN
            }
        }
    except Exception as e:
        raise HTTPException(500, {"success": False, "message": "Failed to login", "error": str(e)})

@router.get("/profile")
async def get_profile(user: dict = Depends(authenticate_token)):
    user_without_password = {k: v for k, v in user.items() if k != "password"}
    return {"success": True, "data": user_without_password}

@router.put("/profile")
async def update_profile(user: dict = Depends(authenticate_token)):
    raise HTTPException(501, {"success": False, "message": "Profile update not implemented yet"})