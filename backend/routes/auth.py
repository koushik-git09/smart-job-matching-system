from fastapi import APIRouter, Depends, HTTPException
from passlib.context import CryptContext
from services.firebase import db
from models.user import UserCreate, UserLogin
from models.token import create_access_token, verify_token


router = APIRouter()

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
    if user_doc_ref.get().exists:
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
    snapshot = user_doc_ref.get()
    if not snapshot.exists:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    user_doc = snapshot.to_dict()

    # Verify password safely
    if not pwd_context.verify(user.password, user_doc["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({
        "email": user_doc["email"],
        "role": user_doc["role"]
    })

    return {"access_token": token, "role": user_doc["role"]}


@router.get("/me")
async def me(current_user: dict = Depends(verify_token)):
    """Return the current user's public profile fields."""

    user_doc_ref = db.collection("users").document(current_user["email"])
    snap = user_doc_ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_doc = snap.to_dict() or {}
    return {
        "email": user_doc.get("email") or current_user.get("email"),
        "role": user_doc.get("role") or current_user.get("role"),
        "name": user_doc.get("name") or "",
    }
