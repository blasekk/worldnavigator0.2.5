'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { createUserProfile } from './user';
import { avatars } from '@/lib/avatars';

// Helper to create a consistent "email" from a username
const createEmailFromUsername = (username: string) => `${username.toLowerCase()}@worldnavigator.app`;

// This suffix is added to the user's PIN to meet Firebase's password length requirements.
const PIN_SUFFIX = '-w0rldN@v';

export function initiateAnonymousSignIn(auth: Auth): void {
  signInAnonymously(auth).catch((error) => {
    console.error("Anonymous sign-in failed", error);
  });
}

export async function signUpWithUsernamePin(auth: Auth, username: string, pin: string): Promise<void> {
  const email = createEmailFromUsername(username);
  const securePassword = `${pin}${PIN_SUFFIX}`;
  const userCredential = await createUserWithEmailAndPassword(auth, email, securePassword);
  const user = userCredential.user;
  
  if (user) {
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    await createUserProfile(user.uid, username, randomAvatar.id, randomAvatar.imageUrl);
  }
}

export async function signInWithUsernamePin(auth: Auth, username: string, pin: string): Promise<void> {
  const email = createEmailFromUsername(username);
  const securePassword = `${pin}${PIN_SUFFIX}`;
  await signInWithEmailAndPassword(auth, email, securePassword);
}

export async function signOutUser(auth: Auth): Promise<void> {
  await signOut(auth);
  // After signing out, sign in anonymously to maintain a session
  initiateAnonymousSignIn(auth);
}
