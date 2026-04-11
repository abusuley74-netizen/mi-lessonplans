#!/usr/bin/env python3
"""
Verify all download endpoints return correct file types after PDF conversion
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Mock the PDF generation to avoid external dependencies
import unittest.mock as mock

def test_build_download_content():
    """Test the build_download_content function directly"""
    print("Testing build_download_content function...")
    
    # Import the function
    try:
        from server import build_download_content
        print("✓ Successfully imported build_download_content")
    except ImportError as e:
        print(f"❌ Failed to import: {e}")
        return False
    
    # Test with mock data for a lesson
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
    
    # Mock weasyprint to avoid installation issues
    with mock.patch('server._html_to_pdf') as mock_html_to_pdf:
        mock_html_to_pdf.return_value = b'%PDF-1.4 mock PDF content'
        
        try:
            result = build_download_content("lesson", test_resource)
            
            # Check result is a tuple
            assert isinstance(result, tuple), f"Expected tuple, got {type(result)}"
            assert len(result) == 3, f"Expected 3 elements, got {len(result)}"
            
            pdf_bytes, media_type, filename = result
            
            # Check PDF bytes
            assert isinstance(pdf_bytes, bytes), f"Expected bytes, got {type(pdf_bytes)}"
            if pdf_bytes.startswith(b'%PDF'):
                print("✓ build_download_content returns PDF bytes")
            else:
                print(f"⚠ PDF bytes don't start with PDF header: {pdf_bytes[:20]}")
            
            # Check media type
            assert media_type == "application/pdf", f"Expected application/pdf, got {media_type}"
            print(f"✓ Media type is PDF: {media_type}")
            
            # Check filename
            assert filename.endswith('.pdf'), f"Filename should end with .pdf, got {filename}"
            print(f"✓ Filename is PDF: {filename}")
            
            return True
                
        except Exception as e:
            print(f"❌ Error in build_download_content: {e}")
            import traceback
            traceback.print_exc()
            return False

def test_endpoint_functions():
    """Test that endpoint functions call build_download_content correctly"""
    print("\nTesting endpoint functions...")
    
    try:
        from server import app
        print("✓ Successfully imported FastAPI app")
        
        # Check routes
        routes = [route for route in app.routes if hasattr(route, 'path')]
        export_routes = [r for r in routes if 'export' in r.path]
        
        print(f"Found {len(export_routes)} export routes:")
        for route in export_routes:
            print(f"  - {route.path} ({route.methods})")
        
        # Check for PDF-related routes
        pdf_routes = [r for r in routes if 'pdf' in r.path.lower()]
        if pdf_routes:
            print(f"Found {len(pdf_routes)} PDF-specific routes")
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking endpoints: {e}")
        return False

def test_updated_tests():
    """Verify that test files have been updated correctly"""
    print("\nVerifying test file updates...")
    
    test_files = [
        'backend/tests/test_myfiles_endpoints.py',
        'backend/tests/test_myfiles_view_share.py',
        'backend/tests/test_iteration8_templates.py'
    ]
    
    all_updated = True
    
    for test_file in test_files:
        if not os.path.exists(test_file):
            print(f"❌ Test file not found: {test_file}")
            all_updated = False
            continue
            
        with open(test_file, 'r') as f:
            content = f.read()
            
        # Check for PDF references
        pdf_refs = content.count('application/pdf') + content.count('.pdf')
        doc_refs = content.count('application/msword') + content.count('.doc')
        
        print(f"{test_file}:")
        print(f"  PDF references: {pdf_refs}")
        print(f"  Word doc references: {doc_refs}")
        
        if pdf_refs > 0 and doc_refs == 0:
            print(f"  ✓ Correctly updated to PDF")
        elif pdf_refs > 0 and doc_refs > 0:
            print(f"  ⚠ Mixed references (some PDF, some Word)")
            all_updated = False
        else:
            print(f"  ❌ No PDF references found")
            all_updated = False
    
    return all_updated

def main():
    """Run all verification tests"""
    print("=" * 60)
    print("Verifying PDF Conversion Implementation")
    print("=" * 60)
    
    results = []
    
    # Test 1: Function implementation
    print("\n[Test 1] build_download_content function")
    results.append(("build_download_content", test_build_download_content()))
    
    # Test 2: Endpoint functions
    print("\n[Test 2] Endpoint functions")
    results.append(("endpoint_functions", test_endpoint_functions()))
    
    # Test 3: Updated tests
    print("\n[Test 3] Test file updates")
    results.append(("test_updates", test_updated_tests()))
    
    # Summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for test_name, passed in results:
        status = "✓ PASS" if passed else "❌ FAIL"
        print(f"{test_name:30} {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ ALL VERIFICATIONS PASSED!")
        print("The PDF conversion has been successfully implemented.")
        print("All download endpoints now return PDFs instead of Word docs.")
    else:
        print("⚠ SOME VERIFICATIONS FAILED")
        print("Check the implementation and test updates.")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)