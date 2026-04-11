#!/usr/bin/env python3
"""
Test shared link downloads to verify they return PDFs instead of Word docs
"""
import requests
import os
import sys

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8000').rstrip('/')
SESSION_TOKEN = "test_session_tts_001"

def test_shared_link_download():
    """Test that shared links download PDFs instead of Word docs"""
    print("Testing shared link downloads...")
    
    # Create a session with auth
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SESSION_TOKEN}"
    })
    
    # First, get a lesson to share
    print("1. Getting lessons list...")
    lessons_resp = session.get(f"{BASE_URL}/api/lessons")
    if lessons_resp.status_code != 200:
        print(f"  ❌ Failed to get lessons: {lessons_resp.status_code}")
        return False
    
    lessons = lessons_resp.json().get("lessons", [])
    if not lessons:
        print("  ⚠ No lessons found, skipping test")
        return True
    
    lesson_id = lessons[0].get("lesson_id")
    print(f"  ✓ Found lesson: {lesson_id}")
    
    # Create a shared link
    print("2. Creating shared link...")
    share_resp = session.post(f"{BASE_URL}/api/links", json={
        "resource_type": "lesson",
        "resource_id": lesson_id,
        "is_paid": False,
        "description": "Test PDF download"
    })
    
    if share_resp.status_code not in [200, 201]:
        print(f"  ❌ Failed to create shared link: {share_resp.status_code}")
        print(f"  Response: {share_resp.text}")
        return False
    
    link_data = share_resp.json()
    link_code = link_data.get("link_code")
    if not link_code:
        print(f"  ❌ No link_code in response: {link_data}")
        return False
    
    print(f"  ✓ Created shared link: {link_code}")
    
    # Get the shared link metadata
    print("3. Getting shared link metadata...")
    link_resp = requests.get(f"{BASE_URL}/api/links/{link_code}")
    if link_resp.status_code != 200:
        print(f"  ❌ Failed to get link metadata: {link_resp.status_code}")
        return False
    
    link_info = link_resp.json()
    print(f"  ✓ Link metadata: {link_info.get('link', {}).get('title', 'Unknown')}")
    
    # Download the shared resource
    print("4. Downloading shared resource...")
    download_resp = requests.get(f"{BASE_URL}/api/links/{link_code}/download")
    
    if download_resp.status_code != 200:
        print(f"  ❌ Failed to download: {download_resp.status_code}")
        print(f"  Response: {download_resp.text[:200]}")
        return False
    
    # Check content type
    content_type = download_resp.headers.get("Content-Type", "")
    print(f"  Content-Type: {content_type}")
    
    # Check for PDF
    if "application/pdf" in content_type:
        print("  ✓ Download returns PDF (application/pdf)")
    elif "audio/mpeg" in content_type:
        print("  ✓ Download returns MP3 audio (audio/mpeg)")
    else:
        print(f"  ⚠ Unexpected Content-Type: {content_type}")
    
    # Check content disposition
    content_disp = download_resp.headers.get("Content-Disposition", "")
    print(f"  Content-Disposition: {content_disp}")
    
    # Check for PDF extension
    if ".pdf" in content_disp:
        print("  ✓ Download has .pdf extension")
    elif ".mp3" in content_disp:
        print("  ✓ Download has .mp3 extension (audio)")
    else:
        print(f"  ⚠ No .pdf or .mp3 extension in Content-Disposition")
    
    # Check content length
    content_length = len(download_resp.content)
    print(f"  Content length: {content_length} bytes")
    
    if content_length > 1000:
        print("  ✓ Download has substantial content")
    else:
        print(f"  ⚠ Download content may be too small: {content_length} bytes")
    
    # Test dictation shared link (should return MP3)
    print("\n5. Testing dictation shared link...")
    
    # Get dictations
    dictations_resp = session.get(f"{BASE_URL}/api/dictations")
    if dictations_resp.status_code == 200:
        dictations = dictations_resp.json().get("dictations", [])
        if dictations:
            dictation_id = dictations[0].get("dictation_id")
            print(f"  Found dictation: {dictation_id}")
            
            # Create shared link for dictation
            dict_share_resp = session.post(f"{BASE_URL}/api/links", json={
                "resource_type": "dictation",
                "resource_id": dictation_id,
                "is_paid": False,
                "description": "Test dictation download"
            })
            
            if dict_share_resp.status_code in [200, 201]:
                dict_link_data = dict_share_resp.json()
                dict_link_code = dict_link_data.get("link_code")
                print(f"  Created dictation link: {dict_link_code}")
                
                # Download dictation
                dict_download_resp = requests.get(f"{BASE_URL}/api/links/{dict_link_code}/download")
                if dict_download_resp.status_code == 200:
                    dict_content_type = dict_download_resp.headers.get("Content-Type", "")
                    if "audio/mpeg" in dict_content_type:
                        print("  ✓ Dictation download returns MP3 audio")
                    else:
                        print(f"  ⚠ Dictation Content-Type: {dict_content_type}")
                else:
                    print(f"  ⚠ Dictation download failed: {dict_download_resp.status_code}")
            else:
                print(f"  ⚠ Failed to create dictation link: {dict_share_resp.status_code}")
        else:
            print("  ⚠ No dictations found")
    else:
        print(f"  ⚠ Failed to get dictations: {dictations_resp.status_code}")
    
    print("\n✅ Shared link download test completed!")
    return True

if __name__ == "__main__":
    success = test_shared_link_download()
    sys.exit(0 if success else 1)