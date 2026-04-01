"""
Backend tests for new features:
1. TTS Dictation endpoint (POST /api/dictation/generate) - Real OpenAI TTS
2. Notes endpoint (POST /api/notes) - Create Notes feature
3. Auth verification for protected endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_SESSION_TOKEN = "test_session_tts_001"

class TestHealthAndAuth:
    """Basic health and auth tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health endpoint working")
    
    def test_auth_me_with_valid_token(self):
        """Test /api/auth/me with valid session token"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        print(f"✓ Auth/me working - User: {data.get('email')}")
    
    def test_auth_me_without_token(self):
        """Test /api/auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Auth/me correctly rejects unauthenticated requests")


class TestTTSDictation:
    """Tests for TTS Dictation endpoint - POST /api/dictation/generate"""
    
    def test_tts_english_gb(self):
        """Test TTS with British English (en-GB)"""
        response = requests.post(
            f"{BASE_URL}/api/dictation/generate",
            headers={
                "Authorization": f"Bearer {TEST_SESSION_TOKEN}",
                "Content-Type": "application/json"
            },
            json={"text": "Hello, this is a test of the text to speech system.", "language": "en-GB"}
        )
        assert response.status_code == 200
        assert response.headers.get("content-type") == "audio/mpeg"
        # Check file size is reasonable (should be > 10KB for real audio)
        assert len(response.content) > 10000, f"Audio too small: {len(response.content)} bytes"
        # Check MP3 header (ff f3 or ff fb or ID3)
        header = response.content[:3]
        assert header[:2] in [b'\xff\xf3', b'\xff\xfb', b'ID3'], f"Invalid MP3 header: {header.hex()}"
        print(f"✓ TTS en-GB working - {len(response.content)} bytes")
    
    def test_tts_swahili(self):
        """Test TTS with Swahili (sw)"""
        response = requests.post(
            f"{BASE_URL}/api/dictation/generate",
            headers={
                "Authorization": f"Bearer {TEST_SESSION_TOKEN}",
                "Content-Type": "application/json"
            },
            json={"text": "Habari, hii ni jaribio la mfumo wa kusoma maandishi.", "language": "sw"}
        )
        assert response.status_code == 200
        assert response.headers.get("content-type") == "audio/mpeg"
        assert len(response.content) > 10000
        print(f"✓ TTS Swahili working - {len(response.content)} bytes")
    
    def test_tts_arabic(self):
        """Test TTS with Arabic (ar)"""
        response = requests.post(
            f"{BASE_URL}/api/dictation/generate",
            headers={
                "Authorization": f"Bearer {TEST_SESSION_TOKEN}",
                "Content-Type": "application/json"
            },
            json={"text": "مرحبا، هذا اختبار لنظام تحويل النص إلى كلام.", "language": "ar"}
        )
        assert response.status_code == 200
        assert response.headers.get("content-type") == "audio/mpeg"
        assert len(response.content) > 10000
        print(f"✓ TTS Arabic working - {len(response.content)} bytes")
    
    def test_tts_turkish(self):
        """Test TTS with Turkish (tr)"""
        response = requests.post(
            f"{BASE_URL}/api/dictation/generate",
            headers={
                "Authorization": f"Bearer {TEST_SESSION_TOKEN}",
                "Content-Type": "application/json"
            },
            json={"text": "Merhaba, bu bir metin okuma sistemi testidir.", "language": "tr"}
        )
        assert response.status_code == 200
        assert response.headers.get("content-type") == "audio/mpeg"
        assert len(response.content) > 10000
        print(f"✓ TTS Turkish working - {len(response.content)} bytes")
    
    def test_tts_french(self):
        """Test TTS with French (fr)"""
        response = requests.post(
            f"{BASE_URL}/api/dictation/generate",
            headers={
                "Authorization": f"Bearer {TEST_SESSION_TOKEN}",
                "Content-Type": "application/json"
            },
            json={"text": "Bonjour, ceci est un test du système de synthèse vocale.", "language": "fr"}
        )
        assert response.status_code == 200
        assert response.headers.get("content-type") == "audio/mpeg"
        assert len(response.content) > 10000
        print(f"✓ TTS French working - {len(response.content)} bytes")
    
    def test_tts_empty_text_rejected(self):
        """Test TTS rejects empty text"""
        response = requests.post(
            f"{BASE_URL}/api/dictation/generate",
            headers={
                "Authorization": f"Bearer {TEST_SESSION_TOKEN}",
                "Content-Type": "application/json"
            },
            json={"text": "", "language": "en-GB"}
        )
        assert response.status_code == 400
        print("✓ TTS correctly rejects empty text")
    
    def test_tts_word_limit_enforced(self):
        """Test TTS enforces 200 word limit"""
        # Create text with 201 words
        long_text = " ".join(["word"] * 201)
        response = requests.post(
            f"{BASE_URL}/api/dictation/generate",
            headers={
                "Authorization": f"Bearer {TEST_SESSION_TOKEN}",
                "Content-Type": "application/json"
            },
            json={"text": long_text, "language": "en-GB"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "200 word" in data.get("detail", "").lower() or "limit" in data.get("detail", "").lower()
        print("✓ TTS correctly enforces 200 word limit")
    
    def test_tts_requires_auth(self):
        """Test TTS requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/dictation/generate",
            headers={"Content-Type": "application/json"},
            json={"text": "Test", "language": "en-GB"}
        )
        assert response.status_code == 401
        print("✓ TTS correctly requires authentication")


class TestNotesEndpoint:
    """Tests for Notes endpoint - POST /api/notes"""
    
    def test_create_note_success(self):
        """Test creating a note with title and content"""
        response = requests.post(
            f"{BASE_URL}/api/notes",
            headers={
                "Authorization": f"Bearer {TEST_SESSION_TOKEN}",
                "Content-Type": "application/json"
            },
            json={
                "title": "TEST_Note_Title",
                "content": "<p>This is <strong>bold</strong> and <em>italic</em> text.</p>"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "note_id" in data
        assert data["title"] == "TEST_Note_Title"
        assert "<strong>bold</strong>" in data["content"]
        assert "user_id" in data
        print(f"✓ Note created successfully - ID: {data['note_id']}")
        return data["note_id"]
    
    def test_get_notes(self):
        """Test getting all notes for user"""
        response = requests.get(
            f"{BASE_URL}/api/notes",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "notes" in data
        assert isinstance(data["notes"], list)
        print(f"✓ Get notes working - {len(data['notes'])} notes found")
    
    def test_create_note_requires_auth(self):
        """Test creating note requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/notes",
            headers={"Content-Type": "application/json"},
            json={"title": "Test", "content": "Test content"}
        )
        assert response.status_code == 401
        print("✓ Notes endpoint correctly requires authentication")
    
    def test_delete_note(self):
        """Test deleting a note"""
        # First create a note
        create_response = requests.post(
            f"{BASE_URL}/api/notes",
            headers={
                "Authorization": f"Bearer {TEST_SESSION_TOKEN}",
                "Content-Type": "application/json"
            },
            json={"title": "TEST_Delete_Note", "content": "To be deleted"}
        )
        assert create_response.status_code == 200
        note_id = create_response.json()["note_id"]
        
        # Delete the note
        delete_response = requests.delete(
            f"{BASE_URL}/api/notes/{note_id}",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        assert delete_response.status_code == 200
        print(f"✓ Note deleted successfully - ID: {note_id}")


class TestDictationsEndpoint:
    """Tests for Dictations save endpoint - POST /api/dictations"""
    
    def test_save_dictation(self):
        """Test saving a dictation record"""
        response = requests.post(
            f"{BASE_URL}/api/dictations",
            headers={
                "Authorization": f"Bearer {TEST_SESSION_TOKEN}",
                "Content-Type": "application/json"
            },
            json={
                "title": "TEST_Dictation",
                "text": "This is the dictation text",
                "language": "en-GB"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "dictation_id" in data
        assert data["title"] == "TEST_Dictation"
        assert data["language"] == "en-GB"
        print(f"✓ Dictation saved - ID: {data['dictation_id']}")
    
    def test_get_dictations(self):
        """Test getting all dictations"""
        response = requests.get(
            f"{BASE_URL}/api/dictations",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "dictations" in data
        print(f"✓ Get dictations working - {len(data['dictations'])} found")


# Cleanup fixture
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data():
    """Cleanup test data after all tests"""
    yield
    # Cleanup notes with TEST_ prefix
    try:
        response = requests.get(
            f"{BASE_URL}/api/notes",
            headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
        )
        if response.status_code == 200:
            notes = response.json().get("notes", [])
            for note in notes:
                if note.get("title", "").startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/notes/{note['note_id']}",
                        headers={"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
                    )
    except Exception as e:
        print(f"Cleanup warning: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
