FROM python:3.11-slim

WORKDIR /app

# Install small build deps and curl
RUN apt-get update && apt-get install -y --no-install-recommends build-essential curl && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install uv (project dependency manager used by this repo)
RUN python -m pip install --upgrade pip

# Copy project files
COPY . /app

# Install Python dependencies directly to avoid uv creating a separate Python runtime
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

ENV PYTHONUNBUFFERED=1
ENV DATABASE_URL=postgresql://postgres:password@postgres:5432/minesweeper_db

EXPOSE 4000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "4000"]
