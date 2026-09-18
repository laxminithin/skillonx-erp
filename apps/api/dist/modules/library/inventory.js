import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertLibraryPermission } from './access.js';
import { recordLibraryAudit } from './audit.js';
import { findCopyByBarcode } from './copies.js';
export async function startInventorySession(actor, name) {
    assertLibraryPermission(actor, 'library.inventory.manage');
    const [id] = await db('library_inventory_sessions').insert({
        college_id: actor.collegeId,
        name,
        status: 'OPEN',
        started_by: actor.facultyUserId,
        started_at: new Date(),
    });
    return db('library_inventory_sessions').where({ id }).first();
}
export async function scanInventoryCopy(actor, sessionId, barcode) {
    assertLibraryPermission(actor, 'library.inventory.manage');
    const session = await db('library_inventory_sessions')
        .where({ id: sessionId, college_id: actor.collegeId, status: 'OPEN' })
        .first();
    if (!session)
        throw new AppError(404, 'Inventory session not found');
    let copyId = null;
    let scanStatus = 'FOUND';
    try {
        const copy = await findCopyByBarcode(actor.collegeId, barcode);
        copyId = copy.id;
        await db('library_copies').where({ id: copyId }).update({ last_verified_at: new Date() });
    }
    catch {
        scanStatus = 'MISSING';
    }
    const [scanId] = await db('library_inventory_scans').insert({
        session_id: sessionId,
        copy_id: copyId,
        barcode,
        scan_status: scanStatus,
        scanned_by: actor.facultyUserId,
        scanned_at: new Date(),
    });
    return { scanId: Number(scanId), scanStatus, copyId };
}
export async function closeInventorySession(actor, sessionId) {
    assertLibraryPermission(actor, 'library.inventory.manage');
    await db('library_inventory_sessions')
        .where({ id: sessionId, college_id: actor.collegeId })
        .update({ status: 'CLOSED', closed_at: new Date() });
    await recordLibraryAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'INVENTORY_CLOSE',
        entityType: 'library_inventory_session',
        entityId: sessionId,
    });
    return { closed: true };
}
