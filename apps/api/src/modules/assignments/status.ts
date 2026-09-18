import {
  getSurveyAvailabilityStatus as getAssignmentAvailabilityStatus,
  isStudentAccessible,
  isValidSchedule,
  deriveStoredStatusAfterSchedule,
  type AvailabilityStatus,
} from '../../utils/surveyStatus.js';

export {
  getAssignmentAvailabilityStatus,
  isStudentAccessible,
  isValidSchedule,
  deriveStoredStatusAfterSchedule,
  type AvailabilityStatus,
};

export function assignmentAvailabilityReason(effective: AvailabilityStatus) {
  switch (effective) {
    case 'DRAFT':
      return 'ASSIGNMENT_DRAFT';
    case 'SCHEDULED':
      return 'ASSIGNMENT_NOT_STARTED';
    case 'ACTIVE':
      return 'ASSIGNMENT_ACTIVE';
    case 'ENDED':
      return 'ASSIGNMENT_ENDED';
    case 'CLOSED':
      return 'ASSIGNMENT_CLOSED';
    case 'ARCHIVED':
      return 'ASSIGNMENT_ARCHIVED';
  }
}

export function assignmentAvailabilityMessage(effective: AvailabilityStatus) {
  switch (effective) {
    case 'SCHEDULED':
      return 'This assignment is not open yet.';
    case 'ENDED':
      return 'The submission window for this assignment has ended.';
    case 'CLOSED':
      return 'This assignment is no longer accepting submissions.';
    case 'ARCHIVED':
      return 'This assignment is no longer available.';
    case 'DRAFT':
      return 'This assignment is not published.';
    case 'ACTIVE':
      return 'This assignment is open for submissions.';
  }
}
