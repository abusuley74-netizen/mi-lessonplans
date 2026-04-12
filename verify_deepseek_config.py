#!/usr/bin/env python3
"""
Verify DeepSeek configuration
"""
import os
import sys

def check_configuration():
    """Check if DeepSeek is properly configured"""
    print("🔍 Verifying DeepSeek Integration Configuration")
    print("=" * 60)
    
    # Load environment variables from backend/.env
    env_file = "/app/backend/.env"
    if os.path.exists(env_file):
        print(f"📁 Loading environment from {env_file}")
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value
    
    # Check DEEPSEEK_API_KEY
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key or api_key == "your_deepseek_api_key_here":
        print("❌ DEEPSEEK_API_KEY is not configured")
        print("   Please set a valid DEEPSEEK_API_KEY in backend/.env")
        print("   Get your API key from https://platform.deepseek.com/api-keys")
        print("   Then update backend/.env with your actual key")
        return False
    else:
        print(f"✅ DEEPSEEK_API_KEY is configured: {api_key[:10]}...")
    
    # Check Azure Speech configuration
    azure_key = os.environ.get("AZURE_SPEECH_KEY_1")
    azure_endpoint = os.environ.get("AZURE_SPEECH_ENDPOINT")
    
    if not azure_key:
        print("❌ AZURE_SPEECH_KEY_1 is not configured")
        return False
    else:
        print(f"✅ AZURE_SPEECH_KEY_1 is configured: {azure_key[:10]}...")
    
    if not azure_endpoint:
        print("❌ AZURE_SPEECH_ENDPOINT is not configured")
        return False
    else:
        print(f"✅ AZURE_SPEECH_ENDPOINT is configured: {azure_endpoint}")
    
    # Check server.py configuration
    print("\n📋 Checking server.py configuration...")
    try:
        with open("/app/backend/server.py", "r") as f:
            content = f.read()
            
        # Check for DEEPSEEK_API_KEY usage
        if "DEEPSEEK_API_KEY" in content:
            print("✅ server.py uses DEEPSEEK_API_KEY")
        else:
            print("❌ server.py doesn't use DEEPSEEK_API_KEY")
            return False
            
        # Check for DeepSeek API endpoint
        if "api.deepseek.com" in content:
            print("✅ server.py configured for DeepSeek API")
        else:
            print("❌ server.py not configured for DeepSeek API")
            return False
            
        # Check for Azure Speech usage in dictation functions
        if "AZURE_SPEECH_KEY_1" in content:
            print("✅ server.py uses Azure Speech for TTS")
        else:
            print("❌ server.py doesn't use Azure Speech for TTS")
            return False
            
    except Exception as e:
        print(f"❌ Error reading server.py: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("🎉 Configuration verification complete!")
    print("\n📝 Next steps:")
    print("1. Get a DeepSeek API key from https://platform.deepseek.com/api-keys")
    print("2. Update DEEPSEEK_API_KEY in backend/.env with your actual key")
    print("3. Restart the backend server")
    print("4. Test AI features (scheme generation, dictation TTS)")
    
    return True

if __name__ == "__main__":
    success = check_configuration()
    sys.exit(0 if success else 1)