import os
import json
from typing import List, Literal
from pydantic import BaseModel, ValidationError
from google import genai
from google.genai import types

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
# model = "gemini-2.0-flash" # Upgrading to match market_research


# ---------------------------
# Pydantic schema (CRITICAL)
# ---------------------------
class LLMDecision(BaseModel):
    decision: Literal["BUY", "CAUTION", "AVOID"]
    confidence: float  # 0–1
    primary_risks: List[str]
    recommendation: str

class SafetyAnalysis(BaseModel):
    crime_score: float  # 0-1
    sentiment_summary: str
    top_review_themes: str
    incident_profile: str



async def reason_with_llm(context: dict, numeric_score: float) -> dict:
    prompt = f"""
You are a conservative property decision analyst in India.

You MUST return STRICT JSON only.
No markdown. No explanation outside JSON.

INPUT:
{json.dumps(context, indent=2)}

NUMERIC_SCORE (0–1): {numeric_score}

RULES:
- Be conservative
- Avoid irreversible mistakes
- Confidence must align with numeric_score
- Decision must be BUY, CAUTION, or AVOID

JSON FORMAT:
{{
  "decision": "BUY|CAUTION|AVOID",
  "confidence": 0.0,
  "primary_risks": [],
  "recommendation": ""
}}
"""

    with open("prompt_log.txt", "w") as f:
        f.write(prompt)

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt
    )
    raw = response.text.strip()

    try:
        parsed = json.loads(raw)
        validated = LLMDecision(**parsed)
        return validated.dict()
    except (json.JSONDecodeError, ValidationError) as e:
        # SAFE fallback — this is VERY important
        return {
            "decision": "CAUTION",
            "confidence": round(numeric_score, 2),
            "primary_risks": ["LLM output validation failed"],
            "recommendation": "Manual review recommended"
        }

async def analyze_safety_pulse(news_snippets: list, reviews: list) -> dict:
    prompt = f"""
You are a conservative safety and law enforcement analyst.

You MUST return STRICT JSON only.
No markdown. No explanation outside JSON.

INPUT NEWS SNIPPETS (Local Crime/Safety context):
{json.dumps(news_snippets, indent=2)}

INPUT REVIEWS (Nearest Police Station):
{json.dumps(reviews, indent=2)}

RULES:
1. 'crime_score' (0.0 to 1.0): 
   - 1.0 = extremely safe (no recent severe crime, very positive police reviews).
   - 0.0 = very unsafe.
   - Use a dynamic decay logic: A severe crime recently drops score heavily. Old minor crimes drop it slightly. 
   - Adjust based on police sentiment (e.g. good police response mitigates some risk).
2. 'sentiment_summary': 1-2 sentence summary of overall safety (e.g., "Below average incident rate. Police responsiveness is rated highly.")
3. 'top_review_themes': 1 sentence capturing main themes from police reviews (e.g., "Prompt patrolling and helpful staff.")
4. 'incident_profile': 1-2 sentences capturing the nature of crimes (e.g., "Primarily white-collar. Low violent crime.")

JSON FORMAT:
{{
  "crime_score": 0.0,
  "sentiment_summary": "",
  "top_review_themes": "",
  "incident_profile": ""
}}
"""
    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt
        )
        raw = response.text.strip()
        # Handle cases where LLM returns fenced code block despite instructions
        if raw.startswith("```json"):
            raw = raw[7:-3].strip()
        elif raw.startswith("```"):
            raw = raw[3:-3].strip()
            
        parsed = json.loads(raw)
        validated = SafetyAnalysis(**parsed)
        return validated.dict()
    except (json.JSONDecodeError, ValidationError) as e:
        return {
            "crime_score": 0.5,
            "sentiment_summary": "Insufficient data to confidently evaluate sentiment.",
            "top_review_themes": "Mixed or unavailable.",
            "incident_profile": "No distinct incident profile established."
        }
