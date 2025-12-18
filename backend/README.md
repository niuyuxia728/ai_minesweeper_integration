FastAPI mock backend

Guidance based on AGENTS.md:

- use `uv` to manage dev dependencies if available in your environment (see repo AGENTS.md).

Quickstart (recommended: using uv)

# sync/install dependencies managed by uv
uv sync

# run tests via uv
uv run pytest backend/tests -q

# start dev server via uv
uv run python -m uvicorn backend.app.main:app --reload --port 4000


Quickstart (with pip / virtualenv)

python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.app.main:app --reload --port 4000

Run tests (pip/venv):

pytest -q

Notes

- If you use `uv`, running `uv sync` will install dependencies and `uv run` runs commands inside uv's environment.
- Tests in `backend/tests` use AsyncClient(app=app) and do not require the server to be running.
- To view the OpenAPI UI after starting the server, open http://127.0.0.1:4000/docs

## API Endpoints

### Authentication
- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user profile (requires X-User-Id header)
- `GET /users` - Get all registered users (requires authentication)

### Leaderboard
- `GET /leaderboard` - Get leaderboard (top scores)
- `POST /leaderboard` - Submit a game score

### Spectator Mode
- `GET /spectator/active` - Get list of active players
- `GET /spectator/{player_id}` - Get specific player details
- `GET /spectator/stream` - Server-sent events stream of active players

## Database

Uses SQLite by default (`minesweeper.db`). Can be configured with `DATABASE_URL` environment variable for PostgreSQL or other databases.
