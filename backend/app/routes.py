from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List
from . import mock_db
from .schemas import LoginCredentials, SignupCredentials, AuthResponse, User, LeaderboardEntry, SubmitScoreRequest, ActivePlayer
import json
import asyncio

router = APIRouter()

@router.post('/auth/login', response_model=AuthResponse)
async def login(creds: LoginCredentials):
    user, err = mock_db.login(creds.email, creds.password)
    if err:
        return AuthResponse(success=False, error=err)
    user_obj = User(id=user['id'], username=user['username'], email=user['email'], createdAt=user['createdAt'])
    return AuthResponse(success=True, user=user_obj)

@router.post('/auth/signup', response_model=AuthResponse)
async def signup(creds: SignupCredentials):
    user, err = mock_db.signup(creds.username, creds.email, creds.password)
    if err:
        return AuthResponse(success=False, error=err)
    user_obj = User(id=user['id'], username=user['username'], email=user['email'], createdAt=user['createdAt'])
    return AuthResponse(success=True, user=user_obj)

@router.post('/auth/logout')
async def logout():
    return JSONResponse(status_code=204, content=None)

@router.get('/auth/me', response_model=User)
async def me(request: Request):
    # For mock, read header X-User-Id
    uid = request.headers.get('x-user-id')
    if not uid:
        raise HTTPException(status_code=401, detail='Not authenticated')
    user = mock_db._users.get(uid)
    if not user:
        raise HTTPException(status_code=401, detail='Not authenticated')
    return User(id=user['id'], username=user['username'], email=user['email'], createdAt=user['createdAt'])

@router.get('/leaderboard', response_model=List[LeaderboardEntry])
async def get_leaderboard(limit: int = 10):
    return mock_db.get_leaderboard(limit)

@router.post('/leaderboard', response_model=LeaderboardEntry, status_code=201)
async def post_score(req: SubmitScoreRequest):
    return mock_db.submit_score(req.username, req.time, req.difficulty)

@router.get('/spectator/active', response_model=List[ActivePlayer])
async def get_active():
    mock_db.start_simulation()
    return mock_db.get_active_players()

@router.get('/spectator/stream')
async def stream_active():
    mock_db.start_simulation()
    async def event_generator():
        while True:
            await asyncio.sleep(1)
            players = mock_db.get_active_players()
            data = json.dumps([p.dict() for p in players], default=str)
            yield f"data: {data}\n\n"
    return StreamingResponse(event_generator(), media_type='text/event-stream')

@router.get('/spectator/{player_id}', response_model=ActivePlayer)
async def get_player(player_id: str):
    p = mock_db.find_player(player_id)
    if not p:
        raise HTTPException(status_code=404, detail='Player not found')
    return p
