import { availabilityMessage, availabilityReason, deriveStoredStatusAfterSchedule, getSurveyAvailabilityStatus, isStudentAccessible, isValidSchedule, resolveExtendResult, type AvailabilityStatus } from './surveyStatus.js';
export { deriveStoredStatusAfterSchedule, getSurveyAvailabilityStatus as getQuizAvailabilityStatus, isStudentAccessible, isValidSchedule, resolveExtendResult, type AvailabilityStatus, };
export type QuizAvailabilityReason = 'QUIZ_DRAFT' | 'QUIZ_NOT_STARTED' | 'QUIZ_ACTIVE' | 'QUIZ_ENDED' | 'QUIZ_CLOSED' | 'QUIZ_ARCHIVED';
export declare function quizAvailabilityReason(effective: AvailabilityStatus): QuizAvailabilityReason;
export declare function quizAvailabilityMessage(effective: AvailabilityStatus): string;
/** Survey helpers remain the source of lifecycle truth; these aliases keep call sites explicit. */
export declare const surveyLifecycleAliases: {
    availabilityReason: typeof availabilityReason;
    availabilityMessage: typeof availabilityMessage;
};
