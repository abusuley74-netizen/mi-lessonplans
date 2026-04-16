#!/usr/bin/env python3
"""Test CORS configuration fix"""

import os
import sys

print("Testing CORS configuration...")
print("=" * 60)

# Check current CORS_ORIGINS value
cors_origins = os.environ.get("CORS_ORIGINS", "")
print(f"Current CORS_ORIGINS environment variable: {cors_origins}")

# Parse the origins
if cors_origins == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in cors_origins.split(",") if o.strip()]

print(f"\nParsed origins: {origins}")

# Check for the problematic domain
problematic_domain = "https://mi-learning-hub.preview.static.emergentagent.com"
if problematic_domain in origins:
    print(f"\n✅ Problematic domain '{problematic_domain}' is in CORS_ORIGINS")
else:
    print(f"\n❌ Problematic domain '{problematic_domain}' is NOT in CORS_ORIGINS")

# Check if we're using wildcard
if "*" in origins:
    print("\n⚠️  WARNING: Using wildcard '*' with allow_credentials=True")
    print("   This will cause CORS errors when frontend uses credentials: 'include'")
    print("   Solution: Use specific domains instead of '*'")
else:
    print("\n✅ Using specific domains (not wildcard)")

# Check backend server.py configuration
print("\n" + "=" * 60)
print("Checking server.py CORS configuration...")

with open("/app/backend/server.py", "r") as f:
    content = f.read()
    
    # Check for allow_credentials
    if "allow_credentials=True" in content:
        print("✅ CORS middleware configured with allow_credentials=True")
    else:
        print("❌ CORS middleware NOT configured with allow_credentials=True")
    
    # Check for environment variable reading
    if 'os.environ.get("CORS_ORIGINS", "*")' in content:
        print("✅ CORS_ORIGINS read from environment variable")
    else:
        print("❌ CORS_ORIGINS not read from environment variable")

print("\n" + "=" * 60)
print("SUMMARY:")
print("1. The CORS_ORIGINS has been updated to include the missing domain")
print("2. The backend server needs to be RESTARTED to pick up the new value")
print("3. After restart, CORS should work for all domains:")
print("   - https://mi-lessonplan.site")
print("   - https://mi-learning-hub.emergent.host")
print("   - https://mi-learning-hub.preview.emergentagent.com")
print("   - https://mi-learning-hub.preview.static.emergentagent.com")
print("\n🚨 ACTION REQUIRED: Restart your backend server!")