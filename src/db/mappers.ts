import { School, Teacher, ClassRoster, Lesson, SchoolType, TeacherRole } from '../types';

/**
 * Postgres uses snake_case and null; the app's types use camelCase and
 * undefined. Everything crossing that boundary goes through this file, so the
 * translation lives in exactly one place.
 */

const fromNull = <T>(v: T | null): T | undefined => (v === null ? undefined : v);
const toNull = <T>(v: T | undefined): T | null => (v === undefined ? null : v);

// --- Row shapes as PostgREST returns them ----------------------------------

export interface SchoolRow {
  id: string;
  name: string;
  name_jp: string | null;
  type: SchoolType;
  color_tag: string;
  default_duration_minutes: number;
  address: string | null;
  contact_number: string | null;
}

export interface TeacherRow {
  id: string;
  school_id: string;
  name: string;
  name_jp: string | null;
  role: TeacherRole;
  email: string | null;
  notes: string | null;
}

export interface ClassRow {
  id: string;
  school_id: string;
  grade_level: string;
  class_identifier: string;
  student_count: number | null;
  room: string | null;
}

export interface LessonRow {
  id: string;
  school_id: string;
  teacher_id: string | null;
  class_id: string | null;
  date: string;
  start_time: string;
  duration_minutes: number;
  period: number | null;
  is_recurring: boolean;
  recurrence_day_of_week: number | null;
  notes: string;
  completed: boolean;
  target_unit: string | null;
}

// --- Row -> domain ---------------------------------------------------------

export const rowToSchool = (r: SchoolRow): School => ({
  id: r.id,
  name: r.name,
  nameJp: fromNull(r.name_jp),
  type: r.type,
  colorTag: r.color_tag,
  defaultDurationMinutes: r.default_duration_minutes,
  address: fromNull(r.address),
  contactNumber: fromNull(r.contact_number),
});

export const rowToTeacher = (r: TeacherRow): Teacher => ({
  id: r.id,
  schoolId: r.school_id,
  name: r.name,
  nameJp: fromNull(r.name_jp),
  role: r.role,
  email: fromNull(r.email),
  notes: fromNull(r.notes),
});

export const rowToClass = (r: ClassRow): ClassRoster => ({
  id: r.id,
  schoolId: r.school_id,
  gradeLevel: r.grade_level,
  classIdentifier: r.class_identifier,
  studentCount: fromNull(r.student_count),
  room: fromNull(r.room),
});

export const rowToLesson = (r: LessonRow): Lesson => ({
  id: r.id,
  schoolId: r.school_id,
  // teacher_id / class_id go null when a teacher or class is deleted, so that
  // lesson history survives roster changes. The views look these up by id and
  // simply render nothing when the lookup misses, which '' produces too.
  teacherId: r.teacher_id ?? '',
  classRosterId: r.class_id ?? '',
  date: r.date,
  // Postgres `time` comes back as HH:mm:ss; the UI works in HH:mm.
  startTime: r.start_time.slice(0, 5),
  durationMinutes: r.duration_minutes,
  period: fromNull(r.period),
  isRecurring: r.is_recurring,
  recurrenceDayOfWeek: fromNull(r.recurrence_day_of_week),
  notes: r.notes,
  completed: r.completed,
  targetUnit: fromNull(r.target_unit),
});

// --- Domain -> row ---------------------------------------------------------
// user_id is deliberately omitted: the column defaults to auth.uid(), so the
// database assigns ownership and the client cannot spoof it.

export const schoolToRow = (s: School) => ({
  id: s.id,
  name: s.name,
  name_jp: toNull(s.nameJp),
  type: s.type,
  color_tag: s.colorTag,
  default_duration_minutes: s.defaultDurationMinutes,
  address: toNull(s.address),
  contact_number: toNull(s.contactNumber),
});

export const teacherToRow = (t: Teacher) => ({
  id: t.id,
  school_id: t.schoolId,
  name: t.name,
  name_jp: toNull(t.nameJp),
  role: t.role,
  email: toNull(t.email),
  notes: toNull(t.notes),
});

export const classToRow = (c: ClassRoster) => ({
  id: c.id,
  school_id: c.schoolId,
  grade_level: c.gradeLevel,
  class_identifier: c.classIdentifier,
  student_count: toNull(c.studentCount),
  room: toNull(c.room),
});

export const lessonToRow = (l: Lesson) => ({
  id: l.id,
  school_id: l.schoolId,
  teacher_id: l.teacherId || null,
  class_id: l.classRosterId || null,
  date: l.date,
  start_time: l.startTime,
  duration_minutes: l.durationMinutes,
  period: toNull(l.period),
  is_recurring: l.isRecurring,
  recurrence_day_of_week: toNull(l.recurrenceDayOfWeek),
  notes: l.notes ?? '',
  completed: l.completed ?? false,
  target_unit: toNull(l.targetUnit),
});
