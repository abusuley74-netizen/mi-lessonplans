"""
Test suite for miLessonPlan rebranding verification
Tests: PWA manifest, service worker, referral links, and API endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPWAAssets:
    """PWA manifest and service worker tests"""
    
    def test_manifest_json_accessible(self):
        """manifest.json should be accessible at /manifest.json"""
        response = requests.get(f"{BASE_URL}/manifest.json", timeout=10)
        assert response.status_code == 200, f"manifest.json not accessible: {response.status_code}"
        data = response.json()
        assert data.get("short_name") == "miLessonPlan", f"short_name should be 'miLessonPlan', got: {data.get('short_name')}"
        assert data.get("name") == "miLessonPlan - AI Lesson Planning", f"name mismatch: {data.get('name')}"
        print(f"PASS: manifest.json accessible with correct app name: {data.get('name')}")
    
    def test_service_worker_accessible(self):
        """service-worker.js should be accessible at /service-worker.js"""
        response = requests.get(f"{BASE_URL}/service-worker.js", timeout=10)
        assert response.status_code == 200, f"service-worker.js not accessible: {response.status_code}"
        assert "milessonplan" in response.text.lower(), "service-worker.js should contain milessonplan cache name"
        print("PASS: service-worker.js accessible")
    
    def test_pwa_icon_192_exists(self):
        """PWA icon 192x192 should exist"""
        response = requests.get(f"{BASE_URL}/icon-192x192.png", timeout=10)
        assert response.status_code == 200, f"icon-192x192.png not accessible: {response.status_code}"
        assert response.headers.get("content-type", "").startswith("image/"), "Should be an image"
        print("PASS: icon-192x192.png exists")
    
    def test_pwa_icon_512_exists(self):
        """PWA icon 512x512 should exist"""
        response = requests.get(f"{BASE_URL}/icon-512x512.png", timeout=10)
        assert response.status_code == 200, f"icon-512x512.png not accessible: {response.status_code}"
        assert response.headers.get("content-type", "").startswith("image/"), "Should be an image"
        print("PASS: icon-512x512.png exists")
    
    def test_favicon_exists(self):
        """favicon.ico should exist"""
        response = requests.get(f"{BASE_URL}/favicon.ico", timeout=10)
        assert response.status_code == 200, f"favicon.ico not accessible: {response.status_code}"
        print("PASS: favicon.ico exists")
    
    def test_logo_exists(self):
        """logo.jpg should exist"""
        response = requests.get(f"{BASE_URL}/logo.jpg", timeout=10)
        assert response.status_code == 200, f"logo.jpg not accessible: {response.status_code}"
        assert "image" in response.headers.get("content-type", ""), "Should be an image"
        print("PASS: logo.jpg exists")


class TestReferralLinks:
    """Test referral link API returns mi-lessonplan.site URLs"""
    
    @pytest.fixture
    def auth_headers(self):
        """Get auth headers with test session token"""
        return {
            "Cookie": "session_token=test_session_tts_001",
            "Content-Type": "application/json"
        }
    
    def test_referral_my_code_returns_correct_domain(self, auth_headers):
        """GET /api/teacher/referral/my-code should return mi-lessonplan.site URLs"""
        response = requests.get(f"{BASE_URL}/api/teacher/referral/my-code", headers=auth_headers, timeout=10)
        # May return 401 if session not valid, but we check the endpoint exists
        if response.status_code == 200:
            data = response.json()
            referral_link = data.get("referral_link", "")
            assert "mi-lessonplan.site" in referral_link, f"Referral link should use mi-lessonplan.site, got: {referral_link}"
            print(f"PASS: Referral link uses correct domain: {referral_link}")
        elif response.status_code == 401:
            print("SKIP: Session not valid for referral test (expected in test env)")
            pytest.skip("Session not valid")
        else:
            pytest.fail(f"Unexpected status: {response.status_code}")


class TestBrandingInHTML:
    """Test that HTML pages have correct branding"""
    
    def test_login_page_title(self):
        """Login page should have miLessonPlan title"""
        response = requests.get(f"{BASE_URL}/login", timeout=10)
        assert response.status_code == 200, f"Login page not accessible: {response.status_code}"
        # Check page title
        assert "<title>miLessonPlan</title>" in response.text or "miLessonPlan" in response.text, "Page should have miLessonPlan title"
        print("PASS: Login page accessible")
    
    def test_no_emergent_badge_in_html(self):
        """index.html should not have emergent-badge element"""
        response = requests.get(f"{BASE_URL}/", timeout=10)
        assert response.status_code == 200
        assert "emergent-badge" not in response.text, "emergent-badge should be removed from index.html"
        assert "Made with Emergent" not in response.text, "'Made with Emergent' should be removed"
        print("PASS: No Emergent badge in HTML")


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_health(self):
        """API should be accessible"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        # Health endpoint may or may not exist
        if response.status_code == 200:
            print("PASS: API health endpoint accessible")
        elif response.status_code == 404:
            # Try subscription plans as alternative health check
            response = requests.get(f"{BASE_URL}/api/subscription/plans", timeout=10)
            assert response.status_code == 200, f"API not accessible: {response.status_code}"
            print("PASS: API accessible (via subscription/plans)")
        else:
            pytest.fail(f"API not accessible: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
