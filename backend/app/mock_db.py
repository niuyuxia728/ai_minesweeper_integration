import asyncio
import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, List
from sqlalchemy.orm import Session
from .database import SessionLocal, User as DBUser, LeaderboardEntry as DBEntry
from .schemas import LeaderboardEntry, ActivePlayer, Cell

# In-memory for active players (simulation)
_active_players: List[ActivePlayer] = []
_sim_task = None

def create_mock_board(rows=9, cols=9):
    board = []
    for i in range(rows):
        row = []
        for j in range(cols):
            isRevealed = random.random() > 0.6
            isMine = (not isRevealed) and (random.random() > 0.9)
            cell = Cell(isMine=isMine, isRevealed=isRevealed, isFlagged=(not isRevealed and random.random()>0.8), neighborMines=(random.randint(0,3) if isRevealed else 0))
            row.append(cell)
        board.append(row)
    return board

def init_active_players():
    global _active_players
    names = ['SweeperPro','MineHunter','FlagQueen','BombSquad']
    _active_players = []
    for n in names:
        player = ActivePlayer(
            id=str(uuid.uuid4()),
            username=n,
            board=create_mock_board(),
            status='playing',
            timer=random.randint(10,70),
            flagsCount=random.randint(0,5),
            minesCount=10,
            startedAt=datetime.utcnow() - timedelta(seconds=random.randint(0,120))
        )
        _active_players.append(player)

async def _simulate():
    while True:
        await asyncio.sleep(1.5)
        new_players = []
        for p in _active_players:
            if p.status != 'playing':
                if random.random() > 0.9:
                    p.board = create_mock_board()
                    p.status = 'playing'
                    p.timer = 0
                    p.flagsCount = 0
                    p.startedAt = datetime.utcnow()
            else:
                p.timer += 1
                if random.random() > 0.98:
                    p.status = 'lost'
                elif random.random() > 0.995:
                    p.status = 'won'
            new_players.append(p)
        _active_players[:] = new_players

def start_simulation(loop=None):
    global _sim_task
    if _sim_task is None:
        if loop is None:
            loop = asyncio.get_event_loop()
        _sim_task = loop.create_task(_simulate())

def stop_simulation():
    global _sim_task
    if _sim_task:
        _sim_task.cancel()
        _sim_task = None

# Auth helpers - now using DB
def signup(username: str, email: str, password: str, db: Session | None = None):
    created_local = False
    if db is None:
        db = SessionLocal()
        created_local = True
    try:
        # Check if exists
        if db.query(DBUser).filter(DBUser.email == email).first():
            return None, 'Email already registered'
        if db.query(DBUser).filter(DBUser.username == username).first():
            return None, 'Username already taken'
        uid = str(uuid.uuid4())
        user = DBUser(id=uid, username=username, email=email, password=password)
        db.add(user)
        db.commit()
        db.refresh(user)
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'createdAt': user.created_at
        }, None
    except Exception as e:
        db.rollback()
        return None, str(e)
    finally:
        if created_local:
            db.close()

def login(email: str, password: str, db: Session | None = None):
    created_local = False
    if db is None:
        db = SessionLocal()
        created_local = True
    try:
        user = db.query(DBUser).filter(DBUser.email == email).first()
        if not user:
            return None, 'User not found'
        if user.password != password:
            return None, 'Invalid password'
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'createdAt': user.created_at
        }, None
    finally:
        if created_local:
            db.close()

# Leaderboard - using DB
def get_leaderboard(limit: int = 10, db: Session | None = None):
    created_local = False
    if db is None:
        db = SessionLocal()
        created_local = True
    try:
        entries = db.query(DBEntry).order_by(DBEntry.time).limit(limit).all()
        return [LeaderboardEntry(
            id=e.id,
            username=e.username,
            time=e.time,
            date=e.date,
            difficulty=e.difficulty
        ) for e in entries]
    finally:
        if created_local:
            db.close()

def submit_score(username: str, time: int, difficulty: str, db: Session | None = None):
    created_local = False
    if db is None:
        db = SessionLocal()
        created_local = True
    try:
        entry = DBEntry(id=str(uuid.uuid4()), username=username, time=time, difficulty=difficulty)
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return LeaderboardEntry(
            id=entry.id,
            username=entry.username,
            time=entry.time,
            date=entry.date,
            difficulty=entry.difficulty
        )
    except Exception as e:
        db.rollback()
        raise e
    finally:
        if created_local:
            db.close()

# Spectator - still in memory
def get_active_players():
    return list(_active_players)

def find_player(player_id: str):
    return next((p for p in _active_players if p.id == player_id), None)

# Initialize
init_active_players()
