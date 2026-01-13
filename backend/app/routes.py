from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List
from . import mock_db
from .schemas import LoginCredentials, SignupCredentials, AuthResponse, User, LeaderboardEntry, SubmitScoreRequest, ActivePlayer
from .database import get_db
from sqlalchemy.orm import Session
import json
import asyncio

router = APIRouter()

@router.post('/auth/login', response_model=AuthResponse)
async def login(creds: LoginCredentials, db: Session = Depends(get_db)):
    user, err = mock_db.login(creds.email, creds.password, db)
    if err:
        return AuthResponse(success=False, error=err)
    user_obj = User(id=user['id'], username=user['username'], email=user['email'], createdAt=user['createdAt'])
    return AuthResponse(success=True, user=user_obj)

@router.post('/auth/signup', response_model=AuthResponse)
async def signup(creds: SignupCredentials, db: Session = Depends(get_db)):
    user, err = mock_db.signup(creds.username, creds.email, creds.password, db)
    if err:
        return AuthResponse(success=False, error=err)
    user_obj = User(id=user['id'], username=user['username'], email=user['email'], createdAt=user['createdAt'])
    return AuthResponse(success=True, user=user_obj)

@router.post('/auth/logout')
async def logout():
    return JSONResponse(status_code=204, content=None)

@router.get('/auth/me', response_model=User)
async def me(request: Request):
    # Read header X-User-Id
    uid = request.headers.get('x-user-id')
    if not uid:
        raise HTTPException(status_code=401, detail='Not authenticated')
    
    # Query database for user
    from .database import SessionLocal, User as DBUser
    db = SessionLocal()
    try:
        db_user = db.query(DBUser).filter(DBUser.id == uid).first()
        if not db_user:
            raise HTTPException(status_code=401, detail='Not authenticated')
        return User(id=db_user.id, username=db_user.username, email=db_user.email, createdAt=db_user.created_at)
    finally:
        db.close()

@router.get('/users', response_model=List[User])
async def get_users(request: Request):
    """Get all registered users (requires authentication)"""
    # For now, require authentication (could be admin-only in production)
    uid = request.headers.get('x-user-id')
    if not uid:
        raise HTTPException(status_code=401, detail='Not authenticated - provide X-User-Id header')
    
    # Verify the requesting user exists
    from .database import SessionLocal, User as DBUser
    db = SessionLocal()
    try:
        db_user = db.query(DBUser).filter(DBUser.id == uid).first()
        if not db_user:
            raise HTTPException(status_code=401, detail='Not authenticated')
        
        # Get all users
        all_users = db.query(DBUser).order_by(DBUser.created_at.desc()).all()
        return [User(id=u.id, username=u.username, email=u.email, createdAt=u.created_at) for u in all_users]
    finally:
        db.close()

@router.get('/leaderboard', response_model=List[LeaderboardEntry])
async def get_leaderboard(limit: int = 10, db: Session = Depends(get_db)):
    return mock_db.get_leaderboard(limit, db)

@router.post('/leaderboard', response_model=LeaderboardEntry, status_code=201)
async def post_score(req: SubmitScoreRequest, db: Session = Depends(get_db)):
    return mock_db.submit_score(req.username, req.time, req.difficulty, db)

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
