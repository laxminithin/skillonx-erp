export const EXAM_TYPES = [
    'CIE',
    'SEE',
    'SUPPLEMENTARY',
    'MAKEUP',
    'IMPROVEMENT',
    'PRACTICAL',
    'VIVA',
    'PROJECT',
];
export const EXAM_STATUSES = [
    'DRAFT',
    'SCHEDULED',
    'ONGOING',
    'COMPLETED',
    'RESULT_PROCESSING',
    'RESULT_PUBLISHED',
    'CANCELLED',
];
export const ELIGIBILITY_STATUSES = ['ELIGIBLE', 'NOT_ELIGIBLE', 'CONDONED', 'WITHHELD'];
export const MARK_STATUSES = ['PRESENT', 'ABSENT', 'MALPRACTICE', 'WITHHELD'];
export const MARKS_SHEET_STATUSES = ['DRAFT', 'SUBMITTED', 'VERIFIED', 'LOCKED', 'RELEASED'];
export const INVIGILATION_ROLES = ['CHIEF', 'INVIGILATOR', 'RELIEVER', 'SQUAD', 'OTHER'];
export const RESULT_STATUSES = ['PASS', 'FAIL', 'WITHHELD', 'INCOMPLETE'];
export const SUBJECT_RESULT_STATUSES = ['PASS', 'FAIL', 'ABSENT', 'WITHHELD', 'MALPRACTICE', 'INCOMPLETE'];
export const REVALUATION_TYPES = ['RETOTALING', 'REVALUATION', 'PHOTOCOPY'];
export const REVALUATION_STATUSES = ['REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED'];
export const MARKS_SOURCES = ['INSTITUTION', 'UNIVERSITY_IMPORT', 'MANUAL_VERIFIED'];
export const DEFAULT_GRADE_BANDS = [
    { min: 90, max: 100, grade: 'O', gradePoints: 10 },
    { min: 80, max: 89.99, grade: 'A+', gradePoints: 9 },
    { min: 70, max: 79.99, grade: 'A', gradePoints: 8 },
    { min: 60, max: 69.99, grade: 'B+', gradePoints: 7 },
    { min: 55, max: 59.99, grade: 'B', gradePoints: 6 },
    { min: 50, max: 54.99, grade: 'C', gradePoints: 5 },
    { min: 40, max: 49.99, grade: 'P', gradePoints: 4 },
    { min: 0, max: 39.99, grade: 'F', gradePoints: 0 },
];
export const EXAM_PERMISSIONS = [
    'exam.create',
    'exam.schedule',
    'exam.eligibility',
    'exam.rooms',
    'exam.invigilation',
    'exam.marks.verify',
    'exam.result.process',
    'exam.result.publish',
];
