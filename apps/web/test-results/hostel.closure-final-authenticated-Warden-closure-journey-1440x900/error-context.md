# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hostel.closure.spec.ts >> final authenticated Warden closure journey
- Location: e2e/hostel.closure.spec.ts:30:1

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [ref=f4e3]:
  - complementary [ref=f4e4]:
    - generic [ref=f4e5]:
      - generic [ref=f4e7]:
        - generic [ref=f4e8]: S
        - generic [ref=f4e9]:
          - paragraph [ref=f4e10]: SkillonX
          - paragraph [ref=f4e11]: Warden Portal
      - navigation "Primary" [ref=f4e12]:
        - generic [ref=f4e13]:
          - paragraph [ref=f4e14]: Dashboard
          - link "Dashboard" [ref=f4e16] [cursor=pointer]:
            - /url: /hostel
        - generic [ref=f4e23]:
          - paragraph [ref=f4e24]: Residents
          - generic [ref=f4e25]:
            - link "All Residents" [ref=f4e26] [cursor=pointer]:
              - /url: /hostel/residents
            - link "Pending Allocation" [ref=f4e33] [cursor=pointer]:
              - /url: /hostel/applications
            - link "Waiting List" [ref=f4e38] [cursor=pointer]:
              - /url: /hostel/waitlist
            - link "Room Transfers" [ref=f4e44] [cursor=pointer]:
              - /url: /hostel/transfers
        - generic [ref=f4e49]:
          - paragraph [ref=f4e50]: Rooms & Beds
          - generic [ref=f4e51]:
            - link "Hostel Overview" [ref=f4e52] [cursor=pointer]:
              - /url: /hostel/rooms
            - link "Vacancies" [ref=f4e57] [cursor=pointer]:
              - /url: /hostel/vacancies
        - generic [ref=f4e62]:
          - paragraph [ref=f4e63]: Movement
          - generic [ref=f4e64]:
            - link "Hostel Attendance" [ref=f4e65] [cursor=pointer]:
              - /url: /hostel/attendance
            - link "Leave / Outing" [ref=f4e71] [cursor=pointer]:
              - /url: /hostel/leaves
            - link "Overdue Returns" [ref=f4e76] [cursor=pointer]:
              - /url: /hostel/overdue
            - link "Entry / Exit" [ref=f4e80] [cursor=pointer]:
              - /url: /hostel/gate
        - generic [ref=f4e85]:
          - paragraph [ref=f4e86]: Operations
          - generic [ref=f4e87]:
            - link "Complaints" [ref=f4e88] [cursor=pointer]:
              - /url: /hostel/complaints
            - link "Maintenance" [ref=f4e92] [cursor=pointer]:
              - /url: /hostel/maintenance
            - link "Visitors" [ref=f4e96] [cursor=pointer]:
              - /url: /hostel/visitors
            - link "Incidents" [ref=f4e101] [cursor=pointer]:
              - /url: /hostel/incidents
            - link "Mess Operations" [ref=f4e105] [cursor=pointer]:
              - /url: /hostel/operations
        - generic [ref=f4e110]:
          - paragraph [ref=f4e111]: Finance & Clearance
          - generic [ref=f4e112]:
            - link "Fee Status" [ref=f4e113] [cursor=pointer]:
              - /url: /hostel/fees
            - link "No-Due Clearance" [ref=f4e118] [cursor=pointer]:
              - /url: /hostel/vacating
        - generic [ref=f4e124]:
          - paragraph [ref=f4e125]: Communication
          - link "Notices" [ref=f4e127] [cursor=pointer]:
            - /url: /hostel/notices
        - generic [ref=f4e132]:
          - paragraph [ref=f4e133]: Reports
          - link "Hostel Reports" [ref=f4e135] [cursor=pointer]:
            - /url: /hostel/reports
        - generic [ref=f4e142]:
          - paragraph [ref=f4e143]: More
          - generic [ref=f4e144]:
            - link "My Profile" [ref=f4e145] [cursor=pointer]:
              - /url: /profile
            - link "Help" [ref=f4e150] [cursor=pointer]:
              - /url: /hostel/help
      - button "Collapse sidebar" [ref=f4e156]: Collapse
      - button "QH QA Hostel Warden WARDEN" [ref=f4e161]:
        - generic [ref=f4e162]: QH
        - generic [ref=f4e163]:
          - paragraph [ref=f4e164]: QA Hostel Warden
          - paragraph [ref=f4e165]: WARDEN
  - generic [ref=f4e169]:
    - banner [ref=f4e170]:
      - generic [ref=f4e171]: Vidya Vikas Institute of Engineering & Technology
    - main [ref=f4e174]:
      - generic [ref=f4e176]:
        - generic [ref=f4e178]:
          - heading "Resident Directory" [level=1] [ref=f4e179]
          - paragraph [ref=f4e180]: Search residents by student, USN, hostel, room, bed, or status.
        - generic [ref=f4e181]:
          - generic [ref=f4e182]:
            - textbox "Search name, USN, resident, room, or bed" [ref=f4e188]
            - table [ref=f4e190]:
              - rowgroup [ref=f4e191]:
                - row [ref=f4e192]:
                  - columnheader "Student" [ref=f4e193]
                  - columnheader "Hostel" [ref=f4e194]
                  - columnheader "Room" [ref=f4e195]
                  - columnheader "Bed" [ref=f4e196]
                  - columnheader "Status" [ref=f4e197]
              - rowgroup [ref=f4e198]:
                - row [ref=f4e199] [cursor=pointer]:
                  - cell [ref=f4e200]:
                    - paragraph [ref=f4e201]: Aarav Approved
                    - paragraph [ref=f4e202]: 4VV24CS001
                  - cell "VVIET Boys Hostel" [ref=f4e203]
                  - cell "A-101" [ref=f4e204]
                  - cell "A-101-A" [ref=f4e205]
                  - cell "Active" [ref=f4e206]
                - row [ref=f4e209] [cursor=pointer]:
                  - cell [ref=f4e210]:
                    - paragraph [ref=f4e211]: Priya Pending
                    - paragraph [ref=f4e212]: 4VV24CS002
                  - cell "VVIET Boys Hostel" [ref=f4e213]
                  - cell "A-101" [ref=f4e214]
                  - cell "A-101-B" [ref=f4e215]
                  - cell "Active" [ref=f4e216]
            - generic [ref=f4e219]:
              - generic [ref=f4e220]: 2 residents · Page 1 of 1
              - generic [ref=f4e221]:
                - button "Previous" [disabled]
                - button "Next" [disabled]
          - generic [ref=f4e223]:
            - generic [ref=f4e224]:
              - heading "Priya Pending" [level=2] [ref=f4e225]
              - paragraph [ref=f4e226]: 4VV24CS002 · B.E. Computer Science & Engineering · III
            - generic [ref=f4e227]:
              - generic [ref=f4e228]:
                - paragraph [ref=f4e229]: Presence
                - paragraph [ref=f4e230]: IN HOSTEL
              - generic [ref=f4e231]:
                - paragraph [ref=f4e232]: Outstanding
                - paragraph [ref=f4e233]: ₹15,000
            - generic [ref=f4e234]:
              - heading "Hostel" [level=3] [ref=f4e235]
              - paragraph [ref=f4e236]: VVIET Boys Hostel · Block A · Floor 1 · Room A-101 · Bed A-101-B
              - paragraph [ref=f4e237]: "Admitted: 9/27/2026, 5:43:19 AM · Status: ACTIVE"
            - generic [ref=f4e238]:
              - heading "Contact" [level=3] [ref=f4e239]
              - paragraph [ref=f4e240]: No phone · e2e.pending@student.skillonx.test
              - paragraph [ref=f4e241]: "Emergency: — · —"
            - generic [ref=f4e242]:
              - heading "No-Due" [level=3] [ref=f4e243]
              - generic [ref=f4e244]: Not applicable
            - generic [ref=f4e246]:
              - heading "Recent Complaints" [level=3] [ref=f4e247]
              - paragraph [ref=f4e248]: No recent complaints.
            - generic [ref=f4e249]:
              - heading "Allocation History" [level=3] [ref=f4e250]
              - paragraph [ref=f4e251]: VVIET Boys Hostel · A-101 · A-101-B · ACTIVE
```

# Test source

```ts
  1   | import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
  2   | import { mkdir } from 'node:fs/promises';
  3   | import path from 'node:path';
  4   | import { fileURLToPath } from 'node:url';
  5   | import { db } from '../../api/src/db/index.js';
  6   | 
  7   | const API = 'http://127.0.0.1:4000';
  8   | const PASSWORD = 'Password123';
  9   | const evidenceDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'screenshots', 'hostel', 'closure');
  10  | 
  11  | test.describe.configure({ retries: 0 });
  12  | 
  13  | async function token(request: APIRequestContext, endpoint: string, email: string) {
  14  |   const response = await request.post(`${API}${endpoint}`, { data: { email, password: PASSWORD } });
> 15  |   expect(response.ok()).toBeTruthy();
      |                         ^ Error: expect(received).toBeTruthy()
  16  |   return (await response.json()).token as string;
  17  | }
  18  | 
  19  | async function authenticate(page: Page, authToken: string) {
  20  |   await page.goto('/');
  21  |   await page.evaluate((value) => localStorage.setItem('survey_token', value), authToken);
  22  | }
  23  | 
  24  | async function shot(page: Page, name: string) {
  25  |   await mkdir(evidenceDir, { recursive: true });
  26  |   await page.waitForTimeout(500);
  27  |   await page.screenshot({ path: path.join(evidenceDir, `${name}-1440x900.png`), fullPage: true });
  28  | }
  29  | 
  30  | test('final authenticated Warden closure journey', async ({ page, request }, testInfo) => {
  31  |   test.skip(testInfo.project.name !== '1440x900', 'Mutation evidence runs once at the representative desktop viewport.');
  32  |   const wardenToken = await token(request, '/api/auth/login', 'qa.warden@vviet.edu.in');
  33  |   const auth = { Authorization: `Bearer ${wardenToken}` };
  34  |   await authenticate(page, wardenToken);
  35  | 
  36  |   await page.goto('/hostel/residents');
  37  |   await page.getByPlaceholder(/Search name/i).fill('4VV24CS001');
  38  |   await expect(page.getByText('4VV24CS001').first()).toBeVisible();
  39  |   await page.getByText('4VV24CS001').first().click();
  40  |   await expect(page.getByText(/Computer Science|CSE/i).first()).toBeVisible();
  41  |   await expect(page.getByText(/Block A/i).first()).toBeVisible();
  42  |   await expect(page.getByText(/A-101-A/i).first()).toBeVisible();
  43  |   await expect(page.getByRole('heading', { name: 'No-Due' })).toBeVisible();
  44  |   await shot(page, 'resident-detail');
  45  | 
  46  |   await page.goto('/hostel/applications');
  47  |   await shot(page, 'allocation-before');
  48  |   const warden = await db('faculty_users').where({ email: 'qa.warden@vviet.edu.in' }).first();
  49  |   const pendingStudent = await db('students').where({ email: 'e2e.pending@student.skillonx.test' }).first();
  50  |   const existingAllocation = await db('hostel_bed_allocations').where({ student_id: pendingStudent.id, status: 'ACTIVE' }).first();
  51  |   if (existingAllocation) {
  52  |     await db('hostel_bed_allocations').where({ id: existingAllocation.id }).delete();
  53  |     await db('hostel_beds').where({ id: existingAllocation.bed_id }).update({ status: 'AVAILABLE' });
  54  |   }
  55  |   await db('hostel_residents').where({ college_id: warden.college_id, student_id: pendingStudent.id }).delete();
  56  |   await db('hostel_applications').where({ college_id: warden.college_id, student_id: pendingStudent.id }).update({ status: 'SUBMITTED', reviewed_by: null, reviewed_at: null, rejection_reason: null });
  57  |   const pendingResponse = await request.get(`${API}/api/hostel/applications/pending`, { headers: auth });
  58  |   expect(pendingResponse.ok()).toBeTruthy();
  59  |   const pending = (await pendingResponse.json()).applications as Array<{ id: number; usn: string }>;
  60  |   const candidate = pending.find((item) => item.usn === '4VV24CS002') ?? pending[0];
  61  |   expect(candidate, 'seeded eligible allocation candidate').toBeTruthy();
  62  |   const approve = await request.post(`${API}/api/hostel/applications/${candidate.id}/review`, { headers: auth, data: { action: 'APPROVE' } });
  63  |   expect(approve.ok()).toBeTruthy();
  64  |   const hostels = await (await request.get(`${API}/api/hostel/hostels`, { headers: auth })).json();
  65  |   const hostelId = hostels.hostels[0].id as number;
  66  |   const occupancy = await (await request.get(`${API}/api/hostel/rooms/occupancy?hostelId=${hostelId}`, { headers: auth })).json();
  67  |   const beds = occupancy.occupancy.flatMap((block: any) => block.floors.flatMap((floor: any) => floor.rooms.flatMap((room: any) => room.beds)));
  68  |   const available = beds.find((bed: any) => bed.status === 'AVAILABLE');
  69  |   expect(available, 'available seeded bed').toBeTruthy();
  70  |   const oldPolicy = await db('college_hostel_policies').where({ college_id: warden.college_id }).first();
  71  |   await db('college_hostel_policies').where({ college_id: warden.college_id }).update({ allocation_payment_policy: 'NO_PAYMENT_BLOCK' });
  72  |   const allocation = await request.post(`${API}/api/hostel/allocations`, { headers: auth, data: { applicationId: candidate.id, studentId: Number(pendingStudent.id), bedId: available.id, reason: 'Final closure QA' } });
  73  |   await db('college_hostel_policies').where({ college_id: warden.college_id }).update({ allocation_payment_policy: oldPolicy.allocation_payment_policy });
  74  |   expect(allocation.status()).toBe(201);
  75  |   const duplicate = await request.post(`${API}/api/hostel/allocations`, { headers: auth, data: { applicationId: candidate.id, studentId: Number(pendingStudent.id), bedId: available.id } });
  76  |   expect(duplicate.status()).toBe(409);
  77  | 
  78  |   await page.goto('/hostel/residents');
  79  |   await page.getByPlaceholder(/Search name/i).fill(candidate.usn);
  80  |   await expect(page.getByText(candidate.usn).first()).toBeVisible();
  81  |   await page.getByText(candidate.usn).first().click();
  82  |   await expect(page.getByText(new RegExp(available.bedCode, 'i')).last()).toBeVisible();
  83  |   await page.reload();
  84  |   await expect(page.getByText(new RegExp(available.bedCode, 'i')).last()).toBeVisible();
  85  |   await expect(page.getByText(/\d+ residents? · Page 1 of \d+/)).toBeVisible();
  86  |   await shot(page, 'allocation-after-persisted');
  87  | 
  88  |   const studentToken = await token(request, '/api/student-auth/login', 'e2e.approved@student.skillonx.test');
  89  |   const approvedStudent = await db('students').where({ email: 'e2e.approved@student.skillonx.test' }).first();
  90  |   await db('hostel_leave_requests').where({ student_id: approvedStudent.id, status: 'SUBMITTED' }).delete();
  91  |   const now = Date.now();
  92  |   const leave = await request.post(`${API}/api/student/hostel/leaves`, {
  93  |     headers: { Authorization: `Bearer ${studentToken}` },
  94  |     data: { leaveType: 'PERSONAL', fromAt: new Date(now + 86_400_000).toISOString(), toAt: new Date(now + 172_800_000).toISOString(), reason: 'Final closure QA', guardianConfirmed: true },
  95  |   });
  96  |   expect(leave.status()).toBe(201);
  97  |   const createdLeave = await leave.json();
  98  |   await page.goto('/hostel/leaves');
  99  |   await expect(page.getByText(/Final closure QA|Aarav Approved/i).first()).toBeVisible();
  100 |   await shot(page, 'leave-before-approval');
  101 |   await page.getByRole('button', { name: 'Approve' }).first().click();
  102 |   await page.reload();
  103 |   const studentLeaves = await (await request.get(`${API}/api/student/hostel/leaves`, { headers: { Authorization: `Bearer ${studentToken}` } })).json();
  104 |   expect(studentLeaves.leaves.find((item: { id: number }) => item.id === createdLeave.id)?.status).toBe('APPROVED');
  105 |   await shot(page, 'leave-after-approval');
  106 | 
  107 |   await page.goto('/hostel/complaints');
  108 |   const complaintRow = page.locator('main').getByText(/Resident.*(Electrical|Plumbing|Cleaning|Furniture|Internet|Room|Bathroom|Mess|Pest|Security|Other)/i).first().locator('..');
  109 |   await expect(page.getByRole('button', { name: 'Assign' }).first()).toBeVisible();
  110 |   await page.getByRole('button', { name: 'Assign' }).first().click();
  111 |   await page.getByRole('button', { name: 'Resolve' }).first().click();
  112 |   await page.getByRole('button', { name: 'Close' }).first().click();
  113 |   await page.reload();
  114 |   const closedComplaints = await (await request.get(`${API}/api/hostel/complaints?status=CLOSED`, { headers: auth })).json();
  115 |   expect(closedComplaints.complaints.length).toBeGreaterThan(0);
```