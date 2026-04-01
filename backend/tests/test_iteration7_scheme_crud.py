"""
Iteration 7 Backend Tests - Scheme of Work CRUD and Delete Operations
Tests:
- POST /api/schemes - Create scheme of work
- GET /api/schemes - Get all schemes
- DELETE /api/schemes/{id} - Delete scheme
- DELETE /api/lessons/{id} - Delete lesson
- DELETE /api/notes/{id} - Delete note
- DELETE /api/dictations/{id} - Delete dictation
- DELETE /api/uploads/{id} - Delete upload
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SESSION_TOKEN = "test_session_tts_001"

@pytest.fixture
def auth_headers():
    """Headers with authentication token"""
    return {
        "Authorization": f"Bearer {SESSION_TOKEN}",
        "Content-Type": "application/json"
    }

class TestSchemeOfWorkCRUD:
    """Test Scheme of Work CRUD operations"""
    
    def test_create_scheme(self, auth_headers):
        """POST /api/schemes - Create a new scheme of work"""
        scheme_data = {
            "syllabus": "Zanzibar",
            "school": "TEST_School_Iter7",
            "teacher": "TEST_Teacher_Iter7",
            "subject": "Mathematics",
            "year": 2026,
            "term": "1",
            "class": "Form 2",
            "competencies": [
                {
                    "main": "Understanding algebra",
                    "specific": "Solve linear equations",
                    "activities": "Practice problems",
                    "specificActivities": "Group work",
                    "month": "January",
                    "week": "1",
                    "periods": "4",
                    "methods": "Discussion, demonstration",
                    "resources": "Textbook, whiteboard",
                    "assessment": "Written test",
                    "references": "Math textbook Ch.1",
                    "remarks": ""
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/schemes",
            json=scheme_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "scheme_id" in data, "Response should contain scheme_id"
        assert data["syllabus"] == "Zanzibar"
        assert data["school"] == "TEST_School_Iter7"
        assert data["subject"] == "Mathematics"
        assert len(data["competencies"]) == 1
        
        # Store scheme_id for cleanup
        TestSchemeOfWorkCRUD.created_scheme_id = data["scheme_id"]
        print(f"Created scheme: {data['scheme_id']}")
        return data["scheme_id"]
    
    def test_get_schemes(self, auth_headers):
        """GET /api/schemes - Get all schemes for user"""
        response = requests.get(
            f"{BASE_URL}/api/schemes",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "schemes" in data, "Response should contain schemes array"
        assert isinstance(data["schemes"], list)
        print(f"Found {len(data['schemes'])} schemes")
    
    def test_delete_scheme(self, auth_headers):
        """DELETE /api/schemes/{id} - Delete a scheme"""
        # First create a scheme to delete
        scheme_data = {
            "syllabus": "Tanzania Mainland",
            "school": "TEST_Delete_School",
            "teacher": "TEST_Delete_Teacher",
            "subject": "Science",
            "year": 2026,
            "term": "2",
            "class": "Form 1",
            "competencies": []
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/schemes",
            json=scheme_data,
            headers=auth_headers
        )
        assert create_response.status_code == 200
        scheme_id = create_response.json()["scheme_id"]
        print(f"Created scheme for deletion: {scheme_id}")
        
        # Now delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/schemes/{scheme_id}",
            headers=auth_headers
        )
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}: {delete_response.text}"
        assert delete_response.json()["message"] == "Scheme deleted"
        print(f"Successfully deleted scheme: {scheme_id}")
        
        # Verify it's gone by checking GET
        get_response = requests.get(
            f"{BASE_URL}/api/schemes",
            headers=auth_headers
        )
        schemes = get_response.json()["schemes"]
        scheme_ids = [s["scheme_id"] for s in schemes]
        assert scheme_id not in scheme_ids, "Deleted scheme should not appear in list"


class TestDeleteOperations:
    """Test delete operations for all file types"""
    
    def test_delete_lesson(self, auth_headers):
        """DELETE /api/lessons/{id} - Delete a lesson"""
        # First check if there are any lessons
        get_response = requests.get(
            f"{BASE_URL}/api/lessons",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        lessons = get_response.json()["lessons"]
        
        if lessons:
            # Delete the first lesson
            lesson_id = lessons[0]["lesson_id"]
            delete_response = requests.delete(
                f"{BASE_URL}/api/lessons/{lesson_id}",
                headers=auth_headers
            )
            assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
            print(f"Successfully deleted lesson: {lesson_id}")
        else:
            # Test with non-existent ID should return 404
            delete_response = requests.delete(
                f"{BASE_URL}/api/lessons/nonexistent_lesson",
                headers=auth_headers
            )
            assert delete_response.status_code == 404
            print("No lessons to delete, verified 404 for non-existent lesson")
    
    def test_delete_note(self, auth_headers):
        """DELETE /api/notes/{id} - Delete a note"""
        # Create a test note first
        note_data = {
            "title": "TEST_Note_Iter7_Delete",
            "content": "<p>Test note content for deletion</p>"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/notes",
            json=note_data,
            headers=auth_headers
        )
        assert create_response.status_code == 200
        note_id = create_response.json()["note_id"]
        print(f"Created note for deletion: {note_id}")
        
        # Delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/notes/{note_id}",
            headers=auth_headers
        )
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        assert delete_response.json()["message"] == "Note deleted"
        print(f"Successfully deleted note: {note_id}")
    
    def test_delete_dictation(self, auth_headers):
        """DELETE /api/dictations/{id} - Delete a dictation"""
        # Create a test dictation first
        dictation_data = {
            "title": "TEST_Dictation_Iter7_Delete",
            "text": "Test dictation text for deletion",
            "language": "en-GB"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/dictations",
            json=dictation_data,
            headers=auth_headers
        )
        assert create_response.status_code == 200
        dictation_id = create_response.json()["dictation_id"]
        print(f"Created dictation for deletion: {dictation_id}")
        
        # Delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/dictations/{dictation_id}",
            headers=auth_headers
        )
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        assert delete_response.json()["message"] == "Dictation deleted"
        print(f"Successfully deleted dictation: {dictation_id}")
    
    def test_delete_upload(self, auth_headers):
        """DELETE /api/uploads/{id} - Delete an upload"""
        # Check existing uploads
        get_response = requests.get(
            f"{BASE_URL}/api/uploads",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        uploads = get_response.json()["uploads"]
        
        if uploads:
            # Delete the first upload
            upload_id = uploads[0]["upload_id"]
            delete_response = requests.delete(
                f"{BASE_URL}/api/uploads/{upload_id}",
                headers=auth_headers
            )
            assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
            print(f"Successfully deleted upload: {upload_id}")
        else:
            # Test with non-existent ID should return 404
            delete_response = requests.delete(
                f"{BASE_URL}/api/uploads/nonexistent_upload",
                headers=auth_headers
            )
            assert delete_response.status_code == 404
            print("No uploads to delete, verified 404 for non-existent upload")


class TestSchemeDataValidation:
    """Test scheme data validation and edge cases"""
    
    def test_create_scheme_with_empty_competencies(self, auth_headers):
        """POST /api/schemes - Create scheme with empty competencies array"""
        scheme_data = {
            "syllabus": "Zanzibar",
            "school": "TEST_Empty_Competencies",
            "teacher": "Test Teacher",
            "subject": "English",
            "year": 2026,
            "term": "1",
            "class": "Form 3",
            "competencies": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/schemes",
            json=scheme_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["competencies"] == []
        print(f"Created scheme with empty competencies: {data['scheme_id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/schemes/{data['scheme_id']}", headers=auth_headers)
    
    def test_create_scheme_tanzania_mainland(self, auth_headers):
        """POST /api/schemes - Create scheme with Tanzania Mainland syllabus"""
        scheme_data = {
            "syllabus": "Tanzania Mainland",
            "school": "TEST_Mainland_School",
            "teacher": "Test Teacher",
            "subject": "Kiswahili",
            "year": 2026,
            "term": "2",
            "class": "Form 4",
            "competencies": [
                {
                    "main": "Umahiri Mkuu",
                    "specific": "Umahiri Mahususi",
                    "activities": "Shughuli Kuu",
                    "specificActivities": "Shughuli Mahususi",
                    "month": "February",
                    "week": "2",
                    "periods": "3",
                    "methods": "Majadiliano",
                    "resources": "Kitabu",
                    "assessment": "Mtihani",
                    "references": "Kiswahili Kitabu",
                    "remarks": ""
                }
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/schemes",
            json=scheme_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["syllabus"] == "Tanzania Mainland"
        print(f"Created Tanzania Mainland scheme: {data['scheme_id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/schemes/{data['scheme_id']}", headers=auth_headers)


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_schemes(self, auth_headers):
        """Clean up TEST_ prefixed schemes"""
        response = requests.get(f"{BASE_URL}/api/schemes", headers=auth_headers)
        if response.status_code == 200:
            schemes = response.json()["schemes"]
            for scheme in schemes:
                if scheme.get("school", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/schemes/{scheme['scheme_id']}", headers=auth_headers)
                    print(f"Cleaned up scheme: {scheme['scheme_id']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
