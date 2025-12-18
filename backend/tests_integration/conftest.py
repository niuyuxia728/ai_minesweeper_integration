import pytest
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure project root is on sys.path so `import app` works
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# Override environment variable for test database
os.environ["DATABASE_URL"] = "sqlite:///./test_minesweeper.db"

from app.database import Base

# Test database URL
TEST_DATABASE_URL = "sqlite:///./test_minesweeper.db"

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Set up test database for all integration tests"""
    # Create test engine
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Create all tables
    Base.metadata.create_all(bind=engine)

    yield

    # Clean up - drop all tables
    Base.metadata.drop_all(bind=engine)

    # Remove test database file
    if os.path.exists("./test_minesweeper.db"):
        os.remove("./test_minesweeper.db")