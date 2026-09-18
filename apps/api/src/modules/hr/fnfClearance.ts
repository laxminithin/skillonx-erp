import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { HrActor } from './types.js';
import { assertHrPermission, hasHrPermission, assertManagerScope } from './access.js';
import { recordHrAudit } from './audit.js';
import { toMoney } from './payrollMoney.js';
import {
  getEmployeeLibraryObligations,
  getFinanceDuesSnapshot,
  getHostelClearanceSnapshot,
  getTransportClearanceSnapshot,
} from './fnfSources.js';
import { FNF_LOCKED_STATUSES, type ClearanceDomain, type ClearanceStatus } from './fnfTypes.js';

type Row = Record<string, unknown>;

const ALWAYS_PENDING: ClearanceDomain[] = ['DEPARTMENT', 'HR', 'IT'];

export async function syncClearances(settlementId: number, employeeId: number, collegeId: number) {
  const [library, finance, hostel, transport] = await Promise.all([
    getEmployeeLibraryObligations(employeeId, collegeId),
    getFinanceDuesSnapshot(employeeId, collegeId),
    getHostelClearanceSnapshot(employeeId, collegeId),
    getTransportClearanceSnapshot(employeeId, collegeId),
  ]);

  const items: Array<{
    domain: ClearanceDomain;
    status: ClearanceStatus;
    sourceModule: string;
    sourceSnapshot: unknown;
    dueAmount: string;
    blocking: boolean;
  }> = [
    {
      domain: 'LIBRARY',
      status: library.status,
      sourceModule: 'library',
      sourceSnapshot: library,
      dueAmount: library.fineAmount,
      blocking: library.status === 'DUE',
    },
    {
      domain: 'FINANCE',
      status: finance.status,
      sourceModule: 'finance',
      sourceSnapshot: finance,
      dueAmount: finance.total,
      blocking: finance.status === 'DUE',
    },
    {
      domain: 'HOSTEL',
      status: hostel.status as ClearanceStatus,
      sourceModule: 'hostel',
      sourceSnapshot: hostel,
      dueAmount: '0.00',
      blocking: hostel.status === 'PENDING',
    },
    {
      domain: 'TRANSPORT',
      status: transport.status as ClearanceStatus,
      sourceModule: 'transport',
      sourceSnapshot: transport,
      dueAmount: '0.00',
      blocking: transport.status === 'PENDING',
    },
  ];

  for (const domain of ALWAYS_PENDING) {
    items.push({
      domain,
      status: 'PENDING',
      sourceModule: 'lifecycle',
      sourceSnapshot: { domain },
      dueAmount: '0.00',
      blocking: true,
    });
  }

  const assets = await db('hr_fnf_asset_items').where({ settlement_id: settlementId });
  if (assets.length) {
    const pending = assets.some((a: Row) => !['CLEARED', 'WAIVED', 'NOT_APPLICABLE'].includes(String(a.status)));
    const recovery = assets.reduce((s: number, a: Row) => s + Number(a.recovery_amount ?? 0), 0);
    items.push({
      domain: 'ASSET',
      status: pending ? 'PENDING' : Number(recovery) > 0 ? 'DUE' : 'CLEARED',
      sourceModule: 'fnf_assets',
      sourceSnapshot: { count: assets.length },
      dueAmount: toMoney(recovery),
      blocking: pending,
    });
  } else {
    items.push({
      domain: 'ASSET',
      status: 'NOT_APPLICABLE',
      sourceModule: 'fnf_assets',
      sourceSnapshot: { count: 0 },
      dueAmount: '0.00',
      blocking: false,
    });
  }

  for (const item of items) {
    const existing = await db('hr_fnf_clearances').where({ settlement_id: settlementId, domain: item.domain }).first();
    if (existing) {
      const lockedHuman = ['CLEARED', 'WAIVED'].includes(String(existing.status)) && existing.actor_faculty_id;
      const sourceLocked = !!existing.overridden;
      if (lockedHuman || sourceLocked) {
        // Keep human decision / override; refresh due snapshot only for source domains
        if (['LIBRARY', 'FINANCE'].includes(item.domain) && !existing.overridden) {
          await db('hr_fnf_clearances').where({ id: existing.id }).update({
            source_snapshot: JSON.stringify(item.sourceSnapshot),
            due_amount: item.dueAmount,
            status: item.status,
            blocking: item.blocking,
          });
        }
        continue;
      }
      await db('hr_fnf_clearances').where({ id: existing.id }).update({
        status: item.status,
        source_module: item.sourceModule,
        source_snapshot: JSON.stringify(item.sourceSnapshot),
        due_amount: item.dueAmount,
        blocking: item.blocking,
      });
    } else {
      await db('hr_fnf_clearances').insert({
        settlement_id: settlementId,
        college_id: collegeId,
        domain: item.domain,
        status: item.status,
        source_module: item.sourceModule,
        source_snapshot: JSON.stringify(item.sourceSnapshot),
        due_amount: item.dueAmount,
        blocking: item.blocking,
      });
    }
  }
}

export async function listClearances(settlementId: number) {
  const rows = await db('hr_fnf_clearances').where({ settlement_id: settlementId }).orderBy('id');
  return rows.map(mapClearance);
}

function mapClearance(r: Row) {
  return {
    id: Number(r.id),
    domain: String(r.domain),
    status: String(r.status),
    sourceModule: r.source_module,
    dueAmount: toMoney(r.due_amount),
    blocking: !!r.blocking,
    actorFacultyId: r.actor_faculty_id ? Number(r.actor_faculty_id) : null,
    decidedAt: r.decided_at,
    remarks: r.remarks,
    overridden: !!r.overridden,
    overrideReason: r.override_reason,
  };
}

export function unresolvedMandatory(items: Array<{ status: string; blocking: boolean; domain: string }>) {
  return items.filter((i) => i.blocking && ['PENDING', 'DUE'].includes(i.status));
}

export async function decideClearance(
  actor: HrActor,
  settlementId: number,
  domain: string,
  input: {
    status: string;
    remarks?: string;
    dueAmount?: number;
    waive?: boolean;
    override?: boolean;
    overrideReason?: string;
  },
) {
  const settlement = await db('hr_final_settlements').where({ id: settlementId }).first();
  if (!settlement || Number(settlement.college_id) !== actor.collegeId) {
    throw new AppError(404, 'Settlement not found');
  }
  if (FNF_LOCKED_STATUSES.includes(settlement.status)) {
    throw new AppError(400, 'Settlement is locked', undefined, 'FNF_LOCKED');
  }

  const isHodOnly = domain === 'DEPARTMENT' && !hasHrPermission(actor, 'hr.fnf.manage');
  if (isHodOnly) {
    assertHrPermission(actor, 'hr.fnf.clearance.department');
    await assertManagerScope(actor, Number(settlement.employee_id));
  } else {
    assertHrPermission(actor, 'hr.fnf.manage');
  }

  const row = await db('hr_fnf_clearances').where({ settlement_id: settlementId, domain }).first();
  if (!row) throw new AppError(404, 'Clearance item not found');

  let status = input.waive ? 'WAIVED' : input.status;
  let overridden = !!row.overridden;
  let overrideReason = row.override_reason;
  let overrideBy = row.override_by;

  if (['LIBRARY', 'FINANCE'].includes(domain) && status === 'CLEARED') {
    const snapshotStatus = String(row.status);
    if (snapshotStatus === 'DUE' && !input.override && !input.waive) {
      throw new AppError(
        400,
        `${domain} still has source dues and cannot be cleared without an authorized override`,
        undefined,
        'FNF_SOURCE_DUE',
      );
    }
  }

  if (input.override) {
    assertHrPermission(actor, 'hr.fnf.override');
    if (!input.overrideReason || input.overrideReason.trim().length < 5) {
      throw new AppError(400, 'Override reason required');
    }
    overridden = true;
    overrideReason = input.overrideReason;
    overrideBy = actor.facultyUserId;
    status = input.waive ? 'WAIVED' : input.status;
  }

  const before = { status: row.status, overridden: row.overridden };
  await db('hr_fnf_clearances').where({ id: row.id }).update({
    status,
    remarks: input.remarks ?? row.remarks,
    due_amount: input.dueAmount != null ? toMoney(input.dueAmount) : row.due_amount,
    actor_faculty_id: actor.facultyUserId,
    decided_at: db.fn.now(),
    overridden,
    override_reason: overrideReason,
    override_by: overrideBy,
  });

  await recordHrAudit({
    actor,
    action: overridden ? 'FNF_CLEARANCE_OVERRIDE' : input.waive ? 'FNF_CLEARANCE_WAIVED' : 'FNF_CLEARANCE_DECISION',
    entityType: 'hr_fnf_clearances',
    entityId: settlementId,
    before,
    after: { status, domain },
    reason: input.overrideReason ?? input.remarks,
  });

  return mapClearance(await db('hr_fnf_clearances').where({ id: row.id }).first());
}

export async function listHodClearanceInbox(actor: HrActor) {
  assertHrPermission(actor, 'hr.fnf.clearance.department');
  const depts = actor.hodDepartmentIds?.length
    ? actor.hodDepartmentIds
    : actor.departmentId
      ? [actor.departmentId]
      : [];
  if (!depts.length) return [];
  const rows = await db('hr_fnf_clearances as c')
    .join('hr_final_settlements as s', 's.id', 'c.settlement_id')
    .join('employees as e', 'e.id', 's.employee_id')
    .where({ 'c.college_id': actor.collegeId, 'c.domain': 'DEPARTMENT' })
    .whereIn('e.department_id', depts)
    .whereIn('c.status', ['PENDING', 'DUE'])
    .whereNotIn('s.status', ['CANCELLED', 'CLOSED'])
    .select(
      'c.id',
      'c.status',
      'c.remarks',
      'c.updated_at',
      's.id as settlement_id',
      's.case_number',
      's.last_working_date',
      'e.id as employee_id',
      'e.display_name',
      'e.employee_number',
      'e.department_id',
    )
    .orderBy('c.updated_at', 'desc');
  return rows.map((r: Row) => ({
    clearanceId: Number(r.id),
    settlementId: Number(r.settlement_id),
    caseNumber: r.case_number,
    status: r.status,
    lastWorkingDate: r.last_working_date,
    employeeId: Number(r.employee_id),
    employeeName: r.display_name,
    employeeNumber: r.employee_number,
    departmentId: Number(r.department_id),
    remarks: r.remarks,
  }));
}

export async function getHodClearanceDetail(actor: HrActor, settlementId: number) {
  assertHrPermission(actor, 'hr.fnf.clearance.department');
  const settlement = await db('hr_final_settlements as s')
    .join('employees as e', 'e.id', 's.employee_id')
    .where({ 's.id': settlementId, 's.college_id': actor.collegeId })
    .select('s.id', 's.case_number', 's.status', 's.last_working_date', 's.separation_type', 'e.id as employee_id', 'e.display_name', 'e.employee_number', 'e.department_id')
    .first();
  if (!settlement) throw new AppError(404, 'Settlement not found');
  await assertManagerScope(actor, Number(settlement.employee_id));
  const deptClearance = await db('hr_fnf_clearances')
    .where({ settlement_id: settlementId, domain: 'DEPARTMENT' })
    .first();
  return {
    settlementId: Number(settlement.id),
    caseNumber: settlement.case_number,
    status: settlement.status,
    lastWorkingDate: settlement.last_working_date,
    separationType: settlement.separation_type,
    employee: {
      id: Number(settlement.employee_id),
      name: settlement.display_name,
      employeeNumber: settlement.employee_number,
      departmentId: Number(settlement.department_id),
    },
    departmentClearance: deptClearance ? mapClearance(deptClearance) : null,
  };
}
