import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isValidSchedule, resolveExtendResult } from './surveyStatus.js';
import { sanitizeFilename, buildExportFilename } from './filename.js';

describe('isValidSchedule', () => {
  it('accepts open-ended windows', () => {
    assert.equal(isValidSchedule(null, null), true);
    assert.equal(isValidSchedule('2026-08-01T00:00:00Z', null), true);
    assert.equal(isValidSchedule(null, '2026-08-01T00:00:00Z'), true);
  });

  it('accepts end strictly after start', () => {
    assert.equal(isValidSchedule('2026-08-01T00:00:00Z', '2026-08-02T00:00:00Z'), true);
  });

  it('rejects end before or equal to start', () => {
    assert.equal(isValidSchedule('2026-08-02T00:00:00Z', '2026-08-01T00:00:00Z'), false);
    assert.equal(isValidSchedule('2026-08-01T00:00:00Z', '2026-08-01T00:00:00Z'), false);
  });
});

describe('resolveExtendResult', () => {
  const now = new Date('2026-08-15T00:00:00Z');

  it('extending a manually closed survey preserves the close (no accidental reopen)', () => {
    const res = resolveExtendResult({
      startAt: '2026-08-01T00:00:00Z',
      endAt: '2026-08-30T00:00:00Z',
      currentClosedAt: '2026-08-10T00:00:00Z',
      reopen: false,
      now,
    });
    assert.equal(res.storedStatus, 'CLOSED');
    assert.ok(res.closedAt instanceof Date);
  });

  it('extend & reopen clears the close and returns to the live window', () => {
    const res = resolveExtendResult({
      startAt: '2026-08-01T00:00:00Z',
      endAt: '2026-08-30T00:00:00Z',
      currentClosedAt: '2026-08-10T00:00:00Z',
      reopen: true,
      now,
    });
    assert.equal(res.closedAt, null);
    assert.equal(res.storedStatus, 'ACTIVE');
  });

  it('extending an ended (not manually closed) survey into the future becomes active', () => {
    const res = resolveExtendResult({
      startAt: '2026-08-01T00:00:00Z',
      endAt: '2026-08-30T00:00:00Z',
      currentClosedAt: null,
      reopen: true,
      now,
    });
    assert.equal(res.closedAt, null);
    assert.equal(res.storedStatus, 'ACTIVE');
  });

  it('a future start stays scheduled after extend', () => {
    const res = resolveExtendResult({
      startAt: '2026-09-01T00:00:00Z',
      endAt: '2026-09-30T00:00:00Z',
      currentClosedAt: null,
      reopen: false,
      now,
    });
    assert.equal(res.storedStatus, 'PUBLISHED'); // scheduled window
  });
});

describe('export filenames', () => {
  it('sanitizes unsafe characters into a clean slug', () => {
    assert.equal(sanitizeFilename('Course-End Survey: Big Data / Analytics'), 'Course-End-Survey-Big-Data-Analytics');
  });

  it('never yields an empty name', () => {
    assert.equal(sanitizeFilename('!!!'), 'survey');
  });

  it('builds a dated, extensioned filename', () => {
    const name = buildExportFilename('Faculty Feedback', 'xlsx', new Date('2026-08-18T10:00:00Z'));
    assert.equal(name, 'Faculty-Feedback-2026-08-18.xlsx');
  });
});
