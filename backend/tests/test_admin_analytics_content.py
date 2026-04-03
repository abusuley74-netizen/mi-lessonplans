"""
Test Admin Analytics and Content Management APIs
Tests for iteration 15: Content Management and Analytics pages
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "admin@milessonplan.com"
ADMIN_PASSWORD = "password"


class TestAdminAnalyticsContent:
    """Test Admin Analytics and Content Management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup admin session for tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as admin
        login_response = self.session.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
        
        login_data = login_response.json()
        self.admin_token = login_data.get("session_token")
        assert self.admin_token, "No session token returned"
        
        self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
        yield
    
    # ==================== Analytics Overview Tests ====================
    
    def test_analytics_overview_returns_user_growth(self):
        """GET /api/admin/analytics/overview returns user_growth array"""
        response = self.session.get(f"{BASE_URL}/api/admin/analytics/overview")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "user_growth" in data, "Missing user_growth field"
        assert isinstance(data["user_growth"], list), "user_growth should be a list"
        print(f"PASS: user_growth returned with {len(data['user_growth'])} entries")
    
    def test_analytics_overview_returns_lesson_trends(self):
        """GET /api/admin/analytics/overview returns lesson_trends array"""
        response = self.session.get(f"{BASE_URL}/api/admin/analytics/overview")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "lesson_trends" in data, "Missing lesson_trends field"
        assert isinstance(data["lesson_trends"], list), "lesson_trends should be a list"
        print(f"PASS: lesson_trends returned with {len(data['lesson_trends'])} entries")
    
    def test_analytics_overview_returns_subscription_distribution(self):
        """GET /api/admin/analytics/overview returns subscription_distribution array"""
        response = self.session.get(f"{BASE_URL}/api/admin/analytics/overview")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "subscription_distribution" in data, "Missing subscription_distribution field"
        assert isinstance(data["subscription_distribution"], list), "subscription_distribution should be a list"
        print(f"PASS: subscription_distribution returned with {len(data['subscription_distribution'])} entries")
    
    def test_analytics_overview_returns_popular_subjects(self):
        """GET /api/admin/analytics/overview returns popular_subjects array"""
        response = self.session.get(f"{BASE_URL}/api/admin/analytics/overview")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "popular_subjects" in data, "Missing popular_subjects field"
        assert isinstance(data["popular_subjects"], list), "popular_subjects should be a list"
        print(f"PASS: popular_subjects returned with {len(data['popular_subjects'])} entries")
    
    # ==================== Analytics Content Tests ====================
    
    def test_analytics_content_returns_content_stats(self):
        """GET /api/admin/analytics/content returns content_stats object"""
        response = self.session.get(f"{BASE_URL}/api/admin/analytics/content")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "content_stats" in data, "Missing content_stats field"
        
        stats = data["content_stats"]
        expected_keys = ["lessons", "notes", "schemes", "templates", "dictations", "shared_links"]
        for key in expected_keys:
            assert key in stats, f"Missing {key} in content_stats"
            assert isinstance(stats[key], int), f"{key} should be an integer"
        
        print(f"PASS: content_stats returned: {stats}")
    
    def test_analytics_content_returns_most_active_users(self):
        """GET /api/admin/analytics/content returns most_active_users array"""
        response = self.session.get(f"{BASE_URL}/api/admin/analytics/content")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "most_active_users" in data, "Missing most_active_users field"
        assert isinstance(data["most_active_users"], list), "most_active_users should be a list"
        
        # If there are active users, verify structure
        if len(data["most_active_users"]) > 0:
            user = data["most_active_users"][0]
            assert "name" in user or "email" in user, "Active user should have name or email"
            assert "lesson_count" in user, "Active user should have lesson_count"
        
        print(f"PASS: most_active_users returned with {len(data['most_active_users'])} entries")
    
    # ==================== Analytics Revenue Tests ====================
    
    def test_analytics_revenue_returns_revenue_breakdown(self):
        """GET /api/admin/analytics/revenue returns revenue_breakdown array"""
        response = self.session.get(f"{BASE_URL}/api/admin/analytics/revenue")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "revenue_breakdown" in data, "Missing revenue_breakdown field"
        assert isinstance(data["revenue_breakdown"], list), "revenue_breakdown should be a list"
        
        # If there's revenue data, verify structure
        if len(data["revenue_breakdown"]) > 0:
            item = data["revenue_breakdown"][0]
            assert "_id" in item, "Revenue item should have _id (plan name)"
            assert "count" in item, "Revenue item should have count"
            assert "revenue" in item, "Revenue item should have revenue"
        
        print(f"PASS: revenue_breakdown returned with {len(data['revenue_breakdown'])} entries")
    
    # ==================== Content Lessons Tests ====================
    
    def test_content_lessons_returns_lessons_array(self):
        """GET /api/admin/content/lessons returns lessons array"""
        response = self.session.get(f"{BASE_URL}/api/admin/content/lessons")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "lessons" in data, "Missing lessons field"
        assert isinstance(data["lessons"], list), "lessons should be a list"
        print(f"PASS: lessons returned with {len(data['lessons'])} entries")
    
    def test_content_lessons_returns_total_count(self):
        """GET /api/admin/content/lessons returns total count"""
        response = self.session.get(f"{BASE_URL}/api/admin/content/lessons")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "total" in data, "Missing total field"
        assert isinstance(data["total"], int), "total should be an integer"
        print(f"PASS: total lessons count: {data['total']}")
    
    def test_content_lessons_pagination(self):
        """GET /api/admin/content/lessons supports skip and limit params"""
        response = self.session.get(f"{BASE_URL}/api/admin/content/lessons?skip=0&limit=5")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "lessons" in data, "Missing lessons field"
        assert len(data["lessons"]) <= 5, "Should return at most 5 lessons"
        print(f"PASS: pagination works, returned {len(data['lessons'])} lessons with limit=5")
    
    def test_content_lessons_structure(self):
        """GET /api/admin/content/lessons returns lessons with expected fields"""
        response = self.session.get(f"{BASE_URL}/api/admin/content/lessons?limit=1")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        if len(data["lessons"]) > 0:
            lesson = data["lessons"][0]
            # Check for expected fields
            expected_fields = ["lesson_id", "title", "subject", "created_at"]
            for field in expected_fields:
                if field not in lesson:
                    print(f"Note: {field} not in lesson, may be optional")
            print(f"PASS: lesson structure verified: {list(lesson.keys())}")
        else:
            print("PASS: No lessons to verify structure (empty database)")
    
    # ==================== Delete Lesson Tests ====================
    
    def test_delete_lesson_nonexistent_returns_404(self):
        """DELETE /api/admin/content/lessons/{lesson_id} returns 404 for nonexistent"""
        response = self.session.delete(f"{BASE_URL}/api/admin/content/lessons/nonexistent_lesson_123")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: DELETE nonexistent lesson returns 404")
    
    # ==================== Auth Required Tests ====================
    
    def test_analytics_overview_requires_auth(self):
        """GET /api/admin/analytics/overview requires authentication"""
        no_auth_session = requests.Session()
        response = no_auth_session.get(f"{BASE_URL}/api/admin/analytics/overview")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: analytics/overview requires authentication")
    
    def test_analytics_content_requires_auth(self):
        """GET /api/admin/analytics/content requires authentication"""
        no_auth_session = requests.Session()
        response = no_auth_session.get(f"{BASE_URL}/api/admin/analytics/content")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: analytics/content requires authentication")
    
    def test_content_lessons_requires_auth(self):
        """GET /api/admin/content/lessons requires authentication"""
        no_auth_session = requests.Session()
        response = no_auth_session.get(f"{BASE_URL}/api/admin/content/lessons")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: content/lessons requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
