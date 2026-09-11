from datetime import datetime, timedelta, timezone
import os

import jwt
from bson import ObjectId
from fastapi import (
    APIRouter,
    HTTPException,
    Depends
)
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

from database import users_collection


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# =========================
# PASSWORD HASHING
# =========================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# =========================
# JWT CONFIGURATION
# =========================

SECRET_KEY = os.getenv("SECRET_KEY")

ALGORITHM = "HS256"

security = HTTPBearer()


# =========================
# REQUEST MODELS
# =========================

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# =========================
# CREATE JWT TOKEN
# =========================

def create_access_token(user_id: str):

    expires = (
        datetime.now(timezone.utc)
        + timedelta(hours=24)
    )

    payload = {
        "user_id": user_id,
        "exp": expires
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# =========================
# VERIFY JWT TOKEN
# =========================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        try:
            object_id = ObjectId(user_id)

        except Exception:
            raise HTTPException(
                status_code=401,
                detail="Invalid user ID"
            )

        user = users_collection.find_one(
            {"_id": object_id}
        )

        if not user:

            raise HTTPException(
                status_code=401,
                detail="User not found"
            )

        return user

    except jwt.ExpiredSignatureError:

        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )

    except jwt.InvalidTokenError:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


# =========================
# REGISTER
# =========================

@router.post("/register")
def register(user: RegisterRequest):

    existing_user = users_collection.find_one(
        {"email": user.email}
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = pwd_context.hash(
        user.password
    )

    user_data = {
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "role": "user",
        "created_at": datetime.now(timezone.utc)
    }

    result = users_collection.insert_one(
        user_data
    )

    return {
        "message": "Registration successful",
        "user_id": str(result.inserted_id)
    }


# =========================
# LOGIN
# =========================

@router.post("/login")
def login(user: LoginRequest):

    existing_user = users_collection.find_one(
        {"email": user.email}
    )

    if not existing_user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not pwd_context.verify(
        user.password,
        existing_user["password"]
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(
        str(existing_user["_id"])
    )

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(existing_user["_id"]),
            "name": existing_user["name"],
            "email": existing_user["email"],
            "role": existing_user["role"]
        }
    }
