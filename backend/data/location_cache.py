from data.mongo import db
from datetime import datetime

locations = db.locations


async def get_cached_location(address: str):
    return await locations.find_one({"address": address})


async def save_location_cache(
    address: str,
    lat: float,
    lng: float,
    place_id: str | None,
    formatted_address: str,
):
    await locations.update_one(
        {"address": address},
        {
            "$set": {
                "address": address,
                "lat": lat,
                "lng": lng,
                "place_id": place_id,
                "formatted_address": formatted_address,
                "updated_at": datetime.utcnow(),
            }
        },
        upsert=True,
    )
