import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getSurveyAvailabilityStatus, isStudentAccessible, availabilityReason, deriveStoredStatusAfterSchedule, } from '../src/utils/surveyStatus.js';
import { zonedLocalToUtc, utcToZonedLocalInput, formatInTimeZone, addDaysPreservingWallClock, DEFAULT_TIMEZONE, } from '../src/utils/timezone.js';
describe('getSurveyAvailabilityStatus', () => {
    const base = {
        status: 'PUBLISHED',
        startAt: '2026-08-13T18:17:00.000Z', // 13 Aug 2026 11:47 PM IST
        endAt: '2026-08-28T18:18:00.000Z', // 28 Aug 2026 11:48 PM IST
        closedAt: null,
        archivedAt: null,
    };
    it('Case 1: before start → SCHEDULED', () => {
        const now = new Date('2026-08-13T18:16:59.999Z');
        const status = getSurveyAvailabilityStatus(base, now);
        assert.equal(status, 'SCHEDULED');
        assert.equal(isStudentAccessible(status), false);
        assert.equal(availabilityReason(status), 'SURVEY_NOT_STARTED');
    });
    it('Case 2: exactly at start → ACTIVE', () => {
        const now = new Date('2026-08-13T18:17:00.000Z');
        assert.equal(getSurveyAvailabilityStatus(base, now), 'ACTIVE');
    });
    it('Case 3: between start and end → ACTIVE', () => {
        const now = new Date('2026-08-20T10:00:00.000Z');
        assert.equal(getSurveyAvailabilityStatus(base, now), 'ACTIVE');
        assert.equal(isStudentAccessible('ACTIVE'), true);
    });
    it('Case 4: exactly at end → ENDED', () => {
        const now = new Date('2026-08-28T18:18:00.000Z');
        const status = getSurveyAvailabilityStatus(base, now);
        assert.equal(status, 'ENDED');
        assert.equal(availabilityReason(status), 'SURVEY_ENDED');
    });
    it('Case 5: after end → ENDED', () => {
        const now = new Date('2026-08-28T18:18:00.001Z');
        assert.equal(getSurveyAvailabilityStatus(base, now), 'ENDED');
    });
    it('Case 6: manually closed inside window → CLOSED', () => {
        const now = new Date('2026-08-20T10:00:00.000Z');
        const status = getSurveyAvailabilityStatus({ ...base, status: 'CLOSED', closedAt: '2026-08-15T05:00:00.000Z' }, now);
        assert.equal(status, 'CLOSED');
        assert.equal(availabilityReason(status), 'SURVEY_CLOSED');
    });
    it('Case 7: reopened (closedAt cleared) inside window → ACTIVE', () => {
        const now = new Date('2026-08-20T10:00:00.000Z');
        const status = getSurveyAvailabilityStatus({ ...base, status: 'PUBLISHED', closedAt: null }, now);
        assert.equal(status, 'ACTIVE');
    });
    it('Case 8: archived → ARCHIVED', () => {
        const now = new Date('2026-08-20T10:00:00.000Z');
        assert.equal(getSurveyAvailabilityStatus({ ...base, status: 'ARCHIVED', archivedAt: '2026-08-19T00:00:00.000Z' }, now), 'ARCHIVED');
    });
    it('Case 9: draft → DRAFT', () => {
        assert.equal(getSurveyAvailabilityStatus({ ...base, status: 'DRAFT' }, new Date()), 'DRAFT');
    });
    it('does not treat scheduled as closed', () => {
        const status = getSurveyAvailabilityStatus(base, new Date('2026-08-10T00:00:00.000Z'));
        assert.notEqual(status, 'CLOSED');
        assert.notEqual(status, 'ENDED');
        assert.equal(status, 'SCHEDULED');
    });
    it('deriveStoredStatusAfterSchedule respects window', () => {
        assert.equal(deriveStoredStatusAfterSchedule(base.startAt, base.endAt, new Date('2026-08-10T00:00:00.000Z')), 'PUBLISHED');
        assert.equal(deriveStoredStatusAfterSchedule(base.startAt, base.endAt, new Date('2026-08-20T00:00:00.000Z')), 'ACTIVE');
    });
});
describe('timezone Asia/Kolkata roundtrip', () => {
    it('Case 10: local wall clock → UTC → local', () => {
        const local = '2026-08-13T23:47';
        const utc = zonedLocalToUtc(local, DEFAULT_TIMEZONE);
        assert.equal(utc.toISOString(), '2026-08-13T18:17:00.000Z');
        assert.equal(utcToZonedLocalInput(utc, DEFAULT_TIMEZONE), '2026-08-13T23:47');
    });
    it('formats with IST label', () => {
        const formatted = formatInTimeZone('2026-08-13T18:17:00.000Z', DEFAULT_TIMEZONE);
        assert.match(formatted, /13 Aug 2026/);
        assert.match(formatted, /11:47\s*PM/i);
        assert.match(formatted, /IST/);
    });
    it('extend +14 days preserves wall clock', () => {
        const start = zonedLocalToUtc('2026-08-28T23:48', DEFAULT_TIMEZONE);
        const extended = addDaysPreservingWallClock(start, 14, DEFAULT_TIMEZONE);
        assert.equal(utcToZonedLocalInput(extended, DEFAULT_TIMEZONE), '2026-09-11T23:48');
    });
});
