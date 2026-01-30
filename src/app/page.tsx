"use client";

import { useGame, GameProvider } from "@/contexts/game-context";
import { MainMenu } from "@/components/main-menu";
import { SettingsScreen } from "@/components/settings-screen";
import { GameScreen } from "@/components/game-screen";
import { ChallengeScreen } from "@/components/challenge-screen";
import { SinglePlayerMenu } from "@/components/singleplayer-menu";
import { MultiplayerMenu } from "@/components/multiplayer-menu";
import { MultiplayerClassicMenu } from "@/components/multiplayer-classic-menu";
import { MultiplayerChallengeMenu } from "@/components/multiplayer-challenge-menu";
import { LobbyScreen } from "@/components/lobby-screen";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { ProfileScreen } from "@/components/auth/profile-screen";

function WorldNavigatorApp() {
  const { view } = useGame();
  const { authDialogOpen } = useAuth();

  const renderView = () => {
    switch (view) {
      case 'settings':
        return <SettingsScreen />;
      case 'game':
        return <GameScreen />;
      case 'challenge':
        return <ChallengeScreen />;
      case 'singleplayer_menu':
        return <SinglePlayerMenu />;
      case 'multiplayer_menu':
        return <MultiplayerMenu />;
      case 'multiplayer_classic_menu':
        return <MultiplayerClassicMenu />;
      case 'multiplayer_challenge_menu':
        return <MultiplayerChallengeMenu />;
      case 'lobby':
        return <LobbyScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'menu':
      default:
        return <MainMenu />;
    }
  };

  return (
    <main className="h-full w-full text-foreground overflow-hidden bg-background">
      {renderView()}
      {authDialogOpen && <AuthDialog />}
    </main>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <GameProvider>
        <WorldNavigatorApp />
      </GameProvider>
    </AuthProvider>
  );
}
