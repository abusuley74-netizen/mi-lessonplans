"""
Test upload sharing functionality - iteration 21
Tests:
1. POST /api/links with resource_type='upload' succeeds
2. GET /api/links/{code} returns upload preview with name, content_type
3. GET /api/links/{code}/download returns the actual file
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SESSION_TOKEN = "test_session_tts_001"
UPLOAD_ID = "upload_test_001"


class TestUploadSharing:
    """Test upload sharing via shared links"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.cookies.set("session_token", SESSION_TOKEN)
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_create_upload_shared_link(self):
        """POST /api/links with resource_type='upload' should succeed"""
        response = self.session.post(f"{BASE_URL}/api/links", json={
            "resource_type": "upload",
            "resource_id": UPLOAD_ID,
            "description": "Test upload share pytest",
            "is_paid": False
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "link_code" in data, "Response should contain link_code"
        assert data["resource_type"] == "upload", "resource_type should be 'upload'"
        assert data["resource_id"] == UPLOAD_ID, f"resource_id should be {UPLOAD_ID}"
        assert data["status"] == "active", "status should be 'active'"
        assert "title" in data, "Response should contain title"
        
        # Store link_code for subsequent tests
        self.__class__.created_link_code = data["link_code"]
        print(f"Created shared link: {data['link_code']}")
    
    def test_get_upload_shared_link_preview(self):
        """GET /api/links/{code} should return upload preview with name and content_type"""
        # First create a link if not already created
        if not hasattr(self.__class__, 'created_link_code'):
            self.test_create_upload_shared_link()
        
        link_code = self.__class__.created_link_code
        response = requests.get(f"{BASE_URL}/api/links/{link_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify link data
        assert "link" in data, "Response should contain 'link'"
        assert "preview" in data, "Response should contain 'preview'"
        assert data["expired"] == False, "Link should not be expired"
        
        # Verify preview contains upload-specific fields
        preview = data["preview"]
        assert "name" in preview, "Preview should contain 'name'"
        assert "content_type" in preview, "Preview should contain 'content_type'"
        assert preview["name"] == "test_document.txt", f"Expected name 'test_document.txt', got {preview['name']}"
        
        print(f"Preview: {preview}")
    
    def test_download_upload_shared_link(self):
        """GET /api/links/{code}/download should return the actual file"""
        # First create a fresh link for download test
        response = self.session.post(f"{BASE_URL}/api/links", json={
            "resource_type": "upload",
            "resource_id": UPLOAD_ID,
            "description": "Download test",
            "is_paid": False
        })
        assert response.status_code == 200
        link_code = response.json()["link_code"]
        
        # Download the file
        download_response = requests.get(f"{BASE_URL}/api/links/{link_code}/download")
        
        assert download_response.status_code == 200, f"Expected 200, got {download_response.status_code}: {download_response.text}"
        
        # Verify content type
        content_type = download_response.headers.get("content-type", "")
        assert "text/plain" in content_type, f"Expected text/plain content type, got {content_type}"
        
        # Verify content disposition (filename)
        content_disp = download_response.headers.get("content-disposition", "")
        assert "test_document.txt" in content_disp, f"Expected filename in content-disposition, got {content_disp}"
        
        print(f"Downloaded file, content-type: {content_type}")
    
    def test_upload_not_in_invalid_resource_types(self):
        """Verify 'upload' is now a valid resource_type (not returning 400)"""
        response = self.session.post(f"{BASE_URL}/api/links", json={
            "resource_type": "upload",
            "resource_id": UPLOAD_ID
        })
        
        # Should NOT return 400 with "Invalid resource_type"
        if response.status_code == 400:
            data = response.json()
            assert "Invalid resource_type" not in data.get("detail", ""), \
                "upload should be a valid resource_type now"
        else:
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        print("'upload' is a valid resource_type")


class TestInvalidResourceType:
    """Test that invalid resource types still return 400"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.cookies.set("session_token", SESSION_TOKEN)
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_invalid_resource_type_returns_400(self):
        """POST /api/links with invalid resource_type should return 400"""
        response = self.session.post(f"{BASE_URL}/api/links", json={
            "resource_type": "invalid_type",
            "resource_id": "some_id"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "Invalid resource_type" in data.get("detail", ""), \
            "Should return 'Invalid resource_type' error"
        
        print("Invalid resource_type correctly returns 400")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
