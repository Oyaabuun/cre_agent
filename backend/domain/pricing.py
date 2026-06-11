from data.repositories import get_transactions
from statistics import median
from utils.market_research import fetch_market_benchmarks

DISMIL_SQFT = 435.6

async def price_signal(
    location: dict,
    asking_price: float,
    property_type: str,
    radius_m: int,
    *,
    land_area_sqft: float | None = None,
    region_tier: str = "tier_2_3",
    intent: str = "buy",
) -> dict:
    """
    Unified pricing logic with Web Search Benchmarking fallback.
    """
    
    # -------------------------
    # 1. LAND / PLOT (Buy Only)
    # -------------------------
    if property_type in {"land", "plot"}:
        land = estimate_land_rate_per_dismil(
            asking_price=asking_price,
            land_area_sqft=land_area_sqft,
            region_tier=region_tier,
        )
        return {
            "score": land["score"],
            "summary": land["summary"],
            "details": {
                "asking_rate_per_dismil": land["asking_rate_per_dismil"],
                "recommended_band": land["recommended_band"],
                "pricing_basis": "heuristic_land_band",
                "input_price": asking_price,
            },
        }

    # -------------------------
    # 2. LOCAL DB CHECK
    # -------------------------
    try:
        txns = await get_transactions(location, property_type, radius_m)
    except:
        txns = []

    # -------------------------
    # 3. WEB BENCHMARK FALLBACK (If DB is empty or intent is rent)
    # -------------------------
    if not txns or intent == "rent" or len(txns) < 3:
        return {
            "score": 0.5,
            "summary": f"Analyzing {intent} pricing based on real-time market trends.",
            "details": {
                "pricing_basis": "web_market_benchmark",
                "benchmarks": None,
                "input_price": asking_price,
                "recommended_band": "Calculating..." # Placeholder for engine
            }
        }

    # -------------------------
    # 4. DB-BASED ANALYSIS
    # -------------------------
    avg_price = sum(t["price"] for t in txns) / len(txns)
    diff_pct = (asking_price - avg_price) / avg_price
    
    if abs(diff_pct) <= 0.15: score = 0.85
    elif abs(diff_pct) <= 0.35: score = 0.65
    else: score = 0.4

    direction = "above" if diff_pct > 0 else "below"

    return {
        "score": round(score, 2),
        "summary": (
            f"Asking {intent} price is {abs(diff_pct)*100:.1f}% {direction} "
            f"the local average based on {len(txns)} records."
        ),
        "details": {
            "local_avg": round(avg_price),
            "recommended_band": round(avg_price * 1.1), # +10% tolerance
            "difference_pct": round(diff_pct * 100, 1),
            "input_price": asking_price,
            "pricing_basis": "transaction_comparison",
        },
    }


def estimate_land_rate_per_dismil(
    asking_price: float,
    land_area_sqft: float | None,
    region_tier: str,
) -> dict:
    if not land_area_sqft:
        return {
            "score": 0.45,
            "asking_rate_per_dismil": None,
            "recommended_band": None,
            "confidence_note": "Land area not provided; unable to estimate rate",
            "summary": "Land area not provided; pricing assessment is incomplete",
        }

    dismil = land_area_sqft / DISMIL_SQFT
    asking_rate = asking_price / dismil

    # -------------------------
    # INDIA-REALISTIC BASE BAND
    # -------------------------
    if region_tier == "tier_1":
        base_low, base_high = 6_00_000, 25_00_000
    else:
        base_low, base_high = 2_00_000, 6_00_000

    base_mid = (base_low + base_high) / 2

    # Liquidity compression for Tier 2/3
    if region_tier == "tier_2_3":
        base_high *= 0.95

    recommended_band = {
        "low": round(base_low),
        "mid": round(base_mid),
        "high": round(base_high),
    }

    # -------------------------
    # SCORE LOGIC
    # -------------------------
    if asking_rate <= base_mid:
        score = 0.7
        verdict = "falls within a reasonable negotiation range"
    elif asking_rate <= base_high:
        score = 0.55
        verdict = "is priced toward the higher end of the local range"
    else:
        score = 0.35
        verdict = "appears aggressively priced for this locality"

    return {
        "score": round(score, 2),
        "asking_rate_per_dismil": round(asking_rate),
        "recommended_band": recommended_band,
        "confidence_note": (
            "Derived from regional heuristics and liquidity patterns; "
            "exact transaction data is unavailable"
        ),
        "summary": (
            f"Asking land rate is ₹{asking_rate:,.0f} per dismil, which {verdict}. "
            f"A practical negotiation range is ₹{base_low:,.0f}–₹{base_high:,.0f} "
            f"per dismil for a {region_tier.replace('_', ' ')} market."
        ),
    }
