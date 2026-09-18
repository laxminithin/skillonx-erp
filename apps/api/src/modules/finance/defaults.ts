import { db } from '../../db/index.js';

const DEFAULT_FEE_HEADS = [
  { code: 'TUITION', name: 'Tuition Fee', category: 'ACADEMIC', isRefundable: false },
  { code: 'UNIVERSITY_FEE', name: 'University Fee', category: 'ACADEMIC', isRefundable: false },
  { code: 'EXAMINATION_FEE', name: 'Examination Fee', category: 'EXAM', isRefundable: false },
  { code: 'LAB_FEE', name: 'Lab Fee', category: 'ACADEMIC', isRefundable: false },
  { code: 'LIBRARY_FEE', name: 'Library Fee', category: 'FACILITY', isRefundable: false },
  { code: 'LIBRARY_FINE', name: 'Library Fine', category: 'FACILITY', isRefundable: false },
  { code: 'HOSTEL_FEE', name: 'Hostel Fee', category: 'FACILITY', isRefundable: false },
  { code: 'HOSTEL_ADMISSION_FEE', name: 'Hostel Admission Fee', category: 'FACILITY', isRefundable: false },
  { code: 'HOSTEL_SECURITY_DEPOSIT', name: 'Hostel Security Deposit', category: 'DEPOSIT', isRefundable: true },
  { code: 'MESS_FEE', name: 'Mess Fee', category: 'FACILITY', isRefundable: false },
  { code: 'HOSTEL_DAMAGE_CHARGE', name: 'Hostel Damage Charge', category: 'FACILITY', isRefundable: false },
  { code: 'TRANSPORT_FEE', name: 'Transport Fee', category: 'FACILITY', isRefundable: false },
  { code: 'TRANSPORT_ADMISSION_FEE', name: 'Transport Admission Fee', category: 'FACILITY', isRefundable: false },
  { code: 'TRANSPORT_DEPOSIT', name: 'Transport Deposit', category: 'DEPOSIT', isRefundable: true },
  { code: 'TRANSPORT_ROUTE_CHANGE_FEE', name: 'Transport Route Change Fee', category: 'FACILITY', isRefundable: false },
  { code: 'TRANSPORT_DAMAGE_CHARGE', name: 'Transport Damage Charge', category: 'FACILITY', isRefundable: false },
  { code: 'TRANSPORT_FINE', name: 'Transport Fine', category: 'FACILITY', isRefundable: false },
  { code: 'CAUTION_DEPOSIT', name: 'Caution Deposit', category: 'DEPOSIT', isRefundable: true },
  { code: 'ADMISSION_FEE', name: 'Admission Fee', category: 'ADMISSION', isRefundable: false },
  { code: 'PLACEMENT_FEE', name: 'Placement Fee', category: 'SERVICES', isRefundable: false },
  { code: 'MISCELLANEOUS', name: 'Miscellaneous', category: 'OTHER', isRefundable: false },
  { code: 'REVALUATION_FEE', name: 'Revaluation Fee', category: 'EXAM', isRefundable: false },
  { code: 'TRANSCRIPT_FEE', name: 'Transcript Fee', category: 'SERVICES', isRefundable: false },
];

const DEFAULT_SCHOLARSHIP_SCHEMES = [
  { code: 'GOVT_SCHOLARSHIP', name: 'Government Scholarship', provider: 'Government' },
  { code: 'SSP', name: 'State Scholarship Portal (SSP)', provider: 'State Government' },
  { code: 'SC_ST', name: 'SC/ST Scholarship', provider: 'Government' },
  { code: 'MERIT', name: 'Merit Scholarship', provider: 'Institution' },
  { code: 'INSTITUTION', name: 'Institution Scholarship', provider: 'Institution' },
];

export async function ensureCollegeFinanceDefaults(collegeId: number) {
  if (!(await db.schema.hasTable('fee_heads'))) return;

  for (const head of DEFAULT_FEE_HEADS) {
    const existing = await db('fee_heads').where({ college_id: collegeId, code: head.code }).first();
    if (!existing) {
      await db('fee_heads').insert({
        college_id: collegeId,
        code: head.code,
        name: head.name,
        category: head.category,
        is_refundable: head.isRefundable,
        is_active: true,
      });
    }
  }

  if (await db.schema.hasTable('scholarship_schemes')) {
    for (const scheme of DEFAULT_SCHOLARSHIP_SCHEMES) {
      const existing = await db('scholarship_schemes').where({ college_id: collegeId, code: scheme.code }).first();
      if (!existing) {
        await db('scholarship_schemes').insert({
          college_id: collegeId,
          code: scheme.code,
          name: scheme.name,
          provider: scheme.provider,
          is_active: true,
        });
      }
    }
  }

  if (await db.schema.hasTable('college_finance_policies')) {
    const policy = await db('college_finance_policies').where({ college_id: collegeId }).first();
    if (!policy) {
      await db('college_finance_policies').insert({
        college_id: collegeId,
        currency: 'INR',
        scholarship_treatment: 'REDUCE_DEMAND',
        exam_fee_paid_required: false,
        financial_clearance_mode: 'BLOCK',
      });
    }
  }
}
