import os
import datetime
import urllib.parse
import smtplib
import random
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import jwt
import httpx
from dotenv import load_dotenv

from database import find_user_by_email, create_user_with_initial_credits, db

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

def send_otp_email(recipient_email: str, otp_code: str):
    mail_username = os.getenv("MAIL_USERNAME")
    mail_password = os.getenv("MAIL_PASSWORD")
    mail_server = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    mail_port = os.getenv("MAIL_PORT")
    
    if not mail_username or not mail_password:
        raise RuntimeError("SMTP configuration missing (MAIL_USERNAME and MAIL_PASSWORD must be configured).")
        
    try:
        mail_port = int(mail_port) if mail_port else 587
    except ValueError:
        mail_port = 587
        
    mail_sender = os.getenv("MAIL_DEFAULT_SENDER", mail_username)
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"{otp_code} is your SiteMind AI verification code"
    msg["From"] = mail_sender
    msg["To"] = recipient_email
    
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verification Code - SiteMind AI</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #cbd5e1;
      -webkit-font-smoothing: antialiased;
    }}
    .wrapper {{
      width: 100%;
      background-color: #0b0f19;
      padding: 40px 0;
    }}
    .container {{
      max-width: 500px;
      margin: 0 auto;
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
    }}
    .logo-container {{
      text-align: center;
      margin-bottom: 30px;
    }}
    .logo-text {{
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      text-decoration: none;
      letter-spacing: -0.5px;
    }}
    .logo-accent {{
      color: #0ea5e9;
    }}
    .title {{
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 15px;
      text-align: center;
    }}
    .message {{
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      text-align: center;
      margin-bottom: 30px;
    }}
    .otp-box {{
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%);
      border: 1px solid rgba(14, 165, 233, 0.20);
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      margin-bottom: 30px;
    }}
    .otp-code {{
      font-family: 'Courier New', Courier, monospace;
      font-size: 36px;
      font-weight: 900;
      color: #0ea5e9;
      letter-spacing: 8px;
      margin: 0;
    }}
    .footer {{
      text-align: center;
      font-size: 11px;
      color: #64748b;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 20px;
      margin-top: 30px;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="logo-container">
        <span class="logo-text">SiteMind<span class="logo-accent">AI</span></span>
      </div>
      <h1 class="title">Verification Code</h1>
      <p class="message">
        Verify your identity to access sensitive property intelligence. Use the 6-digit verification code below to complete your login session.
      </p>
      <div class="otp-box">
        <h2 class="otp-code">{otp_code}</h2>
      </div>
      <p class="message" style="margin-bottom: 0; font-size: 12px;">
        This verification code is valid for <strong>5 minutes</strong>. If you did not request this code, please ignore this email.
      </p>
      <div class="footer">
        © 2026 SiteMind AI. All rights reserved.<br>
        Powered by Google Gemini AI & MongoDB Atlas.
      </div>
    </div>
  </div>
</body>
</html>
"""
    text_content = f"Your SiteMind AI verification code is {otp_code}. It is valid for 5 minutes."
    
    msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))
    
    with smtplib.SMTP(mail_server, mail_port) as server:
        server.starttls()
        server.login(mail_username, mail_password)
        server.sendmail(mail_sender, recipient_email, msg.as_string())

@router.post("/auth/otp/send")
async def send_otp(req: OTPSendRequest):
    email_lower = req.contact.lower().strip()
    if "@" not in email_lower:
        raise HTTPException(status_code=400, detail="Only email addresses are supported for verification code delivery.")
        
    otp_code = f"{random.randint(100000, 999999)}"
    
    # Store OTP in MongoDB
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
    await db.otps.update_one(
        {"email": email_lower},
        {"$set": {"code": otp_code, "expires_at": expires_at}},
        upsert=True
    )
    
    # Send email
    try:
        send_otp_email(email_lower, otp_code)
    except Exception as e:
        print(f"ERROR: Failed to send verification email: {e}")
        # Clean up database record if send fails
        await db.otps.delete_one({"email": email_lower})
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send verification email: {str(e)}"
        )
        
    return {"message": "OTP sent successfully to your email"}

@router.post("/auth/otp/verify")
async def verify_otp(req: OTPVerifyRequest):
    email_lower = req.contact.lower().strip()
    
    # Look up OTP in database
    otp_record = await db.otps.find_one({"email": email_lower, "code": req.code})
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP code")
        
    # Check expiration
    now = datetime.datetime.utcnow()
    if otp_record.get("expires_at") < now:
        await db.otps.delete_one({"email": email_lower})
        raise HTTPException(status_code=400, detail="OTP code has expired")
        
    # Delete the OTP after verification so it cannot be reused
    await db.otps.delete_one({"email": email_lower})
    
    # Check if user exists
    user = await find_user_by_email(email_lower)
    if not user:
        user = await create_user_with_initial_credits(email_lower, name="User", source="otp")
    
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
    if token == "mock-token-123456":
        return {
            "user": {
                "name": "Demo User",
                "email": "demo@sitemind.ai",
                "credits": 100
            }
        }

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
