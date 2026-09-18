export const LESSON_PLAN_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'];
export const LESSON_ENTRY_STATUSES = ['PLANNED', 'COMPLETED', 'RESCHEDULED', 'SKIPPED'];
export const LESSON_CLASSIFICATIONS = ['CORE', 'SUPPLEMENTARY'];
export const HOURS_SOURCES = ['SOURCE', 'ESTIMATED'];
export const CALENDAR_EXCEPTION_TYPES = ['HOLIDAY', 'EXAM', 'BLOCKED', 'NON_TEACHING'];
export const UNIT_KINDS = ['MODULE', 'UNIT'];
export const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export function normalizeLessonText(value) {
    return value
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
export function fingerprintParts(...parts) {
    return parts
        .map((p) => normalizeLessonText(String(p ?? '')))
        .filter(Boolean)
        .join('|');
}
