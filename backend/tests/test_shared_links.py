"""
Test Shared Links Pipeline Feature - Iteration 11
Tests for:
- POST /api/links - create shared link (authenticated)
- GET /api/links/{code} - get link metadata (public, no auth)
- GET /api/links/{code}/download - download content, auto-expires after 1 download (public)
- POST /api/links/{code}/rate - rate resource 1-5 stars (public)
- GET /api/my-links - teacher's shared links (authenticated)
- DELETE /api/links/{code} - disable link (authenticated)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mi-learning-hub.preview.emergentagent.com')
TEST_SESSION_TOKEN = "test_session_tts_001"
TEST_NOTE_ID = "note_9e0545421e3a"
FREE_LINK_CODE = "qsg195s4"
PAID_LINK_CODE = "mrng6x4q"
EXPIRED_LINK_CODE = "kxy4ye9p"


class TestSharedLinksAuthenticated:
    """Tests for authenticated shared link endpoints"""
    
    @pytest.fixture
    def auth_headers(self):
        return {"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
    
    def test_create_shared_link_free(self, auth_headers):
        """Test creating a free shared link"""
        response = requests.post(
            f"{BASE_URL}/api/links",
            json={
                "resource_type": "note",
                "resource_id": TEST_NOTE_ID,
                "description": "Test free shared link",
                "is_paid": False,
                "price": 0
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "link_code" in data, "Response should contain link_code"
        assert data["resource_type"] == "note"
        assert data["resource_id"] == TEST_NOTE_ID
        assert data["is_paid"] == False
        assert data["status"] == "active"
        assert data["download_count"] == 0
        assert data["max_downloads"] == 1
        assert "teacher_name" in data
        assert "created_at" in data
        
        print(f"Created free link with code: {data['link_code']}")
        return data["link_code"]
    
    def test_create_shared_link_paid(self, auth_headers):
        """Test creating a paid shared link"""
        response = requests.post(
            f"{BASE_URL}/api/links",
            json={
                "resource_type": "note",
                "resource_id": TEST_NOTE_ID,
                "description": "Test paid shared link",
                "is_paid": True,
                "price": 5000
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["is_paid"] == True
        assert data["price"] == 5000
        assert data["status"] == "active"
        
        print(f"Created paid link with code: {data['link_code']}, price: TZS {data['price']}")
    
    def test_create_shared_link_invalid_resource_type(self, auth_headers):
        """Test creating link with invalid resource type returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/links",
            json={
                "resource_type": "invalid_type",
                "resource_id": "some_id",
                "is_paid": False
            },
            headers=auth_headers
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid resource_type, got {response.status_code}"
    
    def test_create_shared_link_missing_resource_id(self, auth_headers):
        """Test creating link without resource_id returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/links",
            json={
                "resource_type": "note",
                "is_paid": False
            },
            headers=auth_headers
        )
        
        assert response.status_code == 400, f"Expected 400 for missing resource_id, got {response.status_code}"
    
    def test_create_shared_link_nonexistent_resource(self, auth_headers):
        """Test creating link for non-existent resource returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/links",
            json={
                "resource_type": "note",
                "resource_id": "nonexistent_note_id_12345",
                "is_paid": False
            },
            headers=auth_headers
        )
        
        assert response.status_code == 404, f"Expected 404 for non-existent resource, got {response.status_code}"
    
    def test_create_shared_link_unauthenticated(self):
        """Test creating link without auth returns 401"""
        response = requests.post(
            f"{BASE_URL}/api/links",
            json={
                "resource_type": "note",
                "resource_id": TEST_NOTE_ID,
                "is_paid": False
            }
        )
        
        assert response.status_code == 401, f"Expected 401 for unauthenticated request, got {response.status_code}"
    
    def test_get_my_links(self, auth_headers):
        """Test getting teacher's shared links"""
        response = requests.get(
            f"{BASE_URL}/api/my-links",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "links" in data, "Response should contain 'links' array"
        assert isinstance(data["links"], list)
        
        if len(data["links"]) > 0:
            link = data["links"][0]
            assert "link_code" in link
            assert "resource_type" in link
            assert "status" in link
            assert "download_count" in link
            print(f"Found {len(data['links'])} shared links for teacher")
    
    def test_get_my_links_unauthenticated(self):
        """Test getting my links without auth returns 401"""
        response = requests.get(f"{BASE_URL}/api/my-links")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_disable_shared_link(self, auth_headers):
        """Test disabling a shared link"""
        # First create a link to disable
        create_response = requests.post(
            f"{BASE_URL}/api/links",
            json={
                "resource_type": "note",
                "resource_id": TEST_NOTE_ID,
                "description": "Link to be disabled",
                "is_paid": False
            },
            headers=auth_headers
        )
        
        assert create_response.status_code == 200
        link_code = create_response.json()["link_code"]
        
        # Now disable it
        delete_response = requests.delete(
            f"{BASE_URL}/api/links/{link_code}",
            headers=auth_headers
        )
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        
        # Verify it's disabled by fetching it
        get_response = requests.get(f"{BASE_URL}/api/links/{link_code}")
        assert get_response.status_code == 200
        link_data = get_response.json()
        assert link_data["link"]["status"] == "disabled", "Link should be disabled"
        assert link_data["expired"] == True, "Disabled link should show as expired"
        
        print(f"Successfully disabled link: {link_code}")
    
    def test_disable_nonexistent_link(self, auth_headers):
        """Test disabling non-existent link returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/links/nonexistent_code_12345",
            headers=auth_headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestSharedLinksPublic:
    """Tests for public (no auth) shared link endpoints"""
    
    def test_get_shared_link_metadata_free(self):
        """Test getting metadata for a free shared link (no auth required)"""
        response = requests.get(f"{BASE_URL}/api/links/{FREE_LINK_CODE}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "link" in data, "Response should contain 'link' object"
        assert "preview" in data, "Response should contain 'preview' object"
        assert "expired" in data, "Response should contain 'expired' boolean"
        
        link = data["link"]
        assert "link_code" in link
        assert "title" in link
        assert "teacher_name" in link
        assert "resource_type" in link
        assert "status" in link
        
        print(f"Free link metadata: title='{link['title']}', type={link['resource_type']}, status={link['status']}")
    
    def test_get_shared_link_metadata_paid(self):
        """Test getting metadata for a paid shared link"""
        response = requests.get(f"{BASE_URL}/api/links/{PAID_LINK_CODE}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        link = data["link"]
        assert link["is_paid"] == True, "Link should be marked as paid"
        assert link["price"] > 0, "Paid link should have price > 0"
        
        print(f"Paid link: price=TZS {link['price']}, status={link['status']}")
    
    def test_get_shared_link_metadata_expired(self):
        """Test getting metadata for an expired shared link"""
        response = requests.get(f"{BASE_URL}/api/links/{EXPIRED_LINK_CODE}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Expired links should still return metadata but with expired=True
        assert data["expired"] == True or data["link"]["status"] != "active", "Link should be expired or not active"
        
        print(f"Expired link status: {data['link']['status']}, expired={data['expired']}")
    
    def test_get_shared_link_not_found(self):
        """Test getting non-existent link returns 404"""
        response = requests.get(f"{BASE_URL}/api/links/nonexistent_code_xyz")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_rate_shared_link(self):
        """Test rating a shared link (no auth required)"""
        response = requests.post(
            f"{BASE_URL}/api/links/{FREE_LINK_CODE}/rate",
            json={
                "score": 5,
                "comment": "Great resource!"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "message" in data
        assert "avg_rating" in data
        assert "total_ratings" in data
        assert data["avg_rating"] >= 1 and data["avg_rating"] <= 5
        
        print(f"Rating submitted: avg={data['avg_rating']}, total={data['total_ratings']}")
    
    def test_rate_shared_link_invalid_score(self):
        """Test rating with invalid score returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/links/{FREE_LINK_CODE}/rate",
            json={
                "score": 10,  # Invalid - should be 1-5
                "comment": "Test"
            }
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid score, got {response.status_code}"
    
    def test_rate_shared_link_missing_score(self):
        """Test rating without score returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/links/{FREE_LINK_CODE}/rate",
            json={
                "comment": "No score provided"
            }
        )
        
        assert response.status_code == 400, f"Expected 400 for missing score, got {response.status_code}"
    
    def test_rate_nonexistent_link(self):
        """Test rating non-existent link returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/links/nonexistent_code_xyz/rate",
            json={"score": 5}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestSharedLinksDownload:
    """Tests for download functionality with auto-expiry"""
    
    @pytest.fixture
    def auth_headers(self):
        return {"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
    
    def test_download_shared_link_and_auto_expire(self, auth_headers):
        """Test downloading a shared link auto-expires it after 1 download"""
        # First create a fresh link
        create_response = requests.post(
            f"{BASE_URL}/api/links",
            json={
                "resource_type": "note",
                "resource_id": TEST_NOTE_ID,
                "description": "Link for download test",
                "is_paid": False
            },
            headers=auth_headers
        )
        
        assert create_response.status_code == 200
        link_code = create_response.json()["link_code"]
        
        # Verify link is active
        get_response = requests.get(f"{BASE_URL}/api/links/{link_code}")
        assert get_response.status_code == 200
        assert get_response.json()["link"]["status"] == "active"
        assert get_response.json()["link"]["download_count"] == 0
        
        # Download the resource (no auth required)
        download_response = requests.get(f"{BASE_URL}/api/links/{link_code}/download")
        
        assert download_response.status_code == 200, f"Expected 200, got {download_response.status_code}"
        assert len(download_response.content) > 0, "Download should return content"
        
        # Check Content-Disposition header
        content_disposition = download_response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disposition, "Should have attachment disposition"
        
        print(f"Downloaded content size: {len(download_response.content)} bytes")
        
        # Verify link is now expired
        get_response_after = requests.get(f"{BASE_URL}/api/links/{link_code}")
        assert get_response_after.status_code == 200
        link_after = get_response_after.json()["link"]
        assert link_after["status"] == "expired", f"Link should be expired after download, got {link_after['status']}"
        assert link_after["download_count"] == 1, "Download count should be 1"
        
        print(f"Link {link_code} auto-expired after download")
    
    def test_download_expired_link_returns_410(self, auth_headers):
        """Test downloading an already expired link returns 410 Gone"""
        # Create and download a link to expire it
        create_response = requests.post(
            f"{BASE_URL}/api/links",
            json={
                "resource_type": "note",
                "resource_id": TEST_NOTE_ID,
                "description": "Link to expire",
                "is_paid": False
            },
            headers=auth_headers
        )
        
        assert create_response.status_code == 200
        link_code = create_response.json()["link_code"]
        
        # First download (should succeed)
        first_download = requests.get(f"{BASE_URL}/api/links/{link_code}/download")
        assert first_download.status_code == 200
        
        # Second download (should fail with 410)
        second_download = requests.get(f"{BASE_URL}/api/links/{link_code}/download")
        assert second_download.status_code == 410, f"Expected 410 for expired link, got {second_download.status_code}"
        
        print(f"Correctly returned 410 for expired link: {link_code}")
    
    def test_download_nonexistent_link_returns_404(self):
        """Test downloading non-existent link returns 404"""
        response = requests.get(f"{BASE_URL}/api/links/nonexistent_code_xyz/download")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestSharedLinksResourceTypes:
    """Test creating shared links for different resource types"""
    
    @pytest.fixture
    def auth_headers(self):
        return {"Authorization": f"Bearer {TEST_SESSION_TOKEN}"}
    
    def test_create_link_for_lesson(self, auth_headers):
        """Test creating shared link for a lesson plan"""
        # First get a lesson ID
        lessons_response = requests.get(f"{BASE_URL}/api/lessons", headers=auth_headers)
        if lessons_response.status_code == 200 and lessons_response.json().get("lessons"):
            lesson_id = lessons_response.json()["lessons"][0]["lesson_id"]
            
            response = requests.post(
                f"{BASE_URL}/api/links",
                json={
                    "resource_type": "lesson",
                    "resource_id": lesson_id,
                    "description": "Shared lesson plan",
                    "is_paid": False
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            assert response.json()["resource_type"] == "lesson"
            print(f"Created shared link for lesson: {lesson_id}")
        else:
            pytest.skip("No lessons available to test")
    
    def test_create_link_for_scheme(self, auth_headers):
        """Test creating shared link for a scheme of work"""
        # First get a scheme ID
        schemes_response = requests.get(f"{BASE_URL}/api/schemes", headers=auth_headers)
        if schemes_response.status_code == 200 and schemes_response.json().get("schemes"):
            scheme_id = schemes_response.json()["schemes"][0]["scheme_id"]
            
            response = requests.post(
                f"{BASE_URL}/api/links",
                json={
                    "resource_type": "scheme",
                    "resource_id": scheme_id,
                    "description": "Shared scheme of work",
                    "is_paid": False
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            assert response.json()["resource_type"] == "scheme"
            print(f"Created shared link for scheme: {scheme_id}")
        else:
            pytest.skip("No schemes available to test")
    
    def test_create_link_for_dictation(self, auth_headers):
        """Test creating shared link for a dictation"""
        # First get a dictation ID
        dictations_response = requests.get(f"{BASE_URL}/api/dictations", headers=auth_headers)
        if dictations_response.status_code == 200 and dictations_response.json().get("dictations"):
            dictation_id = dictations_response.json()["dictations"][0]["dictation_id"]
            
            response = requests.post(
                f"{BASE_URL}/api/links",
                json={
                    "resource_type": "dictation",
                    "resource_id": dictation_id,
                    "description": "Shared dictation",
                    "is_paid": False
                },
                headers=auth_headers
            )
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            assert response.json()["resource_type"] == "dictation"
            print(f"Created shared link for dictation: {dictation_id}")
        else:
            pytest.skip("No dictations available to test")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
