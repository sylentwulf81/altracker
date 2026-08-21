import React, { useState } from 'react';
import {
  Users2,
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  User,
  Building2,
  Mail,
  X,
  Search,
  Filter,
} from 'lucide-react';
import { Teacher, ClassRoster, School, TeacherRole } from '../types';
import { getSchoolColor, getRoleBadge } from '../utils/colorUtils';

interface TeachersAndClassesViewProps {
  schools: School[];
  teachers: Teacher[];
  classes: ClassRoster[];
  onSaveTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (teacherId: string) => void;
  onSaveClass: (classRoster: ClassRoster) => void;
  onDeleteClass: (classId: string) => void;
}

export const TeachersAndClassesView: React.FC<TeachersAndClassesViewProps> = ({
  schools,
  teachers,
  classes,
  onSaveTeacher,
  onDeleteTeacher,
  onSaveClass,
  onDeleteClass,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'teachers' | 'classes'>('teachers');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [tSchoolId, setTSchoolId] = useState('');
  const [tName, setTName] = useState('');
  const [tNameJp, setTNameJp] = useState('');
  const [tRole, setTRole] = useState<TeacherRole>('JTE');
  const [tEmail, setTEmail] = useState('');

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoster | null>(null);
  const [cSchoolId, setCSchoolId] = useState('');
  const [cGradeLevel, setCGradeLevel] = useState('5th Grade');
  const [cClassIdentifier, setCClassIdentifier] = useState('Class 1');
  const [cStudentCount, setCStudentCount] = useState<number>(30);
  const [cRoom, setCRoom] = useState('');

  const schoolMap = new Map<string, School>(schools.map((s) => [s.id, s]));

  // Handlers for Teacher Modal
  const handleOpenAddTeacher = () => {
    setEditingTeacher(null);
    setTSchoolId(selectedSchoolId !== 'all' ? selectedSchoolId : (schools[0]?.id || ''));
    setTName('');
    setTNameJp('');
    setTRole('JTE');
    setTEmail('');
    setIsTeacherModalOpen(true);
  };

  const handleOpenEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setTSchoolId(teacher.schoolId);
    setTName(teacher.name);
    setTNameJp(teacher.nameJp || '');
    setTRole(teacher.role);
    setTEmail(teacher.email || '');
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim() || !tSchoolId) return;

    const teacher: Teacher = {
      id: editingTeacher ? editingTeacher.id : crypto.randomUUID(),
      schoolId: tSchoolId,
      name: tName.trim(),
      nameJp: tNameJp.trim() || undefined,
      role: tRole,
      email: tEmail.trim() || undefined,
    };

    onSaveTeacher(teacher);
    setIsTeacherModalOpen(false);
  };

  // Handlers for Class Modal
  const handleOpenAddClass = () => {
    setEditingClass(null);
    setCSchoolId(selectedSchoolId !== 'all' ? selectedSchoolId : (schools[0]?.id || ''));
    setCGradeLevel('5th Grade');
    setCClassIdentifier('Class 1');
    setCStudentCount(30);
    setCRoom('');
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: ClassRoster) => {
    setEditingClass(cls);
    setCSchoolId(cls.schoolId);
    setCGradeLevel(cls.gradeLevel);
    setCClassIdentifier(cls.classIdentifier);
    setCStudentCount(cls.studentCount || 30);
    setCRoom(cls.room || '');
    setIsClassModalOpen(true);
  };

  const handleSaveClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cClassIdentifier.trim() || !cSchoolId) return;

    const classRoster: ClassRoster = {
      id: editingClass ? editingClass.id : crypto.randomUUID(),
      schoolId: cSchoolId,
      gradeLevel: cGradeLevel.trim(),
      classIdentifier: cClassIdentifier.trim(),
      studentCount: Number(cStudentCount) || 30,
      room: cRoom.trim() || undefined,
    };

    onSaveClass(classRoster);
    setIsClassModalOpen(false);
  };

  // Filtered lists
  const filteredTeachers = teachers.filter((t) => {
    if (selectedSchoolId !== 'all' && t.schoolId !== selectedSchoolId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = t.name.toLowerCase().includes(q) || (t.nameJp && t.nameJp.includes(q));
      const matchRole = t.role.toLowerCase().includes(q);
      const school = schoolMap.get(t.schoolId);
      const matchSchool = school?.name.toLowerCase().includes(q);
      return matchName || matchRole || matchSchool;
    }
    return true;
  });

  const filteredClasses = classes.filter((c) => {
    if (selectedSchoolId !== 'all' && c.schoolId !== selectedSchoolId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = c.gradeLevel.toLowerCase().includes(q) || c.classIdentifier.toLowerCase().includes(q);
      const school = schoolMap.get(c.schoolId);
      const matchSchool = school?.name.toLowerCase().includes(q);
      return matchName || matchSchool;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      
      {/* Header with Sub-tabs and Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Users2 className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-extrabold text-slate-900">Co-Teachers & Class Rosters</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Organize JTEs, HRTs, and grade cohorts per dispatch school
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {activeSubTab === 'teachers' ? (
              <button
                id="add-teacher-btn"
                onClick={handleOpenAddTeacher}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-sky-200 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Teacher</span>
              </button>
            ) : (
              <button
                id="add-class-btn"
                onClick={handleOpenAddClass}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-sky-200 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Class Roster</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-tabs and Filters Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          
          {/* Sub-tab switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              id="subtab-teachers-btn"
              onClick={() => setActiveSubTab('teachers')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'teachers'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5 text-sky-600" />
              <span>Teachers ({teachers.length})</span>
            </button>
            <button
              id="subtab-classes-btn"
              onClick={() => setActiveSubTab('classes')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'classes'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Classes ({classes.length})</span>
            </button>
          </div>

          {/* School Filter & Search */}
          <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>

            <select
              id="roster-school-filter"
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Schools (全校)</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main SubTab Content */}
      {activeSubTab === 'teachers' ? (
        /* TEACHERS LIST */
        filteredTeachers.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-300">
            <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No teachers found</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">Add your Japanese Teachers of English (JTE) or Homeroom Teachers (HRT).</p>
            <button
              onClick={handleOpenAddTeacher}
              className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700"
            >
              + Add Teacher Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTeachers.map((teacher) => {
              const school = schoolMap.get(teacher.schoolId);
              const color = getSchoolColor(school?.colorTag);
              const roleBadge = getRoleBadge(teacher.role);

              return (
                <div
                  key={teacher.id}
                  id={`teacher-card-${teacher.id}`}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: School Tag & Role */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${color.badgeBg} ${color.badgeText} ${color.badgeBorder}`}>
                        {school?.name || 'School'}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${roleBadge.bg} ${roleBadge.text}`}>
                        {roleBadge.label} ({roleBadge.jp})
                      </span>
                    </div>

                    {/* Teacher Name */}
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">
                      {teacher.name}
                    </h3>
                    {teacher.nameJp && (
                      <p className="text-xs text-slate-500 font-medium">{teacher.nameJp}</p>
                    )}

                    {/* Email info */}
                    {teacher.email && (
                      <div className="mt-3 flex items-center space-x-1.5 text-xs text-slate-600 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEditTeacher(teacher)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete teacher ${teacher.name}?`)) {
                          onDeleteTeacher(teacher.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* CLASSES LIST */
        filteredClasses.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-300">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No classes found</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">Add grade cohorts and classes for each dispatch school.</p>
            <button
              onClick={handleOpenAddClass}
              className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700"
            >
              + Add Class Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredClasses.map((cls) => {
              const school = schoolMap.get(cls.schoolId);
              const color = getSchoolColor(school?.colorTag);

              return (
                <div
                  key={cls.id}
                  id={`class-card-${cls.id}`}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: School Tag */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${color.badgeBg} ${color.badgeText} ${color.badgeBorder}`}>
                        {school?.name || 'School'}
                      </span>
                      {cls.room && (
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {cls.room}
                        </span>
                      )}
                    </div>

                    {/* Class Info */}
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">
                      {cls.gradeLevel} - {cls.classIdentifier}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Approx. {cls.studentCount || 30} students
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEditClass(cls)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete class ${cls.gradeLevel} ${cls.classIdentifier}?`)) {
                          onDeleteClass(cls.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Add / Edit Teacher Modal */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[85vh] animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="shrink-0 px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTeacher ? 'Edit Teacher' : 'Add Co-Teacher'}
              </h3>
              <button
                onClick={() => setIsTeacherModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacherSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">School / 担当学校</label>
                  <select
                    value={tSchoolId}
                    onChange={(e) => setTSchoolId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden cursor-pointer"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} {s.nameJp ? `(${s.nameJp})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teacher Name (Romaji / English) <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sato-sensei"
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teacher Name (Kanji / 漢字)</label>
                  <input
                    type="text"
                    placeholder="e.g. 佐藤先生"
                    value={tNameJp}
                    onChange={(e) => setTNameJp(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role / 役割</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['JTE', 'HRT', 'Other'] as TeacherRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTRole(r)}
                        className={`py-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                          tRole === r
                            ? 'border-sky-500 bg-sky-50 text-sky-800'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {r === 'JTE' ? 'JTE (英語科)' : r === 'HRT' ? 'HRT (担任)' : 'Other'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="sato@school.ed.jp"
                    value={tEmail}
                    onChange={(e) => setTEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700 shadow-md shadow-sky-200 cursor-pointer"
                >
                  Save Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Class Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[85vh] animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="shrink-0 px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
              <h3 className="text-sm font-bold text-slate-900">
                {editingClass ? 'Edit Class Roster' : 'Add Class Roster'}
              </h3>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClassSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">School / 担当学校</label>
                  <select
                    value={cSchoolId}
                    onChange={(e) => setCSchoolId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden cursor-pointer"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grade Level / 学年 <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5th Grade, 1st Year JHS, 3rd Grade"
                    value={cGradeLevel}
                    onChange={(e) => setCGradeLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Class Identifier / 組・クラス <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Class 1, Class 2, 1-A, 3-B"
                    value={cClassIdentifier}
                    onChange={(e) => setCClassIdentifier(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Approx Students</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={cStudentCount}
                      onChange={(e) => setCStudentCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Room (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Room 5-1"
                      value={cRoom}
                      onChange={(e) => setCRoom(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700 shadow-md shadow-sky-200 cursor-pointer"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
