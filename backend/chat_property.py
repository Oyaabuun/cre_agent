import os
import json
from typing import List
from google import genai
from google.genai import types

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

async def get_property_chat_response(evaluation_data: dict, user_message: str) -> str:
    """
    Generate a response to a user's question about a specific property evaluation.
    Uses Google Search grounding for any questions not covered by the report.
    """
    prompt = f"""
You are an expert property investment advisor in India.
A user has just received an AI-driven evaluation of a property and has a follow-up question.

CONTEXT (Property Evaluation Report):
{json.dumps(evaluation_data, indent=2)}

USER QUESTION:
"{user_message}"

INSTRUCTIONS:
- First, look for the answer in the PROVIDED CONTEXT.
- If the answer isn't in the report (e.g., questions about CRIME RATES, local news, upcoming metro projects, or government laws), USE THE GOOGLE SEARCH TOOL to find accurate, real-time information.
- Be conservative and professional in your tone.
- Keep the response concise (max 4 sentences).
- If using web search, mention the source of new information.

RESPONSE:
"""
    
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
        config=types.GenerateContentConfig(
            tools=[types.Tool(google_search=types.GoogleSearch())]
        )
    )
    return response.text.strip()
