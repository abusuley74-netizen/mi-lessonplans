#!/usr/bin/env python3
"""
Test script to verify CSP configuration for Google Auth
"""

import re

def test_google_auth_csp():
    """Test that CSP configuration includes Google Auth domains"""
    
    print("🔍 Testing CSP Configuration for Google Auth")
    print("=" * 60)
    
    # Read the index.html file
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
    
    # Check for required Google Auth domains
    required_domains = {
        'script-src': [
            'https://accounts.google.com',
            "'unsafe-inline'",
            "'unsafe-eval'"
        ],
        'style-src': [
            'https://accounts.google.com',
            "'unsafe-inline'"
        ],
        'connect-src': [
            'https://accounts.google.com'
        ],
        'frame-src': [
            'https://accounts.google.com'
        ]
    }
    
    all_passed = True
    
    # Parse CSP directives
    directives = {}
    for directive in csp_content.split(';'):
        directive = directive.strip()
        if not directive:
            continue
        if ' ' in directive:
            key, value = directive.split(' ', 1)
            directives[key] = value
    
    print("\n🔍 Checking Google Auth domains:")
    for directive, domains in required_domains.items():
        if directive not in directives:
            print(f"❌ Missing {directive} directive in CSP")
            all_passed = False
            continue
            
        directive_value = directives[directive]
        for domain in domains:
            if domain in directive_value:
                print(f"  ✅ {directive} includes {domain}")
            else:
                print(f"  ❌ {directive} missing {domain}")
                all_passed = False
    
    # Check for other important Google-related domains
    other_checks = [
        ('script-src', 'https://apis.google.com', 'Google APIs'),
        ('script-src', 'https://www.google.com', 'Google.com'),
        ('script-src', 'https://www.gstatic.com', 'Google Static'),
    ]
    
    print("\n🔍 Checking other Google-related domains (optional but good to have):")
    for directive, domain, description in other_checks:
        if directive in directives and domain in directives[directive]:
            print(f"  ✅ {description} ({domain}) included in {directive}")
        else:
            print(f"  ⚠️  {description} ({domain}) not in {directive} (optional)")
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ CSP configuration is properly set up for Google Auth!")
        print("\nSummary of Google Auth support:")
        print("1. accounts.google.com is in script-src (for Google Sign-In scripts)")
        print("2. accounts.google.com is in style-src (for Google One-Tap styles)")
        print("3. accounts.google.com is in connect-src (for API calls)")
        print("4. accounts.google.com is in frame-src (for iframes)")
        print("5. 'unsafe-inline' and 'unsafe-eval' are enabled (required for Google Sign-In)")
        return True
    else:
        print("❌ CSP configuration needs updates for Google Auth")
        return False

def test_combined_csp():
    """Test that CSP works for both ClickPesa and Google Auth"""
    
    print("\n🔍 Testing Combined CSP for ClickPesa + Google Auth")
    print("=" * 60)
    
    # Read the index.html file
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
    
    # Check for critical domains
    critical_domains = {
        'ClickPesa Checkout': 'https://checkout.clickpesa.com',
        'ClickPesa API': 'https://api.clickpesa.com',
        'Google Auth': 'https://accounts.google.com',
        'Google Fonts': 'https://fonts.googleapis.com',
        'Google Fonts GStatic': 'https://fonts.gstatic.com',
        'FontShare': 'https://api.fontshare.com',
        'Cloudflare Insights': 'https://static.cloudflareinsights.com',
        'Emergent Assets': 'https://assets.emergent.sh',
    }
    
    print("Critical domains that must be allowed:")
    all_critical_present = True
    
    # Parse CSP directives
    directives = {}
    for directive in csp_content.split(';'):
        directive = directive.strip()
        if not directive:
            continue
        if ' ' in directive:
            key, value = directive.split(' ', 1)
            directives[key] = value
    
    # Check each critical domain
    for description, domain in critical_domains.items():
        found = False
        for directive, value in directives.items():
            if domain in value:
                print(f"  ✅ {description} ({domain}) allowed in {directive}")
                found = True
                break
        
        if not found:
            print(f"  ❌ {description} ({domain}) NOT ALLOWED in CSP")
            all_critical_present = False
    
    print("\n" + "=" * 60)
    if all_critical_present:
        print("✅ All critical domains are allowed in CSP!")
        print("\nThe CSP configuration supports:")
        print("1. Google Authentication (login)")
        print("2. ClickPesa hosted checkout (payments)")
        print("3. Font loading (Google Fonts, FontShare)")
        print("4. Analytics (Cloudflare Insights)")
        print("5. Emergent integration")
        return True
    else:
        print("❌ Some critical domains are missing from CSP")
        return False

if __name__ == "__main__":
    print("🚀 Testing CSP for Google Auth & ClickPesa Integration")
    print("=" * 60)
    
    google_ok = test_google_auth_csp()
    combined_ok = test_combined_csp()
    
    print("\n" + "=" * 60)
    print("📊 FINAL TEST RESULTS")
    print("=" * 60)
    
    if google_ok and combined_ok:
        print("✅ ALL TESTS PASSED!")
        print("\nThe Content Security Policy has been successfully configured to support:")
        print("1. ✅ Google Authentication (login functionality)")
        print("2. ✅ ClickPesa hosted checkout (payment processing)")
        print("3. ✅ All required external domains and resources")
        print("\nUsers should be able to:")
        print("- Log in with Google without CSP errors")
        print("- Use ClickPesa checkout without CSP errors")
        print("- Access all fonts and external resources")
        print("\nThe CSP fix is complete and ready for deployment.")
    else:
        print("❌ SOME TESTS FAILED")
        if not google_ok:
            print("- Google Auth CSP configuration needs updates")
        if not combined_ok:
            print("- Combined CSP configuration needs updates")
        print("\nPlease review the CSP configuration in frontend/public/index.html")