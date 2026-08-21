import React, { useState } from 'react';
import {
  Settings,
  HardDrive,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  BookOpen,
  Check,
  Smartphone,
  ShieldCheck,
  Info,
  Cloud,
  CloudUpload,
  CloudDownload,
  User as UserIcon,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { School, Teacher, ClassRoster, Lesson } from '../types';

interface SettingsViewProps {
  schools: School[];
  teachers: Teacher[];
  classes: ClassRoster[];
  lessons: Lesson[];
  user: User | null;
  onOpenProfile: () => void;
  onResetSeedData: () => Promise<void>;
  onClearAllData: () => Promise<void>;
  onImportData: (data: { schools: School[]; teachers: Teacher[]; classes: ClassRoster[]; lessons: Lesson[] }) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  schools,
  teachers,
  classes,
  lessons,
  user,
  onOpenProfile,
  onResetSeedData,
  onClearAllData,
  onImportData,
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleReset = async () => {
    if (window.confirm('Reset all data to sample schools, teachers, and current week lessons?')) {
      setIsResetting(true);
      await onResetSeedData();
      setIsResetting(false);
      showToast('Successfully reloaded sample dispatch data for this week!');
    }
  };

  const handleClear = async () => {
    if (window.confirm('WARNING: Are you sure you want to erase all data? This cannot be undone.')) {
      await onClearAllData();
      showToast('All local data cleared.');
    }
  };

  const handleExportJSON = () => {
    const data = {
      app: 'ALT Dispatch Hub',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      schools,
      teachers,
      classes,
      lessons,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ALT_Dispatch_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON file downloaded!');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.schools && parsed.lessons) {
          await onImportData({
            schools: parsed.schools || [],
            teachers: parsed.teachers || [],
            classes: parsed.classes || [],
            lessons: parsed.lessons || [],
          });
          showToast('Backup data successfully restored!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12 text-slate-800">
      
      {/* Toast */}
      {feedback && (
        <div className="p-3.5 bg-sky-600 text-white text-xs font-bold rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg font-extrabold text-slate-900">Settings & Offline Data Tools</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Local-first storage status, sample data controls, backup/restore, and ALT terminology reference
          </p>
        </div>
      </div>

      {/* Firebase Cloud Sync Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">Firebase Cloud Synchronization</h3>
          </div>
          {user && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Cloud Connected</span>
            </span>
          )}
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {user
            ? `Logged in as ${user.displayName || user.email}. Your dispatch records are securely saved in Firebase Firestore database.`
            : 'Sign in with your Google account to back up your lesson notes and synchronize schedules across multiple devices.'}
        </p>

        <div className="pt-1 flex items-center space-x-2">
          <button
            onClick={onOpenProfile}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>{user ? 'Manage Cloud Sync / Profile' : 'Sign in with Google'}</span>
          </button>
        </div>
      </div>

      {/* Offline Storage Status Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Offline-First Storage Engine</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          This PWA uses <strong>IndexedDB</strong> with automatic <strong>localStorage</strong> mirroring. Your dispatch schedules, co-teacher rosters, and lesson notes remain 100% accessible and editable even when teaching in basements, rural schools, or without cellular signal.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Schools</span>
            <span className="text-base font-extrabold text-slate-900">{schools.length}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Teachers</span>
            <span className="text-base font-extrabold text-slate-900">{teachers.length}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Classes</span>
            <span className="text-base font-extrabold text-slate-900">{classes.length}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Lessons</span>
            <span className="text-base font-extrabold text-slate-900">{lessons.length}</span>
          </div>
        </div>
      </div>

      {/* Data Management Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Data Management & Backups</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Seed Data Reset */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 font-bold text-xs text-slate-900">
                <RefreshCw className="w-4 h-4 text-sky-600" />
                <span>Pre-Seed Sample Data</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Generates 3 sample schools (ES/JHS/HS), 5 teachers (JTE/HRT), 5 classes, and 6 sample lessons for this week.
              </p>
            </div>
            <button
              id="reset-seed-btn"
              onClick={handleReset}
              disabled={isResetting}
              className="mt-3 px-3 py-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              {isResetting ? 'Reloading...' : 'Reload Sample Data (今週のサンプル生成)'}
            </button>
          </div>

          {/* Backup & Restore */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 font-bold text-xs text-slate-900">
                <Download className="w-4 h-4 text-indigo-600" />
                <span>JSON Backup & Restore</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Export your entire schedule database as a single file or restore from a previous backup.
              </p>
            </div>
            <div className="mt-3 flex items-center space-x-2">
              <button
                id="export-backup-json-btn"
                onClick={handleExportJSON}
                className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Export JSON
              </button>
              <label className="flex-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl text-center cursor-pointer transition-all">
                Restore JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone: Clear Data */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-700 block">Clear All Stored Records</span>
            <span className="text-[11px] text-slate-400">Permanently erase all local schools, teachers, classes, and lessons.</span>
          </div>
          <button
            id="clear-all-data-btn"
            onClick={handleClear}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Clear Data
          </button>
        </div>
      </div>

      {/* Japanese ALT Terminology & Timetable Reference */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-amber-600" />
          <h3 className="text-sm font-bold text-slate-900">Japanese School Reference Guide (ALTs)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Timetable periods */}
          <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/70">
            <h4 className="font-bold text-slate-900">Standard Timetable (標準時程)</h4>
            <ul className="space-y-1 text-slate-600 text-[11px]">
              <li className="flex justify-between"><span>1限 (1st Period)</span> <span className="font-semibold text-slate-800">08:50 ~ 09:35/09:40</span></li>
              <li className="flex justify-between"><span>2限 (2nd Period)</span> <span className="font-semibold text-slate-800">09:45 ~ 10:30/10:35</span></li>
              <li className="flex justify-between"><span>3限 (3rd Period)</span> <span className="font-semibold text-slate-800">10:45 ~ 11:30/11:35</span></li>
              <li className="flex justify-between"><span>4限 (4th Period)</span> <span className="font-semibold text-slate-800">11:40 ~ 12:25/12:30</span></li>
              <li className="flex justify-between text-amber-700 font-bold"><span>給食・昼休み (Lunch)</span> <span>12:25 ~ 13:15</span></li>
              <li className="flex justify-between"><span>5限 (5th Period)</span> <span className="font-semibold text-slate-800">13:20 ~ 14:05/14:10</span></li>
              <li className="flex justify-between"><span>6限 (6th Period)</span> <span className="font-semibold text-slate-800">14:15 ~ 15:00/15:05</span></li>
              <li className="flex justify-between text-slate-500"><span>清掃 (Cleaning) / 終礼</span> <span>15:10 ~ 15:35</span></li>
            </ul>
          </div>

          {/* Teacher roles & school titles */}
          <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/70">
            <h4 className="font-bold text-slate-900">Roles & Titles (役職・校内用語)</h4>
            <ul className="space-y-1 text-slate-600 text-[11px]">
              <li><strong>JTE (英語科 / 英語専任):</strong> Japanese Teacher of English</li>
              <li><strong>HRT (担任 / 学級担任):</strong> Homeroom Teacher</li>
              <li><strong>ALT (外国語指導助手):</strong> Assistant Language Teacher</li>
              <li><strong>校長 (Kocho-sensei):</strong> School Principal</li>
              <li><strong>教頭 (Kyoto-sensei):</strong> Vice Principal / Deputy Head</li>
              <li><strong>職員室 (Shokuinshitsu):</strong> Main Staffroom</li>
              <li><strong>英語ルーム / 外国語教室:</strong> English Dedicated Classroom</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};
