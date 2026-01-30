"use client";

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { ChallengeProvider, useChallenge } from '@/contexts/challenge-context';
import { useGame } from '@/contexts/game-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Play, Pause, RotateCw, Trophy, Check, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { countries, type Country } from '@/lib/countries';
import type { SerializableQuestion } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { Progress } from '@/components/ui/progress';

const SinglePlayerGameOver: React.FC = () => {
  const { score, highScore, restartGame, t } = useChallenge();
  const { setView } = useGame();

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm animate-in fade-in">
      <Card className="w-full max-w-sm text-center p-6">
        <Trophy className="mx-auto h-16 w-16 text-primary mb-4" />
        <h2 className="text-3xl font-bold mb-2">{t.gameOver}</h2>
        <p className="text-muted-foreground mb-6">{t.yourFinalScoreIs.replace('{score}', String(score))}</p>
        <div className="flex justify-around mb-8 text-lg">
          <div>
            <div className="font-bold text-primary text-3xl">{score}</div>
            <div className="text-sm text-muted-foreground">{t.score}</div>
          </div>
          <div>
            <div className="font-bold text-3xl">{highScore}</div>
            <div className="text-sm text-muted-foreground">{t.highScore}</div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Button size="lg" onClick={restartGame}>
            <RotateCw className="mr-2" />
            {t.playAgain}
          </Button>
          <Button size="lg" variant="outline" onClick={() => setView('menu')}>
            <ArrowLeft className="mr-2" />
            {t.backToMenu}
          </Button>
        </div>
      </Card>
    </div>
  );
};

const SinglePlayerChallengeView: React.FC = () => {
  const { setView } = useGame();
  const {
    t,
    language,
    question,
    score,
    gameState,
    selectedAnswer,
    selectAnswer,
  } = useChallenge();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, [question]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (!question) {
    return <div className="flex items-center justify-center h-full">{t.loading}...</div>;
  }

  const { type, options, correctAnswer, image, text, audio } = question;

  const getButtonClass = (option: Country) => {
    if (gameState !== 'answered') return '';
    if (option.id === correctAnswer.id) return 'bg-green-500 hover:bg-green-600 border-transparent text-primary-foreground';
    if (option.id === selectedAnswer?.id) return 'bg-destructive hover:bg-destructive/90 border-transparent text-destructive-foreground';
    return 'opacity-50';
  };

  return (
    <div className="relative flex flex-col h-full w-full max-w-3xl mx-auto p-4">
      {gameState === 'gameOver' && <SinglePlayerGameOver />}
      <header className="grid grid-cols-3 items-center mb-4 flex-shrink-0">
          <div className="justify-self-start">
            <Button variant="ghost" onClick={() => setView('menu')} disabled={gameState === 'answered'}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.backToMenu}
            </Button>
          </div>
          <h1 className="text-xl font-bold font-headline text-primary justify-self-center">{t.worldChallenge}</h1>
          <div className="justify-self-end text-lg font-semibold">
              <span className="text-muted-foreground">
                  {t.score}: {score}
              </span>
          </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-muted-foreground text-2xl sm:text-3xl mb-6 font-semibold">
          {type === 'flag' && t.flagQuestion}
          {type === 'capital' && t.capitalQuestion.replace('{capital}', text || '')}
          {type === 'audio' && t.anthemQuestion}
          {type === 'dish' && t.dishQuestion.replace('{dish}', text || '')}
          {type === 'animal' && t.animalQuestion.replace('{animal}', text || '')}
        </p>
        <div className="h-40 sm:h-48 w-full flex items-center justify-center mb-8">
            {type === 'flag' && image && (
                <Image
                    src={image}
                    alt={t.flag}
                    width={200}
                    height={120}
                    className="rounded-lg shadow-lg border-2 border-border object-contain max-h-full"
                />
            )}
            {type === 'audio' && audio && (
              <>
                <audio 
                  ref={audioRef} 
                  src={audio} 
                  className="hidden" 
                  preload="auto"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
                <Button
                    size="lg"
                    variant="outline"
                    onClick={toggleAudio}
                    className="h-24 w-24 rounded-full"
                >
                    {isPlaying ? <Pause className="h-12 w-12" /> : <Play className="h-12 w-12" />}
                </Button>
              </>
            )}
        </div>
      </div>
      
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
        {options.map((option) => (
          <Button
            key={option.id}
            variant="outline"
            className={cn(
              "h-auto p-3 text-base text-center sm:h-20 sm:p-4 sm:text-lg transition-all duration-300 rounded-lg shadow-sm whitespace-normal flex items-center justify-center hover:scale-105 border-2 border-border hover:border-primary",
              getButtonClass(option)
            )}
            onClick={() => selectAnswer(option)}
            disabled={gameState === 'answered'}
          >
            {option.name[language]}
          </Button>
        ))}
      </div>
    </div>
  );
};


const MultiplayerChallengeView: React.FC = () => {
    const { user } = useAuth();
    const { lobby, handleChallengeAnswer, setView, isRoundReveal, t, language } = useGame();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [timer, setTimer] = useState(15);

    const question: SerializableQuestion | undefined = lobby?.challengeQuestions?.[lobby.currentQuestionIndex || 0];

    useEffect(() => {
        if (lobby?.status !== 'playing' || isRoundReveal) return;

        const interval = setInterval(() => {
            setTimer(prev => prev - 1);
        }, 1000);

        if (timer === 0) {
            handleChallengeAnswer('timeout');
        }

        return () => clearInterval(interval);
    }, [lobby?.status, isRoundReveal, timer, handleChallengeAnswer]);
    
    useEffect(() => {
        setTimer(15);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
    }, [question]);

    const toggleAudio = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    if (!lobby || !question) {
        return <div className="flex items-center justify-center h-full">{t.loading}...</div>;
    }

    const { type, optionsIds, correctAnswerId, image, text, audio } = question;
    const options: Country[] = (optionsIds || []).map(id => countries.find(c => c.id === id)).filter((c): c is Country => !!c);
    const myAnswer = user ? lobby.currentAnswers?.[user.uid] : undefined;
    
    const opponent = lobby.players.find(p => p.uid !== user?.uid);
    const opponentAnswer = opponent ? lobby.currentAnswers?.[opponent.uid] : undefined;

    const getButtonClass = (option: Country) => {
        if (!isRoundReveal) return '';
        if (option.id === correctAnswerId) return 'bg-green-500 hover:bg-green-600 border-transparent text-primary-foreground';
        if (myAnswer && option.id === myAnswer.answerId && !myAnswer.isCorrect) return 'bg-destructive hover:bg-destructive/90 border-transparent text-destructive-foreground';
        return 'opacity-50';
    };
    
    const getOpponentIndicator = (option: Country) => {
        if (!isRoundReveal || !opponentAnswer || opponentAnswer.answerId !== option.id || !opponent) return null;
        return (
            <div className="absolute top-1 right-1 flex items-center gap-1 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                <User className="h-3 w-3" />
                {opponent.username.split(' ')[0]}
            </div>
        );
    };
    
    if (lobby.status === 'finished') {
        const isWinner = lobby.winnerUid === user?.uid;
        const isDraw = lobby.winnerUid === 'draw';

        return (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm animate-in fade-in">
              <Card className="w-full max-w-md text-center p-6">
                <Trophy className={cn("mx-auto h-16 w-16 mb-4", isWinner ? "text-primary" : "text-muted-foreground")} />
                <h2 className="text-3xl font-bold mb-2">{isDraw ? t.draw : isWinner ? t.youWin : t.youLose}</h2>
                <CardDescription className="mb-4">{t.finalScores}</CardDescription>
                <div className="space-y-4">
                  {lobby.players.map(p => (
                    <div key={p.uid} className="flex justify-between items-center bg-muted p-3 rounded-lg">
                      <p className="font-semibold">{p.username}</p>
                      <p className="font-bold text-lg text-primary">{lobby.playerScores?.[p.uid] ?? 0}</p>
                    </div>
                  ))}
                </div>
                <Button size="lg" variant="outline" onClick={() => setView('multiplayer_menu')} className="mt-8">
                    <ArrowLeft className="mr-2" />
                    {t.backToLobby}
                </Button>
              </Card>
            </div>
        )
    }

    return (
        <div className="relative flex flex-col h-full w-full max-w-3xl mx-auto p-4">
            <header className="relative flex items-center justify-center mb-4 flex-shrink-0">
                <Button variant="ghost" onClick={() => setView('lobby')} className="absolute left-0">
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t.backToLobby}
                </Button>
                <div className="flex flex-col items-center">
                    <h1 className="text-xl font-bold font-headline text-primary">{t.worldChallenge}</h1>
                    <p className="text-sm text-muted-foreground">{(lobby.currentQuestionIndex || 0) + 1} / {lobby.challengeQuestions?.length}</p>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                {lobby.players.map(p => (
                     <div key={p.uid} className={cn("p-2 rounded-lg", user?.uid === p.uid && "bg-muted")}>
                        <p className="font-semibold truncate">{p.username}</p>
                        <p className="text-2xl font-bold text-primary">{lobby.playerScores?.[p.uid] ?? 0}</p>
                     </div>
                ))}
            </div>

            <Progress value={timer/15 * 100} className="mb-4 h-2" />

            <div className="flex-1 flex flex-col items-center justify-center text-center">
                <p className="text-muted-foreground text-2xl sm:text-3xl mb-6 font-semibold">
                    {type === 'flag' && t.flagQuestion}
                    {type === 'capital' && t.capitalQuestion.replace('{capital}', text || '')}
                    {type === 'audio' && t.anthemQuestion}
                    {type === 'dish' && t.dishQuestion.replace('{dish}', text || '')}
                    {type === 'animal' && t.animalQuestion.replace('{animal}', text || '')}
                </p>
                <div className="h-40 sm:h-48 w-full flex items-center justify-center mb-8">
                     {type === 'flag' && image && (
                        <Image src={image} alt={t.flag} width={200} height={120} className="rounded-lg shadow-lg border-2 border-border object-contain max-h-full" />
                    )}
                     {type === 'audio' && audio && (
                      <>
                        <audio ref={audioRef} src={audio} className="hidden" preload="auto" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} />
                        <Button size="lg" variant="outline" onClick={toggleAudio} className="h-24 w-24 rounded-full">
                            {isPlaying ? <Pause className="h-12 w-12" /> : <Play className="h-12 w-12" />}
                        </Button>
                      </>
                    )}
                </div>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                {options.map((option) => (
                    <Button
                        key={option.id}
                        variant="outline"
                        className={cn("relative h-auto p-3 text-base text-center sm:h-20 sm:p-4 sm:text-lg transition-all duration-300 rounded-lg shadow-sm whitespace-normal flex items-center justify-center hover:scale-105 border-2 border-border hover:border-primary", getButtonClass(option))}
                        onClick={() => handleChallengeAnswer(option.id)}
                        disabled={!!myAnswer || isRoundReveal}
                    >
                        {option.name[language]}
                        {getOpponentIndicator(option)}
                    </Button>
                ))}
            </div>

            {isRoundReveal && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                    <Card className="p-6 text-center animate-in zoom-in">
                        <CardHeader>
                            <CardTitle>{t.roundResult}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-center gap-2">
                                {myAnswer?.isCorrect ? <Check className="text-green-500"/> : <X className="text-destructive"/>}
                                <p>{t.you}: {countries.find(c => c.id === myAnswer?.answerId)?.name[language] || t.notAnswered}</p>
                            </div>
                            {opponent && opponentAnswer && (
                              <div className="flex items-center justify-center gap-2">
                                  {opponentAnswer?.isCorrect ? <Check className="text-green-500"/> : <X className="text-destructive"/>}
                                  <p>{opponent?.username || 'Opponent'}: {countries.find(c => c.id === opponentAnswer?.answerId)?.name[language] || t.notAnswered}</p>
                              </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
};


export const ChallengeScreen: React.FC = () => {
    const { lobbyId } = useGame();
    return lobbyId ? (
        <MultiplayerChallengeView />
    ) : (
        <ChallengeProvider>
            <SinglePlayerChallengeView />
        </ChallengeProvider>
    )
}
