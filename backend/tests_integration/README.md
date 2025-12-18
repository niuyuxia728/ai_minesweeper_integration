# Integration Tests

This directory contains integration tests for the Minesweeper backend API. These tests verify the full functionality of the application using SQLite as the test database.

## Test Structure

- **`conftest.py`**: Test configuration and database setup
- **`test_full_flow.py`**: Comprehensive integration tests covering:
  - User authentication (registration, login, profile)
  - Leaderboard functionality (scoring, sorting, limits)
  - Spectator mode (active players, player details)
  - Complete user journey (register → login → play → leaderboard)

## Running Tests

From the backend directory:

```bash
# Run all integration tests
uv run pytest tests_integration/ -v

# Run specific test class
uv run pytest tests_integration/test_full_flow.py::TestUserAuthentication -v

# Run specific test
uv run pytest tests_integration/test_full_flow.py::TestLeaderboard::test_get_empty_leaderboard -v
```

## Test Database

- Uses SQLite with file `test_minesweeper.db` (automatically created/cleaned up)
- Isolated from the main application database
- Fresh database for each test session
- Automatic cleanup after tests complete

## Test Coverage

✅ **User Authentication** (7 tests)
- User registration (success, duplicate email/username)
- User login (success, wrong password, nonexistent user)
- User profile retrieval (authenticated, unauthenticated)
- Get all users list (authenticated users only)

✅ **Leaderboard** (4 tests)
- Empty leaderboard handling
- Score submission and retrieval
- Multiple scores with proper sorting
- Leaderboard limits

✅ **Spectator Mode**
- Active players list
- Individual player details
- Error handling for nonexistent players

✅ **Full User Journey**
- Complete flow from registration to leaderboard

## Notes

- Tests use unique user data to avoid conflicts between test runs
- Database is properly isolated and cleaned up between test sessions
- All tests are designed to be independent and can run in any order