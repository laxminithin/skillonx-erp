import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../../api/src/db/index.js';

const API = 'http://127.0.0.1:4000';
const PASSWORD = 'Password123';
const evidenceDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'screenshots', 'hostel', 'closure');

test.describe.configure({ retries: 0 });

async function token(request: APIRequestContext, endpoint: string, email: string) {
  const response = await request.post(`${API}${endpoint}`, { data: { email, password: PASSWORD } });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).token as string;
}

async function authenticate(page: Page, authToken: string) {
  await page.goto('/');
  await page.evaluate((value) => localStorage.setItem('survey_token', value), authToken);
}

async function shot(page: Page, name: string) {
  await mkdir(evidenceDir, { recursive: true });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(evidenceDir, `${name}-1440x900.png`), fullPage: true });
}

test('final authenticated Warden closure journey', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== '1440x900', 'Mutation evidence runs once at the representative desktop viewport.');
  const wardenToken = await token(request, '/api/auth/login', 'qa.warden@vviet.edu.in');
  const auth = { Authorization: `Bearer ${wardenToken}` };
  await authenticate(page, wardenToken);

  await page.goto('/hostel/residents');
  await page.getByPlaceholder(/Search name/i).fill('4VV24CS001');
  await expect(page.getByText('4VV24CS001').first()).toBeVisible();
  await page.getByText('4VV24CS001').first().click();
  await expect(page.getByText(/Computer Science|CSE/i).first()).toBeVisible();
  await expect(page.getByText(/Block A/i).first()).toBeVisible();
  await expect(page.getByText(/A-101-A/i).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'No-Due' })).toBeVisible();
  await shot(page, 'resident-detail');

  await page.goto('/hostel/applications');
  await shot(page, 'allocation-before');
  const warden = await db('faculty_users').where({ email: 'qa.warden@vviet.edu.in' }).first();
  const pendingStudent = await db('students').where({ email: 'e2e.pending@student.skillonx.test' }).first();
  const existingAllocation = await db('hostel_bed_allocations').where({ student_id: pendingStudent.id, status: 'ACTIVE' }).first();
  if (existingAllocation) {
    await db('hostel_bed_allocations').where({ id: existingAllocation.id }).delete();
    await db('hostel_beds').where({ id: existingAllocation.bed_id }).update({ status: 'AVAILABLE' });
  }
  await db('hostel_residents').where({ college_id: warden.college_id, student_id: pendingStudent.id }).delete();
  await db('hostel_applications').where({ college_id: warden.college_id, student_id: pendingStudent.id }).update({ status: 'SUBMITTED', reviewed_by: null, reviewed_at: null, rejection_reason: null });
  const pendingResponse = await request.get(`${API}/api/hostel/applications/pending`, { headers: auth });
  expect(pendingResponse.ok()).toBeTruthy();
  const pending = (await pendingResponse.json()).applications as Array<{ id: number; usn: string }>;
  const candidate = pending.find((item) => item.usn === '4VV24CS002') ?? pending[0];
  expect(candidate, 'seeded eligible allocation candidate').toBeTruthy();
  const approve = await request.post(`${API}/api/hostel/applications/${candidate.id}/review`, { headers: auth, data: { action: 'APPROVE' } });
  expect(approve.ok()).toBeTruthy();
  const hostels = await (await request.get(`${API}/api/hostel/hostels`, { headers: auth })).json();
  const hostelId = hostels.hostels[0].id as number;
  const occupancy = await (await request.get(`${API}/api/hostel/rooms/occupancy?hostelId=${hostelId}`, { headers: auth })).json();
  const beds = occupancy.occupancy.flatMap((block: any) => block.floors.flatMap((floor: any) => floor.rooms.flatMap((room: any) => room.beds)));
  const available = beds.find((bed: any) => bed.status === 'AVAILABLE');
  expect(available, 'available seeded bed').toBeTruthy();
  const oldPolicy = await db('college_hostel_policies').where({ college_id: warden.college_id }).first();
  await db('college_hostel_policies').where({ college_id: warden.college_id }).update({ allocation_payment_policy: 'NO_PAYMENT_BLOCK' });
  const allocation = await request.post(`${API}/api/hostel/allocations`, { headers: auth, data: { applicationId: candidate.id, studentId: Number(pendingStudent.id), bedId: available.id, reason: 'Final closure QA' } });
  await db('college_hostel_policies').where({ college_id: warden.college_id }).update({ allocation_payment_policy: oldPolicy.allocation_payment_policy });
  expect(allocation.status()).toBe(201);
  const duplicate = await request.post(`${API}/api/hostel/allocations`, { headers: auth, data: { applicationId: candidate.id, studentId: Number(pendingStudent.id), bedId: available.id } });
  expect(duplicate.status()).toBe(409);

  await page.goto('/hostel/residents');
  await page.getByPlaceholder(/Search name/i).fill(candidate.usn);
  await expect(page.getByText(candidate.usn).first()).toBeVisible();
  await page.getByText(candidate.usn).first().click();
  await expect(page.getByText(new RegExp(available.bedCode, 'i')).last()).toBeVisible();
  await page.reload();
  await expect(page.getByText(new RegExp(available.bedCode, 'i')).last()).toBeVisible();
  await expect(page.getByText(/\d+ residents? · Page 1 of \d+/)).toBeVisible();
  await shot(page, 'allocation-after-persisted');

  const studentToken = await token(request, '/api/student-auth/login', 'e2e.approved@student.skillonx.test');
  const approvedStudent = await db('students').where({ email: 'e2e.approved@student.skillonx.test' }).first();
  await db('hostel_leave_requests').where({ student_id: approvedStudent.id, status: 'SUBMITTED' }).delete();
  const now = Date.now();
  const leave = await request.post(`${API}/api/student/hostel/leaves`, {
    headers: { Authorization: `Bearer ${studentToken}` },
    data: { leaveType: 'PERSONAL', fromAt: new Date(now + 86_400_000).toISOString(), toAt: new Date(now + 172_800_000).toISOString(), reason: 'Final closure QA', guardianConfirmed: true },
  });
  expect(leave.status()).toBe(201);
  const createdLeave = await leave.json();
  await page.goto('/hostel/leaves');
  await expect(page.getByText(/Final closure QA|Aarav Approved/i).first()).toBeVisible();
  await shot(page, 'leave-before-approval');
  await page.getByRole('button', { name: 'Approve' }).first().click();
  await page.reload();
  const studentLeaves = await (await request.get(`${API}/api/student/hostel/leaves`, { headers: { Authorization: `Bearer ${studentToken}` } })).json();
  expect(studentLeaves.leaves.find((item: { id: number }) => item.id === createdLeave.id)?.status).toBe('APPROVED');
  await shot(page, 'leave-after-approval');

  await page.goto('/hostel/complaints');
  const complaintRow = page.locator('main').getByText(/Resident.*(Electrical|Plumbing|Cleaning|Furniture|Internet|Room|Bathroom|Mess|Pest|Security|Other)/i).first().locator('..');
  await expect(page.getByRole('button', { name: 'Assign' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Assign' }).first().click();
  await page.getByRole('button', { name: 'Resolve' }).first().click();
  await page.getByRole('button', { name: 'Close' }).first().click();
  await page.reload();
  const closedComplaints = await (await request.get(`${API}/api/hostel/complaints?status=CLOSED`, { headers: auth })).json();
  expect(closedComplaints.complaints.length).toBeGreaterThan(0);
  await page.locator('select').selectOption('CLOSED');
  await expect(page.getByRole('button', { name: 'Close' }).first()).toBeVisible();
  await shot(page, 'complaint-closed');
  void complaintRow;

  await page.goto('/hostel/fees');
  await page.locator('select').selectOption({ index: 1 });
  await expect(page.getByText('Outstanding Hostel Dues')).toBeVisible();
  await expect(page.getByText(/Amount|Paid|Outstanding/).first()).toBeVisible();
  await shot(page, 'fee-status-read-only');
  const forbiddenFinance = await request.post(`${API}/api/finance/payments`, { headers: auth, data: {} });
  expect([401, 403, 404, 405]).toContain(forbiddenFinance.status());

  await page.goto('/hostel/vacating');
  await expect(page.getByRole('heading', { name: 'No-Due Clearance' })).toBeVisible();
  await expect(page.getByText(/Hostel-only|pending hostel clearance/i).first()).toBeVisible();
  await shot(page, 'hostel-no-due');

  await db('hostel_bed_allocations').where({ student_id: pendingStudent.id, status: 'ACTIVE' }).delete();
  await db('hostel_beds').where({ id: available.id }).update({ status: 'AVAILABLE' });
  await db('hostel_residents').where({ college_id: warden.college_id, student_id: pendingStudent.id }).delete();
  await db('hostel_applications').where({ id: candidate.id }).update({ status: 'SUBMITTED', reviewed_by: null, reviewed_at: null, rejection_reason: null });

  await page.getByRole('button', { name: /QA Hostel Warden/i }).click();
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/hostel');
  await expect(page).toHaveURL(/\/login/);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Warden Portal' })).toHaveCount(0);
  await shot(page, 'logout-auth-boundary');
});
