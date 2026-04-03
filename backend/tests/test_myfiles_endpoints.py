"""
Test My Files View/Download Endpoints
Tests for lessons, templates, uploads, dictations view and download functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session cookie for authenticated requests
TEST_SESSION_TOKEN = "test_session_tts_001"
TEST_ZANZIBAR_LESSON = "lesson_test_znz_001"
TEST_MAINLAND_LESSON = "lesson_test_mld_001"
TEST_UPLOAD = "upload_test_001"
TEST_DICTATION_EN = "dict_959c4e8e31ed"
TEST_DICTATION_SW = "dict_9ec3cbea2250"


@pytest.fixture
def auth_session():
    """Create authenticated session with test cookie"""
    session = requests.Session()
    session.cookies.set("session_token", TEST_SESSION_TOKEN)
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestLessonsEndpoints:
    """Test lesson list, view, and export endpoints"""
    
    def test_get_lessons_list(self, auth_session):
        """GET /api/lessons returns lessons without errors"""
        response = auth_session.get(f"{BASE_URL}/api/lessons")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "lessons" in data, "Response should contain 'lessons' key"
        assert isinstance(data["lessons"], list), "lessons should be a list"
        print(f"✓ GET /api/lessons returned {len(data['lessons'])} lessons")
    
    def test_zanzibar_lesson_view_html(self, auth_session):
        """GET /api/lessons/{id}/view returns HTML for Zanzibar lesson with bilingual tables"""
        response = auth_session.get(f"{BASE_URL}/api/lessons/{TEST_ZANZIBAR_LESSON}/view")
        
        if response.status_code == 404:
            pytest.skip(f"Zanzibar test lesson {TEST_ZANZIBAR_LESSON} not found - skipping")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        html = response.text
        
        # Check for bilingual table headers
        assert "LESSON PLAN" in html or "ANDALIO LA SOMO" in html, "Should have lesson plan header"
        assert "HATUA" in html or "STEPS" in html, "Should have Steps/HATUA column"
        assert "MUDA" in html or "TIME" in html, "Should have Time/MUDA column"
        assert "VITENDO VYA KUFUNDISHIA" in html or "TEACHING ACTIVITIES" in html, "Should have Teaching Activities"
        
        # Check NO print/download buttons in view
        assert "<button" not in html.lower(), "View HTML should NOT contain button elements"
        
        print("✓ Zanzibar lesson view has bilingual tables and no buttons")
    
    def test_mainland_lesson_view_html_4_stages(self, auth_session):
        """GET /api/lessons/{id}/view returns HTML for Mainland lesson with 4 stages"""
        response = auth_session.get(f"{BASE_URL}/api/lessons/{TEST_MAINLAND_LESSON}/view")
        
        if response.status_code == 404:
            pytest.skip(f"Mainland test lesson {TEST_MAINLAND_LESSON} not found - skipping")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        html = response.text
        
        # Check for 4 stages in Mainland format
        assert "INTRODUCTION" in html or "UTANGULIZI" in html, "Should have Introduction stage"
        assert "BUILDING NEW KNOWLEDGE" in html or "KUJENGA MAARIFA" in html, "Should have Competence Development stage"
        assert "DESIGN" in html or "UBUNIFU" in html, "Should have Design stage"
        assert "REALISATION" in html or "UTEKELEZAJI" in html, "Should have Realisation stage"
        
        # Check bilingual format
        assert "HATUA" in html or "STEPS" in html, "Should have Steps/HATUA column"
        
        # Check NO print/download buttons
        assert "<button" not in html.lower(), "View HTML should NOT contain button elements"
        
        print("✓ Mainland lesson view has 4 stages in bilingual format and no buttons")
    
    def test_lesson_export_doc(self, auth_session):
        """GET /api/lessons/{id}/export returns .doc file"""
        response = auth_session.get(f"{BASE_URL}/api/lessons/{TEST_ZANZIBAR_LESSON}/export")
        
        if response.status_code == 404:
            pytest.skip(f"Test lesson {TEST_ZANZIBAR_LESSON} not found - skipping")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check content type
        content_type = response.headers.get("Content-Type", "")
        assert "msword" in content_type or "application/octet-stream" in content_type, \
            f"Expected msword content type, got {content_type}"
        
        # Check content disposition for .doc extension
        content_disp = response.headers.get("Content-Disposition", "")
        assert ".doc" in content_disp, f"Expected .doc in Content-Disposition, got {content_disp}"
        
        print("✓ Lesson export returns .doc file with correct headers")


class TestTemplatesEndpoints:
    """Test template view and export endpoints"""
    
    def test_get_templates_list(self, auth_session):
        """GET /api/templates returns templates list"""
        response = auth_session.get(f"{BASE_URL}/api/templates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "templates" in data, "Response should contain 'templates' key"
        print(f"✓ GET /api/templates returned {len(data.get('templates', []))} templates")
        return data.get("templates", [])
    
    def test_template_view_html_with_images(self, auth_session):
        """GET /api/templates/{id}/view returns rendered HTML with images"""
        # First get templates list to find a valid template
        templates = self.test_get_templates_list(auth_session)
        
        if not templates:
            pytest.skip("No templates found - skipping view test")
        
        # Find a user template (not default)
        user_templates = [t for t in templates if not t.get("is_default")]
        if not user_templates:
            pytest.skip("No user templates found - skipping view test")
        
        template_id = user_templates[0].get("template_id")
        response = auth_session.get(f"{BASE_URL}/api/templates/{template_id}/view")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        html = response.text
        
        # Check it's valid HTML
        assert "<!DOCTYPE html>" in html or "<html" in html, "Should return valid HTML"
        assert "</body>" in html, "Should have closing body tag"
        
        # Check NO print/download buttons
        assert "<button" not in html.lower(), "View HTML should NOT contain button elements"
        
        print(f"✓ Template {template_id} view returns HTML without buttons")
    
    def test_template_export_doc(self, auth_session):
        """GET /api/templates/{id}/export returns .doc file"""
        # First get templates list
        templates_resp = auth_session.get(f"{BASE_URL}/api/templates")
        templates = templates_resp.json().get("templates", [])
        
        user_templates = [t for t in templates if not t.get("is_default")]
        if not user_templates:
            pytest.skip("No user templates found - skipping export test")
        
        template_id = user_templates[0].get("template_id")
        response = auth_session.get(f"{BASE_URL}/api/templates/{template_id}/export")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check content type
        content_type = response.headers.get("Content-Type", "")
        assert "msword" in content_type, f"Expected msword content type, got {content_type}"
        
        # Check content disposition for .doc extension
        content_disp = response.headers.get("Content-Disposition", "")
        assert ".doc" in content_disp, f"Expected .doc in Content-Disposition, got {content_disp}"
        
        print(f"✓ Template {template_id} export returns .doc file")


class TestUploadsEndpoints:
    """Test uploads list and download endpoints"""
    
    def test_get_uploads_excludes_file_data(self, auth_session):
        """GET /api/uploads listing does NOT include file_data field (performance fix)"""
        response = auth_session.get(f"{BASE_URL}/api/uploads")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "uploads" in data, "Response should contain 'uploads' key"
        
        # Check that file_data is NOT in any upload
        for upload in data.get("uploads", []):
            assert "file_data" not in upload, f"Upload {upload.get('upload_id')} should NOT have file_data in listing"
        
        print(f"✓ GET /api/uploads returned {len(data.get('uploads', []))} uploads without file_data")
    
    def test_upload_download_returns_file(self, auth_session):
        """GET /api/uploads/{id}/download returns the actual file with correct content-type"""
        # First get uploads list
        uploads_resp = auth_session.get(f"{BASE_URL}/api/uploads")
        uploads = uploads_resp.json().get("uploads", [])
        
        if not uploads:
            pytest.skip("No uploads found - skipping download test")
        
        upload = uploads[0]
        upload_id = upload.get("upload_id")
        expected_name = upload.get("name", "download")
        expected_type = upload.get("content_type", "application/octet-stream")
        
        response = auth_session.get(f"{BASE_URL}/api/uploads/{upload_id}/download")
        
        if response.status_code == 404:
            # File data might not be stored
            print(f"⚠ Upload {upload_id} download returned 404 - file data may not be stored")
            pytest.skip("Upload file data not available")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check content type
        content_type = response.headers.get("Content-Type", "")
        assert content_type, "Should have Content-Type header"
        
        # Check content disposition
        content_disp = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disp, f"Should have attachment disposition, got {content_disp}"
        
        # Check we got actual content
        assert len(response.content) > 0, "Should return file content"
        
        print(f"✓ Upload {upload_id} download returns file with Content-Type: {content_type}")


class TestDictationsEndpoints:
    """Test dictations list and download endpoints"""
    
    def test_get_dictations_list(self, auth_session):
        """GET /api/dictations returns dictations list"""
        response = auth_session.get(f"{BASE_URL}/api/dictations")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "dictations" in data, "Response should contain 'dictations' key"
        print(f"✓ GET /api/dictations returned {len(data.get('dictations', []))} dictations")
        return data.get("dictations", [])
    
    def test_dictation_download_returns_mp3(self, auth_session):
        """GET /api/dictations/{id}/download returns audio/mpeg MP3 file (uses TTS API)"""
        # First get dictations list
        dictations = self.test_get_dictations_list(auth_session)
        
        if not dictations:
            pytest.skip("No dictations found - skipping download test")
        
        dictation = dictations[0]
        dictation_id = dictation.get("dictation_id")
        
        # This endpoint calls TTS API so may take a few seconds
        response = auth_session.get(
            f"{BASE_URL}/api/dictations/{dictation_id}/download",
            timeout=30  # Allow time for TTS generation
        )
        
        if response.status_code == 500:
            error_detail = response.json().get("detail", "")
            if "TTS" in error_detail or "not configured" in error_detail:
                pytest.skip("TTS service not configured - skipping")
            print(f"⚠ Dictation download failed: {error_detail}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check content type is audio/mpeg
        content_type = response.headers.get("Content-Type", "")
        assert "audio/mpeg" in content_type, f"Expected audio/mpeg, got {content_type}"
        
        # Check content disposition for .mp3
        content_disp = response.headers.get("Content-Disposition", "")
        assert ".mp3" in content_disp, f"Expected .mp3 in Content-Disposition, got {content_disp}"
        
        # Check we got actual audio content
        assert len(response.content) > 1000, "Should return substantial audio content"
        
        print(f"✓ Dictation {dictation_id} download returns MP3 audio file")


class TestSchemesEndpoints:
    """Test schemes view and export endpoints"""
    
    def test_get_schemes_list(self, auth_session):
        """GET /api/schemes returns schemes list"""
        response = auth_session.get(f"{BASE_URL}/api/schemes")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "schemes" in data, "Response should contain 'schemes' key"
        print(f"✓ GET /api/schemes returned {len(data.get('schemes', []))} schemes")
        return data.get("schemes", [])
    
    def test_scheme_view_no_buttons(self, auth_session):
        """GET /api/schemes/{id}/view returns HTML without print/download buttons"""
        schemes = self.test_get_schemes_list(auth_session)
        
        if not schemes:
            pytest.skip("No schemes found - skipping view test")
        
        scheme_id = schemes[0].get("scheme_id")
        response = auth_session.get(f"{BASE_URL}/api/schemes/{scheme_id}/view")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        html = response.text
        
        # Check NO print/download buttons
        assert "<button" not in html.lower(), "View HTML should NOT contain button elements"
        
        print(f"✓ Scheme {scheme_id} view returns HTML without buttons")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
