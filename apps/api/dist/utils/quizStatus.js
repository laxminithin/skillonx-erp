import { availabilityMessage, availabilityReason, deriveStoredStatusAfterSchedule, getSurveyAvailabilityStatus, isStudentAccessible, isValidSchedule, resolveExtendResult, } from './surveyStatus.js';
export { deriveStoredStatusAfterSchedule, getSurveyAvailabilityStatus as getQuizAvailabilityStatus, isStudentAccessible, isValidSchedule, resolveExtendResult, };
export function quizAvailabilityReason(effective) {
    switch (effective) {
        case 'DRAFT':
            return 'QUIZ_DRAFT';
        case 'SCHEDULED':
            return 'QUIZ_NOT_STARTED';
        case 'ACTIVE':
            return 'QUIZ_ACTIVE';
        case 'ENDED':
            return 'QUIZ_ENDED';
        case 'CLOSED':
            return 'QUIZ_CLOSED';
        case 'ARCHIVED':
            return 'QUIZ_ARCHIVED';
    }
}
export function quizAvailabilityMessage(effective) {
    switch (effective) {
        case 'SCHEDULED':
            return 'This quiz is not open yet.';
        case 'ENDED':
            return 'The attempt window for this quiz has ended.';
        case 'CLOSED':
            return 'This quiz is no longer accepting new attempts.';
        case 'ARCHIVED':
            return 'This quiz is no longer available.';
        case 'DRAFT':
            return 'This quiz is not published.';
        case 'ACTIVE':
            return 'This quiz is open for attempts.';
    }
}
/** Survey helpers remain the source of lifecycle truth; these aliases keep call sites explicit. */
export const surveyLifecycleAliases = {
    availabilityReason,
    availabilityMessage,
};
