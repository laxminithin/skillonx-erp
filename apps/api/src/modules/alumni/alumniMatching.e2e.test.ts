/**
 * Alumni Matching & Connect (C5) — focused e2e tests.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import bcrypt from 'bcrypt';
import { db } from '../../db/index.js';
import * as alumni from './service.js';
import { getAlumni360ForAdmin } from './aggregate360.js';
import * as matching from './matchingService.js';
import * as matchingWorkspace from './matchingWorkspace.js';
import * as crm from './crmService.js';
import { FORBIDDEN_MATCH_ATTRIBUTES, SOURCE_OF_TRUTH_MATRIX } from './typesMatching.js';
import { AppError } from '../../utils/errors.js';

const password = 'AlumniMatch!';

let suiteCollege: any;

async function baseCollege() {
  if (suiteCollege) return suiteCollege;
  const code = `AMQ${Date.now()}`.slice(0, 32);
  const [id] = await db('colleges').insert({ name: 'Alumni Matching QA College', code });
  suiteCollege = await db('colleges').where({ id }).first();
  return suiteCollege;
}

async function ensureAdmin(collegeId: number, role = 'COLLEGE_ADMIN', extras: Record<string, unknown> = {}) {
  const email = `match.${role.toLowerCase()}.${Date.now()}@test.edu`;
  const [id] = await db('faculty_users').insert({
    college_id: collegeId,
    name: `Match ${role}`,
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
  const usn = `MCH${Date.now()}${tag}`.slice(0, 60).toUpperCase();
  const { org, role, industry, location, seniority, ...profileExtras } = extras as any;
  const [sid] = await db('students').insert({
    college_id: collegeId,
    department_id: dept.id,
    name: `Match ${tag}`,
    usn,
    email: `${usn.toLowerCase()}@match.test`,
    phone: `95555${String(Date.now()).slice(-5)}`,
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
    open_to_mentoring: true,
    domains_expertise: JSON.stringify(['AI/ML', 'Cybersecurity']),
    technologies: JSON.stringify(['Python', 'TensorFlow']),
    contact_verified_at: new Date(),
    ...profileExtras,
  });
  const profile = await db('alumni_profiles').where({ id }).first();
  await db('alumni_employment').insert({
    college_id: collegeId,
    alumni_profile_id: id,
    organization: org || 'TechCorp',
    designation: role || 'Engineering Manager',
    industry: industry || 'Software',
    location: location || 'Bengaluru',
    is_current: true,
    seniority: seniority || 'MANAGER',
  });
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

describe('Alumni Matching (C5)', () => {
  it('exposes source-of-truth matrix and forbids sensitive attributes', () => {
    const matrix = matching.getSourceOfTruthMatrix();
    assert.ok(matrix.matrix.length >= 10);
    assert.ok(SOURCE_OF_TRUTH_MATRIX.some((m) => m.needType === 'MENTORSHIP' && m.c5OwnsNeed));
    assert.ok(SOURCE_OF_TRUTH_MATRIX.some((m) => m.needType === 'RECRUITMENT' && m.linkable));
    assert.ok(FORBIDDEN_MATCH_ATTRIBUTES.includes('religion'));
    assert.ok(FORBIDDEN_MATCH_ATTRIBUTES.includes('donation_history'));
  });

  it('creates need, evaluates explainable mentorship matches, shortlists, and never uses opaque scores', async () => {
    const college = await baseCollege();
    if (!(await db.schema.hasTable('alumni_connect_needs'))) {
      throw new AppError(503, 'Run migration alumni_matching_c5 first');
    }
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile: mentor } = await createVerifiedAlumni(college.id, 'M1', undefined, {
      open_to_mentoring: true,
    });
    const { profile: unwilling } = await createVerifiedAlumni(college.id, 'M2', undefined, {
      open_to_mentoring: false,
      domains_expertise: JSON.stringify(['AI/ML']),
    });
    const { profile: notAsked } = await createVerifiedAlumni(college.id, 'M3', undefined, {
      open_to_mentoring: null,
      domains_expertise: JSON.stringify(['AI/ML', 'Deep Learning']),
    });

    await db('alumni_interest_capabilities').insert({
      college_id: college.id,
      alumni_profile_id: mentor.id,
      capability_domain: 'MENTORING',
      details: JSON.stringify({ areas: ['AI'] }),
      is_active: true,
      source_type: 'ALUMNI_SELF',
      verification_status: 'SELF_DECLARED',
    }).catch(() => undefined);

    const { need } = await matching.createNeed(actor, {
      type: 'MENTORSHIP',
      title: 'AI final-year project mentors',
      description: 'Need mentors for AI/ML projects',
      domain: 'AI/ML',
      skillsTopics: ['AI/ML', 'Python'],
      quantityRequired: 5,
      mode: 'ONLINE',
      status: 'OPEN',
      targetBeneficiaries: {
        summary: 'Final-year CSE students',
        refs: [{ beneficiaryType: 'DEPARTMENT', beneficiaryRef: String((await ensureDepartment(college.id)).id), label: 'CSE' }],
      },
    });
    assert.equal(need.status, 'OPEN');
    assert.equal(need.type, 'MENTORSHIP');

    const detail = await matching.getNeedDetail(actor, need.id);
    assert.ok(detail.beneficiaries.length >= 1);

    const evaluated = await matching.evaluateNeed(actor, need.id, { includeLimited: true, limit: 50 });
    assert.equal(evaluated.mode, 'SET_BASED');
    assert.ok(evaluated.candidates.length >= 1);

    const mentorMatch = evaluated.candidates.find((c) => c.alumniProfileId === Number(mentor.id));
    assert.ok(mentorMatch);
    assert.ok(['STRONG', 'MODERATE', 'LIMITED'].includes(mentorMatch!.matchQuality));
    assert.ok(mentorMatch!.whyMatched.length >= 1);
    assert.equal(mentorMatch!.willingness, 'WILLING');
    assert.ok(!('score' in mentorMatch!) && !('matchScore' in mentorMatch!));

    const unwillingMatch = evaluated.candidates.find((c) => c.alumniProfileId === Number(unwilling.id));
    assert.equal(unwillingMatch, undefined, 'NOT_WILLING must be hard-excluded');

    const notAskedMatch = evaluated.candidates.find((c) => c.alumniProfileId === Number(notAsked.id));
    if (notAskedMatch) {
      assert.equal(notAskedMatch.willingness, 'NOT_ASKED');
      assert.ok(
        ['REVIEW_BEFORE_CONTACT', 'CAPABILITY_ONLY', 'RELATIONSHIP_CAUTION'].includes(notAskedMatch.matchStatus),
        'Capability must not become assumed willingness',
      );
    }

    const sl = await matching.shortlistCandidate(actor, need.id, {
      alumniProfileId: Number(mentor.id),
      reasonNotes: 'Strong AI expertise + willing',
      allocatedQuantity: 2,
    });
    assert.equal(sl.shortlist.status, 'SHORTLISTED');

    await assert.rejects(
      () => matching.shortlistCandidate(actor, need.id, { alumniProfileId: Number(unwilling.id) }),
      (err: any) => err instanceof AppError && err.status === 400,
    );
  });

  it('hard-excludes DO_NOT_CONTACT / global opt-out and tenant mismatch', async () => {
    const college = await baseCollege();
    if (!(await db.schema.hasTable('alumni_connect_needs'))) throw new AppError(503, 'migration required');
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile: dnc } = await createVerifiedAlumni(college.id, 'DNC', undefined, {
      global_comm_opt_out: true,
      open_to_mentoring: true,
    });
    const { need } = await matching.createNeed(actor, {
      type: 'MENTORSHIP',
      title: 'Opt-out test need',
      domain: 'AI/ML',
      skillsTopics: ['AI/ML'],
      status: 'OPEN',
    });
    const evaluated = await matching.evaluateNeed(actor, need.id, {
      alumniProfileIds: [Number(dnc.id)],
      includeLimited: true,
    });
    assert.equal(evaluated.candidates.length, 0);
    assert.ok(evaluated.excluded >= 1);
  });

  it('supports recruitment and internship type-specific matching dimensions', async () => {
    const college = await baseCollege();
    if (!(await db.schema.hasTable('alumni_connect_needs'))) throw new AppError(503, 'migration required');
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile: recruiter } = await createVerifiedAlumni(college.id, 'REC', undefined, {
      open_to_recruitment: true,
      open_to_internships: true,
      open_to_mentoring: null,
      industry: 'IT Services',
      role: 'Hiring Manager',
      org: 'Infosys',
    });
    await db('alumni_interest_capabilities').insert({
      college_id: college.id,
      alumni_profile_id: recruiter.id,
      capability_domain: 'RECRUITMENT',
      details: JSON.stringify({}),
      is_active: true,
      source_type: 'ALUMNI_SELF',
      verification_status: 'SELF_DECLARED',
    }).catch(() => undefined);

    const recNeed = await matching.createNeed(actor, {
      type: 'RECRUITMENT',
      title: 'Campus hiring partners',
      domain: 'Software',
      skillsTopics: ['Software'],
      status: 'OPEN',
    });
    const recEval = await matching.evaluateNeed(actor, recNeed.need.id, {
      alumniProfileIds: [Number(recruiter.id)],
      includeLimited: true,
    });
    const recMatch = recEval.candidates[0];
    assert.ok(recMatch);
    assert.ok(recMatch.whyMatched.some((w) => ['INDUSTRY_FIT', 'CAREER_ROLE', 'DECLARED_CAPABILITY', 'EXPLICIT_WILLINGNESS'].includes(w.code)));

    const intNeed = await matching.createNeed(actor, {
      type: 'INTERNSHIP',
      title: 'Summer internship slots',
      quantityRequired: 10,
      status: 'OPEN',
    });
    const intEval = await matching.evaluateNeed(actor, intNeed.need.id, {
      alumniProfileIds: [Number(recruiter.id)],
      includeLimited: true,
    });
    assert.ok(intEval.candidates[0]?.willingness === 'WILLING');
  });

  it('expert / research matching separates capability from willingness', async () => {
    const college = await baseCollege();
    if (!(await db.schema.hasTable('alumni_connect_needs'))) throw new AppError(503, 'migration required');
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, 'EXP', undefined, {
      open_to_expert_sessions: null,
      open_to_research_collaboration: null,
      research_expertise: JSON.stringify(['NLP', 'Computer Vision']),
      role: 'Principal Scientist',
      seniority: 'DIRECTOR',
    });
    const expertNeed = await matching.createNeed(actor, {
      type: 'EXPERT_SESSION',
      title: 'Cybersecurity expert for 6th-semester workshop',
      domain: 'Cybersecurity',
      skillsTopics: ['Cybersecurity', 'NLP'],
      mode: 'ONLINE',
      status: 'OPEN',
    });
    const evaled = await matching.evaluateNeed(actor, expertNeed.need.id, {
      alumniProfileIds: [Number(profile.id)],
      includeLimited: true,
    });
    const m = evaled.candidates[0];
    assert.ok(m);
    assert.equal(m.willingness, 'NOT_ASKED');
    assert.ok(m.matchStatus !== 'READY_TO_SHORTLIST' || m.considerations.some((c) => c.code === 'WILLINGNESS_NOT_ASKED'));

    const researchNeed = await matching.createNeed(actor, {
      type: 'RESEARCH_COLLABORATION',
      title: 'NLP research collab',
      domain: 'NLP',
      skillsTopics: ['NLP'],
      status: 'OPEN',
    });
    const rEval = await matching.evaluateNeed(actor, researchNeed.need.id, {
      alumniProfileIds: [Number(profile.id)],
      includeLimited: true,
    });
    assert.ok(rEval.candidates[0]?.whyMatched.some((w) => w.code === 'ACADEMIC_RESEARCH_FIT' || w.code === 'SKILL_FIT'));
  });

  it('dismisses per-need only, hands off to C4 engagement and C2 opportunity, tracks multi-alumni fulfilment', async () => {
    const college = await baseCollege();
    if (!(await db.schema.hasTable('alumni_connect_needs'))) throw new AppError(503, 'migration required');
    if (!(await db.schema.hasTable('alumni_engagement_programs'))) throw new AppError(503, 'C4 migration required');
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile: a } = await createVerifiedAlumni(college.id, 'FA', undefined, { open_to_mentoring: true });
    const { profile: b } = await createVerifiedAlumni(college.id, 'FB', undefined, { open_to_mentoring: true });
    const { profile: c } = await createVerifiedAlumni(college.id, 'FC', undefined, { open_to_mentoring: true });

    const { need } = await matching.createNeed(actor, {
      type: 'MENTORSHIP',
      title: '30 mentors needed',
      quantityRequired: 30,
      domain: 'AI/ML',
      skillsTopics: ['AI/ML'],
      status: 'OPEN',
    });

    await matching.shortlistCandidate(actor, need.id, { alumniProfileId: Number(a.id), allocatedQuantity: 5 });
    await matching.shortlistCandidate(actor, need.id, { alumniProfileId: Number(b.id), allocatedQuantity: 10 });
    await matching.dismissCandidate(actor, need.id, {
      alumniProfileId: Number(c.id),
      reason: 'TIMING',
      notes: 'Busy this semester',
    });

    // Dismissal is need-scoped — same alumnus can match another need
    const other = await matching.createNeed(actor, {
      type: 'MENTORSHIP',
      title: 'Other mentorship need',
      domain: 'AI/ML',
      skillsTopics: ['AI/ML'],
      status: 'OPEN',
    });
    const otherEval = await matching.evaluateNeed(actor, other.need.id, {
      alumniProfileIds: [Number(c.id)],
      includeLimited: true,
    });
    assert.ok(otherEval.candidates.some((x) => x.alumniProfileId === Number(c.id)));

    const detail = await matching.getNeedDetail(actor, need.id);
    const slA = detail.shortlist.find((s) => s.alumniProfileId === Number(a.id));
    assert.ok(slA);

    const handoff = await matching.engageShortlist(actor, slA!.id, {
      channel: 'MANUAL',
      createProgramIfMissing: true,
    });
    assert.ok(handoff.campaign?.id);
    assert.equal(handoff.shortlist.status, 'ENGAGEMENT_REQUESTED');
    assert.ok(handoff.alumniFacingContext?.institutionalRequest);
    assert.ok(!('whyMatched' in (handoff.alumniFacingContext as any)));

    const opp = await matching.createOpportunityFromShortlist(actor, slA!.id, {
      allocatedQuantity: 5,
      title: 'Mentorship cohort A',
    });
    assert.ok(opp.opportunity?.id);
    assert.equal(opp.shortlist.status, 'ACCEPTED');

    // Promised ≠ fulfilled
    let afterPromise = await matching.getNeedDetail(actor, need.id);
    assert.notEqual(afterPromise.need.status, 'FULFILLED');

    const outcome = await crm.createOutcome(actor, opp.opportunity.id, {
      outcomeType: 'STUDENTS_MENTORED',
      title: 'Mentored 5 students',
      quantity: 5,
      evidenceReference: 'connect-fulfilment-test',
      outcomeDate: new Date().toISOString().slice(0, 10),
      sourceType: 'CRM_MANUAL',
      sourceReference: `connect_need:${need.id}`,
    });
    await crm.verifyOutcome(actor, outcome.outcome.id, 'VERIFY');

    await matching.recordFulfilment(actor, need.id, {
      alumniProfileId: Number(a.id),
      shortlistId: slA!.id,
      verifiedQuantity: 5,
      confirmedQuantity: 5,
      crmOutcomeId: outcome.outcome.id,
      crmOpportunityId: opp.opportunity.id,
      status: 'VERIFIED',
    });

    // Partial — 5 of 30
    afterPromise = await matching.getNeedDetail(actor, need.id);
    assert.equal(afterPromise.need.quantityVerified, 5);
    assert.equal(afterPromise.need.status, 'PARTIALLY_FULFILLED');

    // Multi-alumni: B contributes verified 10 via outcome
    const slB = afterPromise.shortlist.find((s) => s.alumniProfileId === Number(b.id));
    const oppB = await matching.createOpportunityFromShortlist(actor, slB!.id, { allocatedQuantity: 10 });
    const outB = await crm.createOutcome(actor, oppB.opportunity.id, {
      outcomeType: 'STUDENTS_MENTORED',
      title: 'Mentored 10 students',
      quantity: 10,
      evidenceReference: 'connect-fulfilment-b',
      outcomeDate: new Date().toISOString().slice(0, 10),
      sourceReference: `connect_need:${need.id}`,
    });
    await crm.verifyOutcome(actor, outB.outcome.id, 'VERIFY');
    await matching.recordFulfilment(actor, need.id, {
      alumniProfileId: Number(b.id),
      shortlistId: slB!.id,
      verifiedQuantity: 10,
      crmOutcomeId: outB.outcome.id,
      status: 'VERIFIED',
    });
    const mid = await matching.getNeedDetail(actor, need.id);
    assert.equal(mid.need.quantityVerified, 15);

    // Over-count prevention
    await assert.rejects(
      () =>
        matching.recordFulfilment(actor, need.id, {
          alumniProfileId: Number(a.id),
          verifiedQuantity: 100,
          crmOutcomeId: outcome.outcome.id,
        }),
      (err: any) => err instanceof AppError && err.status === 400,
    );
  });

  it('bulk need uses set-based pool mode', async () => {
    const college = await baseCollege();
    if (!(await db.schema.hasTable('alumni_connect_needs'))) throw new AppError(503, 'migration required');
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    await createVerifiedAlumni(college.id, 'BULK', undefined, { open_to_mentoring: true });
    const { need } = await matching.createNeed(actor, {
      type: 'MENTORSHIP',
      title: '50 students need mentors',
      quantityRequired: 50,
      domain: 'AI/ML',
      skillsTopics: ['AI/ML'],
      status: 'OPEN',
    });
    const evaluated = await matching.evaluateNeed(actor, need.id, { limit: 100 });
    assert.equal(evaluated.mode, 'SET_BASED_POOL');
  });

  it('workspace analytics, profile matches, Alumni 360 matching section, tenant isolation', async () => {
    const college = await baseCollege();
    if (!(await db.schema.hasTable('alumni_connect_needs'))) throw new AppError(503, 'migration required');
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, '360', undefined, { open_to_mentoring: true });
    const { need } = await matching.createNeed(actor, {
      type: 'MENTORSHIP',
      title: '360 section need',
      domain: 'AI/ML',
      skillsTopics: ['AI/ML'],
      status: 'OPEN',
    });
    await matching.shortlistCandidate(actor, need.id, { alumniProfileId: Number(profile.id) });

    const ws = await matchingWorkspace.getMatchingWorkspace(actor, { view: 'SHORTLISTED' });
    assert.ok(ws.metrics);
    assert.ok(ws.needs.some((n: any) => n.id === need.id));

    const attention = await matchingWorkspace.getMatchingWorkspace(actor, { view: 'NEEDS_ATTENTION' });
    assert.ok(Array.isArray(attention.tasks));

    const matches = await matching.getProfileMatches(actor, Number(profile.id));
    assert.equal(matches.available, true);
    assert.ok(matches.shortlistedNeeds.length >= 1);

    const a360 = await getAlumni360ForAdmin(actor, Number(profile.id));
    assert.ok((a360 as any).matching?.available);
    assert.ok(((a360 as any).matching.shortlistedNeeds || []).length >= 1);

    // Other college cannot see
    const [otherCollegeId] = await db('colleges').insert({
      name: `Other Match ${Date.now()}`,
      code: `OM${Date.now()}`.slice(0, 16),
    });
    const otherAdmin = await ensureAdmin(otherCollegeId);
    const otherActor = adminActor(otherAdmin);
    await assert.rejects(
      () => matching.getNeedDetail(otherActor, need.id),
      (err: any) => err instanceof AppError && (err.status === 404 || err.status === 403),
    );
  });

  it('C4 suppression awareness surfaces on candidates without auto-contact', async () => {
    const college = await baseCollege();
    if (!(await db.schema.hasTable('alumni_connect_needs'))) throw new AppError(503, 'migration required');
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, 'SUP', undefined, {
      open_to_mentoring: true,
      temporary_unavailable_until: new Date(Date.now() + 30 * 86400000),
      temporary_unavailable_reason: 'Sabbatical',
    });
    const { need } = await matching.createNeed(actor, {
      type: 'MENTORSHIP',
      title: 'Suppression-aware need',
      domain: 'AI/ML',
      skillsTopics: ['AI/ML'],
      startDate: new Date().toISOString().slice(0, 10),
      status: 'OPEN',
    });
    const evaluated = await matching.evaluateNeed(actor, need.id, {
      alumniProfileIds: [Number(profile.id)],
      includeLimited: true,
    });
    // Temporarily unavailable is hard-excluded
    assert.equal(evaluated.candidates.length, 0);
  });
});
