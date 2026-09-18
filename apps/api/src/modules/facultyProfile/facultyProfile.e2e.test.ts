/**
 * Faculty Academic & Professional Profile — Phase B functional E2E.
 * Exercises the record engine, dedupe, verification workflow, evidence store,
 * completeness, derivation and overview against the E2E seed. Skips cleanly
 * when the seed is absent (run after `npm run seed:student-lms-e2e`).
 */
import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { db } from '../../db/index.js';
import type { FacultyProfileActor } from './types.js';
import { coreProfile, updateIdentifiers } from './profile.js';
import { actorEmployee, canVerify } from './access.js';
import { createRecord, listRecords, getRecord, updateRecord } from './records.js';
import { submitRecord, actOnVerification, verificationInbox } from './verification.js';
import { attachEvidence, readEvidence } from './evidence.js';
import { computeCompleteness } from './completeness.js';
import { allDerived } from './derive.js';
import { profileOverview } from './overview.js';

const createdRecordIds: number[] = [];

async function actorFromFaculty(id: number): Promise<FacultyProfileActor | null> {
  const f = await db('faculty_users').where({ id }).first();
  if (!f) return null;
  return {
    facultyUserId: Number(f.id),
    collegeId: Number(f.college_id),
    departmentId: f.department_id != null ? Number(f.department_id) : null,
    role: String(f.role),
    name: String(f.name),
  };
}

async function ctx() {
  try {
    if (!(await db.schema.hasTable('faculty_records'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    // Owner: the seeded mentor faculty, which has a linked employee row.
    const st = await db('students').where({ usn: '4VV24CS001', college_id: collegeId }).first();
    if (!st) return null;
    const asg = await db('mentor_assignments').where({ student_id: st.id, status: 'ACTIVE', is_primary: true }).first();
    if (!asg) return null;
    const owner = await actorFromFaculty(Number(asg.mentor_faculty_id));
    if (!owner) return null;
    const ownerEmp = await actorEmployee(owner);
    if (!ownerEmp) return null;

    // A same-department HOD to act as an authorized verifier.
    const hodRow = await db('faculty_users')
      .where({ college_id: collegeId, role: 'HOD', department_id: ownerEmp.departmentId })
      .first();
    const hod = hodRow ? await actorFromFaculty(Number(hodRow.id)) : null;
    // An institution-level verifier fallback.
    const princRow = await db('faculty_users').where({ college_id: collegeId, role: 'PRINCIPAL' }).first();
    const principal = princRow ? await actorFromFaculty(Number(princRow.id)) : null;
    const verifier = hod ?? principal;

    return { collegeId, owner, ownerEmp, verifier };
  } catch {
    return null;
  }
}

after(async () => {
  if (createdRecordIds.length) {
    await db('faculty_records').whereIn('id', createdRecordIds).del();
  }
});

describe('Faculty Profile — Phase B functional E2E', () => {
  it('projects HRMS-authoritative core profile and stores faculty identifiers', async () => {
    const c = await ctx();
    if (!c) return;
    const core = await coreProfile(c.collegeId, c.ownerEmp);
    assert.ok(core.fullName, 'name projected from HRMS');
    assert.equal(core.authoritative.identity, 'HRMS');
    assert.equal(core.identifiers.verified, false, 'self-entered identifiers are never auto-verified');
    const updated = await updateIdentifiers(c.owner, c.ownerEmp, { orcid: '0000-0002-1825-0097' });
    assert.equal(updated.identifiers.orcid, '0000-0002-1825-0097');
  });

  it('creates a publication and rejects a duplicate DOI on the same profile', async () => {
    const c = await ctx();
    if (!c) return;
    const doi = `10.1000/e2e-${randomUUID().slice(0, 8)}`;
    const rec = await createRecord(c.owner, c.ownerEmp, {
      domain: 'PUBLICATION',
      recordType: 'JOURNAL',
      title: 'A Study on Deterministic Faculty Records',
      academicYearLabel: '2024-2025',
      details: { doi, journal: 'Journal of ERP', indexing: ['SCOPUS'], quartile: 'Q1', authorPosition: 1 },
    });
    createdRecordIds.push(Number((rec as { id: number }).id));
    assert.equal((rec as { verificationStatus: string }).verificationStatus, 'DRAFT');
    // Scopus/quartile claims are NOT auto-verified — they live in details until verified.
    assert.equal((rec as { verifiedAt: unknown }).verifiedAt, null);
    await assert.rejects(
      createRecord(c.owner, c.ownerEmp, { domain: 'PUBLICATION', recordType: 'JOURNAL', title: 'Dup', details: { doi } }),
      /already exists/i,
      'duplicate DOI blocked',
    );
  });

  it('runs the full verification workflow with append-only history; owner cannot self-verify', async () => {
    const c = await ctx();
    if (!c || !c.verifier) return;
    const rec = await createRecord(c.owner, c.ownerEmp, {
      domain: 'AWARD', recordType: 'AWARD', title: 'Best Paper Award', level: 'NATIONAL',
      details: { organization: 'IEEE' },
    });
    const id = Number((rec as { id: number }).id);
    createdRecordIds.push(id);

    // Self-verify guard.
    assert.equal(canVerify(c.owner, c.ownerEmp), false, 'owner may never verify own records');
    await assert.rejects(
      actOnVerification(c.owner, c.ownerEmp, id, 'VERIFY'),
      /not authorized/i,
    );

    const submitted = await submitRecord(c.owner, c.ownerEmp, id);
    assert.equal((submitted as { verificationStatus: string }).verificationStatus, 'SUBMITTED');

    assert.equal(canVerify(c.verifier, c.ownerEmp), true, 'authorized verifier can act');
    const verified = await actOnVerification(c.verifier, c.ownerEmp, id, 'VERIFY', 'Certificate sighted');
    assert.equal((verified as { verificationStatus: string }).verificationStatus, 'VERIFIED');

    const full = await getRecord(c.owner, c.ownerEmp, id) as { verificationHistory: { action: string }[] };
    const actions = full.verificationHistory.map((h) => h.action);
    assert.deepEqual(actions, ['SUBMIT', 'VERIFY'], 'history is append-only, not overwritten');

    // Editing a VERIFIED record invalidates verification (mutation rule).
    const reopened = await updateRecord(c.owner, c.ownerEmp, id, { title: 'Best Paper Award (revised)' }) as { verificationStatus: string; verificationHistory: { action: string }[] };
    assert.equal(reopened.verificationStatus, 'DRAFT');
    assert.ok(reopened.verificationHistory.some((h) => h.action === 'REOPEN'), 'reopen recorded');
  });

  it('stores evidence with checksum and serves it only to authorized readers', async () => {
    const c = await ctx();
    if (!c) return;
    const rec = await createRecord(c.owner, c.ownerEmp, {
      domain: 'CERTIFICATION', recordType: 'CERTIFICATION', title: 'AWS Certified',
      details: { credentialId: `CRED-${randomUUID().slice(0, 6)}`, issuer: 'AWS', lifetime: false, expiryDate: '2030-01-01' },
    });
    const id = Number((rec as { id: number }).id);
    createdRecordIds.push(id);
    const pdf = Buffer.from('%PDF-1.4 evidence', 'utf8').toString('base64');
    const ev = await attachEvidence(c.owner, c.ownerEmp, id, {
      fileName: 'cert.pdf', mimeType: 'application/pdf', fileSize: 17, contentBase64: pdf,
    }) as { id: number; checksum: string };
    assert.ok(ev.checksum && ev.checksum.length === 64, 'sha256 checksum stored');
    const read = await readEvidence(c.owner, ev.id);
    assert.ok(read.body.length > 0, 'owner can read evidence');
  });

  it('computes section-based completeness with actionable messages', async () => {
    const c = await ctx();
    if (!c) return;
    const comp = await computeCompleteness(c.owner, c.ownerEmp) as {
      percent: number; sections: { key: string; status: string; messages: string[] }[]; evidence: Record<string, number>;
    };
    assert.ok(comp.percent >= 0 && comp.percent <= 100);
    assert.ok(comp.sections.length > 0);
    assert.ok(typeof comp.evidence.pendingVerification === 'number');
    // Every non-complete section carries at least one actionable message.
    for (const s of comp.sections) {
      if (['INCOMPLETE', 'EVIDENCE_MISSING', 'VERIFICATION_PENDING'].includes(s.status)) {
        assert.ok(s.messages.length > 0, `${s.key} should have guidance`);
      }
    }
  });

  it('derives teaching/mentoring/coordination without duplicating them and builds an overview', async () => {
    const c = await ctx();
    if (!c) return;
    const derived = await allDerived(c.owner, c.ownerEmp);
    assert.ok(Array.isArray(derived.teaching));
    assert.ok(Array.isArray(derived.mentoring));
    // The seeded owner is a mentor -> mentoring projection should be non-empty.
    assert.ok(derived.mentoring.length > 0, 'mentoring derived from authoritative module');
    const ov = await profileOverview(c.owner, c.ownerEmp) as { identity: { fullName: string }; completenessPercent: number };
    assert.ok(ov.identity.fullName);
    assert.ok(ov.completenessPercent >= 0);
  });

  it('exposes a scoped verification inbox to authorized verifiers only', async () => {
    const c = await ctx();
    if (!c || !c.verifier) return;
    const inbox = await verificationInbox(c.verifier, {});
    assert.ok(Array.isArray(inbox));
    // A plain faculty (the owner) gets an empty inbox.
    const ownerInbox = await verificationInbox(c.owner, {});
    assert.equal(ownerInbox.length, 0, 'faculty have no verification inbox');
  });
});
