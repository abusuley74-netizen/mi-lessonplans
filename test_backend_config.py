#!/usr/bin/env python3
"""
Test script to verify backend configuration
"""

import os
import re

def test_env_file():
    """Test that .env file has correct backend URL"""
    
    print("🔍 Testing .env file configuration")
    print("=" * 60)
    
    env_path = "frontend/.env"
    try:
        with open(env_path, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ Could not find {env_path}")
        return False
    
    # Check for REACT_APP_BACKEND_URL
    pattern = r'REACT_APP_BACKEND_URL=(.+)'
    match = re.search(pattern, content)
    
    if not match:
        print("❌ Could not find REACT_APP_BACKEND_URL in .env file")
        return False
    
    backend_url = match.group(1).strip()
    print(f"✅ Found REACT_APP_BACKEND_URL: {backend_url}")
    
    # Check if it's the correct URL
    correct_urls = [
        "https://mi-lessonplan.site",
        "https://mi-learning-hub.emergent.host"
    ]
    
    if backend_url in correct_urls:
        print(f"✅ Backend URL is one of the allowed URLs: {backend_url}")
        return True
    else:
        print(f"❌ Backend URL is not one of the allowed URLs: {backend_url}")
        print(f"   Allowed URLs: {', '.join(correct_urls)}")
        return False

def test_csp_configuration():
    """Test that CSP includes the backend URL"""
    
    print("\n🔍 Testing CSP configuration")
    print("=" * 60)
    
    index_path = "frontend/public/index.html"
    try:
        with open(index_path, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ Could not find {index_path}")
        return False
    
    # Find CSP meta tag
    csp_pattern = r'<meta http-equiv="Content-Security-Policy" content="([^"]+)"'
    match = re.search(csp_pattern, content)
    
    if not match:
        print("❌ Could not find CSP meta tag in index.html")
        return False
    
    csp_content = match.group(1)
    print(f"✅ Found CSP configuration")
    
    # Check connect-src directive
    connect_src_pattern = r'connect-src ([^;]+)'
    match = re.search(connect_src_pattern, csp_content)
    
    if not match:
        print("❌ Could not find connect-src directive in CSP")
        return False
    
    connect_src = match.group(1)
    print(f"✅ connect-src directive: {connect_src}")
    
    # Check for required domains
    required_domains = [
        "https://mi-lessonplan.site",
        "https://mi-learning-hub.emergent.host",
        "https://api.clickpesa.com",
        "https://accounts.google.com"
    ]
    
    all_present = True
    for domain in required_domains:
        if domain in connect_src:
            print(f"  ✅ {domain} is allowed in connect-src")
        else:
            print(f"  ❌ {domain} is NOT allowed in connect-src")
            all_present = False
    
    return all_present

def test_backend_connectivity():
    """Test connectivity to backend servers"""
    
    print("\n🔍 Testing backend connectivity")
    print("=" * 60)
    
    import subprocess
    import json
    
    backends = [
        ("mi-lessonplan.site", "https://mi-lessonplan.site/api/health"),
        ("mi-learning-hub.emergent.host", "https://mi-learning-hub.emergent.host/api/health"),
    ]
    
    all_healthy = True
    for name, url in backends:
        try:
            # Use curl to check health endpoint
            result = subprocess.run(
                ["curl", "-s", url],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                try:
                    data = json.loads(result.stdout)
                    if data.get("status") == "healthy":
                        print(f"✅ {name} ({url}) is healthy")
                    else:
                        print(f"⚠️  {name} ({url}) responded but not healthy: {data}")
                        all_healthy = False
                except json.JSONDecodeError:
                    print(f"⚠️  {name} ({url}) returned non-JSON response: {result.stdout[:100]}")
                    all_healthy = False
            else:
                print(f"❌ {name} ({url}) failed with error: {result.stderr}")
                all_healthy = False
                
        except subprocess.TimeoutExpired:
            print(f"❌ {name} ({url}) timed out")
            all_healthy = False
        except Exception as e:
            print(f"❌ {name} ({url}) error: {e}")
            all_healthy = False
    
    return all_healthy

if __name__ == "__main__":
    print("🚀 Testing Backend Configuration for Google Auth Fix")
    print("=" * 60)
    
    env_ok = test_env_file()
    csp_ok = test_csp_configuration()
    connectivity_ok = test_backend_connectivity()
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS")
    print("=" * 60)
    
    if env_ok and csp_ok and connectivity_ok:
        print("✅ ALL TESTS PASSED!")
        print("\nThe configuration has been successfully updated:")
        print("1. ✅ .env file has correct REACT_APP_BACKEND_URL")
        print("2. ✅ CSP allows connections to required domains")
        print("3. ✅ Backend servers are reachable")
        print("\nNext steps:")
        print("1. Rebuild the frontend with: cd frontend && yarn build")
        print("2. Redeploy to production")
        print("3. Test Google authentication")
        exit(0)
    else:
        print("❌ SOME TESTS FAILED")
        if not env_ok:
            print("- .env file configuration needs updates")
        if not csp_ok:
            print("- CSP configuration needs updates")
        if not connectivity_ok:
            print("- Backend connectivity issues")
        exit(1)