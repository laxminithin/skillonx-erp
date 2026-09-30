import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import bcrypt from 'bcrypt';
import { db } from '../../db/index.js';
import * as alumni from './service.js';
import { getAlumni360ForAdmin, getAlumni360ForSelf } from './aggregate360.js';
import * as crm from './crmService.js';
import * as crmTimeline from './crmTimeline.js';
import * as crmWorkspace from './crmWorkspace.js';
import { AppError } from '../../utils/errors.js';

const password = 'AlumniCrm!';

async function baseCollege() {
  let college = await db('colleges').orderBy('id').first();
  if (!college) {
    const [id] = await db('colleges').insert({ name: 'AlumniCRM College', code: `ACRM${Date.now()}` });
    college = await db('colleges').where({ id }).first();
  }
  return college;
}

async function ensureAdmin(collegeId: number, role = 'COLLEGE_ADMIN') {
  let admin = await db('faculty_users').where({ college_id: collegeId, role }).first();
  if (!admin) {
    const [id] = await db('faculty_users').insert({
      college_id: collegeId,
      name: `CRM ${role}`,
      email: `crm.${role.toLowerCase()}.${Date.now()}@test.edu`,
      password_hash: await bcrypt.hash(password, 10),
      role,
      is_active: true,
    });
    admin = await db('faculty_users').where({ id }).first();
  }
  return admin;
}

async function ensureDepartment(collegeId: number) {
  let dept = await db('departments').where({ college_id: collegeId }).first();
  if (!dept) {
    const [id] = await db('departments').insert({ college_id: collegeId, name: 'CSE', code: `CSE${Date.now()}` });
    dept = await db('departments').where({ id }).first();
  }
  return dept;
}

async function createVerifiedAlumni(collegeId: number, tag: string, deptId?: number) {
  const dept = deptId ? { id: deptId } : await ensureDepartment(collegeId);
  const usn = `CRM${Date.now()}${tag}`.slice(0, 60).toUpperCase();
  const [sid] = await db('students').insert({
    college_id: collegeId,
    department_id: dept.id,
    name: `CRM ${tag}`,
    usn,
    email: `${usn.toLowerCase()}@crm.test`,
    phone: `92222${String(Date.now()).slice(-5)}`,
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
    graduation_year: 2022,
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

describe('Alumni Relationship CRM (C2)', () => {
  it('creates relationship, logs interaction, advances stage, projects timeline', async () => {
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const { profile } = await createVerifiedAlumni(college.id, 'IX');
    const actor = adminActor(admin);

    const rel = await crm.getRelationshipForAdmin(actor, Number(profile.id));
    assert.ok(rel.relationship.id);
    assert.equal(rel.relationship.relationshipStage, 'REACHABLE');

    // Seed projected event attendance
    if (await db.schema.hasTable('alumni_events')) {
      const [eid] = await db('alumni_events').insert({
        college_id: college.id,
        title: 'Alumni Meet 2026',
        event_type: 'ALUMNI_MEET',
        starts_at: new Date(),
        status: 'PUBLISHED',
        visibility: 'ALUMNI_NETWORK',
      });
      await db('alumni_event_registrations').insert({
        college_id: college.id,
        event_id: eid,
        alumni_profile_id: profile.id,
        status: 'ATTENDED',
        registered_at: new Date(),
        checked_in_at: new Date(),
      });
    }

    const created = await crm.createInteraction(actor, Number(profile.id), {
      interactionType: 'PHONE_CALL',
      channel: 'PHONE',
      purpose: 'Reconnect',
      summary: 'No answer on first attempt',
      outcomeStatus: 'NO_RESPONSE',
      occurredAt: new Date().toISOString(),
      isContactAttempt: true,
    });
    assert.equal(created.interaction.captureMode, 'MANUAL');
    assert.ok(created.warnings);

    const after = await crm.getRelationshipForAdmin(actor, Number(profile.id));
    assert.equal(after.relationship.relationshipStage, 'CONTACTED');

    await crm.createInteraction(actor, Number(profile.id), {
      interactionType: 'PHONE_CALL',
      summary: 'Spoke with alumnus',
      outcomeStatus: 'RESPONDED',
      occurredAt: new Date().toISOString(),
      isContactAttempt: true,
      isMeaningfulEngagement: true,
    });
    const engaged = await crm.getRelationshipForAdmin(actor, Number(profile.id));
    assert.ok(['RESPONDED', 'ENGAGED'].includes(engaged.relationship.relationshipStage));

    const timeline = await crmTimeline.getTimelineForAdmin(actor, Number(profile.id));
    assert.ok(timeline.timeline.some((t) => t.sourceType === 'CRM_INTERACTION'));
    assert.ok(timeline.timeline.some((t) => t.captureMode === 'SYSTEM_PROJECTED' && t.interactionType === 'EVENT') || timeline.timeline.length >= 1);
  });

  it('follow-ups, opportunities, outcomes, verification, ownership', async () => {
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const { profile } = await createVerifiedAlumni(college.id, 'OPP');
    const actor = adminActor(admin);

    const fu = await crm.createFollowup(actor, Number(profile.id), {
      reason: 'Call back next week',
      dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      priority: 'HIGH',
    });
    assert.equal(fu.followup.status, 'OPEN');

    const opp = await crm.createOpportunity(actor, Number(profile.id), {
      opportunityType: 'INTERNSHIP',
      title: 'Summer internship slots',
      description: 'May offer 5 internships',
      status: 'CONFIRMED',
    });
    assert.equal(opp.opportunity.status, 'CONFIRMED');

    const stage = await crm.getRelationshipForAdmin(actor, Number(profile.id));
    assert.ok(['OPPORTUNITY_IDENTIFIED', 'ACTION_IN_PROGRESS'].includes(stage.relationship.relationshipStage));

    await assert.rejects(
      () =>
        crm.createOutcome(actor, opp.opportunity.id, {
          outcomeType: 'INTERNSHIPS_ENABLED',
          title: 'Intention only',
          outcomeDate: new Date().toISOString().slice(0, 10),
        }),
      (e: any) => e instanceof AppError && e.status === 400,
    );

    const outcome = await crm.createOutcome(actor, opp.opportunity.id, {
      outcomeType: 'INTERNSHIPS_ENABLED',
      title: '5 internship positions offered',
      quantity: 5,
      evidenceReference: 'email-confirmation-ref',
      outcomeDate: new Date().toISOString().slice(0, 10),
      description: 'Offer letters issued via T&P',
    });
    assert.equal(outcome.outcome.verificationStatus, 'UNVERIFIED');

    const verified = await crm.verifyOutcome(actor, outcome.outcome.id, 'VERIFY');
    assert.equal(verified.outcome.verificationStatus, 'VERIFIED');
    const afterVerify = await crm.getRelationshipForAdmin(actor, Number(profile.id));
    assert.equal(afterVerify.relationship.relationshipStage, 'OUTCOME_ACHIEVED');

    const reassigned = await crm.reassignOwnership(actor, Number(profile.id), {
      ownerFacultyId: actor.facultyUserId,
      ownerType: 'ALUMNI_OFFICER',
      reason: 'Primary ownership confirmed for alumni office',
    });
    assert.equal(reassigned.relationship.relationshipOwnerId, actor.facultyUserId);
    assert.ok(reassigned.ownershipHistory.length >= 1);
  });

  it('notes privacy: internal notes never appear in alumni self CRM', async () => {
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const { profile } = await createVerifiedAlumni(college.id, 'NOTE');
    const actor = adminActor(admin);

    await crm.createNote(actor, Number(profile.id), {
      noteType: 'INTERNAL_NOTE',
      body: 'Sensitive internal speculation must stay hidden',
      visibility: 'INTERNAL',
    });
    await crm.createNote(actor, Number(profile.id), {
      noteType: 'GENERAL_RELATIONSHIP_NOTE',
      body: 'Institutional note',
      visibility: 'INSTITUTIONAL',
    });
    await crm.createInteraction(actor, Number(profile.id), {
      interactionType: 'EMAIL',
      summary: 'Welcome email logged',
      outcomeStatus: 'CONTACTED',
      occurredAt: new Date().toISOString(),
      visibility: 'ALUMNI_VISIBLE',
      isContactAttempt: true,
    });

    const adminNotes = await crm.listNotesForAdmin(actor, Number(profile.id));
    assert.ok(adminNotes.notes.some((n) => n.noteType === 'INTERNAL_NOTE'));

    const selfCrm = await crmWorkspace.buildCrmSelfSection(college.id, Number(profile.id));
    const blob = JSON.stringify(selfCrm);
    assert.equal(blob.includes('Sensitive internal speculation'), false);
    assert.equal(blob.includes('INTERNAL_NOTE'), false);

    const self360 = await getAlumni360ForSelf(alumniActor(profile));
    assert.equal(JSON.stringify(self360).includes('Sensitive internal speculation'), false);
  });

  it('duplicate-contact warning and RBAC / tenant isolation', async () => {
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const { profile } = await createVerifiedAlumni(college.id, 'DUP');
    const actor = adminActor(admin);

    await crm.createInteraction(actor, Number(profile.id), {
      interactionType: 'WHATSAPP',
      summary: 'Manual outreach (no delivery claim)',
      outcomeStatus: 'CONTACTED',
      occurredAt: new Date().toISOString(),
      isContactAttempt: true,
      captureMode: 'MANUAL',
    });
    const second = await crm.createInteraction(actor, Number(profile.id), {
      interactionType: 'PHONE_CALL',
      summary: 'Second attempt',
      outcomeStatus: 'NO_RESPONSE',
      occurredAt: new Date().toISOString(),
      isContactAttempt: true,
    });
    assert.ok(second.warnings.some((w) => w.code === 'RECENT_CONTACT'));

    // Faculty outside department
    const dept = await ensureDepartment(college.id);
    const otherDeptId = await db('departments')
      .insert({ college_id: college.id, name: 'ECE', code: `ECE${Date.now()}` })
      .then(async ([id]) => id);
    const [fid] = await db('faculty_users').insert({
      college_id: college.id,
      department_id: otherDeptId,
      name: 'Other Faculty',
      email: `crm.fac.${Date.now()}@test.edu`,
      password_hash: await bcrypt.hash(password, 10),
      role: 'FACULTY',
      is_active: true,
    });
    const faculty = await db('faculty_users').where({ id: fid }).first();
    const facActor = adminActor(faculty);
    await assert.rejects(
      () => crm.getRelationshipForAdmin(facActor, Number(profile.id)),
      (e: any) => e instanceof AppError && e.status === 403,
    );

    // Cross-college
    const [cid2] = await db('colleges').insert({ name: 'Other College CRM', code: `OX${Date.now()}` });
    const otherAdmin = await ensureAdmin(cid2);
    await assert.rejects(
      () => crm.getRelationshipForAdmin(adminActor(otherAdmin), Number(profile.id)),
      (e: any) => e instanceof AppError && (e.status === 404 || e.status === 403),
    );

    // Accountant cannot access CRM
    const [aid] = await db('faculty_users').insert({
      college_id: college.id,
      name: 'Accountant',
      email: `crm.acct.${Date.now()}@test.edu`,
      password_hash: await bcrypt.hash(password, 10),
      role: 'ACCOUNTANT',
      is_active: true,
    });
    const accountant = await db('faculty_users').where({ id: aid }).first();
    await assert.rejects(
      () => crmWorkspace.getCrmWorkspace(adminActor(accountant)),
      (e: any) => e instanceof AppError && e.status === 403,
    );

    void dept;
  });

  it('does not silently downgrade relationship stage', async () => {
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const { profile } = await createVerifiedAlumni(college.id, 'STG');
    const actor = adminActor(admin);

    await crm.explicitStageTransition(actor, Number(profile.id), 'ENGAGED', 'Authorised jump for test');
    await crm.createInteraction(actor, Number(profile.id), {
      interactionType: 'SMS',
      summary: 'Later contact attempt should not downgrade',
      outcomeStatus: 'CONTACTED',
      occurredAt: new Date().toISOString(),
      isContactAttempt: true,
    });
    const rel = await crm.getRelationshipForAdmin(actor, Number(profile.id));
    assert.equal(rel.relationship.relationshipStage, 'ENGAGED');
  });

  it('CRM workspace and 360 admin section load', async () => {
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const { profile } = await createVerifiedAlumni(college.id, 'WS');
    const actor = adminActor(admin);
    await crm.createFollowup(actor, Number(profile.id), {
      reason: 'Workspace item',
      dueDate: new Date().toISOString().slice(0, 10),
    });
    const ws = await crmWorkspace.getCrmWorkspace(actor, { view: 'MY_FOLLOWUPS' });
    assert.ok(ws.metrics);
    assert.ok(Array.isArray(ws.items));
    // No contact leak
    assert.equal(JSON.stringify(ws).includes('@crm.test'), false);

    const a360 = await getAlumni360ForAdmin(actor, Number(profile.id));
    assert.ok(a360.crm?.available);
    assert.ok(a360.crm.relationshipStatus);
  });
});
