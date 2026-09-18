import { customAlphabet } from 'nanoid';
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const generateSurveyCode = customAlphabet(alphabet, 6);
/** Longer, non-sequential public quiz codes — harder to guess than survey codes. */
export const generateQuizCode = customAlphabet(alphabet, 8);
/** Same opacity class as quiz codes for public assignment share links. */
export const generateAssignmentCode = customAlphabet(alphabet, 8);
/** Shareable Student LMS class join codes. */
export const generateClassCode = customAlphabet(alphabet, 6);
export const generateAttemptToken = customAlphabet(alphabet, 21);
