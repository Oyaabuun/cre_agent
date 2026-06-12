import os
import httpx
from dotenv import load_dotenv

load_dotenv()

MAPS_API_KEY = os.getenv("MAPS_API_KEY")

PLACES_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
DIST_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json"
ELEVATION_URL = "https://maps.googleapis.com/maps/api/elevation/json"

# Fixed epoch for weekday 9:00 AM IST (peak traffic simulation)
PEAK_HOUR_EPOCH = 1735708200


# -------------------------
# INTERNAL HELPERS
# -------------------------

async def _distance_and_time(origin: dict, dest: dict) -> dict:
    params = {
        "origins": f"{origin['lat']},{origin['lng']}",
        "destinations": f"{dest['lat']},{dest['lng']}",
        "departure_time": "now",  # ✅ Real-time traffic
        "traffic_model": "best_guess",
        "key": MAPS_API_KEY
    }

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(DIST_MATRIX_URL, params=params)
        data = r.json()

    try:
        if data.get("status") != "OK":
            return {"distance_km": 5.0, "duration_min": 20.0} # More reasonable fallback

        element = data["rows"][0]["elements"][0]
        if element.get("status") != "OK":
            return {"distance_km": 5.0, "duration_min": 20.0}

        return {
            "distance_km": element["distance"]["value"] / 1000,
            "duration_min": element["duration_in_traffic"]["value"] / 60
        }
    except Exception:
        return {"distance_km": 5.0, "duration_min": 20.0}


def _traffic_penalty(duration_min: float, distance_km: float) -> float:
    expected = distance_km * 2.5  
    ratio = duration_min / max(expected, 1)

    if ratio <= 1.3: return 1.0
    elif ratio <= 1.8: return 0.7
    elif ratio <= 2.5: return 0.4
    else: return 0.2


# -------------------------
# HOSPITAL ACCESS
# -------------------------

async def hospital_access_signal(location: dict) -> dict:
    params = {
        "location": f"{location['lat']},{location['lng']}",
        "radius": 5000,
        "keyword": "hospital",
        "key": MAPS_API_KEY
    }

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(PLACES_URL, params=params)
        data = r.json()

    results = data.get("results", [])
    if not results:
        return {
            "score": 0.2,
            "summary": "No major hospital found within 5 km",
            "details": {"nearby_hospitals": []}
        }

    # Fetch top 5 hospitals
    hospitals = []
    for h in results[:5]:
        dest = {
            "lat": h["geometry"]["location"]["lat"],
            "lng": h["geometry"]["location"]["lng"],
        }
        dist = await _distance_and_time(location, dest)
        hospitals.append({
            "name": h["name"],
            "distance_km": round(dist["distance_km"], 1),
            "duration_min": round(dist["duration_min"], 0),
            "address": h.get("vicinity", "")
        })

    # Scoring based on the nearest one
    nearest = min(hospitals, key=lambda x: x["duration_min"])
    traffic_score = _traffic_penalty(nearest["duration_min"], nearest["distance_km"])

    if nearest["distance_km"] <= 3: base = 1.0
    elif nearest["distance_km"] <= 6: base = 0.6
    else: base = 0.3

    final_score = round(base * traffic_score, 2)

    return {
        "score": final_score,
        "summary": (
            f"Nearest hospital '{nearest['name']}' is "
            f"{nearest['distance_km']:.1f} km away "
            f"({nearest['duration_min']:.0f} min with live traffic)"
        ),
        "details": {
            "nearby_hospitals": hospitals,
            "nearest_hospital": nearest["name"],
            "traffic_applied": True
        },
    }


# -------------------------
# COMMUTE STRESS
# -------------------------

async def commute_stress_signal(home: dict, work_hub: dict) -> dict:
    dist = await _distance_and_time(home, work_hub)
    mins = dist["duration_min"]

    if mins <= 30:
        score = 1.0
        label = "Low commute stress"
    elif mins <= 45:
        score = 0.7
        label = "Moderate commute stress"
    elif mins <= 60:
        score = 0.4
        label = "High commute stress"
    else:
        score = 0.2
        label = "Severe daily commute stress"

    return {
        "score": score,
        "summary": f"{label} ({mins:.0f} min travel time)",
        "details": {
            "duration_min": round(mins, 1),
            "distance_km": round(dist["distance_km"], 1),
        },
    }


# -------------------------
# SCHOOL DENSITY
# -------------------------

async def school_density_signal(location: dict) -> dict:
    params = {
        "location": f"{location['lat']},{location['lng']}",
        "radius": 3000,
        "type": "school",
        "key": MAPS_API_KEY
    }

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(PLACES_URL, params=params)
        data = r.json()

    results = data.get("results", [])
    count = len(results)

    # Fetch travel times for top 3 schools
    schools = []
    for s in results[:3]:
        dest = {
            "lat": s["geometry"]["location"]["lat"],
            "lng": s["geometry"]["location"]["lng"],
        }
        dist = await _distance_and_time(location, dest)
        schools.append({
            "name": s["name"],
            "distance_km": round(dist["distance_km"], 1),
            "duration_min": round(dist["duration_min"], 0)
        })

    if count >= 6:
        score = 1.0
        label = "Excellent school access"
    elif count >= 3:
        score = 0.7
        label = "Moderate school access"
    elif count >= 1:
        score = 0.4
        label = "Limited school access"
    else:
        score = 0.2
        label = "Poor school access"

    return {
        "score": score,
        "summary": f"{label} ({count} schools within 3 km)",
        "details": {
            "school_count": count,
            "nearby_schools": schools
        }
    }


# -------------------------
# FLOOD RISK
# -------------------------

async def flood_risk_signal(location: dict) -> dict:
    params = {
        "locations": f"{location['lat']},{location['lng']}",
        "key": MAPS_API_KEY,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(ELEVATION_URL, params=params)
        elev_data = r.json()

    elevation = None
    results = elev_data.get("results", [])
    if results:
        elevation = results[0].get("elevation")

    water_params = {
        "location": f"{location['lat']},{location['lng']}",
        "radius": 2000,
        "keyword": "lake river canal drain nallah",
        "key": MAPS_API_KEY,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(PLACES_URL, params=water_params)
        water_data = r.json()

    water_nearby = len(water_data.get("results", [])) > 0

    if elevation is None:
        return {
            "score": 0.4,
            "summary": "Flood risk uncertain (elevation unavailable)",
            "details": {
                "elevation_m": None,
                "water_bodies_nearby": water_nearby,
            },
        }

    if elevation < 20 and water_nearby:
        score = 0.2
        label = "High flood risk during heavy rains"
    elif elevation < 40:
        score = 0.4
        label = "Moderate flood risk"
    elif elevation < 80:
        score = 0.6
        label = "Low to moderate flood risk"
    else:
        score = 0.8
        label = "Low flood risk"

    return {
        "score": score,
        "summary": f"{label} (elevation: {elevation:.1f} m)",
        "details": {
            "elevation_m": round(elevation, 1),
            "water_bodies_nearby": water_nearby,
        },
    }
