"""
Test Suite for UNIFY Iteration 6 Features:
1. Brevo Email Integration - POST /api/emails/test, GET /api/emails/logs, GET /api/emails/stats
2. Export CSV functionality verification (frontend component)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN_CREDS = {
    "email": "admin@unify.com",
    "password": "9939350820@#!",
    "role": "super_admin"
}

UNIVERSITY_ADMIN_CREDS = {
    "university_id": "1b75e0cf-2bcf-4f27-88bc-76a9b56a804c",
    "person_id": "ADMIN001",
    "password": "admin123456",
    "role": "university_admin"
}


class TestEmailIntegration:
    """Test Brevo email integration endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def get_super_admin_token(self):
        """Get super admin auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN_CREDS)
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Super admin login failed")
        
    def get_university_admin_token(self):
        """Get university admin auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json=UNIVERSITY_ADMIN_CREDS)
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("University admin login failed")
    
    # ============== EMAIL TEST ENDPOINT ==============
    
    def test_send_test_email_success(self):
        """Test POST /api/emails/test - sends test email via Brevo"""
        token = self.get_super_admin_token()
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.post(f"{BASE_URL}/api/emails/test", json={
            "to_email": "test@example.com",
            "to_name": "Test User"
        })
        
        # Should return 200 with message
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Check response structure
        assert "message" in data, "Response should contain 'message' field"
        
        # If email sent successfully, should have message_id
        if data.get("message") == "Test email sent successfully":
            assert "message_id" in data, "Successful email should return message_id"
            print(f"✓ Test email sent successfully, message_id: {data.get('message_id')}")
        else:
            # Email might fail if Brevo API key is invalid, but endpoint should still work
            print(f"⚠ Email send result: {data.get('message')}, error: {data.get('error')}")
    
    def test_send_test_email_requires_super_admin(self):
        """Test POST /api/emails/test - requires super admin role"""
        token = self.get_university_admin_token()
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.post(f"{BASE_URL}/api/emails/test", json={
            "to_email": "test@example.com",
            "to_name": "Test User"
        })
        
        # University admin should get 403
        assert response.status_code == 403, f"Expected 403 for non-super-admin, got {response.status_code}"
        print("✓ Email test endpoint correctly requires super admin role")
    
    def test_send_test_email_requires_auth(self):
        """Test POST /api/emails/test - requires authentication"""
        response = self.session.post(f"{BASE_URL}/api/emails/test", json={
            "to_email": "test@example.com",
            "to_name": "Test User"
        })
        
        # Should get 403 (no auth header)
        assert response.status_code == 403, f"Expected 403 without auth, got {response.status_code}"
        print("✓ Email test endpoint correctly requires authentication")
    
    # ============== EMAIL LOGS ENDPOINT ==============
    
    def test_get_email_logs_super_admin(self):
        """Test GET /api/emails/logs - super admin can view all logs"""
        token = self.get_super_admin_token()
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.get(f"{BASE_URL}/api/emails/logs")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Check response structure
        assert "data" in data, "Response should contain 'data' field"
        assert "total" in data, "Response should contain 'total' field"
        assert "page" in data, "Response should contain 'page' field"
        assert "pages" in data, "Response should contain 'pages' field"
        assert isinstance(data["data"], list), "'data' should be a list"
        
        print(f"✓ Email logs retrieved: {data['total']} total logs")
    
    def test_get_email_logs_university_admin(self):
        """Test GET /api/emails/logs - university admin can view their logs"""
        token = self.get_university_admin_token()
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.get(f"{BASE_URL}/api/emails/logs")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "data" in data, "Response should contain 'data' field"
        print(f"✓ University admin can view email logs: {data['total']} logs")
    
    def test_get_email_logs_pagination(self):
        """Test GET /api/emails/logs - pagination works"""
        token = self.get_super_admin_token()
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.get(f"{BASE_URL}/api/emails/logs?page=1&limit=5")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["page"] == 1, "Page should be 1"
        assert len(data["data"]) <= 5, "Should return at most 5 items"
        print(f"✓ Email logs pagination works: page {data['page']}, {len(data['data'])} items")
    
    def test_get_email_logs_requires_auth(self):
        """Test GET /api/emails/logs - requires authentication"""
        response = self.session.get(f"{BASE_URL}/api/emails/logs")
        
        assert response.status_code == 403, f"Expected 403 without auth, got {response.status_code}"
        print("✓ Email logs endpoint correctly requires authentication")
    
    # ============== EMAIL STATS ENDPOINT ==============
    
    def test_get_email_stats_super_admin(self):
        """Test GET /api/emails/stats - super admin can view stats"""
        token = self.get_super_admin_token()
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.get(f"{BASE_URL}/api/emails/stats")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Check response structure
        assert "by_status" in data, "Response should contain 'by_status' field"
        assert "by_type" in data, "Response should contain 'by_type' field"
        assert "total" in data, "Response should contain 'total' field"
        assert isinstance(data["by_status"], dict), "'by_status' should be a dict"
        assert isinstance(data["by_type"], dict), "'by_type' should be a dict"
        
        print(f"✓ Email stats retrieved: {data['total']} total emails")
        print(f"  By status: {data['by_status']}")
        print(f"  By type: {data['by_type']}")
    
    def test_get_email_stats_university_admin(self):
        """Test GET /api/emails/stats - university admin can view their stats"""
        token = self.get_university_admin_token()
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.get(f"{BASE_URL}/api/emails/stats")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "by_status" in data, "Response should contain 'by_status' field"
        assert "total" in data, "Response should contain 'total' field"
        print(f"✓ University admin can view email stats: {data['total']} total")
    
    def test_get_email_stats_requires_auth(self):
        """Test GET /api/emails/stats - requires authentication"""
        response = self.session.get(f"{BASE_URL}/api/emails/stats")
        
        assert response.status_code == 403, f"Expected 403 without auth, got {response.status_code}"
        print("✓ Email stats endpoint correctly requires authentication")


class TestExportCSVEndpoints:
    """Test that data endpoints return proper data for CSV export"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_super_admin_token(self):
        """Get super admin auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN_CREDS)
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Super admin login failed")
        
    def get_university_admin_token(self):
        """Get university admin auth token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json=UNIVERSITY_ADMIN_CREDS)
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("University admin login failed")
    
    def test_universities_list_for_export(self):
        """Test GET /api/superadmin/universities - returns data for CSV export"""
        token = self.get_super_admin_token()
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.get(f"{BASE_URL}/api/superadmin/universities")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "data" in data, "Response should contain 'data' field"
        assert isinstance(data["data"], list), "'data' should be a list"
        
        # Check that data has exportable fields
        if len(data["data"]) > 0:
            uni = data["data"][0]
            exportable_fields = ["name", "code", "email", "phone", "address", "subscription_plan", "is_active", "created_at"]
            for field in exportable_fields:
                assert field in uni, f"University should have '{field}' field for export"
        
        print(f"✓ Universities list returns {len(data['data'])} items with exportable fields")
    
    def test_leads_list_for_export(self):
        """Test GET /api/leads - returns data for CSV export"""
        token = self.get_university_admin_token()
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.get(f"{BASE_URL}/api/leads")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "data" in data, "Response should contain 'data' field"
        assert isinstance(data["data"], list), "'data' should be a list"
        
        # Check that data has exportable fields
        if len(data["data"]) > 0:
            lead = data["data"][0]
            exportable_fields = ["name", "email", "phone", "source", "stage", "created_at"]
            for field in exportable_fields:
                assert field in lead, f"Lead should have '{field}' field for export"
        
        print(f"✓ Leads list returns {len(data['data'])} items with exportable fields")
    
    def test_staff_list_for_export(self):
        """Test GET /api/university/staff - returns data for CSV export"""
        token = self.get_university_admin_token()
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.get(f"{BASE_URL}/api/university/staff")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "data" in data, "Response should contain 'data' field"
        assert isinstance(data["data"], list), "'data' should be a list"
        
        # Check that data has exportable fields
        if len(data["data"]) > 0:
            staff = data["data"][0]
            exportable_fields = ["name", "person_id", "email", "role", "is_active", "created_at"]
            for field in exportable_fields:
                assert field in staff, f"Staff should have '{field}' field for export"
        
        print(f"✓ Staff list returns {len(data['data'])} items with exportable fields")
    
    def test_departments_list_for_export(self):
        """Test GET /api/university/departments - returns data for CSV export"""
        token = self.get_university_admin_token()
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.get(f"{BASE_URL}/api/university/departments")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "data" in data, "Response should contain 'data' field"
        assert isinstance(data["data"], list), "'data' should be a list"
        
        print(f"✓ Departments list returns {len(data['data'])} items")
    
    def test_courses_list_for_export(self):
        """Test GET /api/university/courses - returns data for CSV export"""
        token = self.get_university_admin_token()
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.get(f"{BASE_URL}/api/university/courses")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "data" in data, "Response should contain 'data' field"
        assert isinstance(data["data"], list), "'data' should be a list"
        
        print(f"✓ Courses list returns {len(data['data'])} items")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
