import os
import httpx
from dotenv import load_dotenv

from data.location_cache import (
    get_cached_location,
    save_location_cache,
)

load_dotenv()

GEOCODE_API_KEY = os.getenv("GEOCODE_API_KEY")
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"


async def resolve_location(
    address: str | None = None,
    lat: float | None = None,
    lng: float | None = None,
) -> dict:
    """
    Resolve user input into a canonical location object.
    Uses MongoDB cache.
    Never crashes.
    """

    # -------------------------
    # Case 1: Lat/Lng provided
    # -------------------------
    if lat is not None and lng is not None:
        return {
            "lat": lat,
            "lng": lng,
            "source": "coordinates",
        }

    # -------------------------
    # Case 2: Address provided
    # -------------------------
    if address:
        address = address.strip()

        # 1️⃣ Check cache FIRST
        cached = await get_cached_location(address)
        if cached:
            return {
                "lat": cached["lat"],
                "lng": cached["lng"],
                "formatted_address": cached.get("formatted_address"),
                "place_id": cached.get("place_id"),
                "source": "cache",
            }

        # 2️⃣ Call Google Geocoding API
        params = {
            "address": address,
            "region": "in",
            "key": GEOCODE_API_KEY,
        }

        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(GEOCODE_URL, params=params)
            data = r.json()

        status = data.get("status")
        results = data.get("results", [])

        # 3️⃣ Success → save to cache
        if status == "OK" and results:
            result = results[0]
            loc = result["geometry"]["location"]

            # Extract sub-locality and city for better search grounding
            components = result.get("address_components", [])
            sublocality = next((c["long_name"] for c in components if "sublocality_level_1" in c["types"]), None)
            locality = next((c["long_name"] for c in components if "locality" in c["types"]), None)
            city = next((c["long_name"] for c in components if "administrative_area_level_2" in c["types"]), None)

            await save_location_cache(
                address=address,
                lat=loc["lat"],
                lng=loc["lng"],
                place_id=result.get("place_id"),
                formatted_address=result.get("formatted_address"),
            )

            return {
                "lat": loc["lat"],
                "lng": loc["lng"],
                "formatted_address": result.get("formatted_address"),
                "sublocality": sublocality,
                "locality": locality,
                "city": city,
                "place_id": result.get("place_id"),
                "source": "geocoded_address",
            }

        # 4️⃣ Failure → safe fallback
        return {
            "lat": None,
            "lng": None,
            "formatted_address": None,
            "source": "unresolved_address",
            "error": {
                "status": status,
                "input": address,
            },
        }

    # -------------------------
    # No valid input
    # -------------------------
    return {
        "lat": None,
        "lng": None,
        "source": "invalid_input",
    }
