import React from 'react';
import {
  Calendar,
  Building2,
  Users2,
  FileSpreadsheet,
  Settings2,
  User as UserIcon,
  Cloud,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ActiveTab } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickLog: () => void;
  onOpenProfile: () => void;
  user: User | null;
  todayCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickLog,
  onOpenProfile,
  user,
}) => {
  const tabs = [
    { id: 'schedule' as ActiveTab, label: 'Schedule', icon: Calendar },
    { id: 'schools' as ActiveTab, label: 'Schools', icon: Building2 },
    { id: 'roster' as ActiveTab, label: 'Roster', icon: Users2 },
    { id: 'reports' as ActiveTab, label: 'Reports', icon: FileSpreadsheet },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings2 },
  ];

  const currentTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <>
      {/* Desktop / Tablet Streamlined Header (md and up) */}
      <header className="hidden md:block sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Minimalist Logo & App Name */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-xs">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  ALT<span className="text-sky-600">Dispatch</span>
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  外国語指導
                </span>
              </div>
            </div>

            {/* Clean Centered Nav Tabs */}
            <nav className="flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`nav-tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Profile & Firebase Sync Button */}
            <div className="flex items-center space-x-2">
              <button
                id="header-profile-btn"
                onClick={onOpenProfile}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100/80 active:scale-95 transition-all cursor-pointer"
                title={user ? `Signed in as ${user.displayName || user.email}` : 'Sign in with Firebase'}
              >
                {user ? (
                  <>
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full ring-1 ring-sky-500"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-bold text-slate-800 max-w-[100px] truncate">
                      {user.displayName?.split(' ')[0] || 'Profile'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Connected to cloud" />
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                      <UserIcon className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Sign In</span>
                    <Cloud className="w-3.5 h-3.5 text-sky-600" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sleek Native-App Header (under md) */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 h-12 flex items-center justify-between pt-[env(safe-area-inset-top)]">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-md bg-sky-600 flex items-center justify-center text-white text-xs font-extrabold">
            A
          </div>
          <span className="font-extrabold text-sm text-slate-900 tracking-tight">
            {currentTabObj.label}
          </span>
        </div>

        {/* Mobile Profile & Cloud Button */}
        <button
          id="mobile-header-profile-btn"
          onClick={onOpenProfile}
          className="flex items-center space-x-1.5 px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 active:scale-95 transition-all"
        >
          {user ? (
            <>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-sky-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {(user.displayName || user.email || 'A').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </>
          ) : (
            <div className="flex items-center space-x-1 text-slate-600 text-xs font-bold">
              <UserIcon className="w-3.5 h-3.5" />
              <span>Login</span>
            </div>
          )}
        </button>
      </header>

      {/* Mobile Bottom Tab Navigation Bar (fixed bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 pb-[env(safe-area-inset-bottom)] shadow-lg">
        <div className="flex items-center justify-around h-14 px-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`mobile-nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all relative ${
                  isActive ? 'text-sky-600 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                </div>
                <span className="text-[10px] mt-1 tracking-tight leading-none">{tab.label}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-sky-600 mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

