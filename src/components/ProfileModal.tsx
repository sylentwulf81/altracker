import React, { useState } from 'react';
import {
  User as UserIcon,
  LogOut,
  LogIn,
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { authService, cloudStorage } from '../db/cloudSync';
import { School, Teacher, ClassRoster, Lesson } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  schools: School[];
  teachers: Teacher[];
  classes: ClassRoster[];
  lessons: Lesson[];
  onDataLoaded: (data: {
    schools: School[];
    teachers: Teacher[];
    classes: ClassRoster[];
    lessons: Lesson[];
  }) => void;
  lastSynced: string | null;
  setLastSynced: (val: string | null) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  schools,
  teachers,
  classes,
  lessons,
  onDataLoaded,
  lastSynced,
  setLastSynced,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const signedInUser = await authService.signInWithGoogle();
      showStatus('success', `Signed in as ${signedInUser.displayName || signedInUser.email}`);
      
      // Check if user has remote data
      try {
        const remoteData = await cloudStorage.fetchUserData(signedInUser.uid);
        if (
          remoteData.schools.length > 0 ||
          remoteData.lessons.length > 0 ||
          remoteData.teachers.length > 0
        ) {
          onDataLoaded(remoteData);
          setLastSynced(new Date().toLocaleTimeString());
          showStatus('success', 'Loaded your schedules and lessons from Firebase!');
        } else {
          // Upload local data to initialize user cloud database
          await cloudStorage.syncAllToCloud(signedInUser.uid, { schools, teachers, classes, lessons });
          setLastSynced(new Date().toLocaleTimeString());
          showStatus('success', 'Initial data backed up to your Firebase cloud account!');
        }
      } catch (e) {
        console.error(e);
      }
    } catch (err: any) {
      console.error(err);
      showStatus('error', err.message || 'Failed to sign in with Google');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      showStatus('success', 'Signed out successfully.');
    } catch (err: any) {
      showStatus('error', 'Failed to sign out.');
    }
  };

  const handleUploadToCloud = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      await cloudStorage.syncAllToCloud(user.uid, { schools, teachers, classes, lessons });
      const nowStr = new Date().toLocaleTimeString();
      setLastSynced(nowStr);
      showStatus('success', 'All local schedules, rosters, and lessons backed up to Firebase!');
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to sync to cloud.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadFromCloud = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const remoteData = await cloudStorage.fetchUserData(user.uid);
      if (
        remoteData.schools.length === 0 &&
        remoteData.lessons.length === 0 &&
        remoteData.teachers.length === 0
      ) {
        showStatus('error', 'No cloud data found. Upload your local schedule first.');
      } else {
        onDataLoaded(remoteData);
        const nowStr = new Date().toLocaleTimeString();
        setLastSynced(nowStr);
        showStatus('success', `Restored ${remoteData.lessons.length} lessons and ${remoteData.schools.length} schools from Firebase!`);
      }
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to download from cloud.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-xs">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">ALT Cloud Account & Sync</h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {user ? 'Connected to Firebase' : 'Sign in to sync across devices'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Toast Notification */}
        {statusMessage && (
          <div
            className={`p-3 text-xs font-semibold flex items-center space-x-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100'
                : 'bg-rose-50 text-rose-800 border-b border-rose-100'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="flex-1">{statusMessage.text}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {user ? (
            /* Logged in state */
            <div className="space-y-4">
              {/* User Profile Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center space-x-3.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full border-2 border-sky-600 shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                    {(user.displayName || user.email || 'ALT').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {user.displayName || 'Assistant Language Teacher'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-sky-100 text-sky-800">
                      ALT
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  {lastSynced && (
                    <p className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Last synced: {lastSynced}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Data Count */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Schools</span>
                  <span className="text-sm font-extrabold text-slate-800">{schools.length}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Teachers</span>
                  <span className="text-sm font-extrabold text-slate-800">{teachers.length}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Classes</span>
                  <span className="text-sm font-extrabold text-slate-800">{classes.length}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Lessons</span>
                  <span className="text-sm font-extrabold text-slate-800">{lessons.length}</span>
                </div>
              </div>

              {/* Sync Actions */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Cloud Synchronization (Firestore)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="sync-backup-btn"
                    onClick={handleUploadToCloud}
                    disabled={isSyncing}
                    className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CloudUpload className="w-3.5 h-3.5" />
                    )}
                    <span>Backup to Cloud</span>
                  </button>

                  <button
                    id="sync-restore-btn"
                    onClick={handleDownloadFromCloud}
                    disabled={isSyncing}
                    className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CloudDownload className="w-3.5 h-3.5 text-slate-600" />
                    <span>Download Cloud</span>
                  </button>
                </div>
              </div>

              {/* Sign out */}
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  id="sign-out-btn"
                  onClick={handleSignOut}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Logged out state */
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 mx-auto flex items-center justify-center border border-sky-100 shadow-xs">
                <UserIcon className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Save & Sync Your ALT Schedule
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                  Sign in with Google to securely persist your dispatch schools, co-teachers, and lesson plans across all your mobile phones, tablets, and computers.
                </p>
              </div>

              <div className="pt-2">
                <button
                  id="google-signin-btn"
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="w-full flex items-center justify-center space-x-2.5 px-4 py-3 bg-white border border-slate-300 hover:bg-slate-50 active:scale-98 text-slate-800 font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                >
                  {isSigningIn ? (
                    <RefreshCw className="w-4 h-4 text-sky-600 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>{isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
                </button>
              </div>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protected by Firebase Authentication & Firestore Security Rules</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
