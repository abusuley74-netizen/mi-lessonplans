#!/usr/bin/env python3
import requests
import json

# Test the download endpoint with cookies
base_url = "http://localhost:8001/api"

# First, let's try to login to get a session
print("Testing authentication and download...")

# Try to get a lesson without authentication
print("\n1. Testing download without authentication:")
try:
    response = requests.get(f"{base_url}/lessons/some_lesson_id/export")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text[:200]}")
except Exception as e:
    print(f"   Error: {e}")

# Test with a mock session cookie
print("\n2. Testing with mock session cookie:")
try:
    cookies = {"session_token": "test_session_123"}
    response = requests.get(f"{base_url}/lessons/some_lesson_id/export", cookies=cookies)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text[:200]}")
except Exception as e:
    print(f"   Error: {e}")

# Test the health endpoint to make sure server is working
print("\n3. Testing health endpoint:")
try:
    response = requests.get(f"{base_url}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text}")
except Exception as e:
    print(f"   Error: {e}")

# Test cookie settings
print("\n4. Checking cookie configuration in server.py:")
import subprocess
result = subprocess.run(["grep", "-n", "secure=", "/app/backend/server.py"], capture_output=True, text=True)
print(f"   Cookie secure settings found:")
for line in result.stdout.strip().split('\n'):
    if line:
        print(f"   {line}")

result = subprocess.run(["grep", "-n", "samesite=", "/app/backend/server.py"], capture_output=True, text=True)
print(f"\n   Cookie samesite settings found:")
for line in result.stdout.strip().split('\n'):
    if line:
        print(f"   {line}")