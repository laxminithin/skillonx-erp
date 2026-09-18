import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import bcrypt from 'bcrypt';
import { db } from '../../db/index.js';
import * as alumni from './service.js';

const password = 'Alumni123';

async function baseCollege() {
  let college = await db('colleges').orderBy('id').first();
  if (!college) {
    const [id] = await db('colleges').insert({ name: 'Alumni Test College', code: `ATC${Date.now()}` });
    college = await db('colleges').where({ id }).first();
  }
  return college;
}

async function ensureAdmin(collegeId: number) {
  let admin = await db('faculty_users').where({ college_id: collegeId, role: 'COLLEGE_ADMIN' }).first();
  if (!admin) {
    const [id] = await db('faculty_users').insert({
      college_id: collegeId,
      name: 'Alumni Admin',
      email: `alumni.admin.${Date.now()}@test.edu`,
      password_hash: await bcrypt.hash(password, 10),
      role: 'COLLEGE_ADMIN',
      is_active: true,
    });
    admin = await db('faculty_users').where({ id }).first();
  }
  return admin;
}

async function ensureFaculty(collegeId: number) {
  const [id] = await db('faculty_users').insert({
    college_id: collegeId,
    name: 'Generic Faculty',
    email: `alumni.faculty.${Date.now()}@test.edu`,
    password_hash: await bcrypt.hash(password, 10),
    role: 'FACULTY',
    is_active: true,
  });
  return db('faculty_users').where({ id }).first();
}

async function ensureOtherCollege() {
  const base = await baseCollege();
  let other = await db('colleges').whereNot({ id: base.id }).orderBy('id').first();
  if (!other) {
    const [id] = await db('colleges').insert({ name: 'Alumni Other College', code: `AOC${Date.now()}` });
    other = await db('colleges').where({ id }).first();
  }
  return other;
}

async function ensureDepartment(collegeId: number) {
  let dept = await db('departments').where({ college_id: collegeId }).first();
  if (!dept) {
    const [id] = await db('departments').insert({ college_id: collegeId, name: 'Computer Science', code: `CSE${Date.now()}` });
    dept = await db('departments').where({ id }).first();
  }
  return dept;
}

async function createStudent(collegeId: number, tag: string) {
  const dept = await ensureDepartment(collegeId);
  const usn = `AL${Date.now()}${tag}`.slice(0, 60).toUpperCase();
  const [id] = await db('students').insert({
    college_id: collegeId,
    department_id: dept.id,
    name: `Alumni ${tag}`,
    usn,
    email: `${usn.toLowerCase()}@alumni.test`,
    phone: `90000${String(Date.now()).slice(-5)}`,
    semester: '8',
    section: 'A',
    is_active: true,
  });
  return db('students').where({ id }).first();
}

async function createVerifiedAlumni(collegeId: number, tag: string) {
  const student = await createStudent(collegeId, tag);
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
    graduation_year: 2024,
    headline: `${tag} engineer`,
    current_city: tag === 'A' ? 'Bengaluru' : 'Mysuru',
    skills: JSON.stringify(['React', 'Data']),
    email_visibility: 'PRIVATE',
    phone_visibility: 'PRIVATE',
    bio_visibility: 'ALUMNI_NETWORK',
  });
  const profile = await db('alumni_profiles').where({ id }).first();
  return {
    student,
    profile,
    actor: {
      alumniProfileId: Number(profile.id),
      studentId: Number(profile.student_id),
      collegeId,
      role: 'ALUMNI' as const,
      email: profile.email,
      name: profile.historical_name,
    },
  };
}

function adminActor(admin: any): alumni.AlumniAdminActor {
  return {
    facultyUserId: Number(admin.id),
    collegeId: Number(admin.college_id),
    departmentId: admin.department_id != null ? Number(admin.department_id) : null,
    role: admin.role,
    name: admin.name,
  };
}

describe('Alumni Management focused backend', () => {
  it('authenticates verified alumni and blocks pending alumni', async () => {
    const college = await baseCollege();
    const verified = await createVerifiedAlumni(Number(college.id), 'AUTH');
    const login = await alumni.loginAlumni(verified.profile.email, password);
    assert.equal(login.user.role, 'ALUMNI');

    const pendingStudent = await createStudent(Number(college.id), 'PEND');
    await db('alumni_profiles').insert({
      college_id: college.id,
      student_id: pendingStudent.id,
      email: pendingStudent.email,
      password_hash: await bcrypt.hash(password, 10),
      lifecycle_state: 'PENDING_VERIFICATION',
      verification_state: 'PENDING',
      historical_name: pendingStudent.name,
      historical_usn: pendingStudent.usn,
      graduation_year: 2024,
    });
    await assert.rejects(() => alumni.loginAlumni(pendingStudent.email, password), /not verified/);
  });

  it('transitions one student to one alumni profile and verifies through admin', async () => {
    const college = await baseCollege();
    const admin = await ensureAdmin(Number(college.id));
    const student = await createStudent(Number(college.id), 'TRN');
    const first = await alumni.transitionStudent(adminActor(admin), {
      studentId: Number(student.id),
      graduationYear: 2024,
      initialPassword: password,
      verifyNow: false,
    });
    const second = await alumni.transitionStudent(adminActor(admin), {
      studentId: Number(student.id),
      graduationYear: 2024,
      initialPassword: password,
      verifyNow: false,
    });
    assert.equal(Number(first.id), Number(second.id));
    const verified = await alumni.verifyProfile(adminActor(admin), Number(first.id));
    assert.equal(verified.verification_state, 'VERIFIED');
  });

  it('enforces directory privacy and IDOR ownership for profile extensions', async () => {
    const college = await baseCollege();
    const a = await createVerifiedAlumni(Number(college.id), 'A');
    const b = await createVerifiedAlumni(Number(college.id), 'B');
    const directory = await alumni.directory(a.actor, { q: 'Alumni' });
    const seenB = directory.alumni.find((p: any) => p.id === Number(b.profile.id));
    assert.ok(seenB);
    assert.equal(seenB.email, null);
    assert.equal(seenB.phone, null);

    const bEmployment = await alumni.upsertEmployment(b.actor, {
      organization: 'Private Corp',
      designation: 'Lead',
      isCurrent: true,
    });
    await assert.rejects(
      () => alumni.upsertEmployment(a.actor, { organization: 'Takeover' }, Number(bEmployment.id)),
      /not found/i,
    );

    const bStudy = await alumni.upsertHigherStudy(b.actor, { institution: 'Private University', status: 'CURRENT' });
    await assert.rejects(
      () => alumni.upsertHigherStudy(a.actor, { institution: 'Wrong University' }, Number(bStudy.id)),
      /not found/i,
    );
  });

  it('prevents cross-college alumni and admin leakage', async () => {
    const base = await baseCollege();
    const other = await ensureOtherCollege();
    const a = await createVerifiedAlumni(Number(base.id), 'TENANTA');
    const b = await createVerifiedAlumni(Number(other.id), 'TENANTB');
    const dir = await alumni.directory(b.actor, { q: a.profile.historical_name });
    assert.equal(dir.alumni.length, 0);

    const otherAdmin = await ensureAdmin(Number(other.id));
    const profiles = await alumni.adminListProfiles(adminActor(otherAdmin), { q: a.profile.historical_usn });
    assert.equal(profiles.profiles.length, 0);
  });

  it('denies generic faculty alumni administration', async () => {
    const college = await baseCollege();
    const faculty = await ensureFaculty(Number(college.id));
    await assert.rejects(() => alumni.adminOverview(adminActor(faculty)), /Alumni administration access required/);
  });

  it('keeps event registration idempotent and capacity-bound', async () => {
    const college = await baseCollege();
    const admin = await ensureAdmin(Number(college.id));
    const a = await createVerifiedAlumni(Number(college.id), 'EVA');
    const b = await createVerifiedAlumni(Number(college.id), 'EVB');
    const event = await alumni.adminCreateEvent(adminActor(admin), {
      title: 'Capacity Alumni Meet',
      startsAt: new Date(Date.now() + 86_400_000).toISOString(),
      status: 'PUBLISHED',
      capacity: 1,
    });

    await Promise.all([alumni.registerEvent(a.actor, Number(event.id)), alumni.registerEvent(a.actor, Number(event.id))]);
    const aCount = await db('alumni_event_registrations').where({ event_id: event.id, alumni_profile_id: a.profile.id }).count({ c: '*' }).first();
    assert.equal(Number(aCount?.c ?? 0), 1);

    await assert.rejects(() => alumni.registerEvent(b.actor, Number(event.id)), /capacity/i);
  });

  it('handles opportunities and contribution idempotency without duplicating Finance', async () => {
    const college = await baseCollege();
    const admin = await ensureAdmin(Number(college.id));
    const a = await createVerifiedAlumni(Number(college.id), 'OPP');
    const opp = await alumni.submitOpportunity(a.actor, {
      title: 'Referral opening',
      opportunityType: 'REFERRAL',
      organization: 'Canonical Company',
    });
    const approved = await alumni.adminModerateOpportunity(adminActor(admin), Number(opp.id), 'APPROVED');
    assert.equal(approved.status, 'APPROVED');

    const first = await alumni.createContributionIntent(a.actor, {
      purpose: 'GENERAL',
      amount: 1000,
      idempotencyKey: `alumni-e2e-${Date.now()}`,
    });
    const second = await alumni.createContributionIntent(a.actor, {
      purpose: 'GENERAL',
      amount: 1000,
      idempotencyKey: first.idempotency_key,
    });
    assert.equal(Number(first.id), Number(second.id));
    assert.equal(first.finance_receipt_id, null);
  });

  it('rejects alumni mass-assignment of protected profile fields', async () => {
    assert.throws(() => alumni.alumniProfileUpdateSchema.parse({ role: 'COLLEGE_ADMIN', verificationState: 'VERIFIED' }));
  });
});
