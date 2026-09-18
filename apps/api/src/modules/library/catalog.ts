import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertLibraryPermission } from './access.js';
import { recordLibraryAudit } from './audit.js';
import { getAvailabilityForCatalogItems } from './availability.js';
import type { LibraryActor } from './types.js';

type Row = Record<string, unknown>;

export function serializeCatalogItem(row: Row, availability?: Record<string, unknown>) {
  return {
    id: Number(row.id),
    title: row.title,
    isbn: row.isbn,
    authors: row.authors,
    publisher: row.publisher,
    edition: row.edition,
    publicationYear: row.publication_year != null ? Number(row.publication_year) : null,
    subjects: row.subjects,
    callNumber: row.call_number,
    description: row.description,
    defaultLocation: row.default_location,
    digitalLink: row.digital_link,
    status: row.status,
    availability: availability ?? null,
  };
}

export async function searchCatalog(
  collegeId: number,
  opts: { q?: string; limit?: number; offset?: number },
) {
  const limit = opts.limit ?? 30;
  const offset = opts.offset ?? 0;
  let query = db('library_catalog_items')
    .where({ college_id: collegeId, status: 'ACTIVE' })
    .orderBy('title');

  if (opts.q?.trim()) {
    const q = `%${opts.q.trim()}%`;
    query = query.where((b) => {
      b.where('title', 'like', q)
        .orWhere('authors', 'like', q)
        .orWhere('isbn', 'like', q)
        .orWhere('subjects', 'like', q)
        .orWhere('publisher', 'like', q)
        .orWhere('call_number', 'like', q);
    });
  }

  const rows = await query.limit(limit).offset(offset);
  const ids = rows.map((r) => Number(r.id));
  const availabilityMap = await getAvailabilityForCatalogItems(collegeId, ids);

  return rows.map((r) =>
    serializeCatalogItem(r, availabilityMap.get(Number(r.id)) ?? undefined),
  );
}

export async function getCatalogItem(collegeId: number, id: number) {
  const row = await db('library_catalog_items').where({ id, college_id: collegeId }).first();
  if (!row) throw new AppError(404, 'Catalog item not found');

  const availabilityMap = await getAvailabilityForCatalogItems(collegeId, [id]);
  const copies = await db('library_copies')
    .where({ catalog_item_id: id, college_id: collegeId })
    .whereNotIn('status', ['WITHDRAWN', 'LOST'])
    .select('id', 'accession_number', 'barcode', 'location', 'shelf', 'status');

  return {
    ...serializeCatalogItem(row, availabilityMap.get(id)),
    copies: copies.map((c) => ({
      id: Number(c.id),
      accessionNumber: c.accession_number,
      barcode: c.barcode,
      location: c.location,
      shelf: c.shelf,
      status: c.status,
    })),
  };
}

export async function createCatalogItem(
  actor: LibraryActor,
  body: {
    title: string;
    isbn?: string;
    authors?: string;
    publisher?: string;
    edition?: string;
    publicationYear?: number;
    subjects?: string;
    callNumber?: string;
    description?: string;
    defaultLocation?: string;
    digitalLink?: string;
  },
) {
  assertLibraryPermission(actor, 'library.catalog.manage');

  const [id] = await db('library_catalog_items').insert({
    college_id: actor.collegeId,
    title: body.title,
    isbn: body.isbn ?? null,
    authors: body.authors ?? null,
    publisher: body.publisher ?? null,
    edition: body.edition ?? null,
    publication_year: body.publicationYear ?? null,
    subjects: body.subjects ?? null,
    call_number: body.callNumber ?? null,
    description: body.description ?? null,
    default_location: body.defaultLocation ?? null,
    digital_link: body.digitalLink ?? null,
    status: 'ACTIVE',
  });

  await recordLibraryAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'CATALOG_CREATE',
    entityType: 'library_catalog_item',
    entityId: Number(id),
    afterState: body,
  });

  return getCatalogItem(actor.collegeId, Number(id));
}

export async function updateCatalogItem(actor: LibraryActor, id: number, body: Record<string, unknown>) {
  assertLibraryPermission(actor, 'library.catalog.manage');
  const row = await db('library_catalog_items').where({ id, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404, 'Catalog item not found');

  const updates: Record<string, unknown> = {};
  const map: Record<string, string> = {
    title: 'title',
    isbn: 'isbn',
    authors: 'authors',
    publisher: 'publisher',
    edition: 'edition',
    publicationYear: 'publication_year',
    subjects: 'subjects',
    callNumber: 'call_number',
    description: 'description',
    defaultLocation: 'default_location',
    digitalLink: 'digital_link',
    status: 'status',
  };
  for (const [k, col] of Object.entries(map)) {
    if (body[k] !== undefined) updates[col] = body[k];
  }

  if (Object.keys(updates).length) {
    await db('library_catalog_items').where({ id }).update(updates);
    await recordLibraryAudit({
      collegeId: actor.collegeId,
      actorId: actor.facultyUserId,
      action: 'CATALOG_UPDATE',
      entityType: 'library_catalog_item',
      entityId: id,
      beforeState: row,
      afterState: updates,
    });
  }

  return getCatalogItem(actor.collegeId, id);
}
