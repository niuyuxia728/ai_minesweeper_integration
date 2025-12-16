import { Cell } from './Cell';
import { Cell as CellType } from './types';

interface GameBoardProps {
  board: CellType[][];
  isGameOver: boolean;
  onCellClick: (row: number, col: number) => void;
  onCellRightClick: (row: number, col: number) => void;
}

export const GameBoard = ({ board, isGameOver, onCellClick, onCellRightClick }: GameBoardProps) => {
  return (
    <div className="bg-card p-3 rounded-lg shadow-lg border border-border">
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${board[0].length}, 1fr)` }}>
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              row={rowIndex}
              col={colIndex}
              isGameOver={isGameOver}
              onClick={onCellClick}
              onRightClick={onCellRightClick}
            />
          ))
        )}
      </div>
    </div>
  );
};
