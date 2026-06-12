import os
import sys
import inspect
from dotenv import load_dotenv

# Intercept Uvicorn configuration dynamically to force binding to 0.0.0.0 and respect $PORT on Render
for frame_info in inspect.stack():
    frame = frame_info.frame
    if frame.f_code.co_name == "load" and "uvicorn" in frame.f_code.co_filename and "config" in frame.f_code.co_filename:
        config = frame.f_locals.get("self")
        if config:
            config.host = "0.0.0.0"
            port_env = os.environ.get("PORT")
            if port_env:
                config.port = int(port_env)
            break

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
