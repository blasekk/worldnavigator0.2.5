"use client";

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { doc } from 'firebase/firestore';
import { countries, type Country } from '@/lib/countries';
import { translations, type Language } from '@/lib/translations';
import { getRandomCountry, evaluateGuess, type GuessResult } from '@/lib/game-logic';
import { useToast } from '@/hooks/use-toast';
import type { QuestionType } from '@/lib/challenge-logic';
import { useAuth } from './auth-context';
import { updateUserProfile } from '@/firebase/user';
import { useFirestore, useDoc } from '@/firebase';
import { createLobby, joinLobby, startGameInLobby, submitLobbyGuess, GameLobby, updateLobbyChallengeTypes, submitChallengeAnswer, advanceChallengeRound } from '@/firebase/multiplayer';
import { useMemoFirebase } from '@/firebase/provider';


type View = 'menu' | 'settings' | 'game' | 'challenge' | 'singleplayer_menu' | 'multiplayer_menu' | 'multiplayer_classic_menu' | 'multiplayer_challenge_menu' | 'lobby' | 'profile';
type GameState = 'playing' | 'won' | 'given_up';

interface GameContextType {
  view: View;
  setView: (view: View) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (typeof translations)[Language];
  
  targetCountry: Country | null;
  guesses: GuessResult[];
  gameState: GameState;
  
  challengeQuestionTypes: QuestionType[];
  setChallengeQuestionTypes: (types: QuestionType[]) => void;
  
  lobbyId: string | null;
  setLobbyId: (id: string | null) => void;
  lobby: GameLobby | null;
  isRoundReveal: boolean;

  startGame: () => void;
  submitGuess: (countryName: string) => void;
  giveUp: () => void;
  nextGame: () => void;
  handleCreateLobby: (gameMode: 'classic' | 'challenge') => void;
  handleJoinLobby: (pin: string) => Promise<boolean>;
  handleStartLobbyGame: () => void;
  handleUpdateLobbyChallengeTypes: (types: QuestionType[]) => void;
  handleChallengeAnswer: (answerId: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<View>('menu');
  const [language, setLanguage] = useState<Language>('hu');
  const [targetCountry, setTargetCountry] = useState<Country | null>(null);
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [challengeQuestionTypes, setChallengeQuestionTypes] = useState<QuestionType[]>(['flag', 'capital', 'audio', 'dish', 'animal']);
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [isRoundReveal, setIsRoundReveal] = useState(false);

  const { toast } = useToast();
  const { user, profile, setAuthDialogOpen } = useAuth();
  const firestore = useFirestore();

  const lobbyRef = useMemoFirebase(() => {
    if (!firestore || !lobbyId) return null;
    return doc(firestore, 'lobbies', lobbyId);
  }, [firestore, lobbyId]);

  const { data: lobby } = useDoc<GameLobby>(lobbyRef);

  useEffect(() => {
    if (lobby?.status === 'playing') {
      if (lobby.gameMode === 'classic' && view !== 'game') {
        setView('game');
      } else if (lobby.gameMode === 'challenge' && view !== 'challenge') {
        setView('challenge');
      }
    }

    if (lobby?.gameMode === 'challenge' && lobby.status === 'playing' && lobbyId && firestore) {
      const answersCount = Object.keys(lobby.currentAnswers || {}).length;
      if (answersCount === 2 && !isRoundReveal) {
        setIsRoundReveal(true);
        const revealTimer = setTimeout(() => {
          if (user?.uid === lobby.hostId) {
            advanceChallengeRound(firestore, lobbyId);
          }
          setIsRoundReveal(false);
        }, 3000);
        return () => clearTimeout(revealTimer);
      }
    }
  }, [lobby, view, firestore, user, isRoundReveal, lobbyId]);


  const t = useMemo(() => translations[language], [language]);

  const startNewGameRound = useCallback(() => {
    setGuesses([]);
    setGameState('playing');
    setTargetCountry(getRandomCountry(countries));
  }, []);

  useEffect(() => {
    if (!targetCountry) {
      startNewGameRound();
    }
  }, [targetCountry, startNewGameRound]);

  const handleClassicGameOver = (isWin: boolean, guessCount: number) => {
    if (isWin && user && profile && !user.isAnonymous) {
      const currentBest = profile.bestClassicScore;
      // Lower is better for classic mode
      if (currentBest === undefined || guessCount < currentBest) {
        updateUserProfile(user.uid, { bestClassicScore: guessCount });
      }
    }
  };

  const startGame = useCallback(() => {
    startNewGameRound();
    setView('game');
  }, [startNewGameRound]);

  const nextGame = useCallback(() => {
    startNewGameRound();
  }, [startNewGameRound]);

  const submitGuess = useCallback((countryName: string) => {
    if (lobbyId && firestore && user && profile && lobby) { // Multiplayer
        submitLobbyGuess(firestore, lobbyId, user, profile, countryName, language).catch(error => {
             toast({
                variant: "destructive",
                title: t.error,
                description: (error as Error).message || "Could not submit guess.",
             });
        });
    } else { // Single player
        if (gameState !== 'playing' || !targetCountry) return;

        const guessedCountry = countries.find(c => c.name[language].toLowerCase() === countryName.toLowerCase());

        if (!guessedCountry) {
          toast({
            variant: "destructive",
            title: t.error,
            description: "Invalid country name.",
          });
          return;
        }

        const result = evaluateGuess(guessedCountry, targetCountry);
        const newGuesses = [result, ...guesses];
        setGuesses(newGuesses);

        if (result.isCorrect) {
          setGameState('won');
          toast({
            title: t.youWon,
            description: t.congratsWithCount.replace('{count}', String(newGuesses.length)),
          });
          handleClassicGameOver(true, newGuesses.length);
        }
    }
  }, [lobbyId, firestore, user, profile, lobby, language, gameState, targetCountry, t, toast, guesses, handleClassicGameOver]);

  const giveUp = useCallback(() => {
    if (!targetCountry) return;
    setGameState('given_up');
    toast({
      title: t.youLost,
      description: `${t.correctAnswerWas} ${targetCountry.name[language]}.`,
      variant: 'destructive',
    });
    handleClassicGameOver(false, guesses.length + 1);
  }, [targetCountry, language, t, toast, guesses, handleClassicGameOver]);

  const handleCreateLobby = useCallback(async (gameMode: 'classic' | 'challenge') => {
    if (!user || !profile) {
      setAuthDialogOpen(true);
      return;
    }
    if (!firestore) return;

    try {
      const newLobbyId = await createLobby(firestore, user, profile, gameMode);
      setLobbyId(newLobbyId);
      setView('lobby');
    } catch (error) {
      console.error("Error creating lobby:", error);
      toast({
        variant: "destructive",
        title: t.error,
        description: t.lobbyCreationError,
      });
    }
  }, [user, profile, firestore, setView, setLobbyId, toast, setAuthDialogOpen, t]);

  const handleJoinLobby = useCallback(async (pin: string): Promise<boolean> => {
    if (!user || !profile) {
      setAuthDialogOpen(true);
      return false;
    }
    if (!firestore) return false;

    try {
      await joinLobby(firestore, pin, user, profile);
      setLobbyId(pin);
      setView('lobby');
      return true;
    } catch (error: any) {
      console.error("Error joining lobby:", error);
      toast({
        variant: "destructive",
        title: t.error,
        description: error.message || t.lobbyJoinError,
      });
      return false;
    }
  }, [user, profile, firestore, setView, setLobbyId, toast, setAuthDialogOpen, t]);

  const handleStartLobbyGame = useCallback(async () => {
    if (!firestore || !lobbyId) return;
    try {
      await startGameInLobby(firestore, lobbyId);
    } catch (error) {
       console.error("Error starting game:", error);
       toast({
         variant: "destructive",
         title: t.error,
         description: (error as Error).message || "Could not start game.",
       });
    }
  }, [firestore, lobbyId, t, toast]);

  const handleUpdateLobbyChallengeTypes = useCallback(async (types: QuestionType[]) => {
    if (!firestore || !lobbyId) return;
    try {
      await updateLobbyChallengeTypes(firestore, lobbyId, types);
    } catch (error) {
       console.error("Error updating lobby types:", error);
       toast({
         variant: "destructive",
         title: t.error,
         description: (error as Error).message || t.lobbyUpdateError,
       });
    }
  }, [firestore, lobbyId, t, toast]);

  const handleChallengeAnswer = useCallback(async (answerId: string) => {
    if (!firestore || !lobbyId || !user) return;
    try {
      await submitChallengeAnswer(firestore, lobbyId, user.uid, answerId);
    } catch (error) {
      console.error("Error submitting challenge answer:", error);
      toast({
        variant: "destructive",
        title: t.error,
        description: (error as Error).message || "Could not submit answer.",
      });
    }
  }, [firestore, lobbyId, user, t, toast]);


  const value = {
    view,
    setView,
    language,
    setLanguage,
    t,
    targetCountry,
    guesses,
    gameState,
    challengeQuestionTypes,
    setChallengeQuestionTypes,
    lobbyId,
    setLobbyId,
    lobby,
    isRoundReveal,
    startGame,
    submitGuess,
    giveUp,
    nextGame,
    handleCreateLobby,
    handleJoinLobby,
    handleStartLobbyGame,
    handleUpdateLobbyChallengeTypes,
    handleChallengeAnswer,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
