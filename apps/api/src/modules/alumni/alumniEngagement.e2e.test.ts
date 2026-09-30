/**
 * Alumni Engagement Orchestration (C4) — focused e2e tests.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import bcrypt from 'bcrypt';
import { db } from '../../db/index.js';
import * as alumni from './service.js';
import { getAlumni360ForAdmin, getAlumni360ForSelf } from './aggregate360.js';
import * as engagement from './engagementService.js';
import * as responseTokens from './responseTokens.js';
import * as engagementWorkspace from './engagementWorkspace.js';
import { getChannelCapability, listChannelCapabilities } from './channels.js';
import { evaluateEligibilityBatch } from './eligibility.js';
import { getProfileIntelligence } from './intelligenceEngine.js';
import { AppError } from '../../utils/errors.js';

const password = 'AlumniEngage!';

async function baseCollege() {
  let college = await db('colleges').orderBy('id').first();
  if (!college) {
    const [id] = await db('colleges').insert({ name: 'AlumniEngage College', code: `AENG${Date.now()}` });
    college = await db('colleges').where({ id }).first();
  }
  return college;
}

async function ensureAdmin(collegeId: number, role = 'COLLEGE_ADMIN', extras: Record<string, unknown> = {}) {
  // Never persist HOD/PRINCIPAL on faculty_users.role — pollutes leaveApprover
  // legacyHodEmployees / legacyPrincipalEmployees on shared departments.
  const persistedRole = role === 'HOD' || role === 'PRINCIPAL' ? 'FACULTY' : role;
  const email = `eng.${role.toLowerCase()}.${Date.now()}@test.edu`;
  const [id] = await db('faculty_users').insert({
    college_id: collegeId,
    name: `Eng ${role}`,
    email,
    password_hash: await bcrypt.hash(password, 10),
    role: persistedRole,
    is_active: true,
    ...extras,
  });
  const row = await db('faculty_users').where({ id }).first();
  return { ...row, role };
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
  const usn = `ENG${Date.now()}${tag}`.slice(0, 60).toUpperCase();
  const [sid] = await db('students').insert({
    college_id: collegeId,
    department_id: dept.id,
    name: `Engage ${tag}`,
    usn,
    email: `${usn.toLowerCase()}@engage.test`,
    phone: `94444${String(Date.now()).slice(-5)}`,
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
    graduation_year: 2020,
    email_visibility: 'PRIVATE',
    phone_visibility: 'PRIVATE',
    open_to_mentoring: true,
    comm_email_opt_in: true,
    ...extras,
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

describe('Alumni Engagement (C4)', () => {
  it('reports honest channel capabilities — no fake CONFIGURED providers', async () => {
    const channels = listChannelCapabilities();
    assert.ok(channels.every((c) => c.capability !== 'CONFIGURED' || c.supportsDeliveryTelemetry));
    assert.equal(getChannelCapability('WHATSAPP').capability, 'UNAVAILABLE');
    assert.equal(getChannelCapability('SMS').capability, 'UNAVAILABLE');
    assert.equal(getChannelCapability('EMAIL').capability, 'MANUAL_ONLY');
    assert.equal(getChannelCapability('PHONE').capability, 'MANUAL_ONLY');
    assert.equal(getChannelCapability('MANUAL').supportsDeliveryTelemetry, false);
  });

  it('runs program/campaign lifecycle with approval, audience eligibility, and manual execution → C2', async () => {
    const college = await baseCollege();
    if (!(await db.schema.hasTable('alumni_engagement_programs'))) {
      throw new AppError(503, 'Run migration alumni_engagement_c4 first');
    }
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile: a1 } = await createVerifiedAlumni(college.id, 'A1', undefined, {
      comm_phone_opt_in: true,
      phone_override: '9876543210',
    });
    const { profile: a2 } = await createVerifiedAlumni(college.id, 'A2', undefined, {
      open_to_mentoring: false,
      comm_phone_opt_in: true,
    });
    const { profile: a3 } = await createVerifiedAlumni(college.id, 'A3', undefined, {
      global_comm_opt_out: true,
      comm_phone_opt_in: true,
    });

    const { program } = await engagement.createProgram(actor, {
      name: 'Alumni Mentorship Programme 2026–27',
      category: 'MENTORSHIP',
      academicYear: '2026-27',
      status: 'ACTIVE',
      valueExchange: 'MUTUAL_VALUE',
      valueToAlumni: 'Mentoring recognition and networking',
      valueToInstitution: 'Student mentorship coverage',
      startDate: '2026-06-01',
      endDate: '2027-05-31',
    });
    assert.equal(program.status, 'ACTIVE');
    assert.equal(program.valueExchange, 'MUTUAL_VALUE');

    const { template } = await engagement.createTemplate(actor, {
      name: 'Mentor invite',
      category: 'MENTORSHIP',
      channel: 'PHONE',
      body: 'Hi {{alumni_name}}, join {{program_name}}. Link: {{response_link}}',
    });
    const preview = await engagement.previewTemplateById(actor, template.id);
    assert.match(preview.body, /Hi Nithin/);

    await assert.rejects(
      () =>
        engagement.createCampaign(actor, {
          programId: program.id,
          name: 'WhatsApp blast',
          channel: 'WHATSAPP',
          audienceSource: { type: 'EXPLICIT_IDS', alumniProfileIds: [a1.id] },
        }),
      (e: any) => e.status === 400,
    );

    const { campaign } = await engagement.createCampaign(actor, {
      programId: program.id,
      name: 'Invite AI/ML Alumni Mentors — October',
      purpose: 'Mentorship',
      channel: 'PHONE',
      templateId: template.id,
      audienceSource: {
        type: 'EXPLICIT_IDS',
        alumniProfileIds: [Number(a1.id), Number(a2.id), Number(a3.id)],
      },
      requiresApproval: true,
    });
    assert.equal(campaign.status, 'DRAFT');
    assert.equal(campaign.channelCapability.capability, 'MANUAL_ONLY');

    // Approve all pending steps
    let detail = await engagement.getCampaignDetail(actor, campaign.id);
    while (detail.approvals.some((a: any) => a.decision === 'PENDING')) {
      detail = await engagement.decideApproval(actor, campaign.id, { decision: 'APPROVED' });
    }
    assert.equal(detail.campaign.status, 'APPROVED');
    assert.equal(detail.campaign.approvalComplete, true);

    const snap = await engagement.snapshotCampaignAudience(actor, campaign.id);
    assert.ok(snap.counts.targeted >= 3);
    const byId = new Map(snap.recipients.map((r: any) => [r.alumniProfileId, r]));
    assert.equal(byId.get(Number(a1.id))?.eligibility, 'ELIGIBLE');
    assert.equal(byId.get(Number(a2.id))?.eligibility, 'SUPPRESSED');
    assert.match((byId.get(Number(a2.id))?.reasons || []).join(' '), /NOT_WILLING|Willingness/);
    assert.equal(byId.get(Number(a3.id))?.eligibility, 'SUPPRESSED');
    assert.match((byId.get(Number(a3.id))?.reasons || []).join(' '), /opt-out/i);

    const eligible = snap.recipients.find((r: any) => r.alumniProfileId === Number(a1.id));
    assert.ok(eligible);

    const exec = await engagement.executeManualOutreach(actor, eligible.id, {
      outcome: 'INTERESTED',
      summary: 'Called — interested in mentoring AI students',
      createOpportunity: true,
    });
    assert.equal(exec.recipient.contactStatus, 'INTERESTED');
    assert.equal(exec.recipient.funnelStage, 'OPPORTUNITY_CREATED');
    assert.ok(exec.opportunityId);
    assert.ok(exec.interaction.interaction.id);

    const crmIx = await db('alumni_crm_interactions').where({ id: exec.interaction.interaction.id }).first();
    assert.equal(crmIx.capture_mode, 'MANUAL');
    assert.ok(!('delivered' in crmIx) || crmIx.delivered == null);

    const admin360 = await getAlumni360ForAdmin(actor, Number(a1.id));
    assert.ok(admin360.engagement?.available);
    assert.ok((admin360.engagement.campaignHistory || []).length >= 1);
  });

  it('enforces contact fatigue / suppression override audit and preference centre', async () => {
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, 'FAT');

    await engagement.upsertFatigueRule(actor, {
      categoryCode: 'MENTORSHIP',
      minDaysBetweenEquivalent: 45,
    });

    const { program } = await engagement.createProgram(actor, {
      name: 'Fatigue Prog',
      category: 'MENTORSHIP',
      status: 'ACTIVE',
    });
    const { campaign } = await engagement.createCampaign(actor, {
      programId: program.id,
      name: 'Fatigue Camp 1',
      channel: 'MANUAL',
      audienceSource: { type: 'EXPLICIT_IDS', alumniProfileIds: [Number(profile.id)] },
      requiresApproval: false,
    });
    await db('alumni_engagement_campaigns').where({ id: campaign.id }).update({
      status: 'APPROVED',
      approval_complete: true,
    });
    const snap = await engagement.snapshotCampaignAudience(actor, campaign.id);
    const recip = snap.recipients[0];
    await engagement.executeManualOutreach(actor, recip.id, { outcome: 'RESPONDED', summary: 'First contact' });

    const { campaign: c2 } = await engagement.createCampaign(actor, {
      programId: program.id,
      name: 'Fatigue Camp 2',
      channel: 'MANUAL',
      audienceSource: { type: 'EXPLICIT_IDS', alumniProfileIds: [Number(profile.id)] },
      requiresApproval: false,
    });
    const snap2 = await engagement.snapshotCampaignAudience(actor, c2.id);
    assert.equal(snap2.recipients[0].eligibility, 'SUPPRESSED');
    assert.match(snap2.recipients[0].reasons.join(' '), /Equivalent MENTORSHIP/);

    const over = await engagement.overrideSuppression(actor, snap2.recipients[0].id, {
      reason: 'Urgent mentor shortage — authorised override',
    });
    assert.equal(over.recipient.eligibility, 'ELIGIBLE');
    assert.equal(over.recipient.suppressionOverridden, true);

    const audit = await db('alumni_audit_log')
      .where({ college_id: college.id, action: 'ENGAGEMENT_SUPPRESSION_OVERRIDE' })
      .orderBy('id', 'desc')
      .first();
    assert.ok(audit);

    const aActor = alumniActor(profile);
    await engagement.updatePreferenceCentre(aActor, {
      commEmailOptIn: false,
      prefMentorshipOptIn: false,
      globalCommOptOut: false,
    });
    const prefs = await engagement.getPreferenceCentre(aActor);
    assert.equal(prefs.preferences.commEmailOptIn, false);
    assert.equal(prefs.preferences.prefMentorshipOptIn, false);

    const elig = await evaluateEligibilityBatch({
      actor,
      alumniProfileIds: [Number(profile.id)],
      category: 'MENTORSHIP',
      channel: 'EMAIL',
    });
    assert.equal(elig[0].eligibility, 'SUPPRESSED');
  });

  it('secures login-less tokens and applies responses to C1/C2/C3', async () => {
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, 'TOK', undefined, {
      open_to_mentoring: true,
    });

    const issued = await responseTokens.issueResponseToken(actor, {
      alumniProfileId: Number(profile.id),
      actionType: 'MENTORSHIP_INTEREST',
      expiresInHours: 24,
      maxUses: 1,
    });
    assert.ok(issued.token.length >= 32);
    assert.match(issued.responsePath, /^\/alumni\/engage\//);

    const peek = await responseTokens.peekResponseToken(issued.token);
    assert.equal(peek.actionType, 'MENTORSHIP_INTEREST');
    assert.ok(!('email' in peek));
    assert.ok(!('alumniProfileId' in peek));

    const submitted = await responseTokens.submitResponse({
      token: issued.token,
      choice: 'NO',
    });
    assert.equal(submitted.ok, true);
    assert.equal(submitted.applied.c1, true);

    const updated = await db('alumni_profiles').where({ id: profile.id }).first();
    assert.ok(!updated.open_to_mentoring);

    // C3 must stop surfacing them as willing mentor (decline may show TEMPORARILY_UNAVAILABLE)
    const intel = await getProfileIntelligence(actor, Number(profile.id));
    const mentorship = intel.dimensions.find((d: any) => d.dimension === 'MENTORSHIP');
    assert.ok(['NOT_WILLING', 'TEMPORARILY_UNAVAILABLE'].includes(mentorship?.willingnessState));
    assert.notEqual(mentorship?.willingnessState, 'WILLING');
    assert.ok(!mentorship?.qualifies);

    // Token reuse blocked
    await assert.rejects(() => responseTokens.submitResponse({ token: issued.token, choice: 'YES' }), (e: any) => e.status === 410);

    // Expired token
    const issued2 = await responseTokens.issueResponseToken(actor, {
      alumniProfileId: Number(profile.id),
      actionType: 'DATA_REFRESH',
      expiresInHours: 1,
    });
    await db('alumni_engagement_response_tokens').where({ id: issued2.tokenId }).update({
      expires_at: new Date(Date.now() - 1000),
    });
    await assert.rejects(() => responseTokens.peekResponseToken(issued2.token), (e: any) => e.status === 410);

    // Revoked token
    const issued3 = await responseTokens.issueResponseToken(actor, {
      alumniProfileId: Number(profile.id),
      actionType: 'DATA_REFRESH',
    });
    await responseTokens.revokeResponseToken(actor, issued3.tokenId);
    await assert.rejects(() => responseTokens.peekResponseToken(issued3.token), (e: any) => e.status === 410);

    // Data refresh no-change
    const issued4 = await responseTokens.issueResponseToken(actor, {
      alumniProfileId: Number(profile.id),
      actionType: 'DATA_REFRESH',
    });
    await responseTokens.submitResponse({ token: issued4.token, choice: 'NO_CHANGE' });
    const after = await db('alumni_profiles').where({ id: profile.id }).first();
    assert.ok(after.contact_verified_at);

    // Cross-tenant isolation: other college token hash won't match peek of forged id
    const otherCollege = await db('colleges').whereNot({ id: college.id }).first();
    if (otherCollege) {
      const otherAdmin = await ensureAdmin(otherCollege.id);
      const { profile: otherP } = await createVerifiedAlumni(otherCollege.id, 'X');
      const foreign = await responseTokens.issueResponseToken(adminActor(otherAdmin), {
        alumniProfileId: Number(otherP.id),
        actionType: 'GENERIC_YES_NO',
      });
      // Cannot use foreign token to mutate this college's profile — token is bound
      await responseTokens.submitResponse({ token: foreign.token, choice: 'YES' });
      const still = await db('alumni_profiles').where({ id: profile.id }).first();
      assert.equal(Boolean(still.open_to_mentoring), false);
    }

    const self360 = await getAlumni360ForSelf(alumniActor(updated));
    assert.ok(!self360.intelligence);
    assert.ok(self360.engagement?.selfView);
  });

  it('isolates tenants / RBAC and serves workspace + calendar', async () => {
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const accountant = await ensureAdmin(college.id, 'ACCOUNTANT');
    const actor = adminActor(admin);
    const accActor = adminActor(accountant);

    await assert.rejects(() => engagement.listPrograms(accActor), (e: any) => e.status === 403);

    const ws = await engagementWorkspace.getEngagementWorkspace(actor, { view: 'OVERVIEW' });
    assert.ok(ws.metrics);
    assert.ok(ws.channels.every((c: any) => !c.supportsDeliveryTelemetry));

    const cal = await engagementWorkspace.getEngagementCalendar(actor, { view: 'ACADEMIC_YEAR' });
    assert.ok(cal.range);

    // Department scope — dedicated dept so we never squat on shared ECE/CSE HODs.
    const dept = await ensureDepartment(college.id, `ENG${Date.now()}`.slice(0, 8));
    const hod = await ensureAdmin(college.id, 'HOD', { department_id: dept.id });
    const { profile: cseAlumni } = await createVerifiedAlumni(college.id, 'CSE');
    const { program } = await engagement.createProgram(adminActor(hod), {
      name: 'Dept Mentorship',
      category: 'MENTORSHIP',
      status: 'PLANNED',
    });
    assert.equal(program.scope, 'DEPARTMENT');

    // HOD cannot operate CSE alumni outside dept via eligibility
    const elig = await evaluateEligibilityBatch({
      actor: adminActor(hod),
      alumniProfileIds: [Number(cseAlumni.id)],
      category: 'MENTORSHIP',
      channel: 'MANUAL',
    });
    // CSE alumni may be suppressed as out of scope if dept differs
    if (Number(cseAlumni.historical_department_id) !== Number(dept.id)) {
      assert.equal(elig[0].eligibility, 'SUPPRESSED');
    }
    await db('faculty_users').where({ id: hod.id }).update({ is_active: false });
  });

  it('supports data-refresh program and recognition nomination handoff', async () => {
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const actor = adminActor(admin);
    const { profile } = await createVerifiedAlumni(college.id, 'DR');

    const { program } = await engagement.createProgram(actor, {
      name: 'Alumni Data Refresh 2026',
      category: 'DATA_REFRESH',
      status: 'ACTIVE',
      valueExchange: 'VALUE_TO_ALUMNI',
      valueToAlumni: 'Keep your professional profile current',
      targetDefinition: { freshness: 'stale_career_or_contact' },
    });
    assert.equal(program.category, 'DATA_REFRESH');

    const { campaign } = await engagement.createCampaign(actor, {
      programId: program.id,
      name: 'Refresh wave 1',
      channel: 'MANUAL',
      audienceSource: {
        type: 'FILTERS',
        filters: { graduationYearMin: 2015, graduationYearMax: 2025 },
      },
      requiresApproval: false,
    });
    await db('alumni_engagement_campaigns').where({ id: campaign.id }).update({
      status: 'APPROVED',
      approval_complete: true,
    });
    const snap = await engagement.snapshotCampaignAudience(actor, campaign.id);
    assert.ok(snap.counts.targeted >= 1);

    const nom = await engagement.nominateRecognition(actor, {
      alumniProfileId: Number(profile.id),
      programId: program.id,
      title: 'Distinguished Mentor Candidate',
      rationale: 'Strong mentoring interest',
      evidenceRefs: [{ type: 'NOTE', ref: 'manual' }],
    });
    assert.equal(nom.nomination.status, 'NOMINATED');
  });
});
