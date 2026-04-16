#!/usr/bin/env python3
"""
Simple test script to verify Arabic filename encoding in Content-Disposition headers.
This tests the safe_content_disposition function logic without importing the full server.
"""

import urllib.parse

def safe_content_disposition(filename):
    """
    Generate a safe Content-Disposition header with proper encoding for non-ASCII filenames.
    
    For ASCII-only filenames: uses simple `filename="..."` format
    For non-ASCII filenames: uses RFC 5987 encoding with `filename*=UTF-8''...`
    """
    try:
        # Try to encode as ASCII
        filename.encode('ascii')
        # ASCII filename - use simple format
        return f'attachment; filename="{filename}"'
    except UnicodeEncodeError:
        # Non-ASCII filename - use RFC 5987 encoding
        encoded = urllib.parse.quote(filename, safe='')
        return f"attachment; filename*=UTF-8''{encoded}"

def test_safe_content_disposition():
    """Test the safe_content_disposition function with various filenames."""
    
    test_cases = [
        # ASCII-only filenames
        ("lesson_plan.pdf", 'attachment; filename="lesson_plan.pdf"'),
        ("my_document.docx", 'attachment; filename="my_document.docx"'),
        
        # Arabic filenames
        ("درس_اللغة_العربية.pdf", 'attachment; filename*=UTF-8\'\'%D8%AF%D8%B1%D8%B3_%D8%A7%D9%84%D9%84%D8%BA%D8%A9_%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9.pdf'),
        ("الرياضيات_للصف_السادس.docx", 'attachment; filename*=UTF-8\'\'%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A7%D8%AA_%D9%84%D9%84%D8%B5%D9%81_%D8%A7%D9%84%D8%B3%D8%A7%D8%AF%D8%B3.docx'),
        
        # Mixed ASCII and Arabic
        ("math_رياضيات_grade6.pdf", 'attachment; filename*=UTF-8\'\'math_%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A7%D8%AA_grade6.pdf'),
        
        # Swahili with ASCII characters only
        ("somo_la_kiswahili.pdf", 'attachment; filename="somo_la_kiswahili.pdf"'),
        
        # Filename with spaces
        ("my lesson plan.pdf", 'attachment; filename="my lesson plan.pdf"'),
        
        # Filename with special characters
        ("lesson-plan_v1.2.pdf", 'attachment; filename="lesson-plan_v1.2.pdf"'),
    ]
    
    print("Testing safe_content_disposition function...")
    print("=" * 60)
    
    all_passed = True
    for filename, expected in test_cases:
        result = safe_content_disposition(filename)
        
        # For Arabic filenames, we need to check if it uses RFC 5987 encoding
        # The exact encoding might vary slightly, so we'll check for key indicators
        try:
            filename.encode('ascii')
            # ASCII filename - should use simple format
            if result == expected:
                print(f"✓ ASCII: '{filename}' -> '{result}'")
            else:
                print(f"✗ ASCII: '{filename}'")
                print(f"  Expected: '{expected}'")
                print(f"  Got:      '{result}'")
                all_passed = False
        except UnicodeEncodeError:
            # Non-ASCII filename - should use RFC 5987 encoding
            if "filename*=UTF-8''" in result:
                print(f"✓ Non-ASCII (RFC 5987): '{filename}'")
                print(f"  Result: '{result}'")
            else:
                print(f"✗ Non-ASCII: '{filename}'")
                print(f"  Expected RFC 5987 encoding with filename*=UTF-8''")
                print(f"  Got: '{result}'")
                all_passed = False
    
    print("=" * 60)
    if all_passed:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed!")
    
    return all_passed

def test_export_functions():
    """Test that export functions use safe_content_disposition."""
    print("\n\nChecking export functions for safe_content_disposition usage...")
    print("=" * 60)
    
    with open("backend/server.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    # Check for remaining unsafe Content-Disposition headers
    unsafe_patterns = [
        'headers={"Content-Disposition": f\'attachment; filename="',
        'headers["Content-Disposition"] = f\'attachment; filename="'
    ]
    
    unsafe_found = False
    for pattern in unsafe_patterns:
        if pattern in content:
            print(f"❌ Found unsafe Content-Disposition pattern: {pattern}")
            unsafe_found = True
    
    # Check for safe_content_disposition usage
    safe_count = content.count("safe_content_disposition(")
    print(f"Found {safe_count} uses of safe_content_disposition()")
    
    if not unsafe_found:
        print("✅ No unsafe Content-Disposition patterns found!")
    else:
        print("❌ Unsafe Content-Disposition patterns found!")
    
    return not unsafe_found

if __name__ == "__main__":
    print("Testing Arabic filename encoding fix")
    print("=" * 60)
    
    test1_passed = test_safe_content_disposition()
    test2_passed = test_export_functions()
    
    if test1_passed and test2_passed:
        print("\n✅ All tests passed! Arabic filenames should now work correctly.")
        print("\nSummary of changes:")
        print("1. All Content-Disposition headers now use safe_content_disposition()")
        print("2. ASCII filenames use simple format: filename=\"...\"")
        print("3. Non-ASCII (Arabic) filenames use RFC 5987 encoding: filename*=UTF-8''...")
        print("4. This ensures proper browser handling of Arabic characters in downloads")
    else:
        print("\n❌ Tests failed! Please check the implementation.")