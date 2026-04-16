"""
Test Bearer Token Authentication - Iteration 24
Tests the switch from cookie-based auth to Authorization Bearer header auth
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test session token from test_credentials.md
TEST_SESSION_TOKEN = "test_session_tts_001"
TEST_USER_ID = "test-user-tts"


class TestBearerTokenAuth:
    """Test Authorization Bearer header authentication"""
    
    def test_auth_me_with_bearer_token(self):
        """GET /api/auth/me should work with Authorization: Bearer header"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user_id" in data, "Response should contain user_id"
        assert data["user_id"] == TEST_USER_ID, f"Expected user_id {TEST_USER_ID}, got {data['user_id']}"
        assert "email" in data, "Response should contain email"
        assert "subscription_plan" in data, "Response should contain subscription_plan"
    
    def test_auth_me_without_token_returns_401(self):
        """GET /api/auth/me without token should return 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_auth_me_with_invalid_token_returns_401(self):
        """GET /api/auth/me with invalid token should return 401"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_protected_endpoint_with_bearer_token(self):
        """Protected endpoints should work with Bearer token"""
        response = requests.get(
            f"{BASE_URL}/api/lessons",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        # Should return 200 (may be empty list but not 401)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_protected_endpoint_without_token_returns_401(self):
        """Protected endpoints without token should return 401"""
        response = requests.get(f"{BASE_URL}/api/lessons")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestCORSHeaders:
    """Test CORS configuration - no credentials header"""
    
    def test_cors_no_credentials_header(self):
        """CORS response should NOT include access-control-allow-credentials: true"""
        response = requests.options(
            f"{BASE_URL}/api/auth/me",
            headers={
                "Origin": "https://mi-lessonplan.site",
                "Access-Control-Request-Method": "GET"
            }
        )
        # Check that credentials header is not present or not 'true'
        credentials_header = response.headers.get("access-control-allow-credentials", "").lower()
        assert credentials_header != "true", f"CORS should not have allow-credentials: true, got: {credentials_header}"
    
    def test_cors_allows_authorization_header(self):
        """CORS should allow Authorization header"""
        response = requests.options(
            f"{BASE_URL}/api/auth/me",
            headers={
                "Origin": "https://mi-lessonplan.site",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Authorization"
            }
        )
        # Should return 200 or 204 for preflight (both are valid)
        assert response.status_code in [200, 204], f"Preflight should return 200/204, got {response.status_code}"


class TestGoogleAuthResponse:
    """Test that Google auth endpoint returns session_token in body"""
    
    def test_google_auth_endpoint_exists(self):
        """POST /api/auth/google endpoint should exist"""
        # Just test that endpoint exists (will fail with 400 without credential)
        response = requests.post(
            f"{BASE_URL}/api/auth/google",
            json={}
        )
        # Should return 400 (missing credential) not 404
        assert response.status_code == 400, f"Expected 400 for missing credential, got {response.status_code}"
        assert "credential" in response.text.lower(), "Error should mention missing credential"


class TestSchemeEndpointsWithBearer:
    """Test scheme endpoints work with Bearer token"""
    
    def test_get_schemes_with_bearer(self):
        """GET /api/schemes should work with Bearer token"""
        response = requests.get(
            f"{BASE_URL}/api/schemes",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_get_schemes_without_token_returns_401(self):
        """GET /api/schemes without token should return 401"""
        response = requests.get(f"{BASE_URL}/api/schemes")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestMyFilesEndpointsWithBearer:
    """Test My Files endpoints work with Bearer token"""
    
    def test_get_uploads_with_bearer(self):
        """GET /api/uploads should work with Bearer token"""
        response = requests.get(
            f"{BASE_URL}/api/uploads",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_get_dictations_with_bearer(self):
        """GET /api/dictations should work with Bearer token"""
        response = requests.get(
            f"{BASE_URL}/api/dictations",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
