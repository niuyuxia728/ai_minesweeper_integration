from fastapi import FastAPI
from .routes import router
from . import mock_db
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from .database import engine, Base, DATABASE_URL

app = FastAPI(
    title='Minesweeper Mock API',
    docs_url='/api/docs',
    openapi_url='/api/openapi.json',
    redoc_url='/api/redoc',
)

# Mount API routes under /api so the OpenAPI lives under /api
app.include_router(router, prefix="/api")

# Serve built frontend files using a catch-all route registered after the API router.
# This avoids StaticFiles mounted at root taking precedence over API routes.
frontend_path = '/app/frontend_dist'
if os.path.isdir(frontend_path):
    from fastapi.responses import FileResponse
    from fastapi import Request

    @app.get('/{full_path:path}')
    async def serve_spa(full_path: str, request: Request):
        # Serve static file if it exists in the dist, otherwise return index.html
        requested = full_path.lstrip('/')
        candidate = os.path.join(frontend_path, requested)
        if requested and os.path.isfile(candidate):
            return FileResponse(candidate)
        index_file = os.path.join(frontend_path, 'index.html')
        return FileResponse(index_file)

    @app.get('/')
    async def serve_index():
        return FileResponse(os.path.join(frontend_path, 'index.html'))

# CORS - allow Vite dev server (and others) to call the API during development
origins = [
    os.environ.get('VITE_API_ORIGIN', 'http://localhost:5173'),
    os.environ.get('ALLOW_ORIGIN', '*'),
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.environ.get('ALLOW_ORIGIN', '*') == '*' else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event('startup')
async def startup_event():
    # Create database tables
    Base.metadata.create_all(bind=engine)
    # start background simulation
    loop = None
    try:
        import asyncio
        loop = asyncio.get_event_loop()
    except Exception:
        loop = None
    mock_db.start_simulation(loop)

@app.on_event('shutdown')
async def shutdown_event():
    mock_db.stop_simulation()
