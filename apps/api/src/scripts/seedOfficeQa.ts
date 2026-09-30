/** Idempotent Office Administration QA identities. Does not delete or rewrite fixture data. */
import bcrypt from 'bcrypt';
import { pathToFileURL } from 'node:url';
import { db } from '../db/index.js';

const password = process.env.OFFICE_QA_PASSWORD ?? 'OfficeQA@123';
const identities = [
  ['office.admin.qa@vviet.edu.in', 'Office Admin QA', 'OFFICE_ADMIN'],
  ['office.superintendent.qa@vviet.edu.in', 'Office Superintendent QA', 'OFFICE_SUPERINTENDENT'],
  ['faculty.requester.qa@vviet.edu.in', 'Faculty Requester QA', 'FACULTY'],
  ['qa.hod.a@vviet.edu.in', 'HOD A QA', 'HOD'],
  ['qa.hod.b@vviet.edu.in', 'HOD B QA', 'HOD'],
  ['qa.principal.office@vviet.edu.in', 'Principal QA', 'PRINCIPAL'],
  ['qa.management.office@vviet.edu.in', 'Management QA', 'MANAGEMENT'],
  ['qa.accountant.office@vviet.edu.in', 'Accountant QA', 'ACCOUNTANT'],
  ['qa.coe.office@vviet.edu.in', 'COE QA', 'COE'],
  ['qa.admissions.office@vviet.edu.in', 'Admissions Officer QA', 'ADMISSIONS_OFFICER'],
  ['qa.lab.office@vviet.edu.in', 'Lab Assistant QA', 'LAB_ASSISTANT'],
  ['qa.maintenance.office@vviet.edu.in', 'Maintenance QA', 'MAINTENANCE_MANAGER'],
  ['qa.librarian.office@vviet.edu.in', 'Librarian QA', 'LIBRARIAN'],
  ['qa.warden.office@vviet.edu.in', 'Warden QA', 'WARDEN'],
  ['qa.transport.office@vviet.edu.in', 'Transport QA', 'TRANSPORT_OFFICER'],
  ['qa.tp.office@vviet.edu.in', 'T&P QA', 'PLACEMENT_OFFICER'],
  ['qa.hr.office@vviet.edu.in', 'HR QA', 'HR_MANAGER'],
  ['qa.superadmin.office@vviet.edu.in', 'SUPER_ADMIN QA', 'SUPER_ADMIN'],
  ['qa.grievance.office@vviet.edu.in', 'Grievance Officer QA', 'GRIEVANCE_OFFICER'],
  ['qa.welfare.office@vviet.edu.in', 'Student Welfare Officer QA', 'STUDENT_WELFARE_OFFICER'],
] as const;

export async function seedOfficeQa() {
  const college = await db('colleges').where({ code: process.env.OFFICE_QA_COLLEGE_CODE ?? 'VVIET' }).first();
  if (!college) throw new Error('Office QA seed requires the VVIET college foundation');
  const departments = await db('departments').where({ college_id: college.id }).orderBy('id').limit(2);
  const hash = await bcrypt.hash(password, 10);
  for (const [email, name, role] of identities) {
    const existing = await db('faculty_users').where({ email }).first();
    const patch = { college_id: college.id, email, department_id: role === 'HOD' ? (departments[email.includes('.a@') ? 0 : 1]?.id ?? departments[0]?.id ?? null) : null, name, role, password_hash: hash, is_active: true, updated_at: db.fn.now() };
    if (existing) await db('faculty_users').where({ id: existing.id }).update(patch);
    else await db('faculty_users').insert({ ...patch, created_at: db.fn.now() });
  }
  console.log(`Office QA identities ready for college ${college.code}: ${identities.length}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]!).href) seedOfficeQa().finally(() => db.destroy());
