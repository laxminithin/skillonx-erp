export function toDate(value) {
    if (value == null || value === '')
        return null;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}
/**
 * Boundary rule (explicit):
 *   ACTIVE when startAt <= now < endAt  (missing start/end = open-ended on that side)
 *   SCHEDULED when now < startAt
 *   ENDED when now >= endAt
 */
export function getSurveyAvailabilityStatus(survey, now = new Date()) {
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
export function resolveEffectiveStatus(status, startAt, endAt, now = new Date(), closedAt = null) {
    return getSurveyAvailabilityStatus({ status, startAt, endAt, closedAt }, now);
}
export function isStudentAccessible(effective) {
    return effective === 'ACTIVE';
}
export function availabilityReason(effective) {
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
export function availabilityMessage(effective) {
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
export function deriveStoredStatusAfterSchedule(startAt, endAt, now = new Date()) {
    const availability = getSurveyAvailabilityStatus({ status: 'PUBLISHED', startAt, endAt }, now);
    return availability === 'ACTIVE' ? 'ACTIVE' : 'PUBLISHED';
}
/**
 * A schedule window is valid only when the end instant is strictly after the
 * start instant. Open-ended windows (missing start or end) are always valid.
 */
export function isValidSchedule(startAt, endAt) {
    const start = toDate(startAt);
    const end = toDate(endAt);
    if (!start || !end)
        return true;
    return end.getTime() > start.getTime();
}
/**
 * Pure resolution of what an extend/extend-&-reopen should do to the stored
 * lifecycle columns. A manual close (closedAt) is preserved unless the caller
 * explicitly reopens, so extending alone never resurrects a manually closed
 * survey.
 */
export function resolveExtendResult(params) {
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
export const AVAILABILITY_STATUS_LABELS = {
    DRAFT: 'Draft',
    SCHEDULED: 'Scheduled',
    ACTIVE: 'Active',
    ENDED: 'Ended',
    CLOSED: 'Closed',
    ARCHIVED: 'Archived',
};
