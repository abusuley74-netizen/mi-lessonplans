#!/usr/bin/env python3
"""
Test to diagnose the download 500 error
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_html_to_pdf():
    """Test the _html_to_pdf function"""
    print("Testing _html_to_pdf function...")
    
    try:
        from server import _html_to_pdf
        print("✓ Imported _html_to_pdf")
    except ImportError as e:
        print(f"❌ Failed to import: {e}")
        return False
    
    # Test HTML
    test_html = """
    <!DOCTYPE html>
    <html>
    <head><title>Test PDF</title></head>
    <body>
        <h1>Test Document</h1>
        <p>This is a test document for PDF conversion.</p>
    </body>
    </html>
    """
    
    try:
        pdf_bytes = _html_to_pdf(test_html)
        print(f"✓ _html_to_pdf returned {len(pdf_bytes)} bytes")
        
        # Check if it looks like a PDF
        if pdf_bytes.startswith(b'%PDF'):
            print("✓ Result is a valid PDF file")
        elif b'PDF generation service' in pdf_bytes:
            print("⚠ Result is fallback content (WeasyPrint may not be working)")
        else:
            print(f"⚠ Result is not a PDF: {pdf_bytes[:50]}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in _html_to_pdf: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_build_download_content():
    """Test the build_download_content function"""
    print("\nTesting build_download_content function...")
    
    try:
        from server import build_download_content
        print("✓ Imported build_download_content")
    except ImportError as e:
        print(f"❌ Failed to import: {e}")
        return False
    
    # Test with a simple lesson resource
    test_resource = {
        "content": {
            "introduction": "Test introduction",
            "development": "Test development",
            "conclusion": "Test conclusion"
        },
        "syllabus": "Zanzibar",
        "subject": "Mathematics",
        "grade": "Grade 5",
        "topic": "Fractions",
        "created_at": "2024-01-01"
    }
    
    try:
        result = build_download_content("lesson", test_resource)
        
        if isinstance(result, tuple) and len(result) == 3:
            pdf_bytes, media_type, filename = result
            print(f"✓ build_download_content returned tuple")
            print(f"  Media type: {media_type}")
            print(f"  Filename: {filename}")
            print(f"  PDF bytes: {len(pdf_bytes)} bytes")
            
            if media_type == "application/pdf":
                print("✓ Media type is correct (application/pdf)")
            else:
                print(f"⚠ Unexpected media type: {media_type}")
            
            if filename.endswith('.pdf'):
                print("✓ Filename has .pdf extension")
            else:
                print(f"⚠ Filename doesn't have .pdf extension: {filename}")
            
            return True
        else:
            print(f"❌ Unexpected result format: {type(result)}")
            return False
            
    except Exception as e:
        print(f"❌ Error in build_download_content: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("Diagnosing Download 500 Error")
    print("=" * 60)
    
    results = []
    
    results.append(("_html_to_pdf", test_html_to_pdf()))
    results.append(("build_download_content", test_build_download_content()))
    
    print("\n" + "=" * 60)
    print("TEST RESULTS")
    print("=" * 60)
    
    all_passed = True
    for test_name, passed in results:
        status = "✓ PASS" if passed else "❌ FAIL"
        print(f"{test_name:25} {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ All tests passed!")
        print("The PDF generation functions appear to be working.")
    else:
        print("⚠ Some tests failed")
        print("Check WeasyPrint installation and dependencies.")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)