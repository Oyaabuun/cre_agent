import os
import asyncio
import random
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from google import genai

# Load env
dotenv_paths = [".env", "backend/.env", "d:/PropertyAI/backend/.env"]
for path in dotenv_paths:
    if os.path.exists(path):
        load_dotenv(path)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017")
DB_NAME = os.getenv("DB_NAME", "property_ai")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

print(f"Connecting to MongoDB at: {MONGO_URI}, DB: {DB_NAME}")
client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

# Initialize Gemini Client for Embeddings
ai_client = None
if GEMINI_API_KEY:
    try:
        ai_client = genai.Client(api_key=GEMINI_API_KEY)
        print("Gemini GenAI client initialized for embeddings.")
    except Exception as e:
        print(f"Warning: Failed to initialize Gemini GenAI client: {e}")

# Helper to generate vector embeddings
def get_embedding(text: str) -> list[float]:
    if ai_client:
        try:
            # Using text-embedding-004
            response = ai_client.models.embed_content(
                model="text-embedding-004",
                contents=text
            )
            if response.embeddings and len(response.embeddings) > 0:
                return response.embeddings[0].values
        except Exception as e:
            print(f"Warning: Embedding generation failed, using mock vector: {e}")
    
    # Return a high-quality deterministic pseudo-random mock vector of length 1536
    # This prevents failures if offline or API key is not active
    random.seed(hash(text))
    return [random.uniform(-1, 1) for _ in range(1536)]

# Seed Data definition
properties = [
    {
        "title": "KIIT Square Premium Retail Storefront",
        "type": "retail",
        "price_per_month": 180000,  # ~2,200 USD/month (Fits budget under $5,000/month)
        "asking_price": 180000,
        "property_type": "retail",
        "area_sqft": 1400,
        "location": {
            "type": "Point",
            "coordinates": [85.8199, 20.2961]  # lng, lat
        },
        "city": "Bhubaneswar",
        "locality": "Patia",
        "description": "High foot-fall retail storefront directly facing the KIIT Square main road. Perfect for cosmetic brands, boutique coffee shops, or clothing showrooms. Equipped with modern double-glass frontage.",
        "amenities": ["Parking", "Power Backup", "Central Air Conditioning", "Glass Frontage"]
    },
    {
        "title": "Patia Commercial Office Suite",
        "type": "office",
        "price_per_month": 120000,  # ~1,450 USD/month
        "asking_price": 120000,
        "property_type": "office",
        "area_sqft": 2200,
        "location": {
            "type": "Point",
            "coordinates": [85.8189, 20.2952]
        },
        "city": "Bhubaneswar",
        "locality": "Patia",
        "description": "Ready-to-occupy fully furnished IT/office space. Includes 24 workstations, 2 meeting rooms, a pantry, and reception lobby. Highly suitable for technology startups and service companies.",
        "amenities": ["Furnished", "Conference Room", "Server Room", "Fiber Internet", "Pantry"]
    },
    {
        "title": "Jayadev Vihar Corporate Headquarter Space",
        "type": "office",
        "price_per_month": 320000,  # ~3,800 USD/month
        "asking_price": 320000,
        "property_type": "office",
        "area_sqft": 5000,
        "location": {
            "type": "Point",
            "coordinates": [85.8252, 20.3015]
        },
        "city": "Bhubaneswar",
        "locality": "Jayadev Vihar",
        "description": "Bespoke executive office space on a high floor of a premium commercial tower. Highly secure with biometric access control, executive boardrooms, and private CEO office cabins.",
        "amenities": ["Secure Access", "24/7 Security", "Centralized HVAC", "Dedicated Elevators", "Visitor Parking"]
    },
    {
        "title": "Saheed Nagar Boutique Storefront",
        "type": "retail",
        "price_per_month": 90000,  # ~1,100 USD/month
        "asking_price": 90000,
        "property_type": "retail",
        "area_sqft": 950,
        "location": {
            "type": "Point",
            "coordinates": [85.8322, 20.2885]
        },
        "city": "Bhubaneswar",
        "locality": "Saheed Nagar",
        "description": "Compact retail showroom space in the heart of Saheed Nagar commercial market. Highly suited for electronics repair, pharmacy chains, or jewelry outlets. Strong local community presence.",
        "amenities": ["Street Frontage", "Storage Space", "Signage Board Allowed"]
    },
    {
        "title": "Infocity Tech Hub Hub-Office",
        "type": "office",
        "price_per_month": 240000,  # ~2,900 USD/month
        "asking_price": 240000,
        "property_type": "office",
        "area_sqft": 4000,
        "location": {
            "type": "Point",
            "coordinates": [85.8130, 20.3150]
        },
        "city": "Bhubaneswar",
        "locality": "Infocity",
        "description": "Corporate-grade IT space within Infocity limits. Flexible layout capable of customizable partitioning. Great natural lighting and spectacular views of the tech park. Excellent power infrastructure.",
        "amenities": ["Customizable Layout", "24/7 Access", "DG Power Backup", "High-speed Lifts"]
    },
    {
        "title": "Chandaka Logistic Warehouse Terminal",
        "type": "warehouse",
        "price_per_month": 400000,  # ~4,800 USD/month (Fits budget)
        "asking_price": 400000,
        "property_type": "warehouse",
        "area_sqft": 15000,
        "location": {
            "type": "Point",
            "coordinates": [85.7891, 20.3010]
        },
        "city": "Bhubaneswar",
        "locality": "Chandaka Industrial Estate",
        "description": "Large-scale modern industrial warehouse with high-clearance roofing (30 ft height). Equipped with multiple loading bays, wide concrete access road for 16-wheelers, and heavy flooring capacity.",
        "amenities": ["Loading Docks", "Heavy Flooring", "30ft Clearance", "Security Outpost"]
    },
    {
        "title": "Master Canteen Junction Showroom",
        "type": "retail",
        "price_per_month": 150000,  # ~1,800 USD/month
        "asking_price": 150000,
        "property_type": "retail",
        "area_sqft": 1800,
        "location": {
            "type": "Point",
            "coordinates": [85.8398, 20.2642]
        },
        "city": "Bhubaneswar",
        "locality": "Master Canteen",
        "description": "Premium retail outlet situated at the high-traffic junction of Master Canteen, mere meters from the railway terminal. Captures maximum tourist, traveler, and local commuter footfalls daily.",
        "amenities": ["Junction Location", "Near Railway Hub", "Heavy Foot Traffic", "Mezzanine Floor"]
    }
]

transit_hubs = [
    {
        "name": "Patia Railway Junction Station",
        "type": "railway",
        "location": {
            "type": "Point",
            "coordinates": [85.8080, 20.2920]
        }
    },
    {
        "name": "KIIT Square Main Transit Hub",
        "type": "metro",  # Simulated metro/bus rapid transit node
        "location": {
            "type": "Point",
            "coordinates": [85.8190, 20.2960]
        }
    },
    {
        "name": "Master Canteen Railway Terminus",
        "type": "railway",
        "location": {
            "type": "Point",
            "coordinates": [85.8402, 20.2651]
        }
    },
    {
        "name": "Jayadev Vihar Bus Rapid Transit (BRT) Stand",
        "type": "bus",
        "location": {
            "type": "Point",
            "coordinates": [85.8250, 20.3005]
        }
    },
    {
        "name": "Infocity Main Entrance Transit Node",
        "type": "bus",
        "location": {
            "type": "Point",
            "coordinates": [85.8125, 20.3142]
        }
    }
]

sentiment_texts = [
    {
        "title": "Patia Retail Demand Skyrockets",
        "locality": "Patia",
        "text": "The Patia micro-market in Bhubaneswar continues to show massive commercial development. Driven by student populations from KIIT University and young corporate professionals working in Infocity, retail storefronts here experience heavy daily foot traffic, averaging over 8,000 visitors per day. Yields are currently hovering around 9-11%, making it a highly attractive entry point for brick-and-mortar retail.",
        "zoning": "commercial",
        "yield_potential": "9.5%"
    },
    {
        "title": "Jayadev Vihar Zoning & Density Expansion",
        "locality": "Jayadev Vihar",
        "text": "Jayadev Vihar is emerging as the corporate headquarters cluster of central Bhubaneswar. Recent municipality zoning modifications allow up to 4.0 FAR (Floor Area Ratio) for IT and commercial structures. Public transit connects the area deeply, via the central bus depot. However, parking remains a severe congestion bottleneck, forcing premium office towers to construct multi-level mechanical parking facilities.",
        "zoning": "commercial",
        "yield_potential": "8.2%"
    },
    {
        "title": "Saheed Nagar Commercial Saturation",
        "locality": "Saheed Nagar",
        "text": "Saheed Nagar is one of Bhubaneswar's oldest markets. While storefront footfall remains high and extremely steady, high rental rates and space saturation limit rapid growth. Commercial yields have plateaued at around 6.5%. Mixed-use properties are abundant, but infrastructure is aged with frequent drainage updates required in monsoon seasons.",
        "zoning": "mixed",
        "yield_potential": "6.5%"
    },
    {
        "title": "Chandaka Logistic Sector Outlook",
        "locality": "Chandaka Industrial Estate",
        "text": "With the rise of e-commerce delivery hubs in Tier-2 Indian hubs, Chandaka has transformed into a prime logistic node. The proximity to national highway infrastructure enables quick freight shipping. Heavy truck movement is permitted 24/7. Warehouse demand is strong with stable long-term leases, providing steady, low-volatility rental returns to commercial real estate developers.",
        "zoning": "industrial",
        "yield_potential": "7.8%"
    },
    {
        "title": "Master Canteen Transit-Oriented Yield Growth",
        "locality": "Master Canteen",
        "text": "Master Canteen enjoys the highest daily foot traffic in Bhubaneswar owing to the railway station. Multi-modal integration with bus routes and upcoming transit lines has led to a major appreciation in commercial property rents, increasing by 14% year-over-year. Retail chains, retail banks, and budget hotels aggressively outbid each other for storefront locations within a 1km radius of the station.",
        "zoning": "commercial",
        "yield_potential": "10.5%"
    }
]

async def seed_all():
    # 1. Seed Properties
    print("\nSeeding 'properties' collection...")
    await db.properties.drop()
    result = await db.properties.insert_many(properties)
    print(f"Successfully inserted {len(result.inserted_ids)} commercial properties.")
    
    # Create Geospatial 2dsphere Index
    print("Creating 2dsphere index on properties.location...")
    await db.properties.create_index([("location", "2dsphere")])
    print("Geospatial index created on properties.")

    # 2. Seed Transit Hubs
    print("\nSeeding 'transit_hubs' collection...")
    await db.transit_hubs.drop()
    result = await db.transit_hubs.insert_many(transit_hubs)
    print(f"Successfully inserted {len(result.inserted_ids)} transit hubs.")
    
    # Create Geospatial 2dsphere Index
    print("Creating 2dsphere index on transit_hubs.location...")
    await db.transit_hubs.create_index([("location", "2dsphere")])
    print("Geospatial index created on transit hubs.")

    # 3. Seed Sentiment Documents with Vector Embeddings
    print("\nGenerating embeddings and seeding 'sentiment_documents' collection...")
    await db.sentiment_documents.drop()
    
    docs_to_insert = []
    for doc in sentiment_texts:
        print(f"Generating vector embedding for: '{doc['title']}'...")
        doc_embedding = get_embedding(doc["text"])
        docs_to_insert.append({
            **doc,
            "embedding": doc_embedding
        })
        
    result = await db.sentiment_documents.insert_many(docs_to_insert)
    print(f"Successfully inserted {len(result.inserted_ids)} sentiment documents with {len(docs_to_insert[0]['embedding'])}d vector embeddings.")

    print("\nDatabase Seeding and Indexing fully completed!")

if __name__ == "__main__":
    asyncio.run(seed_all())
