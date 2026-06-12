import os
import sys
from dotenv import load_dotenv

# Load environment variables from backend/.env if it exists (useful for local development from the root)
backend_env = os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend', '.env'))
if os.path.exists(backend_env):
    load_dotenv(backend_env)

# Add backend directory to Python path so absolute/relative imports work correctly
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend'))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Import the FastAPI app instance from backend.main
from backend.main import app
