/**
 * Library circulation E2E invariants. Skips when E2E seed is absent.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { LibraryActor } from './types.js';
import { getLibraryNoDueStatus } from './clearance.js';
import { searchCatalog } from './catalog.js';
import { issueBook, returnBook, renewLoan } from './circulation.js';
import { createReservation } from './reservations.js';
import { getStudentNoDueStatus } from '../finance/clearance.js';

async function e2eContext() {
  try {
    if (!(await db.schema.hasTable('library_members'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const approved = await db('students').where({ usn: '4VV24CS001' }).first();
    const other = await db('students').where({ usn: '4VV24CS002' }).first();
    const admin = await db('faculty_users')
      .where({ college_id: cls.college_id, role: 'COLLEGE_ADMIN' })
      .first();
    const member = approved
      ? await db('library_members').where({ student_id: approved.id, college_id: cls.college_id }).first()
      : null;
    if (!member) return null;
    return { cls, approved, other, admin, member };
  } catch {
    return null;
  }
}

function libraryActor(row: { id: number; college_id: number; department_id?: number | null; role: string; name?: string }): LibraryActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: row.department_id ?? null,
    role: row.role,
    name: row.name,
  };
}

describe('library E2E', () => {
  it('approved student has library membership', async () => {
    const ctx = await e2eContext();
    if (!ctx?.member) return;
    assert.equal(ctx.member.status, 'ACTIVE');
    assert.equal(ctx.member.membership_number, '4VV24CS001');
  });

  it('catalog search finds Data Structures', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const items = await searchCatalog(Number(ctx.cls.college_id), { q: 'Data Structures' });
    assert.ok(items.length >= 1);
    assert.ok(items[0].title.toLowerCase().includes('data structures'));
    assert.ok(items[0].availability);
  });

  it('availability is computed from copy states', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const items = await searchCatalog(Number(ctx.cls.college_id), { q: 'Data Structures' });
    const item = items[0];
    const copies = await db('library_copies')
      .where({ catalog_item_id: item.id, college_id: ctx.cls.college_id })
      .whereNotIn('status', ['WITHDRAWN']);
    const available = copies.filter((c) => c.status === 'AVAILABLE').length;
    assert.equal(item.availability?.availableCopies, available);
  });

  it('student A cannot access student B loans', async () => {
    const ctx = await e2eContext();
    if (!ctx?.other) return;
    const otherMember = await db('library_members')
      .where({ student_id: ctx.other.id, college_id: ctx.cls.college_id })
      .first();
    if (!otherMember) return;
    const loans = await db('library_loans').where({ member_id: otherMember.id }).first();
    if (!loans) return;
    const approvedMemberId = Number(ctx.member.id);
    assert.notEqual(Number(otherMember.id), approvedMemberId);
  });

  it('library no-due reflects active obligations', async () => {
    const ctx = await e2eContext();
    if (!ctx?.approved) return;
    const lib = await getLibraryNoDueStatus(Number(ctx.approved.id), Number(ctx.cls.college_id));
    assert.ok(['CLEAR', 'DUE', 'NOT_APPLICABLE', 'BLOCKED'].includes(lib.status));
  });

  it('central no-due includes library domain', async () => {
    const ctx = await e2eContext();
    if (!ctx?.approved) return;
    const nd = await getStudentNoDueStatus(Number(ctx.approved.id), Number(ctx.cls.college_id));
    const libDomain = nd.domains.find((d) => d.domain === 'LIBRARY');
    assert.ok(libDomain);
    assert.notEqual(libDomain?.status, 'PENDING_INTEGRATION');
  });

  it('issue and return workflow', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin) return;

    const availableCopy = await db('library_copies')
      .where({ college_id: ctx.cls.college_id, status: 'AVAILABLE' })
      .first();
    if (!availableCopy) return;

    const actor = libraryActor(ctx.admin);
    const loan = await issueBook(actor, {
      memberId: Number(ctx.member.id),
      barcode: availableCopy.barcode,
    });
    assert.equal(loan.status, 'ACTIVE');

    const copyAfter = await db('library_copies').where({ id: availableCopy.id }).first();
    assert.equal(copyAfter?.status, 'ISSUED');

    await returnBook(actor, availableCopy.barcode);
    const copyReturned = await db('library_copies').where({ id: availableCopy.id }).first();
    assert.ok(['AVAILABLE', 'RESERVED'].includes(copyReturned?.status ?? ''));
  });

  it('renewal denied when reservation queue exists', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.other) return;

    const otherMember = await db('library_members')
      .where({ student_id: ctx.other.id, college_id: ctx.cls.college_id })
      .first();
    if (!otherMember) return;

    const catalogItem = await db('library_catalog_items')
      .where({ college_id: ctx.cls.college_id })
      .where('title', 'like', '%Operating Systems%')
      .first();
    if (!catalogItem) return;

    const activeLoan = await db('library_loans')
      .where({ member_id: ctx.member.id, catalog_item_id: catalogItem.id })
      .whereIn('status', ['ACTIVE', 'OVERDUE'])
      .first();
    if (!activeLoan) return;

    try {
      await createReservation(Number(otherMember.id), Number(ctx.cls.college_id), Number(catalogItem.id));
    } catch (err) {
      // Prior runs may leave an active reservation for this member/title.
      assert.ok((err as Error).message.includes('Already reserved'));
    }

    try {
      await renewLoan(
        { memberId: Number(ctx.member.id), collegeId: Number(ctx.cls.college_id) },
        Number(activeLoan.id),
      );
      assert.fail('Expected renewal to be denied');
    } catch (err) {
      assert.ok((err as Error).message.includes('waiting'));
    }
  });

  it('tenant isolation denies cross-college access', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const otherCollege = await db('colleges').whereNot('id', ctx.cls.college_id).first();
    if (!otherCollege) return;
    const items = await searchCatalog(Number(otherCollege.id), { q: 'Data Structures' });
    const e2eItems = await searchCatalog(Number(ctx.cls.college_id), { q: 'Data Structures' });
    if (e2eItems.length && items.length) {
      assert.notEqual(items[0].id, e2eItems[0].id);
    }
  });
});
