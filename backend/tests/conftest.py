"""
Pytest configuration and shared fixtures for all backend tests
"""

import pytest
import uuid
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import your app and models
from backend.main import app
from backend.engine.base_agent import Base

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Create fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    yield TestingSessionLocal()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client():
    """FastAPI test client"""
    return TestClient(app)


@pytest.fixture(scope="function")
def admin_token(client):
    """Get admin user JWT token"""
    # Assuming your app has auth endpoints
    # This is a placeholder - adjust based on your actual auth
    return "test-admin-token-12345"


@pytest.fixture(scope="function")
def moderator_token(client):
    """Get moderator user JWT token"""
    return "test-moderator-token-12345"


@pytest.fixture(scope="function")
def user_token(client):
    """Get regular user JWT token"""
    return "test-user-token-12345"


@pytest.fixture(scope="function")
def test_community_id():
    """Generate test community ID"""
    return str(uuid.uuid4())


@pytest.fixture(scope="function")
def test_category_id():
    """Generate test category ID"""
    return str(uuid.uuid4())


@pytest.fixture(scope="function")
def test_thread_id():
    """Generate test thread ID"""
    return str(uuid.uuid4())


@pytest.fixture(scope="function")
def test_comment_id():
    """Generate test comment ID"""
    return str(uuid.uuid4())


@pytest.fixture(scope="function")
def test_user_id():
    """Generate test user ID"""
    return str(uuid.uuid4())


# Markers for test categorization
def pytest_configure(config):
    config.addinivalue_line("markers", "unit: mark test as a unit test")
    config.addinivalue_line("markers", "integration: mark test as an integration test")
    config.addinivalue_line("markers", "slow: mark test as slow running")
    config.addinivalue_line("markers", "security: mark test as security test")
