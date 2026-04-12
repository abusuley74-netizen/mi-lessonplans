#!/usr/bin/env python3
"""
Test DeepSeek API connection with the provided key
"""
import os
import sys
import asyncio
import httpx
import json

async def test_deepseek_connection():
    """Test if DeepSeek API is accessible with the provided key"""
    # Load environment
    env_file = "/app/backend/.env"
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value
    
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    
    if not api_key:
        print("❌ DEEPSEEK_API_KEY not found")
        return False
    
    print(f"Testing DeepSeek API key: {api_key[:15]}...")
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}'
    }
    
    # Simple test request
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant. Respond with 'DeepSeek API is working!'"
            },
            {
                "role": "user",
                "content": "Test connection"
            }
        ],
        "temperature": 0.7,
        "max_tokens": 50
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("Sending test request to DeepSeek API...")
            response = await client.post(
                "https://api.deepseek.com/v1/chat/completions",
                headers=headers,
                json=payload
            )
            
            print(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                message = data["choices"][0]["message"]["content"]
                print(f"✅ DeepSeek API is working!")
                print(f"Response: {message}")
                return True
            else:
                print(f"❌ DeepSeek API error: {response.status_code}")
                print(f"Response: {response.text[:200]}")
                return False
                
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

async def main():
    print("🧪 Testing DeepSeek API Connection")
    print("=" * 50)
    
    success = await test_deepseek_connection()
    
    if success:
        print("\n🎉 DeepSeek integration is ready!")
        print("\nThe following features now use DeepSeek:")
        print("1. Scheme of Work generation (/api/schemes/generate)")
        print("2. Lesson plan generation (generate_lesson_with_ai)")
        print("3. Translation for dictation TTS")
        print("\nNote: TTS still uses Azure Speech Services")
        print("Browser-based TTS is available via TextToSpeechStudio component")
        return 0
    else:
        print("\n⚠️  DeepSeek API test failed")
        print("Please check your API key and network connection")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)