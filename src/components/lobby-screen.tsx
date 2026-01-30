'use client';

import React, { useEffect } from 'react';
import { useGame } from '@/contexts/game-context';
import { useAuth } from '@/contexts/auth-context';
import { useDoc, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/provider';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Loader2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import type { GameLobby } from '@/firebase/multiplayer';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import type { QuestionType } from '@/lib/challenge-logic';

export function LobbyScreen() {
  const { setView, t, lobbyId, handleStartLobbyGame, handleUpdateLobbyChallengeTypes } = useGame();
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const lobbyRef = useMemoFirebase(() => {
    if (!firestore || !lobbyId) return null;
    return doc(firestore, 'lobbies', lobbyId);
  }, [firestore, lobbyId]);

  const { data: lobby, isLoading } = useDoc<GameLobby>(lobbyRef);

  useEffect(() => {
    if (lobby?.status === 'playing') {
      setView('game');
    }
  }, [lobby, setView]);

  const handleCopyPin = () => {
    if (lobbyId) {
      navigator.clipboard.writeText(lobbyId);
      toast({ title: t.pinCopied });
    }
  };
  
  // TODO: Add leave lobby functionality

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{t.loading}...</p>
      </div>
    );
  }

  if (!lobby) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-destructive-foreground">Lobby not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => setView('multiplayer_classic_menu')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.back}
        </Button>
      </div>
    );
  }

  const isHost = user?.uid === lobby.hostId;
  
  const allQuestionTypes: QuestionType[] = ['flag', 'capital', 'audio', 'dish', 'animal'];
  const typeLabels: Partial<Record<QuestionType, string>> = {
    flag: t.flags,
    capital: t.capitals,
    audio: t.anthems,
    dish: t.dishes,
    animal: t.animals,
  };

  const handleChallengeTypeChange = (type: QuestionType, checked: boolean) => {
    if (!lobby || !lobby.challengeQuestionTypes) return;
    
    let newTypes: QuestionType[];
    if (checked) {
      newTypes = [...lobby.challengeQuestionTypes, type];
    } else {
      if (lobby.challengeQuestionTypes.length === 1) {
          toast({
              title: t.noChallengeCategorySelected,
              variant: "destructive",
          });
          return;
      }
      newTypes = lobby.challengeQuestionTypes.filter(t => t !== type);
    }
    handleUpdateLobbyChallengeTypes(newTypes);
  };

  return (
    <div className="flex flex-col items-center h-full p-4 relative">
      <Button variant="ghost" className="absolute top-4 left-4" onClick={() => setView(lobby.gameMode === 'classic' ? 'multiplayer_classic_menu' : 'multiplayer_challenge_menu')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t.back}
      </Button>

      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-lg">
        <Card className="w-full text-center">
          <CardHeader>
            <CardTitle className="text-3xl">{t.lobby}</CardTitle>
            <CardDescription>{t.lobbyDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Label className="text-sm text-muted-foreground">{t.lobbyPinIs}</Label>
              <div className="flex items-center justify-center gap-2 mt-2">
                <p className="text-4xl font-bold tracking-widest bg-muted p-3 rounded-md">{lobbyId}</p>
                <Button variant="outline" size="icon" onClick={handleCopyPin}>
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold">{t.playersInLobby} ({lobby.players.length}/2)</h3>
              <div className="grid grid-cols-2 gap-4">
                {lobby.players.map(player => (
                  <div key={player.uid} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-card">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={player.avatarUrl} />
                      <AvatarFallback>{player.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p className="font-medium truncate">{player.username}</p>
                  </div>
                ))}
                {lobby.players.length < 2 && (
                  <div className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg bg-muted/50 border-2 border-dashed">
                     <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                     <p className="text-sm text-muted-foreground">{t.waitingForOpponent}</p>
                  </div>
                )}
              </div>
            </div>

            {isHost && lobby.gameMode === 'challenge' && lobby.status === 'waiting' && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4 text-left">
                  <h3 className="font-semibold text-center">{t.questionCategories}</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {allQuestionTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={lobby.challengeQuestionTypes?.includes(type)}
                          onCheckedChange={(checked) => handleChallengeTypeChange(type, !!checked)}
                        />
                        <Label htmlFor={`type-${type}`} className="font-normal capitalize">
                          {typeLabels[type]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {isHost && lobby.players.length === 2 && lobby.status === 'waiting' && (
              <Button size="lg" className="mt-8 w-full" onClick={handleStartLobbyGame}>
                {t.startGame}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
