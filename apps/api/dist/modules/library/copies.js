import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertLibraryPermission } from './access.js';
import { recordLibraryAudit } from './audit.js';
export function serializeCopy(row, title) {
    return {
        id: Number(row.id),
        catalogItemId: Number(row.catalog_item_id),
        accessionNumber: row.accession_number,
        barcode: row.barcode,
        location: row.location,
        shelf: row.shelf,
        status: row.status,
        lastVerifiedAt: row.last_verified_at,
        title: title ?? null,
    };
}
export async function findCopyByBarcode(collegeId, barcode) {
    const row = await db('library_copies as c')
        .join('library_catalog_items as ci', 'ci.id', 'c.catalog_item_id')
        .where({ 'c.college_id': collegeId })
        .where((q) => {
        q.where('c.barcode', barcode).orWhere('c.accession_number', barcode);
    })
        .select('c.*', 'ci.title')
        .first();
    if (!row)
        throw new AppError(404, 'Copy not found');
    return serializeCopy(row, row.title);
}
export async function createCopy(actor, body) {
    assertLibraryPermission(actor, 'library.catalog.manage');
    const catalog = await db('library_catalog_items')
        .where({ id: body.catalogItemId, college_id: actor.collegeId })
        .first();
    if (!catalog)
        throw new AppError(404, 'Catalog item not found');
    const dupAcc = await db('library_copies')
        .where({ college_id: actor.collegeId, accession_number: body.accessionNumber })
        .first();
    if (dupAcc)
        throw new AppError(409, 'Accession number already exists');
    const dupBar = await db('library_copies')
        .where({ college_id: actor.collegeId, barcode: body.barcode })
        .first();
    if (dupBar)
        throw new AppError(409, 'Barcode already exists');
    const [id] = await db('library_copies').insert({
        college_id: actor.collegeId,
        catalog_item_id: body.catalogItemId,
        accession_number: body.accessionNumber,
        barcode: body.barcode,
        location: body.location ?? catalog.default_location ?? null,
        shelf: body.shelf ?? null,
        status: 'AVAILABLE',
    });
    await recordLibraryAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'COPY_CREATE',
        entityType: 'library_copy',
        entityId: Number(id),
        afterState: body,
    });
    const row = await db('library_copies').where({ id }).first();
    return serializeCopy(row, catalog.title);
}
export async function listInventory(actor, opts) {
    let query = db('library_copies as c')
        .join('library_catalog_items as ci', 'ci.id', 'c.catalog_item_id')
        .where('c.college_id', actor.collegeId)
        .select('c.*', 'ci.title')
        .orderBy('c.accession_number');
    if (opts.status)
        query = query.where('c.status', opts.status);
    if (opts.q) {
        const q = `%${opts.q}%`;
        query = query.where((b) => {
            b.where('c.accession_number', 'like', q)
                .orWhere('c.barcode', 'like', q)
                .orWhere('ci.title', 'like', q);
        });
    }
    const rows = await query.limit(opts.limit ?? 100).offset(opts.offset ?? 0);
    return rows.map((r) => serializeCopy(r, r.title));
}
export async function updateCopyStatus(actor, copyId, status, reason) {
    const row = await db('library_copies').where({ id: copyId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Copy not found');
    await db('library_copies').where({ id: copyId }).update({ status });
    await recordLibraryAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'COPY_STATUS_CHANGE',
        entityType: 'library_copy',
        entityId: copyId,
        beforeState: { status: row.status },
        afterState: { status },
        reason,
    });
    return serializeCopy({ ...row, status });
}
