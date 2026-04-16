#!/usr/bin/env python3
"""
Database migration script for syllabus knowledge base tables.
This creates the necessary MongoDB collections for the curriculum intelligence system.
"""

import os
import sys
from pathlib import Path

# Try to load dotenv, but continue if not available
try:
    from dotenv import load_dotenv
    load_dotenv_available = True
except ImportError:
    load_dotenv_available = False
    print("Warning: python-dotenv not available, using environment variables directly")

from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# Load environment variables
ROOT_DIR = Path(__file__).parent
if load_dotenv_available:
    load_dotenv(ROOT_DIR / '.env')

async def create_collections():
    """Create the syllabus knowledge base collections in MongoDB"""
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=60000, connectTimeoutMS=30000)
    db = client[db_name]
    
    print(f"Connecting to MongoDB database: {db_name}")
    
    # Create syllabus_knowledge_base collection
    syllabus_collection = db.syllabus_knowledge_base
    
    # Create indexes for efficient querying
    await syllabus_collection.create_index([
        ("country", 1),
        ("level", 1),
        ("subject", 1),
        ("term", 1)
    ], name="syllabus_lookup_idx")
    
    await syllabus_collection.create_index([
        ("country", 1),
        ("level", 1),
        ("subject", 1)
    ], name="syllabus_subject_idx")
    
    print("Created syllabus_knowledge_base collection with indexes")
    
    # Create prompt_memory collection
    memory_collection = db.prompt_memory
    
    # Create indexes for prompt memory
    await memory_collection.create_index("prompt_hash", unique=True, name="prompt_hash_idx")
    await memory_collection.create_index([
        ("syllabus", 1),
        ("level", 1),
        ("subject", 1),
        ("term", 1),
        ("total_weeks", 1)
    ], name="memory_lookup_idx")
    
    await memory_collection.create_index("last_used", name="last_used_idx")
    await memory_collection.create_index("usage_count", name="usage_count_idx")
    
    print("Created prompt_memory collection with indexes")
    
    # Create user_prompt_overrides collection
    overrides_collection = db.user_prompt_overrides
    
    await overrides_collection.create_index([
        ("user_id", 1),
        ("prompt_memory_id", 1)
    ], unique=True, name="user_override_idx")
    
    print("Created user_prompt_overrides collection with indexes")
    
    # Create prompt_clusters collection
    clusters_collection = db.prompt_clusters
    
    await clusters_collection.create_index("representative_prompt_hash", name="rep_prompt_idx")
    await clusters_collection.create_index("cluster_name", name="cluster_name_idx")
    
    print("Created prompt_clusters collection with indexes")
    
    print("\n✅ All collections created successfully!")
    
    # Seed initial data
    await seed_initial_data(db)
    
    client.close()

async def seed_initial_data(db):
    """Seed initial syllabus data"""
    
    print("\n📚 Seeding initial syllabus data...")
    
    # Zanzibar Arabic Form 6 (Advanced)
    zanzibar_form6_arabic = {
        "country": "Zanzibar",
        "level": "Form 6",
        "subject": "Arabic",
        "term": "Term 1",
        "week_range": "Weeks 1-10",
        "topics": [
            "Prosody (العروض)",
            "Rhetoric (البلاغة)",
            "Pre-Islamic Poetry",
            "Umayyad Poetry", 
            "Literary Criticism Basics"
        ],
        "forbidden_topics": [
            "Basic conversations",
            "Personal letters", 
            "Simple paragraphs",
            "Read aloud",
            "Vocabulary lists"
        ],
        "required_verbs": [
            "analyze", "critique", "evaluate", "compose", "scan", 
            "differentiate", "interpret"
        ],
        "forbidden_verbs": [
            "identify", "name", "point to", "repeat", "match"
        ],
        "column_headers": [
            "Main Competence",
            "Specific Competences", 
            "Learning Activities",
            "Specific Activities",
            "Month",
            "Week",
            "Number of Periods",
            "Teaching and Learning Methods",
            "Teaching and Learning Resources",
            "Assessment Tools",
            "References",
            "Remarks"
        ],
        "terminology_map": {
            "Main Competence": "الكفاءة الرئيسية",
            "Specific Competences": "الكفاءات المحددة",
            "Learning Activities": "أنشطة التعلم",
            "Specific Activities": "الأنشطة المحددة"
        }
    }
    
    # Zanzibar Arabic Standard 1 (Beginner)
    zanzibar_std1_arabic = {
        "country": "Zanzibar",
        "level": "Standard 1",
        "subject": "Arabic",
        "term": "Term 1",
        "week_range": "Weeks 1-10",
        "topics": [
            "Letter recognition (أ ب ت)",
            "Basic vocabulary (colors, numbers 1-10)",
            "Simple greetings",
            "Family words (mother, father)"
        ],
        "required_verbs": [
            "identify", "recognize", "name", "point to", "repeat", "match"
        ],
        "column_headers": [
            "Main Competence",
            "Specific Competences", 
            "Learning Activities",
            "Specific Activities",
            "Month",
            "Week",
            "Number of Periods",
            "Teaching and Learning Methods",
            "Teaching and Learning Resources",
            "Assessment Tools",
            "References",
            "Remarks"
        ],
        "terminology_map": {
            "Main Competence": "الكفاءة الرئيسية",
            "Specific Competences": "الكفاءات المحددة",
            "Learning Activities": "أنشطة التعلم",
            "Specific Activities": "الأنشطة المحددة"
        }
    }
    
    # Tanzania Mainland Arabic Form 6 (Different structure)
    mainland_form6_arabic = {
        "country": "Tanzania Mainland",
        "level": "Form 6",
        "subject": "Arabic",
        "term": "Term 1",
        "week_range": "Weeks 1-10",
        "topics": [
            "Advanced Grammar (Nahw)",
            "Morphology (Sarf)",
            "Classical Texts",
            "Modern Arabic Literature",
            "Translation Skills"
        ],
        "column_headers": [
            "Main Competence (Umahiri Mkuu)",
            "Specific Competence (Umahiri Mahususi)",
            "Main Activity (Shughuli Kuu)",
            "Specific Activity (Shughuli Mahususi)",
            "Month",
            "Week",
            "Number of Periods",
            "Teaching & Learning Methods",
            "Teaching & Learning Resources",
            "Assessment Tools",
            "References",
            "Remarks"
        ],
        "terminology_map": {
            "Main Competence (Umahiri Mkuu)": "الكفاءة الرئيسية",
            "Specific Competence (Umahiri Mahususi)": "الكفاءة المحددة",
            "Main Activity (Shughuli Kuu)": "النشاط الرئيسي",
            "Specific Activity (Shughuli Mahususi)": "النشاط المحدد"
        }
    }
    
    # Insert sample data
    await db.syllabus_knowledge_base.insert_many([
        zanzibar_form6_arabic,
        zanzibar_std1_arabic,
        mainland_form6_arabic
    ])
    
    print("✅ Seeded 3 initial syllabus records:")
    print("   - Zanzibar Arabic Form 6 (Advanced)")
    print("   - Zanzibar Arabic Standard 1 (Beginner)")
    print("   - Tanzania Mainland Arabic Form 6")

async def main():
    """Main function"""
    try:
        await create_collections()
        print("\n🎉 Database setup completed successfully!")
    except Exception as e:
        print(f"❌ Error setting up database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())