#!/usr/bin/env python3
import requests
import json
import time

def test_delete_functionality():
    """Test the user deletion endpoint after fixing the validation issue"""
    
    print("Testing user deletion functionality...")
    
    # Test data
    url = 'http://localhost:8000/api/admin/users/test-user-tts'
    headers = {'Content-Type': 'application/json'}
    data = {'action': 'delete', 'reason': 'Test deletion'}
    
    try:
        # First, we need to get an admin session token
        print("1. Logging in as admin...")
        login_url = 'http://localhost:8000/api/admin/auth/login'
        login_data = {'email': 'admin@milessonplan.com', 'password': 'password'}
        
        login_response = requests.post(login_url, json=login_data, timeout=10)
        
        if login_response.status_code == 200:
            print("   ✓ Login successful")
            session_token = login_response.json().get('session_token')
            
            # Now try the delete action
            print("2. Testing delete endpoint...")
            headers['Authorization'] = f'Bearer {session_token}'
            response = requests.put(url, json=data, headers=headers, timeout=10)
            
            print(f"   Status Code: {response.status_code}")
            print(f"   Response: {response.text}")
            
            if response.status_code == 200:
                print("   ✓ Delete functionality works!")
                print("   The 422 validation error has been fixed.")
                return True
            elif response.status_code == 422:
                print("   ✗ Still getting 422 validation error")
                print("   The fix may not have been applied correctly.")
                return False
            else:
                print(f"   ✗ Unexpected status code: {response.status_code}")
                return False
        else:
            print(f"   ✗ Login failed: {login_response.status_code}")
            print(f"   Response: {login_response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("   ✗ Cannot connect to server. Is the backend running?")
        print("   Run: cd /app/backend && uvicorn server:app --host 0.0.0.0 --port 8000 --reload")
        return False
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False

if __name__ == "__main__":
    # Wait a moment for server to start if needed
    time.sleep(2)
    
    success = test_delete_functionality()
    
    if success:
        print("\n✅ SUCCESS: User deletion functionality is working correctly!")
        print("The validation error has been fixed by removing 'user_id' from UserManagementModel.")
    else:
        print("\n❌ FAILED: User deletion functionality test failed.")
        print("Check the server logs and ensure the backend is running properly.")