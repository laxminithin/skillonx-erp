export const ROOM_TYPES = ['CLASSROOM', 'LAB', 'SEMINAR_HALL', 'AUDITORIUM', 'OTHER'];
export const PERIOD_KINDS = ['PERIOD', 'BREAK', 'LUNCH'];
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
];
export const OVERRIDE_KINDS = [
    'CANCELLED',
    'ROOM_CHANGE',
    'SUBSTITUTION',
    'EXTRA',
    'MAKEUP',
    'SPECIAL',
];
export const OCCURRENCE_STATES = [
    'SCHEDULED',
    'HOLIDAY',
    'CANCELLED',
    'SUBSTITUTED',
    'ROOM_CHANGED',
    'EXTRA',
    'MAKEUP',
    'SPECIAL',
];
export const BLOCKING_EVENT_TYPES = new Set(['HOLIDAY', 'VACATION']);
export const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const GRID_DAYS = [1, 2, 3, 4, 5, 6];
export const DEFAULT_PERIODS = [
    { name: 'Period 1', periodNumber: 1, startTime: '09:00', endTime: '09:55', kind: 'PERIOD', sortOrder: 1 },
    { name: 'Period 2', periodNumber: 2, startTime: '09:55', endTime: '10:50', kind: 'PERIOD', sortOrder: 2 },
    { name: 'Break', periodNumber: null, startTime: '10:50', endTime: '11:05', kind: 'BREAK', sortOrder: 3 },
    { name: 'Period 3', periodNumber: 3, startTime: '11:05', endTime: '12:00', kind: 'PERIOD', sortOrder: 4 },
    { name: 'Period 4', periodNumber: 4, startTime: '12:00', endTime: '12:55', kind: 'PERIOD', sortOrder: 5 },
    { name: 'Lunch', periodNumber: null, startTime: '12:55', endTime: '13:45', kind: 'LUNCH', sortOrder: 6 },
    { name: 'Period 5', periodNumber: 5, startTime: '13:45', endTime: '14:40', kind: 'PERIOD', sortOrder: 7 },
    { name: 'Period 6', periodNumber: 6, startTime: '14:40', endTime: '15:35', kind: 'PERIOD', sortOrder: 8 },
    { name: 'Period 7', periodNumber: 7, startTime: '15:35', endTime: '16:30', kind: 'PERIOD', sortOrder: 9 },
];
