import { jsPDF } from 'jspdf';
import { Lesson, School, Teacher, ClassRoster } from '../types';

export interface ReportSummary {
  totalLessons: number;
  completedLessons: number;
  totalHours: number;
  schoolCounts: { [schoolName: string]: number };
}

export function calculateSummary(
  lessons: Lesson[],
  schools: School[]
): ReportSummary {
  const schoolMap = new Map(schools.map((s) => [s.id, s.name]));
  let totalMinutes = 0;
  let completed = 0;
  const schoolCounts: { [schoolName: string]: number } = {};

  lessons.forEach((l) => {
    totalMinutes += l.durationMinutes || 45;
    if (l.completed) completed++;
    const sName = schoolMap.get(l.schoolId) || 'Unknown School';
    schoolCounts[sName] = (schoolCounts[sName] || 0) + 1;
  });

  return {
    totalLessons: lessons.length,
    completedLessons: completed,
    totalHours: Number((totalMinutes / 60).toFixed(1)),
    schoolCounts,
  };
}

export function exportToCSV(
  lessons: Lesson[],
  schools: School[],
  teachers: Teacher[],
  classes: ClassRoster[]
): void {
  const schoolMap = new Map(schools.map((s) => [s.id, s]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const classMap = new Map(classes.map((c) => [c.id, c]));

  // CSV Headers
  const headers = [
    'Date (日付)',
    'Start Time (開始時間)',
    'Duration (min/分)',
    'Period (時限)',
    'School (学校名)',
    'School Type (校種)',
    'Grade & Class (学年・組)',
    'Co-Teacher (担当教員)',
    'Role (役割)',
    'Status (完了状態)',
    'Lesson Notes & Activity Summary (授業内容・指導案メモ)',
  ];

  const rows = lessons.map((l) => {
    const school = schoolMap.get(l.schoolId);
    const teacher = teacherMap.get(l.teacherId);
    const cls = classMap.get(l.classRosterId);

    const periodStr = l.period ? `${l.period}限` : '-';
    const statusStr = l.completed ? 'Completed (実施済)' : 'Scheduled (予定)';
    const cleanNotes = (l.notes || '').replace(/"/g, '""');

    return [
      `"${l.date}"`,
      `"${l.startTime}"`,
      `"${l.durationMinutes}"`,
      `"${periodStr}"`,
      `"${school ? (school.nameJp ? `${school.name} (${school.nameJp})` : school.name) : 'N/A'}"`,
      `"${school?.type || 'N/A'}"`,
      `"${cls ? `${cls.gradeLevel} ${cls.classIdentifier}` : 'N/A'}"`,
      `"${teacher ? teacher.name : 'N/A'}"`,
      `"${teacher?.role || 'N/A'}"`,
      `"${statusStr}"`,
      `"${cleanNotes}"`,
    ].join(',');
  });

  // UTF-8 BOM so Japanese Kanji displays correctly in Microsoft Excel
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `ALT_Lesson_Report_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateFormattedText(
  lessons: Lesson[],
  schools: School[],
  teachers: Teacher[],
  classes: ClassRoster[],
  format: 'line' | 'markdown' | 'email',
  dateRangeLabel: string
): string {
  const schoolMap = new Map(schools.map((s) => [s.id, s]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const classMap = new Map(classes.map((c) => [c.id, c]));

  const summary = calculateSummary(lessons, schools);

  // Group lessons by date
  const groupedByDate: { [date: string]: Lesson[] } = {};
  lessons.forEach((l) => {
    if (!groupedByDate[l.date]) groupedByDate[l.date] = [];
    groupedByDate[l.date].push(l);
  });

  const sortedDates = Object.keys(groupedByDate).sort();

  if (format === 'markdown') {
    let md = `# 📋 ALT Dispatch Lesson Report / 外国語指導業務報告書\n`;
    md += `**Period / 期間:** ${dateRangeLabel}\n`;
    md += `**Total Lessons / 総授業数:** ${summary.totalLessons} classes (${summary.totalHours} hrs)\n`;
    md += `**Status:** ${summary.completedLessons}/${summary.totalLessons} completed\n\n`;
    md += `### School Breakdown / 学校別集計\n`;
    Object.entries(summary.schoolCounts).forEach(([name, count]) => {
      md += `- **${name}**: ${count} classes\n`;
    });
    md += `\n---\n\n### 📅 Detailed Daily Log / 詳細記録\n\n`;

    sortedDates.forEach((date) => {
      md += `#### 🗓️ ${date}\n`;
      groupedByDate[date].forEach((l) => {
        const school = schoolMap.get(l.schoolId);
        const teacher = teacherMap.get(l.teacherId);
        const cls = classMap.get(l.classRosterId);
        const periodStr = l.period ? `[Period ${l.period}] ` : '';
        const check = l.completed ? '✅' : '⏳';

        md += `- ${check} **${l.startTime}** (${l.durationMinutes}m) | ${periodStr}**${school?.name || 'School'}** - ${cls?.gradeLevel} ${cls?.classIdentifier}\n`;
        md += `  - *Co-Teacher:* ${teacher?.name || 'N/A'} (${teacher?.role || 'JTE/HRT'})\n`;
        if (l.notes) {
          md += `  - *Notes:* ${l.notes}\n`;
        }
      });
      md += `\n`;
    });

    return md;
  }

  if (format === 'line') {
    // Compact, emoji-friendly text for LINE / Slack quick dispatch reporting
    let text = `【ALT 業務日報・レッスン報告】\n`;
    text += `期間: ${dateRangeLabel}\n`;
    text += `総授業コマ数: ${summary.totalLessons}コマ (計 ${summary.totalHours}時間)\n`;
    text += `実施済: ${summary.completedLessons}コマ\n`;
    text += `────────────\n`;

    sortedDates.forEach((date) => {
      text += `\n📅 ${date}\n`;
      groupedByDate[date].forEach((l) => {
        const school = schoolMap.get(l.schoolId);
        const teacher = teacherMap.get(l.teacherId);
        const cls = classMap.get(l.classRosterId);
        const p = l.period ? `【${l.period}限】` : '';
        const status = l.completed ? '●' : '○';

        text += `${status} ${p}${l.startTime} ${school?.name?.split(' ')[0] || ''} | ${cls?.gradeLevel} ${cls?.classIdentifier} (${teacher?.name || ''})\n`;
        if (l.notes) {
          text += `   📝 ${l.notes}\n`;
        }
      });
    });

    text += `\n────────────\nお疲れ様でした。`;
    return text;
  }

  // Standard Email template
  let email = `Subject: ALT Dispatch Monthly/Weekly Lesson Log - ${dateRangeLabel}\n\n`;
  email += `Dear Dispatch Coordinator / Board of Education Supervisor,\n\n`;
  email += `Please find the teaching activity report for the period: ${dateRangeLabel}.\n\n`;
  email += `SUMMARY:\n`;
  email += `- Total Classes Taught: ${summary.totalLessons} (${summary.totalHours} contact hours)\n`;
  email += `- Completed / Conducted: ${summary.completedLessons}\n\n`;
  email += `SCHOOL BREAKDOWN:\n`;
  Object.entries(summary.schoolCounts).forEach(([name, count]) => {
    email += `* ${name}: ${count} classes\n`;
  });
  email += `\nDAILY LOG BREAKDOWN:\n`;

  sortedDates.forEach((date) => {
    email += `\n[ ${date} ]\n`;
    groupedByDate[date].forEach((l) => {
      const school = schoolMap.get(l.schoolId);
      const teacher = teacherMap.get(l.teacherId);
      const cls = classMap.get(l.classRosterId);
      const p = l.period ? `P${l.period} ` : '';
      email += `  * ${l.startTime} (${l.durationMinutes} min) - ${p}${school?.name} | ${cls?.gradeLevel} ${cls?.classIdentifier} | T: ${teacher?.name} (${teacher?.role})\n`;
      if (l.notes) {
        email += `    Notes: ${l.notes}\n`;
      }
    });
  });

  email += `\nSubmitted by ALT.\nThank you very much.`;
  return email;
}

export function generatePDFReport(
  lessons: Lesson[],
  schools: School[],
  teachers: Teacher[],
  classes: ClassRoster[],
  dateRangeLabel: string,
  schoolFilterName: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const schoolMap = new Map(schools.map((s) => [s.id, s]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const summary = calculateSummary(lessons, schools);

  // Colors
  const primaryColor = [2, 132, 199]; // Sky 600
  const darkTextColor = [30, 41, 59]; // Slate 800
  const mutedTextColor = [100, 116, 139]; // Slate 500
  const lightBg = [241, 245, 249]; // Slate 100

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ALT DISPATCH LESSON REPORT', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Teaching Activity Record & BOE Submission', 14, 18);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 196, 18, { align: 'right' });

  // Metadata Box
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORT DETAILS', 14, 34);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date Range: ${dateRangeLabel}`, 14, 40);
  doc.text(`School Scope: ${schoolFilterName}`, 14, 45);
  doc.text(`Total Lessons: ${summary.totalLessons} classes (${summary.totalHours} hrs)`, 110, 40);
  doc.text(`Status: ${summary.completedLessons} completed / ${summary.totalLessons - summary.completedLessons} pending`, 110, 45);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, 49, 196, 49);

  // Table Column Definitions
  const startY = 55;
  let currentY = startY;
  const colX = {
    date: 14,
    time: 38,
    school: 62,
    gradeClass: 104,
    teacher: 140,
    status: 174,
  };

  // Table Header
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, currentY, 182, 8, 1, 1, 'F');

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Date', colX.date + 2, currentY + 5.5);
  doc.text('Time/Period', colX.time + 2, currentY + 5.5);
  doc.text('School', colX.school + 2, currentY + 5.5);
  doc.text('Grade & Class', colX.gradeClass + 2, currentY + 5.5);
  doc.text('Co-Teacher', colX.teacher + 2, currentY + 5.5);
  doc.text('Status', colX.status + 2, currentY + 5.5);

  currentY += 10;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  lessons.forEach((l) => {
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
      // Repeat mini header
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.roundedRect(14, currentY, 182, 8, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Date', colX.date + 2, currentY + 5.5);
      doc.text('Time/Period', colX.time + 2, currentY + 5.5);
      doc.text('School', colX.school + 2, currentY + 5.5);
      doc.text('Grade & Class', colX.gradeClass + 2, currentY + 5.5);
      doc.text('Co-Teacher', colX.teacher + 2, currentY + 5.5);
      doc.text('Status', colX.status + 2, currentY + 5.5);
      currentY += 10;
      doc.setFont('helvetica', 'normal');
    }

    const school = schoolMap.get(l.schoolId);
    const teacher = teacherMap.get(l.teacherId);
    const cls = classMap.get(l.classRosterId);

    const periodStr = l.period ? `P${l.period} ` : '';
    const schoolName = (school?.name || 'School').slice(0, 20);
    const classInfo = cls ? `${cls.gradeLevel} ${cls.classIdentifier}`.slice(0, 18) : '-';
    const teacherInfo = teacher ? `${teacher.name} (${teacher.role})`.slice(0, 16) : '-';
    const statusText = l.completed ? 'Completed' : 'Scheduled';

    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(l.date, colX.date + 2, currentY);
    doc.text(`${periodStr}${l.startTime} (${l.durationMinutes}m)`, colX.time + 2, currentY);
    doc.text(schoolName, colX.school + 2, currentY);
    doc.text(classInfo, colX.gradeClass + 2, currentY);
    doc.text(teacherInfo, colX.teacher + 2, currentY);

    if (l.completed) {
      doc.setTextColor(5, 150, 105); // Green
    } else {
      doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    }
    doc.text(statusText, colX.status + 2, currentY);

    // Notes line if present
    if (l.notes) {
      currentY += 4;
      doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
      doc.setFontSize(7);
      const splitNotes = doc.splitTextToSize(`Notes: ${l.notes}`, 176);
      doc.text(splitNotes, colX.date + 4, currentY);
      currentY += (splitNotes.length * 3.5);
      doc.setFontSize(8);
    } else {
      currentY += 5.5;
    }

    // Light line divider between rows
    doc.setDrawColor(241, 245, 249);
    doc.line(14, currentY, 196, currentY);
    currentY += 2;
  });

  // Signature Block at Bottom
  if (currentY > 240) {
    doc.addPage();
    currentY = 30;
  } else {
    currentY = Math.max(currentY + 10, 245);
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentY, 80, currentY);
  doc.line(130, currentY, 196, currentY);

  doc.setFontSize(8);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('ALT Signature / 外国語指導助手 署名', 14, currentY + 5);
  doc.text('Supervisor / JTE Confirmation / 担当印', 130, currentY + 5);

  const timestamp = new Date().toISOString().slice(0, 10);
  doc.save(`ALT_Dispatch_Report_${timestamp}.pdf`);
}

export async function shareContent(title: string, text: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
      });
      return true;
    } catch {
      // Fallback
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return false; // Copied to clipboard
  } catch {
    return false;
  }
}
