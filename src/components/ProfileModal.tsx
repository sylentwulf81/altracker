import React, { useState } from 'react';
import {
  User as UserIcon,
  LogOut,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { User, signOut } from '../db/auth';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  lastSynced: string | null;
  onRefresh: () => Promise<void>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  lastSynced,
  onRefresh,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !user) return null;

  const meta = user.user_metadata ?? {};
  const displayName: string = meta.full_name || meta.name || user.email || 'Signed in';
  const avatarUrl: string | undefined = meta.avatar_url || meta.picture;

  const show = (type: 'success' | 'error', text: string) => {
    setStatus({ type, text });
    setTimeout(() => setStatus(null), 4000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      show('success', 'Reloaded from Supabase.');
    } catch (err) {
      show('error', err instanceof Error ? err.message : 'Refresh failed.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (err) {
      show('error', err instanceof Error ? err.message : 'Sign-out failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Account</h2>
          <button onClick={onClose} aria-label="Close">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-11 w-11 rounded-full" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <UserIcon className="h-5 w-5 text-slate-500" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Synced to Supabase</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Changes save automatically and appear on your other devices. Last
              refreshed {lastSynced ?? 'not yet this session'}.
            </p>
          </div>

          {status && (
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium ${
                status.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {status.type === 'success' ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>{status.text}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
