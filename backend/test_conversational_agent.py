import asyncio
import os
from agent_orchestrator import AgenticOrchestrator

async def test_conversational_loop():
    print("=" * 85)
    print("RUNNING MULTI-TURN CONVERSATIONAL AGENT TEST CASE (GWALIOR BASELINE)")
    print("=" * 85)

    orchestrator = AgenticOrchestrator()
    session_id = "test-session-gwalior-123"
    
    # --------------------------------------------------------------------
    # TURN 1: Initial Prompt
    # --------------------------------------------------------------------
    turn1_prompt = (
        "Evaluate a premium retail storefront in Gwalior near Maharaj Bada under 150,000 INR/month, "
        "check transit proximity within 3km, and look at urban development impact."
    )
    print(f"\n[TURN 1] User Prompt: '{turn1_prompt}'")
    print("Agent is thinking and calling tools...")
    
    result1 = await orchestrator.run_cre_agent(turn1_prompt, session_id=session_id)
    
    if not result1.get("success"):
        print(f"Turn 1 Failed: {result1.get('error')}")
        return
        
    print("\n[TURN 1] SUCCESS!")
    print("--- Tool execution chain logs ---")
    for log in result1["reasoning_chain"]:
        msg_safe = log['message'].encode('ascii', errors='replace').decode('ascii')
        print(f"  - [{log['step']}] {log['status']}: {msg_safe}")
        
    brief = result1["investment_brief"]
    print(f"\n[TURN 1 Output Excerpt] (First 15 lines):")
    lines = brief.split("\n")
    excerpt = "\n".join(lines[:18])
    print(excerpt.encode('ascii', errors='replace').decode('ascii'))
    print("...")
    
    # Verify that the next options are presented in the response
    print("\nVerifying Option Steering Presentation:")
    has_options = "Option A" in brief or "Next Strategic Decisions" in brief or "Would you like me to" in brief
    if has_options:
        print("  Options presented correctly at the end of the report!")
    else:
        print("  Options was not explicitly detected, checking LLM fallback...")

    print("\n" + "-" * 85 + "\n")

    # --------------------------------------------------------------------
    # TURN 2: Follow-up Prompt (Competitive Jewelry Analysis & Save Records)
    # --------------------------------------------------------------------
    turn2_prompt = (
        "Let's go with A, but specifically look for competing jewelry stores, not apparel. "
        "Also, save the final brief to my records."
    )
    print(f"[TURN 2] User Prompt: '{turn2_prompt}'")
    print("Agent is resuming active session and executing follow-ups...")
    
    result2 = await orchestrator.run_cre_agent(turn2_prompt, session_id=session_id)
    
    if not result2.get("success"):
        print(f"Turn 2 Failed: {result2.get('error')}")
        return
        
    print("\n[TURN 2] SUCCESS!")
    print("--- Tool execution chain logs ---")
    for log in result2["reasoning_chain"]:
        msg_safe = log['message'].encode('ascii', errors='replace').decode('ascii')
        print(f"  - [{log['step']}] {log['status']}: {msg_safe}")
        
    output2 = result2["investment_brief"]
    print(f"\n[TURN 2 Final Response]:")
    print(output2.encode('ascii', errors='replace').decode('ascii'))
    
    # --------------------------------------------------------------------
    # VERIFY DISK OUTPUTS
    # --------------------------------------------------------------------
    print("\n" + "=" * 85)
    print("DISK RECORDS VERIFICATION:")
    records_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "records"))
    print(f"Records folder path: {records_dir}")
    
    if os.path.exists(records_dir):
        files = os.listdir(records_dir)
        print(f"Files written in records: {files}")
        if any(f.endswith(".md") for f in files):
            print("  Disk records verified successfully! Brief has been written to local disk records.")
        else:
            print("  No markdown files found in the records folder.")
    else:
        print("  Records directory was not created.")
    print("=" * 85)

if __name__ == "__main__":
    asyncio.run(test_conversational_loop())
