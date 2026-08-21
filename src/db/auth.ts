import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

export type { User, Session };

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  // On success the browser navigates away, so nothing after this runs.
  if (error) throw new Error(`Google sign-in failed: ${error.message}`);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`Sign-out failed: ${error.message}`);
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(`Reading session failed: ${error.message}`);
  return data.session?.user ?? null;
}

/** Returns an unsubscribe function. */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}
