import asyncio
import os
from data.maps import _distance_and_time, hospital_access_signal
from dotenv import load_dotenv

load_dotenv()

async def test():
    # Test location (roughly Bengaluru)
    loc = {"lat": 12.9716, "lng": 77.5946}
    print("Testing hospital_access_signal...")
    result = await hospital_access_signal(loc)
    print(result)

if __name__ == "__main__":
    asyncio.run(test())
