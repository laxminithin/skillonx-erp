import { db } from '../../db/index.js';

export async function ensureCollegeHostelDefaults(collegeId: number) {
  if (!(await db.schema.hasTable('college_hostel_policies'))) return;

  const existing = await db('college_hostel_policies').where({ college_id: collegeId }).first();
  if (!existing) {
    await db('college_hostel_policies').insert({
      college_id: collegeId,
      application_required: true,
      approval_required: true,
      room_allocation_mode: 'MANUAL',
      allow_student_room_preference: true,
      allow_room_transfer: true,
      transfer_approval_required: true,
      security_deposit_required: true,
      mess_mandatory: false,
      allow_outpass: true,
      outpass_approval_mode: 'WARDEN_ONLY',
      guardian_approval_required: false,
      visitor_allowed: true,
      late_entry_policy: 'WARNING',
      clearance_required: true,
      fee_clearance_required: true,
      allocation_payment_policy: 'PAY_BEFORE_ALLOCATION',
      reapplication_policy: 'ONE_PER_CYCLE',
    });
  }
}

export async function getHostelPolicy(collegeId: number) {
  await ensureCollegeHostelDefaults(collegeId);
  const policy = await db('college_hostel_policies').where({ college_id: collegeId }).first();
  return {
    applicationRequired: !!policy?.application_required,
    approvalRequired: !!policy?.approval_required,
    roomAllocationMode: policy?.room_allocation_mode ?? 'MANUAL',
    allowStudentRoomPreference: !!policy?.allow_student_room_preference,
    allowRoomTransfer: !!policy?.allow_room_transfer,
    transferApprovalRequired: !!policy?.transfer_approval_required,
    securityDepositRequired: !!policy?.security_deposit_required,
    messMandatory: !!policy?.mess_mandatory,
    allowOutpass: !!policy?.allow_outpass,
    outpassApprovalMode: policy?.outpass_approval_mode ?? 'WARDEN_ONLY',
    guardianApprovalRequired: !!policy?.guardian_approval_required,
    visitorAllowed: !!policy?.visitor_allowed,
    nightReturnCutoff: policy?.night_return_cutoff ?? null,
    lateEntryPolicy: policy?.late_entry_policy ?? 'WARNING',
    clearanceRequired: !!policy?.clearance_required,
    feeClearanceRequired: !!policy?.fee_clearance_required,
    allocationPaymentPolicy: policy?.allocation_payment_policy ?? 'PAY_BEFORE_ALLOCATION',
    reapplicationPolicy: policy?.reapplication_policy ?? 'ONE_PER_CYCLE',
  };
}

export async function listHostels(collegeId: number, activeOnly = true) {
  let q = db('hostels').where({ college_id: collegeId });
  if (activeOnly) q = q.andWhere('status', 'ACTIVE');
  const rows = await q.orderBy('name');
  return rows.map(serializeHostel);
}

export function serializeHostel(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    collegeId: Number(row.college_id),
    code: row.code,
    name: row.name,
    hostelType: row.hostel_type,
    genderPolicy: row.gender_policy,
    address: row.address,
    capacity: row.capacity != null ? Number(row.capacity) : null,
    status: row.status,
  };
}
