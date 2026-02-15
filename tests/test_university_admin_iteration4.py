"""
Test suite for University Admin features - Iteration 4
Tests: Departments, Courses, Sessions, Staff, Questions CRUD operations
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://admit-hub.preview.emergentagent.com')

# Test credentials
UNIVERSITY_ID = "1b75e0cf-2bcf-4f27-88bc-76a9b56a804c"
PERSON_ID = "ADMIN001"
PASSWORD = "admin123456"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for university admin"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "university_id": UNIVERSITY_ID,
        "person_id": PERSON_ID,
        "password": PASSWORD,
        "role": "university_admin"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestUniversityAdminLogin:
    """Test University Admin Login"""
    
    def test_login_success(self):
        """Test successful login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "university_id": UNIVERSITY_ID,
            "person_id": PERSON_ID,
            "password": PASSWORD,
            "role": "university_admin"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "university_admin"
        assert data["user"]["university_id"] == UNIVERSITY_ID
    
    def test_login_wrong_password(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "university_id": UNIVERSITY_ID,
            "person_id": PERSON_ID,
            "password": "wrongpassword",
            "role": "university_admin"
        })
        assert response.status_code == 401
    
    def test_login_wrong_person_id(self):
        """Test login with wrong person ID"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "university_id": UNIVERSITY_ID,
            "person_id": "WRONGID",
            "password": PASSWORD,
            "role": "university_admin"
        })
        assert response.status_code == 401


class TestUniversityDashboard:
    """Test University Dashboard API"""
    
    def test_dashboard_stats(self, auth_headers):
        """Test dashboard returns stats"""
        response = requests.get(f"{BASE_URL}/api/university/dashboard", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_leads" in data
        assert "total_applications" in data
        assert "total_staff" in data
        assert "leads_by_stage" in data


class TestDepartmentsCRUD:
    """Test Departments CRUD operations"""
    
    def test_list_departments(self, auth_headers):
        """Test listing departments"""
        response = requests.get(f"{BASE_URL}/api/university/departments", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert isinstance(data["data"], list)
    
    def test_create_department(self, auth_headers):
        """Test creating a department"""
        unique_code = f"TEST{uuid.uuid4().hex[:4].upper()}"
        response = requests.post(f"{BASE_URL}/api/university/departments", headers=auth_headers, json={
            "name": f"Test Department {unique_code}",
            "code": unique_code,
            "description": "Test department description",
            "head_name": "Dr. Test Head"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == f"Test Department {unique_code}"
        assert data["code"] == unique_code
        assert data["is_active"] == True
        return data["id"]
    
    def test_update_department(self, auth_headers):
        """Test updating a department"""
        # First create a department
        unique_code = f"UPD{uuid.uuid4().hex[:4].upper()}"
        create_response = requests.post(f"{BASE_URL}/api/university/departments", headers=auth_headers, json={
            "name": f"Update Test Dept {unique_code}",
            "code": unique_code,
            "description": "Original description"
        })
        assert create_response.status_code == 200
        dept_id = create_response.json()["id"]
        
        # Update the department
        update_response = requests.put(f"{BASE_URL}/api/university/departments/{dept_id}", headers=auth_headers, json={
            "description": "Updated description",
            "head_name": "Dr. Updated Head"
        })
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["description"] == "Updated description"
        assert data["head_name"] == "Dr. Updated Head"


class TestCoursesCRUD:
    """Test Courses CRUD operations"""
    
    @pytest.fixture(scope="class")
    def test_department(self, auth_headers):
        """Create a test department for courses"""
        unique_code = f"CDPT{uuid.uuid4().hex[:4].upper()}"
        response = requests.post(f"{BASE_URL}/api/university/departments", headers=auth_headers, json={
            "name": f"Course Test Dept {unique_code}",
            "code": unique_code
        })
        assert response.status_code == 200
        return response.json()["id"]
    
    def test_list_courses(self, auth_headers):
        """Test listing courses"""
        response = requests.get(f"{BASE_URL}/api/university/courses", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert isinstance(data["data"], list)
    
    def test_create_course(self, auth_headers, test_department):
        """Test creating a course"""
        unique_code = f"CRS{uuid.uuid4().hex[:4].upper()}"
        response = requests.post(f"{BASE_URL}/api/university/courses", headers=auth_headers, json={
            "name": f"Test Course {unique_code}",
            "code": unique_code,
            "department_id": test_department,
            "duration_years": 4,
            "description": "Test course description",
            "fee_amount": 50000
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == f"Test Course {unique_code}"
        assert data["code"] == unique_code
        assert data["department_id"] == test_department
        assert data["duration_years"] == 4
        assert data["fee_amount"] == 50000
    
    def test_update_course(self, auth_headers, test_department):
        """Test updating a course"""
        # Create a course
        unique_code = f"UCRS{uuid.uuid4().hex[:4].upper()}"
        create_response = requests.post(f"{BASE_URL}/api/university/courses", headers=auth_headers, json={
            "name": f"Update Test Course {unique_code}",
            "code": unique_code,
            "department_id": test_department,
            "duration_years": 3,
            "fee_amount": 40000
        })
        assert create_response.status_code == 200
        course_id = create_response.json()["id"]
        
        # Update the course
        update_response = requests.put(f"{BASE_URL}/api/university/courses/{course_id}", headers=auth_headers, json={
            "duration_years": 4,
            "fee_amount": 60000,
            "description": "Updated course description"
        })
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["duration_years"] == 4
        assert data["fee_amount"] == 60000


class TestSessionsCRUD:
    """Test Sessions CRUD operations"""
    
    def test_list_sessions(self, auth_headers):
        """Test listing sessions"""
        response = requests.get(f"{BASE_URL}/api/university/sessions", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert isinstance(data["data"], list)
    
    def test_create_session(self, auth_headers):
        """Test creating a session"""
        unique_name = f"Session {uuid.uuid4().hex[:6]}"
        response = requests.post(f"{BASE_URL}/api/university/sessions", headers=auth_headers, json={
            "name": unique_name,
            "start_date": "2025-07-01",
            "end_date": "2026-06-30",
            "registration_start": "2025-01-01",
            "registration_end": "2025-06-30"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == unique_name
        assert data["is_active"] == True


class TestStaffManagement:
    """Test Staff Management CRUD operations"""
    
    def test_list_staff(self, auth_headers):
        """Test listing staff"""
        response = requests.get(f"{BASE_URL}/api/university/staff", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert isinstance(data["data"], list)
    
    def test_create_counsellor(self, auth_headers):
        """Test creating a counsellor"""
        unique_id = f"COUNS{uuid.uuid4().hex[:4].upper()}"
        response = requests.post(f"{BASE_URL}/api/university/staff", headers=auth_headers, json={
            "name": f"Test Counsellor {unique_id}",
            "email": f"counsellor_{unique_id.lower()}@test.com",
            "person_id": unique_id,
            "password": "testpassword123",
            "role": "counsellor",
            "phone": "+1234567890"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == f"Test Counsellor {unique_id}"
        assert data["role"] == "counsellor"
        assert data["person_id"] == unique_id
    
    def test_create_counselling_manager(self, auth_headers):
        """Test creating a counselling manager"""
        unique_id = f"MGR{uuid.uuid4().hex[:4].upper()}"
        response = requests.post(f"{BASE_URL}/api/university/staff", headers=auth_headers, json={
            "name": f"Test Manager {unique_id}",
            "email": f"manager_{unique_id.lower()}@test.com",
            "person_id": unique_id,
            "password": "testpassword123",
            "role": "counselling_manager",
            "phone": "+1234567891"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "counselling_manager"
    
    def test_create_invalid_role_fails(self, auth_headers):
        """Test creating staff with invalid role fails"""
        unique_id = f"INV{uuid.uuid4().hex[:4].upper()}"
        response = requests.post(f"{BASE_URL}/api/university/staff", headers=auth_headers, json={
            "name": f"Invalid Role {unique_id}",
            "email": f"invalid_{unique_id.lower()}@test.com",
            "person_id": unique_id,
            "password": "testpassword123",
            "role": "super_admin",  # Invalid role for staff
            "phone": "+1234567892"
        })
        assert response.status_code == 400


class TestQuestionBank:
    """Test Question Bank CRUD operations"""
    
    def test_list_questions(self, auth_headers):
        """Test listing questions"""
        response = requests.get(f"{BASE_URL}/api/tests/questions", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "total" in data
        assert isinstance(data["data"], list)
    
    def test_create_single_choice_question(self, auth_headers):
        """Test creating a single choice question"""
        response = requests.post(f"{BASE_URL}/api/tests/questions", headers=auth_headers, json={
            "question_text": f"Test Question {uuid.uuid4().hex[:6]}",
            "question_type": "single_choice",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_options": [0],  # Index of correct option
            "marks": 1,
            "negative_marks": 0,
            "subject": "Test Subject"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["question_type"] == "single_choice"
        assert len(data["options"]) == 4
        assert data["correct_options"] == [0]
        assert data["marks"] == 1
    
    def test_create_multiple_choice_question(self, auth_headers):
        """Test creating a multiple choice question"""
        response = requests.post(f"{BASE_URL}/api/tests/questions", headers=auth_headers, json={
            "question_text": f"Multi Choice Question {uuid.uuid4().hex[:6]}",
            "question_type": "multiple_choice",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_options": [0, 2],  # Multiple correct options
            "marks": 2,
            "negative_marks": 0.5,
            "subject": "Test Subject",
            "difficulty": "hard"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["question_type"] == "multiple_choice"
        assert data["correct_options"] == [0, 2]
        assert data["marks"] == 2
        assert data["negative_marks"] == 0.5


class TestUniversityConfig:
    """Test University Configuration"""
    
    def test_get_config(self, auth_headers):
        """Test getting university config"""
        response = requests.get(f"{BASE_URL}/api/university/config", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data
        assert "registration_config" in data
    
    def test_update_registration_config(self, auth_headers):
        """Test updating registration config"""
        response = requests.put(f"{BASE_URL}/api/university/config/registration", headers=auth_headers, json={
            "basic_info_enabled": True,
            "educational_details_enabled": True,
            "documents_enabled": True,
            "entrance_test_enabled": True,
            "fee_enabled": True,
            "fee_amount": 1000
        })
        assert response.status_code == 200
        data = response.json()
        assert data["registration_config"]["entrance_test_enabled"] == True
        assert data["registration_config"]["fee_enabled"] == True


class TestAPIAuthentication:
    """Test API authentication requirements"""
    
    def test_dashboard_requires_auth(self):
        """Test dashboard requires authentication"""
        response = requests.get(f"{BASE_URL}/api/university/dashboard")
        assert response.status_code == 403
    
    def test_departments_requires_auth(self):
        """Test departments requires authentication"""
        response = requests.get(f"{BASE_URL}/api/university/departments")
        assert response.status_code == 403
    
    def test_courses_requires_auth(self):
        """Test courses requires authentication"""
        response = requests.get(f"{BASE_URL}/api/university/courses")
        assert response.status_code == 403
    
    def test_sessions_requires_auth(self):
        """Test sessions requires authentication"""
        response = requests.get(f"{BASE_URL}/api/university/sessions")
        assert response.status_code == 403
    
    def test_staff_requires_auth(self):
        """Test staff requires authentication"""
        response = requests.get(f"{BASE_URL}/api/university/staff")
        assert response.status_code == 403
    
    def test_questions_requires_auth(self):
        """Test questions requires authentication"""
        response = requests.get(f"{BASE_URL}/api/tests/questions")
        assert response.status_code == 403


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
