import type { SurveyStatus } from '../types/domain.js';
/** Lifecycle statuses stored on surveys.status */
export type StoredSurveyStatus = SurveyStatus;
/**
 * Effective availability status — single source of truth for UI + public access.
 * Distinct from stored lifecycle (e.g. PUBLISHED can be SCHEDULED or ACTIVE).
 */
export type AvailabilityStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CLOSED' | 'ARCHIVED';
export type SurveyAvailabilityReason = 'SURVEY_DRAFT' | 'SURVEY_NOT_STARTED' | 'SURVEY_ACTIVE' | 'SURVEY_ENDED' | 'SURVEY_CLOSED' | 'SURVEY_ARCHIVED';
export type SurveyAvailabilityInput = {
    status: string;
    startAt?: Date | string | null;
    endAt?: Date | string | null;
    closedAt?: Date | string | null;
    archivedAt?: Date | string | null;
    deletedAt?: Date | string | null;
};
export declare function toDate(value: Date | string | null | undefined): Date | null;
/**
 * Boundary rule (explicit):
 *   ACTIVE when startAt <= now < endAt  (missing start/end = open-ended on that side)
 *   SCHEDULED when now < startAt
 *   ENDED when now >= endAt
 */
export declare function getSurveyAvailabilityStatus(survey: SurveyAvailabilityInput, now?: Date): AvailabilityStatus;
/** @deprecated Prefer getSurveyAvailabilityStatus — kept for gradual call-site migration */
export declare function resolveEffectiveStatus(status: SurveyStatus | string, startAt: Date | string | null, endAt: Date | string | null, now?: Date, closedAt?: Date | string | null): AvailabilityStatus;
export declare function isStudentAccessible(effective: AvailabilityStatus): boolean;
export declare function availabilityReason(effective: AvailabilityStatus): SurveyAvailabilityReason;
export declare function availabilityMessage(effective: AvailabilityStatus): string;
/** Derive stored lifecycle status after publish / reopen / extend. */
export declare function deriveStoredStatusAfterSchedule(startAt: Date | string | null, endAt: Date | string | null, now?: Date): 'PUBLISHED' | 'ACTIVE';
/**
 * A schedule window is valid only when the end instant is strictly after the
 * start instant. Open-ended windows (missing start or end) are always valid.
 */
export declare function isValidSchedule(startAt: Date | string | null, endAt: Date | string | null): boolean;
/**
 * Pure resolution of what an extend/extend-&-reopen should do to the stored
 * lifecycle columns. A manual close (closedAt) is preserved unless the caller
 * explicitly reopens, so extending alone never resurrects a manually closed
 * survey.
 */
export declare function resolveExtendResult(params: {
    startAt: Date | string | null;
    endAt: Date | string | null;
    currentClosedAt: Date | string | null;
    reopen: boolean;
    now?: Date;
}): {
    closedAt: Date | null;
    storedStatus: 'PUBLISHED' | 'ACTIVE' | 'CLOSED';
};
export declare const AVAILABILITY_STATUS_LABELS: Record<AvailabilityStatus, string>;
