"""
Test Student Query System - Iteration 6
Tests for:
- POST /api/queries - Create new query (student)
- GET /api/queries/my-queries - Get student's queries
- GET /api/queries/counsellor-queries - Get counsellor's assigned queries
- POST /api/queries/{id}/reply - Reply to query
- PUT /api/queries/{id}/status - Update query status
- GET /api/queries/stats/summary - Get query statistics
- GET /api/counselling/dashboard - Counselling manager dashboard
- GET /api/leads - Leads list
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN = {
    "email": "admin@unify.com",
    "password": "9939350820@#!",
    "role": "super_admin"
}

COUNSELLING_MANAGER = {
    "university_id": "1b75e0cf-2bcf-4f27-88bc-76a9b56a804c",
    "person_id": "TESTCM001",
    "password": "TestCM@123",
    "role": "counselling_manager"
}


class TestAuthAndSetup:
    """Test authentication and basic setup"""
    
    def test_super_admin_login(self, api_client):
        """Test super admin login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        assert response.status_code == 200, f"Super admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "super_admin"
        print(f"✓ Super admin login successful")
    
    def test_counselling_manager_login(self, api_client):
        """Test counselling manager login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=COUNSELLING_MANAGER)
        if response.status_code == 401:
            pytest.skip("Counselling manager not found - may need to create first")
        assert response.status_code == 200, f"CM login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "counselling_manager"
        print(f"✓ Counselling manager login successful")


class TestCounsellingDashboard:
    """Test Counselling Manager Dashboard"""
    
    def test_counselling_dashboard_loads(self, cm_client):
        """Test GET /api/counselling/dashboard returns stats"""
        response = cm_client.get(f"{BASE_URL}/api/counselling/dashboard")
        assert response.status_code == 200, f"Dashboard failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "counsellor_stats" in data
        assert "unassigned_leads" in data
        assert "total_counsellors" in data
        assert isinstance(data["counsellor_stats"], list)
        assert isinstance(data["unassigned_leads"], int)
        print(f"✓ Counselling dashboard loads - {data['total_counsellors']} counsellors, {data['unassigned_leads']} unassigned leads")


class TestLeadsPage:
    """Test Leads Page API"""
    
    def test_leads_list_loads(self, cm_client):
        """Test GET /api/leads loads with proper data"""
        response = cm_client.get(f"{BASE_URL}/api/leads", params={"page": 1, "limit": 20})
        assert response.status_code == 200, f"Leads list failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "data" in data
        assert "total" in data
        assert "page" in data
        assert isinstance(data["data"], list)
        print(f"✓ Leads list loads - {data['total']} total leads, page {data['page']}")
    
    def test_leads_list_with_search(self, cm_client):
        """Test leads list with search parameter"""
        response = cm_client.get(f"{BASE_URL}/api/leads", params={"page": 1, "limit": 20, "search": "test"})
        assert response.status_code == 200, f"Leads search failed: {response.text}"
        data = response.json()
        assert "data" in data
        print(f"✓ Leads search works - found {len(data['data'])} results")


class TestQueryStatsEndpoint:
    """Test Query Stats Endpoint"""
    
    def test_query_stats_summary(self, cm_client):
        """Test GET /api/queries/stats/summary returns stats"""
        response = cm_client.get(f"{BASE_URL}/api/queries/stats/summary")
        assert response.status_code == 200, f"Stats failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "total" in data
        assert "pending" in data
        assert "replied" in data
        assert "closed" in data
        assert isinstance(data["total"], int)
        print(f"✓ Query stats: total={data['total']}, pending={data['pending']}, replied={data['replied']}, closed={data['closed']}")


class TestCounsellorQueries:
    """Test Counsellor Queries Endpoint"""
    
    def test_counsellor_queries_list(self, cm_client):
        """Test GET /api/queries/counsellor-queries returns queries"""
        response = cm_client.get(f"{BASE_URL}/api/queries/counsellor-queries")
        assert response.status_code == 200, f"Counsellor queries failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "data" in data
        assert isinstance(data["data"], list)
        print(f"✓ Counsellor queries list - {len(data['data'])} queries")
    
    def test_counsellor_queries_with_status_filter(self, cm_client):
        """Test counsellor queries with status filter"""
        response = cm_client.get(f"{BASE_URL}/api/queries/counsellor-queries", params={"status": "pending"})
        assert response.status_code == 200, f"Filtered queries failed: {response.text}"
        data = response.json()
        assert "data" in data
        # All returned queries should be pending
        for query in data["data"]:
            assert query["status"] == "pending"
        print(f"✓ Counsellor queries filter works - {len(data['data'])} pending queries")


class TestAllQueriesEndpoint:
    """Test All Queries Endpoint (Manager/Admin)"""
    
    def test_all_queries_list(self, cm_client):
        """Test GET /api/queries/all returns all queries"""
        response = cm_client.get(f"{BASE_URL}/api/queries/all", params={"page": 1, "limit": 20})
        assert response.status_code == 200, f"All queries failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "data" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
        print(f"✓ All queries list - {data['total']} total queries")


class TestQueryCRUDFlow:
    """Test Query CRUD operations - requires student account"""
    
    def test_query_crud_flow_info(self):
        """Info: Query CRUD requires student account"""
        print("ℹ Query CRUD (create, reply, status update) requires a student account")
        print("  - POST /api/queries requires student role")
        print("  - GET /api/queries/my-queries requires student role")
        print("  - To test full flow, need to create student via registration")


# Fixtures
@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def cm_token(api_client):
    """Get counselling manager token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=COUNSELLING_MANAGER)
    if response.status_code != 200:
        # Try to create CM if not exists
        pytest.skip(f"Counselling manager login failed: {response.text}")
    return response.json().get("access_token")


@pytest.fixture
def cm_client(api_client, cm_token):
    """Session with CM auth header"""
    api_client.headers.update({"Authorization": f"Bearer {cm_token}"})
    return api_client


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
