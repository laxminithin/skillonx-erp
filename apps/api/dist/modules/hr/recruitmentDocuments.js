import { randomBytes } from 'node:crypto';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertHrPermission, hasHrPermission } from './access.js';
import { recordHrAudit } from './audit.js';
function storageKey() {
    return `rec_${Date.now()}_${randomBytes(8).toString('hex')}`;
}
export function serializeDocument(row, includeBody = false) {
    const base = {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        candidateId: Number(row.candidate_id),
        applicationId: row.application_id != null ? Number(row.application_id) : null,
        docType: row.doc_type,
        fileName: row.file_name,
        contentType: row.content_type,
        storageKey: row.storage_key,
        uploadedByType: row.uploaded_by_type,
        uploadedById: row.uploaded_by_id != null ? Number(row.uploaded_by_id) : null,
        isSensitive: Boolean(row.is_sensitive),
        fields: row.fields_json
            ? typeof row.fields_json === 'string'
                ? JSON.parse(String(row.fields_json))
                : row.fields_json
            : null,
        createdAt: row.created_at,
    };
    if (!includeBody)
        return base;
    return {
        ...base,
        bodyText: row.body_text ?? null,
        contentBase64: row.content_base64 ?? null,
    };
}
export async function uploadDocument(actor, input) {
    assertHrPermission(actor, 'hr.recruitment.manage');
    const candidate = await db('hr_recruitment_candidates')
        .where({ id: input.candidateId, college_id: actor.collegeId })
        .first();
    if (!candidate)
        throw new AppError(404, 'Candidate not found');
    if (input.applicationId) {
        const app = await db('hr_recruitment_applications')
            .where({ id: input.applicationId, college_id: actor.collegeId, candidate_id: input.candidateId })
            .first();
        if (!app)
            throw new AppError(404, 'Application not found');
    }
    const [id] = await db('hr_recruitment_documents').insert({
        college_id: actor.collegeId,
        candidate_id: input.candidateId,
        application_id: input.applicationId ?? null,
        doc_type: input.docType,
        file_name: input.fileName ?? null,
        content_type: input.contentType ?? 'text/plain',
        storage_key: storageKey(),
        body_text: input.bodyText ?? null,
        content_base64: input.contentBase64 ?? null,
        fields_json: input.fields ? JSON.stringify(input.fields) : null,
        uploaded_by_type: 'HR',
        uploaded_by_id: actor.facultyUserId,
        is_sensitive: Boolean(input.isSensitive),
    });
    const row = await db('hr_recruitment_documents').where({ id }).first();
    await recordHrAudit({
        actor,
        action: 'RECRUITMENT_DOCUMENT_UPLOADED',
        entityType: 'hr_recruitment_documents',
        entityId: id,
        after: serializeDocument(row),
    });
    return serializeDocument(row);
}
export async function uploadCandidateDocument(collegeId, candidateId, input) {
    const [id] = await db('hr_recruitment_documents').insert({
        college_id: collegeId,
        candidate_id: candidateId,
        application_id: input.applicationId ?? null,
        doc_type: input.docType,
        file_name: input.fileName ?? null,
        content_type: input.contentType ?? 'text/plain',
        storage_key: storageKey(),
        body_text: input.bodyText ?? null,
        content_base64: input.contentBase64 ?? null,
        fields_json: input.fields ? JSON.stringify(input.fields) : null,
        uploaded_by_type: 'CANDIDATE',
        uploaded_by_id: candidateId,
        is_sensitive: Boolean(input.isSensitive),
    });
    return serializeDocument((await db('hr_recruitment_documents').where({ id }).first()));
}
export async function getDocument(actor, documentId) {
    const row = await db('hr_recruitment_documents').where({ id: documentId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Document not found');
    if (row.is_sensitive && !hasHrPermission(actor, 'hr.recruitment.manage') && !hasHrPermission(actor, 'hr.recruitment.offer')) {
        throw new AppError(403, 'Sensitive document access denied');
    }
    assertHrPermission(actor, 'hr.recruitment.view');
    return serializeDocument(row, true);
}
export async function getCandidateDocument(collegeId, candidateId, documentId) {
    const row = await db('hr_recruitment_documents')
        .where({ id: documentId, college_id: collegeId, candidate_id: candidateId })
        .first();
    if (!row)
        throw new AppError(404, 'Document not found');
    return serializeDocument(row, true);
}
export async function listCandidateDocuments(actor, candidateId) {
    assertHrPermission(actor, 'hr.recruitment.view');
    const rows = await db('hr_recruitment_documents')
        .where({ college_id: actor.collegeId, candidate_id: candidateId })
        .orderBy('id', 'desc');
    return rows.map((r) => serializeDocument(r, false));
}
export async function storeOfferLetterDocument(params) {
    const [id] = await db('hr_recruitment_documents').insert({
        college_id: params.collegeId,
        candidate_id: params.candidateId,
        application_id: params.applicationId,
        doc_type: 'OFFER_LETTER',
        file_name: 'offer_letter.txt',
        content_type: 'text/plain',
        storage_key: storageKey(),
        body_text: params.bodyText,
        fields_json: JSON.stringify(params.fields),
        uploaded_by_type: 'HR',
        uploaded_by_id: params.uploadedById,
        is_sensitive: true,
    });
    return id;
}
