import { useState, useCallback, useEffect } from 'react';
import { Cell, GameState, GameStatus } from './types';

const ROWS = 9;
const COLS = 9;
const MINES = 10;

const createEmptyBoard = (): Cell[][] => {
  return Array(ROWS).fill(null).map(() =>
    Array(COLS).fill(null).map(() => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      neighborMines: 0,
    }))
  );
};

const placeMines = (board: Cell[][], excludeRow: number, excludeCol: number): Cell[][] => {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  let minesPlaced = 0;

  while (minesPlaced < MINES) {
    const row = Math.floor(Math.random() * ROWS);
    const col = Math.floor(Math.random() * COLS);

    // Don't place mine on first click or already mined cell
    if (!newBoard[row][col].isMine && !(row === excludeRow && col === excludeCol)) {
      newBoard[row][col].isMine = true;
      minesPlaced++;
    }
  }

  return newBoard;
};

const calculateNeighborMines = (board: Cell[][]): Cell[][] => {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (newBoard[row][col].isMine) continue;

      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newBoard[nr][nc].isMine) {
            count++;
          }
        }
      }
      newBoard[row][col].neighborMines = count;
    }
  }

  return newBoard;
};

const revealCell = (board: Cell[][], row: number, col: number): Cell[][] => {
  const newBoard = board.map(r => r.map(c => ({ ...c })));

  const reveal = (r: number, c: number) => {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    if (newBoard[r][c].isRevealed || newBoard[r][c].isFlagged) return;

    newBoard[r][c].isRevealed = true;

    if (newBoard[r][c].neighborMines === 0 && !newBoard[r][c].isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          reveal(r + dr, c + dc);
        }
      }
    }
  };

  reveal(row, col);
  return newBoard;
};

const checkWin = (board: Cell[][]): boolean => {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = board[row][col];
      if (!cell.isMine && !cell.isRevealed) return false;
    }
  }
  return true;
};

const revealAllMines = (board: Cell[][]): Cell[][] => {
  return board.map(row =>
    row.map(cell => ({
      ...cell,
      isRevealed: cell.isMine ? true : cell.isRevealed,
    }))
  );
};

export const useGameLogic = (onWin?: (time: number) => void) => {
  const [gameState, setGameState] = useState<GameState>({
    board: createEmptyBoard(),
    status: 'playing',
    minesCount: MINES,
    flagsCount: 0,
    timer: 0,
    isFirstClick: true,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState.status === 'playing' && !gameState.isFirstClick) {
      interval = setInterval(() => {
        setGameState(prev => ({ ...prev, timer: prev.timer + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState.status, gameState.isFirstClick]);

  const handleCellClick = useCallback((row: number, col: number) => {
    setGameState(prev => {
      if (prev.status !== 'playing') return prev;

      const cell = prev.board[row][col];
      if (cell.isRevealed || cell.isFlagged) return prev;

      let newBoard = prev.board;

      if (prev.isFirstClick) {
        newBoard = placeMines(prev.board, row, col);
        newBoard = calculateNeighborMines(newBoard);
      }

      if (newBoard[row][col].isMine) {
        newBoard = revealAllMines(newBoard);
        newBoard[row][col] = { ...newBoard[row][col], isRevealed: true };
        return { ...prev, board: newBoard, status: 'lost' as GameStatus, isFirstClick: false };
      }

      newBoard = revealCell(newBoard, row, col);
      const won = checkWin(newBoard);

      if (won && onWin) {
        onWin(prev.timer + 1); // timer hasn't incremented yet, so add 1
      }

      return {
        ...prev,
        board: newBoard,
        status: won ? 'won' as GameStatus : 'playing',
        isFirstClick: false,
      };
    });
  }, [onWin]);

  const handleCellRightClick = useCallback((row: number, col: number) => {
    setGameState(prev => {
      if (prev.status !== 'playing') return prev;

      const cell = prev.board[row][col];
      if (cell.isRevealed) return prev;

      const newBoard = prev.board.map(r => r.map(c => ({ ...c })));
      newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;

      const flagsCount = prev.flagsCount + (newBoard[row][col].isFlagged ? 1 : -1);

      return { ...prev, board: newBoard, flagsCount };
    });
  }, []);

  const resetGame = useCallback(() => {
    setGameState({
      board: createEmptyBoard(),
      status: 'playing',
      minesCount: MINES,
      flagsCount: 0,
      timer: 0,
      isFirstClick: true,
    });
  }, []);

  return {
    gameState,
    handleCellClick,
    handleCellRightClick,
    resetGame,
  };
};
