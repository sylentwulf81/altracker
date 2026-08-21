import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Edit2,
  Trash2,
  User,
  GraduationCap,
  Filter,
  Check,
  CalendarDays,
  ListTodo,
  Radio,
  Timer,
} from 'lucide-react';
import { Lesson, School, Teacher, ClassRoster, ScheduleViewMode } from '../types';
import { getSchoolColor, getRoleBadge } from '../utils/colorUtils';
import { getLessonLiveStatus, getLocalDateString } from '../utils/timeUtils';

interface ScheduleViewProps {
  lessons: Lesson[];
  schools: School[];
  teachers: Teacher[];
  classes: ClassRoster[];
  onOpenQuickLog: (date?: string) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onToggleComplete: (lessonId: string) => void;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  lessons,
  schools,
  teachers,
  classes,
  onOpenQuickLog,
  onEditLesson,
  onDeleteLesson,
  onToggleComplete,
}) => {
  const [viewMode, setViewMode] = useState<ScheduleViewMode>('day');
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [showWeekend, setShowWeekend] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  // Background ticker: auto-updates current time every 15 seconds to recalculate "NOW" & "in X mins" status
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const schoolMap = new Map<string, School>(schools.map((s) => [s.id, s]));
  const teacherMap = new Map<string, Teacher>(teachers.map((t) => [t.id, t]));
  const classMap = new Map<string, ClassRoster>(classes.map((c) => [c.id, c]));

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(getLocalDateString(d));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(getLocalDateString(d));
  };

  const handlePrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(getLocalDateString(d));
  };

  const handleNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(getLocalDateString(d));
  };

  const handleGoToToday = () => {
    setSelectedDate(getLocalDateString(currentTime));
  };

  const todayStr = getLocalDateString(currentTime);
  const isSelectedToday = selectedDate === todayStr;

  // Compute Current Week Days (Mon -> Fri / Sun)
  const getWeekDays = (baseDateStr: string) => {
    const d = new Date(baseDateStr + 'T00:00:00');
    const day = d.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);

    const weekDays: {
      dateStr: string;
      dayName: string;
      dayNameJp: string;
      dayNum: number;
      isToday: boolean;
      isSelected: boolean;
      lessonCount: number;
      hasLiveLesson: boolean;
    }[] = [];
    const count = showWeekend ? 7 : 5;

    for (let i = 0; i < count; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      const dateStr = getLocalDateString(cur);

      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayNamesJp = ['月', '火', '水', '木', '金', '土', '日'];

      const dayLessonsList = lessons.filter((l) => {
        if (schoolFilter !== 'all' && l.schoolId !== schoolFilter) return false;
        return l.date === dateStr;
      });

      const hasLive = dayLessonsList.some((l) => {
        const status = getLessonLiveStatus(l.date, l.startTime, l.durationMinutes, l.completed, currentTime);
        return status.status === 'now' || (status.status === 'starting_soon' && (status.minutesToStart || 99) <= 15);
      });

      weekDays.push({
        dateStr,
        dayName: dayNames[i],
        dayNameJp: dayNamesJp[i],
        dayNum: cur.getDate(),
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        lessonCount: dayLessonsList.length,
        hasLiveLesson: hasLive,
      });
    }
    return weekDays;
  };

  const currentWeekDays = getWeekDays(selectedDate);
  const weekStartStr = currentWeekDays[0]?.dateStr || selectedDate;
  const weekEndStr = currentWeekDays[currentWeekDays.length - 1]?.dateStr || selectedDate;

  // Filter lessons
  const filteredLessons = lessons.filter((l) => {
    if (schoolFilter !== 'all' && l.schoolId !== schoolFilter) return false;
    return true;
  });

  // Lessons for the selected single day
  const dayLessons = filteredLessons
    .filter((l) => l.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Format date for display
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const dayOfWeekJp = ['日', '月', '火', '水', '木', '金', '土'][selectedDateObj.getDay()];
  const formattedDayTitle = `${selectedDateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  })} (${dayOfWeekJp}曜日)`;

  // Formatted Current Time String (e.g. 9:42 AM)
  const formattedCurrentTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-4 pb-20 md:pb-12">
      
      {/* 1. Interactive Daily Tracker & Calendar Strip */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs space-y-3">
        {/* Strip Header Navigation & Live Time Indicator */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              id="prev-week-btn"
              onClick={handlePrevWeek}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="today-btn"
              onClick={handleGoToToday}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isSelectedToday
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Today (今日)
            </button>
            <button
              id="next-week-btn"
              onClick={handleNextWeek}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Live Background Time Indicator & Direct Date Picker */}
          <div className="flex items-center space-x-2">
            {/* Live Clock Badge */}
            <div className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{formattedCurrentTime}</span>
              <span className="text-[10px] text-slate-400 font-semibold">Live</span>
            </div>

            <div className="hidden md:flex items-center space-x-1.5 text-xs font-extrabold text-slate-800">
              <CalendarIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>{viewMode === 'day' ? formattedDayTitle : `${weekStartStr} ~ ${weekEndStr}`}</span>
            </div>

            <input
              type="date"
              id="schedule-date-picker"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            />
          </div>
        </div>

        {/* 7-Day Interactive Tracker Strip */}
        <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-7 gap-1.5 sm:gap-2">
          {currentWeekDays.map((d) => (
            <button
              key={d.dateStr}
              id={`calendar-day-btn-${d.dateStr}`}
              onClick={() => {
                setSelectedDate(d.dateStr);
                if (viewMode === 'week') setViewMode('day');
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer relative ${
                d.isSelected
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-600/20 ring-2 ring-sky-300/40'
                  : d.isToday
                  ? 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100'
                  : 'bg-slate-50/80 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider ${d.isSelected ? 'text-sky-100' : 'text-slate-400'}`}>
                {d.dayName} {d.dayNameJp}
              </span>
              <span className="text-sm sm:text-base font-extrabold my-0.5">
                {d.dayNum}
              </span>
              
              {/* Lesson count indicator */}
              <div className="flex items-center space-x-1 mt-0.5">
                {d.lessonCount > 0 ? (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                      d.isSelected
                        ? 'bg-white text-sky-700'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {d.lessonCount} {d.lessonCount === 1 ? 'class' : 'classes'}
                  </span>
                ) : (
                  <span className={`text-[9px] font-medium ${d.isSelected ? 'text-sky-200' : 'text-slate-300'}`}>
                    Free
                  </span>
                )}
              </div>

              {/* Little Live / Today Indicator */}
              {d.isToday && (
                <span
                  className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                    d.hasLiveLesson ? 'bg-emerald-500 animate-ping' : d.isSelected ? 'bg-white' : 'bg-sky-500'
                  }`}
                  title={d.hasLiveLesson ? 'Class currently active or starting soon' : 'Today'}
                />
              )}
            </button>
          ))}
        </div>

        {/* View Switcher & School Filter */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          {/* Day vs Week Switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              id="view-mode-day-btn"
              onClick={() => setViewMode('day')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5 text-sky-600" />
              <span>Day Agenda (日別)</span>
            </button>
            <button
              id="view-mode-week-btn"
              onClick={() => setViewMode('week')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-sky-600" />
              <span>Weekly Grid (週間)</span>
            </button>
          </div>

          {/* School Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="schedule-school-filter"
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Schools (全学校)</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Main Daily Agenda or Weekly View */}
      {viewMode === 'day' ? (
        /* DAY AGENDA VIEW */
        <div className="space-y-3">
          {/* Day Title Bar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-extrabold text-slate-900">
                {formattedDayTitle}
              </h3>
              {isSelectedToday && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-700 border border-sky-200">
                  Today · {formattedCurrentTime}
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-slate-500">
              {dayLessons.length} {dayLessons.length === 1 ? 'lesson' : 'lessons'}
            </span>
          </div>

          {dayLessons.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-dashed border-slate-300">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No lessons logged for this day</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                No classes scheduled for {formattedDayTitle}. Tap Quick Log to schedule your lesson and co-teacher.
              </p>
              <button
                id="empty-state-log-btn"
                onClick={() => onOpenQuickLog(selectedDate)}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-200 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Log Lesson for This Day</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {dayLessons.map((lesson) => {
                const school = schoolMap.get(lesson.schoolId);
                const teacher = teacherMap.get(lesson.teacherId);
                const cls = classMap.get(lesson.classRosterId);
                const color = getSchoolColor(school?.colorTag);
                const roleBadge = getRoleBadge(teacher?.role || 'JTE');

                // Compute real-time live class status (NOW, Starts in X min, etc.)
                const liveStatus = getLessonLiveStatus(
                  lesson.date,
                  lesson.startTime,
                  lesson.durationMinutes,
                  lesson.completed,
                  currentTime
                );

                const isCurrentlyActive = liveStatus.status === 'now';
                const isStartingVerySoon = liveStatus.status === 'starting_soon' && (liveStatus.minutesToStart || 99) <= 15;

                return (
                  <div
                    key={lesson.id}
                    id={`lesson-card-${lesson.id}`}
                    className={`bg-white rounded-2xl p-3.5 sm:p-4 border shadow-xs transition-all border-l-4 ${color.cardBorder} ${
                      isCurrentlyActive
                        ? 'border-emerald-400 ring-2 ring-emerald-400/40 bg-emerald-50/20 shadow-md shadow-emerald-100'
                        : isStartingVerySoon
                        ? 'border-amber-300 ring-2 ring-amber-200/50 bg-amber-50/15'
                        : 'border-slate-200 hover:border-slate-300'
                    } ${lesson.completed ? 'opacity-90 bg-slate-50/40' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      
                      {/* Left: Time, Period, Live Status Badge, School & Class info */}
                      <div className="space-y-1.5 flex-1">
                        
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2">
                          
                          {/* Live Relative Time Status Badge */}
                          {isSelectedToday && (
                            <div className="flex items-center">
                              {isCurrentlyActive ? (
                                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow-xs animate-pulse">
                                  <span className="w-2 h-2 rounded-full bg-white ring-2 ring-emerald-300 animate-ping" />
                                  <span>{liveStatus.label}</span>
                                </span>
                              ) : isStartingVerySoon ? (
                                <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-xs">
                                  <Timer className="w-3 h-3 animate-spin" />
                                  <span>{liveStatus.label}</span>
                                </span>
                              ) : liveStatus.status === 'starting_soon' ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-800 border border-sky-300">
                                  <Clock className="w-3 h-3 text-sky-600" />
                                  <span>{liveStatus.label}</span>
                                </span>
                              ) : liveStatus.status === 'starting_later' ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{liveStatus.label}</span>
                                </span>
                              ) : null}
                            </div>
                          )}

                          {/* Period Badge */}
                          {lesson.period && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-xs font-bold">
                              {lesson.period}限
                            </span>
                          )}

                          {/* Time & Duration */}
                          <span className="inline-flex items-center space-x-1 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{lesson.startTime} ({lesson.durationMinutes}m)</span>
                          </span>

                          {/* School Badge */}
                          {school && (
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${color.badgeBg} ${color.badgeText} ${color.badgeBorder}`}>
                              {school.name} {school.nameJp ? `(${school.nameJp})` : ''}
                            </span>
                          )}

                          {/* Recurring Tag */}
                          {lesson.isRecurring && (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              Recurring (固定)
                            </span>
                          )}
                        </div>

                        {/* Class and Co-Teacher info */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-1">
                          <div className="flex items-center space-x-1.5 text-sm font-bold text-slate-900">
                            <GraduationCap className="w-4 h-4 text-sky-600" />
                            <span>{cls ? `${cls.gradeLevel} - ${cls.classIdentifier}` : 'Class'}</span>
                            {cls?.room && <span className="text-xs text-slate-400 font-normal">({cls.room})</span>}
                          </div>

                          <div className="flex items-center space-x-1.5 text-xs text-slate-700">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold">{teacher?.name || 'Teacher'}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${roleBadge.bg} ${roleBadge.text}`}>
                              {roleBadge.label} ({roleBadge.jp})
                            </span>
                          </div>
                        </div>

                        {/* Lesson Notes Snippet */}
                        {lesson.notes && (
                          <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 leading-relaxed">
                            <span className="font-bold text-slate-500 mr-1">📝 Notes:</span>
                            {lesson.notes}
                          </div>
                        )}
                      </div>

                      {/* Right: Completion status & Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Complete Toggle Button */}
                        <button
                          id={`toggle-complete-${lesson.id}`}
                          onClick={() => onToggleComplete(lesson.id)}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            lesson.completed
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          {lesson.completed ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Completed</span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-4 h-4 text-slate-400" />
                              <span>Mark Done</span>
                            </>
                          )}
                        </button>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center space-x-1">
                          <button
                            id={`edit-lesson-${lesson.id}`}
                            onClick={() => onEditLesson(lesson)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                            title="Edit Lesson"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            id={`delete-lesson-${lesson.id}`}
                            onClick={() => onDeleteLesson(lesson.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Lesson"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* WEEKLY VIEW */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-600">Weekly Schedule Grid</span>
            <button
              onClick={() => setShowWeekend(!showWeekend)}
              className="text-xs text-sky-600 font-semibold hover:underline cursor-pointer"
            >
              {showWeekend ? 'Hide Weekend (平日のみ)' : 'Show Weekend (土日表示)'}
            </button>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${showWeekend ? '7' : '5'} gap-3`}>
            {currentWeekDays.map((wDay) => {
              const dayLessonsList = filteredLessons
                .filter((l) => l.date === wDay.dateStr)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

              return (
                <div
                  key={wDay.dateStr}
                  className={`bg-white rounded-2xl border ${
                    wDay.isToday ? 'border-sky-400 ring-2 ring-sky-300/30' : 'border-slate-200'
                  } overflow-hidden flex flex-col shadow-xs min-h-[260px]`}
                >
                  {/* Day Column Header */}
                  <div
                    onClick={() => {
                      setSelectedDate(wDay.dateStr);
                      setViewMode('day');
                    }}
                    className={`p-3 border-b flex items-center justify-between cursor-pointer transition-colors ${
                      wDay.isToday
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider block">
                        {wDay.dayName} ({wDay.dayNameJp})
                      </span>
                      <span className={`text-sm font-extrabold ${wDay.isToday ? 'text-white' : 'text-slate-900'}`}>
                        {wDay.dateStr.slice(5)}
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        wDay.isToday
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {dayLessonsList.length}
                    </span>
                  </div>

                  {/* Day Column Lessons List */}
                  <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                    {dayLessonsList.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center p-4 text-center text-slate-300">
                        <span className="text-xs font-medium">No lessons</span>
                        <button
                          onClick={() => onOpenQuickLog(wDay.dateStr)}
                          className="mt-2 text-[10px] text-sky-600 hover:underline font-bold cursor-pointer"
                        >
                          Log Lesson
                        </button>
                      </div>
                    ) : (
                      dayLessonsList.map((lesson) => {
                        const school = schoolMap.get(lesson.schoolId);
                        const teacher = teacherMap.get(lesson.teacherId);
                        const cls = classMap.get(lesson.classRosterId);
                        const color = getSchoolColor(school?.colorTag);

                        const liveStatus = getLessonLiveStatus(
                          lesson.date,
                          lesson.startTime,
                          lesson.durationMinutes,
                          lesson.completed,
                          currentTime
                        );

                        return (
                          <div
                            key={lesson.id}
                            onClick={() => onEditLesson(lesson)}
                            className={`p-2.5 rounded-xl border bg-white cursor-pointer transition-all hover:shadow-xs border-l-3 ${color.cardBorder} ${
                              liveStatus.status === 'now'
                                ? 'border-emerald-400 ring-2 ring-emerald-300/40 bg-emerald-50/20'
                                : 'border-slate-200 hover:border-slate-300'
                            } ${lesson.completed ? 'bg-slate-50/70 opacity-80' : ''}`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                              <span className="flex items-center space-x-1">
                                <span>{lesson.period ? `${lesson.period}限 ` : ''}{lesson.startTime}</span>
                                {liveStatus.status === 'now' && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-600 text-white">
                                    NOW
                                  </span>
                                )}
                              </span>
                              {lesson.completed && (
                                <Check className="w-3 h-3 text-emerald-600 font-bold" />
                              )}
                            </div>

                            <p className="text-xs font-extrabold text-slate-900 truncate">
                              {cls ? `${cls.gradeLevel} ${cls.classIdentifier}` : 'Class'}
                            </p>

                            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                              <span className="truncate">{school?.name}</span>
                              <span className="font-semibold text-slate-700">{teacher?.name?.split('-')[0]}</span>
                            </div>

                            {lesson.notes && (
                              <p className="text-[10px] text-slate-500 italic mt-1 line-clamp-1">
                                {lesson.notes}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Day column footer quick add */}
                  <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                    <button
                      onClick={() => onOpenQuickLog(wDay.dateStr)}
                      className="w-full py-1 text-[11px] font-bold text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Log</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) for Quick Log - Single clean '+' and label */}
      <div className="fixed bottom-20 md:bottom-8 right-5 z-40">
        <button
          id="fab-quick-log-btn"
          onClick={() => onOpenQuickLog(selectedDate)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 active:scale-95 text-white font-bold shadow-xl shadow-sky-400/40 transition-all cursor-pointer"
          aria-label="Quick Log Lesson"
        >
          <Plus className="w-4 h-4 stroke-[2.5px]" />
          <span className="text-xs font-extrabold">Quick Log</span>
        </button>
      </div>

    </div>
  );
};
