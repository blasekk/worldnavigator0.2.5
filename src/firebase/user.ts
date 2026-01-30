'use client';

import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getSdks, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';

const getDb = () => getSdks(getApp()).firestore;

export interface UserProfile {
  id: string;
  username: string;
  avatarId: string;
  avatarUrl: string;
  bestClassicScore?: number;
  bestWorldQuizScore?: number;
}

export async function createUserProfile(uid: string, username: string, avatarId: string, avatarUrl: string): Promise<void> {
  const userProfileRef = doc(getDb(), 'users', uid);
  const profileData: UserProfile = {
    id: uid,
    username,
    avatarId,
    avatarUrl,
    bestClassicScore: 0,
    bestWorldQuizScore: 0,
  };
  // Using non-blocking setDoc
  setDocumentNonBlocking(userProfileRef, profileData, {});
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const userProfileRef = doc(getDb(), 'users', uid);
  // Using non-blocking updateDoc
  updateDocumentNonBlocking(userProfileRef, data);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userProfileRef = doc(getDb(), 'users', uid);
  const docSnap = await getDoc(userProfileRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}
