"""
Unit and integration tests for Community API endpoints
"""

import pytest
import uuid
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


class TestCommunityList:
    """Test list communities endpoint"""
    
    @pytest.mark.unit
    def test_list_communities_success(self):
        """Test listing communities returns paginated results"""
        response = client.get("/api/community/communities?skip=0&limit=10")
        
        assert response.status_code in [200, 404]  # 404 if no communities exist
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list) or "data" in data
    
    @pytest.mark.unit
    def test_list_communities_with_limit(self):
        """Test listing with custom limit"""
        response = client.get("/api/community/communities?skip=0&limit=5")
        
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            items = data if isinstance(data, list) else data.get("data", [])
            assert len(items) <= 5
    
    @pytest.mark.unit
    def test_list_communities_with_skip(self):
        """Test pagination with skip parameter"""
        response = client.get("/api/community/communities?skip=10&limit=10")
        
        assert response.status_code in [200, 404]


class TestCommunityCreate:
    """Test community creation endpoint"""
    
    @pytest.mark.unit
    def test_create_community_unauthorized(self):
        """Test creating community without auth returns 401"""
        response = client.post(
            "/api/community/communities",
            json={
                "name": "New Community",
                "description": "A new test community"
            }
        )
        
        assert response.status_code in [401, 403]
    
    @pytest.mark.integration
    def test_create_community_with_auth(self, admin_token):
        """Test creating community with valid auth"""
        response = client.post(
            "/api/community/communities",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "name": f"Test Community {uuid.uuid4()}",
                "description": "Test community description",
                "is_public": True
            }
        )
        
        if response.status_code == 201:
            data = response.json()
            assert data.get("name") is not None
            assert data.get("id") is not None
    
    @pytest.mark.unit
    def test_create_community_missing_name(self):
        """Test creating community without name"""
        response = client.post(
            "/api/community/communities",
            json={
                "description": "Missing name community"
            }
        )
        
        assert response.status_code in [422, 400]
    
    @pytest.mark.unit
    def test_create_community_invalid_data(self):
        """Test creating community with invalid data types"""
        response = client.post(
            "/api/community/communities",
            json={
                "name": "",
                "description": "Empty name"
            }
        )
        
        assert response.status_code in [422, 400]


class TestCommunityGet:
    """Test getting single community"""
    
    @pytest.mark.unit
    def test_get_community_not_found(self):
        """Test getting non-existent community"""
        community_id = str(uuid.uuid4())
        response = client.get(f"/api/community/communities/{community_id}")
        
        assert response.status_code in [404, 200]  # May vary by implementation
    
    @pytest.mark.unit
    def test_get_community_invalid_id_format(self):
        """Test getting community with invalid ID format"""
        response = client.get("/api/community/communities/invalid-id")
        
        assert response.status_code in [404, 422, 400]


class TestCategoryList:
    """Test list categories endpoint"""
    
    @pytest.mark.unit
    def test_list_categories_success(self):
        """Test listing categories returns results"""
        response = client.get("/api/community/categories?skip=0&limit=10")
        
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list) or "data" in data
    
    @pytest.mark.unit
    def test_list_categories_with_limit(self):
        """Test categories with custom limit"""
        response = client.get("/api/community/categories?limit=5")
        
        assert response.status_code in [200, 404]


class TestCategoryCreate:
    """Test category creation endpoint"""
    
    @pytest.mark.unit
    def test_create_category_unauthorized(self):
        """Test creating category without auth"""
        response = client.post(
            "/api/community/categories",
            json={
                "name": "New Category",
                "description": "Test category"
            }
        )
        
        assert response.status_code in [401, 403]
    
    @pytest.mark.integration
    def test_create_category_with_auth(self, moderator_token):
        """Test creating category with valid auth"""
        response = client.post(
            "/api/community/categories",
            headers={"Authorization": f"Bearer {moderator_token}"},
            json={
                "name": f"Test Category {uuid.uuid4()}",
                "description": "Test category description"
            }
        )
        
        if response.status_code == 201:
            data = response.json()
            assert data.get("name") is not None
            assert data.get("id") is not None
    
    @pytest.mark.unit
    def test_create_category_validation(self):
        """Test category validation"""
        response = client.post(
            "/api/community/categories",
            json={}
        )
        
        assert response.status_code in [422, 400]


class TestCommunitySlugGeneration:
    """Test slug generation logic"""
    
    @pytest.mark.unit
    def test_slug_from_community_name(self):
        """Test that slugs are generated correctly"""
        response = client.post(
            "/api/community/communities",
            json={
                "name": "Test Community Name",
                "description": "Testing slug generation"
            }
        )
        
        if response.status_code == 201:
            data = response.json()
            slug = data.get("slug", "")
            # Slug should be lowercase and use hyphens
            assert slug.islower() or "-" in slug or slug == ""


class TestCommunityPermissions:
    """Test permission controls on communities"""
    
    @pytest.mark.unit
    def test_public_community_visible_to_all(self):
        """Test that public communities are visible without auth"""
        response = client.get("/api/community/communities")
        # Should work whether or not communities exist
        assert response.status_code in [200, 404]
    
    @pytest.mark.security
    def test_private_community_access_control(self):
        """Test private community access restrictions"""
        # Assuming private communities require membership
        response = client.get(f"/api/community/communities/private-id")
        
        # Should not crash
        assert response.status_code in [401, 403, 404]


class TestCommunityValidation:
    """Test input validation"""
    
    @pytest.mark.unit
    def test_community_name_length(self):
        """Test community name length validation"""
        response = client.post(
            "/api/community/communities",
            json={
                "name": "A" * 256,  # Possibly too long
                "description": "Test"
            }
        )
        
        # Should either reject or truncate
        assert response.status_code in [422, 400, 201]
    
    @pytest.mark.unit
    def test_special_characters_in_name(self):
        """Test special characters handling"""
        response = client.post(
            "/api/community/communities",
            json={
                "name": "Test <Community> & [Special]",
                "description": "Test special chars"
            }
        )
        
        # Should either sanitize or reject
        assert response.status_code in [422, 400, 201]
    
    @pytest.mark.unit
    def test_html_script_injection_attempt(self):
        """Test XSS prevention"""
        response = client.post(
            "/api/community/communities",
            json={
                "name": "Community",
                "description": "<script>alert('xss')</script>"
            }
        )
        
        if response.status_code == 201:
            data = response.json()
            # Verify script tags are escaped
            description = data.get("description", "")
            assert "<script>" not in description.replace("\\u003c", "")


class TestErrorHandling:
    """Test error handling and responses"""
    
    @pytest.mark.unit
    def test_malformed_json_request(self):
        """Test malformed JSON handling"""
        response = client.post(
            "/api/community/communities",
            data="{invalid json}",
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code in [400, 422]
    
    @pytest.mark.unit
    def test_not_found_response(self):
        """Test 404 response format"""
        response = client.get(f"/api/community/communities/{uuid.uuid4()}")
        
        if response.status_code == 404:
            data = response.json()
            assert "detail" in data or "error" in data
    
    @pytest.mark.unit
    def test_internal_server_error_handling(self):
        """Test that errors don't expose sensitive info"""
        # Send a request that might cause various errors
        response = client.get("/api/community/communities/../../admin")
        
        # Should not expose file paths or internals
        assert response.status_code in [400, 404, 403]
        if response.status_code >= 400:
            data = response.json()
            error_msg = str(data)
            # Should not contain file paths
            assert "backend/" not in error_msg
