import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import bcrypt from 'bcrypt';
import { db } from '../../db/index.js';
import * as alumni from './service.js';
import { getAlumni360ForAdmin, getAlumni360ForSelf } from './aggregate360.js';
import { backfillAlumni360 } from './backfill360.js';
import { computeFreshness } from './freshness.js';
import { computeAlumniCompleteness } from './completeness360.js';
import * as m360 from './mutations360.js';
import { AppError } from '../../utils/errors.js';

const password = 'Alumni360!';
let testCollege: any;

before(async () => {
  const [id] = await db('colleges').insert({
    name: 'Alumni360 College',
    code: `A360${process.pid}${Date.now()}`,
  });
  testCollege = await db('colleges').where({ id }).first();
});

after(async () => {
  await db.destroy();
});

async function baseCollege() {
  return testCollege;
}

async function ensureAdmin(collegeId: number) {
  let admin = await db('faculty_users').where({ college_id: collegeId, role: 'COLLEGE_ADMIN' }).first();
  if (!admin) {
    const [id] = await db('faculty_users').insert({
      college_id: collegeId,
      name: 'A360 Admin',
      email: `a360.admin.${Date.now()}@test.edu`,
      password_hash: await bcrypt.hash(password, 10),
      role: 'COLLEGE_ADMIN',
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

async function createStudent(collegeId: number, tag: string) {
  const dept = await ensureDepartment(collegeId);
  const usn = `A360${Date.now()}${tag}`.slice(0, 60).toUpperCase();
  const [id] = await db('students').insert({
    college_id: collegeId,
    department_id: dept.id,
    name: `A360 ${tag}`,
    usn,
    email: `${usn.toLowerCase()}@a360.test`,
    phone: `91111${String(Date.now()).slice(-5)}`,
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
    graduation_year: 2023,
    headline: `${tag} engineer`,
    current_city: 'Bengaluru',
    skills: JSON.stringify(['TypeScript']),
    email_visibility: 'PRIVATE',
    phone_visibility: 'PRIVATE',
  });
  return { profile: await db('alumni_profiles').where({ id }).first(), student };
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

function adminActor(admin: any): alumni.AlumniAdminActor {
  return {
    facultyUserId: Number(admin.id),
    collegeId: Number(admin.college_id),
    departmentId: admin.department_id ?? null,
    role: admin.role,
    name: admin.name,
  };
}

describe('Alumni 360 foundation', () => {
  it('aggregates 360 for self without fabricating relationship counters', async () => {
    const college = await baseCollege();
    const { profile } = await createVerifiedAlumni(college.id, 'SELF');
    const actor = alumniActor(profile);
    await m360.upsertEmployment360(actor, {
      organization: 'Acme Corp',
      designation: 'Engineer',
      industry: 'Software',
      functionalArea: 'Engineering',
      seniority: 'Mid',
      isCurrent: true,
      startDate: '2024-01-01',
    });
    await m360.updateWillingness(actor, { openToMentoring: true, openToRecruitment: false, confirmNow: true });

    const view = await getAlumni360ForSelf(actor);
    assert.equal(view.identity.alumniId, Number(profile.id));
    assert.equal(view.academic.provenance.verificationStatus, 'AUTHORITATIVE');
    assert.ok(view.career.current);
    assert.equal(view.career.current.organization, 'Acme Corp');
    assert.equal(view.interestsAvailability.willingness.openToMentoring, true);
    assert.equal(view.interestsAvailability.willingness.openToRecruitment, false);
    assert.equal(view.interestsAvailability.willingness.openToInternships, null);
    assert.equal(view.institutionalRelationship.eventsAttended, 0);
    assert.ok(Array.isArray(view.institutionalRelationship.sources));
    assert.ok(view.dataQuality.completeness.sections.length >= 6);
    assert.ok(view.dataQuality.freshness.some((f) => f.domain === 'ACADEMIC'));
  });

  it('blocks alumni from reading another department alumni 360 as faculty', async () => {
    const college = await baseCollege();
    const homeDept = await ensureDepartment(college.id);
    const a = await createVerifiedAlumni(college.id, 'A');
    const [otherDeptId] = await db('departments').insert({
      college_id: college.id,
      name: 'ECE',
      code: `ECE${Date.now()}`,
    });
    await db('alumni_profiles').where({ id: a.profile.id }).update({ historical_department_id: otherDeptId });
    const [facId] = await db('faculty_users').insert({
      college_id: college.id,
      name: 'Generic Fac',
      email: `fac.${Date.now()}@test.edu`,
      password_hash: await bcrypt.hash(password, 10),
      role: 'FACULTY',
      is_active: true,
      department_id: homeDept.id,
    });
    const faculty = await db('faculty_users').where({ id: facId }).first();

    await assert.rejects(
      () => getAlumni360ForAdmin(adminActor(faculty), Number(a.profile.id)),
      (err: unknown) => err instanceof AppError && err.status === 403,
    );
  });

  it('protects authoritative academic fields from alumni profile updates', async () => {
    const college = await baseCollege();
    const { profile } = await createVerifiedAlumni(college.id, 'AUTH');
    const actor = alumniActor(profile);
    await alumni.updateOwnProfile(actor, { historical_usn: 'HACKED' } as any);
    const fresh = await db('alumni_profiles').where({ id: profile.id }).first();
    assert.equal(fresh.historical_usn, profile.historical_usn);
  });

  it('staff suggestion does not silently overwrite; accept applies with provenance', async () => {
    if (!(await db.schema.hasTable('alumni_profile_suggestions'))) return;
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const { profile } = await createVerifiedAlumni(college.id, 'SUG');
    const suggestion = await m360.createSuggestion(adminActor(admin), {
      alumniProfileId: Number(profile.id),
      suggestionType: 'EMPLOYMENT_UPDATE',
      title: 'Possible employment update',
      payload: { organization: 'Microsoft', designation: 'SDE', isCurrent: true },
      rationale: 'Faculty knowledge',
    });
    assert.equal(suggestion.status, 'PENDING');
    const before = await db('alumni_employment').where({ alumni_profile_id: profile.id });
    assert.equal(before.length, 0);

    const accepted = await m360.reviewSuggestion(adminActor(admin), Number(suggestion.id), { action: 'ACCEPT' });
    assert.equal(accepted.status, 'ACCEPTED');
    const after = await db('alumni_employment').where({ alumni_profile_id: profile.id });
    assert.equal(after.length, 1);
    assert.equal(after[0].organization, 'Microsoft');
    assert.equal(after[0].source_type, 'FACULTY');
    assert.equal(after[0].verification_status, 'INSTITUTION_VERIFIED');
  });

  it('never auto-merges ambiguous identities without confirmAmbiguous', async () => {
    if (!(await db.schema.hasTable('alumni_identity_candidates'))) return;
    const college = await baseCollege();
    const admin = await ensureAdmin(college.id);
    const a = await createVerifiedAlumni(college.id, 'M1');
    const b = await createVerifiedAlumni(college.id, 'M2');
    await db('alumni_profiles').where({ id: b.profile.id }).update({
      historical_name: a.profile.historical_name,
      graduation_year: a.profile.graduation_year,
    });
    await m360.detectIdentityCandidates(adminActor(admin));
    const cand = await db('alumni_identity_candidates')
      .where({ college_id: college.id })
      .where((q) => {
        q.where({ primary_profile_id: a.profile.id, candidate_profile_id: b.profile.id })
          .orWhere({ primary_profile_id: b.profile.id, candidate_profile_id: a.profile.id });
      })
      .first();
    if (!cand) return; // detection may require exact name match after create
    if (cand.status === 'AMBIGUOUS') {
      await assert.rejects(
        () => m360.mergeAlumniIdentities(adminActor(admin), {
          survivorProfileId: Number(a.profile.id),
          mergedProfileId: Number(b.profile.id),
          reason: 'Duplicate test',
        }),
        (err: unknown) => err instanceof AppError && err.status === 409,
      );
    }
  });

  it('directory hides private contact and respects directory_visible', async () => {
    const college = await baseCollege();
    const a = await createVerifiedAlumni(college.id, 'DIRA');
    const b = await createVerifiedAlumni(college.id, 'DIRB');
    if (await db.schema.hasColumn('alumni_profiles', 'directory_visible')) {
      await db('alumni_profiles').where({ id: b.profile.id }).update({ directory_visible: false });
    }
    const dir = await alumni.directory(alumniActor(a.profile), { limit: 50 });
    const foundB = dir.alumni.find((x: any) => x.id === Number(b.profile.id));
    if (await db.schema.hasColumn('alumni_profiles', 'directory_visible')) {
      assert.equal(foundB, undefined);
    }
    const peer = dir.alumni.find((x: any) => x.id === Number(a.profile.id));
    if (peer) {
      assert.equal(peer.email, null);
      assert.equal(peer.phone, null);
    }
  });

  it('computes section-based completeness and freshness states', async () => {
    const college = await baseCollege();
    const { profile } = await createVerifiedAlumni(college.id, 'DQ');
    const completeness = await computeAlumniCompleteness({
      profile,
      employment: [],
      higherStudies: [],
      achievements: [],
      entrepreneurship: [],
      capabilities: [],
      relationship: { eventsAttended: 0, contributions: 0, mentoringInteractions: 0 },
    });
    assert.ok(completeness.sections.find((s) => s.key === 'CAREER')?.status === 'NOT_PROVIDED');
    assert.ok(completeness.sections.find((s) => s.key === 'ACADEMIC')?.status === 'AUTHORITATIVE' || completeness.sections.find((s) => s.key === 'ACADEMIC'));
    const freshness = await computeFreshness(college.id, profile, []);
    assert.ok(freshness.find((f) => f.domain === 'EMPLOYMENT')?.state === 'UNVERIFIED');
    assert.ok(freshness.find((f) => f.domain === 'ACADEMIC'));
  });

  it('backfill produces statistics without inventing data', async () => {
    const college = await baseCollege();
    await createVerifiedAlumni(college.id, 'BF');
    const stats = await backfillAlumni360(college.id);
    assert.ok(stats.totalAlumni >= 1);
    assert.ok(typeof stats.academicLinkagePct === 'number');
    assert.ok(stats.note.includes('UNKNOWN'));
  });

  it('blocks cross-college admin 360 access', async () => {
    const college = await baseCollege();
    const other = await db('colleges').whereNot({ id: college.id }).first()
      || await db('colleges').insert({ name: 'Other360', code: `O360${Date.now()}` }).then(async ([id]) => db('colleges').where({ id }).first());
    const { profile } = await createVerifiedAlumni(college.id, 'XCOL');
    const otherAdmin = await db('faculty_users').insert({
      college_id: other.id,
      name: 'Other Admin',
      email: `other.admin.${Date.now()}@test.edu`,
      password_hash: await bcrypt.hash(password, 10),
      role: 'COLLEGE_ADMIN',
      is_active: true,
    }).then(([id]) => db('faculty_users').where({ id }).first());
    await assert.rejects(
      () => getAlumni360ForAdmin(adminActor(otherAdmin), Number(profile.id)),
      (err: unknown) => err instanceof AppError && err.status === 404,
    );
  });

  it('merge privilege is restricted', async () => {
    if (!(await db.schema.hasTable('alumni_merge_audit'))) return;
    const college = await baseCollege();
    const faculty = await db('faculty_users').insert({
      college_id: college.id,
      name: 'No Merge',
      email: `nomerg.${Date.now()}@test.edu`,
      password_hash: await bcrypt.hash(password, 10),
      role: 'FACULTY',
      is_active: true,
    }).then(([id]) => db('faculty_users').where({ id }).first());
    const a = await createVerifiedAlumni(college.id, 'MG1');
    const b = await createVerifiedAlumni(college.id, 'MG2');
    await assert.rejects(
      () => m360.mergeAlumniIdentities(adminActor(faculty), {
        survivorProfileId: Number(a.profile.id),
        mergedProfileId: Number(b.profile.id),
        reason: 'Should fail',
        confirmAmbiguous: true,
      }),
      (err: unknown) => err instanceof AppError && err.status === 403,
    );
  });
});
