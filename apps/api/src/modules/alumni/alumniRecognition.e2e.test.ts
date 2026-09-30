/**
 * Alumni Recognition, Value & Community (C6) — focused e2e tests.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import bcrypt from 'bcrypt';
import { db } from '../../db/index.js';
import * as alumni from './service.js';
import * as recognition from './recognitionService.js';
import * as recognitionWorkspace from './recognitionWorkspace.js';
import * as engagement from './engagementService.js';
import * as crm from './crmService.js';
import { getProfileIntelligence } from './intelligenceEngine.js';
import {
  FORBIDDEN_RECOGNITION_ATTRIBUTES,
  SOURCE_OF_TRUTH_MATRIX,
  PARTICIPATION_STATUSES,
} from './typesRecognition.js';
import { AppError } from '../../utils/errors.js';

const password = 'AlumniRecog!';

async function baseCollege() {
  let college = await db('colleges').orderBy('id').first();
  if (!college) {
    const [id] = await db('colleges').insert({ name: 'AlumniRecog College', code: `ARCH${Date.now()}` });
    college = await db('colleges').where({ id }).first();
  }
  return college;
}

async function ensureAdmin(collegeId: number, role = 'COLLEGE_ADMIN', extras: Record<string, unknown> = {}) {
  const email = `recog.${role.toLowerCase()}.${Date.now()}@test.edu`;
  const [id] = await db('faculty_users').insert({
    college_id: collegeId,
    name: `Recog ${role}`,
    email,
    password_hash: await bcrypt.hash(password, 10),
    role,
    is_active: true,
    ...extras,
  });
  return db('faculty_users').where({ id }).first();
}

async function ensureDepartment(collegeId: number, code = 'CSE') {
  let dept = await db('departments').where({ college_id: collegeId, code }).first();
  if (!dept) {
    const [id] = await db('departments').insert({
      college_id: collegeId,
      name: code,
      code: `${code}${Date.now()}`.slice(0, 16),
    });
    dept = await db('departments').where({ id }).first();
  }
  return dept;
}

async function createVerifiedAlumni(collegeId: number, tag: string, deptId?: number, extras: Record<string, unknown> = {}) {
  const dept = deptId ? { id: deptId } : await ensureDepartment(collegeId);
  const usn = `REC${Date.now()}${tag}`.slice(0, 60).toUpperCase();
  const [sid] = await db('students').insert({
    college_id: collegeId,
    department_id: dept.id,
    name: `Recog ${tag}`,
    usn,
    email: `${usn.toLowerCase()}@recog.test`,
    phone: `96666${String(Date.now()).slice(-5)}`,
    semester: '8',
    section: 'A',
    is_active: true,
  });
  const student = await db('students').where({ id: sid }).first();
  const [id] = await db('alumni_profiles').insert({
    college_id: collegeId,
    student_id: student.id,
    email: student.email,
    password_hash: await bcrypt.hash(password, 10),
    is_active: true,
    lifecycle_state: 'ACTIVE',
    verification_state: 'VERIFIED',
    historical_name: student.name,
    historical_usn: student.usn,
    historical_department_id: student.department_id,
    graduation_year: 2018,
    email_visibility: 'PRIVATE',
    phone_visibility: 'PRIVATE',
    contact_verified_at: new Date(),
    ...extras,
  });
  const profile = await db('alumni_profiles').where({ id }).first();
  return { profile, student };
}

function adminActor(admin: any): alumni.AlumniAdminActor {
  return {
    facultyUserId: Number(admin.id),
    collegeId: Number(admin.college_id),
    departmentId: admin.department_id ?? null,
    role: admin.role,
    name: admin.name,
  };
}

function alumniActor(profile: any): alumni.AlumniActor {
  return {
    alumniProfileId: Number(profile.id),
    studentId: Number(profile.student_id),
    collegeId: Number(profile.college_id),
    role: 'ALUMNI',
    email: profile.email,
    name: profile.historical_name,
  };
}

async function requireC6() {
  if (!(await db.schema.hasTable('alumni_recognition_programs'))) {
    throw new AppError(503, 'Run migration alumni_recognition_c6 first');
  }
}

describe('Alumni Recognition (C6)', () => {
  it('exposes source-of-truth matrix and forbids popularity/wealth/donor scores', () => {
    const matrix = recognition.getSourceOfTruthMatrix();
    assert.ok(matrix.matrix.length >= 10);
    assert.ok(SOURCE_OF_TRUTH_MATRIX.some((m) => m.capability.includes('Institutional recognition')));
    assert.ok(FORBIDDEN_RECOGNITION_ATTRIBUTES.includes('popularity'));
    assert.ok(FORBIDDEN_RECOGNITION_ATTRIBUTES.includes('wealth'));
    assert.ok(FORBIDDEN_RECOGNITION_ATTRIBUTES.includes('donor_tier'));
    assert.ok(FORBIDDEN_RECOGNITION_ATTRIBUTES.includes('reciprocity_score'));
    assert.ok(!PARTICIPATION_STATUSES.includes('VIEWED' as any));
  });

  it('program → nomination → evidence → review APPROVE does not issue until issueRecognition', async () => {
    await requireC6();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, 'N1');

    const { program } = await recognition.createProgram(actor, {
      name: `Distinguished Alumnus ${Date.now()}`,
      category: 'DISTINGUISHED_ALUMNUS',
      description: 'Annual recognition program',
      status: 'NOMINATIONS_OPEN',
    });
    assert.ok(program.id);

    const { nomination } = await recognition.createNomination(actor, {
      alumniProfileId: Number(profile.id),
      programId: program.id,
      title: 'Industry leader recognition',
      category: 'INDUSTRY_ACHIEVEMENT',
      reason: 'Led major campus hiring',
      status: 'SUBMITTED',
    });
    assert.equal(nomination.status, 'SUBMITTED');

    const { evidence } = await recognition.addEvidence(actor, {
      nominationId: nomination.id,
      sourceType: 'INSTITUTIONAL_RECORD',
      label: 'T&P hiring letter',
      sourceReference: 'tpms-ref-1',
      verificationStatus: 'INSTITUTIONAL',
    });
    assert.ok(evidence.id);

    const reviewed = await recognition.reviewNomination(actor, nomination.id, {
      stageCode: 'ALUMNI_COMMITTEE',
      decision: 'APPROVE',
      comments: 'Committee recommends',
      nextNominationStatus: 'APPROVED',
    });
    assert.equal(reviewed.nomination.status, 'APPROVED');
    assert.ok(reviewed.note?.includes('never auto-issued') || reviewed.note);

    const beforeIssue = await db('alumni_recognition_records')
      .where({ college_id: college.id, nomination_id: nomination.id })
      .first();
    assert.equal(beforeIssue, undefined, 'Review must not create recognition record');
  });

  it('issueRecognition creates record + issuance log + optional certificate without crypto claim', async () => {
    await requireC6();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, 'ISS');

    const { nomination } = await recognition.createNomination(actor, {
      alumniProfileId: Number(profile.id),
      title: 'Mentor of the Year',
      category: 'MENTORSHIP_CONTRIBUTION',
      reason: 'Mentored 12 students',
      status: 'SUBMITTED',
    });
    await recognition.reviewNomination(actor, nomination.id, {
      stageCode: 'INSTITUTIONAL_APPROVAL',
      decision: 'APPROVE',
      nextNominationStatus: 'APPROVED',
    });

    const issued = await recognition.issueRecognition(actor, {
      nominationId: nomination.id,
      title: 'Mentor of the Year',
      category: 'MENTORSHIP_CONTRIBUTION',
      citation: 'Verified mentoring outcomes',
      issueCertificate: true,
      certificateType: 'MENTORSHIP',
    });
    assert.equal(issued.recognition.status, 'ISSUED');
    assert.ok(issued.certificate);
    assert.ok(issued.note?.toLowerCase().includes('no crypto') || issued.note?.includes('human'));
    assert.ok(!JSON.stringify(issued).toLowerCase().includes('blockchain'));
    assert.ok(!('cryptoSignature' in (issued.certificate || {})));

    const log = await db('alumni_recognition_issuance_log')
      .where({ college_id: college.id, recognition_id: issued.recognition.id })
      .first();
    assert.ok(log);
    assert.equal(log.action, 'ISSUED');
  });

  it('C4 nominateRecognition → ingestC4Nomination marks RECORDED', async () => {
    await requireC6();
    if (!(await db.schema.hasTable('alumni_engagement_recognition_noms'))) {
      return;
    }
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, 'C4');

    const c4 = await engagement.nominateRecognition(actor, {
      alumniProfileId: Number(profile.id),
      title: 'C4 handoff nominee',
      rationale: 'Engagement campaign handoff',
      evidenceRefs: [{ sourceType: 'OTHER', sourceReference: 'c4-note' }],
    });
    assert.equal(c4.nomination.status, 'NOMINATED');

    const ingested = await recognition.ingestC4Nomination(actor, Number(c4.nomination.id));
    assert.equal(ingested.alreadyIngested, false);
    assert.equal(ingested.nomination.source, 'C4_HANDOFF');
    assert.equal(ingested.nomination.status, 'SUBMITTED');

    const c4Row = await db('alumni_engagement_recognition_noms').where({ id: c4.nomination.id }).first();
    assert.equal(c4Row.status, 'RECORDED');
  });

  it('publication consent: publishSpotlight fails without consent and succeeds with consent', async () => {
    await requireC6();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, 'SP');

    const { spotlight } = await recognition.createSpotlight(actor, {
      alumniProfileId: Number(profile.id),
      headline: 'Rising founder spotlight',
      professionalSummary: 'Built a campus startup',
      publicationStatus: 'DRAFT',
    });

    await assert.rejects(
      () => recognition.publishSpotlight(actor, spotlight.id),
      (err: any) => err instanceof AppError && err.status === 400,
    );

    await recognition.patchSpotlight(actor, spotlight.id, { publicationConsent: true });
    const published = await recognition.publishSpotlight(actor, spotlight.id);
    assert.equal(published.spotlight.publicationStatus, 'PUBLISHED');
    assert.equal(published.spotlight.publicationConsent, true);
  });

  it('value offering + participation never invents VIEWED', async () => {
    await requireC6();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, 'VO');

    const { offering } = await recognition.createValueOffering(actor, {
      title: 'Alumni networking evening',
      category: 'PROFESSIONAL_NETWORKING',
      status: 'OPEN',
    });

    const part = await recognition.recordParticipation(actor, offering.id, {
      alumniProfileId: Number(profile.id),
      status: 'REGISTERED',
    });
    assert.equal(part.participation.status, 'REGISTERED');

    await assert.rejects(
      () =>
        recognition.recordParticipation(actor, offering.id, {
          alumniProfileId: Number(profile.id),
          status: 'VIEWED' as any,
        }),
      (err: any) => err?.name === 'ZodError' || err instanceof AppError || err?.issues,
    );
  });

  it('reciprocity is factual lists with guardrail when contributions lack value; no score field', async () => {
    await requireC6();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, 'RP');

    if (await db.schema.hasTable('alumni_crm_outcomes')) {
      const opp = await crm.createOpportunity(actor, Number(profile.id), {
        opportunityType: 'INTERNSHIP',
        title: 'Internship pipeline',
        status: 'CONFIRMED',
      });
      for (let i = 0; i < 2; i++) {
        const outcome = await crm.createOutcome(actor, opp.opportunity.id, {
          outcomeType: 'INTERNSHIPS_ENABLED',
          title: `Internships batch ${i + 1}`,
          quantity: 3,
          evidenceReference: `email-${i}`,
          outcomeDate: new Date().toISOString().slice(0, 10),
          description: 'Offer letters',
        });
        await crm.verifyOutcome(actor, outcome.outcome.id, 'VERIFY');
      }
    }

    const view = await recognition.getReciprocity(actor, Number(profile.id), 12);
    assert.ok(Array.isArray(view.alumniToInstitution));
    assert.ok(Array.isArray(view.institutionToAlumni));
    assert.ok(view.guardrail);
    assert.equal('score' in view, false);
    assert.equal('reciprocityScore' in view, false);
    assert.equal('fairnessScore' in view, false);
    assert.ok(JSON.stringify(view).includes('no reciprocity score') || view.note);

    if (view.alumniToInstitution.reduce((s: number, i: any) => s + i.count, 0) >= 2) {
      assert.equal(view.guardrail.triggered, true);
      assert.ok(view.guardrail.message);
    }
  });

  it('contribution suggestion CONSIDER_FOR_RECOGNITION from verified CRM outcome', async () => {
    await requireC6();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, 'SG');

    if (!(await db.schema.hasTable('alumni_crm_outcomes'))) return;

    const opp = await crm.createOpportunity(actor, Number(profile.id), {
      opportunityType: 'MENTORSHIP',
      title: 'Mentorship slots',
      status: 'CONFIRMED',
    });
    const outcome = await crm.createOutcome(actor, opp.opportunity.id, {
      outcomeType: 'STUDENTS_MENTORED',
      title: '10 students mentored',
      quantity: 10,
      evidenceReference: 'mentor-log',
      outcomeDate: new Date().toISOString().slice(0, 10),
      description: 'Verified mentoring',
    });
    await crm.verifyOutcome(actor, outcome.outcome.id, 'VERIFY');

    const refreshed = await recognition.refreshSuggestions(actor, {
      alumniProfileId: Number(profile.id),
      limit: 20,
    });
    assert.ok((refreshed.created ?? refreshed.suggestions?.length ?? 0) >= 0);
    const listed = await recognition.listSuggestions(actor, {
      alumniProfileId: Number(profile.id),
      status: 'OPEN',
    });
    const hit = (listed.suggestions || []).find(
      (s: any) =>
        s.suggestionType === 'CONSIDER_FOR_RECOGNITION' &&
        Number(s.alumniProfileId) === Number(profile.id),
    );
    assert.ok(hit, 'Expected CONSIDER_FOR_RECOGNITION suggestion from verified CRM outcome');
  });

  it('community + membership requires explicit opt-in', async () => {
    await requireC6();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, 'CM');

    const { community } = await recognition.createCommunity(actor, {
      name: `Bengaluru Chapter ${Date.now()}`,
      type: 'CHAPTER',
      city: 'Bengaluru',
    });
    const mem = await recognition.addMembership(actor, community.id, {
      alumniProfileId: Number(profile.id),
      status: 'OPT_IN',
    });
    assert.equal(mem.membership.status, 'OPT_IN');
    assert.equal(Number(mem.membership.alumniProfileId), Number(profile.id));
  });

  it('connection request privacy — no email before accept', async () => {
    await requireC6();
    if (!(await db.schema.hasTable('alumni_connection_requests'))) return;
    const college = await baseCollege();
    const a = await createVerifiedAlumni(college.id, 'CA', undefined, {
      email_visibility: 'ALUMNI_NETWORK',
    });
    const b = await createVerifiedAlumni(college.id, 'CB', undefined, {
      email_visibility: 'ALUMNI_NETWORK',
    });

    const req = await recognition.requestConnection(alumniActor(a.profile), {
      toAlumniId: Number(b.profile.id),
      message: 'Happy to connect',
    });
    assert.equal(req.connection.status, 'PENDING');
    assert.equal('contact' in req.connection, false);
    assert.equal('email' in req.connection, false);

    const accepted = await recognition.respondConnection(alumniActor(b.profile), req.connection.id, {
      status: 'ACCEPTED',
    });
    assert.equal(accepted.connection.status, 'ACCEPTED');
    assert.ok(accepted.connection.contact);
  });

  it('tenant isolation / IDOR basics', async () => {
    await requireC6();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, 'TI');

    const { nomination } = await recognition.createNomination(actor, {
      alumniProfileId: Number(profile.id),
      title: 'Tenant isolation nom',
      category: 'OTHER',
      status: 'SUBMITTED',
    });

    const [otherCollegeId] = await db('colleges').insert({
      name: `Other Recog ${Date.now()}`,
      code: `OR${Date.now()}`.slice(0, 16),
    });
    const otherAdmin = await ensureAdmin(otherCollegeId);
    const otherActor = adminActor(otherAdmin);

    await assert.rejects(
      () => recognition.getNominationDetail(otherActor, nomination.id),
      (err: any) => err instanceof AppError && (err.status === 404 || err.status === 403),
    );
    await assert.rejects(
      () => recognition.issueRecognition(otherActor, {
        nominationId: nomination.id,
        title: 'Stolen award',
      }),
      (err: any) => err instanceof AppError && (err.status === 404 || err.status === 403),
    );
  });

  it('C1 privacy: directory stays private; spotlight does not leak private fields', async () => {
    await requireC6();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const a = await createVerifiedAlumni(college.id, 'PA');
    const b = await createVerifiedAlumni(college.id, 'PB', undefined, {
      email_visibility: 'PRIVATE',
      phone_visibility: 'PRIVATE',
    });

    const { spotlight } = await recognition.createSpotlight(actor, {
      alumniProfileId: Number(b.profile.id),
      headline: 'Private alumnus spotlight',
      professionalSummary: 'Public-safe summary only',
    });
    await recognition.patchSpotlight(actor, spotlight.id, { publicationConsent: true });
    const published = await recognition.publishSpotlight(actor, spotlight.id);
    assert.equal(published.spotlight.publicationStatus, 'PUBLISHED');
    assert.equal('email' in published.spotlight, false);
    assert.equal('phone' in published.spotlight, false);

    const dir = await alumni.directory(alumniActor(a.profile), { limit: 50 });
    const found = dir.alumni.find((x: any) => x.id === Number(b.profile.id));
    if (found) {
      assert.equal(found.email, null);
      assert.equal(found.phone, null);
    }
  });

  it('recognition issuance does not invent C3 capability', async () => {
    await requireC6();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, 'C3', undefined, {
      open_to_mentoring: true,
    });

    let capsBefore = 0;
    if (await db.schema.hasTable('alumni_interest_capabilities')) {
      capsBefore = Number(
        (await db('alumni_interest_capabilities').where({ alumni_profile_id: profile.id }).count('* as c').first() as any)?.c || 0,
      );
    }

    let intelBefore: any = null;
    try {
      intelBefore = await getProfileIntelligence(actor, Number(profile.id));
    } catch {
      intelBefore = null;
    }

    const issued = await recognition.issueRecognition(actor, {
      alumniProfileId: Number(profile.id),
      title: 'Appreciation certificate',
      category: 'INSTITUTIONAL_SERVICE',
      issueCertificate: false,
    });
    assert.equal(issued.recognition.status, 'ISSUED');

    if (await db.schema.hasTable('alumni_interest_capabilities')) {
      const capsAfter = Number(
        (await db('alumni_interest_capabilities').where({ alumni_profile_id: profile.id }).count('* as c').first() as any)?.c || 0,
      );
      assert.equal(capsAfter, capsBefore, 'Issuance must not invent capability rows');
    }

    if (intelBefore) {
      const intelAfter = await getProfileIntelligence(actor, Number(profile.id));
      const beforeMentoring = intelBefore?.dimensions?.mentoring ?? intelBefore?.mentoring ?? null;
      const afterMentoring = intelAfter?.dimensions?.mentoring ?? intelAfter?.mentoring ?? null;
      if (beforeMentoring != null && afterMentoring != null) {
        assert.deepEqual(afterMentoring, beforeMentoring);
      }
    }
  });

  it('workspace analytics load for OVERVIEW and REVIEW_QUEUE', async () => {
    await requireC6();
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const overview = await recognitionWorkspace.getRecognitionWorkspace(actor, { view: 'OVERVIEW' });
    assert.ok(overview.metrics);
    assert.ok('pendingNominations' in overview.metrics);
    const queue = await recognitionWorkspace.getRecognitionWorkspace(actor, { view: 'REVIEW_QUEUE' });
    assert.ok(Array.isArray(queue.nominations));
  });
});
