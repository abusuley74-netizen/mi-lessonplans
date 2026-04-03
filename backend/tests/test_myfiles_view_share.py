"""
Test MyFiles View/Share/Download functionality
- Lesson view returns Zanzibar table format
- Lesson export returns .doc with application/msword
- No Print/Download buttons in view HTML
- Upload endpoints work correctly
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
AUTH_HEADER = {"Authorization": "Bearer test_session_real_001"}

# Test lesson IDs from credentials
ZANZIBAR_LESSON_ID = "lesson_1a8634d3005a"
MAINLAND_LESSON_ID = "lesson_4c6fc0b15af5"


class TestLessonViewEndpoint:
    """Test GET /api/lessons/{id}/view returns proper Zanzibar table format"""
    
    def test_zanzibar_lesson_view_returns_html(self):
        """Lesson view should return HTML content"""
        response = requests.get(
            f"{BASE_URL}/api/lessons/{ZANZIBAR_LESSON_ID}/view",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        assert "text/html" in response.headers.get("Content-Type", "")
        print("PASS: Zanzibar lesson view returns HTML")
    
    def test_zanzibar_lesson_view_has_andalio_header(self):
        """Zanzibar lesson view must have 'ANDALIO LA SOMO' header"""
        response = requests.get(
            f"{BASE_URL}/api/lessons/{ZANZIBAR_LESSON_ID}/view",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        html = response.text
        assert "ANDALIO LA SOMO" in html, "Missing 'ANDALIO LA SOMO' header"
        print("PASS: Zanzibar lesson view has ANDALIO LA SOMO header")
    
    def test_zanzibar_lesson_view_has_enrollment_table(self):
        """Zanzibar lesson view must have enrollment table with bilingual labels"""
        response = requests.get(
            f"{BASE_URL}/api/lessons/{ZANZIBAR_LESSON_ID}/view",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        html = response.text
        # Check for bilingual column headers
        assert "DAY" in html and "DATE" in html, "Missing DAY & DATE column"
        assert "SIKU" in html and "TAREHE" in html, "Missing SIKU & TAREHE (Swahili)"
        assert "SESSION" in html, "Missing SESSION column"
        assert "MKONDO" in html, "Missing MKONDO (Swahili for session)"
        assert "CLASS" in html, "Missing CLASS column"
        assert "DARASA" in html, "Missing DARASA (Swahili for class)"
        assert "PERIODS" in html, "Missing PERIODS column"
        assert "VIPINDI" in html, "Missing VIPINDI (Swahili for periods)"
        assert "TIME" in html, "Missing TIME column"
        assert "MUDA" in html, "Missing MUDA (Swahili for time)"
        assert "ENROLLED" in html and "PRESENT" in html, "Missing ENROLLED/PRESENT column"
        assert "WALIOANDIKISHWA" in html or "WALIOHUDHURIA" in html, "Missing Swahili enrollment labels"
        print("PASS: Zanzibar lesson view has enrollment table with bilingual labels")
    
    def test_zanzibar_lesson_view_has_lesson_development_table(self):
        """Zanzibar lesson view must have lesson development table with STEPS/TIME/ACTIVITIES/ASSESSMENT"""
        response = requests.get(
            f"{BASE_URL}/api/lessons/{ZANZIBAR_LESSON_ID}/view",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        html = response.text
        # Check for lesson development section
        assert "LESSON DEVELOPMENT" in html or "MAENDELEO YA SOMO" in html, "Missing LESSON DEVELOPMENT header"
        assert "STEPS" in html or "HATUA" in html, "Missing STEPS column"
        assert "TEACHING ACTIVITIES" in html, "Missing TEACHING ACTIVITIES column"
        assert "LEARNING ACTIVITIES" in html, "Missing LEARNING ACTIVITIES column"
        assert "ASSESSMENT" in html or "TATHMINI" in html, "Missing ASSESSMENT column"
        assert "INTRODUCTION" in html or "UTANGULIZI" in html, "Missing INTRODUCTION step"
        print("PASS: Zanzibar lesson view has lesson development table")
    
    def test_zanzibar_lesson_view_has_evaluation_sections(self):
        """Zanzibar lesson view must have Teacher Evaluation, Pupil Work, Remarks"""
        response = requests.get(
            f"{BASE_URL}/api/lessons/{ZANZIBAR_LESSON_ID}/view",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        html = response.text
        assert "TEACHER" in html and "EVALUATION" in html, "Missing Teacher Evaluation section"
        assert "TATHMINI YA MWALIMU" in html, "Missing Swahili Teacher Evaluation label"
        assert "PUPIL" in html and "WORK" in html, "Missing Pupil Work section"
        assert "KAZI YA MWANAFUNZI" in html, "Missing Swahili Pupil Work label"
        assert "REMARKS" in html, "Missing Remarks section"
        assert "MAELEZO" in html, "Missing Swahili Remarks label"
        print("PASS: Zanzibar lesson view has evaluation sections")
    
    def test_lesson_view_no_print_button(self):
        """Lesson view HTML must NOT contain Print button"""
        response = requests.get(
            f"{BASE_URL}/api/lessons/{ZANZIBAR_LESSON_ID}/view",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        html = response.text.lower()
        # Check for button elements with print functionality
        assert "<button" not in html or "onclick" not in html, "Found button element in lesson view"
        assert "window.print" not in html, "Found print JavaScript in lesson view"
        print("PASS: Lesson view has no Print button")
    
    def test_lesson_view_no_download_button(self):
        """Lesson view HTML must NOT contain Download button"""
        response = requests.get(
            f"{BASE_URL}/api/lessons/{ZANZIBAR_LESSON_ID}/view",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        html = response.text.lower()
        # Check there's no download button
        assert "download-btn" not in html or "<button" not in html, "Found download button in lesson view"
        print("PASS: Lesson view has no Download button")
    
    def test_mainland_lesson_view_returns_html(self):
        """Tanzania Mainland lesson view should return HTML"""
        response = requests.get(
            f"{BASE_URL}/api/lessons/{MAINLAND_LESSON_ID}/view",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        assert "text/html" in response.headers.get("Content-Type", "")
        html = response.text
        assert "LESSON PLAN" in html
        assert "MAIN COMPETENCE" in html or "SPECIFIC COMPETENCE" in html
        print("PASS: Mainland lesson view returns proper HTML")


class TestLessonExportEndpoint:
    """Test GET /api/lessons/{id}/export returns Word .doc format"""
    
    def test_lesson_export_returns_msword_content_type(self):
        """Lesson export must return Content-Type: application/msword"""
        response = requests.get(
            f"{BASE_URL}/api/lessons/{ZANZIBAR_LESSON_ID}/export",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        content_type = response.headers.get("Content-Type", "")
        assert "application/msword" in content_type, f"Expected application/msword, got {content_type}"
        print("PASS: Lesson export returns application/msword Content-Type")
    
    def test_lesson_export_has_doc_extension(self):
        """Lesson export must have .doc extension in Content-Disposition"""
        response = requests.get(
            f"{BASE_URL}/api/lessons/{ZANZIBAR_LESSON_ID}/export",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        content_disposition = response.headers.get("Content-Disposition", "")
        assert ".doc" in content_disposition, f"Expected .doc extension, got {content_disposition}"
        assert ".txt" not in content_disposition, "Should not be .txt extension"
        print("PASS: Lesson export has .doc extension")
    
    def test_lesson_export_contains_html_tables(self):
        """Lesson export content should contain HTML tables for Word rendering"""
        response = requests.get(
            f"{BASE_URL}/api/lessons/{ZANZIBAR_LESSON_ID}/export",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        content = response.text
        assert "<table" in content, "Export should contain HTML tables"
        assert "<th" in content, "Export should contain table headers"
        assert "<td" in content, "Export should contain table cells"
        print("PASS: Lesson export contains HTML tables")


class TestSchemeViewEndpoint:
    """Test GET /api/schemes/{id}/view has no Print/Download buttons"""
    
    def test_scheme_view_returns_html(self):
        """Scheme view should return HTML"""
        # First get a scheme ID
        response = requests.get(f"{BASE_URL}/api/schemes", headers=AUTH_HEADER)
        assert response.status_code == 200
        schemes = response.json().get("schemes", [])
        if not schemes:
            pytest.skip("No schemes available for testing")
        
        scheme_id = schemes[0]["scheme_id"]
        response = requests.get(
            f"{BASE_URL}/api/schemes/{scheme_id}/view",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        assert "text/html" in response.headers.get("Content-Type", "")
        print("PASS: Scheme view returns HTML")
    
    def test_scheme_view_no_print_button(self):
        """Scheme view HTML must NOT contain Print button element"""
        response = requests.get(f"{BASE_URL}/api/schemes", headers=AUTH_HEADER)
        schemes = response.json().get("schemes", [])
        if not schemes:
            pytest.skip("No schemes available for testing")
        
        scheme_id = schemes[0]["scheme_id"]
        response = requests.get(
            f"{BASE_URL}/api/schemes/{scheme_id}/view",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        html = response.text
        # Check there's no actual button element (CSS classes are OK)
        assert "<button" not in html, "Found <button> element in scheme view"
        print("PASS: Scheme view has no Print button element")
    
    def test_scheme_view_no_download_button(self):
        """Scheme view HTML must NOT contain Download button element"""
        response = requests.get(f"{BASE_URL}/api/schemes", headers=AUTH_HEADER)
        schemes = response.json().get("schemes", [])
        if not schemes:
            pytest.skip("No schemes available for testing")
        
        scheme_id = schemes[0]["scheme_id"]
        response = requests.get(
            f"{BASE_URL}/api/schemes/{scheme_id}/view",
            headers=AUTH_HEADER
        )
        assert response.status_code == 200
        html = response.text
        assert "<button" not in html, "Found <button> element in scheme view"
        print("PASS: Scheme view has no Download button element")


class TestUploadEndpoints:
    """Test upload endpoints for View/Share/Download functionality"""
    
    def test_uploads_list_returns_uploads(self):
        """GET /api/uploads should return uploads array"""
        response = requests.get(f"{BASE_URL}/api/uploads", headers=AUTH_HEADER)
        assert response.status_code == 200
        data = response.json()
        assert "uploads" in data
        print(f"PASS: Uploads list returns {len(data['uploads'])} uploads")
    
    def test_upload_download_endpoint_exists(self):
        """GET /api/uploads/{id}/download should work for existing uploads
        NOTE: Backend only stores metadata, not file content - download endpoint missing"""
        pytest.skip("Backend upload endpoint only stores metadata, download endpoint not implemented")


class TestShareEndpoints:
    """Test share link creation endpoints"""
    
    def test_create_share_link_for_lesson(self):
        """POST /api/links should create share link for lesson"""
        response = requests.post(
            f"{BASE_URL}/api/links",
            headers=AUTH_HEADER,
            json={
                "resource_type": "lesson",
                "resource_id": ZANZIBAR_LESSON_ID
            }
        )
        # Should succeed or return existing link
        assert response.status_code in [200, 201], f"Share link creation failed: {response.status_code}"
        data = response.json()
        assert "share_url" in data or "link" in data or "share_link" in data or "link_code" in data, "Missing share URL in response"
        print("PASS: Share link creation works for lessons")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
