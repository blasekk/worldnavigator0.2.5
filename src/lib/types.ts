import type { Timestamp } from 'firebase/firestore';
import type { QuestionType } from '@/lib/challenge-logic';
import type { GuessResult } from '@/lib/game-logic';

export interface UserProfile {
  id: string;
  username: string;
  avatarId: string;
  avatarUrl: string;
  bestClassicScore?: number;
  bestWorldQuizScore?: number;
}

export interface LobbyPlayer {
  uid: string;
  username: string;
  avatarUrl: string;
}

export interface LobbyGuess extends Omit<GuessResult, 'guessedCountry'> {
  playerId: string;
  guessedCountryId: string;
  guessedCountryName: string;
}

export interface SerializableQuestion {
  type: QuestionType;
  correctAnswerId: string;
  optionsIds: string[];
  image?: string;
  text?: string;
  audio?: string;
}

export interface GameLobby {
  id: string; // The PIN
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  players: LobbyPlayer[];
  gameMode: 'classic' | 'challenge';
  createdAt: Timestamp;

  // Classic mode
  targetCountryId?: string;
  currentPlayerUid?: string;
  guesses?: LobbyGuess[];

  // Challenge mode
  challengeQuestionTypes?: QuestionType[];
  challengeQuestions?: SerializableQuestion[];
  currentQuestionIndex?: number;
  playerScores?: { [uid: string]: number };
  currentAnswers?: { [uid: string]: { answerId: string, isCorrect: boolean } };

  winnerUid?: string;
}
