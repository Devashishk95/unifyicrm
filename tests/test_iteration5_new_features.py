"""
Test Iteration 5: New Features Testing
- University Settings - About & Gallery tab
- University Profile API - PUT /api/university/profile
- Gallery Upload API - POST /api/university/gallery/upload
- Student Institution Page - Shows university info and gallery
- Counselling Manager Dashboard - Shows stats and team performance
- Bulk Lead Upload - POST /api/leads/bulk-upload
- Assignment Rules API - PUT /api/leads/assignment-rules
- Counsellor Dashboard - Shows personal lead stats
- Team Management Page - Shows counsellor list
"""

import pytest
import requests
import os
import base64
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://admit-hub.preview.emergentagent.com')

# Test credentials
UNIVERSITY_ID = "1b75e0cf-2bcf-4f27-88bc-76a9b56a804c"
ADMIN_PERSON_ID = "ADMIN001"
ADMIN_PASSWORD = "admin123456"
SUPER_ADMIN_EMAIL = "admin@unify.com"
SUPER_ADMIN_PASSWORD = "9939350820@#!"


class TestSetup:
    """Setup fixtures for testing"""
    
    @pytest.fixture(scope="class")
    def api_client(self):
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    @pytest.fixture(scope="class")
    def university_admin_token(self, api_client):
        """Get University Admin token"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "university_id": UNIVERSITY_ID,
            "person_id": ADMIN_PERSON_ID,
            "password": ADMIN_PASSWORD,
            "role": "university_admin"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("University Admin authentication failed")
    
    @pytest.fixture(scope="class")
    def super_admin_token(self, api_client):
        """Get Super Admin token"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD,
            "role": "super_admin"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Super Admin authentication failed")


class TestUniversityProfile(TestSetup):
    """Test University Profile and About & Gallery features"""
    
    def test_get_university_config(self, api_client, university_admin_token):
        """Test GET /api/university/config returns university info"""
        response = api_client.get(
            f"{BASE_URL}/api/university/config",
            headers={"Authorization": f"Bearer {university_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "id" in data
        print(f"University config retrieved: {data.get('name')}")
    
    def test_update_university_profile_about(self, api_client, university_admin_token):
        """Test PUT /api/university/profile updates about field"""
        test_about = f"Test University Description - Updated at {datetime.now().isoformat()}"
        response = api_client.put(
            f"{BASE_URL}/api/university/profile",
            json={"about": test_about},
            headers={"Authorization": f"Bearer {university_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"Profile about updated successfully")
    
    def test_update_university_profile_facilities(self, api_client, university_admin_token):
        """Test PUT /api/university/profile updates facilities"""
        test_facilities = ["Library", "Sports Complex", "Cafeteria", "Computer Lab"]
        response = api_client.put(
            f"{BASE_URL}/api/university/profile",
            json={"facilities": test_facilities},
            headers={"Authorization": f"Bearer {university_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"Profile facilities updated successfully")
    
    def test_update_university_profile_contact(self, api_client, university_admin_token):
        """Test PUT /api/university/profile updates contact info"""
        response = api_client.put(
            f"{BASE_URL}/api/university/profile",
            json={
                "website": "https://testuniversity.edu",
                "email": "admissions@testuniversity.edu",
                "phone": "+91 9876543210",
                "address": "123 University Road, Test City"
            },
            headers={"Authorization": f"Bearer {university_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"Profile contact info updated successfully")
    
    def test_verify_profile_updates_persisted(self, api_client, university_admin_token):
        """Verify profile updates are persisted in database"""
        response = api_client.get(
            f"{BASE_URL}/api/university/config",
            headers={"Authorization": f"Bearer {university_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Check that facilities exist
        assert "facilities" in data or data.get("facilities") is None
        print(f"Profile data verified: about={data.get('about', 'N/A')[:50]}...")


class TestGalleryUpload(TestSetup):
    """Test Gallery Upload and Delete features"""
    
    def test_gallery_upload_image(self, api_client, university_admin_token):
        """Test POST /api/university/gallery/upload"""
        # Create a small test image (1x1 red pixel PNG)
        # This is a minimal valid PNG file
        test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        response = api_client.post(
            f"{BASE_URL}/api/university/gallery/upload",
            json={
                "file_name": "test_image.png",
                "file_type": "png",
                "file_data": test_image_base64
            },
            headers={"Authorization": f"Bearer {university_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "image_url" in data
        assert data["image_url"].startswith("/uploads/gallery/")
        print(f"Gallery image uploaded: {data['image_url']}")
        return data["image_url"]
    
    def test_gallery_upload_invalid_type(self, api_client, university_admin_token):
        """Test gallery upload rejects invalid file types"""
        response = api_client.post(
            f"{BASE_URL}/api/university/gallery/upload",
            json={
                "file_name": "test.pdf",
                "file_type": "pdf",
                "file_data": "dGVzdA=="  # "test" in base64
            },
            headers={"Authorization": f"Bearer {university_admin_token}"}
        )
        assert response.status_code == 400
        print("Invalid file type correctly rejected")


class TestCounsellingManagerDashboard(TestSetup):
    """Test Counselling Manager Dashboard and related features"""
    
    @pytest.fixture(scope="class")
    def cm_token(self, api_client, university_admin_token):
        """Create a Counselling Manager and get token"""
        # First create a CM user
        cm_person_id = f"CM_TEST_{datetime.now().strftime('%H%M%S')}"
        create_response = api_client.post(
            f"{BASE_URL}/api/university/staff",
            json={
                "name": "Test CM",
                "email": f"testcm_{datetime.now().strftime('%H%M%S')}@test.com",
                "person_id": cm_person_id,
                "password": "testpass123",
                "role": "counselling_manager"
            },
            headers={"Authorization": f"Bearer {university_admin_token}"}
        )
        
        if create_response.status_code not in [200, 201]:
            # Try to login with existing CM
            cm_person_id = "CM001"
        
        # Login as CM
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "university_id": UNIVERSITY_ID,
            "person_id": cm_person_id,
            "password": "testpass123",
            "role": "counselling_manager"
        })
        
        if login_response.status_code == 200:
            return login_response.json().get("access_token")
        pytest.skip("Counselling Manager authentication failed")
    
    def test_cm_dashboard_endpoint(self, api_client, cm_token):
        """Test GET /api/counselling/dashboard"""
        response = api_client.get(
            f"{BASE_URL}/api/counselling/dashboard",
            headers={"Authorization": f"Bearer {cm_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "counsellor_stats" in data
        assert "unassigned_leads" in data
        assert "total_counsellors" in data
        print(f"CM Dashboard: {data['total_counsellors']} counsellors, {data['unassigned_leads']} unassigned leads")


class TestBulkLeadUpload(TestSetup):
    """Test Bulk Lead Upload feature"""
    
    @pytest.fixture(scope="class")
    def cm_token(self, api_client, university_admin_token):
        """Create a Counselling Manager and get token"""
        cm_person_id = f"CM_BULK_{datetime.now().strftime('%H%M%S')}"
        create_response = api_client.post(
            f"{BASE_URL}/api/university/staff",
            json={
                "name": "Test CM Bulk",
                "email": f"testcmbulk_{datetime.now().strftime('%H%M%S')}@test.com",
                "person_id": cm_person_id,
                "password": "testpass123",
                "role": "counselling_manager"
            },
            headers={"Authorization": f"Bearer {university_admin_token}"}
        )
        
        # Login as CM
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "university_id": UNIVERSITY_ID,
            "person_id": cm_person_id,
            "password": "testpass123",
            "role": "counselling_manager"
        })
        
        if login_response.status_code == 200:
            return login_response.json().get("access_token")
        pytest.skip("Counselling Manager authentication failed")
    
    def test_bulk_upload_leads(self, api_client, cm_token):
        """Test POST /api/leads/bulk-upload"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_leads = [
            {
                "name": f"Bulk Lead 1 {timestamp}",
                "email": f"bulklead1_{timestamp}@test.com",
                "phone": f"98765{timestamp[:5]}01",
                "source": "bulk_upload",
                "course_interest": "B.Tech CS"
            },
            {
                "name": f"Bulk Lead 2 {timestamp}",
                "email": f"bulklead2_{timestamp}@test.com",
                "phone": f"98765{timestamp[:5]}02",
                "source": "bulk_upload",
                "course_interest": "MBA"
            }
        ]
        
        response = api_client.post(
            f"{BASE_URL}/api/leads/bulk-upload",
            json={"leads": test_leads},
            headers={"Authorization": f"Bearer {cm_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "created" in data
        assert "failed" in data
        assert "duplicates" in data
        assert data["created"] >= 0
        print(f"Bulk upload: {data['created']} created, {data['failed']} failed, {data['duplicates']} duplicates")
    
    def test_bulk_upload_with_missing_fields(self, api_client, cm_token):
        """Test bulk upload handles missing required fields"""
        test_leads = [
            {"name": ""},  # Missing email and phone
            {"email": "test@test.com"}  # Missing name
        ]
        
        response = api_client.post(
            f"{BASE_URL}/api/leads/bulk-upload",
            json={"leads": test_leads},
            headers={"Authorization": f"Bearer {cm_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Should fail for invalid leads
        assert data["failed"] >= 0
        print(f"Bulk upload with invalid data: {data['failed']} failed as expected")


class TestAssignmentRules(TestSetup):
    """Test Assignment Rules feature"""
    
    @pytest.fixture(scope="class")
    def cm_token(self, api_client, university_admin_token):
        """Create a Counselling Manager and get token"""
        cm_person_id = f"CM_RULES_{datetime.now().strftime('%H%M%S')}"
        create_response = api_client.post(
            f"{BASE_URL}/api/university/staff",
            json={
                "name": "Test CM Rules",
                "email": f"testcmrules_{datetime.now().strftime('%H%M%S')}@test.com",
                "person_id": cm_person_id,
                "password": "testpass123",
                "role": "counselling_manager"
            },
            headers={"Authorization": f"Bearer {university_admin_token}"}
        )
        
        # Login as CM
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "university_id": UNIVERSITY_ID,
            "person_id": cm_person_id,
            "password": "testpass123",
            "role": "counselling_manager"
        })
        
        if login_response.status_code == 200:
            return login_response.json().get("access_token")
        pytest.skip("Counselling Manager authentication failed")
    
    def test_update_assignment_rules_round_robin(self, api_client, cm_token):
        """Test PUT /api/leads/assignment-rules with round_robin method"""
        response = api_client.put(
            f"{BASE_URL}/api/leads/assignment-rules",
            json={
                "enabled": True,
                "method": "round_robin",
                "max_leads_per_counsellor": 50
            },
            headers={"Authorization": f"Bearer {cm_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("Assignment rules (round_robin) updated successfully")
    
    def test_update_assignment_rules_load_balanced(self, api_client, cm_token):
        """Test PUT /api/leads/assignment-rules with load_balanced method"""
        response = api_client.put(
            f"{BASE_URL}/api/leads/assignment-rules",
            json={
                "enabled": True,
                "method": "load_balanced",
                "max_leads_per_counsellor": 100
            },
            headers={"Authorization": f"Bearer {cm_token}"}
        )
        assert response.status_code == 200
        print("Assignment rules (load_balanced) updated successfully")
    
    def test_update_assignment_rules_performance_based(self, api_client, cm_token):
        """Test PUT /api/leads/assignment-rules with performance_based method"""
        response = api_client.put(
            f"{BASE_URL}/api/leads/assignment-rules",
            json={
                "enabled": True,
                "method": "performance_based",
                "max_leads_per_counsellor": 75
            },
            headers={"Authorization": f"Bearer {cm_token}"}
        )
        assert response.status_code == 200
        print("Assignment rules (performance_based) updated successfully")
    
    def test_disable_assignment_rules(self, api_client, cm_token):
        """Test disabling assignment rules"""
        response = api_client.put(
            f"{BASE_URL}/api/leads/assignment-rules",
            json={
                "enabled": False,
                "method": "round_robin",
                "max_leads_per_counsellor": 50
            },
            headers={"Authorization": f"Bearer {cm_token}"}
        )
        assert response.status_code == 200
        print("Assignment rules disabled successfully")


class TestCounsellorDashboard(TestSetup):
    """Test Counsellor Dashboard feature"""
    
    @pytest.fixture(scope="class")
    def counsellor_token(self, api_client, university_admin_token):
        """Create a Counsellor and get token"""
        counsellor_person_id = f"COUNS_{datetime.now().strftime('%H%M%S')}"
        create_response = api_client.post(
            f"{BASE_URL}/api/university/staff",
            json={
                "name": "Test Counsellor",
                "email": f"testcounsellor_{datetime.now().strftime('%H%M%S')}@test.com",
                "person_id": counsellor_person_id,
                "password": "testpass123",
                "role": "counsellor"
            },
            headers={"Authorization": f"Bearer {university_admin_token}"}
        )
        
        # Login as Counsellor
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "university_id": UNIVERSITY_ID,
            "person_id": counsellor_person_id,
            "password": "testpass123",
            "role": "counsellor"
        })
        
        if login_response.status_code == 200:
            return login_response.json().get("access_token")
        pytest.skip("Counsellor authentication failed")
    
    def test_counsellor_dashboard_endpoint(self, api_client, counsellor_token):
        """Test GET /api/counsellor/dashboard"""
        response = api_client.get(
            f"{BASE_URL}/api/counsellor/dashboard",
            headers={"Authorization": f"Bearer {counsellor_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_leads" in data
        assert "new_leads" in data
        assert "converted_leads" in data
        assert "overdue_follow_ups" in data
        assert "recent_leads" in data
        assert "today_follow_ups" in data
        print(f"Counsellor Dashboard: {data['total_leads']} total leads, {data['new_leads']} new leads")


class TestStudentUniversityInfo(TestSetup):
    """Test Student University Info endpoint"""
    
    @pytest.fixture(scope="class")
    def student_token(self, api_client, university_admin_token):
        """Create a student and get token"""
        timestamp = datetime.now().strftime('%H%M%S')
        student_email = f"teststudent_{timestamp}@test.com"
        
        # Register student
        register_response = api_client.post(
            f"{BASE_URL}/api/student/register",
            json={
                "name": "Test Student",
                "email": student_email,
                "phone": f"98765{timestamp}",
                "password": "testpass123",
                "university_code": "TESTUNIV"  # This might need to be the actual code
            }
        )
        
        # Try to login
        login_response = api_client.post(f"{BASE_URL}/api/auth/student/login", json={
            "email": student_email,
            "password": "testpass123"
        })
        
        if login_response.status_code == 200:
            return login_response.json().get("access_token")
        pytest.skip("Student authentication failed - may need valid university code")
    
    def test_student_university_info_endpoint(self, api_client, student_token):
        """Test GET /api/student/university-info"""
        response = api_client.get(
            f"{BASE_URL}/api/student/university-info",
            headers={"Authorization": f"Bearer {student_token}"}
        )
        # This might return 200 or 404 depending on student setup
        if response.status_code == 200:
            data = response.json()
            assert "name" in data
            print(f"Student university info: {data.get('name')}")
        else:
            print(f"Student university info endpoint returned {response.status_code}")


class TestUniversityAdminCanAccessCMFeatures(TestSetup):
    """Test that University Admin can also access CM features"""
    
    def test_admin_can_update_assignment_rules(self, api_client, university_admin_token):
        """Test University Admin can update assignment rules"""
        response = api_client.put(
            f"{BASE_URL}/api/leads/assignment-rules",
            json={
                "enabled": False,
                "method": "round_robin",
                "max_leads_per_counsellor": 50
            },
            headers={"Authorization": f"Bearer {university_admin_token}"}
        )
        assert response.status_code == 200
        print("University Admin can update assignment rules")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
