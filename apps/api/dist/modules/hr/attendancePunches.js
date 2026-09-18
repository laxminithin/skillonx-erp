import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertHrPermission } from './access.js';
import { recordHrAudit } from './audit.js';
export async function importPunch(collegeId, input) {
    const emp = await db('employees').where({ id: input.employeeId, college_id: collegeId }).first();
    if (!emp)
        throw new AppError(404, 'Employee not found');
    if (input.externalEventId) {
        const dup = await db('employee_attendance_punches')
            .where({ college_id: collegeId, external_event_id: input.externalEventId })
            .first();
        if (dup)
            return { id: Number(dup.id), duplicate: true };
    }
    const [id] = await db('employee_attendance_punches').insert({
        college_id: collegeId,
        employee_id: input.employeeId,
        punch_at: input.punchAt,
        punch_type: input.punchType ?? null,
        source: input.source ?? 'DEVICE_IMPORT',
        device_id: input.deviceId ?? null,
        external_event_id: input.externalEventId ?? null,
        imported_at: db.fn.now(),
        raw_metadata: input.rawMetadata ? JSON.stringify(input.rawMetadata) : null,
    });
    return { id: Number(id), duplicate: false };
}
export async function importPunchesBatch(actor, punches) {
    assertHrPermission(actor, 'hr.attendance.manage');
    let imported = 0;
    let duplicates = 0;
    for (const p of punches) {
        const result = await importPunch(actor.collegeId, p);
        if (result.duplicate)
            duplicates++;
        else
            imported++;
    }
    return { imported, duplicates };
}
export async function recordManualPunch(actor, input) {
    assertHrPermission(actor, 'hr.attendance.manage');
    const result = await importPunch(actor.collegeId, {
        ...input,
        source: 'MANUAL',
    });
    await recordHrAudit({ actor, action: 'PUNCH_RECORDED', entityType: 'employee_attendance_punches', entityId: result.id });
    return result;
}
