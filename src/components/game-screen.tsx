"use client";

import React, { useState, useRef } from 'react';
import { useGame } from "@/contexts/game-context";
import { countries } from '@/lib/countries';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { GuessResultCard } from "@/components/guess-result-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import type { GuessResult } from '@/lib/game-logic';
import type { LobbyGuess } from '@/firebase/multiplayer';

export function GameScreen() {
  const { 
    guesses: spGuesses, 
    gameState: spGameState, 
    giveUp, 
    nextGame, 
    targetCountry: spTargetCountry,
    submitGuess, 
    t, 
    language,
    setView,
    lobbyId,
    lobby,
  } = useGame();
  
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isMultiplayer = !!lobbyId && !!lobby;
  
  const targetCountry = isMultiplayer 
    ? countries.find(c => c.id === lobby.targetCountryId)
    : spTargetCountry;

  const derivedGuesses = isMultiplayer ? (lobby.guesses || []) : spGuesses;
  
  const gameState = isMultiplayer ? lobby.status : spGameState;

  const isMyTurn = isMultiplayer && lobby.currentPlayerUid === user?.uid;
  const isGameOver = gameState === 'won' || gameState === 'given_up' || gameState === 'finished';
  const canSubmit = isMultiplayer ? isMyTurn && !isGameOver : !isGameOver;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      submitGuess(inputValue.trim());
      setInputValue('');
    }
  };

  const getTurnMessage = () => {
    if (!isMultiplayer || isGameOver) return null;
    if (isMyTurn) return t.yourTurn;
    const currentPlayer = lobby.players.find(p => p.uid === lobby.currentPlayerUid);
    return t.waitingForTurn.replace('{playerName}', currentPlayer?.username || '...');
  };

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto p-4">
        <header className="grid grid-cols-3 items-center mb-4 flex-shrink-0">
            <div className="justify-self-start">
              <Button variant="ghost" onClick={() => setView(isMultiplayer ? 'multiplayer_classic_menu' : 'menu')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {isMultiplayer ? t.backToLobby : t.backToMenu}
              </Button>
            </div>
            <h1 className="text-xl font-bold font-headline text-primary justify-self-center">{t.appName}</h1>
            <div className="justify-self-end text-lg font-semibold">
                {!isGameOver && derivedGuesses.length > 0 && (
                    <span className="text-muted-foreground animate-in fade-in">
                        {t.attempts}: {derivedGuesses.length}
                    </span>
                )}
            </div>
        </header>

        <Card className="mb-4 shadow-md flex-shrink-0 bg-card">
            <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                    <div className="w-full relative">
                        <Input
                            ref={inputRef}
                            type="text"
                            list="country-list"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={isMultiplayer && !isMyTurn ? t.waitingForOpponent : t.countryInputPlaceholder}
                            disabled={!canSubmit || !inputValue.trim()}
                        />
                        <datalist id="country-list">
                            {countries.map((country) => (
                                <option key={country.id} value={country.name[language]} />
                            ))}
                        </datalist>
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" disabled={!canSubmit || !inputValue.trim()} className="flex-1">
                            {t.guess}
                        </Button>
                         {!isMultiplayer && !isGameOver && (
                             <Button type="button" variant="destructive" onClick={giveUp}>
                                 {t.giveUp}
                             </Button>
                         )}
                    </div>
                </form>

                {getTurnMessage() && (
                  <div className="mt-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {getTurnMessage()}
                  </div>
                )}
                
                {isGameOver && (
                  <>
                    {!isMultiplayer && (
                      <div className="mt-4 text-center animate-in fade-in duration-500">
                          {gameState === 'won' && <p className="font-semibold text-primary">{t.congratsWithCount.replace('{count}', String(derivedGuesses.length))}</p>}
                          {gameState === 'given_up' && targetCountry && (
                              <p className="font-semibold text-destructive">{t.correctAnswerWas} {targetCountry.name[language]}.</p>
                          )}
                          <Button onClick={nextGame} className="mt-2">
                              {t.next}
                              <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                      </div>
                    )}
                    {isMultiplayer && gameState === 'finished' && (
                       <div className="mt-4 text-center animate-in fade-in duration-500">
                          {lobby.winnerUid === user?.uid ? (
                              <p className="font-semibold text-primary">{t.youAreTheWinner}</p>
                          ) : (
                              <p className="font-semibold text-destructive">
                                  {t.playerWon.replace('{playerName}', lobby.players.find(p => p.uid === lobby.winnerUid)?.username || 'Opponent')}
                              </p>
                          )}
                          {/* TODO: Add a "New Game" button for the host */}
                          <Button onClick={() => setView('multiplayer_classic_menu')} className="mt-2">
                              {t.backToLobby}
                          </Button>
                      </div>
                    )}
                  </>
                )}
            </CardContent>
        </Card>
        
        <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-3 pr-4 pb-4">
              {derivedGuesses.length === 0 && !isGameOver && (
                <div className="text-center text-muted-foreground py-10">
                  <p>{t.guessTheCountry}</p>
                </div>
              )}
                {derivedGuesses.map((guess, index) => {
                  if (isMultiplayer) {
                    const lobbyGuess = guess as LobbyGuess;
                    const player = lobby.players.find(p => p.uid === lobbyGuess.playerId);
                    const guessedCountry = countries.find(c => c.id === lobbyGuess.guessedCountryId);
                    if (!player || !guessedCountry) return null;

                    const resultForCard: GuessResult = {
                      guessedCountry,
                      isCorrect: lobbyGuess.isCorrect,
                      continentMatch: lobbyGuess.continentMatch,
                      hemisphereMatch: lobbyGuess.hemisphereMatch,
                      tempComparison: lobbyGuess.tempComparison,
                      elevComparison: lobbyGuess.elevComparison,
                      direction: lobbyGuess.direction,
                    };
                    return <GuessResultCard key={index} result={resultForCard} playerName={player.username} />
                  } else {
                    return <GuessResultCard key={index} result={guess as GuessResult} />
                  }
                })}
            </div>
        </ScrollArea>
    </div>
  );
}
