/**
 * Lab Assistant / Laboratory Management deterministic E2E seed.
 *
 * Idempotent. Reuses the Student-LMS E2E college (SX-E2E-CSE-3A → college 4),
 * its rooms (LAB2 has daily timetable slots → practical sessions derive),
 * departments (CSE, ISE) and faculty (anita, ravi). Adds:
 *   - LAB_ASSISTANT users (CSE + ISE, for cross-lab isolation)
 *   - labs (CSE programming lab on the timetabled LAB2 room, CSE hardware lab,
 *     ISE networks lab) with assistant / in-charge assignments
 *   - assets (available / faulty / under-repair / computer / accessory / retired)
 *   - consumables incl. a low-stock item + audited movements
 *   - an active issue + an overdue issue
 *   - an open fault, a pending repair, software + a software request, a
 *     submitted requirement
 *   - HOD (dept CSE) + Principal leadership overlays for oversight tests
 */
import { pathToFileURL } from 'node:url';
import { db } from '../db/index.js';

const QA_PASSWORD_HASH = '$2b$10$zyoTl01bcA4ygkCD277o6Opr3zKXcpxAc8mKLTn2LDZ8q50zjEzxq'; // Password123

function iso(d: Date) { return d.toISOString().slice(0, 10); }
const daysFromNow = (n: number) => iso(new Date(Date.now() + n * 86400000));

async function ensureFaculty(collegeId: number, departmentId: number | null, email: string, name: string, role: string, employeeNo: string) {
  let user = await db('faculty_users').where({ email }).first();
  if (!user) {
    const [id] = await db('faculty_users').insert({
      college_id: collegeId, department_id: departmentId, name, email,
      password_hash: QA_PASSWORD_HASH, role, is_active: true, employee_id: employeeNo,
      designation: role === 'LAB_ASSISTANT' ? 'Lab Assistant' : null,
    });
    user = await db('faculty_users').where({ id }).first();
  } else {
    await db('faculty_users').where({ id: user.id }).update({ role, is_active: true, department_id: departmentId, password_hash: QA_PASSWORD_HASH });
    user = await db('faculty_users').where({ id: user.id }).first();
  }
  return user!;
}

async function ensureLeadership(collegeId: number, employeeId: number, role: 'HOD' | 'PRINCIPAL', departmentId: number | null) {
  const existing = await db('academic_leadership_assignments')
    .where({ college_id: collegeId, employee_id: employeeId, leadership_role: role, status: 'ACTIVE' }).first();
  if (existing) return;
  await db('academic_leadership_assignments').insert({
    college_id: collegeId, employee_id: employeeId, leadership_role: role,
    department_id: departmentId, effective_from: daysFromNow(-30), status: 'ACTIVE',
  });
}

async function ensureLab(collegeId: number, code: string, data: Record<string, unknown>) {
  let lab = await db('labs').where({ college_id: collegeId, code }).first();
  if (!lab) {
    const [id] = await db('labs').insert({ college_id: collegeId, code, ...data });
    lab = await db('labs').where({ id }).first();
  }
  return lab!;
}

async function ensureAssignment(collegeId: number, labId: number, facultyId: number, role: 'LAB_ASSISTANT' | 'LAB_INCHARGE') {
  const existing = await db('lab_assignments').where({ college_id: collegeId, lab_id: labId, faculty_id: facultyId, assignment_role: role, status: 'ACTIVE' }).first();
  if (existing) return existing;
  const [id] = await db('lab_assignments').insert({
    college_id: collegeId, lab_id: labId, faculty_id: facultyId, assignment_role: role,
    is_primary: true, status: 'ACTIVE', effective_from: daysFromNow(-30),
  });
  return db('lab_assignments').where({ id }).first();
}

async function ensureAsset(collegeId: number, labId: number, tag: string, data: Record<string, unknown>) {
  let asset = await db('lab_assets').where({ college_id: collegeId, asset_tag: tag }).first();
  if (!asset) {
    const [id] = await db('lab_assets').insert({ college_id: collegeId, lab_id: labId, asset_tag: tag, ...data });
    await db('lab_asset_history').insert({ college_id: collegeId, asset_id: id, action: 'CREATED', to_status: (data.operational_status as string) ?? 'AVAILABLE', to_lab_id: labId, note: 'Seed' });
    asset = await db('lab_assets').where({ id }).first();
  }
  return asset!;
}

async function ensureStock(collegeId: number, labId: number, name: string, data: Record<string, unknown>) {
  let item = await db('lab_stock_items').where({ college_id: collegeId, lab_id: labId, name }).first();
  if (!item) {
    const [id] = await db('lab_stock_items').insert({ college_id: collegeId, lab_id: labId, name, ...data });
    await db('lab_stock_movements').insert({ college_id: collegeId, stock_item_id: id, lab_id: labId, movement_type: 'RECEIPT', quantity: (data.opening_stock as number) ?? 0, balance_after: (data.current_stock as number) ?? 0, reason: 'Opening stock (seed)' });
    item = await db('lab_stock_items').where({ id }).first();
  }
  return item!;
}

export async function seedLabManagement(options: { closeDb?: boolean } = {}) {
  if (!(await db.schema.hasTable('labs'))) {
    console.log('lab tables absent — run migrations first; skipping lab seed.');
    if (options.closeDb) await db.destroy();
    return null;
  }
  const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
  if (!cls) {
    console.log('SX-E2E-CSE-3A class absent — run seed:student-lms-e2e first; skipping lab seed.');
    if (options.closeDb) await db.destroy();
    return null;
  }
  const collegeId = Number(cls.college_id);
  const cse = await db('departments').where({ college_id: collegeId, code: 'CSE' }).first();
  const ise = await db('departments').where({ college_id: collegeId, code: 'ISE' }).first();
  const cseId = cse ? Number(cse.id) : null;
  const iseId = ise ? Number(ise.id) : null;
  const lab2Room = await db('rooms').where({ college_id: collegeId, code: 'LAB2' }).first();

  // Identities.
  const labAssistant = await ensureFaculty(collegeId, cseId, 'qa.labassistant@vviet.edu.in', 'QA Lab Assistant (CSE)', 'LAB_ASSISTANT', 'QA-LAB-AST-1');
  const labAssistant2 = await ensureFaculty(collegeId, iseId, 'qa.labassistant.ise@vviet.edu.in', 'QA Lab Assistant (ISE)', 'LAB_ASSISTANT', 'QA-LAB-AST-2');
  const anita = await db('faculty_users').where({ college_id: collegeId, email: 'anita@vviet.edu.in' }).first(); // Lab In-charge (FACULTY)
  const ravi = await db('faculty_users').where({ college_id: collegeId, email: 'ravi@vviet.edu.in' }).first(); // FACULTY, no assignment
  const hod = await ensureFaculty(collegeId, cseId, 'qa.hod.cse@vviet.edu.in', 'QA HOD CSE', 'FACULTY', 'QA-HOD-CSE');
  const principal = await ensureFaculty(collegeId, null, 'qa.principal@vviet.edu.in', 'QA Principal', 'FACULTY', 'QA-PRIN');
  if (cseId) await ensureLeadership(collegeId, Number(hod.id), 'HOD', cseId);
  await ensureLeadership(collegeId, Number(principal.id), 'PRINCIPAL', null);

  // Labs.
  const cseLab = await ensureLab(collegeId, 'SX-E2E-LAB-CSE', {
    department_id: cseId, room_id: lab2Room ? Number(lab2Room.id) : null,
    name: 'CSE Programming Lab', lab_type: 'COMPUTING', capacity: 60, status: 'ACTIVE',
    description: 'Primary computing lab for CSE practical sessions.',
  });
  const cseHwLab = await ensureLab(collegeId, 'SX-E2E-LAB-CSE-HW', {
    department_id: cseId, room_id: null, name: 'CSE Hardware Lab', lab_type: 'ELECTRONICS', capacity: 30, status: 'ACTIVE',
  });
  const iseLab = await ensureLab(collegeId, 'SX-E2E-LAB-ISE', {
    department_id: iseId, room_id: null, name: 'ISE Networks Lab', lab_type: 'NETWORKING', capacity: 40, status: 'ACTIVE',
  });

  // Assignments — CSE assistant + anita in-charge on CSE lab; ISE assistant on ISE lab only.
  await ensureAssignment(collegeId, Number(cseLab.id), Number(labAssistant.id), 'LAB_ASSISTANT');
  await ensureAssignment(collegeId, Number(cseHwLab.id), Number(labAssistant.id), 'LAB_ASSISTANT');
  if (anita) await ensureAssignment(collegeId, Number(cseLab.id), Number(anita.id), 'LAB_INCHARGE');
  await ensureAssignment(collegeId, Number(iseLab.id), Number(labAssistant2.id), 'LAB_ASSISTANT');

  // Assets on the CSE lab.
  const pc = await ensureAsset(collegeId, Number(cseLab.id), 'SX-LAB-PC-01', {
    name: 'Desktop Workstation 01', category: 'DESKTOP', asset_class: 'COMPUTER', make: 'Dell', model: 'OptiPlex 3090',
    operational_status: 'AVAILABLE', condition: 'GOOD', hostname: 'CSE-LAB-01', system_number: 'PC-01',
    processor: 'Intel i5-11500', ram: '16GB', storage: '512GB SSD', os: 'Ubuntu 22.04', purchase_date: '2024-06-01',
    cost: 55000, vendor: 'Dell India', warranty_end: daysFromNow(60), amc_end: daysFromNow(45),
  });
  const monitor = await ensureAsset(collegeId, Number(cseLab.id), 'SX-LAB-MON-07', {
    name: 'Monitor 07', category: 'MONITOR', asset_class: 'ASSET', operational_status: 'FAULTY', condition: 'POOR',
  });
  await ensureAsset(collegeId, Number(cseLab.id), 'SX-LAB-UPS-02', {
    name: 'UPS 02', category: 'UPS', asset_class: 'ASSET', operational_status: 'UNDER_REPAIR', condition: 'FAIR',
  });
  await ensureAsset(collegeId, Number(cseLab.id), 'SX-LAB-KBD-11', {
    name: 'USB Keyboard 11', category: 'PERIPHERAL', asset_class: 'ACCESSORY', operational_status: 'AVAILABLE', condition: 'GOOD',
  });
  await ensureAsset(collegeId, Number(cseLab.id), 'SX-LAB-PROJ-OLD', {
    name: 'Projector (decommissioned)', category: 'PROJECTOR', asset_class: 'ASSET', operational_status: 'RETIRED', condition: 'DAMAGED',
  });

  // Consumables — one healthy, one low-stock.
  await ensureStock(collegeId, Number(cseLab.id), 'HDMI Cable', { code: 'CONS-HDMI', category: 'CONSUMABLE', unit: 'NOS', opening_stock: 40, current_stock: 40, min_threshold: 10 });
  await ensureStock(collegeId, Number(cseLab.id), 'Jumper Wires (pack)', { code: 'CONS-JMP', category: 'CONSUMABLE', unit: 'BOX', opening_stock: 3, current_stock: 2, min_threshold: 5 });

  // Issues — active + overdue.
  const student = await db('students').where({ college_id: collegeId, usn: '4VV24CS001' }).first();
  const hasActive = await db('lab_issues').where({ college_id: collegeId, lab_id: cseLab.id, description: 'Logic Analyzer Kit' }).first();
  if (!hasActive && ravi) {
    await db('lab_issues').insert({
      college_id: collegeId, lab_id: Number(cseLab.id), item_kind: 'ACCESSORY', description: 'Logic Analyzer Kit',
      quantity: 1, recipient_type: 'FACULTY', recipient_faculty_id: Number(ravi.id), issue_date: daysFromNow(-3),
      expected_return: daysFromNow(7), condition_out: 'GOOD', status: 'ISSUED', issuer_id: Number(labAssistant.id),
    });
  }
  const hasOverdue = await db('lab_issues').where({ college_id: collegeId, lab_id: cseLab.id, description: 'Arduino Starter Kit' }).first();
  if (!hasOverdue && student) {
    await db('lab_issues').insert({
      college_id: collegeId, lab_id: Number(cseLab.id), item_kind: 'ACCESSORY', description: 'Arduino Starter Kit',
      quantity: 1, recipient_type: 'STUDENT', recipient_student_id: Number(student.id), issue_date: daysFromNow(-20),
      expected_return: daysFromNow(-5), condition_out: 'GOOD', status: 'ISSUED', issuer_id: Number(labAssistant.id),
    });
  }

  // Fault + repair.
  let fault = await db('lab_faults').where({ college_id: collegeId, lab_id: cseLab.id, asset_id: monitor.id }).first();
  if (!fault) {
    const [id] = await db('lab_faults').insert({
      college_id: collegeId, lab_id: Number(cseLab.id), asset_id: Number(monitor.id), reported_by: Number(labAssistant.id),
      fault_category: 'DISPLAY', description: 'Monitor 07 shows flickering and dead pixels.', severity: 'HIGH',
      impact: 'One workstation unusable', status: 'OPEN',
    });
    fault = await db('lab_faults').where({ id }).first();
  }
  const hasRepair = await db('lab_repairs').where({ college_id: collegeId, lab_id: cseLab.id, asset_id: monitor.id }).first();
  if (!hasRepair) {
    await db('lab_repairs').insert({
      college_id: collegeId, lab_id: Number(cseLab.id), asset_id: Number(monitor.id), fault_id: fault ? Number(fault.id) : null,
      requested_action: 'Replace monitor panel or swap unit under AMC.', priority: 'HIGH', vendor: 'Dell India',
      estimated_cost: 4000, approval_status: 'PENDING', status: 'REQUESTED', requested_by: Number(labAssistant.id),
    });
  }

  // Software + request.
  const hasSw = await db('lab_software').where({ college_id: collegeId, lab_id: cseLab.id, name: 'MATLAB' }).first();
  if (!hasSw) {
    await db('lab_software').insert({
      college_id: collegeId, lab_id: Number(cseLab.id), name: 'MATLAB', version: 'R2024a', license_type: 'ACADEMIC',
      license_count: 60, expiry_date: daysFromNow(120), installation_status: 'INSTALLED', vendor_ref: 'Campus-wide TAH license',
    });
  }
  const hasSwReq = await db('lab_software_requests').where({ college_id: collegeId, lab_id: cseLab.id, software_name: 'Cisco Packet Tracer' }).first();
  if (!hasSwReq && anita) {
    await db('lab_software_requests').insert({
      college_id: collegeId, lab_id: Number(cseLab.id), software_name: 'Cisco Packet Tracer', version: '8.2',
      reason: 'Required for the Computer Networks practical.', needed_by: daysFromNow(14), status: 'REQUESTED', requested_by: Number(anita.id),
    });
  }

  // Requirement.
  const hasReq = await db('lab_requirements').where({ college_id: collegeId, lab_id: cseLab.id, item: '32-inch monitors' }).first();
  if (!hasReq) {
    await db('lab_requirements').insert({
      college_id: collegeId, lab_id: Number(cseLab.id), department_id: cseId, request_type: 'REPLACEMENT',
      item: '32-inch monitors', quantity: 5, reason: 'Replace failing displays', academic_justification: 'Improve visibility for lab practicals',
      priority: 'HIGH', estimated_cost: 90000, semester: '3', student_strength: 60, current_stock: 55, shortfall: 5,
      status: 'SUBMITTED', requested_by: Number(labAssistant.id),
    });
  }

  const summary = {
    collegeId,
    labs: { cse: Number(cseLab.id), cseHardware: Number(cseHwLab.id), ise: Number(iseLab.id) },
    accounts: {
      labAssistant: 'qa.labassistant@vviet.edu.in',
      labAssistantIse: 'qa.labassistant.ise@vviet.edu.in',
      labIncharge: 'anita@vviet.edu.in',
      facultyNoAssignment: 'ravi@vviet.edu.in',
      hod: 'qa.hod.cse@vviet.edu.in',
      principal: 'qa.principal@vviet.edu.in',
    },
  };
  console.log('\nLab Management E2E seed complete.\n');
  console.log(JSON.stringify(summary, null, 2));
  if (options.closeDb) await db.destroy();
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedLabManagement({ closeDb: true }).catch(async (err) => {
    console.error(err);
    try { await db.destroy(); } catch { /* ignore */ }
    process.exit(1);
  });
}
