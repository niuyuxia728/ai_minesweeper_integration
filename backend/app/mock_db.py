import asyncio
import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, List
from .schemas import LeaderboardEntry, ActivePlayer, Cell

# In-memory mock storage
_users: Dict[str, Dict] = {
    # predefined users for manual testing
    '11111111-1111-1111-1111-111111111111': {
        'id': '11111111-1111-1111-1111-111111111111',
        'username': 'alice',
        'email': 'alice@example.com',
        'password': 'pass',
        'createdAt': datetime.utcnow(),
    },
    '22222222-2222-2222-2222-222222222222': {
        'id': '22222222-2222-2222-2222-222222222222',
        'username': 'bob',
        'email': 'bob@example.com',
        'password': 'pass',
        'createdAt': datetime.utcnow(),
    },
}
_leaderboard: List[LeaderboardEntry] = [
    LeaderboardEntry(id='1', username='SpeedRunner', time=42, date=datetime(2024,1,15), difficulty='easy'),
    LeaderboardEntry(id='2', username='MineExpert', time=56, date=datetime(2024,1,14), difficulty='easy'),
    LeaderboardEntry(id='3', username='BombDefuser', time=63, date=datetime(2024,1,13), difficulty='easy'),
    LeaderboardEntry(id='4', username='QuickClick', time=71, date=datetime(2024,1,12), difficulty='easy'),
    LeaderboardEntry(id='5', username='SafePlayer', time=89, date=datetime(2024,1,11), difficulty='easy'),
    LeaderboardEntry(id='6', username='FlagMaster', time=94, date=datetime(2024,1,10), difficulty='easy'),
    LeaderboardEntry(id='7', username='CoolGamer', time=105, date=datetime(2024,1,9), difficulty='easy'),
    LeaderboardEntry(id='8', username='ProSweeper', time=112, date=datetime(2024,1,8), difficulty='easy'),
]
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
                # simulate a simple timer increment and occasional flag/reveal
                p.timer += 1
                if random.random() > 0.98:
                    p.status = 'lost'
                elif random.random() > 0.995:
                    p.status = 'won'
            new_players.append(p)
        # mutate in place
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

# Auth helpers

def signup(username: str, email: str, password: str):
    # check exists
    if any(u['email'] == email for u in _users.values()):
        return None, 'Email already registered'
    if any(u['username'] == username for u in _users.values()):
        return None, 'Username already taken'
    uid = str(uuid.uuid4())
    user = {
        'id': uid,
        'username': username,
        'email': email,
        'password': password,
        'createdAt': datetime.utcnow()
    }
    _users[uid] = user
    return user, None


def login(email: str, password: str):
    user = next((u for u in _users.values() if u['email'] == email), None)
    if not user:
        return None, 'User not found'
    if user['password'] != password:
        return None, 'Invalid password'
    return user, None

# Leaderboard

def get_leaderboard(limit: int = 10):
    sorted_lb = sorted(_leaderboard, key=lambda e: e.time)
    return sorted_lb[:limit]


def submit_score(username: str, time: int, difficulty: str):
    entry = LeaderboardEntry(id=str(uuid.uuid4()), username=username, time=time, date=datetime.utcnow(), difficulty=difficulty)
    _leaderboard.append(entry)
    return entry

# Spectator

def get_active_players():
    return list(_active_players)


def find_player(player_id: str):
    return next((p for p in _active_players if p.id == player_id), None)

# initialize
init_active_players()
