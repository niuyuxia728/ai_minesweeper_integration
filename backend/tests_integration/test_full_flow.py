import pytest
import os
import sys
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure project root is on sys.path so `import app` works
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# Override environment variable for test database
os.environ["DATABASE_URL"] = "sqlite:///./test_minesweeper.db"

from app.main import app
from app.database import Base, get_db

# Test database setup (same as conftest.py)
TEST_DATABASE_URL = "sqlite:///./test_minesweeper.db"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function")
def test_client():
    """Test client that uses the test database"""
    with TestClient(app) as client:
        yield client

@pytest.fixture(scope="function")
def registered_user(test_client):
    """Fixture that registers a test user and returns their credentials"""
    import uuid
    unique_id = str(uuid.uuid4())[:8]  # Short unique identifier

    user_data = {
        "username": f"testuser_{unique_id}",
        "email": f"test_{unique_id}@example.com",
        "password": "testpass123"
    }

    response = test_client.post("/auth/signup", json=user_data)
    assert response.status_code == 200

    response_data = response.json()
    assert response_data["success"] == True, f"Signup failed: {response_data.get('error')}"
    assert "user" in response_data
    assert response_data["user"] is not None

    return {
        "user_data": user_data,
        "user_id": response_data["user"]["id"]
    }

class TestUserAuthentication:
    """Test user registration, login, and profile retrieval"""

    def test_user_registration_success(self, test_client):
        """Test successful user registration"""
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "password123"
        }

        response = test_client.post("/auth/signup", json=user_data)
        assert response.status_code == 200

        data = response.json()
        assert data["success"] == True
        assert data["user"]["username"] == user_data["username"]
        assert data["user"]["email"] == user_data["email"]
        assert "id" in data["user"]
        assert "createdAt" in data["user"]

    def test_user_registration_duplicate_email(self, test_client):
        """Test registration fails with duplicate email"""
        user_data = {
            "username": "user1",
            "email": "duplicate@example.com",
            "password": "password123"
        }

        # First registration should succeed
        response1 = test_client.post("/auth/signup", json=user_data)
        assert response1.status_code == 200

        # Second registration with same email should fail
        user_data["username"] = "user2"
        response2 = test_client.post("/auth/signup", json=user_data)
        assert response2.status_code == 200
        assert response2.json()["success"] == False
        assert "Email already registered" in response2.json()["error"]

    def test_user_registration_duplicate_username(self, test_client):
        """Test registration fails with duplicate username"""
        user_data = {
            "username": "duplicateuser",
            "email": "email1@example.com",
            "password": "password123"
        }

        # First registration should succeed
        response1 = test_client.post("/auth/signup", json=user_data)
        assert response1.status_code == 200

        # Second registration with same username should fail
        user_data["email"] = "email2@example.com"
        response2 = test_client.post("/auth/signup", json=user_data)
        assert response2.status_code == 200
        assert response2.json()["success"] == False
        assert "Username already taken" in response2.json()["error"]

    def test_user_login_success(self, test_client, registered_user):
        """Test successful user login"""
        login_data = {
            "email": registered_user["user_data"]["email"],
            "password": registered_user["user_data"]["password"]
        }

        response = test_client.post("/auth/login", json=login_data)
        assert response.status_code == 200

        data = response.json()
        assert data["success"] == True
        assert data["user"]["username"] == registered_user["user_data"]["username"]
        assert data["user"]["email"] == registered_user["user_data"]["email"]

    def test_user_login_wrong_password(self, test_client, registered_user):
        """Test login fails with wrong password"""
        login_data = {
            "email": registered_user["user_data"]["email"],
            "password": "wrongpassword"
        }

        response = test_client.post("/auth/login", json=login_data)
        assert response.status_code == 200
        assert response.json()["success"] == False
        assert "Invalid password" in response.json()["error"]

    def test_user_login_nonexistent_email(self, test_client):
        """Test login fails with nonexistent email"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "password123"
        }

        response = test_client.post("/auth/login", json=login_data)
        assert response.status_code == 200
        assert response.json()["success"] == False
        assert "User not found" in response.json()["error"]

    def test_get_user_profile(self, test_client, registered_user):
        """Test retrieving user profile with authentication header"""
        headers = {"X-User-Id": registered_user["user_id"]}

        response = test_client.get("/auth/me", headers=headers)
        assert response.status_code == 200

        data = response.json()
        assert data["username"] == registered_user["user_data"]["username"]
        assert data["email"] == registered_user["user_data"]["email"]
        assert data["id"] == registered_user["user_id"]

    def test_get_user_profile_no_auth(self, test_client):
        """Test retrieving user profile fails without authentication"""
        response = test_client.get("/auth/me")
        assert response.status_code == 401

    def test_get_all_users(self, test_client, registered_user):
        """Test getting all registered users (requires authentication)"""
        headers = {"X-User-Id": registered_user["user_id"]}

        response = test_client.get("/users", headers=headers)
        assert response.status_code == 200

        users = response.json()
        assert isinstance(users, list)
        assert len(users) >= 1  # At least our registered user

        # Check that our user is in the list
        our_user = next((u for u in users if u["id"] == registered_user["user_id"]), None)
        assert our_user is not None
        assert our_user["username"] == registered_user["user_data"]["username"]
        assert our_user["email"] == registered_user["user_data"]["email"]

    def test_get_all_users_no_auth(self, test_client):
        """Test getting all users fails without authentication"""
        response = test_client.get("/users")
        assert response.status_code == 401

class TestLeaderboard:
    """Test leaderboard functionality"""

    def test_get_empty_leaderboard(self, test_client):
        """Test getting leaderboard when it's empty"""
        response = test_client.get("/leaderboard")
        assert response.status_code == 200
        assert response.json() == []

    def test_submit_and_get_score(self, test_client, registered_user):
        """Test submitting a score and retrieving it from leaderboard"""
        score_data = {
            "username": registered_user["user_data"]["username"],
            "time": 42,
            "difficulty": "easy"
        }

        # Submit score
        response = test_client.post("/leaderboard", json=score_data)
        assert response.status_code == 201

        data = response.json()
        assert data["username"] == score_data["username"]
        assert data["time"] == score_data["time"]
        assert data["difficulty"] == score_data["difficulty"]

        # Get leaderboard
        response = test_client.get("/leaderboard")
        assert response.status_code == 200

        leaderboard = response.json()
        assert len(leaderboard) == 1
        assert leaderboard[0]["username"] == score_data["username"]
        assert leaderboard[0]["time"] == score_data["time"]
        assert leaderboard[0]["difficulty"] == score_data["difficulty"]

    def test_multiple_scores_sorted(self, test_client, registered_user):
        """Test multiple scores are sorted by time (ascending)"""
        # Get initial leaderboard count
        initial_response = test_client.get("/leaderboard")
        initial_count = len(initial_response.json())

        scores = [
            {"username": registered_user["user_data"]["username"], "time": 60, "difficulty": "easy"},
            {"username": "otheruser", "time": 30, "difficulty": "easy"},
            {"username": registered_user["user_data"]["username"], "time": 45, "difficulty": "medium"},
        ]

        # Submit all scores
        for score in scores:
            response = test_client.post("/leaderboard", json=score)
            assert response.status_code == 201

        # Get leaderboard
        response = test_client.get("/leaderboard")
        assert response.status_code == 200

        leaderboard = response.json()
        assert len(leaderboard) >= initial_count + 3  # At least our 3 new scores

        # Find our submitted scores (they should be in the top results due to sorting)
        our_scores = [entry for entry in leaderboard if entry["username"] in [
            registered_user["user_data"]["username"], "otheruser"
        ] and entry["time"] in [30, 45, 60]]

        # Should have at least our 3 scores
        assert len(our_scores) >= 3

        # Check that scores are sorted by time (ascending)
        times = [score["time"] for score in leaderboard[:10]]  # Check first 10
        assert times == sorted(times), f"Scores not sorted: {times}"

    def test_leaderboard_limit(self, test_client, registered_user):
        """Test leaderboard respects the limit parameter"""
        # Submit 5 scores
        for i in range(5):
            score_data = {
                "username": f"user{i}",
                "time": i * 10 + 10,  # 10, 20, 30, 40, 50
                "difficulty": "easy"
            }
            response = test_client.post("/leaderboard", json=score_data)
            assert response.status_code == 201

        # Get leaderboard with limit 3
        response = test_client.get("/leaderboard?limit=3")
        assert response.status_code == 200

        leaderboard = response.json()
        assert len(leaderboard) == 3

        # Should be the fastest 3
        assert leaderboard[0]["time"] == 10
        assert leaderboard[1]["time"] == 20
        assert leaderboard[2]["time"] == 30

class TestSpectatorMode:
    """Test spectator mode functionality"""

    def test_get_active_players(self, test_client):
        """Test getting active players list"""
        response = test_client.get("/spectator/active")
        assert response.status_code == 200

        players = response.json()
        assert isinstance(players, list)
        # Should have some mock players from initialization
        assert len(players) > 0

        # Check player structure
        player = players[0]
        assert "id" in player
        assert "username" in player
        assert "board" in player
        assert "status" in player
        assert "timer" in player
        assert "flagsCount" in player
        assert "minesCount" in player
        assert "startedAt" in player

    def test_get_specific_player(self, test_client):
        """Test getting a specific player's details"""
        # First get the list of active players
        response = test_client.get("/spectator/active")
        players = response.json()
        player_id = players[0]["id"]

        # Then get that specific player
        response = test_client.get(f"/spectator/{player_id}")
        assert response.status_code == 200

        player = response.json()
        assert player["id"] == player_id
        assert "board" in player
        assert "status" in player

    def test_get_nonexistent_player(self, test_client):
        """Test getting a nonexistent player returns 404"""
        response = test_client.get("/spectator/nonexistent-id")
        assert response.status_code == 404

class TestFullGameFlow:
    """Test complete user journey"""

    def test_complete_user_journey(self, test_client):
        """Test full flow: register -> login -> play game -> check leaderboard"""
        # 1. Register user
        user_data = {
            "username": "gameplayer",
            "email": "player@example.com",
            "password": "gamepass123"
        }

        response = test_client.post("/auth/signup", json=user_data)
        assert response.status_code == 200
        user_id = response.json()["user"]["id"]

        # 2. Login user
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }

        response = test_client.post("/auth/login", json=login_data)
        assert response.status_code == 200

        # 3. Get user profile
        headers = {"X-User-Id": user_id}
        response = test_client.get("/auth/me", headers=headers)
        assert response.status_code == 200

        # 4. Submit a game score
        score_data = {
            "username": user_data["username"],
            "time": 35,
            "difficulty": "easy"
        }

        response = test_client.post("/leaderboard", json=score_data)
        assert response.status_code == 201

        # 5. Check leaderboard includes the score
        response = test_client.get("/leaderboard")
        assert response.status_code == 200

        leaderboard = response.json()
        assert len(leaderboard) >= 1

        # Find our user's score
        user_score = next((entry for entry in leaderboard if entry["username"] == user_data["username"]), None)
        assert user_score is not None
        assert user_score["time"] == 35
        assert user_score["difficulty"] == "easy"

        # 6. Check spectator mode still works
        response = test_client.get("/spectator/active")
        assert response.status_code == 200
        assert len(response.json()) > 0