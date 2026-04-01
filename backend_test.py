import requests
import sys
import json
from datetime import datetime, timezone, timedelta
import uuid

class MiLessonAPITester:
    def __init__(self, base_url="https://mi-learning-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success:
                try:
                    response_data = response.json()
                    details += f", Response: {json.dumps(response_data, indent=2)[:200]}..."
                except:
                    details += f", Response: {response.text[:100]}..."
            else:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Error: {response.text[:100]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_endpoint(self):
        """Test health endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )

    def test_subscription_plans(self):
        """Test subscription plans endpoint"""
        return self.run_test(
            "Subscription Plans",
            "GET", 
            "api/subscription/plans",
            200
        )

    def create_test_session(self):
        """Create a test session using MongoDB directly"""
        print("\n🔧 Creating test session...")
        
        # Generate test data
        self.user_id = f"test_user_{uuid.uuid4().hex[:12]}"
        self.session_token = f"test_session_{uuid.uuid4().hex[:16]}"
        test_email = f"test.user.{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
        
        # MongoDB commands to create test user and session
        mongo_commands = f"""
mongosh --eval "
use('test_database');
var userId = '{self.user_id}';
var sessionToken = '{self.session_token}';
var email = '{test_email}';

// Create test user
db.users.insertOne({{
  user_id: userId,
  email: email,
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  subscription_status: 'free',  subscription_plan: 'free',  subscription_expires: null,
  created_at: new Date().toISOString()
}});

// Create test session
db.user_sessions.insertOne({{
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  created_at: new Date().toISOString()
}});

print('Test user and session created successfully');
print('User ID: ' + userId);
print('Session Token: ' + sessionToken);
"
"""
        
        import subprocess
        try:
            result = subprocess.run(mongo_commands, shell=True, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                print(f"✅ Test session created - User ID: {self.user_id}")
                print(f"   Session Token: {self.session_token}")
                return True
            else:
                print(f"❌ Failed to create test session: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Exception creating test session: {e}")
            return False

    def test_auth_session_endpoint(self):
        """Test auth session endpoint exists (without actual Emergent auth)"""
        # This endpoint requires session_id from Emergent Auth, so we test it exists
        success, response = self.run_test(
            "Auth Session Endpoint (Structure Check)",
            "POST",
            "api/auth/session",
            400,  # Expect 400 because we're not providing session_id
            data={}
        )
        # 400 is expected since we don't have valid session_id
        return success

    def test_auth_me_requires_auth(self):
        """Test that /api/auth/me requires authentication"""
        # Save current token
        saved_token = self.session_token
        
        # First test without auth - should fail
        self.session_token = None
        success_no_auth, _ = self.run_test(
            "Auth Me (No Auth - Should Fail)",
            "GET",
            "api/auth/me",
            401
        )
        
        # Restore token and test with auth - should succeed
        self.session_token = saved_token
        if self.session_token:
            success_with_auth, _ = self.run_test(
                "Auth Me (With Auth - Should Succeed)",
                "GET",
                "api/auth/me",
                200
            )
            return success_no_auth and success_with_auth
        
        return success_no_auth

    def test_lessons_generate_requires_auth(self):
        """Test that lesson generation requires auth"""
        # Save current token
        saved_token = self.session_token
        
        # Test without auth - should fail
        self.session_token = None
        success_no_auth, _ = self.run_test(
            "Lesson Generate (No Auth - Should Fail)",
            "POST",
            "api/lessons/generate",
            401,
            data={
                "syllabus": "Tanzania Mainland",
                "subject": "Mathematics",
                "grade": "Form 1",
                "topic": "Basic Algebra"
            }
        )
        
        # Restore token and test with auth - should succeed
        self.session_token = saved_token
        if self.session_token:
            success_with_auth, response = self.run_test(
                "Lesson Generate (With Auth - Should Succeed)",
                "POST",
                "api/lessons/generate",
                200,
                data={
                    "syllabus": "Tanzania Mainland",
                    "subject": "Mathematics", 
                    "grade": "Form 1",
                    "topic": "Basic Algebra"
                }
            )
            return success_no_auth and success_with_auth
        
        return success_no_auth

    def test_lessons_list_requires_auth(self):
        """Test that lessons list requires auth"""
        # Save current token
        saved_token = self.session_token
        
        # Test without auth - should fail
        self.session_token = None
        success_no_auth, _ = self.run_test(
            "Lessons List (No Auth - Should Fail)",
            "GET",
            "api/lessons",
            401
        )
        
        # Restore token and test with auth - should succeed
        self.session_token = saved_token
        if self.session_token:
            success_with_auth, _ = self.run_test(
                "Lessons List (With Auth - Should Succeed)",
                "GET",
                "api/lessons",
                200
            )
            return success_no_auth and success_with_auth
        
        return success_no_auth

    def test_mocked_subscription(self):
        """Test mocked subscription endpoint"""
        if not self.session_token:
            print("⚠️  Skipping subscription test - no auth session")
            return False
            
        return self.run_test(
            "Mocked Subscription",
            "POST",
            "api/subscription/subscribe",
            200,
            data={"plan_id": "monthly"}
        )[0]

    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        print("\n🧹 Cleaning up test data...")
        
        cleanup_commands = f"""
mongosh --eval "
use('test_database');
db.users.deleteMany({{user_id: '{self.user_id}'}});
db.user_sessions.deleteMany({{session_token: '{self.session_token}'}});
db.lesson_plans.deleteMany({{user_id: '{self.user_id}'}});
print('Test data cleaned up');
"
"""
        
        import subprocess
        try:
            subprocess.run(cleanup_commands, shell=True, capture_output=True, text=True, timeout=30)
            print("✅ Test data cleaned up")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {e}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting MiLesson Plan API Tests")
        print(f"   Base URL: {self.base_url}")
        print("=" * 60)

        # Test public endpoints first
        self.test_health_endpoint()
        self.test_subscription_plans()
        self.test_auth_session_endpoint()
        
        # Test auth requirements (without session)
        self.test_auth_me_requires_auth()
        self.test_lessons_generate_requires_auth()
        self.test_lessons_list_requires_auth()
        
        # Create test session for authenticated tests
        if self.create_test_session():
            # Test authenticated endpoints
            self.test_auth_me_requires_auth()
            self.test_lessons_generate_requires_auth()
            self.test_lessons_list_requires_auth()
            self.test_mocked_subscription()
            
            # Cleanup
            self.cleanup_test_data()
        else:
            print("⚠️  Skipping authenticated tests - could not create test session")

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed")
            return 1

def main():
    tester = MiLessonAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())