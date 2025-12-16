import { memo } from 'react';
import { Flag, Bomb } from 'lucide-react';
import { Cell as CellType } from './types';
import { cn } from '@/lib/utils';

interface CellProps {
  cell: CellType;
  row: number;
  col: number;
  isGameOver: boolean;
  onClick: (row: number, col: number) => void;
  onRightClick: (row: number, col: number) => void;
}

const numberClasses = [
  '',
  'num-1',
  'num-2',
  'num-3',
  'num-4',
  'num-5',
  'num-6',
  'num-7',
  'num-8',
];

export const Cell = memo(({ cell, row, col, isGameOver, onClick, onRightClick }: CellProps) => {
  const handleClick = () => {
    if (!cell.isRevealed && !cell.isFlagged) {
      onClick(row, col);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!cell.isRevealed) {
      onRightClick(row, col);
    }
  };

  const getCellContent = () => {
    if (cell.isFlagged && !cell.isRevealed) {
      return <Flag className="w-4 h-4 text-accent" />;
    }
    
    if (cell.isRevealed) {
      if (cell.isMine) {
        return <Bomb className="w-4 h-4 text-destructive-foreground" />;
      }
      if (cell.neighborMines > 0) {
        return (
          <span className={cn('font-retro text-xl font-bold', numberClasses[cell.neighborMines])}>
            {cell.neighborMines}
          </span>
        );
      }
    }
    
    return null;
  };

  return (
    <button
      className={cn(
        'w-8 h-8 flex items-center justify-center transition-all duration-100',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background',
        !cell.isRevealed && 'cell-hidden hover:brightness-110 active:brightness-90 cursor-pointer',
        cell.isRevealed && 'cell-revealed animate-reveal',
        cell.isRevealed && cell.isMine && !cell.isFlagged && 'cell-exploded',
        isGameOver && cell.isMine && cell.isRevealed && !cell.isFlagged && 'cell-mine'
      )}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      disabled={cell.isRevealed}
    >
      {getCellContent()}
    </button>
  );
});

Cell.displayName = 'Cell';
