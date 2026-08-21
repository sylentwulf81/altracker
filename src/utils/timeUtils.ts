export interface LessonLiveStatus {
  status: 'now' | 'starting_soon' | 'starting_later' | 'finished' | 'future_date' | 'past_date';
  label: string;
  badgeColor: {
    bg: string;
    text: string;
    border: string;
    dot?: string;
    pulse?: boolean;
  };
  minutesToStart?: number;
  minutesRemaining?: number;
}

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLessonLiveStatus(
  lessonDateStr: string,
  startTimeStr: string,
  durationMinutes: number = 45,
  isCompleted: boolean = false,
  now: Date = new Date()
): LessonLiveStatus {
  const todayStr = getLocalDateString(now);

  if (lessonDateStr < todayStr) {
    return {
      status: 'past_date',
      label: isCompleted ? 'Completed' : 'Past date',
      badgeColor: {
        bg: 'bg-slate-100',
        text: 'text-slate-500',
        border: 'border-slate-200',
      },
    };
  }

  if (lessonDateStr > todayStr) {
    return {
      status: 'future_date',
      label: 'Scheduled',
      badgeColor: {
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200',
      },
    };
  }

  // Today! Calculate exact minutes
  const [startH, startM] = startTimeStr.split(':').map(Number);
  if (isNaN(startH) || isNaN(startM)) {
    return {
      status: 'today_later',
      label: startTimeStr,
      badgeColor: {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
      },
    } as any;
  }

  const startTimestamp = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    startH,
    startM,
    0,
    0
  ).getTime();

  const endTimestamp = startTimestamp + durationMinutes * 60 * 1000;
  const nowMs = now.getTime();

  const diffStartMinutes = Math.round((startTimestamp - nowMs) / 60000);
  const diffEndMinutes = Math.round((endTimestamp - nowMs) / 60000);

  // 1. In Session / Happening NOW
  if (nowMs >= startTimestamp && nowMs <= endTimestamp) {
    return {
      status: 'now',
      label: diffEndMinutes <= 1 ? 'Finishing now' : `NOW · ${diffEndMinutes}m left`,
      badgeColor: {
        bg: 'bg-emerald-500 text-white',
        text: 'text-white',
        border: 'border-emerald-600 ring-2 ring-emerald-300/60',
        dot: 'bg-white',
        pulse: true,
      },
      minutesRemaining: diffEndMinutes,
    };
  }

  // 2. Starting within next 15 minutes
  if (diffStartMinutes > 0 && diffStartMinutes <= 15) {
    const label = diffStartMinutes === 1 ? 'In 1 minute!' : `In ${diffStartMinutes} mins`;
    return {
      status: 'starting_soon',
      label,
      badgeColor: {
        bg: 'bg-amber-500 text-white',
        text: 'text-white',
        border: 'border-amber-600 ring-2 ring-amber-300/50',
        dot: 'bg-white',
        pulse: true,
      },
      minutesToStart: diffStartMinutes,
    };
  }

  // 3. Starting within 16 - 60 minutes
  if (diffStartMinutes > 15 && diffStartMinutes <= 60) {
    return {
      status: 'starting_soon',
      label: `In ${diffStartMinutes}m`,
      badgeColor: {
        bg: 'bg-sky-100',
        text: 'text-sky-800 font-bold',
        border: 'border-sky-300',
        dot: 'bg-sky-600',
      },
      minutesToStart: diffStartMinutes,
    };
  }

  // 4. Starting later today (> 60 minutes)
  if (diffStartMinutes > 60) {
    const hours = Math.floor(diffStartMinutes / 60);
    const mins = diffStartMinutes % 60;
    const label = mins > 0 ? `In ${hours}h ${mins}m` : `In ${hours}h`;
    return {
      status: 'starting_later',
      label,
      badgeColor: {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
      },
      minutesToStart: diffStartMinutes,
    };
  }

  // 5. Already finished today
  const finishedAgo = Math.abs(diffEndMinutes);
  return {
    status: 'finished',
    label: isCompleted
      ? 'Completed'
      : finishedAgo < 60
      ? `Ended ${finishedAgo}m ago`
      : 'Ended earlier',
    badgeColor: {
      bg: isCompleted ? 'bg-emerald-50' : 'bg-slate-100',
      text: isCompleted ? 'text-emerald-700' : 'text-slate-500',
      border: isCompleted ? 'border-emerald-200' : 'border-slate-200',
    },
  };
}
