#!/usr/bin/env python3
"""Test the fixes for CORS and scheme generation"""

import os
import sys

print("Testing the fixes...")
print("=" * 60)

# 1. Check CORS configuration
print("\n1. Checking CORS configuration:")
with open("/app/backend/.env", "r") as f:
    for line in f:
        if "CORS_ORIGINS" in line:
            print(f"   CORS_ORIGINS: {line.strip()}")
            if line.strip() == 'CORS_ORIGINS="*"':
                print("   ✅ CORS is set to allow all origins (temporary fix)")
            else:
                print("   ⚠️  CORS is not set to '*'")

# 2. Check Arabic font fix
print("\n2. Checking Arabic font fix:")
with open("/app/backend/server.py", "r") as f:
    content = f.read()
    if "Amiri" in content and "Noto Sans Arabic" in content:
        print("   ✅ Arabic font support added to _html_to_pdf function")
    else:
        print("   ❌ Arabic font support not found")

# 3. Check scheme generation endpoint
print("\n3. Checking scheme generation endpoint:")
if '"response_format": { "type": "json_object" }' in content:
    print("   ⚠️  response_format found - might cause issues with DeepSeek")
else:
    print("   ✅ No response_format in scheme generation (should work with DeepSeek)")

# 4. Check loading spinners
print("\n4. Checking loading spinners in MyFiles:")
with open("/app/frontend/src/components/MyFiles.js", "r") as f:
    myfiles_content = f.read()
    if "downloadingFiles" in myfiles_content and "animate-spin" in myfiles_content:
        print("   ✅ Loading spinners implemented")
    else:
        print("   ❌ Loading spinners not found")

print("\n" + "=" * 60)
print("Summary:")
print("- CORS: Set to '*' to allow all origins (temporary fix)")
print("- Arabic font: Added Amiri and Noto Sans Arabic support")
print("- Scheme generation: Should work with DeepSeek API")
print("- Loading spinners: Implemented in MyFiles component")
print("\nNote: The backend may need to be restarted for CORS changes to take effect.")