from typing import List, Literal, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

class User(BaseModel):
    id: str
    username: str
    email: EmailStr
    createdAt: datetime

class LoginCredentials(BaseModel):
    email: EmailStr
    password: str

class SignupCredentials(BaseModel):
    username: str
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    success: bool
    user: Optional[User] = None
    error: Optional[str] = None

class LeaderboardEntry(BaseModel):
    id: str
    username: str
    time: int
    date: datetime
    difficulty: Literal['easy','medium','hard']

class SubmitScoreRequest(BaseModel):
    username: str
    time: int
    difficulty: Literal['easy','medium','hard']

class Cell(BaseModel):
    isMine: bool
    isRevealed: bool
    isFlagged: bool
    neighborMines: int

class ActivePlayer(BaseModel):
    id: str
    username: str
    board: List[List[Cell]]
    status: Literal['playing','won','lost']
    timer: int
    flagsCount: int
    minesCount: int
    startedAt: datetime
