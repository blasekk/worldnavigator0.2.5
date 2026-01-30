'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar as AvatarPrimitive, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, LogOut } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOutUser } from '@/firebase/auth';
import { useGame } from '@/contexts/game-context';
import { useAuth as useFirebaseAuth } from '@/firebase';

export function ProfileButton() {
  const { user, profile, isUserLoading, setAuthDialogOpen } = useAuth();
  const { setView, t } = useGame();
  const auth = useFirebaseAuth();

  const handleSignOut = async () => {
    await signOutUser(auth);
    setView('menu');
  };

  if (isUserLoading) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  if (!user || user.isAnonymous) {
    return (
      <Button variant="ghost" size="icon" onClick={() => setAuthDialogOpen(true)}>
        <AvatarPrimitive>
          <AvatarFallback>
            <UserIcon />
          </AvatarFallback>
        </AvatarPrimitive>
        <span className="sr-only">{t.signIn}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <AvatarPrimitive>
            <AvatarImage src={profile?.avatarUrl} alt={profile?.username} />
            <AvatarFallback>
              {profile?.username?.charAt(0).toUpperCase() || <UserIcon />}
            </AvatarFallback>
          </AvatarPrimitive>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{profile?.username}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setView('profile')}>
          {t.myProfile}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t.signOut}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
