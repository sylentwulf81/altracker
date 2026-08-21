import { School, Teacher, ClassRoster, Lesson } from '../types';

const DB_NAME = 'ALT_Dispatch_Hub_DB';
const DB_VERSION = 1;
const STORES = ['schools', 'teachers', 'classes', 'lessons'] as const;

type StoreName = typeof STORES[number];

// Helper to open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      STORES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Generic get all from IndexedDB
async function getAllFromStore<T>(storeName: StoreName): Promise<T[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Fallback to localStorage
    const key = `alt_hub_${storeName}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        return JSON.parse(raw) as T[];
      } catch {
        return [];
      }
    }
    return [];
  }
}

// Generic save all to IndexedDB & localStorage
async function saveAllToStore<T extends { id: string }>(storeName: StoreName, items: T[]): Promise<void> {
  // Always mirror in localStorage for immediate synchronous resilience
  const key = `alt_hub_${storeName}`;
  localStorage.setItem(key, JSON.stringify(items));

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      items.forEach((item) => store.put(item));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // localStorage backup already saved
  }
}

// Storage API
export const storage = {
  async getSchools(): Promise<School[]> {
    const items = await getAllFromStore<School>('schools');
    if (!items || items.length === 0) {
      return seedDefaultData().schools;
    }
    return items;
  },

  async saveSchools(schools: School[]): Promise<void> {
    await saveAllToStore('schools', schools);
  },

  async getTeachers(): Promise<Teacher[]> {
    const items = await getAllFromStore<Teacher>('teachers');
    if (!items || items.length === 0) {
      return seedDefaultData().teachers;
    }
    return items;
  },

  async saveTeachers(teachers: Teacher[]): Promise<void> {
    await saveAllToStore('teachers', teachers);
  },

  async getClasses(): Promise<ClassRoster[]> {
    const items = await getAllFromStore<ClassRoster>('classes');
    if (!items || items.length === 0) {
      return seedDefaultData().classes;
    }
    return items;
  },

  async saveClasses(classes: ClassRoster[]): Promise<void> {
    await saveAllToStore('classes', classes);
  },

  async getLessons(): Promise<Lesson[]> {
    const items = await getAllFromStore<Lesson>('lessons');
    if (!items || items.length === 0) {
      return seedDefaultData().lessons;
    }
    return items;
  },

  async saveLessons(lessons: Lesson[]): Promise<void> {
    await saveAllToStore('lessons', lessons);
  },

  async resetToSeedData(): Promise<{
    schools: School[];
    teachers: Teacher[];
    classes: ClassRoster[];
    lessons: Lesson[];
  }> {
    const data = createInitialSeedData();
    await saveAllToStore('schools', data.schools);
    await saveAllToStore('teachers', data.teachers);
    await saveAllToStore('classes', data.classes);
    await saveAllToStore('lessons', data.lessons);
    return data;
  },

  async clearAllData(): Promise<void> {
    await saveAllToStore('schools', []);
    await saveAllToStore('teachers', []);
    await saveAllToStore('classes', []);
    await saveAllToStore('lessons', []);
  },
};

// Compute dynamic dates for current week
function getWeekDates(): { [dayOffset: number]: string } {
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday...
  // Distance to Monday
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);

  const dates: { [dayOffset: number]: string } = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates[i] = `${year}-${month}-${day}`;
  }
  return dates;
}

export function createInitialSeedData(): {
  schools: School[];
  teachers: Teacher[];
  classes: ClassRoster[];
  lessons: Lesson[];
} {
  const schools: School[] = [
    {
      id: 'sch-1',
      name: 'Sakuragaoka Elementary',
      nameJp: '桜丘小学校',
      type: 'Elementary',
      colorTag: 'rose',
      defaultDurationMinutes: 45,
      address: '2-14-1 Sakura-dori, Minato-ku',
      contactNumber: '03-3456-7890',
    },
    {
      id: 'sch-2',
      name: 'Midori Junior High',
      nameJp: '緑中学校',
      type: 'Junior High',
      colorTag: 'emerald',
      defaultDurationMinutes: 50,
      address: '4-8-1 Midoricho, Shibuya-ku',
      contactNumber: '03-5678-1234',
    },
    {
      id: 'sch-3',
      name: 'Higashi High School',
      nameJp: '東高等学校',
      type: 'High School',
      colorTag: 'indigo',
      defaultDurationMinutes: 50,
      address: '1-1-5 Higashiyama, Shinjuku-ku',
      contactNumber: '03-9988-7766',
    },
  ];

  const teachers: Teacher[] = [
    {
      id: 'tch-1',
      schoolId: 'sch-1',
      name: 'Tanaka-sensei',
      nameJp: '田中先生',
      role: 'HRT',
      email: 'tanaka@sakura-es.ed.jp',
    },
    {
      id: 'tch-2',
      schoolId: 'sch-1',
      name: 'Suzuki-sensei',
      nameJp: '鈴木先生',
      role: 'HRT',
      email: 'suzuki@sakura-es.ed.jp',
    },
    {
      id: 'tch-3',
      schoolId: 'sch-2',
      name: 'Sato-sensei',
      nameJp: '佐藤先生',
      role: 'JTE',
      email: 'sato.jte@midori-jhs.ed.jp',
    },
    {
      id: 'tch-4',
      schoolId: 'sch-2',
      name: 'Takahashi-sensei',
      nameJp: '高橋先生',
      role: 'JTE',
      email: 'takahashi@midori-jhs.ed.jp',
    },
    {
      id: 'tch-5',
      schoolId: 'sch-3',
      name: 'Yamamoto-sensei',
      nameJp: '山本先生',
      role: 'JTE',
      email: 'yamamoto@higashi-hs.ed.jp',
    },
  ];

  const classes: ClassRoster[] = [
    {
      id: 'cls-1',
      schoolId: 'sch-1',
      gradeLevel: '5th Grade',
      classIdentifier: 'Class 1',
      studentCount: 28,
      room: 'Room 5-1',
    },
    {
      id: 'cls-2',
      schoolId: 'sch-1',
      gradeLevel: '6th Grade',
      classIdentifier: 'Class 2',
      studentCount: 30,
      room: 'Room 6-2',
    },
    {
      id: 'cls-3',
      schoolId: 'sch-2',
      gradeLevel: '1st Year JHS',
      classIdentifier: 'Class 1-A',
      studentCount: 32,
      room: 'Room 101',
    },
    {
      id: 'cls-4',
      schoolId: 'sch-2',
      gradeLevel: '2nd Year JHS',
      classIdentifier: 'Class 2-B',
      studentCount: 31,
      room: 'Room 202',
    },
    {
      id: 'cls-5',
      schoolId: 'sch-3',
      gradeLevel: '1st Year HS',
      classIdentifier: 'Class 1-3',
      studentCount: 36,
      room: 'Room 303',
    },
  ];

  const week = getWeekDates();

  const lessons: Lesson[] = [
    {
      id: 'les-1',
      schoolId: 'sch-1',
      teacherId: 'tch-1',
      classRosterId: 'cls-1',
      date: week[0] || '2026-08-17', // Monday
      startTime: '08:50',
      durationMinutes: 45,
      period: 1,
      isRecurring: true,
      recurrenceDayOfWeek: 1,
      notes: 'Unit 3 Intro: "What do you want to eat?" Food vocabulary flashcards, menu order dialogue, and Alphabet Bingo warm-up.',
      completed: true,
    },
    {
      id: 'les-2',
      schoolId: 'sch-1',
      teacherId: 'tch-2',
      classRosterId: 'cls-2',
      date: week[0] || '2026-08-17', // Monday
      startTime: '10:45',
      durationMinutes: 45,
      period: 3,
      isRecurring: true,
      recurrenceDayOfWeek: 1,
      notes: 'Unit 4 Speaking Test & Presentation: "My Summer Memories" with past tense gestures. Great student engagement!',
      completed: true,
    },
    {
      id: 'les-3',
      schoolId: 'sch-2',
      teacherId: 'tch-3',
      classRosterId: 'cls-3',
      date: week[1] || '2026-08-18', // Tuesday
      startTime: '09:45',
      durationMinutes: 50,
      period: 2,
      isRecurring: true,
      recurrenceDayOfWeek: 2,
      notes: 'Here We Go Book 1, Unit 5: Grammar focus on third-person singular (-s/-es). Team competition board race.',
      completed: true,
    },
    {
      id: 'les-4',
      schoolId: 'sch-2',
      teacherId: 'tch-4',
      classRosterId: 'cls-4',
      date: week[2] || '2026-08-19', // Wednesday
      startTime: '13:20',
      durationMinutes: 50,
      period: 5,
      isRecurring: true,
      recurrenceDayOfWeek: 3,
      notes: 'New Horizon Book 2, Unit 4 Read & Think 1: Pair reading pronunciation check and small talk warm-up on favorite sports.',
      completed: false,
    },
    {
      id: 'les-5',
      schoolId: 'sch-1',
      teacherId: 'tch-1',
      classRosterId: 'cls-1',
      date: week[3] || '2026-08-20', // Thursday
      startTime: '11:40',
      durationMinutes: 45,
      period: 4,
      isRecurring: false,
      notes: 'Review Game & Phonics Quiz: Stations practice for spelling vowel combinations (ea/ee/ai).',
      completed: false,
    },
    {
      id: 'les-6',
      schoolId: 'sch-3',
      teacherId: 'tch-5',
      classRosterId: 'cls-5',
      date: week[4] || '2026-08-21', // Friday
      startTime: '14:15',
      durationMinutes: 50,
      period: 6,
      isRecurring: true,
      recurrenceDayOfWeek: 5,
      notes: 'Crown English Communication: Debate prep on renewable energy. Monitored breakout groups and assisted with vocabulary.',
      completed: false,
    },
  ];

  return { schools, teachers, classes, lessons };
}

function seedDefaultData() {
  const data = createInitialSeedData();
  // Asynchronously store them
  saveAllToStore('schools', data.schools);
  saveAllToStore('teachers', data.teachers);
  saveAllToStore('classes', data.classes);
  saveAllToStore('lessons', data.lessons);
  return data;
}
