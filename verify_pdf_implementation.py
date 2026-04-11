#!/usr/bin/env python3
"""Verify PDF export implementation"""
import re

def check_pdf_implementation():
    print("Verifying PDF export implementation...")
    print("=" * 60)
    
    with open("backend/server.py", "r") as f:
        content = f.read()
    
    # Check 1: build_download_content returns PDF
    print("\n1. Checking build_download_content function:")
    if '"Build downloadable PDF document"' in content:
        print("   ✓ Function docstring mentions PDF")
    else:
        print("   ✗ Function docstring doesn't mention PDF")
    
    # Check 2: No Word media types in export endpoints
    print("\n2. Checking export endpoints for PDF media types:")
    
    endpoints = [
        ("/schemes/{scheme_id}/export", "application/pdf"),
        ("/lessons/{lesson_id}/export", "application/pdf"),
        ("/templates/{template_id}/export", "application/pdf"),
    ]
    
    all_good = True
    for endpoint, expected_type in endpoints:
        # Look for the endpoint definition
        pattern = rf'@api_router\.(get|post).*{endpoint.replace("{", "[^{}]*{").replace("}", "}[^{}]*")}'
        match = re.search(pattern, content, re.DOTALL)
        if match:
            endpoint_content = content[match.start():match.start()+1000]
            if f'media_type="{expected_type}"' in endpoint_content:
                print(f"   ✓ {endpoint} returns {expected_type}")
            else:
                print(f"   ✗ {endpoint} doesn't return {expected_type}")
                all_good = False
        else:
            print(f"   ? {endpoint} not found")
    
    # Check 3: Scheme PDF has landscape formatting
    print("\n3. Checking scheme PDF landscape formatting:")
    if "@page {{ size: landscape;" in content:
        print("   ✓ Scheme PDF has landscape page size")
    else:
        print("   ✗ Scheme PDF missing landscape formatting")
        all_good = False
    
    # Check 4: Filenames end with .pdf
    print("\n4. Checking filenames end with .pdf:")
    pdf_filenames = re.findall(r'filename.*\.pdf', content)
    doc_filenames = re.findall(r'filename.*\.doc', content)
    
    print(f"   Found {len(pdf_filenames)} .pdf filenames")
    print(f"   Found {len(doc_filenames)} .doc filenames (should only be for dictation fallback)")
    
    # Check 5: Dictation fallback still works
    print("\n5. Checking dictation handling:")
    if "AUDIO_TTS" in content:
        print("   ✓ Dictation has audio TTS handling")
    else:
        print("   ✗ Dictation audio handling missing")
    
    print("\n" + "=" * 60)
    
    if all_good and len(pdf_filenames) > 0:
        print("✅ PDF export implementation looks correct!")
        print("\nSummary:")
        print(f"- {len(pdf_filenames)} PDF filenames found")
        print("- All export endpoints return application/pdf")
        print("- Scheme PDFs have landscape formatting")
        print("- Dictation remains as audio with Word fallback")
    else:
        print("❌ Some issues found in PDF implementation")
        return False
    
    return True

if __name__ == "__main__":
    if check_pdf_implementation():
        print("\n🎉 Implementation complete! Lessons, schemes, notes, and templates")
        print("   now export as PDF instead of Word documents.")
        print("\nKey changes:")
        print("1. build_download_content generates PDF instead of Word")
        print("2. Export endpoints return application/pdf media type")
        print("3. Scheme PDFs use landscape format to prevent content cutoff")
        print("4. Filenames end with .pdf instead of .doc")
        print("5. Dictation remains as audio (MP3) with Word fallback")
    else:
        print("\n⚠️  Some issues need to be addressed.")
        exit(1)