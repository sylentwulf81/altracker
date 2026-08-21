import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as api from './db/api';
import type { AppData } from './db/api';
import { onAuthStateChange, getCurrentUser, signInWithGoogle, User } from './db/auth';
import { School, Teacher, ClassRoster, Lesson, ActiveTab } from './types';
import { Navigation } from './components/Navigation';
import { ScheduleView } from './components/ScheduleView';
import { FastLessonLoggerModal } from './components/FastLessonLoggerModal';
import { ProfileModal } from './components/ProfileModal';
import { SchoolsView } from './components/SchoolsView';
import { TeachersAndClassesView } from './components/TeachersAndClassesView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { ThemeProvider } from './components/ThemeProvider';
import { ModeToggle } from './components/ModeToggle';

const EMPTY: AppData = { schools: [], teachers: [], classes: [], lessons: [] };

/** Replace by id if present, otherwise append. */
function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [...list, item];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('schedule');
  const [data, setData] = useState<AppData>(EMPTY);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [quickLogDate, setQuickLogDate] = useState<string | undefined>(undefined);

  const { schools, teachers, classes, lessons } = data;

  const report = (e: unknown) =>
    setError(e instanceof Error ? e.message : String(e));

  // --- Auth ----------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    getCurrentUser()
      .then((u) => {
        if (!cancelled) {
          setUser(u);
          setAuthReady(true);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          report(e);
          setAuthReady(true);
        }
      });

    const unsubscribe = onAuthStateChange((u) => {
      setUser(u);
      setAuthReady(true);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // --- Loading -------------------------------------------------------------
  // Exactly one path writes the loaded dataset into state. The Firebase version
  // had two effects racing to do this, and the loser's data won.

  const reload = useCallback(async () => {
    if (!user) {
      setData(EMPTY);
      return;
    }
    setIsLoading(true);
    try {
      setData(await api.fetchAll());
      setError(null);
      setLastSynced(new Date().toLocaleTimeString());
    } catch (e) {
      report(e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authReady) void reload();
  }, [authReady, reload]);

  // --- Realtime ------------------------------------------------------------
  // Picks up edits made on your other devices. Debounced because a single save
  // here produces an echo we have already applied locally.

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = api.subscribeToChanges(user.id, () => {
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => void reload(), 400);
    });
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
      unsubscribe();
    };
  }, [user, reload]);

  // --- Mutations -----------------------------------------------------------
  // Each awaits the write and applies the row the database actually stored. No
  // failure is swallowed: anything that throws lands in the error banner.

  const mutate = async (fn: () => Promise<void>) => {
    try {
      await fn();
      setError(null);
      setLastSynced(new Date().toLocaleTimeString());
    } catch (e) {
      report(e);
    }
  };

  const handleOpenQuickLog = (date?: string) => {
    setEditingLesson(null);
    setQuickLogDate(date || new Date().toISOString().slice(0, 10));
    setIsQuickLogOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setQuickLogDate(lesson.date);
    setIsQuickLogOpen(true);
  };

  const handleSaveLesson = (lesson: Lesson) =>
    mutate(async () => {
      const saved = await api.saveLesson(lesson);
      setData((d) => ({ ...d, lessons: upsertById(d.lessons, saved) }));
    });

  const handleDeleteLesson = (lessonId: string) =>
    mutate(async () => {
      await api.deleteLesson(lessonId);
      setData((d) => ({ ...d, lessons: d.lessons.filter((l) => l.id !== lessonId) }));
    });

  const handleToggleComplete = (lessonId: string) => {
    const target = lessons.find((l) => l.id === lessonId);
    if (!target) return Promise.resolve();
    return handleSaveLesson({ ...target, completed: !target.completed });
  };

  const handleSaveSchool = (school: School) =>
    mutate(async () => {
      const saved = await api.saveSchool(school);
      setData((d) => ({ ...d, schools: upsertById(d.schools, saved) }));
    });

  const handleDeleteSchool = (schoolId: string) =>
    mutate(async () => {
      await api.deleteSchool(schoolId);
      // The database cascades this; mirror it locally so the UI matches.
      setData((d) => ({
        schools: d.schools.filter((s) => s.id !== schoolId),
        teachers: d.teachers.filter((t) => t.schoolId !== schoolId),
        classes: d.classes.filter((c) => c.schoolId !== schoolId),
        lessons: d.lessons.filter((l) => l.schoolId !== schoolId),
      }));
    });

  const handleSaveTeacher = (teacher: Teacher) =>
    mutate(async () => {
      const saved = await api.saveTeacher(teacher);
      setData((d) => ({ ...d, teachers: upsertById(d.teachers, saved) }));
    });

  const handleDeleteTeacher = (teacherId: string) =>
    mutate(async () => {
      await api.deleteTeacher(teacherId);
      setData((d) => ({
        ...d,
        teachers: d.teachers.filter((t) => t.id !== teacherId),
        // teacher_id becomes null rather than cascading, so lessons survive.
        lessons: d.lessons.map((l) =>
          l.teacherId === teacherId ? { ...l, teacherId: '' } : l
        ),
      }));
    });

  const handleSaveClass = (roster: ClassRoster) =>
    mutate(async () => {
      const saved = await api.saveClass(roster);
      setData((d) => ({ ...d, classes: upsertById(d.classes, saved) }));
    });

  const handleDeleteClass = (classId: string) =>
    mutate(async () => {
      await api.deleteClass(classId);
      setData((d) => ({
        ...d,
        classes: d.classes.filter((c) => c.id !== classId),
        lessons: d.lessons.map((l) =>
          l.classRosterId === classId ? { ...l, classRosterId: '' } : l
        ),
      }));
    });

  const handleClearAllData = () =>
    mutate(async () => {
      await api.deleteEverything();
      setData(EMPTY);
    });

  const handleImportData = (incoming: AppData) =>
    mutate(async () => {
      await api.importAll(incoming);
      await reload();
    });

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLessonsCount = lessons.filter((l) => l.date === todayStr).length;

  // --- Render --------------------------------------------------------------

  if (!authReady) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </ThemeProvider>
    );
  }

  if (!user) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">ALT Dispatch Hub</h1>
            <p className="text-sm text-muted-foreground max-w-sm">
              Sign in to reach your schools, rosters and lessons from any device.
            </p>
          </div>
          <button
            onClick={() => signInWithGoogle().catch(report)}
            className="rounded-md bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Sign in with Google
          </button>
          {error && (
            <p className="text-xs font-medium text-rose-600 max-w-sm">{error}</p>
          )}
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <div className="flex justify-between items-center p-3 border-b">
          <Navigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenQuickLog={() => handleOpenQuickLog()}
            onOpenProfile={() => setIsProfileOpen(true)}
            user={user}
            todayCount={todayLessonsCount}
          />
          <ModeToggle />
        </div>

        {error && (
          <div className="flex items-start justify-between gap-3 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900 px-4 py-2">
            <p className="text-xs font-medium text-rose-700 dark:text-rose-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs font-bold text-rose-700 dark:text-rose-300 shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-24 md:pb-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
              <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading your ALT schedule...</p>
            </div>
          ) : (
            <>
              {activeTab === 'schedule' && (
                <ScheduleView
                  lessons={lessons}
                  schools={schools}
                  teachers={teachers}
                  classes={classes}
                  onOpenQuickLog={handleOpenQuickLog}
                  onEditLesson={handleEditLesson}
                  onDeleteLesson={handleDeleteLesson}
                  onToggleComplete={handleToggleComplete}
                />
              )}

              {activeTab === 'schools' && (
                <SchoolsView
                  schools={schools}
                  teachers={teachers}
                  classes={classes}
                  lessons={lessons}
                  onSaveSchool={handleSaveSchool}
                  onDeleteSchool={handleDeleteSchool}
                />
              )}

              {activeTab === 'roster' && (
                <TeachersAndClassesView
                  schools={schools}
                  teachers={teachers}
                  classes={classes}
                  onSaveTeacher={handleSaveTeacher}
                  onDeleteTeacher={handleDeleteTeacher}
                  onSaveClass={handleSaveClass}
                  onDeleteClass={handleDeleteClass}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  lessons={lessons}
                  schools={schools}
                  teachers={teachers}
                  classes={classes}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  schools={schools}
                  teachers={teachers}
                  classes={classes}
                  lessons={lessons}
                  user={user}
                  onOpenProfile={() => setIsProfileOpen(true)}
                  onClearAllData={handleClearAllData}
                  onImportData={handleImportData}
                />
              )}
            </>
          )}
        </main>

        <FastLessonLoggerModal
          isOpen={isQuickLogOpen}
          onClose={() => setIsQuickLogOpen(false)}
          onSave={handleSaveLesson}
          schools={schools}
          teachers={teachers}
          classes={classes}
          editingLesson={editingLesson}
          defaultDate={quickLogDate}
        />

        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
          lastSynced={lastSynced}
          onRefresh={reload}
        />
      </div>
    </ThemeProvider>
  );
}
