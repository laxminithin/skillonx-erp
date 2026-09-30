/**
 * Alumni Intelligence (C3) — focused e2e tests.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import bcrypt from 'bcrypt';
import { db } from '../../db/index.js';
import * as alumni from './service.js';
import { getAlumni360ForAdmin, getAlumni360ForSelf } from './aggregate360.js';
import * as crm from './crmService.js';
import { getProfileIntelligence, loadSignalBundle, buildProfileIntelligence } from './intelligenceEngine.js';
import * as segments from './segmentService.js';
import * as intelWorkspace from './intelligenceWorkspace.js';
import { AppError } from '../../utils/errors.js';

const password = 'AlumniIntel!';

async function baseCollege() {
  let college = await db('colleges').orderBy('id').first();
  if (!college) {
    const [id] = await db('colleges').insert({ name: 'AlumniIntel College', code: `AINT${Date.now()}` });
    college = await db('colleges').where({ id }).first();
  }
  return college;
}

async function ensureAdmin(collegeId: number, role = 'COLLEGE_ADMIN', extras: Record<string, unknown> = {}) {
  const email = `intel.${role.toLowerCase()}.${Date.now()}@test.edu`;
  const [id] = await db('faculty_users').insert({
    college_id: collegeId,
    name: `Intel ${role}`,
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
    const [id] = await db('departments').insert({ college_id: collegeId, name: code, code: `${code}${Date.now()}`.slice(0, 16) });
    dept = await db('departments').where({ id }).first();
  }
  return dept;
}

async function createVerifiedAlumni(collegeId: number, tag: string, deptId?: number) {
  const dept = deptId ? { id: deptId } : await ensureDepartment(collegeId);
  const usn = `INT${Date.now()}${tag}`.slice(0, 60).toUpperCase();
  const [sid] = await db('students').insert({
    college_id: collegeId,
    department_id: dept.id,
    name: `Intel ${tag}`,
    usn,
    email: `${usn.toLowerCase()}@intel.test`,
    phone: `93333${String(Date.now()).slice(-5)}`,
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
    graduation_year: 2021,
    email_visibility: 'PRIVATE',
    phone_visibility: 'PRIVATE',
  });
  return { profile: await db('alumni_profiles').where({ id }).first(), student };
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

describe('Alumni Intelligence (C3)', () => {
  it('separates capability evidence from explicit willingness and explains why', async () => {
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const { profile } = await createVerifiedAlumni(college.id, 'CAP');
    const actor = adminActor(admin);

    await db('alumni_employment').insert({
      college_id: college.id,
      alumni_profile_id: profile.id,
      organization: 'Acme Eng',
      designation: 'Engineering Manager',
      industry: 'Software',
      seniority: 'MANAGER',
      is_current: true,
      verification_status: 'SELF_DECLARED',
      source_type: 'ALUMNI_SELF',
      last_verified_at: new Date(),
    });
    if (await db.schema.hasTable('alumni_interest_capabilities')) {
      await db('alumni_interest_capabilities').insert({
        college_id: college.id,
        alumni_profile_id: profile.id,
        capability_domain: 'MENTORING',
        is_active: true,
        source_type: 'ALUMNI_SELF',
        verification_status: 'SELF_DECLARED',
      });
    }
    // Willing for mentoring, NOT asked for recruitment — capability alone must not imply willingness
    await db('alumni_profiles').where({ id: profile.id }).update({
      open_to_mentoring: true,
      willingness_confirmed_at: new Date(),
    });

    const intel = await getProfileIntelligence(actor, Number(profile.id));
    const mentor = intel.dimensions.find((d) => d.dimension === 'MENTORSHIP')!;
    const recruit = intel.dimensions.find((d) => d.dimension === 'RECRUITMENT')!;

    assert.ok(['STRONG_EVIDENCE', 'MODERATE_EVIDENCE', 'LIMITED_EVIDENCE'].includes(mentor.evidenceState));
    assert.equal(mentor.willingnessState, 'WILLING');
    assert.ok(mentor.why.length >= 1);
    assert.ok(mentor.sources.some((s) => s.sourceReference?.includes('open_to_mentoring') || s.sourceType === 'C1'));

    // Job title alone must not invent recruitment willingness
    assert.equal(recruit.willingnessState, 'NOT_ASKED');
    assert.notEqual(recruit.willingnessState, 'WILLING');

    // No opaque numeric score field
    assert.equal((mentor as any).score, undefined);
    assert.equal((mentor as any).recruiterScore, undefined);
  });

  it('applies relationship readiness: recent contact, active opp, and decline', async () => {
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const { profile } = await createVerifiedAlumni(college.id, 'REL');
    const actor = adminActor(admin);

    await db('alumni_profiles').where({ id: profile.id }).update({ open_to_recruitment: true });
    await db('alumni_employment').insert({
      college_id: college.id,
      alumni_profile_id: profile.id,
      organization: 'HireCo',
      designation: 'Talent Lead',
      seniority: 'LEAD',
      is_current: true,
      verification_status: 'SELF_DECLARED',
      source_type: 'ALUMNI_SELF',
    });

    await crm.createInteraction(actor, Number(profile.id), {
      interactionType: 'EMAIL',
      summary: 'Reached out yesterday',
      occurredAt: new Date().toISOString(),
      outcomeStatus: 'CONTACTED',
      isContactAttempt: true,
    });

    let intel = await getProfileIntelligence(actor, Number(profile.id));
    let recruit = intel.dimensions.find((d) => d.dimension === 'RECRUITMENT')!;
    assert.ok(
      recruit.relationshipReadiness === 'RECENTLY_CONTACTED' ||
        recruit.relationshipReadiness === 'ACTIVE_ENGAGEMENT' ||
        recruit.cautions.some((c) => c.code === 'RECENTLY_CONTACTED'),
    );

    await crm.createOpportunity(actor, Number(profile.id), {
      opportunityType: 'RECRUITMENT',
      title: 'Campus drive support',
      status: 'IN_PROGRESS',
    });

    intel = await getProfileIntelligence(actor, Number(profile.id));
    recruit = intel.dimensions.find((d) => d.dimension === 'RECRUITMENT')!;
    assert.equal(recruit.relationshipReadiness, 'ACTIVE_ENGAGEMENT');
    assert.ok(recruit.cautions.some((c) => c.code === 'ACTIVE_OPPORTUNITY'));

    // Decline → DO_NOT_CONTACT / TEMPORARILY_UNAVAILABLE
    await crm.createInteraction(actor, Number(profile.id), {
      interactionType: 'PHONE_CALL',
      summary: 'Declined for now',
      occurredAt: new Date().toISOString(),
      outcomeStatus: 'DECLINED',
      isContactAttempt: true,
    });
    intel = await getProfileIntelligence(actor, Number(profile.id));
    recruit = intel.dimensions.find((d) => d.dimension === 'RECRUITMENT')!;
    assert.ok(
      recruit.relationshipReadiness === 'DO_NOT_CONTACT' ||
        recruit.willingnessState === 'TEMPORARILY_UNAVAILABLE' ||
        recruit.cautions.some((c) => c.code === 'RECENT_DECLINE'),
    );
  });

  it('flags stale employment evidence and dormant high-capability reactivation', async () => {
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const { profile } = await createVerifiedAlumni(college.id, 'STL');
    const actor = adminActor(admin);

    const staleDate = new Date(Date.now() - 800 * 86400000);
    await db('alumni_employment').insert({
      college_id: college.id,
      alumni_profile_id: profile.id,
      organization: 'OldCo',
      designation: 'Principal Scientist',
      seniority: 'PRINCIPAL',
      is_current: true,
      verification_status: 'SELF_DECLARED',
      source_type: 'ALUMNI_SELF',
      last_verified_at: staleDate,
      updated_at: staleDate,
    });
    await db('alumni_profiles').where({ id: profile.id }).update({
      open_to_research_collaboration: true,
      research_expertise: JSON.stringify(['AI']),
      employment_confirmed_at: staleDate,
    });
    if (await db.schema.hasTable('alumni_interest_capabilities')) {
      await db('alumni_interest_capabilities').insert({
        college_id: college.id,
        alumni_profile_id: profile.id,
        capability_domain: 'ACADEMIC',
        is_active: true,
        source_type: 'ALUMNI_SELF',
        verification_status: 'SELF_DECLARED',
      });
    }

    const bundle = await loadSignalBundle(college.id, Number(profile.id));
    const intel = buildProfileIntelligence(bundle);
    const research = intel.dimensions.find((d) => d.dimension === 'RESEARCH_COLLABORATION')!;
    assert.ok(research.dataQualityWarnings.length >= 1 || research.evidenceState !== 'INSUFFICIENT_DATA');

    // No recent contact → NEEDS_REACTIVATION possible
    assert.ok(
      research.relationshipReadiness === 'NEEDS_REACTIVATION' ||
        research.relationshipReadiness === 'READY_FOR_REVIEW',
    );

    const dormant = await segments.evaluateRules(actor, { preset: 'DORMANT_HIGH_CAPABILITY', limit: 100 });
    assert.ok(Array.isArray(dormant.results));
  });

  it('saved segments store rules and evaluate dynamically; export is audited', async () => {
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const { profile } = await createVerifiedAlumni(college.id, 'SEG');
    const actor = adminActor(admin);

    await db('alumni_profiles').where({ id: profile.id }).update({ open_to_mentoring: true });
    await db('alumni_employment').insert({
      college_id: college.id,
      alumni_profile_id: profile.id,
      organization: 'MentorCo',
      designation: 'Senior Engineer',
      seniority: 'SENIOR',
      is_current: true,
      verification_status: 'SELF_DECLARED',
      source_type: 'ALUMNI_SELF',
    });

    const created = await segments.createSegment(actor, {
      name: `CSE mentors ${Date.now()}`,
      description: 'Willing mentors',
      ruleDefinition: {
        combinator: 'AND',
        filters: [
          { field: 'dimension', value: 'MENTORSHIP' },
          { field: 'willingnessState', value: 'WILLING' },
        ],
      },
      scope: 'PERSONAL',
    });
    assert.ok(created.segment.id);
    assert.ok(created.segment.ruleDefinition.filters.length >= 1);
    // Must not persist alumni id list
    assert.equal((created.segment as any).alumniIds, undefined);

    const evaluated = await segments.evaluateSavedSegment(actor, created.segment.id, { limit: 50 });
    assert.ok(evaluated.results.some((r) => r.alumniProfileId === Number(profile.id)));
    assert.ok(evaluated.results[0].focus?.why?.length);

    const exported = await segments.exportSegmentResults(actor, {
      ruleDefinition: created.segment.ruleDefinition,
      limit: 50,
    });
    assert.ok(exported.rows.length >= 1);
    assert.ok(exported.note.includes('explainable'));

    if (await db.schema.hasTable('alumni_audit_log')) {
      const audit = await db('alumni_audit_log')
        .where({ college_id: college.id, action: 'INTELLIGENCE_SEGMENT_EXPORT' })
        .orderBy('id', 'desc')
        .first();
      assert.ok(audit);
    }

    await segments.deleteSegment(actor, created.segment.id);
  });

  it('enforces department scope, tenant isolation, privacy (no intelligence on self 360)', async () => {
    const college = await baseCollege();
    const otherCollege = await db('colleges').whereNot('id', college.id).first();
    const deptA = await ensureDepartment(college.id, 'DEA');
    const deptB = await ensureDepartment(college.id, 'DEB');
    const faculty = await ensureAdmin(college.id, 'FACULTY', { department_id: deptA.id });
    const accountant = await ensureAdmin(college.id, 'ACCOUNTANT');
    const { profile: inDept } = await createVerifiedAlumni(college.id, 'INA', deptA.id);
    const { profile: outDept } = await createVerifiedAlumni(college.id, 'OUT', deptB.id);

    await db('alumni_profiles').where({ id: inDept.id }).update({ open_to_mentoring: true });
    await db('alumni_employment').insert({
      college_id: college.id,
      alumni_profile_id: inDept.id,
      organization: 'X',
      designation: 'Lead',
      seniority: 'LEAD',
      is_current: true,
      verification_status: 'SELF_DECLARED',
      source_type: 'ALUMNI_SELF',
    });

    const facActor = adminActor(faculty);
    await getProfileIntelligence(facActor, Number(inDept.id));

    await assert.rejects(
      () => getProfileIntelligence(facActor, Number(outDept.id)),
      (e: any) => e instanceof AppError && e.status === 403,
    );

    await assert.rejects(
      () => intelWorkspace.getIntelligenceWorkspace(adminActor(accountant), { view: 'MENTORSHIP' }),
      (e: any) => e instanceof AppError && e.status === 403,
    );

    // Self 360 must not expose intelligence section
    const self360 = await getAlumni360ForSelf(alumniActor(inDept));
    assert.equal((self360 as any).intelligence, undefined);

    // Admin 360 includes intelligence
    const admin = await ensureAdmin(college.id);
    const admin360 = await getAlumni360ForAdmin(adminActor(admin), Number(inDept.id));
    assert.ok((admin360 as any).intelligence?.dimensions?.length);

    // Cross-college 404
    if (otherCollege) {
      const foreign = await createVerifiedAlumni(otherCollege.id, 'FRN');
      await assert.rejects(
        () => getProfileIntelligence(adminActor(admin), Number(foreign.profile.id)),
        (e: any) => e instanceof AppError && (e.status === 404 || e.status === 403),
      );
    }
  });

  it('workspace dimension views and matrix overview return explainable results', async () => {
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const ws = await intelWorkspace.getIntelligenceWorkspace(actor, { view: 'MENTORSHIP', limit: 20 });
    assert.ok(ws.views.includes('MENTORSHIP'));
    assert.ok(Array.isArray(ws.results));
    const matrix = await intelWorkspace.getMatrixOverview(actor);
    assert.ok(typeof matrix.matrix.HIGH_EVIDENCE_WILLING === 'number');
    assert.ok(matrix.note.includes('not an automated outreach'));
  });
});
