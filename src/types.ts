export type SchoolType = 'Elementary' | 'Junior High' | 'High School';

export type TeacherRole = 'HRT' | 'JTE' | 'Other';

export interface School {
  id: string;
  name: string;
  nameJp?: string;
  type: SchoolType;
  colorTag: string; // Tailwind color keyword (e.g. 'indigo', 'emerald', 'amber', 'rose', 'sky', 'purple', 'teal') or hex
  defaultDurationMinutes: number; // ES=45, JHS=50, HS=50
  address?: string;
  contactNumber?: string;
}

export interface Teacher {
  id: string;
  schoolId: string;
  name: string; // e.g. "Sato-sensei" or "Ken Sato"
  nameJp?: string;
  role: TeacherRole;
  email?: string;
  notes?: string;
}

export interface ClassRoster {
  id: string;
  schoolId: string;
  gradeLevel: string; // e.g. "5th Grade", "1st Year JHS"
  classIdentifier: string; // e.g. "Class 1", "Class 2", "3-A"
  studentCount?: number;
  room?: string;
}

export interface Lesson {
  id: string;
  schoolId: string;
  teacherId: string;
  classRosterId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (e.g. "08:50", "09:45")
  durationMinutes: number;
  period?: number; // 1 to 6 (Japanese standard period: 1限, 2限...)
  isRecurring: boolean;
  recurrenceDayOfWeek?: number; // 0-6 (0=Sun, 1=Mon, ..., 6=Sat)
  notes: string; // Max 280 characters
  completed?: boolean;
  targetUnit?: string;
}

export type ActiveTab = 'schedule' | 'schools' | 'roster' | 'reports' | 'settings';

export type ScheduleViewMode = 'day' | 'week';

export type DateRangePreset = 'today' | 'this_week' | 'month_current' | 'month_previous' | 'biweekly_1_15' | 'biweekly_16_end' | 'custom';
