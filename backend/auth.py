import os
import datetime
import urllib.parse
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import jwt
import httpx
from dotenv import load_dotenv

from database import find_user_by_email, create_user_with_initial_credits

load_dotenv()

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-dev-key-change-later")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

class OTPSendRequest(BaseModel):
    contact: str  # email or phone

class OTPVerifyRequest(BaseModel):
    contact: str
    code: str

class GoogleLoginRequest(BaseModel):
    id_token: str

def create_jwt_token(email: str):
    expiration = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    payload = {
        "sub": email,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

@router.post("/auth/otp/send")
async def send_otp(req: OTPSendRequest):
    # In a real scenario, use Twilio / SendGrid here.
    # We mock it to '123456'
    print(f"DEBUG: Sent mock OTP '123456' to {req.contact}")
    return {"message": f"OTP sent successfully to {req.contact}"}

@router.post("/auth/otp/verify")
async def verify_otp(req: OTPVerifyRequest):
    if req.code != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP code")
    
    # Check if user exists
    user = await find_user_by_email(req.contact)
    if not user:
        user = await create_user_with_initial_credits(req.contact, name="User", source="otp")
    
    token = create_jwt_token(user["email"])
    return {
        "token": token,
        "user": {
            "name": user.get("name"),
            "email": user["email"],
            "credits": user.get("credits", 0)
        }
    }

@router.post("/auth/google")
async def google_auth(req: GoogleLoginRequest):
    # Verify token with google
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={req.id_token}")
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid Google token")
        
        user_info = resp.json()
        
        # Optionally verify AUD matches GOOGLE_CLIENT_ID
        if GOOGLE_CLIENT_ID and user_info.get("aud") != GOOGLE_CLIENT_ID:
            print(f"WARN: Token AUD {user_info.get('aud')} doesn't match client ID")
            
        email = user_info.get("email")
        name = user_info.get("name", "Google User")
        
        user = await find_user_by_email(email)
        if not user:
            user = await create_user_with_initial_credits(email, name, source="google")
            
        token = create_jwt_token(email)
        return {
            "token": token,
            "user": {
                "name": user.get("name"),
                "email": user["email"],
                "credits": user.get("credits", 0)
            }
        }

@router.get("/auth/me")
async def get_me(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        email = payload.get("sub")
        user = await find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "user": {
                "name": user.get("name"),
                "email": user["email"],
                "credits": user.get("credits", 0)
            }
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
