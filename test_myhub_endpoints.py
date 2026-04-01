import requests
import sys
import json
from datetime import datetime, timezone, timedelta
import uuid
import subprocess

class MyHubEndpointTester:
    def __init__(self, base_url="https://mi-learning-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'

        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success:
                try:
                    response_data = response.json()
                    details += f", Response keys: {list(response_data.keys())}"
                except:
                    details += f", Response: {response.text[:100]}..."
            else:
                details += f", Expected: {expected_status}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def create_test_session(self):
        """Create a test session using MongoDB directly"""
        print("\n🔧 Creating test session...")
        
        self.user_id = f"test_user_{uuid.uuid4().hex[:12]}"
        self.session_token = f"test_session_{uuid.uuid4().hex[:16]}"
        test_email = f"test.user.{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
        
        mongo_commands = f"""
mongosh --eval "
use('test_database');
var userId = '{self.user_id}';
var sessionToken = '{self.session_token}';
var email = '{test_email}';

db.users.insertOne({{
  user_id: userId,
  email: email,
  name: 'Test User',
  picture: 'https://via.placeholder.com/150',
  subscription_status: 'free',
  subscription_expires: null,
  created_at: new Date().toISOString()
}});

db.user_sessions.insertOne({{
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  created_at: new Date().toISOString()
}});

print('Test session created');
"
"""
        
        try:
            result = subprocess.run(mongo_commands, shell=True, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                print(f"✅ Test session created - User ID: {self.user_id}")
                return True
            else:
                print(f"❌ Failed to create test session: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Exception creating test session: {e}")
            return False

    def test_notes_endpoints(self):
        """Test notes endpoints"""
        # Test GET /api/notes
        success_get, response = self.run_test(
            "GET /api/notes",
            "GET",
            "api/notes",
            200
        )
        
        # Test POST /api/notes
        success_post, response = self.run_test(
            "POST /api/notes",
            "POST",
            "api/notes",
            200,
            data={
                "title": "Test Note",
                "content": "<p>This is a test note content</p>",
                "created_at": datetime.now().isoformat()
            }
        )
        
        return success_get and success_post

    def test_dictations_endpoints(self):
        """Test dictations endpoints"""
        # Test GET /api/dictations
        success_get, response = self.run_test(
            "GET /api/dictations",
            "GET",
            "api/dictations",
            200
        )
        
        # Test POST /api/dictations
        success_post, response = self.run_test(
            "POST /api/dictations",
            "POST",
            "api/dictations",
            200,
            data={
                "title": "Test Dictation",
                "text": "This is a test dictation text",
                "language": "en-GB",
                "created_at": datetime.now().isoformat()
            }
        )
        
        # Test POST /api/dictation/generate (mocked)
        success_generate, response = self.run_test(
            "POST /api/dictation/generate (Mocked TTS)",
            "POST",
            "api/dictation/generate",
            200,
            data={
                "text": "Hello world, this is a test",
                "language": "en-GB"
            }
        )
        
        return success_get and success_post and success_generate

    def test_uploads_endpoints(self):
        """Test uploads endpoints"""
        # Test GET /api/uploads
        success_get, response = self.run_test(
            "GET /api/uploads",
            "GET",
            "api/uploads",
            200
        )
        
        return success_get

    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        print("\n🧹 Cleaning up test data...")
        
        cleanup_commands = f"""
mongosh --eval "
use('test_database');
db.users.deleteMany({{user_id: '{self.user_id}'}});
db.user_sessions.deleteMany({{session_token: '{self.session_token}'}});
db.notes.deleteMany({{user_id: '{self.user_id}'}});
db.dictations.deleteMany({{user_id: '{self.user_id}'}});
db.uploads.deleteMany({{user_id: '{self.user_id}'}});
print('Test data cleaned up');
"
"""
        
        try:
            subprocess.run(cleanup_commands, shell=True, capture_output=True, text=True, timeout=30)
            print("✅ Test data cleaned up")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {e}")

    def run_all_tests(self):
        """Run all MyHub endpoint tests"""
        print("🚀 Starting MyHub Endpoint Tests")
        print(f"   Base URL: {self.base_url}")
        print("=" * 60)

        if not self.create_test_session():
            print("❌ Could not create test session, aborting tests")
            return 1

        # Test MyHub specific endpoints
        self.test_notes_endpoints()
        self.test_dictations_endpoints()
        self.test_uploads_endpoints()
        
        # Cleanup
        self.cleanup_test_data()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All MyHub endpoint tests passed!")
            return 0
        else:
            print("❌ Some MyHub endpoint tests failed")
            return 1

def main():
    tester = MyHubEndpointTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())