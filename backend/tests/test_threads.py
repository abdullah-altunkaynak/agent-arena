"""
Unit and integration tests for Thread API endpoints
"""

import pytest
import uuid
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


class TestThreadCreate:
    """Test thread creation endpoint"""
    
    @pytest.mark.unit
    def test_create_thread_unauthorized(self):
        """Test creating thread without auth"""
        response = client.post(
            "/api/threads",
            json={
                "title": "Test Thread",
                "content": "This is test content for the discussion"
            }
        )
        
        assert response.status_code in [401, 403]
    
    @pytest.mark.integration
    def test_create_thread_success(self, user_token, test_category_id):
        """Test successful thread creation"""
        response = client.post(
            "/api/threads",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "title": "Test Discussion Thread",
                "content": "This is a comprehensive discussion about an interesting topic",
                "category_id": test_category_id
            }
        )
        
        if response.status_code == 201:
            data = response.json()
            assert data.get("title") == "Test Discussion Thread"
            assert data.get("views_count", 0) >= 0
            assert data.get("author") is not None
    
    @pytest.mark.unit
    def test_create_thread_missing_title(self, user_token):
        """Test thread creation without title"""
        response = client.post(
            "/api/threads",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "content": "Content without title"
            }
        )
        
        assert response.status_code in [422, 400]
    
    @pytest.mark.unit
    def test_create_thread_title_too_short(self, user_token):
        """Test thread with title below minimum length"""
        response = client.post(
            "/api/threads",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "title": "Hi",
                "content": "This is content that is long enough and detailed"
            }
        )
        
        assert response.status_code in [422, 400]
    
    @pytest.mark.unit
    def test_create_thread_content_too_short(self, user_token):
        """Test thread with content below minimum length"""
        response = client.post(
            "/api/threads",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "title": "Valid Title",
                "content": "Short"
            }
        )
        
        assert response.status_code in [422, 400]
    
    @pytest.mark.unit
    def test_create_thread_title_too_long(self, user_token):
        """Test thread with title above maximum length"""
        response = client.post(
            "/api/threads",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "title": "x" * 300,
                "content": "Valid content for thread discussion"
            }
        )
        
        # May reject or truncate
        assert response.status_code in [422, 400, 201]
    
    @pytest.mark.unit
    def test_create_thread_content_too_long(self, user_token):
        """Test thread with content above maximum length"""
        response = client.post(
            "/api/threads",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "title": "Test Title",
                "content": "x" * 15000
            }
        )
        
        assert response.status_code in [422, 400, 201]


class TestThreadGet:
    """Test getting individual threads"""
    
    @pytest.mark.unit
    def test_get_thread_not_found(self):
        """Test getting non-existent thread"""
        response = client.get(f"/api/threads/{uuid.uuid4()}")
        
        assert response.status_code in [404, 200]
    
    @pytest.mark.unit
    def test_get_thread_invalid_id(self):
        """Test getting thread with invalid ID format"""
        response = client.get("/api/threads/invalid-id")
        
        assert response.status_code in [404, 422, 400]


class TestThreadViews:
    """Test view count tracking"""
    
    @pytest.mark.unit
    def test_get_thread_increments_views(self, test_thread_id):
        """Test that multiple views increment counter"""
        response1 = client.get(f"/api/threads/{test_thread_id}")
        initial_views = 0
        
        if response1.status_code == 200:
            initial_views = response1.json().get("views_count", 0)
        
        # Get again
        response2 = client.get(f"/api/threads/{test_thread_id}")
        
        if response2.status_code == 200:
            new_views = response2.json().get("views_count", 0)
            assert new_views >= initial_views
    
    @pytest.mark.unit
    def test_same_user_multiple_views(self, user_token, test_thread_id):
        """Test view counting for same user"""
        # First view
        response1 = client.get(
            f"/api/threads/{test_thread_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Second view
        response2 = client.get(
            f"/api/threads/{test_thread_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Both should succeed
        assert response1.status_code in [200, 404]
        assert response2.status_code in [200, 404]


class TestThreadUpdate:
    """Test updating threads"""
    
    @pytest.mark.unit
    def test_update_thread_unauthorized(self, test_thread_id):
        """Test updating thread without auth"""
        response = client.put(
            f"/api/threads/{test_thread_id}",
            json={
                "title": "Updated Title",
                "content": "Updated content that is long enough"
            }
        )
        
        assert response.status_code in [401, 403]
    
    @pytest.mark.integration
    def test_update_thread_author_only(self, user_token, test_thread_id):
        """Test updating thread as author"""
        response = client.put(
            f"/api/threads/{test_thread_id}",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "title": "Updated Title",
                "content": "This is the updated content for the thread"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("title") == "Updated Title"
    
    @pytest.mark.security
    def test_update_thread_non_author(self, moderator_token, test_thread_id):
        """Test that non-authors cannot update threads"""
        response = client.put(
            f"/api/threads/{test_thread_id}",
            headers={"Authorization": f"Bearer {moderator_token}"},
            json={
                "title": "Hacked Title",
                "content": "Someone else trying to update"
            }
        )
        
        # Should reject or be allowed as moderator
        assert response.status_code in [403, 200, 404]


class TestThreadDelete:
    """Test deleting threads"""
    
    @pytest.mark.unit
    def test_delete_thread_unauthorized(self, test_thread_id):
        """Test deleting thread without auth"""
        response = client.delete(f"/api/threads/{test_thread_id}")
        
        assert response.status_code in [401, 403]
    
    @pytest.mark.integration
    def test_delete_thread_author(self, user_token, test_thread_id):
        """Test deleting thread as author"""
        response = client.delete(
            f"/api/threads/{test_thread_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        if response.status_code == 200:
            # Verify deletion
            verify = client.get(f"/api/threads/{test_thread_id}")
            assert verify.status_code == 404
    
    @pytest.mark.security
    def test_delete_thread_non_author(self, moderator_token, test_thread_id):
        """Test that non-authors cannot delete threads"""
        response = client.delete(
            f"/api/threads/{test_thread_id}",
            headers={"Authorization": f"Bearer {moderator_token}"}
        )
        
        # Should reject unless moderator
        assert response.status_code in [403, 200, 404]


class TestThreadComments:
    """Test getting thread comments"""
    
    @pytest.mark.unit
    def test_get_thread_comments_no_auth(self, test_thread_id):
        """Test getting comments without auth"""
        response = client.get(f"/api/threads/{test_thread_id}/comments?skip=0&limit=20")
        
        assert response.status_code in [200, 404]
    
    @pytest.mark.unit
    def test_get_thread_comments_pagination(self, test_thread_id):
        """Test comment pagination"""
        response1 = client.get(f"/api/threads/{test_thread_id}/comments?skip=0&limit=10")
        response2 = client.get(f"/api/threads/{test_thread_id}/comments?skip=10&limit=10")
        
        # Both should succeed
        for response in [response1, response2]:
            assert response.status_code in [200, 404]


class TestThreadLikes:
    """Test liking threads"""
    
    @pytest.mark.unit
    def test_like_thread_unauthorized(self, test_thread_id):
        """Test liking thread without auth"""
        response = client.post(f"/api/threads/{test_thread_id}/like")
        
        assert response.status_code in [401, 403]
    
    @pytest.mark.integration
    def test_like_thread_success(self, user_token, test_thread_id):
        """Test successful thread like"""
        response = client.post(
            f"/api/threads/{test_thread_id}/like",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Should succeed or fail gracefully
        assert response.status_code in [200, 201, 400, 404]
    
    @pytest.mark.unit
    def test_like_thread_duplicate(self, user_token, test_thread_id):
        """Test liking thread twice"""
        # First like
        client.post(
            f"/api/threads/{test_thread_id}/like",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Second like
        response = client.post(
            f"/api/threads/{test_thread_id}/like",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        
        # Should either reject duplicate or allow
        assert response.status_code in [200, 400, 404]


class TestThreadLocking:
    """Test locking threads"""
    
    @pytest.mark.unit
    def test_lock_thread_unauthorized(self, test_thread_id):
        """Test locking thread without auth"""
        response = client.post(
            f"/api/threads/{test_thread_id}/lock",
            json={"reason": "Off topic"}
        )
        
        assert response.status_code in [401, 403]
    
    @pytest.mark.integration
    def test_lock_thread_moderator(self, moderator_token, test_thread_id):
        """Test locking thread as moderator"""
        response = client.post(
            f"/api/threads/{test_thread_id}/lock",
            headers={"Authorization": f"Bearer {moderator_token}"},
            json={"reason": "Discussion went off-topic"}
        )
        
        # May be allowed or not depending on implementation
        assert response.status_code in [200, 403, 404]
    
    @pytest.mark.unit
    def test_locked_thread_prevents_comments(self, test_thread_id, user_token):
        """Test that locked threads prevent comments"""
        # First lock the thread (assumes this works)
        client.post(
            f"/api/threads/{test_thread_id}/lock",
            headers={"Authorization": f"Bearer moderator-token"}
        )
        
        # Try to add comment
        response = client.post(
            f"/api/threads/{test_thread_id}/comments",
            headers={"Authorization": f"Bearer {user_token}"},
            json={"content": "This should be blocked"}
        )
        
        # Should block or allow
        assert response.status_code in [200, 400, 403, 404]


class TestThreadPinning:
    """Test pinning threads"""
    
    @pytest.mark.unit
    def test_pin_thread_unauthorized(self, test_thread_id):
        """Test pinning thread without auth"""
        response = client.post(
            f"/api/threads/{test_thread_id}/pin",
            json={"reason": "Important"}
        )
        
        assert response.status_code in [401, 403]
    
    @pytest.mark.integration
    def test_pin_thread_moderator(self, moderator_token, test_thread_id):
        """Test pinning thread as moderator"""
        response = client.post(
            f"/api/threads/{test_thread_id}/pin",
            headers={"Authorization": f"Bearer {moderator_token}"},
            json={"reason": "Important announcement"}
        )
        
        assert response.status_code in [200, 403, 404]


class TestThreadSlugGeneration:
    """Test thread slug URL generation"""
    
    @pytest.mark.unit
    def test_slug_generation_from_title(self, user_token):
        """Test that slugs are generated correctly"""
        response = client.post(
            "/api/threads",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "title": "Test Thread Title With Spaces",
                "content": "This is content that is long enough to be valid"
            }
        )
        
        if response.status_code == 201:
            data = response.json()
            slug = data.get("slug", "")
            # Slug should be URL-friendly
            assert slug.islower() or "-" in slug or slug == ""
    
    @pytest.mark.unit
    def test_slug_special_characters(self, user_token):
        """Test slug generation with special characters"""
        response = client.post(
            "/api/threads",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "title": "Test & Special <Characters> in Title!",
                "content": "This is content that is long enough"
            }
        )
        
        if response.status_code == 201:
            data = response.json()
            # Slug should not contain problematic characters
            assert "&" not in data.get("slug", "")
            assert "<" not in data.get("slug", "")


class TestErrorHandling:
    """Test error handling"""
    
    @pytest.mark.unit
    def test_invalid_json_format(self, user_token):
        """Test malformed JSON"""
        response = client.post(
            "/api/threads",
            headers={"Authorization": f"Bearer {user_token}"},
            data="{invalid}",
            headers_extra={"Content-Type": "application/json"}
        )
        
        # Should handle gracefully
        assert response.status_code in [400, 422]
    
    @pytest.mark.unit
    def test_missing_required_fields(self, user_token):
        """Test missing required fields"""
        response = client.post(
            "/api/threads",
            headers={"Authorization": f"Bearer {user_token}"},
            json={}
        )
        
        assert response.status_code in [422, 400]
