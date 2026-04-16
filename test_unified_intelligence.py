#!/usr/bin/env python3
"""
Test script for the unified curriculum intelligence system.
Tests lesson generation with memory, prompt building, and intelligence features.
"""

import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
import json
from datetime import datetime, timezone

async def test_lesson_intelligence():
    """Test the lesson intelligence system"""
    print("🧪 Testing Unified Curriculum Intelligence System")
    print("=" * 60)
    
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'mi_lessonplan')
    
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        db = client[db_name]
        print("✅ Connected to MongoDB")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return
    
    # Test 1: Check if lesson memory tables exist
    print("\n1. Checking database tables...")
    collections = await db.list_collection_names()
    
    required_collections = [
        'lesson_memory',
        'lesson_prompts',
        'lesson_plans'
    ]
    
    for coll in required_collections:
        if coll in collections:
            print(f"   ✅ {coll} collection exists")
        else:
            print(f"   ⚠️  {coll} collection missing")
    
    # Test 2: Test lesson prompt builder
    print("\n2. Testing Lesson Prompt Builder...")
    try:
        from backend.services.lessonPromptBuilder import LessonPromptBuilder
        
        builder = LessonPromptBuilder(
            syllabus="Zanzibar",
            grade="Form 2",
            subject="Mathematics",
            topic="Introduction to Algebra",
            user_guidance="Focus on practical examples with local context",
            negative_constraints="Avoid complex terminology"
        )
        
        prompt = await builder.build(db)
        print(f"   ✅ Prompt builder working")
        print(f"   📝 Prompt length: {len(prompt)} characters")
        print(f"   📋 First 200 chars: {prompt[:200]}...")
    except Exception as e:
        print(f"   ❌ Prompt builder failed: {e}")
    
    # Test 3: Test lesson memory service
    print("\n3. Testing Lesson Memory Service...")
    try:
        from backend.services.lessonMemory import LessonMemory
        
        memory = LessonMemory(db)
        
        # Test memory storage and retrieval
        test_context = {
            "syllabus": "Zanzibar",
            "grade": "Form 2",
            "subject": "Mathematics",
            "topic": "Test Topic",
            "user_guidance": "Test guidance",
            "negative_constraints": "Test constraints",
            "user_prompt": "Zanzibar Form 2 Mathematics Test Topic"
        }
        
        async def test_generator():
            return {"test": "data", "content": "Generated lesson content"}
        
        # First call should generate fresh
        result1 = await memory.get_or_generate(test_context, test_generator)
        print(f"   ✅ Memory service working")
        print(f"   📊 First call source: {result1['source']}")
        print(f"   📊 First call type: {result1['type']}")
        
        # Second call should retrieve from memory
        result2 = await memory.get_or_generate(test_context, test_generator)
        print(f"   📊 Second call source: {result2['source']}")
        print(f"   📊 Second call type: {result2['type']}")
        
        if result2['source'] == 'memory':
            print("   ✅ Memory retrieval working correctly")
        
        # Test memory stats
        stats = await memory.get_memory_stats()
        print(f"   📈 Memory stats: {stats}")
        
    except Exception as e:
        print(f"   ❌ Memory service failed: {e}")
    
    # Test 4: Test the updated generate_lesson endpoint logic
    print("\n4. Testing Generate Lesson Endpoint Logic...")
    try:
        # Import the helper function
        from backend.server import _generate_lesson_with_intelligence
        
        # Create a test prompt
        test_prompt = """Generate a lesson plan for Zanzibar Form 2 Mathematics on Introduction to Algebra.
        Create a JSON response with appropriate lesson structure."""
        
        # Note: We can't actually call the AI without API key, but we can test the function structure
        print("   ✅ Endpoint logic imports correctly")
        print("   ℹ️  Note: AI call requires DEEPSEEK_API_KEY environment variable")
        
    except Exception as e:
        print(f"   ❌ Endpoint logic test failed: {e}")
    
    # Test 5: Check GenerateLessonRequest model
    print("\n5. Testing GenerateLessonRequest Model...")
    try:
        from backend.server import GenerateLessonRequest
        
        # Test with basic data
        request1 = GenerateLessonRequest(
            syllabus="Zanzibar",
            subject="Mathematics",
            grade="Form 2",
            topic="Algebra"
        )
        print(f"   ✅ Basic request model: {request1.syllabus} {request1.grade} {request1.subject}")
        
        # Test with intelligence features
        request2 = GenerateLessonRequest(
            syllabus="Tanzania Mainland",
            subject="Kiswahili",
            grade="Standard 5",
            topic="Sarufi",
            user_guidance="Focus on practical examples",
            negative_constraints="Avoid complex terminology",
            check_memory=True
        )
        print(f"   ✅ Enhanced request model with intelligence features")
        print(f"   📝 User guidance: {request2.user_guidance}")
        print(f"   📝 Check memory: {request2.check_memory}")
        
    except Exception as e:
        print(f"   ❌ Request model test failed: {e}")
    
    # Test 6: Database cleanup (optional)
    print("\n6. Cleaning up test data...")
    try:
        # Clean up test memory entries
        await db.lesson_memory.delete_many({"user_prompt": {"$regex": "Test Topic"}})
        print("   ✅ Test data cleaned up")
    except Exception as e:
        print(f"   ⚠️  Cleanup failed: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 Unified Intelligence System Test Complete!")
    print("\nNext steps:")
    print("1. Set DEEPSEEK_API_KEY environment variable for full AI testing")
    print("2. Start the backend server: cd backend && python server.py")
    print("3. Test the frontend with the new LessonFormEnhanced component")
    print("4. Verify lesson generation with memory features")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(test_lesson_intelligence())