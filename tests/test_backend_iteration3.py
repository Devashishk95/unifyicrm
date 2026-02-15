"""
Backend API Tests for UNIFY - Iteration 3
Testing: Change Password, Document Upload, Test Module, Super Admin Login, University Edit
"""
import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN_EMAIL = "admin@unify.com"
SUPER_ADMIN_PASSWORD = "9939350820@#!"


class TestHealthAndBasics:
    """Basic health check tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        print("✓ Health endpoint working")
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "UNIFY" in data.get("message", "")
        print("✓ Root endpoint working")


class TestSuperAdminAuth:
    """Super Admin authentication tests"""
    
    def test_super_admin_login_success(self):
        """Test Super Admin login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD,
            "role": "super_admin"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["role"] == "super_admin"
        print(f"✓ Super Admin login successful, token received")
        return data["access_token"]
    
    def test_super_admin_login_wrong_password(self):
        """Test Super Admin login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": "wrongpassword",
            "role": "super_admin"
        })
        assert response.status_code == 401
        print("✓ Wrong password correctly rejected")
    
    def test_get_current_user(self):
        """Test getting current user profile"""
        # First login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD,
            "role": "super_admin"
        })
        token = login_resp.json()["access_token"]
        
        # Get profile
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == SUPER_ADMIN_EMAIL
        assert data["role"] == "super_admin"
        print("✓ Get current user profile working")


class TestChangePassword:
    """Change Password API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD,
            "role": "super_admin"
        })
        return response.json()["access_token"]
    
    def test_change_password_wrong_current(self, auth_token):
        """Test change password with wrong current password"""
        response = requests.put(
            f"{BASE_URL}/api/auth/change-password",
            json={
                "current_password": "wrongpassword",
                "new_password": "newpassword123"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400
        assert "incorrect" in response.json().get("detail", "").lower()
        print("✓ Change password with wrong current password correctly rejected")
    
    def test_change_password_short_new(self, auth_token):
        """Test change password with too short new password"""
        response = requests.put(
            f"{BASE_URL}/api/auth/change-password",
            json={
                "current_password": SUPER_ADMIN_PASSWORD,
                "new_password": "short"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400
        assert "8 characters" in response.json().get("detail", "")
        print("✓ Short password correctly rejected")
    
    def test_change_password_success_and_revert(self, auth_token):
        """Test successful password change and revert"""
        new_password = "NewSecurePassword123!"
        
        # Change password
        response = requests.put(
            f"{BASE_URL}/api/auth/change-password",
            json={
                "current_password": SUPER_ADMIN_PASSWORD,
                "new_password": new_password
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        assert "success" in response.json().get("message", "").lower()
        print("✓ Password changed successfully")
        
        # Login with new password
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": new_password,
            "role": "super_admin"
        })
        assert login_resp.status_code == 200
        new_token = login_resp.json()["access_token"]
        print("✓ Login with new password successful")
        
        # Revert password back
        revert_resp = requests.put(
            f"{BASE_URL}/api/auth/change-password",
            json={
                "current_password": new_password,
                "new_password": SUPER_ADMIN_PASSWORD
            },
            headers={"Authorization": f"Bearer {new_token}"}
        )
        assert revert_resp.status_code == 200
        print("✓ Password reverted back to original")
    
    def test_change_password_unauthenticated(self):
        """Test change password without authentication"""
        response = requests.put(
            f"{BASE_URL}/api/auth/change-password",
            json={
                "current_password": "test",
                "new_password": "newpassword123"
            }
        )
        assert response.status_code in [401, 403]
        print("✓ Unauthenticated change password correctly rejected")


class TestDocumentUploadAPI:
    """Document Upload API tests"""
    
    def test_document_upload_endpoint_exists(self):
        """Test that document upload endpoint exists"""
        # Without auth, should get 401/403, not 404
        response = requests.post(f"{BASE_URL}/api/documents/upload", json={})
        assert response.status_code in [401, 403, 422], f"Unexpected status: {response.status_code}"
        print("✓ Document upload endpoint exists")
    
    def test_document_list_endpoint_exists(self):
        """Test that document list endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/documents/application/test-id")
        assert response.status_code in [401, 403, 404], f"Unexpected status: {response.status_code}"
        print("✓ Document list endpoint exists")


class TestUniversityManagement:
    """University CRUD tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get Super Admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD,
            "role": "super_admin"
        })
        return response.json()["access_token"]
    
    def test_list_universities(self, auth_token):
        """Test listing universities"""
        response = requests.get(
            f"{BASE_URL}/api/superadmin/universities",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        print(f"✓ Listed {data['total']} universities")
    
    def test_create_and_update_university(self, auth_token):
        """Test creating and updating a university"""
        import uuid
        unique_code = f"TEST{uuid.uuid4().hex[:6].upper()}"
        
        # Create university
        create_resp = requests.post(
            f"{BASE_URL}/api/superadmin/universities",
            json={
                "name": f"Test University {unique_code}",
                "code": unique_code,
                "email": f"test{unique_code.lower()}@example.com",
                "phone": "1234567890",
                "address": "Test Address"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert create_resp.status_code == 200, f"Create failed: {create_resp.text}"
        created = create_resp.json()
        university_id = created["id"]
        print(f"✓ Created university: {unique_code}")
        
        # Update university
        update_resp = requests.put(
            f"{BASE_URL}/api/superadmin/universities/{university_id}",
            json={
                "name": f"Updated University {unique_code}",
                "phone": "9876543210"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert update_resp.status_code == 200
        updated = update_resp.json()
        assert "Updated" in updated["name"]
        assert updated["phone"] == "9876543210"
        print(f"✓ Updated university successfully")
        
        # Verify update persisted
        get_resp = requests.get(
            f"{BASE_URL}/api/superadmin/universities/{university_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert get_resp.status_code == 200
        fetched = get_resp.json()
        assert fetched["name"] == f"Updated University {unique_code}"
        print("✓ University update persisted correctly")


class TestSuperAdminDashboard:
    """Super Admin Dashboard tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get Super Admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD,
            "role": "super_admin"
        })
        return response.json()["access_token"]
    
    def test_dashboard_stats(self, auth_token):
        """Test dashboard statistics"""
        response = requests.get(
            f"{BASE_URL}/api/superadmin/dashboard",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "universities" in data
        assert "students" in data
        assert "leads" in data
        assert "applications" in data
        print(f"✓ Dashboard stats: Universities={data['universities']['total']}, Students={data['students']}")
    
    def test_analytics_endpoint(self, auth_token):
        """Test analytics endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/superadmin/analytics",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "leads_by_university" in data or "applications_by_status" in data
        print("✓ Analytics endpoint working")


class TestTestModule:
    """Test module API tests"""
    
    def test_questions_endpoint_exists(self):
        """Test that questions endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/tests/questions")
        # Should require auth
        assert response.status_code in [401, 403], f"Unexpected status: {response.status_code}"
        print("✓ Questions endpoint exists (requires auth)")
    
    def test_test_configs_endpoint_exists(self):
        """Test that test configs endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/tests/configs")
        assert response.status_code in [401, 403], f"Unexpected status: {response.status_code}"
        print("✓ Test configs endpoint exists (requires auth)")


class TestPublicEndpoints:
    """Public endpoints tests"""
    
    def test_public_universities_list(self):
        """Test public universities list"""
        response = requests.get(f"{BASE_URL}/api/public/universities")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        print(f"✓ Public universities list: {len(data['data'])} universities")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
