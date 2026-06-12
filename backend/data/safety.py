import os
import httpx
from dotenv import load_dotenv
from data.maps import PLACES_URL, MAPS_API_KEY, _distance_and_time
from llm_reasoner import analyze_safety_pulse

load_dotenv()

NEWSDATA_API_KEY = os.getenv("NEWSDATA_API_KEY")
PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

async def fetch_police_station_sentiment(location: dict) -> dict:
    params = {
        "location": f"{location['lat']},{location['lng']}",
        "rankby": "distance",
        "keyword": "police station",
        "key": MAPS_API_KEY
    }

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(PLACES_URL, params=params)
        data = r.json()

    results = data.get("results", [])
    valid_stations = [r for r in results if r.get("user_ratings_total", 0) > 0]

    if not valid_stations:
        if not results:
            return {"name": "No Police Station nearby", "distance_km": None, "rating": 0, "user_ratings_total": 0, "reviews": []}
        nearest = results[0]
    else:
        nearest = valid_stations[0]

    # Find nearest by actual distance
    dest = {
        "lat": nearest["geometry"]["location"]["lat"],
        "lng": nearest["geometry"]["location"]["lng"],
    }
    
    dist_info = await _distance_and_time(location, dest)
    place_id = nearest.get("place_id")
    
    details_params = {
        "place_id": place_id,
        "fields": "name,rating,user_ratings_total,reviews",
        "key": MAPS_API_KEY
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r2 = await client.get(PLACE_DETAILS_URL, params=details_params)
            details_data = r2.json()
            
        result = details_data.get("result", {})
    except:
        result = {}
        
    return {
        "name": result.get("name", nearest.get("name", "Unknown Police Station")),
        "distance_km": dist_info.get("distance_km"),
        "rating": result.get("rating", nearest.get("rating", 0)),
        "user_ratings_total": result.get("user_ratings_total", nearest.get("user_ratings_total", 0)),
        "reviews": [r.get("text") for r in result.get("reviews", []) if r.get("text")]
    }

async def fetch_crime_news(location: dict) -> list:
    if not NEWSDATA_API_KEY:
        return []
        
    city = location.get("city") or location.get("locality") or "Bengaluru"
    sublocality = location.get("sublocality") or city
    
    query = f"{sublocality} AND (crime OR safety OR police OR arrest OR theft OR vandalism)"
    
    params = {
        "apikey": NEWSDATA_API_KEY,
        "q": query,
        "country": "in",
        "language": "en"
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get("https://newsdata.io/api/1/latest", params=params)
            data = r.json()
            
        articles = data.get("results", [])
        snippets = []
        for a in articles[:10]:
            snippets.append({
                "title": a.get("title", ""),
                "description": a.get("description", ""),
                "pubDate": a.get("pubDate", "")
            })
        return snippets
    except Exception as e:
        print(f"DEBUG: Crime news API failed: {e}")
        return []

async def crime_safety_signal(location: dict) -> dict:
    police_data = await fetch_police_station_sentiment(location)
    news_snippets = await fetch_crime_news(location)
    
    # LLM reasoning
    llm_output = await analyze_safety_pulse(news_snippets, police_data.get("reviews", []))
    
    # Base score
    score = llm_output.get("crime_score", 0.5)
    
    dist_str = f"{police_data['distance_km']:.1f} km away" if police_data.get("distance_km") else "Distance unknown"
    
    return {
        "score": score,
        "summary": llm_output.get("sentiment_summary", "Safety data analyzed."),
        "details": {
            "primary_police_jurisdiction": f"{police_data.get('name', 'Unknown')} ({dist_str})",
            "local_sentiment": f"{police_data.get('rating', 0)} ⭐ (Based on {police_data.get('user_ratings_total', 0)} reviews)",
            "top_review_themes": llm_output.get("top_review_themes", "N/A"),
            "incident_profile": llm_output.get("incident_profile", "N/A"),
            "is_live_research": True
        }
    }
