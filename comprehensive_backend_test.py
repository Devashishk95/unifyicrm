import requests
import sys
from datetime import datetime
import json
import uuid

class UnifyComprehensiveAPITester:
    def __init__(self, base_url="https://admit-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.super_admin_token = None
        self.university_admin_token = None
        self.counsellor_token = None
        self.student_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Test data
        self.university_id = None
        self.university_admin_id = None
        self.counsellor_id = None
        self.lead_id = None
        self.student_id = None
        self.application_id = None
        
        # Generate unique identifiers for this test run
        self.test_suffix = str(uuid.uuid4())[:8]

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        # Use specific token if provided, otherwise use super admin token
        auth_token = token or self.super_admin_token
        if auth_token:
            test_headers['Authorization'] = f'Bearer {auth_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=15)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=15)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:300]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_super_admin_login(self):
        """Test super admin login"""
        success, response = self.run_test(
            "Super Admin Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": "admin@unify.com",
                "password": "9939350820@#!",
                "role": "super_admin"
            }
        )
        if success and 'access_token' in response:
            self.super_admin_token = response['access_token']
            print(f"   Super Admin Token obtained")
            return True
        return False

    def test_super_admin_dashboard(self):
        """Test super admin dashboard with stats"""
        success, response = self.run_test(
            "Super Admin Dashboard Stats",
            "GET",
            "superadmin/dashboard",
            200
        )
        if success:
            print(f"   Universities: {response.get('universities', {}).get('total', 0)}")
            print(f"   Students: {response.get('students', 0)}")
            print(f"   Leads: {response.get('leads', 0)}")
            print(f"   Applications: {response.get('applications', 0)}")
        return success

    def test_create_university(self):
        """Create a new university via Super Admin"""
        university_data = {
            "name": f"Test University {self.test_suffix}",
            "code": f"TEST{self.test_suffix.upper()}",
            "email": f"admin-{self.test_suffix}@testuni.edu",
            "phone": "+1234567890",
            "address": "123 Test Street, Test City",
            "website": "https://testuni.edu",
            "subscription_plan": "basic"
        }
        
        success, response = self.run_test(
            "Create New University",
            "POST",
            "superadmin/universities",
            200,
            data=university_data
        )
        
        if success:
            self.university_id = response.get('id')
            print(f"   University ID: {self.university_id}")
            return True
        return False

    def test_create_university_admin(self):
        """Create University Admin user via API"""
        if not self.university_id:
            print("❌ Skipping - no university ID")
            return False
            
        admin_data = {
            "name": f"University Admin {self.test_suffix}",
            "email": f"uniadmin-{self.test_suffix}@testuni.edu",
            "phone": "+1234567891",
            "person_id": f"ADMIN{self.test_suffix}",
            "password": "AdminPass123!",
            "role": "university_admin"
        }
        
        success, response = self.run_test(
            "Create University Admin User",
            "POST",
            "university/staff",
            200,
            data=admin_data
        )
        
        if success:
            self.university_admin_id = response.get('id')
            print(f"   University Admin ID: {self.university_admin_id}")
            return True
        return False

    def test_university_admin_login(self):
        """Test University Admin login with university_id + person_id"""
        if not self.university_id:
            print("❌ Skipping - no university ID")
            return False
            
        success, response = self.run_test(
            "University Admin Login",
            "POST",
            "auth/login",
            200,
            data={
                "university_id": self.university_id,
                "person_id": f"ADMIN{self.test_suffix}",
                "password": "AdminPass123!",
                "role": "university_admin"
            }
        )
        
        if success and 'access_token' in response:
            self.university_admin_token = response['access_token']
            print(f"   University Admin Token obtained")
            return True
        return False

    def test_registration_config(self):
        """Test Registration Configuration page functionality"""
        if not self.university_admin_token:
            print("❌ Skipping - no university admin token")
            return False
            
        # Get current config
        success1, response1 = self.run_test(
            "Get Registration Config",
            "GET",
            "university/config",
            200,
            token=self.university_admin_token
        )
        
        if not success1:
            return False
            
        # Update config - enable/disable steps
        config_update = {
            "educational_details_enabled": True,
            "documents_enabled": True,
            "entrance_test_enabled": False,
            "fee_enabled": True,
            "fee_amount": 1000.0,
            "payment_stage": "after_application",
            "refund_allowed": True
        }
        
        success2, response2 = self.run_test(
            "Update Registration Config",
            "PUT",
            "university/config/registration",
            200,
            data=config_update,
            token=self.university_admin_token
        )
        
        return success1 and success2

    def test_create_counsellor(self):
        """Test Staff Management - create counsellor"""
        if not self.university_admin_token:
            print("❌ Skipping - no university admin token")
            return False
            
        counsellor_data = {
            "name": f"Test Counsellor {self.test_suffix}",
            "email": f"counsellor-{self.test_suffix}@testuni.edu",
            "phone": "+1234567892",
            "person_id": f"COUNS{self.test_suffix}",
            "password": "CounsPass123!",
            "role": "counsellor"
        }
        
        success, response = self.run_test(
            "Create Counsellor",
            "POST",
            "university/staff",
            200,
            data=counsellor_data,
            token=self.university_admin_token
        )
        
        if success:
            self.counsellor_id = response.get('id')
            print(f"   Counsellor ID: {self.counsellor_id}")
            return True
        return False

    def test_counsellor_login(self):
        """Test counsellor login"""
        if not self.university_id:
            print("❌ Skipping - no university ID")
            return False
            
        success, response = self.run_test(
            "Counsellor Login",
            "POST",
            "auth/login",
            200,
            data={
                "university_id": self.university_id,
                "person_id": f"COUNS{self.test_suffix}",
                "password": "CounsPass123!",
                "role": "counsellor"
            }
        )
        
        if success and 'access_token' in response:
            self.counsellor_token = response['access_token']
            print(f"   Counsellor Token obtained")
            return True
        return False

    def test_create_lead(self):
        """Test Lead Management - create lead"""
        if not self.counsellor_token:
            print("❌ Skipping - no counsellor token")
            return False
            
        lead_data = {
            "name": f"Test Lead {self.test_suffix}",
            "email": f"lead-{self.test_suffix}@example.com",
            "phone": "+1234567893",
            "source": "website"
        }
        
        success, response = self.run_test(
            "Create Lead",
            "POST",
            "leads",
            200,
            data=lead_data,
            token=self.counsellor_token
        )
        
        if success:
            self.lead_id = response.get('id')
            print(f"   Lead ID: {self.lead_id}")
            return True
        return False

    def test_update_lead_stage(self):
        """Test Lead Management - update stage"""
        if not self.lead_id or not self.counsellor_token:
            print("❌ Skipping - no lead ID or counsellor token")
            return False
            
        stage_update = {
            "stage": "contacted",
            "notes": "Initial contact made via phone"
        }
        
        success, response = self.run_test(
            "Update Lead Stage",
            "PUT",
            f"leads/{self.lead_id}/stage",
            200,
            data=stage_update,
            token=self.counsellor_token
        )
        
        return success

    def test_add_lead_note(self):
        """Test Lead Management - add note"""
        if not self.lead_id or not self.counsellor_token:
            print("❌ Skipping - no lead ID or counsellor token")
            return False
            
        note_data = {
            "content": f"Test note added at {datetime.now().isoformat()}"
        }
        
        success, response = self.run_test(
            "Add Lead Note",
            "POST",
            f"leads/{self.lead_id}/notes",
            200,
            data=note_data,
            token=self.counsellor_token
        )
        
        return success

    def test_bulk_lead_reassignment(self):
        """Test Bulk lead reassignment"""
        if not self.lead_id or not self.counsellor_id or not self.university_admin_token:
            print("❌ Skipping - missing required data")
            return False
            
        reassign_data = {
            "lead_ids": [self.lead_id],
            "to_counsellor_id": self.counsellor_id,
            "reason": "Testing bulk reassignment"
        }
        
        success, response = self.run_test(
            "Bulk Lead Reassignment",
            "POST",
            "leads/bulk-reassign",
            200,
            data=reassign_data,
            token=self.university_admin_token
        )
        
        return success

    def test_student_registration(self):
        """Test Student registration and login"""
        registration_data = {
            "name": f"Test Student {self.test_suffix}",
            "email": f"student-{self.test_suffix}@example.com",
            "phone": "+1234567894",
            "password": "StudentPass123!"
        }
        
        success, response = self.run_test(
            "Student Registration",
            "POST",
            "student/register",
            200,
            data={
                **registration_data,
                "university_code": f"TEST{self.test_suffix.upper()}"
            }
        )
        
        if success:
            self.student_token = response.get('access_token')
            self.student_id = response.get('user', {}).get('id')
            self.application_id = response.get('application_id')
            print(f"   Student ID: {self.student_id}")
            print(f"   Application ID: {self.application_id}")
            return True
        return False

    def test_student_login(self):
        """Test student login separately"""
        if not self.student_id:
            print("❌ Skipping - no student created")
            return False
            
        success, response = self.run_test(
            "Student Login",
            "POST",
            "auth/student/login",
            200,
            data={
                "email": f"student-{self.test_suffix}@example.com",
                "password": "StudentPass123!"
            }
        )
        
        if success and 'access_token' in response:
            print(f"   Student login successful")
            return True
        return False

    def test_student_application_workflow(self):
        """Test Student application workflow with multiple steps"""
        if not self.application_id or not self.student_token:
            print("❌ Skipping - no application ID or student token")
            return False
            
        # Test basic info update
        basic_info = {
            "name": f"Test Student {self.test_suffix}",
            "email": f"student-{self.test_suffix}@example.com",
            "phone": "+1234567894",
            "date_of_birth": "2000-01-01",
            "gender": "male",
            "address": "123 Student Street",
            "city": "Test City",
            "state": "Test State",
            "pincode": "123456"
        }
        
        success1, response1 = self.run_test(
            "Update Application Basic Info",
            "PUT",
            f"applications/{self.application_id}/basic-info",
            200,
            data=basic_info,
            token=self.student_token
        )
        
        # Test educational details update
        educational_details = [
            {
                "qualification": "12th",
                "board_university": "CBSE",
                "passing_year": "2020",
                "marks_percentage": "85.5",
                "grade": "A"
            }
        ]
        
        success2, response2 = self.run_test(
            "Update Educational Details",
            "PUT",
            f"applications/{self.application_id}/educational-details",
            200,
            data=educational_details,
            token=self.student_token
        )
        
        return success1 and success2

    def test_lead_timeline(self):
        """Test Lead Timeline immutable logging"""
        if not self.lead_id or not self.counsellor_token:
            print("❌ Skipping - no lead ID or counsellor token")
            return False
            
        success, response = self.run_test(
            "Get Lead Timeline",
            "GET",
            f"leads/{self.lead_id}",
            200,
            token=self.counsellor_token
        )
        
        if success:
            timeline = response.get('timeline', [])
            print(f"   Timeline entries: {len(timeline)}")
            if timeline:
                print(f"   Latest entry: {timeline[-1].get('description', 'N/A')}")
            return True
        return False

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting UNIFY Comprehensive API Tests")
        print("=" * 60)
        
        # Authentication Tests
        if not self.test_super_admin_login():
            print("❌ Super Admin login failed - stopping tests")
            return False
            
        # Super Admin Tests
        self.test_super_admin_dashboard()
        self.test_create_university()
        
        # University Admin Tests
        self.test_create_university_admin()
        self.test_university_admin_login()
        self.test_registration_config()
        
        # Staff Management Tests
        self.test_create_counsellor()
        self.test_counsellor_login()
        
        # Lead Management Tests
        self.test_create_lead()
        self.test_update_lead_stage()
        self.test_add_lead_note()
        self.test_bulk_lead_reassignment()
        self.test_lead_timeline()
        
        # Student Tests
        self.test_student_registration()
        self.test_student_login()
        self.test_student_application_workflow()
        
        # Print results
        print("\n" + "=" * 60)
        print(f"📊 Comprehensive Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                error_msg = test.get('error', f"Expected {test.get('expected')}, got {test.get('actual')}")
                print(f"   - {test.get('test', 'Unknown')}: {error_msg}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80  # Consider 80%+ as passing

def main():
    tester = UnifyComprehensiveAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())