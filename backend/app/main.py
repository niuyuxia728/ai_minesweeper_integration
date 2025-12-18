from fastapi import FastAPI
from .routes import router
from . import mock_db
from fastapi.middleware.cors import CORSMiddleware
import os
from .database import engine, Base

app = FastAPI(title='Minesweeper Mock API')
app.include_router(router)

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
