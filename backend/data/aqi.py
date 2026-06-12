import os
import httpx

AQI_API_TOKEN = os.getenv("AQI_API_TOKEN")
WAQI_URL = "https://api.waqi.info/feed/geo:{lat};{lng}/"


def _aqi_to_score_india(aqi: int) -> tuple[float, str]:
    """
    India-aware AQI normalization.
    """
    if aqi <= 50:
        return 0.85, "Good (Indian standard)"
    elif aqi <= 100:
        return 0.70, "Satisfactory (typical urban India)"
    elif aqi <= 200:
        return 0.45, "Moderate pollution (health impact possible)"
    elif aqi <= 300:
        return 0.25, "Poor air quality (respiratory risk)"
    else:
        return 0.10, "Severe air pollution (avoid outdoor exposure)"


async def fetch_aqi_signal(location: dict) -> dict:
    if not AQI_API_TOKEN:
        return {
            "score": 0.4,
            "summary": "AQI token not configured; assuming moderate air quality risk",
            "details": {"confidence": "low"},
        }

    url = WAQI_URL.format(
        lat=location["lat"],
        lng=location["lng"]
    )

    params = {"token": AQI_API_TOKEN}

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params)
        data = r.json()

    try:
        if data.get("status") != "ok":
            raise ValueError("WAQI returned non-ok status")

        aqi = data["data"]["aqi"]

        # Dominant pollutant (if available)
        dominant = (
            data["data"]
            .get("dominentpol", "unknown")
            .lower()
        )

        score, category = _aqi_to_score_india(aqi)

        return {
            "score": score,
            "summary": (
                f"Air quality is {category}. "
                f"Dominant pollutant: {dominant}."
            ),
            "details": {
                "raw_aqi": aqi,
                "normalized_category": category,
                "dominant_pollutant": dominant,
                "data_source": "waqi",
            },
        }

    except Exception:
        return {
            "score": 0.4,
            "summary": "AQI data unavailable or unreliable; assuming moderate risk",
            "details": {
                "data_source": "waqi",
                "confidence": "low",
            },
        }
