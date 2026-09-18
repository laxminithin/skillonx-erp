import { db } from '../../db/index.js';
import type { TransportNoDueReason, TransportNoDueStatus } from './types.js';
import { isTransportFinanceClear } from './integration.js';

export async function getTransportNoDueStatus(studentId: number, collegeId: number): Promise<{
  status: TransportNoDueStatus;
  reasons: TransportNoDueReason[];
}> {
  if (!(await db.schema.hasTable('transport_members'))) {
    return { status: 'NOT_APPLICABLE', reasons: [] };
  }

  const member = await db('transport_members')
    .where({ student_id: studentId, college_id: collegeId })
    .orderBy('created_at', 'desc')
    .first();

  if (!member) return { status: 'NOT_APPLICABLE', reasons: [] };

  const reasons: TransportNoDueReason[] = [];

  if (member.status === 'ACTIVE') {
    reasons.push('ACTIVE_TRANSPORT_ASSIGNMENT');
  }

  if (member.status === 'CANCELLATION_PENDING') {
    reasons.push('CANCELLATION_PENDING');
  }

  const pendingCancel = await db('transport_cancellation_requests')
    .where({ transport_member_id: member.id })
    .whereIn('status', ['REQUESTED', 'UNDER_REVIEW'])
    .first();
  if (pendingCancel) {
    reasons.push('CANCELLATION_PENDING');
  }

  const financeClear = await isTransportFinanceClear(studentId, collegeId);
  if (!financeClear) {
    reasons.push('TRANSPORT_FINANCIAL_DUE');
  }

  if (reasons.length === 0) return { status: 'CLEAR', reasons: [] };
  if (reasons.includes('ACTIVE_TRANSPORT_ASSIGNMENT') && member.status === 'ACTIVE') {
    return { status: 'NOT_APPLICABLE', reasons: [] };
  }
  return { status: 'DUE', reasons: [...new Set(reasons)] };
}

export async function getStudentClearance(studentId: number, collegeId: number) {
  const transport = await getTransportNoDueStatus(studentId, collegeId);
  return {
    transport: {
      status: transport.status,
      reasons: transport.reasons,
      label: 'Transport',
    },
    overallClear: transport.status === 'CLEAR' || transport.status === 'NOT_APPLICABLE',
  };
}
