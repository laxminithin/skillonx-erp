import type { SurveyStatus } from '../types/domain.js';

/** Lifecycle statuses stored on surveys.status */
export type StoredSurveyStatus = SurveyStatus;

/**
 * Effective availability status — single source of truth for UI + public access.
 * Distinct from stored lifecycle (e.g. PUBLISHED can be SCHEDULED or ACTIVE).
 */
export type AvailabilityStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'ENDED'
  | 'CLOSED'
  | 'ARCHIVED';

export type SurveyAvailabilityReason =
  | 'SURVEY_DRAFT'
  | 'SURVEY_NOT_STARTED'
  | 'SURVEY_ACTIVE'
  | 'SURVEY_ENDED'
  | 'SURVEY_CLOSED'
  | 'SURVEY_ARCHIVED';

export type SurveyAvailabilityInput = {
  status: string;
  startAt?: Date | string | null;
  endAt?: Date | string | null;
  closedAt?: Date | string | null;
  archivedAt?: Date | string | null;
  deletedAt?: Date | string | null;
};

export function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Boundary rule (explicit):
 *   ACTIVE when startAt <= now < endAt  (missing start/end = open-ended on that side)
 *   SCHEDULED when now < startAt
 *   ENDED when now >= endAt
 */
export function getSurveyAvailabilityStatus(
  survey: SurveyAvailabilityInput,
  now: Date = new Date(),
): AvailabilityStatus {
  if (survey.deletedAt || survey.archivedAt || survey.status === 'ARCHIVED') {
    return 'ARCHIVED';
  }

  if (survey.status === 'DRAFT') {
    return 'DRAFT';
  }

  // Explicit faculty close — independent of the date window
  if (survey.status === 'CLOSED' || survey.closedAt) {
    return 'CLOSED';
  }

  // Only published / active lifecycle rows are date-evaluated
  if (survey.status !== 'PUBLISHED' && survey.status !== 'ACTIVE') {
    return 'DRAFT';
  }

  const start = toDate(survey.startAt);
  const end = toDate(survey.endAt);

  if (start && now.getTime() < start.getTime()) {
    return 'SCHEDULED';
  }

  if (end && now.getTime() >= end.getTime()) {
    return 'ENDED';
  }

  return 'ACTIVE';
}

/** @deprecated Prefer getSurveyAvailabilityStatus — kept for gradual call-site migration */
export function resolveEffectiveStatus(
  status: SurveyStatus | string,
  startAt: Date | string | null,
  endAt: Date | string | null,
  now: Date = new Date(),
  closedAt: Date | string | null = null,
): AvailabilityStatus {
  return getSurveyAvailabilityStatus(
    { status, startAt, endAt, closedAt },
    now,
  );
}

export function isStudentAccessible(effective: AvailabilityStatus): boolean {
  return effective === 'ACTIVE';
}

export function availabilityReason(effective: AvailabilityStatus): SurveyAvailabilityReason {
  switch (effective) {
    case 'DRAFT':
      return 'SURVEY_DRAFT';
    case 'SCHEDULED':
      return 'SURVEY_NOT_STARTED';
    case 'ACTIVE':
      return 'SURVEY_ACTIVE';
    case 'ENDED':
      return 'SURVEY_ENDED';
    case 'CLOSED':
      return 'SURVEY_CLOSED';
    case 'ARCHIVED':
      return 'SURVEY_ARCHIVED';
  }
}

export function availabilityMessage(effective: AvailabilityStatus): string {
  switch (effective) {
    case 'SCHEDULED':
      return 'This survey is not open yet.';
    case 'ENDED':
      return 'The response period for this survey has ended.';
    case 'CLOSED':
      return 'This survey is no longer accepting responses.';
    case 'ARCHIVED':
      return 'This survey is no longer available.';
    case 'DRAFT':
      return 'This survey is not published.';
    case 'ACTIVE':
      return 'This survey is accepting responses.';
  }
}

/** Derive stored lifecycle status after publish / reopen / extend. */
export function deriveStoredStatusAfterSchedule(
  startAt: Date | string | null,
  endAt: Date | string | null,
  now: Date = new Date(),
): 'PUBLISHED' | 'ACTIVE' {
  const availability = getSurveyAvailabilityStatus(
    { status: 'PUBLISHED', startAt, endAt },
    now,
  );
  return availability === 'ACTIVE' ? 'ACTIVE' : 'PUBLISHED';
}

/**
 * A schedule window is valid only when the end instant is strictly after the
 * start instant. Open-ended windows (missing start or end) are always valid.
 */
export function isValidSchedule(
  startAt: Date | string | null,
  endAt: Date | string | null,
): boolean {
  const start = toDate(startAt);
  const end = toDate(endAt);
  if (!start || !end) return true;
  return end.getTime() > start.getTime();
}

/**
 * Pure resolution of what an extend/extend-&-reopen should do to the stored
 * lifecycle columns. A manual close (closedAt) is preserved unless the caller
 * explicitly reopens, so extending alone never resurrects a manually closed
 * survey.
 */
export function resolveExtendResult(params: {
  startAt: Date | string | null;
  endAt: Date | string | null;
  currentClosedAt: Date | string | null;
  reopen: boolean;
  now?: Date;
}): { closedAt: Date | null; storedStatus: 'PUBLISHED' | 'ACTIVE' | 'CLOSED' } {
  const now = params.now ?? new Date();
  const nextClosedAt = params.reopen ? null : toDate(params.currentClosedAt);
  if (nextClosedAt) {
    return { closedAt: nextClosedAt, storedStatus: 'CLOSED' };
  }
  return {
    closedAt: null,
    storedStatus: deriveStoredStatusAfterSchedule(params.startAt, params.endAt, now),
  };
}

export const AVAILABILITY_STATUS_LABELS: Record<AvailabilityStatus, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  ACTIVE: 'Active',
  ENDED: 'Ended',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived',
};
