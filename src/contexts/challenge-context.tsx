"use client";

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { countries, type Country } from '@/lib/countries';
import { translations, type Language } from '@/lib/translations';
import { generateQuestion, type Question } from '@/lib/challenge-logic';
import { useGame } from './game-context';
import { useAuth } from './auth-context';
import { updateUserProfile } from '@/firebase/user';

type ChallengeGameState = 'playing' | 'answered' | 'gameOver';

const LOCAL_HIGH_SCORE_KEY = 'world_challenge_highscore';

interface ChallengeContextType {
  t: (typeof translations)[Language];
  language: Language;
  question: Question | null;
  score: number;
  highScore: number;
  gameState: ChallengeGameState;
  selectedAnswer: Country | null;
  selectAnswer: (country: Country) => void;
  restartGame: () => void;
}

const ChallengeContext = createContext<ChallengeContextType | undefined>(undefined);

export const ChallengeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, challengeQuestionTypes } = useGame();
  const { user, profile } = useAuth();
  const t = useMemo(() => translations[language], [language]);

  const [question, setQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<ChallengeGameState>('playing');
  const [selectedAnswer, setSelectedAnswer] = useState<Country | null>(null);
  const [askedQuestionKeys, setAskedQuestionKeys] = useState<string[]>([]);
  
  useEffect(() => {
    // Set high score from either local storage (guest) or profile (logged in)
    const localHighScore = parseInt(localStorage.getItem(LOCAL_HIGH_SCORE_KEY) || '0', 10);
    const profileHighScore = profile?.bestWorldQuizScore || 0;
    setHighScore(Math.max(localHighScore, profileHighScore));
    
    if (challengeQuestionTypes.length > 0) {
      const newQuestion = generateQuestion(countries, language, challengeQuestionTypes, []);
      setQuestion(newQuestion);
      setAskedQuestionKeys([`${newQuestion.correctAnswer.id}-${newQuestion.type}`]);
    }
  }, [language, challengeQuestionTypes, profile]);

  const handleGameOver = useCallback((finalScore: number) => {
    const newHighScore = Math.max(finalScore, highScore);
    setHighScore(newHighScore);

    if (user && profile) {
      if (finalScore > (profile.bestWorldQuizScore || 0)) {
        updateUserProfile(user.uid, { bestWorldQuizScore: finalScore });
      }
    } else {
      localStorage.setItem(LOCAL_HIGH_SCORE_KEY, String(newHighScore));
    }

    setTimeout(() => {
      setGameState('gameOver');
    }, 1500);
  }, [user, profile, highScore]);

  const nextQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setGameState('playing');
    if (challengeQuestionTypes.length > 0) {
        const newQuestion = generateQuestion(countries, language, challengeQuestionTypes, askedQuestionKeys);
        const newKey = `${newQuestion.correctAnswer.id}-${newQuestion.type}`;

        if (askedQuestionKeys.includes(newKey) && askedQuestionKeys.length > 0) {
            setAskedQuestionKeys([newKey]);
        } else {
            setAskedQuestionKeys(prev => [...prev, newKey]);
        }
        setQuestion(newQuestion);
    }
  }, [language, challengeQuestionTypes, askedQuestionKeys]);
  
  const selectAnswer = useCallback((country: Country) => {
    if (gameState !== 'playing') return;

    setSelectedAnswer(country);
    setGameState('answered');

    if (country.id === question?.correctAnswer.id) {
      const newScore = score + 1;
      setScore(newScore);
      setTimeout(() => {
        nextQuestion();
      }, 1500);
    } else {
      handleGameOver(score);
    }
  }, [gameState, question, score, nextQuestion, handleGameOver]);

  const restartGame = useCallback(() => {
    setScore(0);
    setSelectedAnswer(null);
    setGameState('playing');
     if (challengeQuestionTypes.length > 0) {
        const newQuestion = generateQuestion(countries, language, challengeQuestionTypes, []);
        setQuestion(newQuestion);
        setAskedQuestionKeys([`${newQuestion.correctAnswer.id}-${newQuestion.type}`]);
    }
  }, [language, challengeQuestionTypes]);


  const value = {
    t,
    language,
    question,
    score,
    highScore,
    gameState,
    selectedAnswer,
    selectAnswer,
    restartGame,
  };

  return <ChallengeContext.Provider value={value}>{children}</ChallengeContext.Provider>;
};

export const useChallenge = () => {
  const context = useContext(ChallengeContext);
  if (context === undefined) {
    throw new Error('useChallenge must be used within a ChallengeProvider');
  }
  return context;
};
