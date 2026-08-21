export interface ColorOption {
  key: string;
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBorder: string;
  pillBg: string;
  dot: string;
  hex: string;
}

export const SCHOOL_COLORS: Record<string, ColorOption> = {
  emerald: {
    key: 'emerald',
    name: 'Emerald (緑)',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    cardBorder: 'border-l-emerald-500',
    pillBg: 'bg-emerald-500',
    dot: 'bg-emerald-500',
    hex: '#059669',
  },
  sky: {
    key: 'sky',
    name: 'Sky Blue (空色)',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-200',
    cardBorder: 'border-l-sky-500',
    pillBg: 'bg-sky-500',
    dot: 'bg-sky-500',
    hex: '#0284c7',
  },
  indigo: {
    key: 'indigo',
    name: 'Indigo (藍色)',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    cardBorder: 'border-l-indigo-500',
    pillBg: 'bg-indigo-500',
    dot: 'bg-indigo-500',
    hex: '#4f46e5',
  },
  rose: {
    key: 'rose',
    name: 'Rose (桜色)',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    cardBorder: 'border-l-rose-500',
    pillBg: 'bg-rose-500',
    dot: 'bg-rose-500',
    hex: '#e11d48',
  },
  amber: {
    key: 'amber',
    name: 'Amber (琥珀)',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    cardBorder: 'border-l-amber-500',
    pillBg: 'bg-amber-500',
    dot: 'bg-amber-500',
    hex: '#d97706',
  },
  violet: {
    key: 'violet',
    name: 'Violet (紫)',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-700',
    badgeBorder: 'border-violet-200',
    cardBorder: 'border-l-violet-500',
    pillBg: 'bg-violet-500',
    dot: 'bg-violet-500',
    hex: '#7c3aed',
  },
  teal: {
    key: 'teal',
    name: 'Teal (青緑)',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700',
    badgeBorder: 'border-teal-200',
    cardBorder: 'border-l-teal-500',
    pillBg: 'bg-teal-500',
    dot: 'bg-teal-500',
    hex: '#0d9488',
  },
  orange: {
    key: 'orange',
    name: 'Orange (橙)',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-800',
    badgeBorder: 'border-orange-200',
    cardBorder: 'border-l-orange-500',
    pillBg: 'bg-orange-500',
    dot: 'bg-orange-500',
    hex: '#ea580c',
  },
};

export function getSchoolColor(colorKey?: string): ColorOption {
  if (colorKey && SCHOOL_COLORS[colorKey]) {
    return SCHOOL_COLORS[colorKey];
  }
  return SCHOOL_COLORS.sky;
}

export function getDefaultDurationForSchoolType(type: 'Elementary' | 'Junior High' | 'High School'): number {
  switch (type) {
    case 'Elementary':
      return 45;
    case 'Junior High':
    case 'High School':
    default:
      return 50;
  }
}

export function getRoleBadge(role: 'HRT' | 'JTE' | 'Other'): { label: string; jp: string; bg: string; text: string } {
  switch (role) {
    case 'JTE':
      return {
        label: 'JTE',
        jp: '英語科',
        bg: 'bg-blue-100',
        text: 'text-blue-800',
      };
    case 'HRT':
      return {
        label: 'HRT',
        jp: '担任',
        bg: 'bg-amber-100',
        text: 'text-amber-800',
      };
    case 'Other':
    default:
      return {
        label: 'Other',
        jp: '担当',
        bg: 'bg-slate-100',
        text: 'text-slate-700',
      };
  }
}
