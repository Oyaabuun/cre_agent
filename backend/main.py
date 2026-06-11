from fastapi import FastAPI
from pydantic import BaseModel
from decision_engine import evaluate_property
from agent_orchestrator import AgenticOrchestrator


from fastapi.middleware.cors import CORSMiddleware

from chat_property import get_property_chat_response
from database import get_cached_property, save_property_to_cache, consume_user_credit
from auth import router as auth_router
from payment import router as payment_router
import hashlib
import json

app = FastAPI(title="SiteMind AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(payment_router)

class DecisionInput(BaseModel):
    address: str | None = None
    lat: float | None = None
    lng: float | None = None

    asking_price: int
    property_type: str = "2bhk"
    radius_m: int = 2000
    intent: str = "buy"  # "buy" or "rent"
    custom_request: str | None = None
    land_area_sqft: float | None = None
    road_width_ft: float | None = None


class ChatInput(BaseModel):
    evaluation_data: dict
    message: str


@app.post("/decision")
async def decision(inp: DecisionInput):
    # Create cache key
    # rounding lat/lng to 4 decimal places roughly equals 11m precision
    lat_r = round(inp.lat, 4) if inp.lat else None
    lng_r = round(inp.lng, 4) if inp.lng else None
    
    cache_dict = {
        "lat": lat_r,
        "lng": lng_r,
        "price": inp.asking_price,
        "type": inp.property_type,
        "intent": inp.intent,
        "custom": inp.custom_request,
        "land_area_sqft": inp.land_area_sqft,
        "road_width_ft": inp.road_width_ft
    }
    
    key_str = json.dumps(cache_dict, sort_keys=True)
    cache_key = hashlib.md5(key_str.encode()).hexdigest()
    
    cached = await get_cached_property(cache_key)
    if cached:
        print("DEBUG: Served from Cache:", cache_key)
        return cached["data"]
        
    print("DEBUG: Cache miss, running evaluation")
    result = await evaluate_property(inp.dict())
    
    await save_property_to_cache(cache_key, result)
    return result

class ConsumeCreditRequest(BaseModel):
    token: str

@app.post("/consume-credit")
async def consume_credit(req: ConsumeCreditRequest):
    import jwt
    import os
    JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-dev-key-change-later")
    try:
        payload = jwt.decode(req.token, JWT_SECRET, algorithms=["HS256"])
        email = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    success = await consume_user_credit(email)
    if not success:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Not enough credits")
        
    return {"success": True}

@app.post("/chat/property")
async def chat_property(inp: ChatInput):
    response = await get_property_chat_response(inp.evaluation_data, inp.message)
    return {"response": response}

class AgentInput(BaseModel):
    prompt: str
    session_id: str | None = None
    token: str | None = None

@app.post("/agent/run")
async def run_cre_agent(inp: AgentInput):
    import jwt
    import os
    from fastapi import HTTPException
    
    JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-dev-key-change-later")
    
    if not inp.token:
        raise HTTPException(status_code=401, detail="Authentication token required")
        
    try:
        payload = jwt.decode(inp.token, JWT_SECRET, algorithms=["HS256"])
        email = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    success = await consume_user_credit(email)
    if not success:
        raise HTTPException(status_code=400, detail="Not enough credits")
        
    orchestrator = AgenticOrchestrator()
    result = await orchestrator.run_cre_agent(inp.prompt, session_id=inp.session_id)
    return result

