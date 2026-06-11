import os
import json
import httpx
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

async def fetch_market_benchmarks(
    location_str: str, 
    property_type: str, 
    intent: str,
    sublocality: str | None = None,
    locality: str | None = None,
    city: str | None = None
) -> dict:
    """
    Directly Googles real-time market benchmarks using Gemini 3 Search Grounding.
    Strictly focuses on the specific micro-market provided.
    """
    # Build a precise search query
    micro_market = sublocality or locality or location_str
    macro_market = city or locality or "India"
    
    prompt_template = f"""
    Research the current typical {intent} price/rent for a {property_type} strictly in the micro-market of {micro_market}, {macro_market}, India.
    Do NOT provide general city-level data if micro-market data for {micro_market} is available. 
    If you find data for a different city (like Mumbai), ignore it and focus only on the {micro_market} area.
    
    Return ONLY a JSON object:
    {{
        "low": <numeric_min>,
        "high": <numeric_max>,
        "currency": "INR",
        "summary": "1-sentence summary focusing on the specific micro-market {micro_market}",
        "sources": ["list of urls or specific sources found"]
    }}
    """
    
    # 1. Try Live Search
    try:
        search_prompt = prompt_template
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=search_prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                response_mime_type="application/json"
            )
        )
        data = json.loads(response.text)
        
        if data.get("high", 0) > 0:
            return {
                "source": "Live Google Research",
                "benchmark_low": data.get("low", 0),
                "benchmark_high": data.get("high", 0),
                "summary": data.get("summary", ""),
                "citations": data.get("sources", []),
                "confidence": 0.9,
                "is_live": True
            }
    except Exception as e:
        print(f"DEBUG: Live search failed: {e}")

    # 2. Fallback to Internal Knowledge (with strict localization)
    try:
        fallback_prompt = prompt_template
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=fallback_prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        data = json.loads(response.text)
        return {
            "source": "Gemini Market Intelligence",
            "benchmark_low": data.get("low", 0),
            "benchmark_high": data.get("high", 0),
            "summary": data.get("summary", ""),
            "confidence": 0.7,
            "is_live": False
        }
    except Exception as e:
        print(f"DEBUG: Internal fallback failed: {e}")
        return {
            "source": "FallbackHeuristic",
            "benchmark_low": 0,
            "benchmark_high": 0,
            "confidence": 0.0,
            "is_live": False
        }

async def fetch_road_info(address: str) -> dict:
    """
    Researches road width and infrastructure details using Gemini 3 Search.
    """
    prompt = f"""
    Research the road width and access conditions for the property at {address}.
    If exact data for the address is missing, research the typical road width of the immediate street or sub-locality.
    Identify:
    - Estimated road width in feet (numeric, e.g., 30, 40, 60).
    - Number of lanes (e.g., 2, 4).
    - Any access restrictions (one-way, dead-end, etc).
    
    Return ONLY a JSON object:
    {{
        "width_ft": <numeric_width or null>,
        "lanes": <numeric_lanes or null>,
        "conditions": "brief description of road access (e.g., Wide main road, narrow residential lane)",
        "reliability": "high|medium|low"
    }}
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                response_mime_type="application/json"
            )
        )
        data = json.loads(response.text)
        return {
            "width_ft": data.get("width_ft"),
            "lanes": data.get("lanes"),
            "conditions": data.get("conditions", ""),
            "source": "Researched via Live Search",
            "confidence": 0.6 if data.get("reliability") == "medium" else 0.8 if data.get("reliability") == "high" else 0.4,
            "is_live": True
        }
    except Exception as e:
        print(f"DEBUG: Road research failed: {e}")
        return {
            "width_ft": None,
            "lanes": None,
            "source": "not_available"
        }
