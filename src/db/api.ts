import { alt, supabase } from './supabase';
import {
  SchoolRow,
  TeacherRow,
  ClassRow,
  LessonRow,
  rowToSchool,
  rowToTeacher,
  rowToClass,
  rowToLesson,
  schoolToRow,
  teacherToRow,
  classToRow,
  lessonToRow,
} from './mappers';
import { School, Teacher, ClassRoster, Lesson } from '../types';

export interface AppData {
  schools: School[];
  teachers: Teacher[];
  classes: ClassRoster[];
  lessons: Lesson[];
}

/**
 * Every function here throws on failure rather than logging and continuing.
 * The previous Firebase layer swallowed each error into console.error, so a
 * rejected write looked identical to a successful one from the UI.
 */

export async function fetchAll(): Promise<AppData> {
  const [schools, teachers, classes, lessons] = await Promise.all([
    alt().from('schools').select('*').order('name'),
    alt().from('teachers').select('*').order('name'),
    alt().from('classes').select('*').order('grade_level'),
    alt().from('lessons').select('*').order('date', { ascending: false }),
  ]);

  const firstError =
    schools.error ?? teachers.error ?? classes.error ?? lessons.error;
  if (firstError) {
    throw new Error(`Loading your data failed: ${firstError.message}`);
  }

  return {
    schools: ((schools.data ?? []) as SchoolRow[]).map(rowToSchool),
    teachers: ((teachers.data ?? []) as TeacherRow[]).map(rowToTeacher),
    classes: ((classes.data ?? []) as ClassRow[]).map(rowToClass),
    lessons: ((lessons.data ?? []) as LessonRow[]).map(rowToLesson),
  };
}

// --- Schools ---------------------------------------------------------------

export async function saveSchool(school: School): Promise<School> {
  const { data, error } = await alt()
    .from('schools')
    .upsert(schoolToRow(school))
    .select()
    .single();
  if (error) throw new Error(`Saving school failed: ${error.message}`);
  return rowToSchool(data as SchoolRow);
}

export async function deleteSchool(id: string): Promise<void> {
  const { error } = await alt().from('schools').delete().eq('id', id);
  if (error) throw new Error(`Deleting school failed: ${error.message}`);
}

// --- Teachers --------------------------------------------------------------

export async function saveTeacher(teacher: Teacher): Promise<Teacher> {
  const { data, error } = await alt()
    .from('teachers')
    .upsert(teacherToRow(teacher))
    .select()
    .single();
  if (error) throw new Error(`Saving teacher failed: ${error.message}`);
  return rowToTeacher(data as TeacherRow);
}

export async function deleteTeacher(id: string): Promise<void> {
  const { error } = await alt().from('teachers').delete().eq('id', id);
  if (error) throw new Error(`Deleting teacher failed: ${error.message}`);
}

// --- Classes ---------------------------------------------------------------

export async function saveClass(roster: ClassRoster): Promise<ClassRoster> {
  const { data, error } = await alt()
    .from('classes')
    .upsert(classToRow(roster))
    .select()
    .single();
  if (error) throw new Error(`Saving class failed: ${error.message}`);
  return rowToClass(data as ClassRow);
}

export async function deleteClass(id: string): Promise<void> {
  const { error } = await alt().from('classes').delete().eq('id', id);
  if (error) throw new Error(`Deleting class failed: ${error.message}`);
}

// --- Lessons ---------------------------------------------------------------

export async function saveLesson(lesson: Lesson): Promise<Lesson> {
  const { data, error } = await alt()
    .from('lessons')
    .upsert(lessonToRow(lesson))
    .select()
    .single();
  if (error) throw new Error(`Saving lesson failed: ${error.message}`);
  return rowToLesson(data as LessonRow);
}

export async function deleteLesson(id: string): Promise<void> {
  const { error } = await alt().from('lessons').delete().eq('id', id);
  if (error) throw new Error(`Deleting lesson failed: ${error.message}`);
}

// --- Bulk import -----------------------------------------------------------

export async function importAll(data: AppData): Promise<void> {
  // Schools first: teachers, classes and lessons all reference them.
  const schools = await alt().from('schools').upsert(data.schools.map(schoolToRow));
  if (schools.error) throw new Error(`Importing schools failed: ${schools.error.message}`);

  const [teachers, classes] = await Promise.all([
    alt().from('teachers').upsert(data.teachers.map(teacherToRow)),
    alt().from('classes').upsert(data.classes.map(classToRow)),
  ]);
  if (teachers.error) throw new Error(`Importing teachers failed: ${teachers.error.message}`);
  if (classes.error) throw new Error(`Importing classes failed: ${classes.error.message}`);

  const lessons = await alt().from('lessons').upsert(data.lessons.map(lessonToRow));
  if (lessons.error) throw new Error(`Importing lessons failed: ${lessons.error.message}`);
}

export async function deleteEverything(): Promise<void> {
  // Deleting schools cascades to teachers, classes and lessons.
  const { error } = await alt().from('schools').delete().not('id', 'is', null);
  if (error) throw new Error(`Clearing data failed: ${error.message}`);

  const orphans = await alt().from('lessons').delete().not('id', 'is', null);
  if (orphans.error) throw new Error(`Clearing lessons failed: ${orphans.error.message}`);
}

// --- Realtime --------------------------------------------------------------

/**
 * Fires `onChange` whenever this user's rows change anywhere — including from
 * another device, which is the whole point. Returns an unsubscribe function.
 *
 * Requires the altracker tables to be members of the `supabase_realtime`
 * publication; migration 0003 adds them.
 */
export function subscribeToChanges(userId: string, onChange: () => void): () => void {
  const filter = `user_id=eq.${userId}`;
  const channel = supabase.channel('altracker-changes');

  for (const table of ['schools', 'teachers', 'classes', 'lessons']) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'altracker', table, filter },
      onChange
    );
  }

  channel.subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
