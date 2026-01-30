"use client";

import { useGame } from "@/contexts/game-context";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gamepad2, Trophy } from "lucide-react";

export function MultiplayerMenu() {
  const { setView, t } = useGame();

  return (
    <div className="relative flex flex-col items-center justify-center h-full p-4 text-center">
        <Button variant="ghost" className="absolute top-4 left-4" onClick={() => setView('menu')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.backToMenu}
        </Button>

      <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-headline text-primary drop-shadow-lg mb-12">
        {t.multiplayer}
      </h2>

      <div className="flex flex-col gap-6 w-full max-w-xs">
        <Button
          size="lg"
          onClick={() => setView('multiplayer_classic_menu')}
          className="w-full py-6 text-lg font-semibold"
        >
          <Gamepad2 className="mr-3 h-6 w-6" />
          {t.classic}
        </Button>
        <Button
          size="lg"
          onClick={() => setView('multiplayer_challenge_menu')}
          className="w-full py-6 text-lg font-semibold"
        >
          <Trophy className="mr-3 h-6 w-6" />
          {t.worldChallenge}
        </Button>
      </div>
    </div>
  );
}
