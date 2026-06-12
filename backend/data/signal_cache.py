from data.mongo import db
from datetime import datetime

signals_cache = db.signals_cache


async def get_signal_cache(key: str):
    return await signals_cache.find_one({"key": key})


async def save_signal_cache(key: str, data: dict):
    await signals_cache.update_one(
        {"key": key},
        {
            "$set": {
                "data": data,
                "updated_at": datetime.utcnow(),
            }
        },
        upsert=True,
    )
