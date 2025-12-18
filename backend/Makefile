# Makefile for backend tasks using `uv` as the dependency/command runner

.PHONY: sync test run serve shell clean

# Sync/install dependencies using uv
sync:
	uv sync

# Run tests via uv (uses the project's pytest config)
test:
	uv run pytest tests -q

# Start the development server via uv
run:
	uv run python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 4000

serve: run

# Open an interactive python shell within uv environment
shell:
	uv run python

# Lightweight cleanup
clean:
	find . -name "__pycache__" -type d -print -exec rm -rf {} +
