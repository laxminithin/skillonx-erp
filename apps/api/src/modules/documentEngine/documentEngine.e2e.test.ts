import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createHash } from 'node:crypto';
import type { z } from 'zod';
import { db } from '../../db/index.js';
import * as docs from './service.js';
import type { DocumentActor } from './types.js';
import { MAX_DOCUMENT_BYTES } from './types.js';

async function setup(tag = `D${Date.now()}${Math.floor(Math.random() * 10000)}`) {
  const [collegeId] = await db('colleges').insert({ name: `Document College ${tag}`, code: `DC${tag}`.slice(0, 60) });
  const [otherCollegeId] = await db('colleges').insert({ name: `Other Document College ${tag}`, code: `OD${tag}`.slice(0, 60) });
  const [deptId] = await db('departments').insert({ college_id: collegeId, name: 'Records', code: `RD${tag}`.slice(0, 60) });
  const [uploaderId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Uploader', email: `doc.up.${tag}@test.edu`, password_hash: 'x', role: 'FACULTY', is_active: true });
  const [otherFacultyId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Other Faculty', email: `doc.other.${tag}@test.edu`, password_hash: 'x', role: 'FACULTY', is_active: true });
  const [adminId] = await db('faculty_users').insert({ college_id: collegeId, department_id: deptId, name: 'Doc Admin', email: `doc.admin.${tag}@test.edu`, password_hash: 'x', role: 'COLLEGE_ADMIN', is_active: true });
  const [crossAdminId] = await db('faculty_users').insert({ college_id: otherCollegeId, name: 'Cross Admin', email: `doc.cross.${tag}@test.edu`, password_hash: 'x', role: 'COLLEGE_ADMIN', is_active: true });

  const uploader: DocumentActor = { facultyUserId: Number(uploaderId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'FACULTY' };
  const otherFaculty: DocumentActor = { facultyUserId: Number(otherFacultyId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'FACULTY' };
  const admin: DocumentActor = { facultyUserId: Number(adminId), collegeId: Number(collegeId), departmentId: Number(deptId), role: 'COLLEGE_ADMIN' };
  const cross: DocumentActor = { facultyUserId: Number(crossAdminId), collegeId: Number(otherCollegeId), departmentId: null, role: 'COLLEGE_ADMIN' };
  return { uploader, otherFaculty, admin, cross, tag };
}

function textUpload(overrides: Partial<z.infer<typeof docs.uploadSchema>> = {}) {
  const body = Buffer.from('Campus OS Phase 0 evidence file contents', 'utf8');
  return {
    entityType: 'TEST_EVIDENCE',
    entityId: 1,
    category: 'GENERAL',
    fileName: 'evidence.txt',
    mimeType: 'text/plain',
    contentBase64: body.toString('base64'),
    ...overrides,
  };
}

describe('Campus OS Phase 0: shared Document / Evidence storage engine', () => {
  it('accepts an allowed upload, computes checksum, and round-trips content + integrity', async () => {
    const c = await setup();
    const uploaded = await docs.uploadDocument(c.uploader, textUpload({ entityId: 10 }));
    assert.equal(uploaded.status, 'ACTIVE');
    assert.equal(uploaded.version, 1);
    assert.ok(uploaded.checksumSha256);
    assert.equal((uploaded as any).storageKey, undefined, 'storage key must never be exposed in metadata responses');

    const expectedChecksum = createHash('sha256').update(Buffer.from('Campus OS Phase 0 evidence file contents', 'utf8')).digest('hex');
    assert.equal(uploaded.checksumSha256, expectedChecksum);

    const { metadata, buffer } = await docs.downloadDocument(c.uploader, Number(uploaded.id));
    assert.equal(buffer.toString('utf8'), 'Campus OS Phase 0 evidence file contents');
    assert.equal(metadata.id, uploaded.id);
  });

  it('rejects a disallowed MIME type', async () => {
    const c = await setup();
    await assert.rejects(
      () => docs.uploadDocument(c.uploader, textUpload({ entityId: 11, mimeType: 'application/x-msdownload', fileName: 'evil.exe' })),
      /Unsupported file type/,
    );
  });

  it('rejects a file over the size limit', async () => {
    const c = await setup();
    const oversized = Buffer.alloc(MAX_DOCUMENT_BYTES + 1024, 1).toString('base64');
    await assert.rejects(
      () => docs.uploadDocument(c.uploader, textUpload({ entityId: 12, contentBase64: oversized })),
      /exceeds the maximum allowed size/,
    );
  });

  it('rejects an empty file', async () => {
    const c = await setup();
    await assert.rejects(
      () => docs.uploadDocument(c.uploader, textUpload({ entityId: 13, contentBase64: '' })),
      /required|empty/i,
    );
  });

  it('enforces tenant isolation on metadata, download, and listing', async () => {
    const c = await setup();
    const uploaded = await docs.uploadDocument(c.uploader, textUpload({ entityId: 14 }));
    await assert.rejects(() => docs.getDocumentMetadata(c.cross, Number(uploaded.id)), /not found/);
    await assert.rejects(() => docs.downloadDocument(c.cross, Number(uploaded.id)), /not found/);
    const crossList = await docs.listDocumentsForEntity(c.cross, 'TEST_EVIDENCE', 14);
    assert.equal(crossList.length, 0);
  });

  it('denies download to a non-owner, non-admin within the same college', async () => {
    const c = await setup();
    const uploaded = await docs.uploadDocument(c.uploader, textUpload({ entityId: 15 }));
    await assert.rejects(() => docs.downloadDocument(c.otherFaculty, Number(uploaded.id)), /permission/);
    // Owner and admin both succeed.
    await docs.downloadDocument(c.uploader, Number(uploaded.id));
    await docs.downloadDocument(c.admin, Number(uploaded.id));
  });

  it('supersedes an old version when a new version is uploaded, and only owner/admin may version', async () => {
    const c = await setup();
    const v1 = await docs.uploadDocument(c.uploader, textUpload({ entityId: 16 }));
    await assert.rejects(
      () => docs.uploadNewVersion(c.otherFaculty, Number(v1.id), textUpload({ entityId: 16, category: 'REVISED' })),
      /Only the uploader or an administrator/,
    );
    const v2 = await docs.uploadNewVersion(c.uploader, Number(v1.id), textUpload({ entityId: 16, category: 'REVISED' }));
    assert.equal(v2.version, 2);
    assert.equal(v2.documentGroupId, v1.documentGroupId);

    const v1AfterSupersede = await docs.getDocumentMetadata(c.uploader, Number(v1.id));
    assert.equal(v1AfterSupersede.status, 'SUPERSEDED');
    assert.equal(Number(v1AfterSupersede.supersededById), Number(v2.id));

    const list = await docs.listDocumentsForEntity(c.uploader, 'TEST_EVIDENCE', 16);
    assert.equal(list.length, 2);
    // Old version content is still retrievable (evidence is never silently lost).
    const oldContent = await docs.downloadDocument(c.uploader, Number(v1.id));
    assert.equal(oldContent.buffer.toString('utf8'), 'Campus OS Phase 0 evidence file contents');
  });

  it('archives (soft-deletes) rather than destroying evidence', async () => {
    const c = await setup();
    const uploaded = await docs.uploadDocument(c.uploader, textUpload({ entityId: 17 }));
    const archived = await docs.archiveDocument(c.uploader, Number(uploaded.id));
    assert.equal(archived.status, 'ARCHIVED');
    // Still readable by the owner after archival — evidence is retained, not deleted.
    const stillThere = await docs.getDocumentMetadata(c.uploader, Number(uploaded.id));
    assert.equal(stillThere.status, 'ARCHIVED');
    const stillDownloadable = await docs.downloadDocument(c.uploader, Number(uploaded.id));
    assert.equal(stillDownloadable.buffer.length > 0, true);
    await assert.rejects(
      () => docs.uploadNewVersion(c.uploader, Number(uploaded.id), textUpload({ entityId: 17 })),
      /Cannot version an archived document/,
    );
  });

  it('requires document.upload permission and rejects unauthenticated-style low-privilege actors', async () => {
    const c = await setup();
    const noPermission: DocumentActor = { facultyUserId: c.uploader.facultyUserId, collegeId: c.uploader.collegeId, departmentId: c.uploader.departmentId, role: 'STUDENT_HELPER_UNKNOWN_ROLE' };
    await assert.rejects(() => docs.uploadDocument(noPermission, textUpload({ entityId: 18 })), /permission/);
  });
});
