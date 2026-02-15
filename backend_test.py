import requests
import sys
from datetime import datetime
import json

class UnifyAPITester:
    def __init__(self, base_url="https://admit-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.super_admin_credentials = {
            "email": "admin@unify.com",
            "password": "9939350820@#!",
            "role": "super_admin"
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)

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
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_public_universities(self):
        """Test public universities endpoint"""
        return self.run_test("Public Universities List", "GET", "public/universities", 200)

    def test_super_admin_login(self):
        """Test super admin login"""
        success, response = self.run_test(
            "Super Admin Login",
            "POST",
            "auth/login",
            200,
            data=self.super_admin_credentials
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_super_admin_dashboard(self):
        """Test super admin dashboard"""
        if not self.token:
            print("❌ Skipping dashboard test - no token")
            return False
        
        return self.run_test(
            "Super Admin Dashboard",
            "GET",
            "superadmin/dashboard",
            200
        )[0]

    def test_create_university(self):
        """Test university creation"""
        if not self.token:
            print("❌ Skipping university creation - no token")
            return False
        
        university_data = {
            "name": "Test University",
            "code": "TEST001",
            "email": "admin@testuni.edu",
            "phone": "+1234567890",
            "address": "123 Test Street, Test City",
            "website": "https://testuni.edu",
            "subscription_plan": "basic"
        }
        
        success, response = self.run_test(
            "Create University",
            "POST",
            "superadmin/universities",
            200,
            data=university_data
        )
        
        if success:
            self.created_university_id = response.get('id')
            return True
        return False

    def test_list_universities(self):
        """Test listing universities"""
        if not self.token:
            print("❌ Skipping universities list - no token")
            return False
        
        return self.run_test(
            "List Universities",
            "GET",
            "superadmin/universities",
            200
        )[0]

    def test_protected_routes_without_auth(self):
        """Test that protected routes require authentication"""
        # Temporarily remove token
        temp_token = self.token
        self.token = None
        
        success = self.run_test(
            "Protected Route Without Auth",
            "GET",
            "superadmin/dashboard",
            401
        )[0]
        
        # Restore token
        self.token = temp_token
        return success

    def test_analytics_endpoint(self):
        """Test analytics endpoint"""
        if not self.token:
            print("❌ Skipping analytics test - no token")
            return False
        
        return self.run_test(
            "Platform Analytics",
            "GET",
            "superadmin/analytics",
            200
        )[0]

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting UNIFY API Tests")
        print("=" * 50)
        
        # Test basic endpoints
        self.test_health_check()
        self.test_public_universities()
        
        # Test authentication
        if self.test_super_admin_login():
            # Test authenticated endpoints
            self.test_super_admin_dashboard()
            self.test_analytics_endpoint()
            self.test_create_university()
            self.test_list_universities()
        
        # Test security
        self.test_protected_routes_without_auth()
        
        # Print results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                error_msg = test.get('error', f"Expected {test.get('expected')}, got {test.get('actual')}")
                print(f"   - {test.get('test', 'Unknown')}: {error_msg}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = UnifyAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())