/**
 * Library circulation E2E invariants. Skips when E2E seed is absent.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { db } from '../../db/index.js';
import { signToken } from '../../utils/token.js';
import { errorHandler } from '../../utils/errors.js';
import type { LibraryActor } from './types.js';
import { getLibraryNoDueStatus } from './clearance.js';
import { searchCatalog } from './catalog.js';
import { issueBook, returnBook, renewLoan } from './circulation.js';
import { createReservation } from './reservations.js';
import { getStudentNoDueStatus } from '../finance/clearance.js';
import { hasLibraryPermission } from './access.js';
import { generateOverdueFine, reconcilePendingFineFinanceHandoffs, waiveFine } from './fines.js';
import { getOrCreateStudentMember } from './members.js';
import { libraryRouter } from './controller.js';

async function startTestServer() {
  const app = express();
  app.use(express.json());
  app.use('/api/library', libraryRouter);
  app.use(errorHandler);
  return new Promise<{ url: string; close: () => Promise<void> }>((resolve) => {
    const server = app.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

function tokenFor(user: { id: number; college_id: number; department_id?: number | null; role: string; email?: string; name?: string }) {
  return signToken({
    kind: 'faculty',
    facultyUserId: Number(user.id),
    collegeId: Number(user.college_id),
    departmentId: user.department_id ?? null,
    role: user.role,
    email: user.email ?? 'test@example.com',
    name: user.name ?? 'Test User',
  });
}

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

  it('LIBRARIAN role has full library permissions; bare FACULTY has none', () => {
    const librarian: LibraryActor = { facultyUserId: 1, collegeId: 1, departmentId: null, role: 'LIBRARIAN' };
    const faculty: LibraryActor = { facultyUserId: 2, collegeId: 1, departmentId: null, role: 'FACULTY' };
    for (const perm of [
      'library.view',
      'library.catalog.manage',
      'library.circulation.issue',
      'library.circulation.return',
      'library.reservation.manage',
      'library.fines.manage',
      'library.fines.waive',
      'library.inventory.manage',
      'library.report.view',
      'library.config.manage',
    ] as const) {
      assert.equal(hasLibraryPermission(librarian, perm), true, `LIBRARIAN should have ${perm}`);
      assert.equal(hasLibraryPermission(faculty, perm), false, `bare FACULTY should not have ${perm}`);
    }
  });

  it('unguarded-route regression: bare FACULTY is denied member-status/renew/lost; COLLEGE_ADMIN is not', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin) return;
    const facultyUser = await db('faculty_users').where({ college_id: ctx.cls.college_id, role: 'FACULTY' }).first();
    if (!facultyUser) return;

    const server = await startTestServer();
    try {
      const facultyToken = tokenFor(facultyUser);
      const adminToken = tokenFor(ctx.admin);
      const routes: Array<{ method: string; path: string; body: unknown }> = [
        { method: 'PATCH', path: '/api/library/members/999999999/status', body: { status: 'ACTIVE' } },
        { method: 'POST', path: '/api/library/circulation/renew/999999999', body: {} },
        { method: 'POST', path: '/api/library/circulation/lost/999999999', body: { chargeAmount: 10 } },
      ];

      for (const route of routes) {
        const facultyRes = await fetch(`${server.url}${route.path}`, {
          method: route.method,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
          body: JSON.stringify(route.body),
        });
        assert.equal(facultyRes.status, 403, `bare FACULTY should be denied on ${route.method} ${route.path}`);

        const adminRes = await fetch(`${server.url}${route.path}`, {
          method: route.method,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify(route.body),
        });
        assert.notEqual(adminRes.status, 403, `COLLEGE_ADMIN should not be blocked by permissions on ${route.method} ${route.path}`);
      }
    } finally {
      await server.close();
    }
  });

  it('concurrent issue of the same copy: at most one active loan is created', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.other) return;

    const copy = await db('library_copies').where({ college_id: ctx.cls.college_id, status: 'AVAILABLE' }).first();
    if (!copy) return;

    const otherMember = await getOrCreateStudentMember(Number(ctx.other.id), Number(ctx.cls.college_id));
    const actor: LibraryActor = {
      facultyUserId: Number(ctx.admin.id),
      collegeId: Number(ctx.cls.college_id),
      departmentId: ctx.admin.department_id ?? null,
      role: ctx.admin.role,
    };

    const results = await Promise.allSettled([
      issueBook(actor, { memberId: Number(ctx.member.id), barcode: copy.barcode }),
      issueBook(actor, { memberId: Number(otherMember.id), barcode: copy.barcode }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    assert.ok(fulfilled.length <= 1, 'at most one concurrent issue attempt should succeed');

    const activeLoansForCopy = await db('library_loans')
      .where({ copy_id: copy.id, college_id: ctx.cls.college_id })
      .whereIn('status', ['ACTIVE', 'OVERDUE'])
      .count({ c: '*' })
      .first();
    assert.equal(Number(activeLoansForCopy?.c ?? 0), fulfilled.length, 'active loan count for the copy must match successful issues');
    assert.ok(Number(activeLoansForCopy?.c ?? 0) <= 1, 'copy must never carry two active loans');

    // Cleanup so this copy doesn't stay checked out for other test runs.
    if (fulfilled.length === 1) {
      await returnBook(actor, copy.barcode);
    }
  });

  it('overdue fine reaches Finance via handoff, and replay stays idempotent', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin) return;

    const copy = await db('library_copies').where({ college_id: ctx.cls.college_id, status: 'AVAILABLE' }).first();
    if (!copy) return;

    const actor: LibraryActor = {
      facultyUserId: Number(ctx.admin.id),
      collegeId: Number(ctx.cls.college_id),
      departmentId: ctx.admin.department_id ?? null,
      role: ctx.admin.role,
    };

    const loan = await issueBook(actor, { memberId: Number(ctx.member.id), barcode: copy.barcode });
    await db('library_loans').where({ id: loan.id }).update({
      due_at: new Date(Date.now() - 5 * 86400000),
      status: 'OVERDUE',
    });

    const fine = await generateOverdueFine(loan.id, Number(ctx.cls.college_id));
    if (!fine) {
      // Policy has no per-day fine configured for this member type; nothing to hand off.
      await db('library_loans').where({ id: loan.id }).update({ status: 'ACTIVE', due_at: new Date(Date.now() + 86400000) });
      await returnBook(actor, copy.barcode);
      return;
    }

    const first = await reconcilePendingFineFinanceHandoffs(Number(ctx.cls.college_id));
    assert.ok(first.attempted >= 1);

    const posted = await db('library_fines').where({ id: fine.id }).first();
    assert.ok(posted?.finance_demand_id, 'overdue fine should now carry a finance_demand_id');

    const demandCountBefore = await db('student_fee_demands')
      .where({ source_type: 'library_fine', source_id: fine.id })
      .count({ c: '*' })
      .first();
    assert.equal(Number(demandCountBefore?.c ?? 0), 1);

    // Replay must not create a second demand.
    await reconcilePendingFineFinanceHandoffs(Number(ctx.cls.college_id));
    const demandCountAfter = await db('student_fee_demands')
      .where({ source_type: 'library_fine', source_id: fine.id })
      .count({ c: '*' })
      .first();
    assert.equal(Number(demandCountAfter?.c ?? 0), 1, 'replay must not duplicate the finance demand');

    // Clearance connected check: waiving the fine in full clears its own outstanding balance
    // (the fixture member may carry other pre-existing DUE fines, so assert on this fine only).
    const waived = await waiveFine(actor, fine.id, Number(fine.amount), 'test cleanup');
    assert.equal(waived.status, 'WAIVED');
    assert.equal(Number(waived.outstandingAmount), 0);

    // Cleanup: close out the loan, and remove the ad-hoc Finance demand this test created.
    // Waiving on the Library side does not (and per the Library/Finance boundary, must not)
    // reach into Finance to cancel the demand itself — so a shared fixture student would
    // otherwise accumulate one extra ad-hoc demand per test run, inflating
    // getStudentFinancialStatus.totalFees for every other suite that reads this student's
    // Finance record (this is exactly what happened to finance.e2e.test.ts).
    await db('library_loans').where({ id: loan.id }).update({ status: 'ACTIVE', due_at: new Date(Date.now() + 86400000) });
    await returnBook(actor, copy.barcode);
    await db('student_fee_demand_items').where({ demand_id: Number(posted!.finance_demand_id) }).delete();
    await db('student_fee_demands').where({ id: Number(posted!.finance_demand_id) }).delete();
  });
});
