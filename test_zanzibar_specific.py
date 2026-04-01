import requests
import json
import uuid
import subprocess
from datetime import datetime

class ZanzibarSpecificTester:
    def __init__(self, base_url="https://mi-learning-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None

    def create_test_session(self):
        """Create a test session using MongoDB directly"""
        print("🔧 Creating test session for Zanzibar testing...")
        
        # Generate test data
        self.user_id = f"test_user_{uuid.uuid4().hex[:12]}"
        self.session_token = f"test_session_zanzibar_001"
        test_email = f"zanzibar.test.{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
        
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
  name: 'Zanzibar Test User',
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

print('Zanzibar test user and session created successfully');
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

    def test_zanzibar_lesson_generation(self):
        """Test Zanzibar lesson generation with specific focus on empty teacherEvaluation and remarks"""
        print("\n🔍 Testing Zanzibar lesson generation...")
        
        url = f"{self.base_url}/api/lessons/generate"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }
        
        data = {
            "syllabus": "Zanzibar",
            "subject": "english",
            "grade": "Standard 1",
            "topic": "Introduction to English Letters",
            "form_data": {}
        }
        
        try:
            response = requests.post(url, json=data, headers=headers, timeout=60)
            
            if response.status_code == 200:
                lesson_data = response.json()
                content = lesson_data.get('content', {})
                
                print("✅ Lesson generation successful")
                print(f"   Lesson ID: {lesson_data.get('lesson_id')}")
                print(f"   Topic: {lesson_data.get('topic')}")
                print(f"   Syllabus: {lesson_data.get('syllabus')}")
                
                # Check specific requirements
                teacher_evaluation = content.get('teacherEvaluation', 'NOT_FOUND')
                remarks = content.get('remarks', 'NOT_FOUND')
                
                print(f"\n📋 Checking required empty fields:")
                print(f"   teacherEvaluation: '{teacher_evaluation}'")
                print(f"   remarks: '{remarks}'")
                
                # Verify they are empty strings
                teacher_eval_empty = teacher_evaluation == ""
                remarks_empty = remarks == ""
                
                if teacher_eval_empty and remarks_empty:
                    print("✅ REQUIREMENT MET: Both teacherEvaluation and remarks are empty strings")
                    return True, lesson_data
                else:
                    print("❌ REQUIREMENT NOT MET: teacherEvaluation and/or remarks are not empty")
                    return False, lesson_data
                    
            else:
                print(f"❌ Lesson generation failed - Status: {response.status_code}")
                print(f"   Error: {response.text}")
                return False, {}
                
        except Exception as e:
            print(f"❌ Exception during lesson generation: {e}")
            return False, {}

    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        print("\n🧹 Cleaning up Zanzibar test data...")
        
        cleanup_commands = f"""
mongosh --eval "
use('test_database');
db.users.deleteMany({{user_id: '{self.user_id}'}});
db.user_sessions.deleteMany({{session_token: '{self.session_token}'}});
db.lesson_plans.deleteMany({{user_id: '{self.user_id}'}});
print('Zanzibar test data cleaned up');
"
"""
        
        try:
            subprocess.run(cleanup_commands, shell=True, capture_output=True, text=True, timeout=30)
            print("✅ Test data cleaned up")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {e}")

    def run_test(self):
        """Run the Zanzibar specific test"""
        print("🚀 Starting Zanzibar Specific Tests")
        print("=" * 50)
        
        if not self.create_test_session():
            print("❌ Could not create test session")
            return False
            
        success, lesson_data = self.test_zanzibar_lesson_generation()
        
        self.cleanup_test_data()
        
        return success

def main():
    tester = ZanzibarSpecificTester()
    success = tester.run_test()
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())