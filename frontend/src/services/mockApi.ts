// Centralized mock API service - all backend calls go through here
import { Cell, GameStatus } from '@/components/Minesweeper/types';

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  time: number;
  date: Date;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ActivePlayer {
  id: string;
  username: string;
  board: Cell[][];
  status: GameStatus;
  timer: number;
  flagsCount: number;
  minesCount: number;
  startedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// Mock data storage
const mockUsers: Map<string, User & { password: string }> = new Map();
const mockLeaderboard: LeaderboardEntry[] = [
  { id: '1', username: 'SpeedRunner', time: 42, date: new Date('2024-01-15'), difficulty: 'easy' },
  { id: '2', username: 'MineExpert', time: 56, date: new Date('2024-01-14'), difficulty: 'easy' },
  { id: '3', username: 'BombDefuser', time: 63, date: new Date('2024-01-13'), difficulty: 'easy' },
];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Session storage key
const SESSION_KEY = 'minesweeper_session';

// Auth API
export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await delay(500);
    
    const userEntry = Array.from(mockUsers.values()).find(u => u.email === credentials.email);
    
    if (!userEntry) {
      return { success: false, error: 'User not found' };
    }
    
    if (userEntry.password !== credentials.password) {
      return { success: false, error: 'Invalid password' };
    }
    
    const { password: _, ...user } = userEntry;
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    
    return { success: true, user };
  },

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    await delay(500);
    
    if (Array.from(mockUsers.values()).some(u => u.email === credentials.email)) {
      return { success: false, error: 'Email already registered' };
    }
    
    if (Array.from(mockUsers.values()).some(u => u.username === credentials.username)) {
      return { success: false, error: 'Username already taken' };
    }
    
    const user: User = {
      id: crypto.randomUUID(),
      username: credentials.username,
      email: credentials.email,
      createdAt: new Date(),
    };
    
    mockUsers.set(user.id, { ...user, password: credentials.password });
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    
    return { success: true, user };
  },

  async logout(): Promise<void> {
    await delay(200);
    localStorage.removeItem(SESSION_KEY);
  },

  async getCurrentUser(): Promise<User | null> {
    await delay(100);
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  },
};

// Leaderboard API
export const leaderboardApi = {
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    await delay(300);
    return [...mockLeaderboard]
      .sort((a, b) => a.time - b.time)
      .slice(0, limit);
  },

  async submitScore(username: string, time: number, difficulty: 'easy' | 'medium' | 'hard'): Promise<LeaderboardEntry> {
    await delay(300);
    const entry: LeaderboardEntry = {
      id: crypto.randomUUID(),
      username,
      time,
      date: new Date(),
      difficulty,
    };
    mockLeaderboard.push(entry);
    return entry;
  },
};

// Active Players API (for spectator mode)
let mockActivePlayers: ActivePlayer[] = [];
let playerSimulationInterval: NodeJS.Timeout | null = null;

// Helper to create a random board state
const createMockBoard = (): Cell[][] => {
  const rows = 9;
  const cols = 9;
  const board: Cell[][] = [];
  
  for (let i = 0; i < rows; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < cols; j++) {
      const isRevealed = Math.random() > 0.6;
      const isMine = !isRevealed && Math.random() > 0.9;
      row.push({
        isMine,
        isRevealed,
        isFlagged: !isRevealed && Math.random() > 0.8,
        neighborMines: isRevealed ? Math.floor(Math.random() * 4) : 0,
      });
    }
    board.push(row);
  }
  return board;
};

// Simulate a move on a board
const simulateMove = (player: ActivePlayer): ActivePlayer => {
  const newBoard = player.board.map(row => row.map(cell => ({ ...cell })));
  
  // Find unrevealed, unflagged cells
  const hiddenCells: { row: number; col: number }[] = [];
  for (let r = 0; r < newBoard.length; r++) {
    for (let c = 0; c < newBoard[r].length; c++) {
      if (!newBoard[r][c].isRevealed && !newBoard[r][c].isFlagged) {
        hiddenCells.push({ row: r, col: c });
      }
    }
  }
  
  if (hiddenCells.length === 0) {
    return { ...player, status: 'won' };
  }
  
  // Random action: reveal or flag
  const action = Math.random();
  const targetIdx = Math.floor(Math.random() * hiddenCells.length);
  const target = hiddenCells[targetIdx];
  
  if (action > 0.8) {
    // Flag action
    newBoard[target.row][target.col].isFlagged = true;
    return { 
      ...player, 
      board: newBoard, 
      flagsCount: player.flagsCount + 1,
      timer: player.timer + 1 
    };
  } else {
    // Reveal action
    const cell = newBoard[target.row][target.col];
    
    if (cell.isMine) {
      // Hit a mine - game over
      newBoard[target.row][target.col].isRevealed = true;
      return { ...player, board: newBoard, status: 'lost', timer: player.timer + 1 };
    }
    
    // Reveal the cell
    newBoard[target.row][target.col].isRevealed = true;
    newBoard[target.row][target.col].neighborMines = Math.floor(Math.random() * 4);
    
    // Sometimes reveal adjacent cells
    if (Math.random() > 0.5) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = target.row + dr;
          const nc = target.col + dc;
          if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9 && Math.random() > 0.5) {
            if (!newBoard[nr][nc].isMine) {
              newBoard[nr][nc].isRevealed = true;
              newBoard[nr][nc].neighborMines = Math.floor(Math.random() * 3);
            }
          }
        }
      }
    }
    
    return { ...player, board: newBoard, timer: player.timer + 1 };
  }
};

// Start simulating active players
const startPlayerSimulation = () => {
  if (playerSimulationInterval) return;
  
  // Initialize some mock players
  const mockPlayerNames = ['SweeperPro', 'MineHunter', 'FlagQueen', 'BombSquad'];
  mockActivePlayers = mockPlayerNames.map(username => ({
    id: crypto.randomUUID(),
    username,
    board: createMockBoard(),
    status: 'playing' as GameStatus,
    timer: Math.floor(Math.random() * 60) + 10,
    flagsCount: Math.floor(Math.random() * 5),
    minesCount: 10,
    startedAt: new Date(Date.now() - Math.random() * 120000),
  }));
  
  // Simulate moves every 1-2 seconds
  playerSimulationInterval = setInterval(() => {
    mockActivePlayers = mockActivePlayers.map(player => {
      if (player.status !== 'playing') {
        // Reset finished games occasionally
        if (Math.random() > 0.9) {
          return {
            ...player,
            board: createMockBoard(),
            status: 'playing' as GameStatus,
            timer: 0,
            flagsCount: 0,
            startedAt: new Date(),
          };
        }
        return player;
      }
      return simulateMove(player);
    });
  }, 1500);
};

const stopPlayerSimulation = () => {
  if (playerSimulationInterval) {
    clearInterval(playerSimulationInterval);
    playerSimulationInterval = null;
  }
};

export const spectatorApi = {
  async getActivePlayers(): Promise<ActivePlayer[]> {
    await delay(200);
    startPlayerSimulation();
    return [...mockActivePlayers];
  },

  async watchPlayer(playerId: string): Promise<ActivePlayer | null> {
    await delay(100);
    return mockActivePlayers.find(p => p.id === playerId) || null;
  },

  subscribeToPlayer(playerId: string, callback: (player: ActivePlayer) => void): () => void {
    const interval = setInterval(() => {
      const player = mockActivePlayers.find(p => p.id === playerId);
      if (player) {
        callback(player);
      }
    }, 500);
    
    return () => clearInterval(interval);
  },

  subscribeToActivePlayers(callback: (players: ActivePlayer[]) => void): () => void {
    startPlayerSimulation();
    const interval = setInterval(() => {
      callback([...mockActivePlayers]);
    }, 1000);
    
    return () => {
      clearInterval(interval);
    };
  },

  cleanup: stopPlayerSimulation,
};
