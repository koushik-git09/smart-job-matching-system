from datetime import datetime
import inspect
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from passlib.context import CryptContext
from services.firebase import db
from models.user import UserCreate, UserLogin
from models.token import create_access_token, verify_token


router = APIRouter()

async def _maybe_await(value: Any) -> Any:
    """Resolve Firestore calls for both sync and async clients."""

    if inspect.isawaitable(value):
        return await value
    return value

# ✅ FIXED HASHING (no 72 byte limit)
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=10
)


@router.post("/signup")
async def signup(user: UserCreate):
    users_ref = db.collection("users")
    user_doc_ref = users_ref.document(user.email)
    existing = await _maybe_await(user_doc_ref.get())
    if existing.exists:
        raise HTTPException(status_code=400, detail="User already exists")

    # Hash password safely
    hashed_password = pwd_context.hash(user.password)

    user_doc_ref.set({
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "role": user.role
    })

    return {"message": "User created successfully"}


@router.post("/login")
async def login(user: UserLogin):
    user_doc_ref = db.collection("users").document(user.email)
    snapshot = await _maybe_await(user_doc_ref.get())
    if not snapshot.exists:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    user_doc = snapshot.to_dict() or {}
    password_hash = user_doc.get("password")
    email = user_doc.get("email")
    role = user_doc.get("role")

    if not isinstance(password_hash, str) or not isinstance(email, str) or not isinstance(role, str):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Verify password safely
    if not pwd_context.verify(user.password, password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({
        "email": email,
        "role": role,
    })

    # Track login state in Firestore to enable recruiter-side filtering.
    user_doc_ref.set(
        {
            "is_logged_in": True,
            "last_login_at": datetime.utcnow(),
        },
        merge=True,
    )

    return {"access_token": token, "role": role}


@router.post("/logout")
async def logout(current_user: dict = Depends(verify_token)):
    """Best-effort logout marker.

    The client still clears its local token; this endpoint only updates
    Firestore fields (used for recruiter filtering of 'logged in' jobseekers).
    """

    user_doc_ref = db.collection("users").document(current_user["email"])
    user_doc_ref.set(
        {
            "is_logged_in": False,
            "last_logout_at": datetime.utcnow(),
        },
        merge=True,
    )
    return {"message": "Logged out"}


@router.get("/me")
async def me(current_user: dict = Depends(verify_token)):
    """Return the current user's public profile fields."""

    user_doc_ref = db.collection("users").document(current_user["email"])
    snap = await _maybe_await(user_doc_ref.get())
    if not snap.exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_doc = snap.to_dict() or {}
    return {
        "email": user_doc.get("email") or current_user.get("email"),
        "role": user_doc.get("role") or current_user.get("role"),
        "name": user_doc.get("name") or "",
    }
