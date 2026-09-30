import { z } from 'zod';
import { randomUUID, createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole } from '../../utils/permissions.js';
import { assertDocumentPermission } from './access.js';
import { ALLOWED_MIME_TYPES, MAX_DOCUMENT_BYTES } from './types.js';
export const uploadSchema = z.object({
    entityType: z.string().trim().min(1).max(96),
    entityId: z.number().int().positive(),
    category: z.string().trim().min(1).max(96),
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().min(1).max(128),
    contentBase64: z.string().min(1),
    description: z.string().trim().max(2000).optional().nullable(),
    expiryDate: z.string().trim().max(16).optional().nullable(),
}).strict();
function n(value) {
    return Number(value ?? 0);
}
function shape(row) {
    return Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v]));
}
function storageRoot() {
    return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../uploads/campus-os-documents');
}
function decodeAndValidate(input) {
    const extension = ALLOWED_MIME_TYPES[input.mimeType];
    if (!extension)
        throw new AppError(400, `Unsupported file type: ${input.mimeType}`);
    let buffer;
    try {
        buffer = Buffer.from(input.contentBase64, 'base64');
    }
    catch {
        throw new AppError(400, 'Invalid file content encoding');
    }
    if (buffer.length === 0)
        throw new AppError(400, 'Uploaded file is empty');
    if (buffer.length > MAX_DOCUMENT_BYTES) {
        throw new AppError(400, `File exceeds the maximum allowed size of ${MAX_DOCUMENT_BYTES / (1024 * 1024)}MB`);
    }
    const checksum = createHash('sha256').update(buffer).digest('hex');
    return { buffer, extension, checksum };
}
async function writeToDisk(actor, input, buffer, extension) {
    // storage_key is always server-generated — the client's filename is metadata only,
    // never used to build a filesystem path. This removes path traversal by construction.
    const relativeDir = path.join(String(actor.collegeId), input.entityType.replace(/[^a-zA-Z0-9_-]/g, '_'));
    const fileName = `${randomUUID()}${extension}`;
    const storageKey = path.join(relativeDir, fileName);
    const root = storageRoot();
    const fullDir = path.resolve(root, relativeDir);
    await mkdir(fullDir, { recursive: true });
    await writeFile(path.resolve(root, storageKey), buffer);
    return storageKey;
}
async function readFromDisk(storageKey) {
    const root = storageRoot();
    const full = path.resolve(root, storageKey);
    if (full !== root && !full.startsWith(`${root}${path.sep}`))
        throw new AppError(404, 'Document file not found');
    try {
        return await readFile(full);
    }
    catch {
        throw new AppError(404, 'Document file not found');
    }
}
function assertReadAccess(actor, doc) {
    if (isAdminRole(actor.role))
        return;
    if (actor.facultyUserId != null && Number(doc.uploaded_by_faculty_id) === actor.facultyUserId)
        return;
    if (actor.studentId != null && Number(doc.uploaded_by_student_id) === actor.studentId)
        return;
    assertDocumentPermission(actor, 'document.manage');
}
function assertOwnerOrAdmin(actor, doc) {
    if (isAdminRole(actor.role))
        return;
    if (actor.facultyUserId != null && Number(doc.uploaded_by_faculty_id) === actor.facultyUserId)
        return;
    if (actor.studentId != null && Number(doc.uploaded_by_student_id) === actor.studentId)
        return;
    throw new AppError(403, 'Only the uploader or an administrator can perform this action');
}
export async function uploadDocument(actor, input) {
    assertDocumentPermission(actor, 'document.upload');
    const { buffer, extension, checksum } = decodeAndValidate(input);
    const storageKey = await writeToDisk(actor, input, buffer, extension);
    return db.transaction(async (trx) => {
        const [id] = await trx('campus_documents').insert({
            college_id: actor.collegeId,
            entity_type: input.entityType,
            entity_id: input.entityId,
            category: input.category,
            original_filename: input.fileName,
            storage_key: storageKey,
            mime_type: input.mimeType,
            size_bytes: buffer.length,
            checksum_sha256: checksum,
            status: 'ACTIVE',
            version: 1,
            document_group_id: null,
            description: input.description ?? null,
            expiry_date: input.expiryDate ?? null,
            uploaded_by_faculty_id: actor.facultyUserId ?? null,
            uploaded_by_student_id: actor.studentId ?? null,
        });
        await trx('campus_documents').where({ id }).update({ document_group_id: n(id) });
        return getDocumentMetadata(actor, n(id), trx);
    });
}
export async function uploadNewVersion(actor, documentId, input) {
    assertDocumentPermission(actor, 'document.upload');
    const { buffer, extension, checksum } = decodeAndValidate(input);
    return db.transaction(async (trx) => {
        const previous = await trx('campus_documents').where({ id: documentId, college_id: actor.collegeId }).forUpdate().first();
        if (!previous)
            throw new AppError(404, 'Document not found');
        assertOwnerOrAdmin(actor, previous);
        if (previous.status === 'ARCHIVED')
            throw new AppError(400, 'Cannot version an archived document');
        const storageKey = await writeToDisk(actor, input, buffer, extension);
        const [newId] = await trx('campus_documents').insert({
            college_id: actor.collegeId,
            entity_type: previous.entity_type,
            entity_id: previous.entity_id,
            category: input.category,
            original_filename: input.fileName,
            storage_key: storageKey,
            mime_type: input.mimeType,
            size_bytes: buffer.length,
            checksum_sha256: checksum,
            status: 'ACTIVE',
            version: n(previous.version) + 1,
            document_group_id: n(previous.document_group_id),
            description: input.description ?? previous.description,
            expiry_date: input.expiryDate ?? previous.expiry_date,
            uploaded_by_faculty_id: actor.facultyUserId ?? null,
            uploaded_by_student_id: actor.studentId ?? null,
        });
        await trx('campus_documents').where({ id: documentId }).update({ status: 'SUPERSEDED', superseded_by_id: n(newId), updated_at: trx.fn.now() });
        return getDocumentMetadata(actor, n(newId), trx);
    });
}
export async function getDocumentMetadata(actor, documentId, trx = db) {
    const doc = await trx('campus_documents').where({ id: documentId, college_id: actor.collegeId }).first();
    if (!doc)
        throw new AppError(404, 'Document not found');
    assertReadAccess(actor, doc);
    const { storage_key, ...rest } = doc;
    return shape(rest);
}
export async function downloadDocument(actor, documentId) {
    const doc = await db('campus_documents').where({ id: documentId, college_id: actor.collegeId }).first();
    if (!doc)
        throw new AppError(404, 'Document not found');
    assertReadAccess(actor, doc);
    const buffer = await readFromDisk(String(doc.storage_key));
    const checksum = createHash('sha256').update(buffer).digest('hex');
    if (checksum !== doc.checksum_sha256) {
        throw new AppError(500, 'Stored document failed integrity verification');
    }
    const { storage_key, ...rest } = doc;
    return { metadata: shape(rest), buffer };
}
export async function archiveDocument(actor, documentId) {
    return db.transaction(async (trx) => {
        const doc = await trx('campus_documents').where({ id: documentId, college_id: actor.collegeId }).forUpdate().first();
        if (!doc)
            throw new AppError(404, 'Document not found');
        if (!isAdminRole(actor.role) &&
            !(actor.facultyUserId != null && Number(doc.uploaded_by_faculty_id) === actor.facultyUserId) &&
            !(actor.studentId != null && Number(doc.uploaded_by_student_id) === actor.studentId)) {
            assertDocumentPermission(actor, 'document.manage');
        }
        if (doc.status === 'ARCHIVED')
            return getDocumentMetadata(actor, documentId, trx);
        await trx('campus_documents').where({ id: documentId }).update({ status: 'ARCHIVED', updated_at: trx.fn.now() });
        return getDocumentMetadata(actor, documentId, trx);
    });
}
export async function listDocumentsForEntity(actor, entityType, entityId) {
    const rows = await db('campus_documents')
        .where({ college_id: actor.collegeId, entity_type: entityType, entity_id: entityId })
        .orderBy(['document_group_id', { column: 'version', order: 'desc' }]);
    const visible = rows.filter((row) => {
        try {
            assertReadAccess(actor, row);
            return true;
        }
        catch {
            return false;
        }
    });
    return visible.map(({ storage_key, ...rest }) => shape(rest));
}
