/**
 * Employee L&D — development history, dashboards, reports, exports and the
 * stable metric provider that a future HR Analytics extension can consume.
 */
import { db } from '../../../db/index.js';
import ExcelJS from 'exceljs';
import { buildExportFilename } from '../../../utils/filename.js';
import { AppError } from '../../../utils/errors.js';
import { assertHrPermission, hasHrPermission, selfEmployee, employeeInCollege, assertManagesEmployee, isSelf, ldReportScope } from './access.js';
function yearStart() {
    return `${new Date().getFullYear()}-01-01`;
}
// ── Development history (per employee) ────────────────────────────────────────
export async function developmentHistory(actor, employeeId) {
    assertHrPermission(actor, 'hr.ld.self');
    const self = await selfEmployee(actor);
    let empId;
    if (employeeId == null || isSelf(self, employeeId)) {
        if (!self)
            return { employeeId: null, completions: [], certificates: [] };
        empId = self.id;
    }
    else {
        const target = await employeeInCollege(actor, employeeId);
        await assertManagesEmployee(actor, target);
        empId = target.id;
    }
    const [completions, certificates] = await Promise.all([
        db('ld_completions as c')
            .join('ld_programs as p', 'p.id', 'c.program_id')
            .leftJoin('ld_courses as co', 'co.id', 'p.course_id')
            .where({ 'c.college_id': actor.collegeId, 'c.employee_id': empId })
            .orderBy('c.completed_at', 'desc')
            .select('c.id', 'c.result', 'c.attendance_pct', 'c.completed_at', 'p.id as program_id', 'p.title', 'p.provider_type', 'p.start_date', 'co.category'),
        db('ld_certificates').where({ college_id: actor.collegeId, employee_id: empId }).orderBy('issued_on', 'desc'),
    ]);
    return { employeeId: empId, completions, certificates };
}
// ── Employee overview (self-service dashboard) ───────────────────────────────
export async function employeeOverview(actor) {
    assertHrPermission(actor, 'hr.ld.self');
    const self = await selfEmployee(actor);
    if (!self)
        return { linked: false };
    const [needsOpen, inProgress, completedYear, certificates, mandatoryDue] = await Promise.all([
        db('ld_development_needs').where({ college_id: actor.collegeId, employee_id: self.id }).whereIn('status', ['IDENTIFIED', 'PLANNED', 'IN_PROGRESS']).count('id as c').first(),
        db('ld_enrollments').where({ college_id: actor.collegeId, employee_id: self.id, status: 'CONFIRMED', completion_status: 'NOT_STARTED' }).count('id as c').first(),
        db('ld_completions').where({ college_id: actor.collegeId, employee_id: self.id }).where('completed_at', '>=', yearStart()).count('id as c').first(),
        db('ld_certificates').where({ college_id: actor.collegeId, employee_id: self.id }).whereIn('status', ['ISSUED', 'VERIFIED']).count('id as c').first(),
        db('ld_programs as p')
            .join('ld_enrollments as e', 'e.program_id', 'p.id')
            .where({ 'e.college_id': actor.collegeId, 'e.employee_id': self.id })
            .where('p.is_mandatory', true)
            .where('e.completion_status', '!=', 'COMPLETED')
            .count('e.id as c')
            .first(),
    ]);
    return {
        linked: true,
        developmentNeedsOpen: Number(needsOpen?.c ?? 0),
        programsInProgress: Number(inProgress?.c ?? 0),
        completedThisYear: Number(completedYear?.c ?? 0),
        certificates: Number(certificates?.c ?? 0),
        mandatoryDue: Number(mandatoryDue?.c ?? 0),
    };
}
// ── HR / L&D admin dashboard ─────────────────────────────────────────────────
export async function adminDashboard(actor) {
    assertHrPermission(actor, 'hr.ld.view');
    const cid = actor.collegeId;
    const [activePrograms, upcoming, enrolled, completions, certs, needsOpen, effPending] = await Promise.all([
        db('ld_programs').where({ college_id: cid }).whereIn('status', ['REGISTRATION_OPEN', 'IN_PROGRESS']).count('id as c').first(),
        db('ld_programs').where({ college_id: cid }).whereIn('status', ['PUBLISHED', 'REGISTRATION_OPEN']).where('start_date', '>=', new Date().toISOString().slice(0, 10)).count('id as c').first(),
        db('ld_enrollments').where({ college_id: cid, status: 'CONFIRMED' }).count('id as c').first(),
        db('ld_completions').where({ college_id: cid }).count('id as c').first(),
        db('ld_certificates').where({ college_id: cid }).where('certificate_type', 'INTERNAL').count('id as c').first(),
        db('ld_development_needs').where({ college_id: cid }).whereIn('status', ['IDENTIFIED', 'PLANNED', 'IN_PROGRESS']).count('id as c').first(),
        db('ld_enrollments as e').join('ld_programs as p', 'p.id', 'e.program_id').where({ 'e.college_id': cid, 'e.completion_status': 'COMPLETED' })
            .whereNotExists(function () { this.select('*').from('ld_effectiveness as f').whereRaw('f.program_id = e.program_id AND f.employee_id = e.employee_id AND f.kind = ?', ['MANAGER_REVIEW']); })
            .count('e.id as c').first(),
    ]);
    const enrolledN = Number(enrolled?.c ?? 0);
    const completedN = Number(completions?.c ?? 0);
    return {
        activePrograms: Number(activePrograms?.c ?? 0),
        upcomingPrograms: Number(upcoming?.c ?? 0),
        employeesEnrolled: enrolledN,
        completions: completedN,
        certificatesIssued: Number(certs?.c ?? 0),
        developmentNeedsOpen: Number(needsOpen?.c ?? 0),
        effectivenessReviewsPending: Number(effPending?.c ?? 0),
        completionRate: enrolledN + completedN > 0 ? Math.round((completedN / (enrolledN + completedN)) * 10000) / 100 : 0,
    };
}
// ── Mandatory compliance ─────────────────────────────────────────────────────
export async function mandatoryCompliance(actor) {
    assertHrPermission(actor, 'hr.ld.view');
    const rows = await db('ld_programs as p')
        .join('ld_enrollments as e', 'e.program_id', 'p.id')
        .where({ 'p.college_id': actor.collegeId, 'p.is_mandatory': true })
        .whereIn('e.status', ['CONFIRMED', 'WAITLISTED', 'COMPLETED'])
        .groupBy('p.id', 'p.title', 'p.mandatory_due_date')
        .select('p.id as programId', 'p.title', 'p.mandatory_due_date as dueDate', db.raw('count(*) as assigned'), db.raw("sum(case when e.completion_status = 'COMPLETED' then 1 else 0 end) as completed"));
    const today = new Date().toISOString().slice(0, 10);
    return {
        programs: rows.map((r) => {
            const assigned = Number(r.assigned);
            const completed = Number(r.completed);
            return {
                programId: Number(r.programId), title: r.title, dueDate: r.dueDate,
                assigned, completed, overdue: r.dueDate && String(r.dueDate) < today ? assigned - completed : 0,
                complianceRate: assigned > 0 ? Math.round((completed / assigned) * 10000) / 100 : 0,
            };
        }),
    };
}
// ── Stable metric provider (for a future Analytics extension — §67) ──────────
export async function ldMetrics(actor) {
    assertHrPermission(actor, 'hr.ld.report');
    const cid = actor.collegeId;
    const scope = ldReportScope(actor);
    const enrJoin = (b) => {
        let q = b.join('employees as emp', 'emp.id', 'x.employee_id').where('x.college_id', cid);
        if (scope)
            q = q.whereIn('emp.department_id', scope);
        return q;
    };
    const [participation, hoursRow, completions, mandatory] = await Promise.all([
        enrJoin(db('ld_enrollments as x')).whereIn('x.status', ['CONFIRMED', 'COMPLETED']).countDistinct('x.employee_id as c').first(),
        enrJoin(db('ld_completions as x')).join('ld_programs as p', 'p.id', 'x.program_id').sum('p.duration_hours as s').first(),
        enrJoin(db('ld_completions as x')).count('x.id as c').first(),
        db('ld_development_needs').where({ college_id: cid }).where('status', 'COMPLETED').count('id as c').first(),
    ]);
    return {
        scope: scope ? 'department' : 'college',
        trainingParticipants: Number(participation?.c ?? 0),
        trainingHours: Number(hoursRow?.s ?? 0),
        completions: Number(completions?.c ?? 0),
        developmentNeedsClosed: Number(mandatory?.c ?? 0),
        note: 'Stable L&D provider contract; HR Analytics may consume these read-only.',
    };
}
// ── Reports & exports ────────────────────────────────────────────────────────
export async function certificateExpiry(actor, withinDays = 90) {
    assertHrPermission(actor, 'hr.ld.report');
    const today = new Date();
    const horizon = new Date(today.getTime() + withinDays * 86400000).toISOString().slice(0, 10);
    const rows = await db('ld_certificates as c')
        .join('employees as e', 'e.id', 'c.employee_id')
        .where('c.college_id', actor.collegeId)
        .whereNotNull('c.expires_on')
        .where('c.expires_on', '<=', horizon)
        .orderBy('c.expires_on')
        .select('c.id', 'c.title', 'c.expires_on', 'e.display_name', 'e.employee_number');
    const todayIso = today.toISOString().slice(0, 10);
    return {
        certificates: rows.map((r) => ({
            ...r,
            expiryStatus: String(r.expires_on) < todayIso ? 'EXPIRED' : 'EXPIRING',
        })),
    };
}
const EXPORTS = {
    participants: async (actor, programId) => {
        if (!programId)
            throw new AppError(400, 'programId required');
        const rows = await db('ld_enrollments as e').join('employees as emp', 'emp.id', 'e.employee_id')
            .where({ 'e.college_id': actor.collegeId, 'e.program_id': programId })
            .select('emp.employee_number', 'emp.display_name', 'e.status', 'e.completion_status');
        return { title: 'Program Participants', columns: ['Employee No', 'Name', 'Status', 'Completion'], rows: rows.map((r) => [String(r.employee_number), String(r.display_name), String(r.status), String(r.completion_status)]) };
    },
    'mandatory-compliance': async (actor) => {
        const data = await mandatoryCompliance(actor);
        return { title: 'Mandatory Training Compliance', columns: ['Program', 'Assigned', 'Completed', 'Compliance %'], rows: data.programs.map((p) => [String(p.title), p.assigned, p.completed, p.complianceRate]) };
    },
    'certificate-expiry': async (actor) => {
        const data = await certificateExpiry(actor, 365);
        return { title: 'Certificate Expiry', columns: ['Employee', 'Certificate', 'Expires', 'Status'], rows: data.certificates.map((c) => [String(c.display_name), String(c.title), String(c.expires_on), String(c.expiryStatus)]) };
    },
};
export async function exportReport(actor, report, format, programId) {
    assertHrPermission(actor, 'hr.ld.report');
    const builder = EXPORTS[report];
    if (!builder)
        throw new AppError(404, `Unknown L&D export: ${report}`);
    const table = await builder(actor, programId);
    const filename = buildExportFilename(`LD-${table.title}`, format);
    if (format === 'csv') {
        const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
        const body = [table.columns.map(esc).join(','), ...table.rows.map((r) => r.map(esc).join(','))].join('\n');
        return { contentType: 'text/csv', filename, body };
    }
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet(table.title.slice(0, 28));
    sheet.addRow(table.columns);
    for (const r of table.rows)
        sheet.addRow(r);
    return { contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename, body: Buffer.from(await wb.xlsx.writeBuffer()) };
}
export { hasHrPermission };
