import os
import motor.motor_asyncio
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
DB_NAME = os.getenv("DB_NAME", "property_ai")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

user_info_collection = db["user_info"]
property_cache_collection = db["property_cache"]

async def find_user_by_email(email: str):
    return await user_info_collection.find_one({"email": email})

async def create_user_with_initial_credits(email: str, name: str, source: str = "google"):
    user = {
        "email": email,
        "name": name,
        "source": source,
        "credits": 0,  # Starts with 0 credits until they pay minimum amount
    }
    await user_info_collection.insert_one(user)
    return await find_user_by_email(email)

async def topup_user_credits(email: str, amount: int = 5):
    await user_info_collection.update_one(
        {"email": email},
        {"$inc": {"credits": amount}}
    )
    return await find_user_by_email(email)

async def consume_user_credit(email: str):
    user = await find_user_by_email(email)
    if not user or user.get("credits", 0) <= 0:
        return False
    await user_info_collection.update_one(
        {"email": email},
        {"$inc": {"credits": -1}}
    )
    return True

async def get_cached_property(cache_key: str):
    return await property_cache_collection.find_one({"cache_key": cache_key})

async def save_property_to_cache(cache_key: str, data: dict):
    # Upsert the cache entry
    await property_cache_collection.update_one(
        {"cache_key": cache_key},
        {"$set": {"data": data}},
        upsert=True
    )
