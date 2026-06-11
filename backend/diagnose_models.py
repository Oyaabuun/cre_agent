import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

model_name = "gemini-3-flash-preview"
print(f"Testing {model_name}...")
try:
    response = client.models.generate_content(
        model=model_name,
        contents="Hello, identify yourself."
    )
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
