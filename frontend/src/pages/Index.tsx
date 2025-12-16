import { useState } from 'react';
import { Minesweeper } from '@/components/Minesweeper/Minesweeper';
import { AuthModal } from '@/components/Auth/AuthModal';
import { UserMenu } from '@/components/Auth/UserMenu';
import { Leaderboard } from '@/components/Leaderboard/Leaderboard';
import { SpectatorMode } from '@/components/Spectator/SpectatorMode';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gamepad2, Trophy, Users } from 'lucide-react';

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-retro text-3xl text-foreground">
            Minesweeper
          </h1>
          <UserMenu onLoginClick={() => setIsAuthModalOpen(true)} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="play" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="play" className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              Play
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="spectate" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Spectate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="play" className="flex justify-center">
            <div className="flex flex-col items-center">
              <Minesweeper />
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="max-w-md mx-auto">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="spectate" className="max-w-lg mx-auto">
            <SpectatorMode />
          </TabsContent>
        </Tabs>
      </main>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

export default Index;
