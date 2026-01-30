'use client';
import {
  doc,
  setDoc,
  collection,
  getDoc,
  Firestore,
  runTransaction,
  arrayUnion,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { UserProfile, GameLobby, LobbyPlayer, LobbyGuess, SerializableQuestion } from '@/lib/types';
import { countries } from '@/lib/countries';
import { getRandomCountry, evaluateGuess } from '@/lib/game-logic';
import type { Language } from '@/lib/translations';
import { generateQuestion, type QuestionType } from '@/lib/challenge-logic';


// Function to generate a unique 6-digit PIN
const generatePin = async (firestore: Firestore): Promise<string> => {
  let pin: string;
  let pinExists: boolean;
  const lobbiesRef = collection(firestore, 'lobbies');

  do {
    pin = Math.floor(100000 + Math.random() * 900000).toString();
    const lobbyDoc = await getDoc(doc(lobbiesRef, pin));
    pinExists = lobbyDoc.exists();
  } while (pinExists);

  return pin;
};


export const createLobby = async (firestore: Firestore, user: User, profile: UserProfile, gameMode: 'classic' | 'challenge'): Promise<string> => {
  const pin = await generatePin(firestore);
  const lobbyRef = doc(firestore, 'lobbies', pin);

  const hostPlayer: LobbyPlayer = {
    uid: user.uid,
    username: profile.username,
    avatarUrl: profile.avatarUrl,
  };
  
  const newLobbyData: Partial<GameLobby> = {
    hostId: user.uid,
    status: 'waiting' as 'waiting',
    gameMode,
    players: [hostPlayer],
    guesses: [],
  };

  if (gameMode === 'classic') {
    const targetCountry = getRandomCountry(countries);
    newLobbyData.targetCountryId = targetCountry.id;
  } else if (gameMode === 'challenge') {
    newLobbyData.challengeQuestionTypes = ['flag', 'capital', 'audio', 'dish', 'animal'];
  }

  await setDoc(lobbyRef, {
      ...newLobbyData,
      createdAt: serverTimestamp(),
  });

  return pin;
};

export const joinLobby = async (firestore: Firestore, lobbyId: string, user: User, profile: UserProfile): Promise<boolean> => {
  const lobbyRef = doc(firestore, 'lobbies', lobbyId);

  try {
    await runTransaction(firestore, async (transaction) => {
      const lobbyDoc = await transaction.get(lobbyRef);
      if (!lobbyDoc.exists()) {
        throw new Error("A lobby with this PIN does not exist.");
      }

      const lobbyData = lobbyDoc.data() as GameLobby;
      
      if (lobbyData.players.length >= 2) {
        throw new Error("This lobby is full.");
      }

      if (lobbyData.status !== 'waiting') {
        throw new Error("This lobby is not available for joining.");
      }
      
      if (lobbyData.players.some(p => p.uid === user.uid)) {
        // Already in lobby, do nothing
        return;
      }

      const newPlayer: LobbyPlayer = {
        uid: user.uid,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
      };

      transaction.update(lobbyRef, {
        players: arrayUnion(newPlayer)
      });
    });
    return true;
  } catch (e) {
    console.error("Failed to join lobby:", e);
    // Let the caller handle the error message to the user
    throw e;
  }
};

export const updateLobbyChallengeTypes = async (firestore: Firestore, lobbyId: string, types: QuestionType[]): Promise<void> => {
    const lobbyRef = doc(firestore, 'lobbies', lobbyId);
    await updateDoc(lobbyRef, {
        challengeQuestionTypes: types
    });
};


export const startGameInLobby = async (firestore: Firestore, lobbyId: string): Promise<void> => {
    const lobbyRef = doc(firestore, 'lobbies', lobbyId);
    const lobbySnap = await getDoc(lobbyRef);
    if (!lobbySnap.exists()) throw new Error("Lobby not found");

    const lobbyData = lobbySnap.data() as GameLobby;

    const updates: Partial<GameLobby> = {
        status: 'playing',
    };

    if (lobbyData.gameMode === 'classic') {
        updates.currentPlayerUid = lobbyData.hostId;
    } else if (lobbyData.gameMode === 'challenge') {
        const questions: SerializableQuestion[] = [];
        const askedQuestionKeys: string[] = [];
        const questionTypes = lobbyData.challengeQuestionTypes || ['flag', 'capital'];
        
        for (let i = 0; i < 10; i++) { // 10 rounds
            const q = generateQuestion(countries, 'en', questionTypes, askedQuestionKeys);
            askedQuestionKeys.push(`${q.correctAnswer.id}-${q.type}`);
            questions.push({
                type: q.type,
                correctAnswerId: q.correctAnswer.id,
                optionsIds: q.options.map(opt => opt.id),
                image: q.image,
                text: q.text,
                audio: q.audio,
            });
        }

        updates.challengeQuestions = questions;
        updates.currentQuestionIndex = 0;
        updates.playerScores = {
            [lobbyData.players[0].uid]: 0,
            [lobbyData.players[1].uid]: 0,
        };
        updates.currentAnswers = {};
    }

    await updateDoc(lobbyRef, updates);
};

export const submitLobbyGuess = async (firestore: Firestore, lobbyId: string, player: User, profile: UserProfile, guessedCountryName: string, language: Language) => {
    const lobbyRef = doc(firestore, 'lobbies', lobbyId);

    await runTransaction(firestore, async (transaction) => {
        const lobbyDoc = await transaction.get(lobbyRef);
        if (!lobbyDoc.exists()) throw new Error("Lobby not found");

        const lobby = lobbyDoc.data() as GameLobby;
        if (lobby.status !== 'playing') throw new Error("Game is not active");
        if (lobby.currentPlayerUid !== player.uid) throw new Error("It's not your turn");

        const guessedCountry = countries.find(c => c.name[language].toLowerCase() === guessedCountryName.toLowerCase());
        if (!guessedCountry) throw new Error("Invalid country name");
        
        const targetCountry = countries.find(c => c.id === lobby.targetCountryId);
        if (!targetCountry) throw new Error("Target country not found in lobby");

        const result = evaluateGuess(guessedCountry, targetCountry);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { guessedCountry: _, ...resultToStore } = result;

        const newGuess: LobbyGuess = {
            ...resultToStore,
            playerId: player.uid,
            guessedCountryId: guessedCountry.id,
            guessedCountryName: guessedCountry.name[language]
        };

        const nextPlayer = lobby.players.find(p => p.uid !== player.uid);
        if (!nextPlayer) throw new Error("Opponent not found");

        const updates: any = {
            guesses: arrayUnion(newGuess),
            currentPlayerUid: nextPlayer.uid
        };

        if (result.isCorrect) {
            updates.status = 'finished';
            updates.winnerUid = player.uid;
        }

        transaction.update(lobbyRef, updates);
    });
};

export const submitChallengeAnswer = async (firestore: Firestore, lobbyId: string, userId: string, answerId: string): Promise<void> => {
    const lobbyRef = doc(firestore, 'lobbies', lobbyId);
    
    await runTransaction(firestore, async (transaction) => {
        const lobbyDoc = await transaction.get(lobbyRef);
        if (!lobbyDoc.exists()) throw new Error("Lobby not found");

        const lobby = lobbyDoc.data() as GameLobby;

        if (lobby.status !== 'playing' || lobby.gameMode !== 'challenge') throw new Error("Game is not active.");
        if (lobby.currentAnswers?.[userId]) throw new Error("You have already answered this question.");
        if (!lobby.challengeQuestions || lobby.currentQuestionIndex === undefined) throw new Error("Challenge data is missing.");

        const currentQuestion = lobby.challengeQuestions[lobby.currentQuestionIndex];
        const isCorrect = currentQuestion.correctAnswerId === answerId;

        transaction.update(lobbyRef, {
            [`currentAnswers.${userId}`]: { answerId, isCorrect }
        });
    });
};

export const advanceChallengeRound = async (firestore: Firestore, lobbyId: string): Promise<void> => {
    const lobbyRef = doc(firestore, 'lobbies', lobbyId);

    await runTransaction(firestore, async (transaction) => {
        const lobbyDoc = await transaction.get(lobbyRef);
        if (!lobbyDoc.exists()) throw new Error("Lobby not found");

        const lobby = lobbyDoc.data() as GameLobby;
        if (lobby.status !== 'playing' || lobby.gameMode !== 'challenge') return;
        if (!lobby.currentAnswers || Object.keys(lobby.currentAnswers).length < 2) return; 

        // Update scores
        const newScores = { ...lobby.playerScores } as { [uid: string]: number };
        for (const playerId in lobby.currentAnswers) {
            if (lobby.currentAnswers[playerId].isCorrect) {
                newScores[playerId] = (newScores[playerId] || 0) + 1;
            }
        }

        const nextQuestionIndex = (lobby.currentQuestionIndex || 0) + 1;

        if (nextQuestionIndex >= (lobby.challengeQuestions?.length || 0)) {
            // Game over
            let winnerUid: string | null = null;
            const [p1, p2] = Object.keys(newScores);
            if (newScores[p1] > newScores[p2]) {
                winnerUid = p1;
            } else if (newScores[p2] > newScores[p1]) {
                winnerUid = p2;
            } else {
                winnerUid = 'draw';
            }

            transaction.update(lobbyRef, {
                status: 'finished',
                playerScores: newScores,
                winnerUid: winnerUid
            });
        } else {
            // Next round
            transaction.update(lobbyRef, {
                playerScores: newScores,
                currentQuestionIndex: nextQuestionIndex,
                currentAnswers: {}
            });
        }
    });
};
