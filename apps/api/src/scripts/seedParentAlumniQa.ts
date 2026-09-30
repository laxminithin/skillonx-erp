/**
 * Parent + Alumni portal QA seed (idempotent).
 *
 * The other QA seed scripts (seedLiveQa, seedStudentLmsE2e, seedOfficeQa,
 * seedAdmissionsQa, seedLabManagement, seedMaintenance) never create a
 * `parent_users` or `alumni_profiles` row, leaving the Parent (`/parent`) and
 * Alumni (`/alumni`) Web portals with no QA login on a clean database even
 * though seed:student-lms-e2e has already run. This fills that gap using the
 * same VVIET / SX-E2E-CSE-3A fixtures.
 *
 * Requires seed:student-lms-e2e (or seed:live-qa, which runs it) to have run
 * first — it looks up existing students by USN and soft-skips if absent.
 */
import bcrypt from 'bcrypt';
import { pathToFileURL } from 'node:url';
import { db } from '../db/index.js';
import { env } from '../config/env.js';

const PARENT_EMAIL = 'qa.parent@vviet.edu.in';
const ALUMNI_EMAIL = 'qa.alumni@vviet.edu.in';
const PASSWORD = process.env.LIVE_QA_FACULTY_PASSWORD || 'Password123';
const PARENT_LINKED_USN = '4VV24CS001'; // e2e.approved — active student, exercises the live parent-view journey
const ALUMNI_STUDENT_USN = '4VV24CS006'; // reused as the alumni's historical student record

function assertQaAllowed() {
  if (env.NODE_ENV === 'production' && process.env.ALLOW_TEST_SEED !== 'true') {
    throw new Error('Parent/Alumni QA seed is not available in production without ALLOW_TEST_SEED=true');
  }
}

export async function seedParentAlumniQa(options: { closeDb?: boolean } = {}) {
  assertQaAllowed();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const linkedStudent = await db('students').where({ usn: PARENT_LINKED_USN }).first();
  if (!linkedStudent) {
    console.log(`${PARENT_LINKED_USN} absent — run seed:student-lms-e2e first; skipping parent QA seed.`);
  } else {
    let parent = await db('parent_users').where({ email: PARENT_EMAIL }).first();
    if (!parent) {
      const [id] = await db('parent_users').insert({
        college_id: linkedStudent.college_id,
        name: 'QA Parent',
        email: PARENT_EMAIL,
        password_hash: passwordHash,
        identity_verified: 1,
        is_active: 1,
      });
      parent = await db('parent_users').where({ id }).first();
      console.log(`Created parent ${PARENT_EMAIL}`);
    } else {
      await db('parent_users').where({ id: parent.id }).update({ password_hash: passwordHash, is_active: 1, identity_verified: 1 });
      console.log(`Updated parent ${PARENT_EMAIL} — password reset`);
    }

    const link = await db('parent_student_links').where({ parent_user_id: parent!.id, student_id: linkedStudent.id }).first();
    if (!link) {
      await db('parent_student_links').insert({
        college_id: linkedStudent.college_id,
        parent_user_id: parent!.id,
        student_id: linkedStudent.id,
        relationship_type: 'GUARDIAN',
        is_primary_guardian: 1,
        verification_state: 'VERIFIED',
        is_active: 1,
        verified_at: db.fn.now(),
      });
      console.log(`Linked parent ${PARENT_EMAIL} to student ${PARENT_LINKED_USN}`);
    } else if (link.verification_state !== 'VERIFIED' || !link.is_active) {
      await db('parent_student_links').where({ id: link.id }).update({ verification_state: 'VERIFIED', is_active: 1 });
    }
  }

  const alumniStudent = await db('students').where({ usn: ALUMNI_STUDENT_USN }).first();
  if (!alumniStudent) {
    console.log(`${ALUMNI_STUDENT_USN} absent — run seed:student-lms-e2e first; skipping alumni QA seed.`);
  } else {
    const existing = await db('alumni_profiles')
      .where({ student_id: alumniStudent.id })
      .orWhere({ college_id: alumniStudent.college_id, email: ALUMNI_EMAIL })
      .first();
    if (!existing) {
      await db('alumni_profiles').insert({
        college_id: alumniStudent.college_id,
        student_id: alumniStudent.id,
        email: ALUMNI_EMAIL,
        password_hash: passwordHash,
        lifecycle_state: 'ACTIVE',
        verification_state: 'VERIFIED',
        historical_name: alumniStudent.name,
        historical_usn: alumniStudent.usn,
        historical_department_id: alumniStudent.department_id ?? null,
        historical_program_id: alumniStudent.program_id ?? null,
        graduation_year: new Date().getFullYear() - 1,
      });
      console.log(`Created alumni ${ALUMNI_EMAIL} (linked to ${ALUMNI_STUDENT_USN})`);
    } else {
      await db('alumni_profiles').where({ id: existing.id }).update({
        student_id: alumniStudent.id,
        email: ALUMNI_EMAIL,
        password_hash: passwordHash,
        lifecycle_state: 'ACTIVE',
        verification_state: 'VERIFIED',
        historical_name: alumniStudent.name,
        historical_usn: alumniStudent.usn,
      });
      console.log(`Updated alumni ${ALUMNI_EMAIL} — password reset`);
    }
  }

  console.log('\n========== PARENT + ALUMNI QA READY ==========');
  console.log(JSON.stringify({
    parent: { email: PARENT_EMAIL, path: '/parent', linkedStudent: PARENT_LINKED_USN },
    alumni: { email: ALUMNI_EMAIL, path: '/alumni', linkedStudent: ALUMNI_STUDENT_USN },
  }, null, 2));

  if (options.closeDb) await db.destroy();
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  seedParentAlumniQa({ closeDb: true }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
