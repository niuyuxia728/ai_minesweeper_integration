import { Cell, GameStatus } from '@/components/Minesweeper/types';
import { Flag, Bomb } from 'lucide-react';

interface SpectatorBoardProps {
  board: Cell[][];
  status: GameStatus;
}

export const SpectatorBoard = ({ board, status }: SpectatorBoardProps) => {
  const isGameOver = status === 'won' || status === 'lost';

  const getCellContent = (cell: Cell) => {
    if (cell.isFlagged) {
      return <Flag className="h-3 w-3 text-accent" />;
    }
    if (cell.isRevealed) {
      if (cell.isMine) {
        return <Bomb className="h-3 w-3 text-destructive-foreground" />;
      }
      if (cell.neighborMines > 0) {
        return (
          <span className={`text-xs font-bold num-${cell.neighborMines}`}>
            {cell.neighborMines}
          </span>
        );
      }
    }
    return null;
  };

  const getCellClass = (cell: Cell) => {
    const baseClass = 'w-5 h-5 flex items-center justify-center text-xs transition-all';
    
    if (cell.isRevealed) {
      if (cell.isMine) {
        return `${baseClass} cell-exploded`;
      }
      return `${baseClass} cell-revealed`;
    }
    
    return `${baseClass} cell-hidden`;
  };

  return (
    <div 
      className={`inline-block p-2 rounded bg-secondary/30 ${
        isGameOver && status === 'lost' ? 'animate-shake' : ''
      }`}
    >
      <div 
        className="grid gap-0.5"
        style={{ 
          gridTemplateColumns: `repeat(${board[0]?.length || 9}, 1.25rem)` 
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={getCellClass(cell)}
            >
              {getCellContent(cell)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
