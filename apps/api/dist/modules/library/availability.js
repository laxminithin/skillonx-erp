import { db } from '../../db/index.js';
export async function getAvailabilityForCatalogItems(collegeId, catalogItemIds) {
    const map = new Map();
    if (!catalogItemIds.length)
        return map;
    const rows = (await db('library_copies')
        .where({ college_id: collegeId })
        .whereIn('catalog_item_id', catalogItemIds)
        .whereNotIn('status', ['WITHDRAWN'])
        .groupBy('catalog_item_id', 'status')
        .select('catalog_item_id', 'status')
        .count({ c: '*' }));
    for (const id of catalogItemIds) {
        map.set(id, { totalCopies: 0, availableCopies: 0, issuedCopies: 0, reservedCopies: 0 });
    }
    for (const row of rows) {
        const catalogId = Number(row.catalog_item_id);
        const count = Number(row.c);
        const entry = map.get(catalogId);
        entry.totalCopies += count;
        if (row.status === 'AVAILABLE')
            entry.availableCopies += count;
        if (row.status === 'ISSUED')
            entry.issuedCopies += count;
        if (row.status === 'RESERVED')
            entry.reservedCopies += count;
    }
    return map;
}
export async function getAvailability(collegeId, catalogItemId) {
    const map = await getAvailabilityForCatalogItems(collegeId, [catalogItemId]);
    return map.get(catalogItemId) ?? { totalCopies: 0, availableCopies: 0, issuedCopies: 0, reservedCopies: 0 };
}
