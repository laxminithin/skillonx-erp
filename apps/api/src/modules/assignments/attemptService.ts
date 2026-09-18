/**
 * Public student assignment flow.
 * Canonical implementation lives in submissionService.ts; this file keeps
 * the attemptService import path used by public/controller.ts.
 */
export {
  studentInfoSchema,
  submissionAnswerSchema as answerSchema,
  saveAnswersSchema,
  submitSchema,
  getPublicAssignment,
  startSubmission,
  saveSubmissionAnswers,
  saveSubmissionAnswers as saveDraftAnswers,
  submitAssignment,
  submitAssignment as submitSubmission,
  getSubmission,
} from './submissionService.js';
