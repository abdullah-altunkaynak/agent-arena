# Phase 2 Testing Guide - Community & Discussion System

Complete testing framework for Phase 2 community platform features.

## Quick Start

```bash
# Backend tests
cd backend
python -m pytest tests/test_community.py -v

# Frontend tests
cd frontend
npm test

# E2E tests with Cypress
npm run cypress:open
```

---

## Backend Unit Tests (PyTest)

### Community API Tests

```python
# tests/test_community.py

import pytest
from fastapi.testclient import TestClient
from backend.main import app
import uuid

client = TestClient(app)

class TestCommunityEndpoints:
    """Test community CRUD operations"""
    
    @pytest.fixture
    def auth_token(self):
        """Get admin auth token"""
        # Assumes default admin user exists
        response = client.post(
            "/api/auth/login",
            json={"username": "admin", "password": "admin_password"}
        )
        return response.json()["access_token"]
    
    def test_list_communities(self):
        """Test listing communities"""
        response = client.get("/api/community/communities?skip=0&limit=10")
        assert response.status_code == 200
        assert "data" in response.json() or isinstance(response.json(), list)
    
    def test_get_community_not_found(self):
        """Test getting non-existent community"""
        response = client.get(f"/api/community/communities/{uuid.uuid4()}")
        assert response.status_code == 404
    
    def test_create_community_unauthorized(self):
        """Test creating community without auth"""
        response = client.post(
            "/api/community/communities",
            json={"name": "Test Community"}
        )
        assert response.status_code in [401, 403]
    
    def test_create_community_admin_only(self, auth_token):
        """Test creating community as admin"""
        response = client.post(
            "/api/community/communities",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "name": "Test Community",
                "description": "Test description",
                "is_public": True
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Community"
        assert data["id"]
```

### Thread API Tests

```python
class TestThreadEndpoints:
    """Test thread CRUD operations"""
    
    @pytest.fixture
    def setup_thread(self, auth_token, community_id, category_id):
        """Create a test thread"""
        response = client.post(
            "/api/threads",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "Test Thread",
                "content": "This is test content for the thread discussion",
                "category_id": category_id
            }
        )
        return response.json()
    
    def test_create_thread_success(self, auth_token, category_id):
        """Test successful thread creation"""
        response = client.post(
            "/api/threads",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "New Discussion",
                "content": "Let's discuss this topic",
                "category_id": category_id
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "New Discussion"
        assert data["views_count"] == 1
        assert data["replies_count"] == 0
        assert data["author"]["id"]
    
    def test_create_thread_validation(self, auth_token, category_id):
        """Test thread creation validation"""
        # Title too short
        response = client.post(
            "/api/threads",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "Hi",
                "content": "Let's discuss this topic that is long enough",
                "category_id": category_id
            }
        )
        assert response.status_code == 422
        
        # Content too short
        response = client.post(
            "/api/threads",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "Valid Title",
                "content": "Short",
                "category_id": category_id
            }
        )
        assert response.status_code == 422
    
    def test_get_thread_increments_views(self, setup_thread):
        """Test that viewing thread increments view count"""
        thread_id = setup_thread["id"]
        initial_views = setup_thread["views_count"]
        
        response = client.get(f"/api/threads/{thread_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["views_count"] > initial_views
    
    def test_like_thread(self, auth_token, setup_thread):
        """Test liking a thread"""
        thread_id = setup_thread["id"]
        
        response = client.post(
            f"/api/threads/{thread_id}/like",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        # Get thread to verify likes updated
        response = client.get(f"/api/threads/{thread_id}")
        assert response.json()["likes_count"] > 0
    
    def test_like_thread_duplicate(self, auth_token, setup_thread):
        """Test liking thread twice returns error"""
        thread_id = setup_thread["id"]
        
        # First like
        client.post(
            f"/api/threads/{thread_id}/like",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Second like should fail
        response = client.post(
            f"/api/threads/{thread_id}/like",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 400
    
    def test_update_thread_author_only(self, auth_token, setup_thread):
        """Test updating thread as author"""
        thread_id = setup_thread["id"]
        
        response = client.put(
            f"/api/threads/{thread_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "title": "Updated Title",
                "content": "Updated content that is long enough for validation"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
    
    def test_delete_thread(self, auth_token, setup_thread):
        """Test deleting a thread"""
        thread_id = setup_thread["id"]
        
        response = client.delete(
            f"/api/threads/{thread_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        # Verify thread is deleted
        response = client.get(f"/api/threads/{thread_id}")
        assert response.status_code == 404
```

### Comment API Tests

```python
class TestCommentEndpoints:
    """Test comment CRUD operations"""
    
    def test_create_comment_success(self, auth_token, setup_thread):
        """Test successful comment creation"""
        thread_id = setup_thread["id"]
        
        response = client.post(
            f"/api/comments?thread_id={thread_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "content": "This is a thoughtful comment on the discussion"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["content"] == "This is a thoughtful comment on the discussion"
        assert data["thread_id"] == thread_id
        assert data["parent_comment_id"] is None
    
    def test_create_nested_comment(self, auth_token, setup_thread, setup_comment):
        """Test replying to a comment"""
        thread_id = setup_thread["id"]
        parent_id = setup_comment["id"]
        
        response = client.post(
            f"/api/comments?thread_id={thread_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "content": "I agree with your point",
                "parent_comment_id": parent_id
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["parent_comment_id"] == parent_id
    
    def test_get_thread_comments(self, setup_thread):
        """Test retrieving comments on thread"""
        thread_id = setup_thread["id"]
        
        response = client.get(f"/api/threads/{thread_id}/comments?skip=0&limit=20")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_like_comment(self, auth_token, setup_comment):
        """Test liking a comment"""
        comment_id = setup_comment["id"]
        
        response = client.post(
            f"/api/comments/{comment_id}/like",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        # Verify like count increased
        response = client.get(f"/api/comments/{comment_id}")
        assert response.json()["likes_count"] > 0
    
    def test_delete_comment_author_only(self, auth_token, setup_comment):
        """Test deleting comment as author"""
        comment_id = setup_comment["id"]
        
        response = client.delete(
            f"/api/comments/{comment_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        # Verify deletion
        response = client.get(f"/api/comments/{comment_id}")
        assert response.status_code == 404
```

### Moderation API Tests

```python
class TestModerationEndpoints:
    """Test moderation features"""
    
    def test_create_report(self, auth_token, setup_thread):
        """Test creating a report"""
        thread_id = setup_thread["id"]
        
        response = client.post(
            "/api/moderation/reports",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "type": "thread",
                "target_id": thread_id,
                "reason": "This content violates community standards and should be reviewed",
                "description": "Additional context about the violation"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "thread"
        assert data["status"] == "open"
    
    def test_list_reports_moderator_only(self):
        """Test that only moderators can list reports"""
        response = client.get("/api/moderation/reports")
        assert response.status_code == 401
    
    def test_pin_thread_moderator_only(self, setup_thread):
        """Test pinning thread requires moderator role"""
        thread_id = setup_thread["id"]
        
        response = client.post(
            f"/api/moderation/threads/{thread_id}/pin",
            json={"reason": "Important discussion"}
        )
        assert response.status_code == 401
    
    def test_lock_thread_moderator_only(self, mod_token, setup_thread):
        """Test locking thread as moderator"""
        thread_id = setup_thread["id"]
        
        response = client.post(
            f"/api/moderation/threads/{thread_id}/lock",
            headers={"Authorization": f"Bearer {mod_token}"},
            json={"reason": "Discussion got off topic"}
        )
        assert response.status_code == 200
        
        # Verify thread is locked
        response = client.get(f"/api/threads/{thread_id}")
        assert response.json()["is_locked"] is True
    
    def test_warn_user(self, mod_token, user_id):
        """Test issuing warning to user"""
        response = client.post(
            f"/api/moderation/users/{user_id}/warn",
            headers={"Authorization": f"Bearer {mod_token}"},
            json={
                "reason": "Multiple policy violations",
                "severity": "low"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["severity"] == "low"
```

---

## Frontend Integration Tests (Jest + React Testing Library)

### Community Pages Tests

```javascript
// frontend/__tests__/pages/community.test.js

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CommunitiesPage from '@/pages/community/index';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/community/communities', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 'test-1',
          name: 'Test Community',
          description: 'Test description',
          is_public: true,
          members_count: 100,
          threads_count: 50,
          created_at: new Date().toISOString(),
        },
      ])
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('CommunitiesPage', () => {
  test('renders communities list', async () => {
    render(<CommunitiesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Community')).toBeInTheDocument();
    });
  });

  test('filters communities by search', async () => {
    render(<CommunitiesPage />);
    
    const searchInput = await screen.findByPlaceholderText('Search communities...');
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    
    expect(screen.getByText('Test Community')).toBeInTheDocument();
  });

  test('display tabs for public and private', async () => {
    render(<CommunitiesPage />);
    
    const publicTab = await screen.findByText('Public Communities');
    const privateTab = screen.getByText('Private Communities');
    
    expect(publicTab).toBeInTheDocument();
    expect(privateTab).toBeInTheDocument();
  });

  test('redirects to signin when creating without auth', () => {
    render(<CommunitiesPage />);
    
    const createBtn = screen.getByText('Create Community');
    fireEvent.click(createBtn);
    
    // Assumes window.location.href gets modified
    expect(window.location.href).toContain('/auth/signin');
  });
});
```

### Thread Detail Tests

```javascript
// frontend/__tests__/pages/thread.test.js

describe('ThreadDetailPage', () => {
  test('renders thread with comments', async () => {
    render(<ThreadDetailPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Thread Title')).toBeInTheDocument();
      expect(screen.getByText('5 Comments')).toBeInTheDocument();
    });
  });

  test('allows posting comment when authenticated', async () => {
    localStorage.setItem('access_token', 'test-token');
    render(<ThreadDetailPage />);
    
    const textarea = await screen.findByPlaceholderText('Share your thoughts...');
    const submitBtn = screen.getByText('Post Comment');
    
    fireEvent.change(textarea, { target: { value: 'Test comment' } });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Comment posted successfully!')).toBeInTheDocument();
    });
  });

  test('shows locked thread warning', async () => {
    render(<ThreadDetailPage threadId="locked-thread" />);
    
    await waitFor(() => {
      expect(screen.getByText(/This discussion is locked/)).toBeInTheDocument();
    });
  });

  test('increments likes when clicking like button', async () => {
    localStorage.setItem('access_token', 'test-token');
    render(<ThreadDetailPage />);
    
    const likeBtn = await screen.findByText(/Likes/);
    fireEvent.click(likeBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/1 Likes/)).toBeInTheDocument();
    });
  });
});
```

### Moderation Component Tests

```javascript
// frontend/__tests__/components/ModerationMenu.test.js

describe('ModerationMenu', () => {
  test('only shows for moderators', () => {
    const { queryByRole } = render(
      <ModerationMenu contentId="test" canModerate={false} />
    );
    
    expect(queryByRole('button')).not.toBeInTheDocument();
  });

  test('shows moderation options for moderators', () => {
    render(
      <ModerationMenu
        contentType="thread"
        contentId="test"
        canModerate={true}
      />
    );
    
    const menuBtn = screen.getByRole('button');
    fireEvent.click(menuBtn);
    
    expect(screen.getByText('Pin Thread')).toBeInTheDocument();
    expect(screen.getByText('Lock Thread')).toBeInTheDocument();
    expect(screen.getByText('Delete Thread')).toBeInTheDocument();
  });

  test('can pin thread', async () => {
    render(
      <ModerationMenu
        contentType="thread"
        contentId="test-123"
        canModerate={true}
      />
    );
    
    const menuBtn = screen.getByRole('button');
    fireEvent.click(menuBtn);
    
    const pinBtn = screen.getByText('Pin Thread');
    fireEvent.click(pinBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/Reason for pin/)).toBeInTheDocument();
    });
  });
});
```

---

## E2E Tests (Cypress)

### Community Workflow

```javascript
// cypress/e2e/community.spec.js

describe('Community Workflow', () => {
  beforeEach(() => {
    cy.login('testuser@example.com', 'password');
    cy.visit('/community');
  });

  it('should browse communities', () => {
    cy.get('[data-testid="community-card"]').should('have.length.greaterThan', 0);
    cy.contains('Test Community').click();
    cy.url().should('include', '/community/');
  });

  it('should view community details', () => {
    cy.get('[data-testid="community-card"]').first().click();
    cy.contains('Members').should('be.visible');
    cy.contains('Discussions').should('be.visible');
  });

  it('should create thread in community', () => {
    cy.get('[data-testid="community-card"]').first().click();
    cy.contains('Start Discussion').click();
    cy.url().should('include', '/create-thread');
    
    cy.get('input[placeholder*="What"]').type('Test Discussion Title');
    cy.get('textarea').type('This is a test discussion with enough content to be valid');
    cy.contains('button', 'Create Discussion').click();
    
    cy.contains('Discussion Created!').should('be.visible');
  });

  it('should post comment on thread', () => {
    cy.visit('/community/test-community/thread/test-thread');
    cy.get('textarea[placeholder*="thoughts"]').type('Great discussion!');
    cy.contains('button', 'Post Comment').click();
    cy.contains('Comment posted successfully').should('be.visible');
  });

  it('should like thread', () => {
    cy.visit('/community/test-community/thread/test-thread');
    cy.contains('button', /Likes/).click();
    cy.contains('1 Likes').should('be.visible');
  });

  it('should report inappropriate content', () => {
    cy.visit('/community/test-community/thread/test-thread');
    cy.get('[data-testid="more-menu"]').click();
    cy.contains('Report').click();
    
    cy.get('select').select('harassment');
    cy.get('textarea').type('This content violates community guidelines');
    cy.contains('button', 'Submit Report').click();
    
    cy.contains('Report Submitted').should('be.visible');
  });
});
```

### Moderation Workflow

```javascript
// cypress/e2e/moderation.spec.js

describe('Moderation Workflow', () => {
  beforeEach(() => {
    cy.login('moderator@example.com', 'moderator_password');
  });

  it('should access moderation dashboard', () => {
    cy.visit('/moderation/dashboard');
    cy.contains('Moderation Dashboard').should('be.visible');
    cy.contains('Open Reports').should('be.visible');
  });

  it('should view and update reports', () => {
    cy.visit('/moderation/dashboard');
    cy.contains('Open Reports').parent().contains(/\d+/).click();
    cy.get('select').select('reviewing');
    cy.contains('button', 'Confirm').click();
  });

  it('should pin thread from dashboard', () => {
    cy.visit('/community/test-community/thread/test-thread');
    cy.get('[data-testid="mod-menu"]').click();
    cy.contains('Pin Thread').click();
    cy.get('textarea').type('Important discussion for the community');
    cy.contains('button', 'Confirm').click();
    
    cy.contains('📌 Pinned').should('be.visible');
  });

  it('should lock thread to prevent comments', () => {
    cy.visit('/community/test-community/thread/test-thread');
    cy.get('[data-testid="mod-menu"]').click();
    cy.contains('Lock Thread').click();
    cy.get('textarea').type('Discussion concluded');
    cy.contains('button', 'Confirm').click();
    
    cy.contains('This discussion is locked').should('be.visible');
  });

  it('should delete inappropriate content', () => {
    cy.visit('/community/test-community/thread/spam-thread');
    cy.get('[data-testid="mod-menu"]').click();
    cy.contains('Delete Thread').click();
    cy.get('textarea').type('Spam content');
    cy.contains('button', 'Confirm').click();
    
    cy.url().should('not.include', 'spam-thread');
  });

  it('should issue user warning', () => {
    cy.visit('/moderation/dashboard');
    cy.contains('[data-testid="user-warning"]').first().click();
    cy.contains('Issue Warning').click();
    
    cy.get('select').select('low');
    cy.get('textarea').type('Warning for policy violation');
    cy.contains('button', 'Submit').click();
    
    cy.contains('Warning issued').should('be.visible');
  });
});
```

---

## Performance Tests

```bash
# Test response times with Apache Bench
ab -n 1000 -c 10 http://localhost:8000/api/community/communities

# Simulate high load with wrk
wrk -t12 -c400 -d30s http://localhost:8000/api/community/communities
```

---

## Security Tests

### Rate Limiting
- Test creating 100 reports in 1 minute
- Verify 429 (Too Many Requests) response

### SQL Injection
```bash
curl "http://localhost:8000/api/threads?search='; DROP TABLE threads;--"
# Should return 400 or sanitized result, never execute
```

### XSS Prevention
```javascript
// Test creating thread with XSS payload
const thread = {
  title: '<script>alert("xss")</script>',
  content: 'Safe content'
};
// Verify script tags are escaped in response
```

---

## Success Criteria

✅ All unit tests pass  
✅ All integration tests pass  
✅ E2E workflows complete successfully  
✅ No security vulnerabilities found  
✅ API response times < 500ms  
✅ Frontend components render correctly  
✅ Moderation features work as expected  

---

## Running Tests

```bash
# Run all backend tests with coverage
pytest tests/ --cov=backend --cov-report=html

# Run all frontend tests with coverage
npm test -- --coverage

# Run specific test file
pytest tests/test_community.py::TestCommunityEndpoints::test_list_communities -v

# Run with fixtures
npm test -- CommentForm.test.js

# Run E2E tests headless
npx cypress run

# Run E2E tests in headed mode
npx cypress open
```

---

## Continuous Integration

Tests should run automatically on:
- Every commit to `develop` branch
- Every pull request
- Before production deployment

### GitHub Actions Example

```yaml
name: Phase 2 Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - run: pip install pytest pytest-cov
      - run: pytest tests/ --cov=backend
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test -- --coverage
      - run: npx cypress run
```

