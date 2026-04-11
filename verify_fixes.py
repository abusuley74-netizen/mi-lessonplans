#!/usr/bin/env python3
import re
import base64

def test_table_header_fix():
    """Test that table headers will repeat on every page"""
    # Read the server.py file
    with open('/app/backend/server.py', 'r') as f:
        content = f.read()
    
    # Find the CSS section for scheme of work
    css_pattern = r'\.data td \{[^}]*\}.*?thead \{'
    match = re.search(css_pattern, content, re.DOTALL)
    
    if match:
        print("✓ Found CSS with table header fix")
        # Check if thead rule is present (note: double braces in f-string)
        if 'thead {{ display: table-header-group; }}' in content:
            print("✓ Table header fix is present (thead {{ display: table-header-group; }})")
            return True
        else:
            print("✗ Table header fix is missing")
            return False
    else:
        print("✗ Could not find CSS section")
        return False

def test_upload_view_endpoint():
    """Test that the /view endpoint for uploads exists"""
    with open('/app/backend/server.py', 'r') as f:
        content = f.read()
    
    # Check for the view_upload endpoint
    if '@api_router.get("/uploads/{upload_id}/view")' in content:
        print("✓ Upload view endpoint exists")
        
        # Check that it returns inline for images
        if 'headers["Content-Disposition"] = "inline"' in content:
            print("✓ View endpoint returns inline for images")
            return True
        else:
            print("✗ View endpoint doesn't set inline disposition")
            return False
    else:
        print("✗ Upload view endpoint not found")
        return False

def test_template_image_fix():
    """Test that template image replacement logic is fixed"""
    with open('/app/backend/server.py', 'r') as f:
        content = f.read()
    
    # Check for the fixed regex pattern
    if 're.sub(r\'src="(image_\\d+_[^"]+)"\', replace_image_ref, html)' in content:
        print("✓ Template image replacement uses correct regex with capture group")
        
        # Check for image_map usage
        if 'image_map = {img["ref"]: img["dataUrl"] for img in image_registry}' in content:
            print("✓ Template image replacement uses image registry mapping")
            return True
        else:
            print("✗ Template image replacement doesn't use image registry")
            return False
    else:
        print("✗ Template image replacement not found or incorrect")
        return False

def test_frontend_image_view():
    """Test that frontend uses /view endpoint for images"""
    with open('/app/frontend/src/components/MyFiles.js', 'r') as f:
        content = f.read()
    
    # Check that frontend uses /view for images
    if 'src="${API_URL}/api/uploads/${file.upload_id}/view"' in content:
        print("✓ Frontend uses /view endpoint for images")
        return True
    else:
        print("✗ Frontend doesn't use /view endpoint for images")
        return False

def main():
    print("Testing all fixes...")
    print("\n1. Testing table header fix for scheme PDFs:")
    test1 = test_table_header_fix()
    
    print("\n2. Testing upload download/view fix:")
    test2 = test_upload_view_endpoint()
    
    print("\n3. Testing template PDF image fix:")
    test3 = test_template_image_fix()
    
    print("\n4. Testing frontend image view fix:")
    test4 = test_frontend_image_view()
    
    print("\n" + "="*50)
    print("SUMMARY:")
    print(f"Table header fix: {'✓ PASS' if test1 else '✗ FAIL'}")
    print(f"Upload view endpoint: {'✓ PASS' if test2 else '✗ FAIL'}")
    print(f"Template image fix: {'✓ PASS' if test3 else '✗ FAIL'}")
    print(f"Frontend image view: {'✓ PASS' if test4 else '✗ FAIL'}")
    
    all_passed = test1 and test2 and test3 and test4
    print(f"\nOverall: {'✓ ALL TESTS PASSED' if all_passed else '✗ SOME TESTS FAILED'}")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)