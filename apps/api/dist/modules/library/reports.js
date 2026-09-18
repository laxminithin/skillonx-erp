import { db } from '../../db/index.js';
import { collegeTimezone, todayInTimezone } from '../timetable/time.js';
export async function libraryDashboard(actor) {
    const collegeId = actor.collegeId;
    const college = await db('colleges').where({ id: collegeId }).select('timezone').first();
    const tz = collegeTimezone(college?.timezone);
    const today = todayInTimezone(tz);
    const [issuedToday, returnsToday, overdueLoans, activeReservations, availableCopies, outstandingFines] = await Promise.all([
        db('library_loans')
            .where({ college_id: collegeId })
            .whereRaw('DATE(issued_at) = ?', [today])
            .count({ c: '*' })
            .first(),
        db('library_loans')
            .where({ college_id: collegeId, status: 'RETURNED' })
            .whereRaw('DATE(returned_at) = ?', [today])
            .count({ c: '*' })
            .first(),
        db('library_loans').where({ college_id: collegeId, status: 'OVERDUE' }).count({ c: '*' }).first(),
        db('library_reservations')
            .where({ college_id: collegeId })
            .whereIn('status', ['ACTIVE', 'READY'])
            .count({ c: '*' })
            .first(),
        db('library_copies').where({ college_id: collegeId, status: 'AVAILABLE' }).count({ c: '*' }).first(),
        db('library_fines')
            .where({ college_id: collegeId })
            .whereIn('status', ['DUE', 'PARTIALLY_PAID'])
            .select(db.raw('COALESCE(SUM(outstanding_amount), 0) as total'))
            .first(),
    ]);
    return {
        booksIssuedToday: Number(issuedToday?.c ?? 0),
        returnsToday: Number(returnsToday?.c ?? 0),
        overdueLoans: Number(overdueLoans?.c ?? 0),
        activeReservations: Number(activeReservations?.c ?? 0),
        availableCopies: Number(availableCopies?.c ?? 0),
        outstandingFines: Number(outstandingFines?.total ?? 0).toFixed(2),
    };
}
export async function overdueReport(actor, filters) {
    let query = db('library_loans as l')
        .join('library_members as m', 'm.id', 'l.member_id')
        .join('library_copies as c', 'c.id', 'l.copy_id')
        .join('library_catalog_items as ci', 'ci.id', 'l.catalog_item_id')
        .leftJoin('students as s', 's.id', 'm.student_id')
        .leftJoin('faculty_users as f', 'f.id', 'm.faculty_id')
        .leftJoin('library_fines as lf', function join() {
        this.on('lf.loan_id', 'l.id').andOn('lf.fine_type', db.raw('?', ['OVERDUE']));
    })
        .where('l.college_id', actor.collegeId)
        .where('l.status', 'OVERDUE')
        .select('l.*', 'ci.title', 'c.accession_number', db.raw('COALESCE(s.name, f.name) as member_name'), db.raw('COALESCE(s.usn, f.employee_id) as member_identifier'), 'm.member_type', 'lf.outstanding_amount as fine_amount')
        .orderBy('l.due_at');
    if (filters.memberType)
        query = query.where('m.member_type', filters.memberType);
    const rows = await query.limit(500);
    const college = await db('colleges').where({ id: actor.collegeId }).select('timezone').first();
    const tz = collegeTimezone(college?.timezone);
    const today = todayInTimezone(tz);
    const todayMs = new Date(`${today}T00:00:00`).getTime();
    return rows
        .map((r) => {
        const dueMs = new Date(r.due_at).getTime();
        const daysOverdue = Math.max(0, Math.floor((todayMs - dueMs) / 86400000));
        return {
            memberName: r.member_name,
            memberIdentifier: r.member_identifier,
            memberType: r.member_type,
            title: r.title,
            accessionNumber: r.accession_number,
            dueDate: r.due_at,
            daysOverdue,
            fine: r.fine_amount ?? '0.00',
        };
    })
        .filter((r) => !filters.daysOverdue || r.daysOverdue >= filters.daysOverdue);
}
export async function mostBorrowedReport(actor, limit = 20) {
    const rows = await db('library_loans as l')
        .join('library_catalog_items as ci', 'ci.id', 'l.catalog_item_id')
        .where('l.college_id', actor.collegeId)
        .groupBy('l.catalog_item_id', 'ci.title')
        .select('ci.title', 'l.catalog_item_id')
        .count({ borrowCount: '*' })
        .orderBy('borrowCount', 'desc')
        .limit(limit);
    return rows.map((r) => ({
        catalogItemId: Number(r.catalog_item_id),
        title: r.title,
        borrowCount: Number(r.borrowCount),
    }));
}
export async function dailyCirculationReport(actor, date) {
    const issued = await db('library_loans as l')
        .join('library_catalog_items as ci', 'ci.id', 'l.catalog_item_id')
        .join('library_members as m', 'm.id', 'l.member_id')
        .leftJoin('students as s', 's.id', 'm.student_id')
        .where('l.college_id', actor.collegeId)
        .whereRaw('DATE(l.issued_at) = ?', [date])
        .select('l.issued_at', 'ci.title', db.raw('COALESCE(s.usn, m.membership_number) as member_id'))
        .orderBy('l.issued_at');
    const returned = await db('library_loans as l')
        .join('library_catalog_items as ci', 'ci.id', 'l.catalog_item_id')
        .where('l.college_id', actor.collegeId)
        .where('l.status', 'RETURNED')
        .whereRaw('DATE(l.returned_at) = ?', [date])
        .select('l.returned_at', 'ci.title')
        .orderBy('l.returned_at');
    return { date, issued, returned };
}
