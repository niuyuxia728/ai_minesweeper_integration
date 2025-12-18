// Centralized API client that talks to the backend instead of using in-memory mocks
import { Cell, GameStatus } from '@/components/Minesweeper/types';

// Types (kept for compatibility)
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

// Backend base URL (Vite env compatible)
const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:4000';
const SESSION_KEY = 'minesweeper_session';

const headers = (extra?: Record<string,string>) => ({
  'Content-Type': 'application/json',
  ...extra,
});

const parseJson = async (res: Response) => {
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return txt; }
};

// Auth API - delegate to backend
export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(credentials),
    });
    const body = await parseJson(res);
    if (!res.ok) return { success: false, error: body?.error || String(body) };

    // store user locally for compatibility
    if (body.user) localStorage.setItem(SESSION_KEY, JSON.stringify(body.user));
    return { success: true, user: body.user };
  },

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(credentials),
    });
    const body = await parseJson(res);
    if (!res.ok) return { success: false, error: body?.error || String(body) };

    if (body.user) localStorage.setItem(SESSION_KEY, JSON.stringify(body.user));
    return { success: true, user: body.user };
  },

  async logout(): Promise<void> {
    // call backend (no-op if not implemented) and clear session
    try { await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: headers() }); } catch (e) { /* ignore */ }
    localStorage.removeItem(SESSION_KEY);
  },

  async getCurrentUser(): Promise<User | null> {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    const user = JSON.parse(session);

    // try to refresh from backend /auth/me if available
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { method: 'GET', headers: headers({ 'x-user-id': user.id }) });
      if (res.ok) {
        const u = await res.json();
        // normalize date
        u.createdAt = new Date(u.createdAt);
        localStorage.setItem(SESSION_KEY, JSON.stringify(u));
        return u;
      }
    } catch (e) {
      // ignore network errors and return local user
    }

    // convert createdAt to Date
    user.createdAt = new Date(user.createdAt);
    return user;
  },
};

// Leaderboard API
export const leaderboardApi = {
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const res = await fetch(`${API_BASE}/leaderboard?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((e: any) => ({ ...e, date: new Date(e.date) }));
  },

  async submitScore(username: string, time: number, difficulty: 'easy' | 'medium' | 'hard'): Promise<LeaderboardEntry> {
    const res = await fetch(`${API_BASE}/leaderboard`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ username, time, difficulty }),
    });
    const data = await res.json();
    return { ...data, date: new Date(data.date) };
  },
};

// Spectator API - uses backend endpoints; subscriptions implemented with polling
export const spectatorApi = {
  async getActivePlayers(): Promise<ActivePlayer[]> {
    const res = await fetch(`${API_BASE}/spectator/active`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((p: any) => ({ ...p, startedAt: new Date(p.startedAt) }));
  },

  async watchPlayer(playerId: string): Promise<ActivePlayer | null> {
    const res = await fetch(`${API_BASE}/spectator/${playerId}`);
    if (!res.ok) return null;
    const p = await res.json();
    return { ...p, startedAt: new Date(p.startedAt) };
  },

  subscribeToPlayer(playerId: string, callback: (player: ActivePlayer) => void): () => void {
    const interval = setInterval(async () => {
      const p = await spectatorApi.watchPlayer(playerId);
      if (p) callback(p);
    }, 500);
    return () => clearInterval(interval);
  },

  subscribeToActivePlayers(callback: (players: ActivePlayer[]) => void): () => void {
    let stopped = false;
    const poll = async () => {
      while (!stopped) {
        try {
          const players = await spectatorApi.getActivePlayers();
          callback(players);
        } catch (e) { /* ignore */ }
        await new Promise(r => setTimeout(r, 1000));
      }
    };
    poll();
    return () => { stopped = true; };
  },

  cleanup: () => { /* noop for client */ },
};

export default { authApi, leaderboardApi, spectatorApi };
