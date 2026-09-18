export declare const generateSurveyCode: (size?: number) => string;
/** Longer, non-sequential public quiz codes — harder to guess than survey codes. */
export declare const generateQuizCode: (size?: number) => string;
/** Same opacity class as quiz codes for public assignment share links. */
export declare const generateAssignmentCode: (size?: number) => string;
/** Shareable Student LMS class join codes. */
export declare const generateClassCode: (size?: number) => string;
export declare const generateAttemptToken: (size?: number) => string;
