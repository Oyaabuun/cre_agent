# 🌐 SiteMind AI

> **Intelligent Commercial Real Estate (CRE) Decision Intelligence & Site Selection Agent**

SiteMind AI is a state-of-the-art property intelligence platform. It leverages Google Gemini AI reasoning, MongoDB Atlas geospatial index mappings, and high-dimensional semantic search to evaluate local commercial listings and provide deep, automated due diligence reporting.

---

## 🤖 1. Conversational CRE Copilot (V2)

The core module of SiteMind AI is an interactive, multi-turn AI Agent designed for complex commercial real estate due diligence.

* **Multi-Turn Strategic Agent Loop**: Submit search criteria (budget, location, transportation rules) and guide the AI through custom competitive and risk scenarios.
* **Geospatial & Vector Semantic Engine**: The backend runs native MongoDB `$nearSphere` geospatial queries to check transit proximity and matches search intents with local neighborhood data using high-dimensional Atlas vector lookups.
* **Interactive Report Console**: Features a tabbed dashboard providing a complete viability brief, structured financial scorecards, and a proximity map showing transport connections.
* **Token-Based Credit System**: To manage operations, each search run verifies user login status and deducts 1 credit from their balance.
* **Real-Time Reasoning Logs**: Watch the telemetry console update in real-time as the backend orchestrates tool call executions, database updates, and vector embedding lookups.

---

## 📊 2. Single Asset Evaluator

The initial entry portal of the application, perfect for rapid site scoring and structured intelligence.

* **Multi-Dimensional Signal Analysis**: Submits coordinates and listing details to evaluate entrance valuations, infrastructure constraints, flood hazards, and local air quality.
* **Safety & Police Intelligence**: Connects to the **Google Places API** to check surrounding law enforcement presence and **NewsData.io** to check local crime news.
* **Masked Due Diligence**: Renders core decisions (BUY, CAUTION, AVOID) for free, locking the granular air quality, hospital access, and neighborhood detail cards behind an overlay.
* **One-Click Credit Unlock**: Click "Unlock Report" to deduct 1 credit from your balance, instantly loading all locked sub-cards and enabling the contextual **Property Chat** for deeper querying.

---

## 🛠️ Technology Stack

| Layer | Technology / Product | Description |
| :--- | :--- | :--- |
| **Frontend** | Next.js (TypeScript) | High-performance React framework using Turbopack compiler. |
| **Backend** | FastAPI (Python) | Robust async web framework managing API routers and security. |
| **Database** | MongoDB Atlas | Remote document database running geospatial and vector indexes. |
| **AI Reasoning** | Google Gemini (3.5 Flash) | Handles text grounding, agent orchestrator, and report compilation. |
| **Embeddings** | Google Generative AI | Creates query vectors using `gemini-embedding-001`. |
| **Payments** | PayPal SDK | Handles secure sandbox order creation, balance purchases, and capture verification. |
| **Environment** | WAQI & NewsData.io APIs | Real-time air quality index metrics and safety/crime news sentiment. |

---

## 🚀 Quick Start & Running Locally

### 1. Environment Configurations
Prepare your environment credentials in both backend and frontend directories:

* **Backend (`backend/.env`)**:
  ```ini
  MONGO_URI=mongodb+srv://<db_username>:<db_password>@cluster0.7uuojs2.mongodb.net/?appName=Cluster0
  DB_NAME=property_ai
  GEMINI_API_KEY=your_gemini_api_key
  GEOCODE_API_KEY=your_google_maps_api_key
  MAPS_API_KEY=your_google_maps_api_key
  JWT_SECRET=super-secret-dev-key-change-later
  PAYPAL_MODE=sandbox
  PAYPAL_CLIENT_ID=your_paypal_client_id
  PAYPAL_CLIENT_SECRET=your_paypal_client_secret
  ```
* **Frontend (`frontend/.env.local`)**:
  ```ini
  NEXT_PUBLIC_MAPS_API_KEY=your_google_maps_api_key
  NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
  ```

### 2. Start the Backend Server
```bash
cd backend
python -m venv .venv
# Activate virtual environment
.venv\Scripts\activate
pip install -r ../requirements.txt
python -m uvicorn main:app --port 8000 --reload
```

### 3. Start the Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 💳 PayPal Mode Toggling (Sandbox vs Live)

SiteMind AI supports seamless transitions between testing and live billing environments:

1. **Backend Switch**: In `backend/.env`, set `PAYPAL_MODE=live` (or `sandbox`) and paste your live PayPal API credentials into `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`.
2. **Frontend Switch**: In `frontend/.env.local`, set `NEXT_PUBLIC_PAYPAL_CLIENT_ID` to your live PayPal Client ID.
