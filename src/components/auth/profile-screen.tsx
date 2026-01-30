'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useGame } from '@/contexts/game-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Edit } from 'lucide-react';
import { avatars } from '@/lib/avatars';
import { cn } from '@/lib/utils';
import { updateUserProfile } from '@/firebase/user';
import { useToast } from '@/hooks/use-toast';

export function ProfileScreen() {
  const { user, profile } = useAuth();
  const { setView, t } = useGame();
  const [selectedAvatarId, setSelectedAvatarId] = useState(profile?.avatarId || '');
  const { toast } = useToast();

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center h-full">
        {t.loading}...
      </div>
    );
  }

  const handleAvatarSelect = async (avatarId: string) => {
    setSelectedAvatarId(avatarId);
    if(user){
      await updateUserProfile(user.uid, { avatarId: avatarId, avatarUrl: avatars.find(a => a.id === avatarId)?.imageUrl });
      toast({ title: "Avatar updated!" });
    }
  };

  return (
    <div className="flex flex-col items-center h-full p-4 relative">
      <Button variant="ghost" className="absolute top-4 left-4" onClick={() => setView('menu')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t.backToMenu}
      </Button>

      <Card className="w-full max-w-2xl mt-16">
        <CardHeader className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <Avatar className="w-32 h-32 text-4xl">
              <AvatarImage src={profile.avatarUrl} alt={profile.username} />
              <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-3xl">{profile.username}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.bestScores}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold">{t.classic}</h4>
                  <p className="text-muted-foreground">
                    {profile.bestClassicScore
                      ? t.classicBestScore.replace('{score}', String(profile.bestClassicScore))
                      : t.notYetPlayed}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">{t.worldChallenge}</h4>
                  <p className="text-muted-foreground">
                    {profile.bestWorldQuizScore
                      ? t.worldQuizBestScore.replace('{score}', String(profile.bestWorldQuizScore))
                      : t.notYetPlayed}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t.chooseAvatar}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 justify-items-center">
                  {avatars.map((avatar) => (
                    <button
                      key={avatar.id}
                      className={cn(
                        'rounded-full ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        selectedAvatarId === avatar.id && 'ring-2 ring-primary'
                      )}
                      onClick={() => handleAvatarSelect(avatar.id)}
                    >
                      <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
                        <AvatarImage src={avatar.imageUrl} alt={avatar.hint} />
                        <AvatarFallback>{avatar.hint.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
