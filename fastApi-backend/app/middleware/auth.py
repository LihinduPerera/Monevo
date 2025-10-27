from fastapi import HTTPException, Header, Depends
import jwt
import os

from app.models.user import User

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")

async def authenticate_token(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(401, {"success": False, "message": "Access token required"})
    
    try:
        token = authorization.split(" ")[1]
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        
        user = await User.get_by_id(decoded["userId"])
        if not user:
            raise HTTPException(401, {"success": False, "message": "User not found"})
        
        if not user["is_active"]:
            raise HTTPException(401, {"success": False, "message": "Account is deactivated"})
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, {"success": False, "message": "Token expired"})
    except jwt.InvalidTokenError:
        raise HTTPException(403, {"success": False, "message": "Invalid token"})
    except Exception:
        raise HTTPException(403, {"success": False, "message": "Invalid token"})