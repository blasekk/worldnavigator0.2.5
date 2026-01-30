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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGame } from '@/contexts/game-context';
import { Loader2 } from 'lucide-react';

interface JoinLobbyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinLobbyDialog({ open, onOpenChange }: JoinLobbyDialogProps) {
  const { t, handleJoinLobby } = useGame();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onJoin = async () => {
    if (pin.length !== 6) return;
    setIsLoading(true);
    const success = await handleJoinLobby(pin);
    setIsLoading(false);
    if (success) {
      onOpenChange(false);
      setPin('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.joinGame}</DialogTitle>
          <DialogDescription>{t.enterPin}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pin" className="text-right">
              {t.pin}
            </Label>
            <Input
              id="pin"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="col-span-3"
              maxLength={6}
              placeholder="123456"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onJoin} disabled={isLoading || pin.length !== 6}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.join}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
