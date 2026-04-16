#!/usr/bin/env python3
"""
Test script for the unified Binti Hamdani endpoint
"""
import asyncio
import httpx
import json
import sys

async def test_binti_endpoint():
    """Test the new /api/binti endpoint"""
    base_url = "http://localhost:8001"
    
    # Test 1: Chat with Binti
    print("Test 1: Chat with Binti")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}/api/binti",
                json={
                    "message": "Hello Binti, can you help me create a lesson plan for Kiswahili Grade 5?",
                    "context": {
                        "subject": "Kiswahili",
                        "grade": "5",
                        "syllabus": "Zanzibar"
                    }
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✓ Success! Response type: {result.get('type')}")
                print(f"Message: {result.get('message', 'No message')[:200]}...")
            else:
                print(f"✗ Failed with status {response.status_code}")
                print(f"Response: {response.text}")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    print("\n" + "="*80 + "\n")
    
    # Test 2: Generate scheme of work
    print("Test 2: Generate Scheme of Work")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}/api/binti",
                json={
                    "message": "Create a scheme of work for Kiswahili Grade 5",
                    "context": {
                        "subject": "Kiswahili",
                        "grade": "5",
                        "syllabus": "Zanzibar",
                        "total_weeks": 12
                    }
                },
                timeout=60.0
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✓ Success! Response type: {result.get('type')}")
                if result.get('type') == 'scheme':
                    data = result.get('data', {})
                    print(f"Scheme has {data.get('total_weeks', 0)} weeks")
                    print(f"Message: {result.get('message', 'No message')}")
                else:
                    print(f"Response: {json.dumps(result, indent=2)[:500]}...")
            else:
                print(f"✗ Failed with status {response.status_code}")
                print(f"Response: {response.text}")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    print("\n" + "="*80 + "\n")
    
    # Test 3: Generate lesson plan
    print("Test 3: Generate Lesson Plan")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}/api/binti",
                json={
                    "message": "Create a lesson plan about verbs for Kiswahili Grade 5",
                    "context": {
                        "subject": "Kiswahili",
                        "grade": "5",
                        "syllabus": "Zanzibar",
                        "topic": "Verbs (Vitenzi)"
                    }
                },
                timeout=60.0
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✓ Success! Response type: {result.get('type')}")
                if result.get('type') == 'lesson':
                    data = result.get('data', {})
                    print(f"Lesson ID: {data.get('lesson_id', 'N/A')}")
                    print(f"Topic: {data.get('topic', 'N/A')}")
                    print(f"Message: {result.get('message', 'No message')}")
                else:
                    print(f"Response: {json.dumps(result, indent=2)[:500]}...")
            else:
                print(f"✗ Failed with status {response.status_code}")
                print(f"Response: {response.text}")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    print("\n" + "="*80 + "\n")
    
    # Test 4: Curriculum question
    print("Test 4: Curriculum Question")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}/api/binti",
                json={
                    "message": "What are the best teaching methods for teaching Arabic to beginners?",
                    "context": {
                        "subject": "Arabic",
                        "grade": "3",
                        "syllabus": "Zanzibar"
                    }
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✓ Success! Response type: {result.get('type')}")
                print(f"Message: {result.get('message', 'No message')[:300]}...")
            else:
                print(f"✗ Failed with status {response.status_code}")
                print(f"Response: {response.text}")
    except Exception as e:
        print(f"✗ Error: {e}")

async def test_binti_chat_endpoint():
    """Test the original /api/binti-chat endpoint for backward compatibility"""
    print("\n" + "="*80 + "\n")
    print("Test 5: Original Binti Chat Endpoint (Backward Compatibility)")
    
    base_url = "http://localhost:8001"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}/api/binti-chat",
                json={
                    "message": "Hello Binti, how are you today?",
                    "context": {
                        "subject": "Mathematics",
                        "grade": "7"
                    }
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✓ Success! Response: {result.get('message', 'No message')[:200]}...")
            else:
                print(f"✗ Failed with status {response.status_code}")
                print(f"Response: {response.text}")
    except Exception as e:
        print(f"✗ Error: {e}")

async def main():
    """Run all tests"""
    print("Testing Unified Binti Hamdani Endpoint")
    print("="*80)
    
    await test_binti_endpoint()
    await test_binti_chat_endpoint()
    
    print("\n" + "="*80)
    print("All tests completed!")

if __name__ == "__main__":
    # Check if server is running
    import subprocess
    try:
        # Try to check if port 5000 is in use
        result = subprocess.run(["netstat", "-tln"], capture_output=True, text=True)
        if ":5000" not in result.stdout:
            print("⚠️  Warning: Port 5000 doesn't appear to be in use.")
            print("Make sure the backend server is running with: python backend/server.py")
            print("Or run: cd /app && python -m uvicorn backend.server:app --host 0.0.0.0 --port 5000 --reload")
    except:
        pass
    
    asyncio.run(main())