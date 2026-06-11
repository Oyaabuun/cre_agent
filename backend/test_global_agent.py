import asyncio
from agent_orchestrator import AgenticOrchestrator

async def run_test(prompt: str, test_name: str):
    print("=" * 80)
    print(f"RUNNING GLOBAL TEST CASE: {test_name}")
    print("=" * 80)
    print(f"Prompt: '{prompt}'\n")
    
    orchestrator = AgenticOrchestrator()
    result = await orchestrator.run_cre_agent(prompt)
    
    if result.get("success"):
        print("--- REASONING CHAIN LOGS ---")
        for log in result["reasoning_chain"]:
            print(f"[{log['step']}] ({log['status']}): {log['message']}")
            
        print("\n--- FINAL INVESTMENT BRIEF EXCERPT ---")
        brief = result["investment_brief"]
        # Print first 15 lines of the brief
        lines = brief.split("\n")
        print("\n".join(lines[:25]))
        print("\n... [Truncated for readability] ...")
        print("\nTest Case Completed Successfully!")
    else:
        print(f"Test Case Failed: {result.get('error')}")

async def main():
    # 1. Singapore Test Case (ASEAN Hub)
    sg_prompt = (
        "We are looking for a premium office space in Singapore near the Marina Bay financial district "
        "with a budget of S$15,000/month. Verify spatial connectivity to transit hubs and compile "
        "an investment brief detailing local zoning and market sentiment."
    )
    await run_test(sg_prompt, "Singapore Office Hub (ASEAN)")
    
    print("\n" + "#" * 80 + "\n")
    
    # 2. Paris Test Case (EU Hub)
    paris_prompt = (
        "Evaluate a boutique retail storefront in Paris under 8,000 EUR/month. "
        "Perform a geospatial check for proximity to the Paris Metro and retrieve semantic sentiment context "
        "for upscale commercial zoning yields."
    )
    await run_test(paris_prompt, "Paris Retail Storefront (European Union)")

if __name__ == "__main__":
    asyncio.run(main())
