'use client';

import React, { useState } from 'react';
import { useGame } from '@/contexts/game-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, LogIn } from 'lucide-react';
import { JoinLobbyDialog } from './join-lobby-dialog';

export function MultiplayerChallengeMenu() {
  const { setView, t, handleCreateLobby } = useGame();
  const { user, profile, setAuthDialogOpen } = useAuth();
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  const onCreateGame = () => {
    if (!user || user.isAnonymous || !profile) {
      setAuthDialogOpen(true);
      return;
    }
    handleCreateLobby('challenge');
  };

  const onJoinGame = () => {
     if (!user || user.isAnonymous || !profile) {
      setAuthDialogOpen(true);
      return;
    }
    setJoinDialogOpen(true);
  };

  return (
    <>
      <div className="relative flex flex-col items-center justify-center h-full p-4 text-center">
        <Button variant="ghost" className="absolute top-4 left-4" onClick={() => setView('multiplayer_menu')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.back}
        </Button>

        <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-headline text-primary drop-shadow-lg mb-12">
          {t.worldChallenge}
        </h2>

        <div className="flex flex-col gap-6 w-full max-w-xs">
          <Button size="lg" onClick={onCreateGame} className="w-full py-6 text-lg font-semibold">
            <PlusCircle className="mr-3 h-6 w-6" />
            {t.createGame}
          </Button>
          <Button size="lg" variant="outline" onClick={onJoinGame} className="w-full py-6 text-lg font-semibold">
            <LogIn className="mr-3 h-6 w-6" />
            {t.joinGame}
          </Button>
        </div>
      </div>
      <JoinLobbyDialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen} />
    </>
  );
}
