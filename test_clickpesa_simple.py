#!/usr/bin/env python3
"""
Simple ClickPesa credentials test
"""
import os
import sys

# Load environment variables from .env file
env_file = "/app/backend/.env"
if os.path.exists(env_file):
    print(f"📁 Loading environment from: {env_file}")
    with open(env_file, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value
                print(f"   {key}={value[:20]}..." if len(value) > 20 else f"   {key}={value}")

# Check credentials
api_key = os.environ.get("CLICKPESA_API_KEY", "")
client_id = os.environ.get("CLICKPESA_CLIENT_ID", "")
use_sandbox = os.environ.get("CLICKPESA_USE_SANDBOX", "false").lower() in ["true", "1", "yes"]
base_url = os.environ.get("CLICKPESA_SANDBOX_URL" if use_sandbox else "CLICKPESA_BASE_URL", "")

print("\n🔍 Credentials Check:")
print(f"   API Key: {api_key[:15]}... (length: {len(api_key)})")
print(f"   Client ID: {client_id[:15]}... (length: {len(client_id)})")
print(f"   Environment: {'SANDBOX' if use_sandbox else 'PRODUCTION'}")
print(f"   Base URL: {base_url}")

# Check if credentials look valid
if not api_key or not client_id:
    print("\n❌ ERROR: Missing API Key or Client ID")
    sys.exit(1)

# Check API key format (ClickPesa API keys typically start with SK)
if not api_key.startswith("SK"):
    print(f"\n⚠️  WARNING: API Key doesn't start with 'SK' - might be invalid format")

# Check client ID format (ClickPesa client IDs typically start with ID)
if not client_id.startswith("ID"):
    print(f"⚠️  WARNING: Client ID doesn't start with 'ID' - might be invalid format")

print("\n✅ Credentials loaded successfully")
print("\n🔧 Next steps:")
print("1. Verify the credentials are correct with ClickPesa")
print("2. Check if account is active")
print("3. Ensure COLLECTION_API permission is enabled")
print("4. Test with sandbox first, then production")

# Test network connectivity
import subprocess
print("\n🌐 Testing network connectivity to ClickPesa...")
try:
    # Extract domain from base URL
    import urllib.parse
    parsed_url = urllib.parse.urlparse(base_url)
    domain = parsed_url.netloc
    
    result = subprocess.run(['curl', '-I', '-s', '-o', '/dev/null', '-w', '%{http_code}', f'https://{domain}'], 
                          capture_output=True, text=True, timeout=5)
    if result.returncode == 0:
        print(f"   ✅ Network connectivity to {domain}: OK (HTTP {result.stdout})")
    else:
        print(f"   ❌ Network connectivity to {domain}: Failed")
except Exception as e:
    print(f"   ⚠️  Network test error: {e}")

print("\n🎯 To answer your original question:")
print("For ClickPesa to work on production site:")
print("1. YES, it must be the same payment method on preview as well")
print("2. You need valid credentials for the environment you're using")
print("3. The error 'Invalid client details' means:")
print("   - Wrong API Key or Client ID")
print("   - Credentials for wrong environment (sandbox vs production)")
print("   - Account not activated or missing permissions")
print("   - Network connectivity issues")

sys.exit(0)