from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext
from services.firebase import db
from models.user import UserCreate, UserLogin
from models.token import create_access_token


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
    existing = list(
    users_ref.where("email", "==", user.email).limit(1).stream()
)


    if list(existing):
        raise HTTPException(status_code=400, detail="User already exists")

    # Hash password safely
    hashed_password = pwd_context.hash(user.password)

    users_ref.add({
        "name": user.name,
        "email": user.email,
        "password": hashed_password,
        "role": user.role
    })

    return {"message": "User created successfully"}


@router.post("/login")
async def login(user: UserLogin):
    users_ref = db.collection("users")
    users = users_ref.where("email", "==", user.email).stream()

    user_doc = None
    for doc in users:
        user_doc = doc.to_dict()

    if not user_doc:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Verify password safely
    if not pwd_context.verify(user.password, user_doc["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({
        "email": user_doc["email"],
        "role": user_doc["role"]
    })

    return {"access_token": token, "role": user_doc["role"]}
