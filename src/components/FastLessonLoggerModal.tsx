import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, BookOpen, AlertCircle, Check } from 'lucide-react';
import { Lesson, School, Teacher, ClassRoster } from '../types';
import { getSchoolColor, getDefaultDurationForSchoolType } from '../utils/colorUtils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface FastLessonLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLesson: (lesson: Lesson) => void;
  schools: School[];
  teachers: Teacher[];
  classes: ClassRoster[];
  onAddTeacher: (teacher: Teacher) => void;
  onAddClass: (classRoster: ClassRoster) => void;
  editingLesson?: Lesson | null;
  defaultDate?: string;
}

const PRESET_CHIPS = [
  'Unit 3 Intro', 'Speaking Test', 'Alphabet Bingo', 'Review Game',
  'Self-Intro Activity', 'Small Talk Warm-up', 'Textbook Practice',
  'Interview Game', 'Phonics & Chant', 'Listening Quiz',
  'Simon Says & TPR', 'Station Rotation',
];

const PERIOD_TIMES: { [key: number]: string } = {
  1: '08:50', 2: '09:45', 3: '10:45', 4: '11:40', 5: '13:20', 6: '14:15',
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const FastLessonLoggerModal: React.FC<FastLessonLoggerModalProps> = ({
  isOpen, onClose, onSaveLesson, schools, teachers, classes,
  onAddTeacher, onAddClass, editingLesson, defaultDate,
}) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('08:50');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [period, setPeriod] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [completed, setCompleted] = useState<boolean>(false);

  // Initialize or reset form (Simplified)
  useEffect(() => {
    if (isOpen) {
      if (editingLesson) {
        setSelectedSchoolId(editingLesson.schoolId);
        setSelectedTeacherId(editingLesson.teacherId);
        setSelectedClassId(editingLesson.classRosterId);
        setDate(editingLesson.date);
        setStartTime(editingLesson.startTime);
        setDurationMinutes(editingLesson.durationMinutes);
        setPeriod(editingLesson.period || 1);
        setNotes(editingLesson.notes || '');
        setCompleted(editingLesson.completed || false);
      } else {
        const todayStr = defaultDate || new Date().toISOString().slice(0, 10);
        setDate(todayStr);
        if (schools.length > 0) handleSchoolChange(schools[0].id);
      }
    }
  }, [isOpen, editingLesson, defaultDate, schools]);

  const handleSchoolChange = (newSchoolId: string) => {
    setSelectedSchoolId(newSchoolId);
    const targetSchool = schools.find((s) => s.id === newSchoolId);
    if (targetSchool) {
      setDurationMinutes(targetSchool.defaultDurationMinutes || getDefaultDurationForSchoolType(targetSchool.type));
    }
    const matchingTeachers = teachers.filter((t) => t.schoolId === newSchoolId);
    const matchingClasses = classes.filter((c) => c.schoolId === newSchoolId);
    setSelectedTeacherId(matchingTeachers[0]?.id || '');
    setSelectedClassId(matchingClasses[0]?.id || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId || !selectedTeacherId || !selectedClassId || !date) return;
    onSaveLesson({
      id: editingLesson ? editingLesson.id : crypto.randomUUID(),
      schoolId: selectedSchoolId,
      teacherId: selectedTeacherId,
      classRosterId: selectedClassId,
      date, startTime, durationMinutes, period,
      isRecurring: false, // simplified for now
      notes: notes.slice(0, 280),
      completed,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg rounded-3xl shadow-xl border-none">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              {editingLesson ? 'Edit Log' : 'New Lesson'}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>School</Label>
                <Select value={selectedSchoolId} onValueChange={handleSchoolChange}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Teacher</Label>
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {teachers.filter(t => t.schoolId === selectedSchoolId).map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Further form fields... simplified approach for brevity as requested */}
            <Button type="submit" className="w-full rounded-xl">Save</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
