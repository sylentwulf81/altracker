import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  GraduationCap,
  Clock,
  MapPin,
  Phone,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { School, Teacher, ClassRoster, Lesson, SchoolType } from '../types';
import { SCHOOL_COLORS, getSchoolColor, getDefaultDurationForSchoolType } from '../utils/colorUtils';

interface SchoolsViewProps {
  schools: School[];
  teachers: Teacher[];
  classes: ClassRoster[];
  lessons: Lesson[];
  onSaveSchool: (school: School) => void;
  onDeleteSchool: (schoolId: string) => void;
}

export const SchoolsView: React.FC<SchoolsViewProps> = ({
  schools,
  teachers,
  classes,
  lessons,
  onSaveSchool,
  onDeleteSchool,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [nameJp, setNameJp] = useState('');
  const [type, setType] = useState<SchoolType>('Elementary');
  const [colorTag, setColorTag] = useState('sky');
  const [defaultDurationMinutes, setDefaultDurationMinutes] = useState(45);
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const handleOpenAddModal = () => {
    setEditingSchool(null);
    setName('');
    setNameJp('');
    setType('Elementary');
    setColorTag('sky');
    setDefaultDurationMinutes(45);
    setAddress('');
    setContactNumber('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (school: School) => {
    setEditingSchool(school);
    setName(school.name);
    setNameJp(school.nameJp || '');
    setType(school.type);
    setColorTag(school.colorTag);
    setDefaultDurationMinutes(school.defaultDurationMinutes || getDefaultDurationForSchoolType(school.type));
    setAddress(school.address || '');
    setContactNumber(school.contactNumber || '');
    setIsModalOpen(true);
  };

  const handleTypeChange = (newType: SchoolType) => {
    setType(newType);
    setDefaultDurationMinutes(getDefaultDurationForSchoolType(newType));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const school: School = {
      id: editingSchool ? editingSchool.id : crypto.randomUUID(),
      name: name.trim(),
      nameJp: nameJp.trim() || undefined,
      type,
      colorTag,
      defaultDurationMinutes: Number(defaultDurationMinutes) || 45,
      address: address.trim() || undefined,
      contactNumber: contactNumber.trim() || undefined,
    };

    onSaveSchool(school);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-sky-600" />
            <h2 className="text-lg font-extrabold text-slate-900">Dispatch Schools / 派遣校一覧</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage your assigned elementary, junior high, and high schools
          </p>
        </div>

        <button
          id="add-school-btn"
          onClick={handleOpenAddModal}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-sky-200 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Dispatch School</span>
        </button>
      </div>

      {/* School Cards Grid */}
      {schools.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No schools configured</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Add your assigned dispatch schools to start scheduling lessons.</p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700"
          >
            + Add School Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schools.map((school) => {
            const color = getSchoolColor(school.colorTag);
            const schoolTeachers = teachers.filter((t) => t.schoolId === school.id);
            const schoolClasses = classes.filter((c) => c.schoolId === school.id);
            const schoolLessons = lessons.filter((l) => l.schoolId === school.id);

            return (
              <div
                key={school.id}
                id={`school-card-${school.id}`}
                className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between border-t-4`}
                style={{ borderTopColor: color.hex }}
              >
                <div>
                  {/* Top row: Type and Color tag */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${color.badgeBg} ${color.badgeText} ${color.badgeBorder}`}>
                      {school.type}
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-3 h-3 rounded-full ${color.dot}`} title={color.name} />
                      <span className="text-[11px] text-slate-500 font-semibold">{color.name.split(' ')[0]}</span>
                    </div>
                  </div>

                  {/* School Names */}
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {school.name}
                  </h3>
                  {school.nameJp && (
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{school.nameJp}</p>
                  )}

                  {/* Details */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Default Duration: <strong>{school.defaultDurationMinutes} min / class</strong></span>
                    </div>
                    {school.address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{school.address}</span>
                      </div>
                    )}
                    {school.contactNumber && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{school.contactNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats Counters */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-xs font-extrabold text-slate-900 block">{schoolTeachers.length}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Teachers</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-xs font-extrabold text-slate-900 block">{schoolClasses.length}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Classes</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-xs font-extrabold text-slate-900 block">{schoolLessons.length}</span>
                      <span className="text-[10px] text-slate-500 font-medium">Lessons</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-end space-x-2 mt-5 pt-3 border-t border-slate-100">
                  <button
                    id={`edit-school-${school.id}`}
                    onClick={() => handleOpenEditModal(school)}
                    className="p-2 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors flex items-center space-x-1 text-xs font-bold"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    id={`delete-school-${school.id}`}
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${school.name}? This will also affect associated lessons.`)) {
                        onDeleteSchool(school.id);
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center space-x-1 text-xs font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit School Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[85vh] animate-in fade-in zoom-in-95 duration-150 my-auto">
            
            <div className="shrink-0 px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-sky-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {editingSchool ? 'Edit School' : 'Add Dispatch School'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
                {/* School Name (English & Japanese) */}
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      School Name (English) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sakuragaoka Elementary"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      School Name (Japanese Kanji / 漢字)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 桜丘小学校"
                      value={nameJp}
                      onChange={(e) => setNameJp(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* School Type */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    School Type / 校種
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Elementary', 'Junior High', 'High School'] as SchoolType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleTypeChange(t)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          type === t
                            ? 'border-sky-500 bg-sky-50 text-sky-800 font-bold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Tag Selection */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Visual Color Tag (used for calendar & reports)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.values(SCHOOL_COLORS).map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setColorTag(c.key)}
                        className={`p-2 rounded-xl border flex items-center space-x-2 transition-all cursor-pointer ${
                          colorTag === c.key
                            ? 'border-slate-800 ring-2 ring-slate-400 bg-slate-50 font-bold'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${c.dot}`} />
                        <span className="text-[11px] truncate">{c.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default Lesson Duration */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Default Lesson Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={120}
                    step={5}
                    value={defaultDurationMinutes}
                    onChange={(e) => setDefaultDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                  />
                </div>

                {/* Address & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Address / 住所</label>
                    <input
                      type="text"
                      placeholder="e.g. 2-14-1 Sakura-dori"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Phone / 電話番号</label>
                    <input
                      type="text"
                      placeholder="e.g. 03-3456-7890"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="shrink-0 p-4 sm:px-6 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-md shadow-sky-200 cursor-pointer"
                >
                  {editingSchool ? 'Save Changes' : 'Create School'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
