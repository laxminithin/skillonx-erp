import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, requireStudentAuth } from '../../middleware/auth.js';
import { assertLibraryPermission } from './access.js';
import * as catalog from './catalog.js';
import * as copies from './copies.js';
import * as members from './members.js';
import * as circulation from './circulation.js';
import * as reservations from './reservations.js';
import * as fines from './fines.js';
import * as policies from './policies.js';
import * as reports from './reports.js';
import * as inventory from './inventory.js';
import { runLibraryJobs } from './jobs.js';
function actor(req) {
    return {
        facultyUserId: req.user.facultyUserId,
        collegeId: req.user.collegeId,
        departmentId: req.user.departmentId ?? null,
        role: req.user.role,
        name: req.user.name,
    };
}
export const libraryRouter = Router();
libraryRouter.use(requireAuth);
libraryRouter.get('/dashboard', asyncHandler(async (req, res) => {
    assertLibraryPermission(actor(req), 'library.view');
    res.json(await reports.libraryDashboard(actor(req)));
}));
libraryRouter.get('/catalog/search', asyncHandler(async (req, res) => {
    assertLibraryPermission(actor(req), 'library.view');
    res.json({
        items: await catalog.searchCatalog(actor(req).collegeId, {
            q: typeof req.query.q === 'string' ? req.query.q : undefined,
        }),
    });
}));
libraryRouter.get('/catalog/:id', asyncHandler(async (req, res) => {
    assertLibraryPermission(actor(req), 'library.view');
    res.json(await catalog.getCatalogItem(actor(req).collegeId, Number(req.params.id)));
}));
libraryRouter.post('/catalog', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        title: z.string().min(1),
        isbn: z.string().optional(),
        authors: z.string().optional(),
        publisher: z.string().optional(),
        edition: z.string().optional(),
        publicationYear: z.number().optional(),
        subjects: z.string().optional(),
        callNumber: z.string().optional(),
        description: z.string().optional(),
        defaultLocation: z.string().optional(),
        digitalLink: z.string().optional(),
    }), req.body);
    res.status(201).json(await catalog.createCatalogItem(actor(req), body));
}));
libraryRouter.post('/copies', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        catalogItemId: z.number(),
        accessionNumber: z.string().min(1),
        barcode: z.string().min(1),
        location: z.string().optional(),
        shelf: z.string().optional(),
    }), req.body);
    res.status(201).json(await copies.createCopy(actor(req), body));
}));
libraryRouter.get('/copies/lookup/:barcode', asyncHandler(async (req, res) => {
    assertLibraryPermission(actor(req), 'library.view');
    res.json(await copies.findCopyByBarcode(actor(req).collegeId, req.params.barcode));
}));
libraryRouter.get('/inventory', asyncHandler(async (req, res) => {
    assertLibraryPermission(actor(req), 'library.view');
    res.json({
        copies: await copies.listInventory(actor(req), {
            q: typeof req.query.q === 'string' ? req.query.q : undefined,
            status: typeof req.query.status === 'string' ? req.query.status : undefined,
        }),
    });
}));
libraryRouter.get('/members', asyncHandler(async (req, res) => {
    assertLibraryPermission(actor(req), 'library.view');
    res.json({
        members: await members.listMembers(actor(req), {
            q: typeof req.query.q === 'string' ? req.query.q : undefined,
            memberType: typeof req.query.memberType === 'string' ? req.query.memberType : undefined,
        }),
    });
}));
libraryRouter.get('/members/lookup/:query', asyncHandler(async (req, res) => {
    assertLibraryPermission(actor(req), 'library.view');
    res.json(await members.findMemberByQuery(actor(req).collegeId, req.params.query));
}));
libraryRouter.patch('/members/:id/status', asyncHandler(async (req, res) => {
    const body = validate(z.object({ status: z.enum(['ACTIVE', 'SUSPENDED', 'EXPIRED', 'CLOSED']), reason: z.string().optional() }), req.body);
    res.json(await members.updateMemberStatus(actor(req), Number(req.params.id), body.status, body.reason));
}));
libraryRouter.post('/circulation/issue', asyncHandler(async (req, res) => {
    assertLibraryPermission(actor(req), 'library.circulation.issue');
    const body = validate(z.object({ memberId: z.number(), barcode: z.string().min(1) }), req.body);
    res.status(201).json(await circulation.issueBook(actor(req), body));
}));
libraryRouter.post('/circulation/return', asyncHandler(async (req, res) => {
    assertLibraryPermission(actor(req), 'library.circulation.return');
    const body = validate(z.object({ barcode: z.string().min(1) }), req.body);
    res.json(await circulation.returnBook(actor(req), body.barcode));
}));
libraryRouter.post('/circulation/renew/:loanId', asyncHandler(async (req, res) => {
    res.json(await circulation.renewLoan(actor(req), Number(req.params.loanId)));
}));
libraryRouter.post('/circulation/lost/:loanId', asyncHandler(async (req, res) => {
    const body = validate(z.object({ chargeAmount: z.number().positive(), remarks: z.string().optional() }), req.body);
    res.json(await circulation.markLoanLost(actor(req), Number(req.params.loanId), body.chargeAmount, body.remarks));
}));
libraryRouter.get('/reservations', asyncHandler(async (req, res) => {
    assertLibraryPermission(actor(req), 'library.view');
    res.json({
        reservations: await reservations.staffListReservations(actor(req), typeof req.query.status === 'string' ? req.query.status : undefined),
    });
}));
libraryRouter.get('/fines', asyncHandler(async (req, res) => {
    assertLibraryPermission(actor(req), 'library.view');
    res.json({
        fines: await fines.staffListFines(actor(req), typeof req.query.status === 'string' ? req.query.status : undefined),
    });
}));
libraryRouter.post('/fines/:id/waive', asyncHandler(async (req, res) => {
    assertLibraryPermission(actor(req), 'library.fines.waive');
    const body = validate(z.object({ amount: z.number().positive(), reason: z.string().min(1) }), req.body);
    res.json(await fines.waiveFine(actor(req), Number(req.params.id), body.amount, body.reason));
}));
libraryRouter.get('/policies', asyncHandler(async (req, res) => {
    assertLibraryPermission(actor(req), 'library.view');
    res.json({ policies: await policies.listPolicies(actor(req).collegeId) });
}));
libraryRouter.get('/reports/overdue', asyncHandler(async (req, res) => {
    assertLibraryPermission(actor(req), 'library.report.view');
    res.json(await reports.overdueReport(actor(req), {
        memberType: typeof req.query.memberType === 'string' ? req.query.memberType : undefined,
        daysOverdue: req.query.daysOverdue ? Number(req.query.daysOverdue) : undefined,
    }));
}));
libraryRouter.get('/reports/most-borrowed', asyncHandler(async (req, res) => {
    assertLibraryPermission(actor(req), 'library.report.view');
    res.json({ items: await reports.mostBorrowedReport(actor(req)) });
}));
libraryRouter.get('/reports/daily', asyncHandler(async (req, res) => {
    assertLibraryPermission(actor(req), 'library.report.view');
    const date = typeof req.query.date === 'string' ? req.query.date : new Date().toISOString().slice(0, 10);
    res.json(await reports.dailyCirculationReport(actor(req), date));
}));
libraryRouter.post('/inventory/sessions', asyncHandler(async (req, res) => {
    const body = validate(z.object({ name: z.string().min(1) }), req.body);
    res.status(201).json(await inventory.startInventorySession(actor(req), body.name));
}));
libraryRouter.post('/inventory/sessions/:id/scan', asyncHandler(async (req, res) => {
    const body = validate(z.object({ barcode: z.string().min(1) }), req.body);
    res.json(await inventory.scanInventoryCopy(actor(req), Number(req.params.id), body.barcode));
}));
libraryRouter.post('/inventory/sessions/:id/close', asyncHandler(async (req, res) => {
    res.json(await inventory.closeInventorySession(actor(req), Number(req.params.id)));
}));
libraryRouter.post('/jobs/run', asyncHandler(async (req, res) => {
    assertLibraryPermission(actor(req), 'library.config.manage');
    res.json(await runLibraryJobs(actor(req).collegeId));
}));
// ── Student mobile APIs ────────────────────────────────────────────────
export const studentLibraryRouter = Router();
studentLibraryRouter.use(requireStudentAuth);
studentLibraryRouter.get('/library', asyncHandler(async (req, res) => {
    const { getOrCreateStudentMember } = await import('./members.js');
    const member = await getOrCreateStudentMember(req.user.studentId, req.user.collegeId);
    const activeLoans = await circulation.listMemberLoans(member.id, req.user.collegeId, true);
    const activeReservations = await reservations.listMemberReservations(member.id, req.user.collegeId);
    res.json({ member, activeLoans, activeReservations });
}));
studentLibraryRouter.get('/library/search', asyncHandler(async (req, res) => {
    res.json({
        items: await catalog.searchCatalog(req.user.collegeId, {
            q: typeof req.query.q === 'string' ? req.query.q : undefined,
        }),
    });
}));
studentLibraryRouter.get('/library/books/:id', asyncHandler(async (req, res) => {
    res.json(await catalog.getCatalogItem(req.user.collegeId, Number(req.params.id)));
}));
studentLibraryRouter.get('/library/loans', asyncHandler(async (req, res) => {
    const member = await members.getOrCreateStudentMember(req.user.studentId, req.user.collegeId);
    res.json({ loans: await circulation.listMemberLoans(member.id, req.user.collegeId, true) });
}));
studentLibraryRouter.get('/library/reservations', asyncHandler(async (req, res) => {
    const member = await members.getOrCreateStudentMember(req.user.studentId, req.user.collegeId);
    res.json({ reservations: await reservations.listMemberReservations(member.id, req.user.collegeId) });
}));
studentLibraryRouter.post('/library/reservations', asyncHandler(async (req, res) => {
    const body = validate(z.object({ catalogItemId: z.number() }), req.body);
    const member = await members.getOrCreateStudentMember(req.user.studentId, req.user.collegeId);
    res.status(201).json(await reservations.createReservation(member.id, req.user.collegeId, body.catalogItemId));
}));
studentLibraryRouter.post('/library/reservations/:id/cancel', asyncHandler(async (req, res) => {
    const member = await members.getOrCreateStudentMember(req.user.studentId, req.user.collegeId);
    res.json(await reservations.cancelReservation(member.id, req.user.collegeId, Number(req.params.id)));
}));
studentLibraryRouter.post('/library/loans/:id/renew', asyncHandler(async (req, res) => {
    const member = await members.getOrCreateStudentMember(req.user.studentId, req.user.collegeId);
    res.json(await circulation.renewLoan({ memberId: member.id, collegeId: req.user.collegeId }, Number(req.params.id)));
}));
studentLibraryRouter.get('/library/history', asyncHandler(async (req, res) => {
    const member = await members.getOrCreateStudentMember(req.user.studentId, req.user.collegeId);
    res.json({ history: await circulation.listMemberHistory(member.id, req.user.collegeId) });
}));
studentLibraryRouter.get('/library/fines', asyncHandler(async (req, res) => {
    const member = await members.getOrCreateStudentMember(req.user.studentId, req.user.collegeId);
    res.json({ fines: await fines.listMemberFines(member.id, req.user.collegeId) });
}));
studentLibraryRouter.get('/library/card', asyncHandler(async (req, res) => {
    res.json(await members.getStudentCard(req.user.studentId, req.user.collegeId));
}));
// ── Faculty library APIs ─────────────────────────────────────────────────
export const facultyLibraryRouter = Router();
facultyLibraryRouter.use(requireAuth);
facultyLibraryRouter.get('/library', asyncHandler(async (req, res) => {
    const member = await members.getOrCreateFacultyMember(req.user.facultyUserId, req.user.collegeId);
    const activeLoans = await circulation.listMemberLoans(member.id, req.user.collegeId, true);
    res.json({ member, activeLoans });
}));
facultyLibraryRouter.get('/library/search', asyncHandler(async (req, res) => {
    res.json({
        items: await catalog.searchCatalog(req.user.collegeId, {
            q: typeof req.query.q === 'string' ? req.query.q : undefined,
        }),
    });
}));
facultyLibraryRouter.get('/library/loans', asyncHandler(async (req, res) => {
    const member = await members.getOrCreateFacultyMember(req.user.facultyUserId, req.user.collegeId);
    res.json({ loans: await circulation.listMemberLoans(member.id, req.user.collegeId, true) });
}));
facultyLibraryRouter.get('/library/reservations', asyncHandler(async (req, res) => {
    const member = await members.getOrCreateFacultyMember(req.user.facultyUserId, req.user.collegeId);
    res.json({ reservations: await reservations.listMemberReservations(member.id, req.user.collegeId) });
}));
facultyLibraryRouter.post('/library/reservations', asyncHandler(async (req, res) => {
    const body = validate(z.object({ catalogItemId: z.number() }), req.body);
    const member = await members.getOrCreateFacultyMember(req.user.facultyUserId, req.user.collegeId);
    res.status(201).json(await reservations.createReservation(member.id, req.user.collegeId, body.catalogItemId));
}));
facultyLibraryRouter.post('/library/loans/:id/renew', asyncHandler(async (req, res) => {
    const member = await members.getOrCreateFacultyMember(req.user.facultyUserId, req.user.collegeId);
    res.json(await circulation.renewLoan({ memberId: member.id, collegeId: req.user.collegeId }, Number(req.params.id)));
}));
facultyLibraryRouter.get('/library/history', asyncHandler(async (req, res) => {
    const member = await members.getOrCreateFacultyMember(req.user.facultyUserId, req.user.collegeId);
    res.json({ history: await circulation.listMemberHistory(member.id, req.user.collegeId) });
}));
