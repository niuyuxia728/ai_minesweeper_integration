import { useState, useEffect } from 'react';
import { spectatorApi, ActivePlayer } from '@/services/mockApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Users, Clock, Flag, ArrowLeft } from 'lucide-react';
import { SpectatorBoard } from './SpectatorBoard';

export const SpectatorMode = () => {
  const [activePlayers, setActivePlayers] = useState<ActivePlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<ActivePlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = spectatorApi.subscribeToActivePlayers((players) => {
      setActivePlayers(players);
      setIsLoading(false);
      
      // Update selected player if watching
      if (selectedPlayer) {
        const updated = players.find(p => p.id === selectedPlayer.id);
        if (updated) {
          setSelectedPlayer(updated);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [selectedPlayer?.id]);

  const handleWatch = (player: ActivePlayer) => {
    setSelectedPlayer(player);
  };

  const handleBack = () => {
    setSelectedPlayer(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'playing':
        return 'text-primary';
      case 'won':
        return 'text-green-500';
      case 'lost':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'playing':
        return 'Playing';
      case 'won':
        return 'Won!';
      case 'lost':
        return 'Lost';
      default:
        return status;
    }
  };

  if (selectedPlayer) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <CardTitle className="font-retro text-xl flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Watching: {selectedPlayer.username}
            </CardTitle>
            <div className={`font-semibold ${getStatusColor(selectedPlayer.status)}`}>
              {getStatusText(selectedPlayer.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-6 mb-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="font-mono">{formatTime(selectedPlayer.timer)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flag className="h-4 w-4 text-accent" />
                <span className="font-mono">{selectedPlayer.flagsCount}/{selectedPlayer.minesCount}</span>
              </div>
            </div>
            <SpectatorBoard board={selectedPlayer.board} status={selectedPlayer.status} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-retro text-xl flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Active Players
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-secondary/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-retro text-xl flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Active Players ({activePlayers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activePlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{player.username}</span>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(player.timer)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Flag className="h-3 w-3" />
                    {player.flagsCount}/{player.minesCount}
                  </span>
                  <span className={getStatusColor(player.status)}>
                    {getStatusText(player.status)}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWatch(player)}
                className="border-primary/50 hover:bg-primary/10"
              >
                <Eye className="h-4 w-4 mr-2" />
                Watch
              </Button>
            </div>
          ))}

          {activePlayers.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No active players at the moment.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
