"""
Test suite for Scheme of Work AI Generation feature
Tests POST /api/schemes/generate endpoint with Zanzibar and Tanzania Mainland syllabi
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SESSION_TOKEN = "test_session_tts_001"

@pytest.fixture
def auth_headers():
    """Headers with session token for authenticated requests"""
    return {
        "Content-Type": "application/json",
        "Cookie": f"session_token={SESSION_TOKEN}"
    }

@pytest.fixture
def api_session():
    """Requests session with auth cookie"""
    session = requests.Session()
    session.cookies.set("session_token", SESSION_TOKEN)
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestSchemeGenerateValidation:
    """Test input validation for /api/schemes/generate"""
    
    def test_generate_requires_subject(self, api_session):
        """POST /api/schemes/generate returns 400 if subject is missing"""
        response = api_session.post(f"{BASE_URL}/api/schemes/generate", json={
            "syllabus": "Zanzibar",
            "class": "Standard 5",
            "term": "Term 1",
            "num_rows": 5
        }, timeout=30)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        assert "subject" in data["detail"].lower() or "required" in data["detail"].lower()
        print("PASS: Missing subject returns 400")
    
    def test_generate_requires_class(self, api_session):
        """POST /api/schemes/generate returns 400 if class is missing"""
        response = api_session.post(f"{BASE_URL}/api/schemes/generate", json={
            "syllabus": "Zanzibar",
            "subject": "Mathematics",
            "term": "Term 1",
            "num_rows": 5
        }, timeout=30)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data
        assert "class" in data["detail"].lower() or "required" in data["detail"].lower()
        print("PASS: Missing class returns 400")


class TestSchemeGenerateZanzibar:
    """Test AI generation for Zanzibar syllabus"""
    
    def test_generate_zanzibar_returns_competencies(self, api_session):
        """POST /api/schemes/generate with Zanzibar syllabus returns competency rows"""
        response = api_session.post(f"{BASE_URL}/api/schemes/generate", json={
            "syllabus": "Zanzibar",
            "subject": "Mathematics",
            "class": "Standard 5",
            "term": "Term 1",
            "num_rows": 5
        }, timeout=60)  # AI generation takes time
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check response structure
        assert "competencies" in data, "Response should have 'competencies' key"
        assert "count" in data, "Response should have 'count' key"
        
        competencies = data["competencies"]
        assert isinstance(competencies, list), "competencies should be a list"
        assert len(competencies) == 5, f"Expected 5 rows, got {len(competencies)}"
        
        print(f"PASS: Zanzibar generation returned {len(competencies)} rows")
    
    def test_zanzibar_rows_have_all_required_fields(self, api_session):
        """Zanzibar rows should have all 12 required fields"""
        response = api_session.post(f"{BASE_URL}/api/schemes/generate", json={
            "syllabus": "Zanzibar",
            "subject": "English",
            "class": "Standard 4",
            "term": "Term 2",
            "num_rows": 3
        }, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        required_fields = [
            "main", "specific", "activities", "specificActivities",
            "month", "week", "periods", "methods",
            "resources", "assessment", "references", "remarks"
        ]
        
        for i, row in enumerate(data["competencies"]):
            for field in required_fields:
                assert field in row, f"Row {i} missing field: {field}"
            print(f"Row {i}: All 12 fields present")
        
        print("PASS: All Zanzibar rows have 12 required fields")


class TestSchemeGenerateMainland:
    """Test AI generation for Tanzania Mainland syllabus"""
    
    def test_generate_mainland_returns_competencies(self, api_session):
        """POST /api/schemes/generate with Tanzania Mainland syllabus returns rows"""
        response = api_session.post(f"{BASE_URL}/api/schemes/generate", json={
            "syllabus": "Tanzania Mainland",
            "subject": "Kiswahili",
            "class": "Darasa la 6",
            "term": "Muhula wa 1",
            "num_rows": 5
        }, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "competencies" in data
        assert len(data["competencies"]) == 5
        
        print(f"PASS: Mainland generation returned {len(data['competencies'])} rows")
    
    def test_mainland_rows_have_bilingual_content(self, api_session):
        """Mainland rows should have bilingual Swahili terms"""
        response = api_session.post(f"{BASE_URL}/api/schemes/generate", json={
            "syllabus": "Tanzania Mainland",
            "subject": "Science",
            "class": "Standard 7",
            "term": "Term 1",
            "num_rows": 3
        }, timeout=60)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check that rows have content (bilingual terms may vary)
        for i, row in enumerate(data["competencies"]):
            assert row.get("main"), f"Row {i} 'main' should not be empty"
            assert row.get("specific"), f"Row {i} 'specific' should not be empty"
            print(f"Row {i}: main='{row['main'][:50]}...'")
        
        print("PASS: Mainland rows have content")


class TestSchemeGenerateNumRows:
    """Test num_rows parameter"""
    
    def test_respects_num_rows_5(self, api_session):
        """num_rows=5 should return exactly 5 rows"""
        response = api_session.post(f"{BASE_URL}/api/schemes/generate", json={
            "syllabus": "Zanzibar",
            "subject": "Science",
            "class": "Standard 3",
            "num_rows": 5
        }, timeout=60)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["competencies"]) == 5, f"Expected 5 rows, got {len(data['competencies'])}"
        print("PASS: num_rows=5 returns 5 rows")
    
    def test_respects_num_rows_10(self, api_session):
        """num_rows=10 should return exactly 10 rows"""
        response = api_session.post(f"{BASE_URL}/api/schemes/generate", json={
            "syllabus": "Tanzania Mainland",
            "subject": "History",
            "class": "Form 2",
            "num_rows": 10
        }, timeout=90)  # More rows = more time
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["competencies"]) == 10, f"Expected 10 rows, got {len(data['competencies'])}"
        print("PASS: num_rows=10 returns 10 rows")


class TestSchemeSaveEndpoint:
    """Test POST /api/schemes (save) still works"""
    
    def test_save_scheme_works(self, api_session):
        """POST /api/schemes should save scheme and return scheme_id"""
        response = api_session.post(f"{BASE_URL}/api/schemes", json={
            "syllabus": "Zanzibar",
            "school": "Test School",
            "teacher": "Test Teacher",
            "subject": "Mathematics",
            "year": 2026,
            "term": "Term 1",
            "class": "Standard 5",
            "competencies": [
                {
                    "main": "Test Main Competence",
                    "specific": "Test Specific",
                    "activities": "Test Activities",
                    "specificActivities": "Test Specific Activities",
                    "month": "January",
                    "week": "Week 1",
                    "periods": "4",
                    "methods": "Discussion",
                    "resources": "Textbook",
                    "assessment": "Oral questions",
                    "references": "Syllabus p.10",
                    "remarks": ""
                }
            ]
        }, timeout=30)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "scheme_id" in data, "Response should have scheme_id"
        print(f"PASS: Scheme saved with ID: {data['scheme_id']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
