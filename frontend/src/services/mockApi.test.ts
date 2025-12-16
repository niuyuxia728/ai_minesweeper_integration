import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authApi, leaderboardApi, spectatorApi } from './mockApi';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('authApi', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('signup', () => {
    it('should successfully create a new user', async () => {
      const result = await authApi.signup({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.username).toBe('testuser');
      expect(result.user?.email).toBe('test@example.com');
    });

    it('should store session in localStorage after signup', async () => {
      await authApi.signup({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      const session = localStorageMock.getItem('minesweeper_session');
      expect(session).toBeTruthy();
      const parsed = JSON.parse(session!);
      expect(parsed.username).toBe('testuser');
    });

    it('should reject duplicate email', async () => {
      await authApi.signup({
        username: 'user1',
        email: 'duplicate@example.com',
        password: 'password123',
      });

      const result = await authApi.signup({
        username: 'user2',
        email: 'duplicate@example.com',
        password: 'password456',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already registered');
    });

    it('should reject duplicate username', async () => {
      await authApi.signup({
        username: 'sameusername',
        email: 'email1@example.com',
        password: 'password123',
      });

      const result = await authApi.signup({
        username: 'sameusername',
        email: 'email2@example.com',
        password: 'password456',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Username already taken');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create a test user first
      await authApi.signup({
        username: 'logintest',
        email: 'login@example.com',
        password: 'testpassword',
      });
      localStorageMock.clear(); // Clear session after signup
    });

    it('should successfully login with correct credentials', async () => {
      const result = await authApi.login({
        email: 'login@example.com',
        password: 'testpassword',
      });

      expect(result.success).toBe(true);
      expect(result.user?.username).toBe('logintest');
    });

    it('should fail with incorrect password', async () => {
      const result = await authApi.login({
        email: 'login@example.com',
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid password');
    });

    it('should fail with non-existent email', async () => {
      const result = await authApi.login({
        email: 'nonexistent@example.com',
        password: 'anypassword',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('logout', () => {
    it('should clear session from localStorage', async () => {
      await authApi.signup({
        username: 'logouttest',
        email: 'logout@example.com',
        password: 'password123',
      });

      expect(localStorageMock.getItem('minesweeper_session')).toBeTruthy();

      await authApi.logout();

      expect(localStorageMock.getItem('minesweeper_session')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no session exists', async () => {
      localStorageMock.clear();
      const user = await authApi.getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return user when session exists', async () => {
      await authApi.signup({
        username: 'sessiontest',
        email: 'session@example.com',
        password: 'password123',
      });

      const user = await authApi.getCurrentUser();
      expect(user).toBeDefined();
      expect(user?.username).toBe('sessiontest');
    });
  });
});

describe('leaderboardApi', () => {
  describe('getLeaderboard', () => {
    it('should return leaderboard entries sorted by time', async () => {
      const entries = await leaderboardApi.getLeaderboard(10);

      expect(entries.length).toBeGreaterThan(0);
      expect(entries.length).toBeLessThanOrEqual(10);

      // Verify sorting
      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].time).toBeGreaterThanOrEqual(entries[i - 1].time);
      }
    });

    it('should respect the limit parameter', async () => {
      const entries = await leaderboardApi.getLeaderboard(3);
      expect(entries.length).toBeLessThanOrEqual(3);
    });

    it('should return entries with required fields', async () => {
      const entries = await leaderboardApi.getLeaderboard(1);
      
      expect(entries[0]).toHaveProperty('id');
      expect(entries[0]).toHaveProperty('username');
      expect(entries[0]).toHaveProperty('time');
      expect(entries[0]).toHaveProperty('date');
      expect(entries[0]).toHaveProperty('difficulty');
    });
  });

  describe('submitScore', () => {
    it('should add a new score to the leaderboard', async () => {
      const initialEntries = await leaderboardApi.getLeaderboard(100);
      const initialCount = initialEntries.length;

      await leaderboardApi.submitScore('NewPlayer', 50, 'easy');

      const updatedEntries = await leaderboardApi.getLeaderboard(100);
      expect(updatedEntries.length).toBe(initialCount + 1);
    });

    it('should return the created entry', async () => {
      const entry = await leaderboardApi.submitScore('TestPlayer', 75, 'medium');

      expect(entry.username).toBe('TestPlayer');
      expect(entry.time).toBe(75);
      expect(entry.difficulty).toBe('medium');
      expect(entry.id).toBeDefined();
    });
  });
});

describe('spectatorApi', () => {
  describe('getActivePlayers', () => {
    it('should return a list of active players', async () => {
      const players = await spectatorApi.getActivePlayers();

      expect(Array.isArray(players)).toBe(true);
      expect(players.length).toBeGreaterThan(0);
    });

    it('should return players with required fields', async () => {
      const players = await spectatorApi.getActivePlayers();
      const player = players[0];

      expect(player).toHaveProperty('id');
      expect(player).toHaveProperty('username');
      expect(player).toHaveProperty('board');
      expect(player).toHaveProperty('status');
      expect(player).toHaveProperty('timer');
      expect(player).toHaveProperty('flagsCount');
      expect(player).toHaveProperty('minesCount');
    });

    it('should return players with valid board structure', async () => {
      const players = await spectatorApi.getActivePlayers();
      const board = players[0].board;

      expect(Array.isArray(board)).toBe(true);
      expect(board.length).toBe(9); // 9 rows
      expect(board[0].length).toBe(9); // 9 cols

      // Check cell structure
      const cell = board[0][0];
      expect(cell).toHaveProperty('isMine');
      expect(cell).toHaveProperty('isRevealed');
      expect(cell).toHaveProperty('isFlagged');
      expect(cell).toHaveProperty('neighborMines');
    });
  });

  describe('watchPlayer', () => {
    it('should return a specific player by id', async () => {
      const players = await spectatorApi.getActivePlayers();
      const targetPlayer = players[0];

      const watched = await spectatorApi.watchPlayer(targetPlayer.id);

      expect(watched).toBeDefined();
      expect(watched?.id).toBe(targetPlayer.id);
    });

    it('should return null for non-existent player', async () => {
      const watched = await spectatorApi.watchPlayer('non-existent-id');
      expect(watched).toBeNull();
    });
  });

  describe('subscribeToPlayer', () => {
    it('should call callback with player updates', async () => {
      const players = await spectatorApi.getActivePlayers();
      const targetPlayer = players[0];

      const callback = vi.fn();
      const unsubscribe = spectatorApi.subscribeToPlayer(targetPlayer.id, callback);

      // Wait for at least one callback
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0].id).toBe(targetPlayer.id);

      unsubscribe();
    });

    it('should stop calling callback after unsubscribe', async () => {
      const players = await spectatorApi.getActivePlayers();
      const targetPlayer = players[0];

      const callback = vi.fn();
      const unsubscribe = spectatorApi.subscribeToPlayer(targetPlayer.id, callback);

      await new Promise(resolve => setTimeout(resolve, 600));
      const callCountBeforeUnsubscribe = callback.mock.calls.length;

      unsubscribe();

      await new Promise(resolve => setTimeout(resolve, 600));
      expect(callback.mock.calls.length).toBe(callCountBeforeUnsubscribe);
    });
  });

  describe('subscribeToActivePlayers', () => {
    it('should call callback with all active players', async () => {
      const callback = vi.fn();
      const unsubscribe = spectatorApi.subscribeToActivePlayers(callback);

      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(callback).toHaveBeenCalled();
      expect(Array.isArray(callback.mock.calls[0][0])).toBe(true);

      unsubscribe();
    });
  });
});
