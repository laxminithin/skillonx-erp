export const ROOM_TYPES = ['CLASSROOM', 'LAB', 'SEMINAR_HALL', 'AUDITORIUM', 'OTHER'] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

export const PERIOD_KINDS = ['PERIOD', 'BREAK', 'LUNCH'] as const;
export type PeriodKind = (typeof PERIOD_KINDS)[number];

export const CALENDAR_EVENT_TYPES = [
  'SEMESTER_START',
  'SEMESTER_END',
  'WORKING_DAY',
  'HOLIDAY',
  'CIE',
  'SEE',
  'EVENT',
  'VACATION',
  'REGISTRATION',
  'RESULT',
] as const;
export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number];

export const OVERRIDE_KINDS = [
  'CANCELLED',
  'ROOM_CHANGE',
  'SUBSTITUTION',
  'EXTRA',
  'MAKEUP',
  'SPECIAL',
] as const;
export type OverrideKind = (typeof OVERRIDE_KINDS)[number];

export const OCCURRENCE_STATES = [
  'SCHEDULED',
  'HOLIDAY',
  'CANCELLED',
  'SUBSTITUTED',
  'ROOM_CHANGED',
  'EXTRA',
  'MAKEUP',
  'SPECIAL',
] as const;
export type OccurrenceState = (typeof OCCURRENCE_STATES)[number];

export const BLOCKING_EVENT_TYPES = new Set<string>(['HOLIDAY', 'VACATION']);

export const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const GRID_DAYS = [1, 2, 3, 4, 5, 6] as const;

export const DEFAULT_PERIODS = [
  { name: 'Period 1', periodNumber: 1, startTime: '09:00', endTime: '09:55', kind: 'PERIOD' as const, sortOrder: 1 },
  { name: 'Period 2', periodNumber: 2, startTime: '09:55', endTime: '10:50', kind: 'PERIOD' as const, sortOrder: 2 },
  { name: 'Break', periodNumber: null, startTime: '10:50', endTime: '11:05', kind: 'BREAK' as const, sortOrder: 3 },
  { name: 'Period 3', periodNumber: 3, startTime: '11:05', endTime: '12:00', kind: 'PERIOD' as const, sortOrder: 4 },
  { name: 'Period 4', periodNumber: 4, startTime: '12:00', endTime: '12:55', kind: 'PERIOD' as const, sortOrder: 5 },
  { name: 'Lunch', periodNumber: null, startTime: '12:55', endTime: '13:45', kind: 'LUNCH' as const, sortOrder: 6 },
  { name: 'Period 5', periodNumber: 5, startTime: '13:45', endTime: '14:40', kind: 'PERIOD' as const, sortOrder: 7 },
  { name: 'Period 6', periodNumber: 6, startTime: '14:40', endTime: '15:35', kind: 'PERIOD' as const, sortOrder: 8 },
  { name: 'Period 7', periodNumber: 7, startTime: '15:35', endTime: '16:30', kind: 'PERIOD' as const, sortOrder: 9 },
];

export type ConflictKind = 'FACULTY' | 'CLASS' | 'ROOM';

export type ConflictHit = {
  kind: ConflictKind;
  message: string;
  slotId?: number | null;
  overrideId?: number | null;
  academicClassId?: number | null;
  className?: string | null;
  facultyId?: number | null;
  facultyName?: string | null;
  roomId?: number | null;
  roomName?: string | null;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
};

export type FacultyRef = {
  facultyId: number;
  name: string;
  isPrimary: boolean;
};

export type Occurrence = {
  id: string;
  date: string;
  dayOfWeek: number;
  dayLabel: string;
  state: OccurrenceState;
  holidayLabel: string | null;
  slotId: number | null;
  overrideId: number | null;
  academicClassId: number;
  className: string;
  classCode: string;
  classSubjectId: number | null;
  courseId: number | null;
  courseCode: string | null;
  courseName: string | null;
  faculty: FacultyRef[];
  originalFaculty: FacultyRef[];
  roomId: number | null;
  roomName: string | null;
  roomCode: string | null;
  startPeriodNumber: number | null;
  endPeriodNumber: number | null;
  startTime: string;
  endTime: string;
  hours: number;
  batchId: number | null;
  batchName: string | null;
  reason: string | null;
  attendanceExpected: boolean;
  attendanceSessionId: number | null;
  attendanceStatus: 'NOT_TAKEN' | 'DRAFT' | 'OPEN' | 'COMPLETED' | 'NOT_EXPECTED';
  plannedTopic: { entryId: number; topicId: number | null; topicName: string } | null;
  isSubstitution?: boolean;
  coveringForFacultyName?: string | null;
};

export type PeriodRow = {
  id: number;
  collegeId: number;
  academicYearId: number | null;
  name: string;
  periodNumber: number | null;
  startTime: string;
  endTime: string;
  kind: PeriodKind;
  sortOrder: number;
  isActive: boolean;
};
