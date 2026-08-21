import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Copy,
  Share2,
  FileText,
  MessageSquare,
  Mail,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Building2,
  Check,
  Sparkles,
} from 'lucide-react';
import { Lesson, School, Teacher, ClassRoster, DateRangePreset } from '../types';
import {
  calculateSummary,
  exportToCSV,
  generateFormattedText,
  generatePDFReport,
  shareContent,
} from '../utils/exportUtils';
import { getSchoolColor, getRoleBadge } from '../utils/colorUtils';

interface ReportsViewProps {
  lessons: Lesson[];
  schools: School[];
  teachers: Teacher[];
  classes: ClassRoster[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  lessons,
  schools,
  teachers,
  classes,
}) => {
  const [datePreset, setDatePreset] = useState<DateRangePreset>('this_week');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const schoolMap = new Map<string, School>(schools.map((s) => [s.id, s]));
  const teacherMap = new Map<string, Teacher>(teachers.map((t) => [t.id, t]));
  const classMap = new Map<string, ClassRoster>(classes.map((c) => [c.id, c]));

  // Calculate dynamic date range based on preset
  const calculateDateRange = (): { start: string; end: string; label: string } => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    if (datePreset === 'today') {
      const str = now.toISOString().slice(0, 10);
      return { start: str, end: str, label: `Today (${str})` };
    }

    if (datePreset === 'this_week') {
      const curDay = now.getDay();
      const diffToMonday = curDay === 0 ? -6 : 1 - curDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const start = monday.toISOString().slice(0, 10);
      const end = sunday.toISOString().slice(0, 10);
      return { start, end, label: `This Week (${start} ~ ${end})` };
    }

    if (datePreset === 'month_current') {
      const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
      const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);
      const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
      return { start: firstDay, end: lastDay, label: `${monthName} (Full Month)` };
    }

    if (datePreset === 'month_previous') {
      const firstDay = new Date(year, month - 1, 1).toISOString().slice(0, 10);
      const lastDay = new Date(year, month, 0).toISOString().slice(0, 10);
      const prevDate = new Date(year, month - 1, 1);
      const monthName = prevDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      return { start: firstDay, end: lastDay, label: `${monthName} (Previous Month)` };
    }

    if (datePreset === 'biweekly_1_15') {
      const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
      const midDay = new Date(year, month, 15).toISOString().slice(0, 10);
      return { start: firstDay, end: midDay, label: `1st ~ 15th (${year}-${String(month + 1).padStart(2, '0')})` };
    }

    if (datePreset === 'biweekly_16_end') {
      const midStart = new Date(year, month, 16).toISOString().slice(0, 10);
      const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);
      return { start: midStart, end: lastDay, label: `16th ~ End of Month (${year}-${String(month + 1).padStart(2, '0')})` };
    }

    // Custom
    return {
      start: customStartDate,
      end: customEndDate,
      label: `Custom (${customStartDate} ~ ${customEndDate})`,
    };
  };

  const { start: dateStart, end: dateEnd, label: dateRangeLabel } = calculateDateRange();

  // Filter lessons
  const filteredLessons = lessons
    .filter((l) => {
      if (l.date < dateStart || l.date > dateEnd) return false;
      if (selectedSchoolId !== 'all' && l.schoolId !== selectedSchoolId) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

  const summary = calculateSummary(filteredLessons, schools);
  const selectedSchoolObj = schools.find((s) => s.id === selectedSchoolId);
  const schoolFilterLabel = selectedSchoolObj ? selectedSchoolObj.name : 'All Dispatch Schools';

  // Export handlers
  const handleCopy = async (format: 'line' | 'markdown' | 'email', title: string) => {
    const text = generateFormattedText(filteredLessons, schools, teachers, classes, format, dateRangeLabel);
    await navigator.clipboard.writeText(text);
    setCopyFeedback(`Copied ${title} to clipboard!`);
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const handleShare = async () => {
    const text = generateFormattedText(filteredLessons, schools, teachers, classes, 'line', dateRangeLabel);
    const shared = await shareContent(`ALT Lesson Report: ${dateRangeLabel}`, text);
    if (!shared) {
      setCopyFeedback('Report text copied to clipboard!');
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  const handleDownloadCSV = () => {
    exportToCSV(filteredLessons, schools, teachers, classes);
  };

  const handleGeneratePDF = () => {
    generatePDFReport(filteredLessons, schools, teachers, classes, dateRangeLabel, schoolFilterLabel);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-12">
      
      {/* 1. Header & Range Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-extrabold text-slate-900">Reports & Dispatch Exports</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Generate formatted reports for Dispatch Companies, BOEs, LINE, Slack, CSV, or printable PDF
            </p>
          </div>

          {/* School filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              id="report-school-filter"
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Schools (全学校)</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Presets Grid */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
            Report Period Preset (提出期間)
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'this_week' as DateRangePreset, label: 'This Week (今週)' },
              { key: 'biweekly_1_15' as DateRangePreset, label: '1st ~ 15th (前半)' },
              { key: 'biweekly_16_end' as DateRangePreset, label: '16th ~ End of Month (後半)' },
              { key: 'month_current' as DateRangePreset, label: 'Current Month (当月)' },
              { key: 'month_previous' as DateRangePreset, label: 'Previous Month (先月)' },
              { key: 'custom' as DateRangePreset, label: 'Custom Range (期間指定)' },
            ].map((p) => (
              <button
                key={p.key}
                id={`preset-btn-${p.key}`}
                onClick={() => setDatePreset(p.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  datePreset === p.key
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs if active */}
          {datePreset === 'custom' && (
            <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <span className="text-slate-400 self-center mt-4">~</span>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block uppercase">Total Lessons</span>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 block">
            {summary.totalLessons} <span className="text-xs font-medium text-slate-400">classes</span>
          </span>
          <span className="text-[11px] text-slate-500">総授業コマ数</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-sky-700 block uppercase">Contact Hours</span>
          <span className="text-xl sm:text-2xl font-extrabold text-sky-600 mt-1 block">
            {summary.totalHours} <span className="text-xs font-medium text-sky-500">hrs</span>
          </span>
          <span className="text-[11px] text-slate-500">総指導時間</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-emerald-700 block uppercase">Completed</span>
          <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1 block">
            {summary.completedLessons}/{summary.totalLessons}
          </span>
          <span className="text-[11px] text-slate-500">
            {summary.totalLessons > 0 ? Math.round((summary.completedLessons / summary.totalLessons) * 100) : 0}% conducted
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-indigo-700 block uppercase">Scope</span>
          <span className="text-sm font-extrabold text-indigo-900 mt-1 block truncate">
            {schoolFilterLabel}
          </span>
          <span className="text-[11px] text-slate-500">{dateRangeLabel}</span>
        </div>
      </div>

      {/* Feedback Toast */}
      {copyFeedback && (
        <div className="p-3 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>{copyFeedback}</span>
          </div>
          <button onClick={() => setCopyFeedback(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* 3. Export Action Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Export & Dispatch Submission Actions</span>
            </h3>
            <p className="text-xs text-slate-300">Choose your desired output format</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
          {/* LINE Format */}
          <button
            id="export-line-btn"
            onClick={() => handleCopy('line', 'LINE / Slack Summary')}
            className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>LINE / Slack</span>
          </button>

          {/* Markdown Format */}
          <button
            id="export-markdown-btn"
            onClick={() => handleCopy('markdown', 'Markdown Report')}
            className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>Markdown</span>
          </button>

          {/* Email Format */}
          <button
            id="export-email-btn"
            onClick={() => handleCopy('email', 'Email Text')}
            className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Email Text</span>
          </button>

          {/* Download CSV */}
          <button
            id="export-csv-btn"
            onClick={handleDownloadCSV}
            className="flex items-center justify-center space-x-2 px-3 py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>CSV Export</span>
          </button>

          {/* Generate PDF */}
          <button
            id="export-pdf-btn"
            onClick={handleGeneratePDF}
            className="col-span-2 sm:col-span-1 flex items-center justify-center space-x-2 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>PDF Report</span>
          </button>
        </div>
      </div>

      {/* 4. Live Scannable Table Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Scannable Table Preview</h3>
            <p className="text-xs text-slate-500">
              Showing {filteredLessons.length} lessons for {dateRangeLabel}
            </p>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-sky-600" />
            <span>Share Report</span>
          </button>
        </div>

        {filteredLessons.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No lesson logs found in this date range</p>
            <p className="text-xs text-slate-400 mt-1">Try selecting a different date preset or adding new lessons.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Time/Period</th>
                  <th className="py-3 px-3">School</th>
                  <th className="py-3 px-3">Grade & Class</th>
                  <th className="py-3 px-3">Co-Teacher</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 min-w-[200px]">Notes & Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLessons.map((l) => {
                  const school = schoolMap.get(l.schoolId);
                  const teacher = teacherMap.get(l.teacherId);
                  const cls = classMap.get(l.classRosterId);
                  const color = getSchoolColor(school?.colorTag);
                  const roleBadge = getRoleBadge(teacher?.role || 'JTE');

                  return (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date */}
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                        {l.date}
                      </td>

                      {/* Time & Period */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                        {l.period && <span className="font-bold text-slate-900 mr-1">{l.period}限</span>}
                        <span>{l.startTime}</span>
                        <span className="text-[10px] text-slate-400 block">{l.durationMinutes} min</span>
                      </td>

                      {/* School */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${color.badgeBg} ${color.badgeText} ${color.badgeBorder}`}>
                          {school?.name || 'School'}
                        </span>
                      </td>

                      {/* Grade & Class */}
                      <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {cls ? `${cls.gradeLevel} ${cls.classIdentifier}` : '-'}
                      </td>

                      {/* Co-Teacher */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-medium text-slate-800">{teacher?.name || '-'}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${roleBadge.bg} ${roleBadge.text}`}>
                            {roleBadge.label}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {l.completed ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Done</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-medium">Scheduled</span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-3 text-slate-600 text-xs leading-relaxed">
                        {l.notes || <span className="text-slate-300 italic">No notes</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
