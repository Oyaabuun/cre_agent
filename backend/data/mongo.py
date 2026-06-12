import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()  # <-- THIS LINE IS CRITICAL

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

if not MONGO_URI or not DB_NAME:
    raise RuntimeError(
        "Missing MONGO_URI or DB_NAME in environment variables"
    )

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]
