#!/usr/bin/env python3
"""
Test script to verify CSP fix for ClickPesa integration
"""

import os
import sys

def test_csp_configuration():
    """Test that CSP configuration includes ClickPesa domains"""
    
    print("🔍 Testing CSP Configuration for ClickPesa Integration")
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
    import re
    csp_pattern = r'<meta http-equiv="Content-Security-Policy" content="([^"]+)"'
    match = re.search(csp_pattern, content)
    
    if not match:
        print("❌ Could not find CSP meta tag in index.html")
        return False
    
    csp_content = match.group(1)
    print(f"✅ Found CSP configuration")
    
    # Check for required ClickPesa domains
    required_domains = {
        'script-src': [
            'https://checkout.clickpesa.com',
            'https://api.clickpesa.com',
            "'unsafe-inline'",
            "'unsafe-eval'"
        ],
        'frame-src': [
            'https://checkout.clickpesa.com'
        ],
        'connect-src': [
            'https://api.clickpesa.com'
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
    
    # Check each required domain
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
    
    # Check for other important domains
    other_checks = [
        ('script-src', 'https://static.cloudflareinsights.com', 'Cloudflare Insights'),
        ('style-src', 'https://accounts.google.com', 'Google One-Tap'),
        ('connect-src', 'https://accounts.google.com', 'Google Auth'),
    ]
    
    print("\n🔍 Checking other important domains:")
    for directive, domain, description in other_checks:
        if directive in directives and domain in directives[directive]:
            print(f"  ✅ {description} ({domain}) included in {directive}")
        else:
            print(f"  ⚠️  {description} ({domain}) not in {directive}")
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ CSP configuration is properly set up for ClickPesa integration!")
        print("\nSummary of changes:")
        print("1. Added ClickPesa domains to script-src: checkout.clickpesa.com, api.clickpesa.com")
        print("2. Added 'unsafe-inline' and 'unsafe-eval' to script-src for hosted checkout")
        print("3. Added checkout.clickpesa.com to frame-src for iframe/popup support")
        print("4. Added api.clickpesa.com to connect-src for API calls")
        print("5. Added other required domains for Google Auth and analytics")
        return True
    else:
        print("❌ CSP configuration needs updates for ClickPesa integration")
        return False

def test_clickpesa_service():
    """Test ClickPesa service import and basic functionality"""
    
    print("\n🔍 Testing ClickPesa Service")
    print("=" * 60)
    
    try:
        sys.path.append('backend')
        from clickpesa_service import ClickPesaService
        
        print("✅ ClickPesaService imported successfully")
        
        # Create instance
        service = ClickPesaService()
        print("✅ ClickPesaService instance created")
        
        # Check configuration
        print(f"✅ API Key configured: {'Yes' if service.api_key else 'No'}")
        print(f"✅ Client ID configured: {'Yes' if service.client_id else 'No'}")
        print(f"✅ Base URL: {service.base_url}")
        
        # Check hosted checkout method signature
        import inspect
        sig = inspect.signature(service.create_hosted_checkout_payment)
        params = list(sig.parameters.keys())
        
        print(f"\n✅ Hosted checkout method parameters: {', '.join(params)}")
        
        required_params = ['amount', 'order_reference', 'currency', 'customer_email', 'customer_phone']
        missing = [p for p in required_params if p not in params]
        
        if not missing:
            print("✅ All required parameters present for hosted checkout")
        else:
            print(f"❌ Missing parameters: {missing}")
            return False
            
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing ClickPesa CSP Fix")
    print("=" * 60)
    
    csp_ok = test_csp_configuration()
    service_ok = test_clickpesa_service()
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS")
    print("=" * 60)
    
    if csp_ok and service_ok:
        print("✅ ALL TESTS PASSED!")
        print("\nThe Content Security Policy has been successfully updated to allow")
        print("ClickPesa's hosted checkout page to load scripts and resources.")
        print("\nNext steps:")
        print("1. Deploy the updated frontend with the new CSP")
        print("2. Test the ClickPesa checkout flow in the PaymentSettings component")
        print("3. Verify that the hosted checkout page loads without CSP errors")
        sys.exit(0)
    else:
        print("❌ SOME TESTS FAILED")
        if not csp_ok:
            print("- CSP configuration needs updates")
        if not service_ok:
            print("- ClickPesa service has issues")
        sys.exit(1)