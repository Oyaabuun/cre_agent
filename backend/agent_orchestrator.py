import os
import traceback
import random
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Import tools directly for local execution simulation within FastAPI
from mcp_server import (
    search_properties,
    geospatial_near_search,
    semantic_sentiment_research,
    generate_investment_brief,
    run_competitive_analysis,
    save_brief_to_records
)

# Load environment
dotenv_paths = [".env", "backend/.env", "d:/PropertyAI/backend/.env"]
for path in dotenv_paths:
    if os.path.exists(path):
        load_dotenv(path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Global session dictionary to persist the chats over multiple HTTP requests in memory
ACTIVE_SESSIONS = {}

# Global persistent client to prevent HTTPX closed client session exceptions across requests
GLOBAL_CLIENT = None

def get_global_client():
    global GLOBAL_CLIENT
    if GLOBAL_CLIENT is None:
        if not GEMINI_API_KEY:
            raise RuntimeError("Missing GEMINI_API_KEY in environment variables")
        GLOBAL_CLIENT = genai.Client(api_key=GEMINI_API_KEY)
    return GLOBAL_CLIENT

class AgenticOrchestrator:
    def __init__(self):
        self.client = get_global_client()
        # Using gemini-3.5-flash for rapid reasoning and robust tool calling
        self.model_name = "gemini-3.5-flash"

    async def run_cre_agent(self, prompt: str, session_id: str = None) -> dict:
        """
        Runs an autonomous, multi-step commercial real estate intelligence loop.
        Supports multi-turn interactive session management via in-memory state.
        """
        logs = []
        is_new_session = True

        if session_id and session_id in ACTIVE_SESSIONS:
            is_new_session = False
            logs.append({
                "step": "Session Resume & History Parsing",
                "status": "success",
                "message": f"Resuming active strategic dialogue in session {session_id}.",
                "details": f"User Follow-up: '{prompt}'"
            })
        else:
            logs.append({
                "step": "Planning & Intent Analysis",
                "status": "active",
                "message": "AI is analyzing commercial real estate intent and planning tool chain...",
                "details": f"User Prompt: '{prompt}'"
            })

        # Define the system instructions guiding Gemini to behave as an autonomous global CRE agent
        system_instruction = """
        You are an elite, enterprise-grade global Commercial Real Estate (CRE) AI Agent.
        Your goal is to autonomously find, analyze, and draft complete investment briefs for commercial real estate proposals in any international market.
        
        You have access to a set of MongoDB-driven tools:
        1. search_properties: Query properties based on type, city, budget.
        2. geospatial_near_search: Filter properties by coordinates and verify proximity to public transit nodes.
        3. semantic_sentiment_research: Execute a semantic vector search against local development reports, yields, and foot traffic news.
        4. generate_investment_brief: Draft the final structured report containing the financial scorecard, proximity analysis, sentiment, and viability verdict.
        5. run_competitive_analysis: Perform brand/store competitive density lookups (e.g. apparel, jewelry) within a specified radius.
        6. save_brief_to_records: Save the final compiled markdown investment brief to the local system database records folder.
        
        Initial Property Valuation Protocol:
        - Step 1 (Retrieval): Call 'search_properties' to retrieve properties matching the user's budget and property type. Always specify the 'city' from the user's prompt (e.g. "Gwalior", "Bhubaneswar", "London", "Paris", "Singapore").
        - Step 2 (Geospatial Analysis): Review the coordinates of the retrieved properties. Call 'geospatial_near_search' with the coordinates to check if they are near transit hubs and map local infrastructure.
        - Step 3 (Semantic Research): Run 'semantic_sentiment_research' to fetch vector-matching reviews, foot traffic info, and yield expectations for that specific locality.
        - Step 4 (Execution): Compile all retrieved facts and call 'generate_investment_brief' with the correct 'city' parameter to create the final global publication-grade brief.
        
        Interactive Option & Steering Protocol:
        At the end of every property report or evaluation brief, you MUST ALWAYS present three strategic next steps under the exact heading: "### Next Strategic Decisions" and in this specific list format:
        Would you like me to:
        - Option A: Run a competitive analysis on existing apparel/jewelry brands within a 1km radius?
        - Option B: Simulate a higher budget threshold to see if better assets open up?
        - Option C: Draft an initial lease negotiation email based on these strategic recommendations?
        And explicitly prompt the user to choose an option or enter a custom follow-up.
        
        Multi-turn Conversation & Tools Execution Protocol:
        - If the user selects Option A, or asks to perform a competitive analysis (e.g. specifically for competing jewelry stores in Gwalior), call the 'run_competitive_analysis' tool. Pass the correct parameters (e.g. category='jewelry', city='Gwalior').
        - If the user asks to save the brief to records, or save the final brief, call 'save_brief_to_records' tool. For 'brief_content', supply the COMPLETE markdown text of the property investment brief that was generated previously.
        - If the user asks to simulate a higher budget threshold, call 'search_properties' with the adjusted higher max_price (e.g. 200000) and run the full geospatial and semantic evaluation chain again to update the brief.
        - If the user asks to draft a lease negotiation email, draft a professional, high-grade negotiation email from tenant to landlord in your final response.
        
        Be thorough. Complete all steps sequentially before outputting your final decision.
        """

        try:
            # Map tools to call dynamically
            tool_map = {
                "search_properties": search_properties,
                "geospatial_near_search": geospatial_near_search,
                "semantic_sentiment_research": semantic_sentiment_research,
                "generate_investment_brief": generate_investment_brief,
                "run_competitive_analysis": run_competitive_analysis,
                "save_brief_to_records": save_brief_to_records
            }

            # Retrieve or initialize chat
            if is_new_session:
                chat = self.client.chats.create(
                    model=self.model_name,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        tools=[
                            search_properties,
                            geospatial_near_search,
                            semantic_sentiment_research,
                            generate_investment_brief,
                            run_competitive_analysis,
                            save_brief_to_records
                        ],
                        temperature=0.1
                    )
                )
                if session_id:
                    ACTIVE_SESSIONS[session_id] = chat
            else:
                chat = ACTIVE_SESSIONS[session_id]

            # Send message to chat
            response = chat.send_message(prompt)
            
            # Loop for function calling
            loop_limit = 10
            loop_count = 0
            final_report = ""

            while loop_count < loop_limit:
                loop_count += 1
                
                # Check if model wants to call functions
                if response.function_calls:
                    # Update previous step as complete
                    if logs:
                        logs[-1]["status"] = "success"

                    for call in response.function_calls:
                        name = call.name
                        args = call.args
                        
                        logs.append({
                             "step": f"Executing Tool: {name}",
                             "status": "active",
                             "message": f"Agent triggers {name} tool with arguments: {dict(args)}",
                             "details": f"Arguments: {dict(args)}"
                        })
                        
                        # Execute matching tool function
                        if name in tool_map:
                            try:
                                tool_func = tool_map[name]
                                # Execute correct tool with appropriate params
                                if name == "search_properties":
                                    from mcp_server import LOCALIZATION_MAP
                                    req_city = args.get("city")
                                    if not req_city:
                                        req_city = "Gwalior"
                                        for key in LOCALIZATION_MAP.keys():
                                            if key in prompt.lower():
                                                req_city = " ".join(word.capitalize() for word in key.split())
                                                break
                                    result = tool_func(
                                        property_type=args.get("property_type"),
                                        city=req_city,
                                        max_price=args.get("max_price")
                                    )
                                elif name == "geospatial_near_search":
                                    result = tool_func(
                                        lat=float(args.get("lat")),
                                        lng=float(args.get("lng")),
                                        radius_m=int(args.get("radius_m", 2000))
                                    )
                                elif name == "semantic_sentiment_research":
                                    result = tool_func(
                                        query=args.get("query"),
                                        limit=int(args.get("limit", 2))
                                    )
                                elif name == "generate_investment_brief":
                                    from mcp_server import LOCALIZATION_MAP
                                    req_city = args.get("city")
                                    if not req_city:
                                        req_city = "Gwalior"
                                        for key in LOCALIZATION_MAP.keys():
                                            if key in prompt.lower():
                                                req_city = " ".join(word.capitalize() for word in key.split())
                                                break
                                    result = tool_func(
                                        property_title=args.get("property_title"),
                                        price_per_month=float(args.get("price_per_month")),
                                        area_sqft=float(args.get("area_sqft")),
                                        transit_text=args.get("transit_text"),
                                        sentiment_text=args.get("sentiment_text"),
                                        target_intent=args.get("target_intent", "retail storefront"),
                                        city=req_city
                                    )
                                    final_report = result
                                elif name == "run_competitive_analysis":
                                    result = tool_func(
                                        city=args.get("city", "Gwalior"),
                                        radius_km=float(args.get("radius_km", 1.0)),
                                        category=args.get("category", "jewelry"),
                                        lat=float(args.get("lat")) if args.get("lat") else None,
                                        lng=float(args.get("lng")) if args.get("lng") else None
                                    )
                                elif name == "save_brief_to_records":
                                    result = tool_func(
                                        property_title=args.get("property_title", "Gwalior Retail Storefront"),
                                        brief_content=args.get("brief_content")
                                    )
                                    
                                # Return response to Gemini
                                response = chat.send_message(
                                    types.Part.from_function_response(
                                        name=name,
                                        response={"result": result}
                                    )
                                )
                                break # Process next turn
                                
                            except Exception as tool_err:
                                error_msg = f"Tool execution failed: {tool_err}"
                                print(error_msg)
                                logs[-1]["status"] = "error"
                                logs[-1]["message"] = error_msg
                                # Send error to Gemini to recover
                                response = chat.send_message(
                                    types.Part.from_function_response(
                                        name=name,
                                        response={"error": str(tool_err)}
                                    )
                                )
                                break
                        else:
                            # Tool unknown
                            response = chat.send_message(
                                types.Part.from_function_response(
                                    name=name,
                                    response={"error": f"Unknown tool: {name}"}
                                )
                            )
                            break
                else:
                    # Model returned final answer
                    if logs:
                        logs[-1]["status"] = "success"
                    
                    logs.append({
                        "step": "Synthesis & Execution",
                        "status": "success",
                        "message": "AI synthesized all metrics and completed report compilation.",
                        "details": "Structuring final CRE Response."
                    })
                    break

            # Fallback if final report was not caught in the tool loop but returned in text
            if not final_report:
                final_report = response.text

            return {
                "success": True,
                "reasoning_chain": logs,
                "investment_brief": final_report
            }

        except Exception as orchestrator_err:
            traceback.print_exc()
            return {
                "success": False,
                "error": str(orchestrator_err),
                "reasoning_chain": logs
            }
