"""
Targeted tests for community gamification and media endpoints.
"""

from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from backend.main import app
import agents.community.router as community_router_mod


client = TestClient(app)


class QueryStub:
    def __init__(self, rows):
        self.rows = list(rows)
        self._filters = []
        self._in_filter = None
        self._order = None
        self._range = None

    def select(self, _fields):
        return self

    def eq(self, key, value):
        self._filters.append((key, value))
        return self

    def in_(self, key, values):
        self._in_filter = (key, set(values))
        return self

    def limit(self, value):
        self._range = (0, value - 1)
        return self

    def order(self, key, desc=False):
        self._order = (key, desc)
        return self

    def range(self, start, end):
        self._range = (start, end)
        return self

    def execute(self):
        data = self.rows

        for key, value in self._filters:
            data = [row for row in data if row.get(key) == value]

        if self._in_filter:
            key, values = self._in_filter
            data = [row for row in data if row.get(key) in values]

        if self._order:
            key, desc = self._order
            data = sorted(data, key=lambda row: row.get(key, 0), reverse=desc)

        if self._range:
            start, end = self._range
            data = data[start:end + 1]

        return SimpleNamespace(data=data)


class FakeSupabaseClient:
    def __init__(self):
        self.tables = {
            "user_profiles": [
                {"user_id": "u1", "points_total": 350, "level": 4, "threads_count": 7, "comments_count": 21},
                {"user_id": "u2", "points_total": 120, "level": 2, "threads_count": 2, "comments_count": 8},
            ],
            "users": [
                {"id": "u1", "username": "alpha", "full_name": "Alpha User", "avatar_url": None},
                {"id": "u2", "username": "beta", "full_name": "Beta User", "avatar_url": None},
            ],
            "user_badges": [
                {
                    "user_id": "u1",
                    "earned_at": "2026-04-20T10:00:00Z",
                    "badges": {"id": "b1", "name": "Contributor", "description": "100 XP", "icon": "🌟"},
                }
            ],
        }

    def table(self, table_name):
        return QueryStub(self.tables.get(table_name, []))


@pytest.fixture
def patched_router(monkeypatch):
    fake_db = SimpleNamespace(client=FakeSupabaseClient())
    monkeypatch.setattr(community_router_mod, "db_client", fake_db)
    monkeypatch.setattr(
        community_router_mod.JWTHandler,
        "verify_token",
        lambda _token, token_type="access": {"sub": "u1"} if token_type == "access" else None,
    )


@pytest.mark.unit
def test_gamification_leaderboard_returns_ranked_users(patched_router):
    response = client.get("/api/community/gamification/leaderboard?limit=2")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    assert data[0]["rank"] == 1
    assert data[0]["username"] == "alpha"
    assert data[0]["points_total"] >= data[1]["points_total"]


@pytest.mark.unit
def test_gamification_progress_requires_auth():
    response = client.get("/api/community/gamification/progress")
    assert response.status_code == 401


@pytest.mark.unit
def test_gamification_progress_returns_level_data(patched_router):
    response = client.get(
        "/api/community/gamification/progress",
        headers={"Authorization": "Bearer fake-token"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "u1"
    assert data["points_total"] == 350
    assert data["level"] == 4
    assert data["points_to_next_level"] == 50


@pytest.mark.unit
def test_gamification_badges_returns_badges(patched_router):
    response = client.get(
        "/api/community/gamification/badges",
        headers={"Authorization": "Bearer fake-token"},
    )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["name"] == "Contributor"


@pytest.mark.unit
def test_media_endpoint_rejects_invalid_kind():
    response = client.get("/api/community/communities/demo-id/media/not-valid")
    assert response.status_code == 400
