import os
import httpx
from dotenv import load_dotenv
import json

load_dotenv()
GEOCODE_API_KEY = os.getenv("GEOCODE_API_KEY")
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

async def test_geocode():
    params = {
        "address": "9th, block 1180, 26th Main Rd, Jayanagar, Bengaluru",
        "key": GEOCODE_API_KEY,
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(GEOCODE_URL, params=params)
        data = r.json()
        print(json.dumps(data["results"][0]["address_components"], indent=2))

import asyncio
asyncio.run(test_geocode())
