'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { signInWithUsernamePin, signUpWithUsernamePin } from '@/firebase/auth';
import { useGame } from '@/contexts/game-context';
import { useAuth as useFirebaseAuth } from '@/firebase';
import { FirebaseError } from 'firebase/app';

export function AuthDialog() {
  const { authDialogOpen, setAuthDialogOpen } = useAuth();
  const { t } = useGame();
  const { toast } = useToast();
  const auth = useFirebaseAuth();

  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (action: 'signIn' | 'signUp') => {
    setIsLoading(true);
    try {
      if (action === 'signUp') {
        await signUpWithUsernamePin(auth, username, pin);
      } else {
        await signInWithUsernamePin(auth, username, pin);
      }
      setAuthDialogOpen(false);
    } catch (error) {
      console.error(error);
      const errorCode = (error as FirebaseError).code;
      let description = t.signInFailed;
      if (action === 'signUp') {
        description = t.signUpFailed;
        if (errorCode === 'auth/email-already-in-use') {
          description = t.signUpFailed;
        }
      }
      toast({
        variant: 'destructive',
        title: t.authError,
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">{t.signIn}</TabsTrigger>
            <TabsTrigger value="signup">{t.signUp}</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={(e) => { e.preventDefault(); handleAuth('signIn'); }}>
              <DialogHeader>
                <DialogTitle>{t.signIn}</DialogTitle>
                <DialogDescription>{t.dontHaveAccount}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="signin-username" className="text-right">{t.username}</Label>
                  <Input id="signin-username" value={username} onChange={(e) => setUsername(e.target.value)} className="col-span-3" placeholder={t.usernamePlaceholder} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="signin-pin" className="text-right">{t.pin}</Label>
                  <Input id="signin-pin" type="password" value={pin} onChange={(e) => setPin(e.target.value)} className="col-span-3" placeholder={t.pinPlaceholder} pattern="\d{4,}" title="PIN must be at least 4 digits" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading || !username || pin.length < 4}>{t.signIn}</Button>
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={(e) => { e.preventDefault(); handleAuth('signUp'); }}>
              <DialogHeader>
                <DialogTitle>{t.signUp}</DialogTitle>
                <DialogDescription>{t.alreadyHaveAccount}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="signup-username" className="text-right">{t.username}</Label>
                  <Input id="signup-username" value={username} onChange={(e) => setUsername(e.target.value)} className="col-span-3" placeholder={t.usernamePlaceholder} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="signup-pin" className="text-right">{t.pin}</Label>
                  <Input id="signup-pin" type="password" value={pin} onChange={(e) => setPin(e.target.value)} className="col-span-3" placeholder={t.pinPlaceholder} pattern="\d{4,}" title="PIN must be at least 4 digits"/>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading || !username || pin.length < 4}>{t.createAccount}</Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
