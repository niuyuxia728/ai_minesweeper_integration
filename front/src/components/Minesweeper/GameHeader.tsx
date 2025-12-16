import { Bomb, Flag, Timer, RotateCcw, Smile, Frown, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameStatus } from './types';
import { cn } from '@/lib/utils';

interface GameHeaderProps {
  minesCount: number;
  flagsCount: number;
  timer: number;
  status: GameStatus;
  onReset: () => void;
}

export const GameHeader = ({ minesCount, flagsCount, timer, status, onReset }: GameHeaderProps) => {
  const formatTime = (seconds: number) => {
    return String(Math.min(seconds, 999)).padStart(3, '0');
  };

  const StatusIcon = () => {
    switch (status) {
      case 'won':
        return <PartyPopper className="w-6 h-6 text-primary" />;
      case 'lost':
        return <Frown className="w-6 h-6 text-destructive" />;
      default:
        return <Smile className="w-6 h-6 text-foreground" />;
    }
  };

  return (
    <div className="bg-card p-4 rounded-lg shadow-lg border border-border mb-4">
      <div className="flex items-center justify-between gap-4">
        {/* Mines Counter */}
        <div className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-md">
          <Bomb className="w-5 h-5 text-destructive" />
          <span className="font-retro text-2xl text-foreground min-w-[3ch]">
            {String(Math.max(0, minesCount - flagsCount)).padStart(3, '0')}
          </span>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          size="lg"
          onClick={onReset}
          className={cn(
            'h-12 w-12 p-0 border-2',
            status === 'won' && 'border-primary animate-pulse',
            status === 'lost' && 'border-destructive animate-shake'
          )}
        >
          {status === 'playing' ? (
            <StatusIcon />
          ) : (
            <RotateCcw className="w-5 h-5" />
          )}
        </Button>

        {/* Timer */}
        <div className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-md">
          <Timer className="w-5 h-5 text-primary" />
          <span className="font-retro text-2xl text-foreground min-w-[3ch]">
            {formatTime(timer)}
          </span>
        </div>
      </div>

      {/* Status Message */}
      {status !== 'playing' && (
        <div className={cn(
          'mt-3 text-center font-retro text-2xl',
          status === 'won' ? 'text-primary' : 'text-destructive'
        )}>
          {status === 'won' ? '🎉 You Win!' : '💥 Game Over!'}
        </div>
      )}
    </div>
  );
};
