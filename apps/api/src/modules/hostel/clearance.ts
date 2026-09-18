import { db } from '../../db/index.js';
import type { HostelNoDueReason, HostelNoDueStatus } from './types.js';
import { isHostelFinanceClear } from './integration.js';

export async function getHostelNoDueStatus(studentId: number, collegeId: number): Promise<{
  status: HostelNoDueStatus;
  reasons: HostelNoDueReason[];
}> {
  if (!(await db.schema.hasTable('hostel_residents'))) {
    return { status: 'NOT_APPLICABLE', reasons: [] };
  }

  const resident = await db('hostel_residents')
    .where({ student_id: studentId, college_id: collegeId })
    .orderBy('created_at', 'desc')
    .first();

  if (!resident) return { status: 'NOT_APPLICABLE', reasons: [] };

  const reasons: HostelNoDueReason[] = [];

  if (['ACTIVE', 'TEMPORARILY_AWAY'].includes(resident.status)) {
    reasons.push('ACTIVE_ALLOCATION');
  }

  if (resident.status === 'VACATING') {
    const vacating = await db('hostel_vacating_requests')
      .where({ resident_id: resident.id })
      .whereNotIn('status', ['COMPLETED', 'CANCELLED', 'REJECTED'])
      .first();
    if (vacating) {
      if (!vacating.keys_returned) reasons.push('KEY_NOT_RETURNED');
      if (!vacating.assets_verified) reasons.push('ASSET_PENDING');
      if (!vacating.damage_checked) reasons.push('DAMAGE_PENDING');
      reasons.push('VACATING_INCOMPLETE');
    }
  }

  const pendingDamage = await db('hostel_damage_assessments')
    .where({ resident_id: resident.id, college_id: collegeId })
    .whereIn('status', ['REPORTED', 'ASSESSED', 'APPROVED', 'CHARGED'])
    .count({ c: '*' })
    .first();
  if (Number(pendingDamage?.c ?? 0) > 0) {
    reasons.push('DAMAGE_PENDING');
  }

  const financeClear = await isHostelFinanceClear(studentId, collegeId);
  if (!financeClear) {
    reasons.push('HOSTEL_FINANCIAL_DUE');
  }

  const chargedDamage = await db('hostel_damage_assessments')
    .where({ resident_id: resident.id, status: 'CHARGED' })
    .whereNotNull('finance_demand_id')
    .first();
  if (chargedDamage && !financeClear) {
    reasons.push('DAMAGE_FINANCIAL_SETTLEMENT_PENDING');
  }

  if (reasons.length === 0) return { status: 'CLEAR', reasons: [] };
  if (reasons.includes('ACTIVE_ALLOCATION') && resident.status === 'ACTIVE') {
    return { status: 'NOT_APPLICABLE', reasons: [] };
  }
  return { status: 'DUE', reasons: [...new Set(reasons)] };
}

export async function getStudentClearance(studentId: number, collegeId: number) {
  const hostel = await getHostelNoDueStatus(studentId, collegeId);
  return {
    hostel: {
      status: hostel.status,
      reasons: hostel.reasons,
      label: 'Hostel',
    },
    overallClear: hostel.status === 'CLEAR' || hostel.status === 'NOT_APPLICABLE',
  };
}
