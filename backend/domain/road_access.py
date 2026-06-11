"""
Road Access / Frontage Signal (India-first)

Classifies plots purely on ROAD WIDTH (feet),
which is the single strongest determinant of:
- land value
- construction feasibility
- resale liquidity in Tier 2/3 India
"""

from typing import Optional
from data.signal_cache import get_signal_cache, save_signal_cache
from utils.market_research import fetch_road_info


# -------------------------------------------------------------------
# Authoritative India-grounded width rules (FEET)
# -------------------------------------------------------------------

ROAD_WIDTH_RULES = [
    {
        "category": "excellent",
        "label": "Excellent road frontage (≥35 ft)",
        "min_ft": 35,
        "price_multiplier": 1.15,
        "liquidity_factor": 0.75,
    },
    {
        "category": "good",
        "label": "Good internal road (30–34 ft)",
        "min_ft": 30,
        "price_multiplier": 1.05,
        "liquidity_factor": 0.9,
    },
    {
        "category": "average",
        "label": "Average residential road (20–29 ft)",
        "min_ft": 20,
        "price_multiplier": 0.95,
        "liquidity_factor": 1.1,
    },
    {
        "category": "bad",
        "label": "Narrow access / gali (<20 ft)",
        "min_ft": 0,
        "price_multiplier": 0.8,
        "liquidity_factor": 1.4,
    },
]


# -------------------------------------------------------------------
# Core signal
# -------------------------------------------------------------------

async def road_access_signal(
    location: dict,
    *,
    user_road_width_ft: Optional[float] = None,
) -> dict:
    """
    Road frontage classification.

    Philosophy:
    - Width > road name
    - User input > inference
    - Low confidence > wrong confidence
    """

    cache_key = (
        f"road_access:{location.get('lat')}:{location.get('lng')}:"
        f"{user_road_width_ft}"
    )

    cached = await get_signal_cache(cache_key)
    if cached:
        return cached["data"]

    # -------------------------
    # Width determination
    # -------------------------
    confidence = 0.4
    width_ft = None
    research_data = None

    if user_road_width_ft:
        width_ft = float(user_road_width_ft)
        confidence = 0.9
    else:
        # Try live research
        try:
            research_data = await fetch_road_info(location.get("address", ""))
            if research_data.get("width_ft"):
                width_ft = float(research_data["width_ft"])
                confidence = research_data.get("confidence", 0.5)
        except Exception as e:
            print(f"DEBUG: Road info research failed: {e}")

    # -------------------------
    # Unknown width fallback
    # -------------------------
    if width_ft is None:
        result = {
            "category": "unknown",
            "label": "Road width not verified",
            "confidence": confidence,
            "price_multiplier": 1.0,
            "liquidity_factor": 1.0,
            "details": {
                "road_width_ft": None,
                "source": "not_provided",
            },
            "summary": (
                "Exact road width could not be verified. "
                "Internal residential access is assumed, which may impact "
                "construction feasibility and resale liquidity."
            ),
        }
        await save_signal_cache(cache_key, result)
        return result

    # -------------------------
    # Classification
    # -------------------------
    for rule in ROAD_WIDTH_RULES:
        if width_ft >= rule["min_ft"]:
            summary = (
                f"Plot has approximately {int(width_ft)} ft road frontage, "
                f"classified as {rule['label'].lower()}."
            )
            if research_data and research_data.get("source") == "Researched via Live Search":
                summary = f"Researched Insight: {summary} Source: {research_data['source']} ({research_data.get('conditions', '')})"

            result = {
                "category": rule["category"],
                "label": rule["label"],
                "confidence": confidence,
                "price_multiplier": rule["price_multiplier"],
                "liquidity_factor": rule["liquidity_factor"],
                "details": {
                    "road_width_ft": width_ft,
                    "lanes": research_data.get("lanes") if research_data else None,
                    "classification_basis": "user_provided" if user_road_width_ft else "live_research",
                    "conditions": research_data.get("conditions") if research_data else None,
                    "is_live_research": research_data.get("is_live", False) if research_data else False
                },
                "summary": summary + " This materially impacts land value, construction ease, and long-term resale potential.",
            }
            await save_signal_cache(cache_key, result)
            return result

    # Defensive fallback (should never hit)
    result = {
        "category": "unknown",
        "label": "Unclassified road access",
        "confidence": confidence,
        "price_multiplier": 1.0,
        "liquidity_factor": 1.0,
        "details": {},
        "summary": "Unable to classify road access reliably.",
    }
    await save_signal_cache(cache_key, result)
    return result
