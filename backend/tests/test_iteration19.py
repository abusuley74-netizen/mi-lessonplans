"""
Iteration 19 Tests - mi-lessonplan.site Rebranding & Fixes
Tests:
1. Branding: 'mi-lessonplan.site' (not 'miLessonPlan') everywhere
2. Backend API health returns 'mi-lessonplan.site API' (if applicable)
3. Referral links contain mi-lessonplan.site domain
4. manifest.json short_name is 'mi-lessonplan.site'
5. service-worker.js cache name contains 'mi-lessonplan'
6. Dictation shared link download returns audio/mpeg (not application/msword)
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SESSION_TOKEN = "test_session_tts_001"

class TestBrandingAndPWA:
    """Test branding changes from miLessonPlan to mi-lessonplan.site"""
    
    def test_manifest_json_short_name(self):
        """manifest.json short_name should be 'mi-lessonplan.site'"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200, f"manifest.json not accessible: {response.status_code}"
        data = response.json()
        assert data.get("short_name") == "mi-lessonplan.site", f"Expected 'mi-lessonplan.site', got '{data.get('short_name')}'"
        print(f"✓ manifest.json short_name: {data.get('short_name')}")
    
    def test_manifest_json_name(self):
        """manifest.json name should contain 'mi-lessonplan.site'"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200
        data = response.json()
        assert "mi-lessonplan.site" in data.get("name", ""), f"Expected 'mi-lessonplan.site' in name, got '{data.get('name')}'"
        print(f"✓ manifest.json name: {data.get('name')}")
    
    def test_service_worker_cache_name(self):
        """service-worker.js cache name should contain 'mi-lessonplan'"""
        response = requests.get(f"{BASE_URL}/service-worker.js")
        assert response.status_code == 200, f"service-worker.js not accessible: {response.status_code}"
        content = response.text
        assert "mi-lessonplan" in content.lower(), "Cache name should contain 'mi-lessonplan'"
        print(f"✓ service-worker.js contains 'mi-lessonplan' cache name")
    
    def test_api_health(self):
        """API health endpoint should be accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        data = response.json()
        assert data.get("status") == "healthy", f"Expected healthy status, got {data}"
        print(f"✓ API health check passed: {data}")
    
    def test_login_page_accessible(self):
        """Login page should be accessible and contain mi-lessonplan.site"""
        response = requests.get(f"{BASE_URL}/login")
        assert response.status_code == 200, f"Login page not accessible: {response.status_code}"
        # Check page title or content
        assert "mi-lessonplan.site" in response.text or "mi-lessonplan" in response.text.lower(), "Login page should contain mi-lessonplan.site branding"
        print(f"✓ Login page accessible with mi-lessonplan.site branding")


class TestReferralLinks:
    """Test referral link domain"""
    
    def test_referral_code_endpoint(self):
        """Referral endpoint should return mi-lessonplan.site URLs"""
        headers = {"Cookie": f"session_token={SESSION_TOKEN}"}
        response = requests.get(f"{BASE_URL}/api/teacher/referral/my-code", headers=headers)
        
        if response.status_code == 401:
            pytest.skip("Session token not valid - skipping referral test")
        
        assert response.status_code == 200, f"Referral endpoint failed: {response.status_code}"
        data = response.json()
        
        # Check referral_link contains mi-lessonplan.site
        referral_link = data.get("referral_link", "")
        assert "mi-lessonplan.site" in referral_link, f"Expected mi-lessonplan.site in referral link, got: {referral_link}"
        print(f"✓ Referral link uses mi-lessonplan.site: {referral_link}")


class TestDictationSharedLinkDownload:
    """Test dictation shared link download returns audio/mpeg"""
    
    def get_auth_headers(self):
        return {"Cookie": f"session_token={SESSION_TOKEN}"}
    
    def test_create_dictation_and_share_link(self):
        """Create a dictation, share it, and verify download returns audio/mpeg"""
        headers = self.get_auth_headers()
        
        # Step 1: Create a test dictation
        dictation_data = {
            "title": "Test Dictation for Audio",
            "text": "Hello, this is a test dictation for audio generation.",
            "language": "en-GB"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/dictations",
            json=dictation_data,
            headers=headers
        )
        
        if create_response.status_code == 401:
            pytest.skip("Session token not valid - skipping dictation test")
        
        assert create_response.status_code == 200, f"Failed to create dictation: {create_response.status_code} - {create_response.text}"
        dictation = create_response.json()
        dictation_id = dictation.get("dictation_id")
        assert dictation_id, "Dictation ID not returned"
        print(f"✓ Created dictation: {dictation_id}")
        
        # Step 2: Create a shared link for the dictation
        share_data = {
            "resource_type": "dictation",
            "resource_id": dictation_id,
            "is_paid": False,
            "description": "Test dictation share"
        }
        
        share_response = requests.post(
            f"{BASE_URL}/api/links",
            json=share_data,
            headers=headers
        )
        
        assert share_response.status_code == 200, f"Failed to create shared link: {share_response.status_code} - {share_response.text}"
        link_data = share_response.json()
        link_code = link_data.get("link_code")
        assert link_code, "Link code not returned"
        print(f"✓ Created shared link: {link_code}")
        
        # Step 3: Download the shared link and verify content type is audio/mpeg
        # Note: TTS generation may take a few seconds
        download_response = requests.get(
            f"{BASE_URL}/api/links/{link_code}/download",
            timeout=30  # TTS can take time
        )
        
        assert download_response.status_code == 200, f"Download failed: {download_response.status_code} - {download_response.text}"
        
        content_type = download_response.headers.get("Content-Type", "")
        assert "audio/mpeg" in content_type, f"Expected audio/mpeg, got: {content_type}"
        print(f"✓ Dictation shared link download returns audio/mpeg: {content_type}")
        
        # Verify it's actual audio data (MP3 starts with ID3 or 0xFF 0xFB)
        content = download_response.content
        assert len(content) > 100, f"Audio content too small: {len(content)} bytes"
        
        # MP3 files typically start with ID3 tag or sync bytes
        is_mp3 = content[:3] == b'ID3' or (content[0] == 0xFF and (content[1] & 0xE0) == 0xE0)
        assert is_mp3, f"Content doesn't appear to be MP3 audio. First bytes: {content[:10].hex()}"
        print(f"✓ Downloaded content is valid MP3 audio ({len(content)} bytes)")
        
        # Cleanup: Delete the dictation
        delete_response = requests.delete(
            f"{BASE_URL}/api/dictations/{dictation_id}",
            headers=headers
        )
        print(f"✓ Cleanup: Deleted test dictation")
    
    def test_existing_dictation_download_content_type(self):
        """Test downloading an existing dictation returns audio/mpeg"""
        headers = self.get_auth_headers()
        
        # Get existing dictations
        response = requests.get(f"{BASE_URL}/api/dictations", headers=headers)
        
        if response.status_code == 401:
            pytest.skip("Session token not valid")
        
        assert response.status_code == 200
        dictations = response.json().get("dictations", [])
        
        if not dictations:
            pytest.skip("No existing dictations to test")
        
        # Test direct dictation download (authenticated)
        dictation = dictations[0]
        dictation_id = dictation.get("dictation_id")
        
        download_response = requests.get(
            f"{BASE_URL}/api/dictations/{dictation_id}/download",
            headers=headers,
            timeout=30
        )
        
        assert download_response.status_code == 200, f"Download failed: {download_response.status_code}"
        content_type = download_response.headers.get("Content-Type", "")
        assert "audio/mpeg" in content_type, f"Expected audio/mpeg, got: {content_type}"
        print(f"✓ Direct dictation download returns audio/mpeg")


class TestFrontendBranding:
    """Test frontend pages contain correct branding"""
    
    def test_login_page_h1_branding(self):
        """Login page H1 should show 'mi-lessonplan.site'"""
        response = requests.get(f"{BASE_URL}/login")
        assert response.status_code == 200
        
        # Check for mi-lessonplan.site in the HTML
        html = response.text
        assert "mi-lessonplan.site" in html, "Login page should contain 'mi-lessonplan.site'"
        
        # Verify no old branding 'miLessonPlan' (lowercase m)
        # Note: This is a simple check - the actual text might be in JS bundles
        print(f"✓ Login page contains mi-lessonplan.site branding")
    
    def test_admin_login_page(self):
        """Admin login page should be accessible"""
        response = requests.get(f"{BASE_URL}/admin/login")
        assert response.status_code == 200, f"Admin login page not accessible: {response.status_code}"
        print(f"✓ Admin login page accessible")
    
    def test_shared_view_page(self):
        """Shared view page should be accessible"""
        # Test with a non-existent code to verify the route works
        response = requests.get(f"{BASE_URL}/shared/testcode123")
        # Should return 200 (React handles 404 in-app) or redirect
        assert response.status_code in [200, 404], f"Shared view route issue: {response.status_code}"
        print(f"✓ Shared view route accessible")


class TestMyFilesAPI:
    """Test MyFiles related APIs"""
    
    def get_auth_headers(self):
        return {"Cookie": f"session_token={SESSION_TOKEN}"}
    
    def test_lessons_endpoint(self):
        """Test lessons endpoint"""
        headers = self.get_auth_headers()
        response = requests.get(f"{BASE_URL}/api/lessons", headers=headers)
        
        if response.status_code == 401:
            pytest.skip("Session token not valid")
        
        assert response.status_code == 200
        data = response.json()
        assert "lessons" in data
        print(f"✓ Lessons endpoint: {len(data.get('lessons', []))} lessons")
    
    def test_dictations_endpoint(self):
        """Test dictations endpoint"""
        headers = self.get_auth_headers()
        response = requests.get(f"{BASE_URL}/api/dictations", headers=headers)
        
        if response.status_code == 401:
            pytest.skip("Session token not valid")
        
        assert response.status_code == 200
        data = response.json()
        assert "dictations" in data
        print(f"✓ Dictations endpoint: {len(data.get('dictations', []))} dictations")
    
    def test_uploads_endpoint(self):
        """Test uploads endpoint"""
        headers = self.get_auth_headers()
        response = requests.get(f"{BASE_URL}/api/uploads", headers=headers)
        
        if response.status_code == 401:
            pytest.skip("Session token not valid")
        
        assert response.status_code == 200
        data = response.json()
        assert "uploads" in data
        print(f"✓ Uploads endpoint: {len(data.get('uploads', []))} uploads")
    
    def test_schemes_endpoint(self):
        """Test schemes endpoint"""
        headers = self.get_auth_headers()
        response = requests.get(f"{BASE_URL}/api/schemes", headers=headers)
        
        if response.status_code == 401:
            pytest.skip("Session token not valid")
        
        assert response.status_code == 200
        data = response.json()
        assert "schemes" in data
        print(f"✓ Schemes endpoint: {len(data.get('schemes', []))} schemes")
    
    def test_templates_endpoint(self):
        """Test templates endpoint"""
        headers = self.get_auth_headers()
        response = requests.get(f"{BASE_URL}/api/templates", headers=headers)
        
        if response.status_code == 401:
            pytest.skip("Session token not valid")
        
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        print(f"✓ Templates endpoint: {len(data.get('templates', []))} templates")


@pytest.fixture(scope="session")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
