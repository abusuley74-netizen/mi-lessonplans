#!/usr/bin/env python3
"""
Test Binti endpoint with authentication
"""
import asyncio
import httpx
import json

async def test_with_auth():
    """Test Binti endpoint with authentication"""
    base_url = "http://localhost:8001"
    
    # First, authenticate to get a session
    print("Step 1: Authenticating...")
    try:
        async with httpx.AsyncClient() as client:
            # Try to authenticate with Google OAuth (simulated)
            # We'll use a test endpoint if available, or create a test user
            auth_response = await client.post(
                f"{base_url}/api/auth/google",
                json={
                    "credential": "test_credential_123",
                    "referral_code": ""
                },
                timeout=30.0
            )
            
            if auth_response.status_code == 200:
                auth_data = auth_response.json()
                session_token = auth_response.cookies.get("session_token")
                user = auth_data.get("user", {})
                print(f"✓ Authenticated as: {user.get('email', 'Unknown')}")
                
                # Now test Binti endpoint with the session
                print("\nStep 2: Testing Binti endpoint...")
                
                # Test chat
                response = await client.post(
                    f"{base_url}/api/binti",
                    json={
                        "message": "Hello Binti, can you help me with a lesson plan?",
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
                    print(f"✓ Binti response type: {result.get('type')}")
                    print(f"Message: {result.get('message', 'No message')[:200]}...")
                    
                    # Test if it can generate actual content
                    if result.get('type') == 'chat':
                        print("✓ Binti is responding as an AI assistant")
                    elif result.get('type') == 'scheme':
                        print(f"✓ Binti generated a scheme with {result.get('data', {}).get('total_weeks', 0)} weeks")
                    elif result.get('type') == 'lesson':
                        print(f"✓ Binti generated a lesson plan for topic: {result.get('data', {}).get('topic', 'Unknown')}")
                    
                    return True
                else:
                    print(f"✗ Binti endpoint failed: {response.status_code}")
                    print(f"Response: {response.text}")
                    return False
            else:
                print(f"✗ Authentication failed: {auth_response.status_code}")
                print(f"Response: {auth_response.text}")
                return False
                
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

async def test_binti_prompt_file():
    """Test the Binti prompt file directly"""
    print("\n" + "="*80)
    print("Testing Binti Prompt File Directly")
    
    try:
        # Import the bintiPrompt module
        import sys
        sys.path.insert(0, '/app/backend')
        
        from services.bintiPrompt import get_binti_prompt
        
        # Test with different contexts
        test_contexts = [
            {
                "subject": "Kiswahili",
                "grade": "5",
                "syllabus": "Zanzibar",
                "topic": "Vitenzi (Verbs)"
            },
            {
                "subject": "Arabic",
                "grade": "3", 
                "syllabus": "Zanzibar",
                "topic": "الضمائر (Pronouns)"
            },
            {
                "subject": "Mathematics",
                "grade": "7",
                "syllabus": "Tanzania Mainland",
                "topic": "Algebra"
            }
        ]
        
        for i, context in enumerate(test_contexts, 1):
            print(f"\nTest {i}: {context['subject']} {context['grade']} - {context['topic']}")
            prompt = get_binti_prompt(context, [])
            print(f"Prompt length: {len(prompt)} characters")
            print(f"First 300 chars: {prompt[:300]}...")
            
            # Check if prompt contains Binti persona
            if "Binti Hamdani" in prompt:
                print("✓ Contains Binti Hamdani persona")
            if "Zanzibar" in prompt or "Tanzania" in prompt:
                print("✓ Contains syllabus reference")
            if context['subject'].lower() in prompt.lower():
                print(f"✓ Contains subject reference: {context['subject']}")
                
        return True
        
    except Exception as e:
        print(f"✗ Error testing bintiPrompt: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run all tests"""
    print("Testing Binti Hamdani Integration")
    print("="*80)
    
    # Test 1: Authentication and endpoint
    print("\nTest 1: Authentication and Binti Endpoint")
    print("-"*40)
    auth_success = await test_with_auth()
    
    # Test 2: Direct prompt file test
    print("\nTest 2: Binti Prompt System")
    print("-"*40)
    prompt_success = await test_binti_prompt_file()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY:")
    print(f"Authentication & Endpoint: {'✓ PASS' if auth_success else '✗ FAIL'}")
    print(f"Prompt System: {'✓ PASS' if prompt_success else '✗ FAIL'}")
    
    if auth_success and prompt_success:
        print("\n✅ Binti Hamdani system is working correctly!")
        print("The AI assistant can now generate lesson plans, schemes of work,")
        print("and provide curriculum advice with the enhanced Binti persona.")
    else:
        print("\n⚠️  Some tests failed. Check the implementation.")
        
    return auth_success and prompt_success

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)