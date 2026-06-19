"""
GoClick ERP – Auth API Endpoints
POST /api/auth/login
GET  /api/auth/me
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from app.core.security import create_access_token, decode_token, verify_password
from app.seed_data import EMPLOYEES

router = APIRouter(prefix="/api/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    emp = next((e for e in EMPLOYEES if e["id"] == payload.get("sub")), None)
    if not emp:
        raise HTTPException(status_code=401, detail="User not found")
    return emp


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    emp = next((e for e in EMPLOYEES if e["email"] == body.email), None)
    if not emp or not verify_password(body.password, emp["password"]):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    token = create_access_token({"sub": emp["id"], "role": emp["role"]})
    safe_emp = {k: v for k, v in emp.items() if k != "password"}
    return {"access_token": token, "token_type": "bearer", "user": safe_emp}


@router.get("/me")
async def get_me(authorization: Optional[str] = Header(None)):
    user = get_current_user(authorization)
    return {k: v for k, v in user.items() if k != "password"}
