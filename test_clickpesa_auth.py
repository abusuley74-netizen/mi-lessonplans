#!/usr/bin/env python3
"""
Test ClickPesa authentication with real credentials
"""

import asyncio
import httpx
import os
import sys

# Your credentials
CLIENT_ID = "IDf6LaoJzaSyA6F2hwrDOdLJCxfGjjzU"
API_KEY = "SKVOuPRdWfxm4Dz1rOCGXSIDEwyYlTqFY9YIr7RCfJ"  # You said you already gave me the API key
BASE_URL = "https://api.clickpesa.com"

async def test_authentication():
    """Test ClickPesa authentication endpoint"""
    print("🔐 Testing ClickPesa Authentication...")
    print(f"Client ID: {CLIENT_ID}")
    print(f"API Key: {API_KEY[:10]}... (first 10 chars)")
    
    endpoint = f"{BASE_URL}/v1/auth/token"
    
    payload = {
        "clientId": CLIENT_ID,
        "apiKey": API_KEY
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            print(f"\n📤 Sending request to: {endpoint}")
            response = await client.post(endpoint, json=payload, headers=headers, timeout=10.0)
            
            print(f"\n📥 Response Status: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                token = data.get("token")
                if token:
                    print(f"✅ SUCCESS: Got authentication token!")
                    print(f"Token (first 50 chars): {token[:50]}...")
                    return token
                else:
                    print(f"❌ ERROR: No token in response")
                    print(f"Response: {data}")
                    return None
            else:
                print(f"❌ ERROR: Authentication failed")
                print(f"Response: {response.text}")
                
                # Check for specific errors
                error_text = response.text.lower()
                if "collection_api" in error_text:
                    print("\n🚨 IMPORTANT: COLLECTION_API permission required!")
                    print("You need to contact ClickPesa support to enable COLLECTION_API permission.")
                    print("Error: 'Application has no access to COLLECTION_API'")
                elif "unauthorized" in error_text or "invalid" in error_text:
                    print("\n🚨 IMPORTANT: Invalid credentials!")
                    print("Please check your Client ID and API Key.")
                elif "not found" in error_text:
                    print("\n🚨 IMPORTANT: Endpoint not found!")
                    print("Check the API endpoint URL.")
                
                return None
                
    except httpx.RequestError as e:
        print(f"❌ NETWORK ERROR: {e}")
        return None
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}")
        return None

async def test_ussd_push_payment(auth_token):
    """Test USSD-PUSH payment endpoint"""
    if not auth_token:
        print("\n❌ Cannot test USSD-PUSH without authentication token")
        return
    
    print(f"\n💰 Testing USSD-PUSH Payment...")
    
    endpoint = f"{BASE_URL}/third-parties/payments/initiate-ussd-push-request"
    
    payload = {
        "amount": "1000",
        "currency": "TZS",
        "orderReference": f"TEST_{os.urandom(4).hex()}",
        "phoneNumber": "255712345678"  # Test phone number
    }
    
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            print(f"\n📤 Sending USSD-PUSH request to: {endpoint}")
            response = await client.post(endpoint, json=payload, headers=headers, timeout=30.0)
            
            print(f"\n📥 Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ SUCCESS: USSD-PUSH payment initiated!")
                print(f"Response: {data}")
                return True
            else:
                print(f"❌ ERROR: USSD-PUSH payment failed")
                print(f"Response: {response.text}")
                
                # Check for specific errors
                error_text = response.text.lower()
                if "collection_api" in error_text:
                    print("\n🚨 COLLECTION_API permission required!")
                    print("Contact ClickPesa support to enable COLLECTION_API.")
                elif "insufficient" in error_text:
                    print("\n🚨 Insufficient balance or permissions!")
                elif "invalid" in error_text:
                    print("\n🚨 Invalid request parameters!")
                
                return False
                
    except httpx.RequestError as e:
        print(f"❌ NETWORK ERROR: {e}")
        return False
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}")
        return False

async def main():
    """Main test function"""
    print("=" * 60)
    print("CLICKPESA API TEST WITH REAL CREDENTIALS")
    print("=" * 60)
    
    # Test 1: Authentication
    auth_token = await test_authentication()
    
    if auth_token:
        # Test 2: USSD-PUSH Payment
        await test_ussd_push_payment(auth_token)
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
    
    if auth_token:
        print("\n🎉 Authentication SUCCESSFUL!")
        print("Your ClickPesa credentials are valid.")
        print("\n🚨 Next step: Contact ClickPesa to enable COLLECTION_API permission")
        print("   Error: 'Application has no access to COLLECTION_API'")
    else:
        print("\n❌ Authentication FAILED!")
        print("Check your credentials and contact ClickPesa support.")

if __name__ == "__main__":
    asyncio.run(main())