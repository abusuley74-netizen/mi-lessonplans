"""
Test suite for Refer & Earn system
Tests:
- Teacher referral endpoints (my-code, my-referrals)
- Admin referral management endpoints (teacher-referrals, payout-schedule, payouts)
- Auth session with referral_code capture
- Subscription plans API (master not enterprise)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mi-learning-hub.preview.emergentagent.com')

# Test credentials
TEACHER_SESSION_TOKEN = "test_session_tts_001"
ADMIN_EMAIL = "admin@milessonplan.com"
ADMIN_PASSWORD = "password"


class TestTeacherReferralEndpoints:
    """Test teacher-side referral endpoints"""
    
    def test_get_my_referral_code(self):
        """GET /api/teacher/referral/my-code returns referral_code and referral_link"""
        response = requests.get(
            f"{BASE_URL}/api/teacher/referral/my-code",
            headers={"Authorization": f"Bearer {TEACHER_SESSION_TOKEN}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "referral_code" in data, "Response missing referral_code"
        assert "referral_link" in data, "Response missing referral_link"
        
        # Validate referral code format (ML + 6 chars)
        code = data["referral_code"]
        assert code.startswith("ML"), f"Referral code should start with 'ML', got: {code}"
        assert len(code) >= 8, f"Referral code too short: {code}"
        
        # Validate referral link contains the code
        link = data["referral_link"]
        assert f"ref={code}" in link, f"Referral link should contain ref={code}, got: {link}"
        assert "login" in link, f"Referral link should point to login page, got: {link}"
        
        print(f"✓ Teacher referral code: {code}")
        print(f"✓ Teacher referral link: {link}")
    
    def test_get_my_referrals(self):
        """GET /api/teacher/referral/my-referrals returns referrals array and stats"""
        response = requests.get(
            f"{BASE_URL}/api/teacher/referral/my-referrals",
            headers={"Authorization": f"Bearer {TEACHER_SESSION_TOKEN}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Check required fields
        assert "referrals" in data, "Response missing referrals array"
        assert "total_referrals" in data, "Response missing total_referrals"
        assert "total_earned" in data, "Response missing total_earned"
        assert "pending_payout" in data, "Response missing pending_payout"
        
        # Validate types
        assert isinstance(data["referrals"], list), "referrals should be a list"
        assert isinstance(data["total_referrals"], int), "total_referrals should be int"
        assert isinstance(data["total_earned"], (int, float)), "total_earned should be numeric"
        assert isinstance(data["pending_payout"], (int, float)), "pending_payout should be numeric"
        
        print(f"✓ Total referrals: {data['total_referrals']}")
        print(f"✓ Total earned: TZS {data['total_earned']}")
        print(f"✓ Pending payout: TZS {data['pending_payout']}")
        
        # If there are referrals, validate structure
        if data["referrals"]:
            ref = data["referrals"][0]
            assert "name" in ref, "Referral missing name"
            assert "email" in ref, "Referral missing email"
            assert "plan" in ref, "Referral missing plan"
            assert "commission_per_cycle" in ref, "Referral missing commission_per_cycle"
            print(f"✓ Sample referral: {ref['name']} ({ref['plan']}) - TZS {ref['commission_per_cycle']}/cycle")
    
    def test_referral_requires_auth(self):
        """Referral endpoints require authentication"""
        # Test without auth
        response = requests.get(f"{BASE_URL}/api/teacher/referral/my-code")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        
        response = requests.get(f"{BASE_URL}/api/teacher/referral/my-referrals")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        
        print("✓ Referral endpoints properly require authentication")


class TestAdminReferralEndpoints:
    """Test admin-side referral management endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin session token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return response.json().get("session_token")
    
    def test_admin_get_teacher_referrals(self, admin_token):
        """GET /api/admin/teacher-referrals returns referrers with referees and earnings"""
        response = requests.get(
            f"{BASE_URL}/api/admin/teacher-referrals",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Check required fields
        assert "referrers" in data, "Response missing referrers array"
        assert "payout_schedule" in data, "Response missing payout_schedule"
        
        # Validate types
        assert isinstance(data["referrers"], list), "referrers should be a list"
        assert data["payout_schedule"] in ["biweekly", "monthly"], f"Invalid payout_schedule: {data['payout_schedule']}"
        
        print(f"✓ Total referrers: {len(data['referrers'])}")
        print(f"✓ Payout schedule: {data['payout_schedule']}")
        
        # If there are referrers, validate structure
        if data["referrers"]:
            referrer = data["referrers"][0]
            assert "referrer" in referrer, "Missing referrer object"
            assert "referees" in referrer, "Missing referees array"
            assert "total_commission" in referrer, "Missing total_commission"
            assert "total_paid" in referrer, "Missing total_paid"
            assert "pending" in referrer, "Missing pending"
            assert "referee_count" in referrer, "Missing referee_count"
            
            print(f"✓ Sample referrer: {referrer['referrer'].get('name', 'Unknown')} with {referrer['referee_count']} referees")
            print(f"  Commission: TZS {referrer['total_commission']}, Paid: TZS {referrer['total_paid']}, Pending: TZS {referrer['pending']}")
    
    def test_admin_set_payout_schedule_biweekly(self, admin_token):
        """PUT /api/admin/referral-settings/payout-schedule accepts 'biweekly'"""
        response = requests.put(
            f"{BASE_URL}/api/admin/referral-settings/payout-schedule",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"schedule": "biweekly"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("schedule") == "biweekly", f"Expected schedule='biweekly', got: {data}"
        print("✓ Payout schedule set to biweekly")
    
    def test_admin_set_payout_schedule_monthly(self, admin_token):
        """PUT /api/admin/referral-settings/payout-schedule accepts 'monthly'"""
        response = requests.put(
            f"{BASE_URL}/api/admin/referral-settings/payout-schedule",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"schedule": "monthly"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("schedule") == "monthly", f"Expected schedule='monthly', got: {data}"
        print("✓ Payout schedule set to monthly")
    
    def test_admin_set_payout_schedule_invalid(self, admin_token):
        """PUT /api/admin/referral-settings/payout-schedule rejects invalid values"""
        response = requests.put(
            f"{BASE_URL}/api/admin/referral-settings/payout-schedule",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"schedule": "weekly"}
        )
        assert response.status_code == 400, f"Expected 400 for invalid schedule, got {response.status_code}"
        print("✓ Invalid payout schedule correctly rejected")
    
    def test_admin_record_payout(self, admin_token):
        """POST /api/admin/referral-payouts records a payout"""
        # First get a referrer to use
        referrers_response = requests.get(
            f"{BASE_URL}/api/admin/teacher-referrals",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        referrers = referrers_response.json().get("referrers", [])
        
        # Use test user ID if no referrers exist
        test_referrer_id = referrers[0]["referrer"]["user_id"] if referrers else "test-user-tts"
        
        response = requests.post(
            f"{BASE_URL}/api/admin/referral-payouts",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"referrer_id": test_referrer_id, "amount": 1000}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "payout" in data, "Response missing payout object"
        assert data["payout"]["referrer_id"] == test_referrer_id
        assert data["payout"]["amount"] == 1000
        assert "payout_id" in data["payout"]
        
        print(f"✓ Payout recorded: {data['payout']['payout_id']} for TZS 1000")
    
    def test_admin_record_payout_invalid(self, admin_token):
        """POST /api/admin/referral-payouts rejects invalid data"""
        # Missing referrer_id
        response = requests.post(
            f"{BASE_URL}/api/admin/referral-payouts",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"amount": 1000}
        )
        assert response.status_code == 400, f"Expected 400 for missing referrer_id, got {response.status_code}"
        
        # Zero amount
        response = requests.post(
            f"{BASE_URL}/api/admin/referral-payouts",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"referrer_id": "test-user", "amount": 0}
        )
        assert response.status_code == 400, f"Expected 400 for zero amount, got {response.status_code}"
        
        print("✓ Invalid payout data correctly rejected")
    
    def test_admin_get_payouts(self, admin_token):
        """GET /api/admin/referral-payouts returns payouts list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/referral-payouts",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "payouts" in data, "Response missing payouts array"
        assert isinstance(data["payouts"], list), "payouts should be a list"
        
        print(f"✓ Total payouts recorded: {len(data['payouts'])}")
        
        # Validate payout structure if any exist
        if data["payouts"]:
            payout = data["payouts"][0]
            assert "payout_id" in payout, "Payout missing payout_id"
            assert "referrer_id" in payout, "Payout missing referrer_id"
            assert "amount" in payout, "Payout missing amount"
            assert "created_at" in payout, "Payout missing created_at"
            print(f"✓ Sample payout: {payout['payout_id']} - TZS {payout['amount']}")
    
    def test_admin_referral_requires_auth(self):
        """Admin referral endpoints require authentication"""
        endpoints = [
            ("GET", "/api/admin/teacher-referrals"),
            ("PUT", "/api/admin/referral-settings/payout-schedule"),
            ("POST", "/api/admin/referral-payouts"),
            ("GET", "/api/admin/referral-payouts"),
        ]
        
        for method, endpoint in endpoints:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}")
            elif method == "PUT":
                response = requests.put(f"{BASE_URL}{endpoint}", json={})
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", json={})
            
            assert response.status_code == 401, f"Expected 401 for {method} {endpoint} without auth, got {response.status_code}"
        
        print("✓ All admin referral endpoints properly require authentication")


class TestAuthSessionWithReferral:
    """Test that auth/session accepts referral_code field"""
    
    def test_auth_session_accepts_referral_code(self):
        """POST /api/auth/session accepts referral_code field (won't create user without valid session_id)"""
        # This will fail auth but should not fail due to referral_code field
        response = requests.post(
            f"{BASE_URL}/api/auth/session",
            json={"session_id": "invalid_session", "referral_code": "ML123456"}
        )
        # Should fail with 401 (invalid session) not 400 (bad request)
        assert response.status_code in [401, 500], f"Expected 401/500 for invalid session, got {response.status_code}"
        print("✓ Auth session endpoint accepts referral_code field")


class TestSubscriptionPlans:
    """Test subscription plans API returns master (not enterprise)"""
    
    def test_plans_return_master_not_enterprise(self):
        """GET /api/subscription/plans returns master plan, not enterprise"""
        response = requests.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "plans" in data, "Response missing plans array"
        
        plan_ids = [p["id"] for p in data["plans"]]
        
        # Should have master, not enterprise
        assert "master" in plan_ids, f"Plans should include 'master', got: {plan_ids}"
        assert "enterprise" not in plan_ids, f"Plans should NOT include 'enterprise', got: {plan_ids}"
        
        # Verify all expected plans
        assert "basic" in plan_ids, f"Plans should include 'basic', got: {plan_ids}"
        assert "premium" in plan_ids, f"Plans should include 'premium', got: {plan_ids}"
        
        print(f"✓ Subscription plans: {plan_ids}")
        
        # Verify master plan details
        master_plan = next((p for p in data["plans"] if p["id"] == "master"), None)
        assert master_plan is not None, "Master plan not found"
        assert master_plan["price"] == 29999, f"Master plan price should be 29999, got: {master_plan['price']}"
        assert "Refer & Earn" in str(master_plan.get("features", [])), "Master plan should include Refer & Earn feature"
        
        print(f"✓ Master plan: TZS {master_plan['price']}/month with features: {master_plan.get('features', [])}")


class TestFeatureAccess:
    """Test feature access still works correctly"""
    
    def test_feature_access_returns_plan_and_features(self):
        """GET /api/user/feature-access returns plan, features, and lesson_usage"""
        response = requests.get(
            f"{BASE_URL}/api/user/feature-access",
            headers={"Authorization": f"Bearer {TEACHER_SESSION_TOKEN}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Check required fields
        assert "plan" in data, "Response missing plan"
        assert "features" in data, "Response missing features"
        assert "lesson_usage" in data, "Response missing lesson_usage"
        
        # Validate types
        assert isinstance(data["features"], list), "features should be a list"
        assert isinstance(data["lesson_usage"], dict), "lesson_usage should be a dict"
        
        # Validate lesson_usage structure
        usage = data["lesson_usage"]
        assert "used" in usage, "lesson_usage missing 'used'"
        assert "limit" in usage, "lesson_usage missing 'limit'"
        
        print(f"✓ User plan: {data['plan']}")
        print(f"✓ Features: {data['features']}")
        print(f"✓ Lesson usage: {usage['used']}/{usage['limit'] or 'unlimited'}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
