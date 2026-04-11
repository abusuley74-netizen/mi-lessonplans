"""
Iteration 8: Templates Feature Tests
Tests for 6 structured document templates (Basic, Scientific, Geography, Mathematics, Physics, Chemistry)
with editing, saving to MongoDB, and Word export.
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SESSION_TOKEN = "test_session_tts_001"

@pytest.fixture
def api_client():
    """Shared requests session with auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SESSION_TOKEN}"
    })
    return session


class TestTemplatesGetEndpoint:
    """Tests for GET /api/templates - returns 6 default templates"""
    
    def test_get_templates_returns_200(self, api_client):
        """GET /api/templates should return 200"""
        response = api_client.get(f"{BASE_URL}/api/templates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/templates returns 200")
    
    def test_get_templates_returns_6_templates(self, api_client):
        """GET /api/templates should return exactly 6 templates"""
        response = api_client.get(f"{BASE_URL}/api/templates")
        data = response.json()
        assert "templates" in data, "Response should have 'templates' key"
        templates = data["templates"]
        assert len(templates) == 6, f"Expected 6 templates, got {len(templates)}"
        print(f"✓ GET /api/templates returns 6 templates")
    
    def test_templates_have_correct_types(self, api_client):
        """All 6 template types should be present: basic, scientific, geography, mathematics, physics, chemistry"""
        response = api_client.get(f"{BASE_URL}/api/templates")
        templates = response.json()["templates"]
        types = {t["type"] for t in templates}
        expected_types = {"basic", "scientific", "geography", "mathematics", "physics", "chemistry"}
        assert types == expected_types, f"Expected types {expected_types}, got {types}"
        print(f"✓ All 6 template types present: {types}")
    
    def test_templates_have_required_fields(self, api_client):
        """Each template should have template_id, name, type, description, content"""
        response = api_client.get(f"{BASE_URL}/api/templates")
        templates = response.json()["templates"]
        required_fields = ["template_id", "name", "type", "description", "content"]
        for t in templates:
            for field in required_fields:
                assert field in t, f"Template {t.get('name', 'unknown')} missing field: {field}"
        print("✓ All templates have required fields")
    
    def test_geography_template_has_questions_field(self, api_client):
        """Geography template content should have questions array"""
        response = api_client.get(f"{BASE_URL}/api/templates")
        templates = response.json()["templates"]
        geo_template = next((t for t in templates if t["type"] == "geography"), None)
        assert geo_template is not None, "Geography template not found"
        assert "questions" in geo_template["content"], "Geography template should have questions field"
        print("✓ Geography template has questions field in content")


class TestTemplatesPostEndpoint:
    """Tests for POST /api/templates - save/update user template"""
    
    def test_save_template_returns_200(self, api_client):
        """POST /api/templates should save template and return 200"""
        payload = {
            "template_id": "template_basic",
            "name": "Basic Template",
            "type": "basic",
            "description": "Test description",
            "content": {
                "title": "TEST_Template_Title",
                "subject": "TEST_Subject",
                "category": "TEST_Category",
                "body": "<p>Test body content</p>"
            },
            "is_active": True
        }
        response = api_client.post(f"{BASE_URL}/api/templates", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ POST /api/templates returns 200")
    
    def test_save_template_returns_saved_data(self, api_client):
        """POST /api/templates should return the saved template data"""
        payload = {
            "template_id": "template_scientific",
            "name": "Scientific Template",
            "type": "scientific",
            "description": "Test scientific",
            "content": {
                "title": "TEST_Scientific_Title",
                "subject": "Science",
                "category": "Experiment",
                "body": "<p>Scientific content</p>"
            },
            "is_active": True
        }
        response = api_client.post(f"{BASE_URL}/api/templates", json=payload)
        data = response.json()
        assert data["template_id"] == "template_scientific"
        assert data["content"]["title"] == "TEST_Scientific_Title"
        print("✓ POST /api/templates returns saved template data")
    
    def test_save_geography_template_with_questions(self, api_client):
        """POST /api/templates for geography should save questions array"""
        payload = {
            "template_id": "template_geography",
            "name": "Geography Template",
            "type": "geography",
            "description": "Geography with questions",
            "content": {
                "title": "TEST_Geography_Title",
                "subject": "Geography",
                "category": "Map Reading",
                "body": "<p>Geography content</p>",
                "questions": ["Question 1?", "Question 2?", "Question 3?"]
            },
            "is_active": True
        }
        response = api_client.post(f"{BASE_URL}/api/templates", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "questions" in data["content"]
        assert len(data["content"]["questions"]) == 3
        print("✓ POST /api/templates saves geography questions array")
    
    def test_saved_template_persists_in_get(self, api_client):
        """Saved template should appear in GET /api/templates"""
        # Save a template with unique content
        payload = {
            "template_id": "template_mathematics",
            "name": "Mathematics Template",
            "type": "mathematics",
            "description": "Math template",
            "content": {
                "title": "TEST_Math_Persistence",
                "subject": "Mathematics",
                "category": "Algebra",
                "body": "x + y = z"
            },
            "is_active": True
        }
        api_client.post(f"{BASE_URL}/api/templates", json=payload)
        
        # Verify it persists
        response = api_client.get(f"{BASE_URL}/api/templates")
        templates = response.json()["templates"]
        math_template = next((t for t in templates if t["type"] == "mathematics"), None)
        assert math_template is not None
        assert math_template["content"]["title"] == "TEST_Math_Persistence"
        print("✓ Saved template persists in GET /api/templates")


class TestTemplatesExportEndpoint:
    """Tests for POST /api/templates/{id}/export - export as PDF document"""
    
    def test_export_basic_template_returns_pdf(self, api_client):
        """POST /api/templates/{id}/export should return application/pdf"""
        payload = {
            "type": "basic",
            "content": {
                "title": "Export Test",
                "subject": "Test Subject",
                "category": "Test Category",
                "body": "<p>Test body for export</p>"
            }
        }
        response = api_client.post(f"{BASE_URL}/api/templates/template_basic/export", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "application/pdf" in response.headers.get("Content-Type", "")
        print("✓ POST /api/templates/{id}/export returns application/pdf")
    
    def test_export_returns_content_disposition(self, api_client):
        """Export should have Content-Disposition header with filename"""
        payload = {
            "type": "basic",
            "content": {
                "title": "My Document",
                "subject": "Subject",
                "category": "Category",
                "body": "Content"
            }
        }
        response = api_client.post(f"{BASE_URL}/api/templates/template_basic/export", json=payload)
        content_disp = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disp
        assert ".pdf" in content_disp
        print(f"✓ Export has Content-Disposition: {content_disp}")
    
    def test_export_scientific_template(self, api_client):
        """Export scientific template should work"""
        payload = {
            "type": "scientific",
            "content": {
                "title": "Scientific Export",
                "subject": "Science",
                "category": "Experiment",
                "body": "<p>Scientific notes</p>"
            }
        }
        response = api_client.post(f"{BASE_URL}/api/templates/template_scientific/export", json=payload)
        assert response.status_code == 200
        assert len(response.content) > 100  # Should have substantial content
        print("✓ Scientific template export works")
    
    def test_export_geography_with_questions(self, api_client):
        """Export geography template should include questions"""
        payload = {
            "type": "geography",
            "content": {
                "title": "Geography Export",
                "subject": "Geography",
                "category": "Maps",
                "body": "<p>Map content</p>",
                "questions": ["What is the capital?", "Name the river."]
            }
        }
        response = api_client.post(f"{BASE_URL}/api/templates/template_geography/export", json=payload)
        assert response.status_code == 200
        content = response.content.decode('utf-8')
        assert "What is the capital?" in content
        print("✓ Geography export includes questions")
    
    def test_export_math_template_has_monospace(self, api_client):
        """Math/Physics/Chemistry exports should use monospace font"""
        payload = {
            "type": "mathematics",
            "content": {
                "title": "Math Export",
                "subject": "Mathematics",
                "category": "Algebra",
                "body": "x^2 + y^2 = z^2"
            }
        }
        response = api_client.post(f"{BASE_URL}/api/templates/template_mathematics/export", json=payload)
        assert response.status_code == 200
        content = response.content.decode('utf-8')
        assert "monospace" in content.lower() or "courier" in content.lower()
        print("✓ Math template export uses monospace font")


class TestTemplatesDeleteEndpoint:
    """Tests for DELETE /api/templates/{id}"""
    
    def test_delete_template_returns_200(self, api_client):
        """DELETE /api/templates/{id} should return 200"""
        # First create a template to delete
        payload = {
            "template_id": "template_test_delete",
            "name": "Test Delete Template",
            "type": "basic",
            "description": "To be deleted",
            "content": {"title": "Delete Me", "subject": "", "category": "", "body": ""},
            "is_active": True
        }
        api_client.post(f"{BASE_URL}/api/templates", json=payload)
        
        # Delete it
        response = api_client.delete(f"{BASE_URL}/api/templates/template_test_delete")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ DELETE /api/templates/{id} returns 200")


class TestTemplatesUnauthorized:
    """Tests for unauthorized access"""
    
    def test_get_templates_without_auth_returns_401(self):
        """GET /api/templates without auth should return 401"""
        response = requests.get(f"{BASE_URL}/api/templates")
        assert response.status_code == 401
        print("✓ GET /api/templates without auth returns 401")
    
    def test_post_templates_without_auth_returns_401(self):
        """POST /api/templates without auth should return 401"""
        response = requests.post(f"{BASE_URL}/api/templates", json={"name": "test"})
        assert response.status_code == 401
        print("✓ POST /api/templates without auth returns 401")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
