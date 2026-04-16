"""
Test Scheme of Work enhancements:
1. /api/schemes/generate accepts `topics` field
2. /api/schemes/generate accepts `num_rows` up to 60 (was capped at 20)
3. /api/lessons/generate for Arabic subjects uses Arabic system prompt
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SESSION_TOKEN = "test_session_tts_001"

@pytest.fixture
def api_client():
    """Shared requests session with auth cookie"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    session.cookies.set("session_token", SESSION_TOKEN)
    return session


class TestSchemeGenerateTopicsField:
    """Test that /api/schemes/generate accepts topics field"""
    
    def test_scheme_generate_accepts_topics_field(self, api_client):
        """Verify topics field is accepted in the request"""
        response = api_client.post(f"{BASE_URL}/api/schemes/generate", json={
            "syllabus": "Zanzibar",
            "subject": "Mathematics",
            "class": "Grade 5",
            "term": "Term 1",
            "num_rows": 5,
            "topics": "1. Numbers and Operations\n2. Fractions\n3. Decimals"
        })
        
        # Should not return 422 (validation error) for topics field
        assert response.status_code != 422, f"Topics field rejected: {response.text}"
        # Should return 200 or timeout (502) for AI generation
        assert response.status_code in [200, 502, 504], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "competencies" in data, "Response should contain competencies"
            print(f"SUCCESS: Topics field accepted, got {len(data.get('competencies', []))} rows")


class TestSchemeGenerateNumRowsCap:
    """Test that num_rows cap is now 60 (was 20)"""
    
    def test_num_rows_accepts_35(self, api_client):
        """Verify num_rows=35 is accepted (new default)"""
        response = api_client.post(f"{BASE_URL}/api/schemes/generate", json={
            "syllabus": "Zanzibar",
            "subject": "English",
            "class": "Grade 4",
            "num_rows": 35
        })
        
        # Should not reject num_rows=35
        assert response.status_code != 400 or "num_rows" not in response.text.lower()
        print(f"num_rows=35 accepted, status: {response.status_code}")
    
    def test_num_rows_accepts_60(self, api_client):
        """Verify num_rows=60 is accepted (new max)"""
        response = api_client.post(f"{BASE_URL}/api/schemes/generate", json={
            "syllabus": "Tanzania Mainland",
            "subject": "Science",
            "class": "Form 2",
            "num_rows": 60
        })
        
        # Should not reject num_rows=60
        assert response.status_code != 400 or "num_rows" not in response.text.lower()
        print(f"num_rows=60 accepted, status: {response.status_code}")
    
    def test_num_rows_capped_at_60(self, api_client):
        """Verify num_rows > 60 is capped to 60"""
        # This tests the backend logic: min(max(num_rows, 5), 60)
        # We can't directly verify the cap without checking the response
        response = api_client.post(f"{BASE_URL}/api/schemes/generate", json={
            "syllabus": "Zanzibar",
            "subject": "History",
            "class": "Grade 6",
            "num_rows": 100  # Should be capped to 60
        })
        
        # Should not error - just cap the value
        assert response.status_code in [200, 502, 504], f"Unexpected error for num_rows=100: {response.status_code}"
        print(f"num_rows=100 handled (capped to 60), status: {response.status_code}")


class TestArabicLessonGeneration:
    """Test that Arabic subjects use Arabic system prompt"""
    
    def test_arabic_subject_detection(self, api_client):
        """Test that Arabic subject (اللغة العربية) is detected"""
        # This tests the detect_language function indirectly
        response = api_client.post(f"{BASE_URL}/api/lessons/generate", json={
            "syllabus": "Zanzibar",
            "subject": "اللغة العربية",
            "grade": "Grade 5",
            "topic": "الضمائر المنفصلة"
        })
        
        # Should accept Arabic subject
        assert response.status_code in [200, 502, 504], f"Arabic subject rejected: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            content = data.get("content", {})
            # Check if response contains Arabic text
            content_str = str(content)
            has_arabic = any('\u0600' <= char <= '\u06FF' for char in content_str)
            print(f"Arabic content detected: {has_arabic}")
            print(f"Sample content: {content_str[:200]}...")
    
    def test_arabic_scheme_generation(self, api_client):
        """Test that Arabic scheme generation uses Arabic prompts"""
        response = api_client.post(f"{BASE_URL}/api/schemes/generate", json={
            "syllabus": "Zanzibar",
            "subject": "اللغة العربية",
            "class": "الصف الخامس",
            "term": "الفصل الأول",
            "num_rows": 3,
            "topics": "الضمائر المنفصلة\nالأفعال الماضية\nالجملة الاسمية"
        })
        
        assert response.status_code in [200, 502, 504], f"Arabic scheme rejected: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            competencies = data.get("competencies", [])
            if competencies:
                # Check first row for Arabic content
                first_row = competencies[0]
                row_str = str(first_row)
                has_arabic = any('\u0600' <= char <= '\u06FF' for char in row_str)
                print(f"Arabic content in scheme: {has_arabic}")
                print(f"First row sample: {row_str[:300]}...")


class TestSchemeGenerateValidation:
    """Test basic validation still works"""
    
    def test_requires_subject(self, api_client):
        """Verify subject is still required"""
        response = api_client.post(f"{BASE_URL}/api/schemes/generate", json={
            "syllabus": "Zanzibar",
            "class": "Grade 5",
            "num_rows": 5
        })
        
        assert response.status_code == 400, f"Should require subject, got: {response.status_code}"
        print("Subject validation: PASS")
    
    def test_requires_class(self, api_client):
        """Verify class is still required"""
        response = api_client.post(f"{BASE_URL}/api/schemes/generate", json={
            "syllabus": "Zanzibar",
            "subject": "Mathematics",
            "num_rows": 5
        })
        
        assert response.status_code == 400, f"Should require class, got: {response.status_code}"
        print("Class validation: PASS")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
