export const LESSON_PLAN_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;
export type LessonPlanStatus = (typeof LESSON_PLAN_STATUSES)[number];

export const LESSON_ENTRY_STATUSES = ['PLANNED', 'COMPLETED', 'RESCHEDULED', 'SKIPPED'] as const;
export type LessonEntryStatus = (typeof LESSON_ENTRY_STATUSES)[number];

export const LESSON_CLASSIFICATIONS = ['CORE', 'SUPPLEMENTARY'] as const;
export type LessonClassification = (typeof LESSON_CLASSIFICATIONS)[number];

export const HOURS_SOURCES = ['SOURCE', 'ESTIMATED'] as const;
export type HoursSource = (typeof HOURS_SOURCES)[number];

export const CALENDAR_EXCEPTION_TYPES = ['HOLIDAY', 'EXAM', 'BLOCKED', 'NON_TEACHING'] as const;
export type CalendarExceptionType = (typeof CALENDAR_EXCEPTION_TYPES)[number];

export const UNIT_KINDS = ['MODULE', 'UNIT'] as const;
export type UnitKind = (typeof UNIT_KINDS)[number];

export const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export function normalizeLessonText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function fingerprintParts(...parts: Array<string | number | null | undefined>) {
  return parts
    .map((p) => normalizeLessonText(String(p ?? '')))
    .filter(Boolean)
    .join('|');
}
