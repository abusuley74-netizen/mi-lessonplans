"""
Test Iteration 6 - Bug Fixes Testing
1. My Files: displays all file types (lessons, notes, dictations, uploads)
2. SchemeOfWork: Zanzibar/Tanzania Mainland toggle
3. Profile: picture upload and display in Header
"""
import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_TOKEN = "test_session_tts_001"

@pytest.fixture
def auth_headers():
    return {"Authorization": f"Bearer {TEST_TOKEN}"}

class TestProfileAPIs:
    """Profile endpoint tests - Bug Fix #3"""
    
    def test_get_profile_returns_user_data(self, auth_headers):
        """GET /api/profile returns user profile data"""
        response = requests.get(f"{BASE_URL}/api/profile", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "name" in data
    
    def test_update_profile_fields(self, auth_headers):
        """PUT /api/profile updates name, school, location, bio"""
        update_data = {
            "name": "Test Teacher Updated",
            "school": "Test Primary School",
            "location": "Zanzibar",
            "bio": "Experienced teacher"
        }
        response = requests.put(
            f"{BASE_URL}/api/profile",
            headers={**auth_headers, "Content-Type": "application/json"},
            json=update_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["school"] == update_data["school"]
        assert data["location"] == update_data["location"]
        assert data["bio"] == update_data["bio"]
    
    def test_upload_profile_picture(self, auth_headers):
        """POST /api/profile/upload-picture accepts image and returns base64 data URI"""
        # Create a minimal 1x1 PNG image
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {"file": ("test.png", png_data, "image/png")}
        response = requests.post(
            f"{BASE_URL}/api/profile/upload-picture",
            headers=auth_headers,
            files=files
        )
        assert response.status_code == 200
        data = response.json()
        assert "picture" in data
        assert data["picture"].startswith("data:image/png;base64,")
        assert "message" in data
    
    def test_auth_me_returns_custom_picture(self, auth_headers):
        """GET /api/auth/me returns custom_picture field if set"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # After upload, custom_picture should be present
        assert "custom_picture" in data or "picture" in data
        if "custom_picture" in data:
            assert data["custom_picture"].startswith("data:image/")


class TestMyFilesAPIs:
    """My Files endpoint tests - Bug Fix #1"""
    
    def test_get_lessons(self, auth_headers):
        """GET /api/lessons returns lessons array"""
        response = requests.get(f"{BASE_URL}/api/lessons", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "lessons" in data
        assert isinstance(data["lessons"], list)
    
    def test_get_notes(self, auth_headers):
        """GET /api/notes returns notes array"""
        response = requests.get(f"{BASE_URL}/api/notes", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "notes" in data
        assert isinstance(data["notes"], list)
    
    def test_get_dictations(self, auth_headers):
        """GET /api/dictations returns dictations array"""
        response = requests.get(f"{BASE_URL}/api/dictations", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "dictations" in data
        assert isinstance(data["dictations"], list)
    
    def test_get_uploads(self, auth_headers):
        """GET /api/uploads returns uploads array"""
        response = requests.get(f"{BASE_URL}/api/uploads", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "uploads" in data
        assert isinstance(data["uploads"], list)
    
    def test_create_dictation(self, auth_headers):
        """POST /api/dictations creates a dictation record"""
        dictation_data = {
            "title": "TEST_Iteration6_Dictation",
            "text": "Hello students, today we will learn about mathematics.",
            "language": "en-GB"
        }
        response = requests.post(
            f"{BASE_URL}/api/dictations",
            headers={**auth_headers, "Content-Type": "application/json"},
            json=dictation_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "dictation_id" in data
        assert data["title"] == dictation_data["title"]
        assert data["text"] == dictation_data["text"]
        assert data["language"] == dictation_data["language"]
    
    def test_dictation_generate_audio(self, auth_headers):
        """POST /api/dictation/generate returns audio for playback"""
        response = requests.post(
            f"{BASE_URL}/api/dictation/generate",
            headers={**auth_headers, "Content-Type": "application/json"},
            json={"text": "Hello students", "language": "en-GB"}
        )
        assert response.status_code == 200
        assert response.headers.get("content-type") == "audio/mpeg"
        assert len(response.content) > 1000  # Should have audio data


class TestHealthAndAuth:
    """Basic health and auth tests"""
    
    def test_health_endpoint(self):
        """GET /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_auth_without_token_returns_401(self):
        """GET /api/auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
