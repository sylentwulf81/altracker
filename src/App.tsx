import React, { useState, useEffect } from 'react';
import { storage } from './db/storage';
import { authService, cloudStorage } from './db/cloudSync';
import { User } from 'firebase/auth';
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

export default function App() {
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassRoster[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('schedule');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Firebase Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Fast Lesson Logger Modal State
  const [isQuickLogOpen, setIsQuickLogOpen] = useState<boolean>(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [quickLogDate, setQuickLogDate] = useState<string | undefined>(undefined);

  // Listen to Firebase Auth
  useEffect(() => {
    const unsubscribe = authService.onAuthState(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Automatically sync from cloud on login if cloud has data
        try {
          const cloudData = await cloudStorage.fetchUserData(currentUser.uid);
          if (
            cloudData.schools.length > 0 ||
            cloudData.lessons.length > 0 ||
            cloudData.teachers.length > 0
          ) {
            setSchools(cloudData.schools);
            setTeachers(cloudData.teachers);
            setClasses(cloudData.classes);
            setLessons(cloudData.lessons);
            // Also mirror in local IndexedDB
            await storage.saveSchools(cloudData.schools);
            await storage.saveTeachers(cloudData.teachers);
            await storage.saveClasses(cloudData.classes);
            await storage.saveLessons(cloudData.lessons);
            setLastSynced(new Date().toLocaleTimeString());
          }
        } catch (err) {
          console.error('Initial cloud sync error:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Load initial data from offline-first IndexedDB
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [loadedSchools, loadedTeachers, loadedClasses, loadedLessons] = await Promise.all([
          storage.getSchools(),
          storage.getTeachers(),
          storage.getClasses(),
          storage.getLessons(),
        ]);
        setSchools(loadedSchools);
        setTeachers(loadedTeachers);
        setClasses(loadedClasses);
        setLessons(loadedLessons);
      } catch (err) {
        console.error('Error loading offline data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Handlers for Lesson CRUD with Cloud sync
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

  const handleSaveLesson = async (lesson: Lesson) => {
    setLessons((prev) => {
      const exists = prev.some((l) => l.id === lesson.id);
      const updated = exists
        ? prev.map((l) => (l.id === lesson.id ? lesson : l))
        : [lesson, ...prev];
      storage.saveLessons(updated);
      return updated;
    });

    if (user) {
      cloudStorage.saveLesson(user.uid, lesson).catch(console.error);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    setLessons((prev) => {
      const updated = prev.filter((l) => l.id !== lessonId);
      storage.saveLessons(updated);
      return updated;
    });

    if (user) {
      cloudStorage.deleteLesson(user.uid, lessonId).catch(console.error);
    }
  };

  const handleToggleComplete = async (lessonId: string) => {
    let updatedLesson: Lesson | undefined;
    setLessons((prev) => {
      const updated = prev.map((l) => {
        if (l.id === lessonId) {
          updatedLesson = { ...l, completed: !l.completed };
          return updatedLesson;
        }
        return l;
      });
      storage.saveLessons(updated);
      return updated;
    });

    if (user && updatedLesson) {
      cloudStorage.saveLesson(user.uid, updatedLesson).catch(console.error);
    }
  };

  // Handlers for School CRUD with Cloud sync
  const handleSaveSchool = async (school: School) => {
    setSchools((prev) => {
      const exists = prev.some((s) => s.id === school.id);
      const updated = exists
        ? prev.map((s) => (s.id === school.id ? school : s))
        : [...prev, school];
      storage.saveSchools(updated);
      return updated;
    });

    if (user) {
      cloudStorage.saveSchool(user.uid, school).catch(console.error);
    }
  };

  const handleDeleteSchool = async (schoolId: string) => {
    setSchools((prev) => {
      const updated = prev.filter((s) => s.id !== schoolId);
      storage.saveSchools(updated);
      return updated;
    });
    setLessons((prev) => {
      const updated = prev.filter((l) => l.schoolId !== schoolId);
      storage.saveLessons(updated);
      return updated;
    });
    setTeachers((prev) => {
      const updated = prev.filter((t) => t.schoolId !== schoolId);
      storage.saveTeachers(updated);
      return updated;
    });
    setClasses((prev) => {
      const updated = prev.filter((c) => c.schoolId !== schoolId);
      storage.saveClasses(updated);
      return updated;
    });

    if (user) {
      cloudStorage.deleteSchool(user.uid, schoolId).catch(console.error);
    }
  };

  // Handlers for Teacher CRUD with Cloud sync
  const handleSaveTeacher = async (teacher: Teacher) => {
    setTeachers((prev) => {
      const exists = prev.some((t) => t.id === teacher.id);
      const updated = exists
        ? prev.map((t) => (t.id === teacher.id ? teacher : t))
        : [...prev, teacher];
      storage.saveTeachers(updated);
      return updated;
    });

    if (user) {
      cloudStorage.saveTeacher(user.uid, teacher).catch(console.error);
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    setTeachers((prev) => {
      const updated = prev.filter((t) => t.id !== teacherId);
      storage.saveTeachers(updated);
      return updated;
    });

    if (user) {
      cloudStorage.deleteTeacher(user.uid, teacherId).catch(console.error);
    }
  };

  // Handlers for Class CRUD with Cloud sync
  const handleSaveClass = async (classRoster: ClassRoster) => {
    setClasses((prev) => {
      const exists = prev.some((c) => c.id === classRoster.id);
      const updated = exists
        ? prev.map((c) => (c.id === classRoster.id ? classRoster : c))
        : [...prev, classRoster];
      storage.saveClasses(updated);
      return updated;
    });

    if (user) {
      cloudStorage.saveClass(user.uid, classRoster).catch(console.error);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    setClasses((prev) => {
      const updated = prev.filter((c) => c.id !== classId);
      storage.saveClasses(updated);
      return updated;
    });

    if (user) {
      cloudStorage.deleteClass(user.uid, classId).catch(console.error);
    }
  };

  // Reset & Clear handlers
  const handleResetSeedData = async () => {
    const data = await storage.resetToSeedData();
    setSchools(data.schools);
    setTeachers(data.teachers);
    setClasses(data.classes);
    setLessons(data.lessons);

    if (user) {
      await cloudStorage.syncAllToCloud(user.uid, data);
      setLastSynced(new Date().toLocaleTimeString());
    }
  };

  const handleClearAllData = async () => {
    await storage.clearAllData();
    setSchools([]);
    setTeachers([]);
    setClasses([]);
    setLessons([]);
  };

  const handleImportData = async (data: {
    schools: School[];
    teachers: Teacher[];
    classes: ClassRoster[];
    lessons: Lesson[];
  }) => {
    await storage.saveSchools(data.schools);
    await storage.saveTeachers(data.teachers);
    await storage.saveClasses(data.classes);
    await storage.saveLessons(data.lessons);
    setSchools(data.schools);
    setTeachers(data.teachers);
    setClasses(data.classes);
    setLessons(data.lessons);

    if (user) {
      await cloudStorage.syncAllToCloud(user.uid, data);
      setLastSynced(new Date().toLocaleTimeString());
    }
  };

  const handleCloudDataLoaded = async (data: {
    schools: School[];
    teachers: Teacher[];
    classes: ClassRoster[];
    lessons: Lesson[];
  }) => {
    setSchools(data.schools);
    setTeachers(data.teachers);
    setClasses(data.classes);
    setLessons(data.lessons);
    await storage.saveSchools(data.schools);
    await storage.saveTeachers(data.teachers);
    await storage.saveClasses(data.classes);
    await storage.saveLessons(data.lessons);
  };

  // Count lessons for today
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLessonsCount = lessons.filter((l) => l.date === todayStr).length;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Top / Bottom Navigation */}
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

        {/* Main Content Area */}
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
                  onResetSeedData={handleResetSeedData}
                  onClearAllData={handleClearAllData}
                  onImportData={handleImportData}
                />
              )}
            </>
          )}
        </main>

        {/* Fast Lesson Logger Modal */}
        <FastLessonLoggerModal
          isOpen={isQuickLogOpen}
          onClose={() => {
            setIsQuickLogOpen(false);
            setEditingLesson(null);
          }}
          onSaveLesson={handleSaveLesson}
          schools={schools}
          teachers={teachers}
          classes={classes}
          onAddTeacher={handleSaveTeacher}
          onAddClass={handleSaveClass}
          editingLesson={editingLesson}
          defaultDate={quickLogDate}
        />

        {/* Profile & Firebase Cloud Sync Modal */}
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
          schools={schools}
          teachers={teachers}
          classes={classes}
          lessons={lessons}
          onDataLoaded={handleCloudDataLoaded}
          lastSynced={lastSynced}
          setLastSynced={setLastSynced}
        />
      </div>
    </ThemeProvider>
  );
}


