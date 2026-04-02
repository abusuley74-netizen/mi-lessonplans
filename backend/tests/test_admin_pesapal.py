"""
Test Admin Login and PesaPal Subscription APIs
- Admin login with email/password
- Subscription plans endpoint
- PesaPal checkout endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminLogin:
    """Admin authentication endpoint tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"email": "admin@milessonplan.com", "password": "password"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "admin" in data, "Response should contain 'admin' key"
        assert "session_token" in data, "Response should contain 'session_token' key"
        assert data["admin"]["email"] == "admin@milessonplan.com"
        assert data["admin"]["role"] == "super_admin"
        assert data["message"] == "Admin login successful"
        print(f"✓ Admin login successful: {data['admin']['name']}")
    
    def test_admin_login_redjohn(self):
        """Test admin login with RedJohn credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"email": "RedJohn@admin.com", "password": "1993redjohn"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["admin"]["email"] == "RedJohn@admin.com"
        assert data["admin"]["role"] == "super_admin"
        print(f"✓ RedJohn admin login successful")
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"email": "wrong@admin.com", "password": "wrongpassword"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected")
    
    def test_admin_login_missing_fields(self):
        """Test admin login with missing fields"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"email": "admin@milessonplan.com"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Missing password correctly rejected")
    
    def test_admin_dashboard_navigation(self):
        """Test admin dashboard navigation endpoint"""
        # First login to get session token
        login_response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"email": "admin@milessonplan.com", "password": "password"},
            headers={"Content-Type": "application/json"}
        )
        assert login_response.status_code == 200
        session_token = login_response.json()["session_token"]
        
        # Get navigation
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard/navigation",
            headers={"Authorization": f"Bearer {session_token}"},
            cookies={"admin_session_token": session_token}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "navigation" in data, "Response should contain 'navigation' key"
        assert len(data["navigation"]) > 0, "Navigation should have items"
        
        # Check that navigation items have icon field
        for item in data["navigation"]:
            assert "icon" in item, f"Navigation item should have 'icon' field: {item}"
            assert "name" in item, f"Navigation item should have 'name' field: {item}"
            assert "path" in item, f"Navigation item should have 'path' field: {item}"
        
        print(f"✓ Admin navigation has {len(data['navigation'])} items with icons")


class TestSubscriptionPlans:
    """Subscription plans endpoint tests"""
    
    def test_get_subscription_plans(self):
        """Test GET /api/subscription/plans returns 3 plans"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "plans" in data, "Response should contain 'plans' key"
        assert len(data["plans"]) == 3, f"Expected 3 plans, got {len(data['plans'])}"
        
        # Verify plan IDs
        plan_ids = [p["id"] for p in data["plans"]]
        assert "basic" in plan_ids, "Should have basic plan"
        assert "premium" in plan_ids, "Should have premium plan"
        assert "enterprise" in plan_ids, "Should have enterprise plan"
        
        # Verify TZS prices
        for plan in data["plans"]:
            assert plan["currency"] == "TZS", f"Plan {plan['id']} should use TZS currency"
            assert plan["price"] > 0, f"Plan {plan['id']} should have positive price"
        
        # Verify specific prices
        basic_plan = next(p for p in data["plans"] if p["id"] == "basic")
        premium_plan = next(p for p in data["plans"] if p["id"] == "premium")
        enterprise_plan = next(p for p in data["plans"] if p["id"] == "enterprise")
        
        assert basic_plan["price"] == 9999, f"Basic plan should be 9999 TZS, got {basic_plan['price']}"
        assert premium_plan["price"] == 19999, f"Premium plan should be 19999 TZS, got {premium_plan['price']}"
        assert enterprise_plan["price"] == 29999, f"Enterprise plan should be 29999 TZS, got {enterprise_plan['price']}"
        
        print(f"✓ Subscription plans: Basic={basic_plan['price']} TZS, Premium={premium_plan['price']} TZS, Enterprise={enterprise_plan['price']} TZS")


class TestPesaPalCheckout:
    """PesaPal checkout endpoint tests"""
    
    def test_checkout_requires_auth(self):
        """Test checkout endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/subscription/checkout",
            json={"plan_id": "basic"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Checkout correctly requires authentication")
    
    def test_checkout_basic_plan(self):
        """Test PesaPal checkout for basic plan with test session"""
        response = requests.post(
            f"{BASE_URL}/api/subscription/checkout",
            json={"plan_id": "basic"},
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer test_session_tts_001"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "checkout_url" in data, "Response should contain 'checkout_url'"
        assert data["checkout_url"].startswith("https://pay.pesapal.com"), \
            f"Checkout URL should start with https://pay.pesapal.com, got: {data['checkout_url'][:100]}"
        assert "merchant_reference" in data, "Response should contain 'merchant_reference'"
        
        print(f"✓ PesaPal checkout URL generated: {data['checkout_url'][:80]}...")
    
    def test_checkout_premium_plan(self):
        """Test PesaPal checkout for premium plan"""
        response = requests.post(
            f"{BASE_URL}/api/subscription/checkout",
            json={"plan_id": "premium"},
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer test_session_tts_001"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "checkout_url" in data
        assert data["checkout_url"].startswith("https://pay.pesapal.com")
        print(f"✓ Premium plan checkout URL generated")
    
    def test_checkout_enterprise_plan(self):
        """Test PesaPal checkout for enterprise plan"""
        response = requests.post(
            f"{BASE_URL}/api/subscription/checkout",
            json={"plan_id": "enterprise"},
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer test_session_tts_001"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "checkout_url" in data
        assert data["checkout_url"].startswith("https://pay.pesapal.com")
        print(f"✓ Enterprise plan checkout URL generated")
    
    def test_checkout_invalid_plan(self):
        """Test checkout with invalid plan ID"""
        response = requests.post(
            f"{BASE_URL}/api/subscription/checkout",
            json={"plan_id": "invalid_plan"},
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer test_session_tts_001"
            }
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Invalid plan correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
