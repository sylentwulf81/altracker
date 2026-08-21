import { storage as localStorageEngine, createInitialSeedData } from './storage';
import {
  auth,
  db,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  User,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from './firebase';
import { School, Teacher, ClassRoster, Lesson } from '../types';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  lastSyncedAt?: string;
}

export const authService = {
  onAuthState(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  async signInWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, googleProvider);
        throw err;
      }
      throw err;
    }
  },

  async signOut(): Promise<void> {
    await signOut(auth);
  },

  getCurrentUser(): User | null {
    return auth.currentUser;
  },
};

const googleProvider = new GoogleAuthProvider();

// Firestore Sync & Storage Layer
export const cloudStorage = {
  async fetchUserData(userId: string): Promise<{
    schools: School[];
    teachers: Teacher[];
    classes: ClassRoster[];
    lessons: Lesson[];
  }> {
    try {
      const [schoolsSnap, teachersSnap, classesSnap, lessonsSnap] = await Promise.all([
        getDocs(collection(db, 'users', userId, 'schools')),
        getDocs(collection(db, 'users', userId, 'teachers')),
        getDocs(collection(db, 'users', userId, 'classes')),
        getDocs(collection(db, 'users', userId, 'lessons')),
      ]);

      const schools = schoolsSnap.docs.map((d) => d.data() as School);
      const teachers = teachersSnap.docs.map((d) => d.data() as Teacher);
      const classes = classesSnap.docs.map((d) => d.data() as ClassRoster);
      const lessons = lessonsSnap.docs.map((d) => d.data() as Lesson);

      return { schools, teachers, classes, lessons };
    } catch (err) {
      console.error('Failed to fetch from Firestore:', err);
      throw err;
    }
  },

  async syncAllToCloud(
    userId: string,
    data: {
      schools: School[];
      teachers: Teacher[];
      classes: ClassRoster[];
      lessons: Lesson[];
    }
  ): Promise<void> {
    const batch = writeBatch(db);

    // Save profile timestamp
    const userDocRef = doc(db, 'users', userId);
    batch.set(userDocRef, {
      lastSyncedAt: new Date().toISOString(),
      email: auth.currentUser?.email || '',
      displayName: auth.currentUser?.displayName || '',
      photoURL: auth.currentUser?.photoURL || '',
    }, { merge: true });

    // Save schools
    data.schools.forEach((s) => {
      const ref = doc(db, 'users', userId, 'schools', s.id);
      batch.set(ref, s);
    });

    // Save teachers
    data.teachers.forEach((t) => {
      const ref = doc(db, 'users', userId, 'teachers', t.id);
      batch.set(ref, t);
    });

    // Save classes
    data.classes.forEach((c) => {
      const ref = doc(db, 'users', userId, 'classes', c.id);
      batch.set(ref, c);
    });

    // Save lessons
    data.lessons.forEach((l) => {
      const ref = doc(db, 'users', userId, 'lessons', l.id);
      batch.set(ref, l);
    });

    await batch.commit();
  },

  async saveSchool(userId: string, school: School): Promise<void> {
    await setDoc(doc(db, 'users', userId, 'schools', school.id), school);
  },

  async deleteSchool(userId: string, schoolId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', userId, 'schools', schoolId));
  },

  async saveTeacher(userId: string, teacher: Teacher): Promise<void> {
    await setDoc(doc(db, 'users', userId, 'teachers', teacher.id), teacher);
  },

  async deleteTeacher(userId: string, teacherId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', userId, 'teachers', teacherId));
  },

  async saveClass(userId: string, classRoster: ClassRoster): Promise<void> {
    await setDoc(doc(db, 'users', userId, 'classes', classRoster.id), classRoster);
  },

  async deleteClass(userId: string, classId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', userId, 'classes', classId));
  },

  async saveLesson(userId: string, lesson: Lesson): Promise<void> {
    await setDoc(doc(db, 'users', userId, 'lessons', lesson.id), lesson);
  },

  async deleteLesson(userId: string, lessonId: string): Promise<void> {
    await deleteDoc(doc(db, 'users', userId, 'lessons', lessonId));
  },
};
