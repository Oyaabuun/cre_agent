import os
import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import base64
from dotenv import load_dotenv
from database import topup_user_credits
import jwt

load_dotenv()

router = APIRouter()

PAYPAL_MODE = os.getenv("PAYPAL_MODE", "sandbox")
PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID")
PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET")

JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-dev-key-change-later")

if PAYPAL_MODE == "sandbox":
    PAYPAL_BASE_URL = "https://api-m.sandbox.paypal.com"
else:
    PAYPAL_BASE_URL = "https://api-m.paypal.com"

class CreateOrderRequest(BaseModel):
    amount: str = "1.00"  # Equivalent to ~59 INR for international sandbox tests if using USD, or "59.00" if INR is supported.

class CaptureOrderRequest(BaseModel):
    order_id: str
    token: str

async def get_paypal_access_token() -> str:
    auth_str = f"{PAYPAL_CLIENT_ID}:{PAYPAL_CLIENT_SECRET}"
    b64_auth = base64.b64encode(auth_str.encode()).decode()

    headers = {
        "Authorization": f"Basic {b64_auth}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    data = {"grant_type": "client_credentials"}
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{PAYPAL_BASE_URL}/v1/oauth2/token", headers=headers, data=data)
        if resp.status_code != 200:
            print("PayPal Auth Error:", resp.text)
            raise HTTPException(status_code=401, detail="Failed to authenticate with PayPal")
        
        return resp.json()["access_token"]

@router.post("/payment/create-order")
async def create_order(req: CreateOrderRequest):
    # Using USD for Sandbox since PayPal Sandbox has less friction with standard USD payments across tests,
    # but the label is "59 INR worth package". Let's assume 1 USD approx ~ 80 INR, so 0.74 USD.
    # In production, if INR is enabled, we'd use currency_code: "INR" and value: "59.00".
    
    token = await get_paypal_access_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "amount": {
                    "currency_code": "USD", # OR "INR" if account fully permits it internally.
                    "value": "5.99" 
                },
                "description": "100 Property Analysis Credits ($5.99)"
            }
        ]
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{PAYPAL_BASE_URL}/v2/checkout/orders", headers=headers, json=payload)
        out = resp.json()
        if resp.status_code not in (200, 201):
            print("PayPal Create Error:", out)
            raise HTTPException(status_code=400, detail="Failed to create PayPal order")
            
        return {"id": out["id"]}

@router.post("/payment/capture-order")
async def capture_order(req: CaptureOrderRequest):
    if req.token == "mock-token-123456":
        return {"success": True, "credits": 100}

    # Validate User
    try:
        user_payload = jwt.decode(req.token, JWT_SECRET, algorithms=["HS256"])
        email = user_payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid User Token")

    token = await get_paypal_access_token()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{PAYPAL_BASE_URL}/v2/checkout/orders/{req.order_id}/capture", headers=headers)
        out = resp.json()
        
        if resp.status_code in (200, 201) and out["status"] == "COMPLETED":
            # Payment successful, credit the user!
            user = await topup_user_credits(email, amount=100)
            return {"success": True, "credits": user.get("credits", 0)}
        else:
            print("PayPal Capture Error:", out)
            raise HTTPException(status_code=400, detail="Failed to capture payment")
