from fastapi import FastAPI
from .routes import router
from . import mock_db

app = FastAPI(title='Minesweeper Mock API')
app.include_router(router)

@app.on_event('startup')
async def startup_event():
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
