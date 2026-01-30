"use client";

import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useUser as useFirebaseUser, useFirestore, useAuth as useFirebaseAuth } from '@/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserProfile } from '@/firebase/user';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { initiateAnonymousSignIn } from '@/firebase/auth';
import { avatars } from '@/lib/avatars';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isUserLoading: boolean;
  authDialogOpen: boolean;
  setAuthDialogOpen: (open: boolean) => void;
  signInAnonymously: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isUserLoading } = useFirebaseUser();
  const firestore = useFirestore();
  const auth = useFirebaseAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  useEffect(() => {
    if (isUserLoading) return;

    if (user) {
      // User is signed in, listen to their profile
      const profileRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(profileRef, (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // Profile doesn't exist yet, can happen right after sign up
          setProfile(null);
        }
      });
      return () => unsubscribe();
    } else {
      // User is not signed in
      setProfile(null);
      return;
    }
  }, [user, firestore, isUserLoading]);
  
  const signInAnonymously = useCallback(() => {
    initiateAnonymousSignIn(auth);
  }, [auth]);

  const value = useMemo(() => ({
    user,
    profile,
    isUserLoading,
    authDialogOpen,
    setAuthDialogOpen,
    signInAnonymously
  }), [user, profile, isUserLoading, authDialogOpen, setAuthDialogOpen, signInAnonymously]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
