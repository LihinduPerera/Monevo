# app/main.py
import os
from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from datetime import datetime

from app.config.database import init_database, close_connection
from app.routers import auth, transaction, goal, report
from app.middleware.auth import authenticate_token

load_dotenv()

app = FastAPI(title="Finance API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth")
app.include_router(transaction.router, prefix="/api", dependencies=[Depends(authenticate_token)])
app.include_router(goal.router, prefix="/api", dependencies=[Depends(authenticate_token)])
app.include_router(report.router, prefix="/api", dependencies=[Depends(authenticate_token)])

# Health check
@app.get("/health")
async def health():
    return {
        "success": True,
        "message": "Finance API is running",
        "timestamp": datetime.now().isoformat()
    }

# Root
@app.get("/")
async def root():
    return {
        "success": True,
        "message": "Finance API Server",
        "endpoints": {
            "health": "/health",
            "auth": "/api/auth",
            "transactions": "/api/transactions",
            "goals": "/api/goals"
        }
    }

# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "error": str(exc) if os.environ.get("NODE_ENV") == "development" else "Something went wrong"
        }
    )

# 404
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "message": f"Route not found: {request.method} {request.url.path}"
        }
    )

# Startup and shutdown
@app.on_event("startup")
async def startup():
    await init_database()

@app.on_event("shutdown")
async def shutdown():
    await close_connection()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)