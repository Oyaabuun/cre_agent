import asyncio
from agent_orchestrator import AgenticOrchestrator

async def test_orchestrator():
    print("Initializing AgenticOrchestrator...")
    try:
        orchestrator = AgenticOrchestrator()
    except Exception as e:
        print(f"Failed to initialize orchestrator: {e}")
        return
        
    prompt = "We need to open a new retail storefront in Bhubaneswar. Find available commercial properties under 200000 INR/month, verify they are within a 2km radius of major public transit hubs, and draft a comparative yield analysis based on local market sentiment."
    print(f"\nRunning AI Agent Mission with Prompt:\n'{prompt}'\n")
    
    result = await orchestrator.run_cre_agent(prompt)
    
    if result.get("success"):
        print("\n--- REASONING CHAIN LOGS ---")
        for log in result["reasoning_chain"]:
            print(f"[{log['step']}] ({log['status']}): {log['message']}")
            
        print("\n--- FINAL INVESTMENT BRIEF ---")
        brief_safe = result["investment_brief"].replace("₹", "INR")
        print(brief_safe[:800] + "\n...")
        print("\nEnd-to-End Local Execution Verified Successfully!")
    else:
        print(f"\nExecution Failed: {result.get('error')}")
        if "reasoning_chain" in result:
            print("\nReasoning logs prior to failure:")
            for log in result["reasoning_chain"]:
                print(f"[{log['step']}] ({log['status']}): {log['message']}")

if __name__ == "__main__":
    asyncio.run(test_orchestrator())
