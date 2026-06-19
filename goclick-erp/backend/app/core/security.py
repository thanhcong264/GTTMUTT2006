"""
GoClick ERP – FastAPI Security Module (JWT + RBAC)
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = "goclick-erp-secret-key-2024-very-secure"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Role permissions map
ROLE_PERMISSIONS = {
    "admin": ["*"],
    "hr": ["attendance.*", "leave.*", "employee.read", "workflow.hr.*"],
    "affiliate_manager": ["affiliate.*", "workflow.affiliate.review", "attendance.read", "employee.read"],
    "accountant": ["payout.*", "workflow.affiliate.approve", "report.*"],
    "employee": ["attendance.own", "leave.own"],
}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # For demo: direct compare (no hashing in mock data)
    return plain_password == hashed_password


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def has_permission(role: str, permission: str) -> bool:
    perms = ROLE_PERMISSIONS.get(role, [])
    if "*" in perms:
        return True
    for p in perms:
        if p == permission or p.endswith(".*") and permission.startswith(p[:-1]):
            return True
    return False
