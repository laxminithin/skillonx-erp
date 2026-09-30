export const EXAM_TYPES = [
    'CIE',
    'INTERNAL',
    'LAB',
    'SEE',
    'SUPPLEMENTARY',
    'MAKEUP',
    'BACKLOG',
    'IMPROVEMENT',
    'PRACTICAL',
    'VIVA',
    'PROJECT',
];
export const EXAM_STATUSES = [
    'DRAFT',
    'PLANNING',
    'REGISTRATION',
    'READY',
    'SCHEDULED',
    'IN_PROGRESS',
    'ONGOING',
    'VALUATION',
    'COMPLETED',
    'RESULT_PROCESSING',
    'PUBLISHED',
    'RESULT_PUBLISHED',
    'CLOSED',
    'ARCHIVED',
    'CANCELLED',
];
export const ELIGIBILITY_STATUSES = ['ELIGIBLE', 'NOT_ELIGIBLE', 'CONDITIONALLY_ELIGIBLE', 'CONDONED', 'WITHHELD'];
export const MARK_STATUSES = ['PRESENT', 'ABSENT', 'MALPRACTICE', 'MPC', 'WITHHELD', 'SPECIAL_PERMISSION'];
export const MARKS_SHEET_STATUSES = ['DRAFT', 'SUBMITTED', 'VERIFIED', 'LOCKED', 'RELEASED'];
export const INVIGILATION_ROLES = [
    'CONTROLLER_OF_EXAMINATIONS',
    'CHIEF_SUPERINTENDENT',
    'DEPUTY_CHIEF_SUPERINTENDENT_INTERNAL',
    'DEPUTY_CHIEF_SUPERINTENDENT_EXTERNAL',
    'EXAM_COORDINATOR',
    'ROOM_SUPERINTENDENT',
    'RELIEVING_SUPERINTENDENT',
    'SQUAD_MEMBER',
    'SQUAD_CHAIRMAN',
    'OBSERVER',
    'INTERNAL_EXAMINER',
    'EXTERNAL_EXAMINER',
    'VALUER',
    'MODERATOR',
    'SCRUTINIZER',
    'QUESTION_PAPER_SETTER',
    'SUPPORT_STAFF',
    'CHIEF',
    'INVIGILATOR',
    'RELIEVER',
    'SQUAD',
    'OTHER',
];
export const RESULT_STATUSES = ['PASS', 'FAIL', 'WITHHELD', 'MPC', 'ABSENT', 'INCOMPLETE'];
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
    'exam.registration',
    'exam.rooms',
    'exam.invigilation',
    'exam.questionPapers',
    'exam.attendance',
    'exam.malpractice',
    'exam.custody',
    'exam.valuation',
    'exam.marks.verify',
    'exam.result.process',
    'exam.result.publish',
    'exam.documents',
    'exam.finance',
    'exam.reports',
];
export const EXAMINATION_GOVERNANCE_TYPES = ['VTU_AFFILIATED', 'AUTONOMOUS'];
export const EXAMINATION_CAPABILITY_OWNERSHIPS = ['INSTITUTIONAL', 'UNIVERSITY', 'SHARED', 'OPTIONAL'];
