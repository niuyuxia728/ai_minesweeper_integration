import { GameBoard } from './GameBoard';
import { GameHeader } from './GameHeader';
import { useGameLogic } from './useGameLogic';
import { leaderboardApi, authApi } from '@/services/mockApi';
import { useCallback } from 'react';

export const Minesweeper = () => {
  const handleWin = useCallback(async (time: number) => {
    const user = await authApi.getCurrentUser();
    if (user) {
      try {
        await leaderboardApi.submitScore(user.username, time, 'easy');
        console.log('Score submitted:', user.username, time);
      } catch (error) {
        console.error('Failed to submit score:', error);
      }
    }
  }, []);

  const { gameState, handleCellClick, handleCellRightClick, resetGame } = useGameLogic(handleWin);

  const isGameOver = gameState.status === 'won' || gameState.status === 'lost';

  return (
    <div className="flex flex-col items-center">
      <GameHeader
        minesCount={gameState.minesCount}
        flagsCount={gameState.flagsCount}
        timer={gameState.timer}
        status={gameState.status}
        onReset={resetGame}
      />
      
      <GameBoard
        board={gameState.board}
        isGameOver={isGameOver}
        onCellClick={handleCellClick}
        onCellRightClick={handleCellRightClick}
      />

      <div className="mt-6 text-muted-foreground text-sm text-center space-y-1">
        <p>Left click to reveal • Right click to flag</p>
        <p className="text-xs opacity-70">9×9 grid • 10 mines</p>
      </div>
    </div>
  );
};
