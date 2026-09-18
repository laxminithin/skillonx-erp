export const SURVEY_TYPES = [
    'FACULTY_FEEDBACK',
    'COURSE_END',
    'SEMESTER_END',
    'SUBJECT_FEEDBACK',
    'LABORATORY',
    'TRAINING',
    'EVENT',
    'PLACEMENT_TRAINING',
    'INFRASTRUCTURE',
    'CUSTOM',
];
export const SURVEY_STATUSES = ['DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED'];
export const RESPONSE_POLICIES = ['ONE_PER_STUDENT', 'MULTIPLE', 'ONE_PER_CYCLE'];
export const IDENTITY_MODES = ['IDENTIFIED', 'ANONYMOUS'];
export const QUESTION_TYPES = [
    'STAR_RATING',
    'SMILE_RATING',
    'NUMERICAL',
    'LIKERT',
    'MULTIPLE_CHOICE',
    'CHECKBOX',
    'YES_NO',
    'SHORT_ANSWER',
    'LONG_ANSWER',
    'DROPDOWN',
    // legacy alias kept for older rows
    'RATING',
];
export const SUBMISSION_STATUSES = ['STARTED', 'COMPLETED', 'ABANDONED'];
export const FACULTY_ROLES = [
    'FACULTY',
    'ACCOUNTANT',
    'ADMISSIONS_OFFICER',
    'ADMISSIONS_MANAGER',
    'COE',
    'OFFICE_ADMIN',
    'OFFICE_SUPERINTENDENT',
    'HOD',
    'PRINCIPAL',
    'MANAGEMENT',
    'CHAIRMAN',
    'IQAC_COORDINATOR',
    'NBA_COORDINATOR',
    'COLLEGE_ADMIN',
    'SUPER_ADMIN',
];
export const SURVEY_TYPE_LABELS = {
    FACULTY_FEEDBACK: 'Faculty Feedback',
    COURSE_END: 'Course End Survey',
    SEMESTER_END: 'Semester End Survey',
    SUBJECT_FEEDBACK: 'Subject Feedback',
    LABORATORY: 'Laboratory Feedback',
    TRAINING: 'Training Feedback',
    EVENT: 'Event Feedback',
    PLACEMENT_TRAINING: 'Placement Training Survey',
    INFRASTRUCTURE: 'Infrastructure Survey',
    CUSTOM: 'Custom Survey',
};
export const QUESTION_TYPE_LABELS = {
    STAR_RATING: 'Star Rating',
    SMILE_RATING: 'Smile / Emoji Rating',
    NUMERICAL: 'Numeric Rating',
    LIKERT: 'Likert Scale',
    MULTIPLE_CHOICE: 'Single Choice',
    CHECKBOX: 'Multiple Choice',
    YES_NO: 'Yes / No',
    SHORT_ANSWER: 'Short Text',
    LONG_ANSWER: 'Long Text / Comments',
    DROPDOWN: 'Dropdown',
    RATING: 'Star Rating',
};
export const LIKERT_DEFAULT_OPTIONS = [
    { label: 'Strongly Disagree', value: 1 },
    { label: 'Disagree', value: 2 },
    { label: 'Neutral', value: 3 },
    { label: 'Agree', value: 4 },
    { label: 'Strongly Agree', value: 5 },
];
export const SMILE_DEFAULT_OPTIONS = [
    { label: 'Very Dissatisfied', value: 1, emoji: '😞' },
    { label: 'Dissatisfied', value: 2, emoji: '🙁' },
    { label: 'Neutral', value: 3, emoji: '😐' },
    { label: 'Satisfied', value: 4, emoji: '🙂' },
    { label: 'Very Satisfied', value: 5, emoji: '😄' },
];
export const STAR_DEFAULT_LABELS = {
    1: 'Very Poor',
    2: 'Poor',
    3: 'Average',
    4: 'Good',
    5: 'Excellent',
};
export const YES_NO_OPTIONS = [
    { label: 'Yes', value: 1 },
    { label: 'No', value: 0 },
];
export const YES_NO_NA_OPTIONS = [
    { label: 'Yes', value: 1 },
    { label: 'No', value: 0 },
    { label: 'Not Applicable', value: -1 },
];
export const NUMERIC_QUESTION_TYPES = new Set([
    'STAR_RATING',
    'SMILE_RATING',
    'NUMERICAL',
    'LIKERT',
    'RATING',
    'YES_NO',
]);
export function normalizeUsn(usn) {
    return usn.trim().toUpperCase().replace(/\s+/g, '');
}
export function normalizeQuestionType(type) {
    if (type === 'RATING')
        return 'STAR_RATING';
    return type;
}
