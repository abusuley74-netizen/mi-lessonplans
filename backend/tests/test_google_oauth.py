"""
Test suite for Google OAuth implementation (iteration 20)
Tests:
- POST /api/auth/google endpoint (400 for missing credential, 401 for invalid token)
- GET /api/auth/me returns user data for valid session
- POST /api/auth/logout clears session
- Admin login still works at /api/admin/auth/login
- manifest.json accessible
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session token from test_credentials.md
TEST_SESSION_TOKEN = "test_session_tts_001"

class TestGoogleAuthEndpoint:
    """Tests for POST /api/auth/google endpoint"""
    
    def test_google_auth_missing_credential(self):
        """POST /api/auth/google should return 400 for missing credential"""
        response = requests.post(
            f"{BASE_URL}/api/auth/google",
            json={},
            headers={"Content-Type": "application/json"}
        )
        # Should return 400 for missing credential
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        print(f"PASS: Missing credential returns 400 with message: {data['detail']}")
    
    def test_google_auth_invalid_token(self):
        """POST /api/auth/google should return 401 for invalid token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/google",
            json={"credential": "fake_invalid_token_12345"},
            headers={"Content-Type": "application/json"}
        )
        # Should return 401 for invalid token (not 404 or 500)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        print(f"PASS: Invalid token returns 401 with message: {data['detail']}")
    
    def test_google_auth_endpoint_exists(self):
        """POST /api/auth/google endpoint should exist (not 404)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/google",
            json={"credential": "test"},
            headers={"Content-Type": "application/json"}
        )
        # Should NOT be 404 - endpoint exists
        assert response.status_code != 404, f"Endpoint not found - got 404"
        # Should NOT be 500 for basic invalid token
        assert response.status_code != 500, f"Server error - got 500: {response.text}"
        print(f"PASS: /api/auth/google endpoint exists, returns {response.status_code}")


class TestAuthMe:
    """Tests for GET /api/auth/me endpoint"""
    
    def test_auth_me_with_valid_session(self):
        """GET /api/auth/me should return user data for valid session"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "user_id" in data, "Response should contain user_id"
        assert "email" in data, "Response should contain email"
        print(f"PASS: /api/auth/me returns user data: {data.get('email')}")
    
    def test_auth_me_without_session(self):
        """GET /api/auth/me should return 401 without session"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: /api/auth/me returns 401 without session")
    
    def test_auth_me_with_invalid_session(self):
        """GET /api/auth/me should return 401 for invalid session"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_session_token_xyz"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: /api/auth/me returns 401 for invalid session")


class TestAuthLogout:
    """Tests for POST /api/auth/logout endpoint"""
    
    def test_logout_endpoint_exists(self):
        """POST /api/auth/logout should exist and return success"""
        response = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers={"Content-Type": "application/json"}
        )
        # Should return 200 even without session (graceful logout)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "message" in data
        print(f"PASS: /api/auth/logout returns success: {data['message']}")


class TestAdminLogin:
    """Tests for admin login (should still work separately)"""
    
    def test_admin_login_works(self):
        """Admin login at /api/admin/auth/login should still work"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"email": "admin@milessonplan.com", "password": "password"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "admin" in data, "Response should contain admin data"
        assert "session_token" in data, "Response should contain session_token"
        print(f"PASS: Admin login works, admin: {data['admin'].get('email')}")
    
    def test_admin_login_invalid_credentials(self):
        """Admin login should return 401 for invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpass"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Admin login returns 401 for invalid credentials")


class TestManifestAndStaticAssets:
    """Tests for manifest.json and static assets"""
    
    def test_manifest_json_accessible(self):
        """manifest.json should be accessible at /manifest.json"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "name" in data, "manifest.json should have name"
        assert "mi-lessonplan.site" in data.get("name", ""), "manifest should have mi-lessonplan.site branding"
        print(f"PASS: manifest.json accessible with name: {data.get('name')}")
    
    def test_login_page_accessible(self):
        """Login page should be accessible"""
        response = requests.get(f"{BASE_URL}/login")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        # Check for mi-lessonplan.site branding in HTML
        assert "mi-lessonplan.site" in response.text or "mi-lessonplan" in response.text.lower(), \
            "Login page should have mi-lessonplan.site branding"
        print("PASS: Login page accessible with mi-lessonplan.site branding")


class TestNoBrandingLeaks:
    """Tests to ensure no Emergent branding on login page"""
    
    def test_no_emergent_text_in_login_html(self):
        """Login page HTML should not contain 'Emergent' or 'emergentagent' text"""
        response = requests.get(f"{BASE_URL}/login")
        assert response.status_code == 200
        html_lower = response.text.lower()
        # Check for Emergent branding (should NOT be present)
        # Note: URLs like emergentagent.com in API calls are OK, but visible text is not
        # We check for visible text patterns
        assert "made with emergent" not in html_lower, "Should not have 'Made with Emergent' badge"
        print("PASS: No 'Made with Emergent' badge found in login page HTML")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
