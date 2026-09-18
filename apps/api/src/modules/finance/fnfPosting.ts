/**
 * Finance-owned Full & Final posting journal.
 * Unique posting_key = FNF/{settlementId}/v{calculationVersion}
 * Concurrent/repeat posts are idempotent.
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { FinanceActor } from './types.js';
import { toMoney, addMoney, compareMoney, isZeroMoney } from './money.js';
import { recordFinanceAudit } from './audit.js';
import { markDuesSettledBySettlement } from './employeeDues.js';

type Row = Record<string, unknown>;

const DEFAULT_ACCOUNTS = [
  { code: 'FNF_EXPENSE', name: 'Final Settlement Expense', accountType: 'EXPENSE' },
  { code: 'FNF_PAYABLE', name: 'Employee Final Settlement Payable', accountType: 'LIABILITY' },
  { code: 'FNF_RECEIVABLE', name: 'Employee Final Settlement Receivable', accountType: 'ASSET' },
  { code: 'FNF_RECOVERY', name: 'Final Settlement Recoveries', accountType: 'LIABILITY' },
];

const DEFAULT_MAPPINGS = [
  { key: 'NET_PAYABLE', debit: 'FNF_EXPENSE', credit: 'FNF_PAYABLE' },
  { key: 'NET_RECEIVABLE', debit: 'FNF_RECEIVABLE', credit: 'FNF_RECOVERY' },
];

export async function ensureFnfFinanceDefaults(collegeId: number) {
  if (!(await db.schema.hasTable('finance_gl_accounts'))) return;
  const accountIds: Record<string, number> = {};
  for (const a of DEFAULT_ACCOUNTS) {
    let row = await db('finance_gl_accounts').where({ college_id: collegeId, code: a.code }).first();
    if (!row) {
      const [id] = await db('finance_gl_accounts').insert({
        college_id: collegeId,
        code: a.code,
        name: a.name,
        account_type: a.accountType,
        is_active: true,
      });
      accountIds[a.code] = Number(id);
    } else {
      accountIds[a.code] = Number(row.id);
    }
  }
  if (!(await db.schema.hasTable('finance_fnf_account_mappings'))) return;
  for (const m of DEFAULT_MAPPINGS) {
    const existing = await db('finance_fnf_account_mappings')
      .where({ college_id: collegeId, mapping_key: m.key })
      .first();
    if (!existing) {
      await db('finance_fnf_account_mappings').insert({
        college_id: collegeId,
        mapping_key: m.key,
        debit_account_id: accountIds[m.debit] ?? null,
        credit_account_id: accountIds[m.credit] ?? null,
        is_active: true,
      });
    }
  }
}

async function loadMappings(collegeId: number) {
  await ensureFnfFinanceDefaults(collegeId);
  return db('finance_fnf_account_mappings as m')
    .leftJoin('finance_gl_accounts as d', 'd.id', 'm.debit_account_id')
    .leftJoin('finance_gl_accounts as c', 'c.id', 'm.credit_account_id')
    .where({ 'm.college_id': collegeId, 'm.is_active': true })
    .select(
      'm.*',
      'd.code as debit_code',
      'd.college_id as debit_college_id',
      'c.code as credit_code',
      'c.college_id as credit_college_id',
    );
}

function postingKey(settlementId: number, version: number) {
  return `FNF/${settlementId}/v${version}`;
}

export async function buildFnfPostingPreview(collegeId: number, settlement: Row) {
  const errors: string[] = [];
  if (Number(settlement.college_id) !== collegeId) errors.push('Settlement college mismatch');
  const mappings = await loadMappings(collegeId);
  const byKey = new Map(mappings.map((m: Row) => [String(m.mapping_key), m]));
  const net = toMoney(settlement.net_amount);
  const direction = String(settlement.settlement_direction ?? (Number(net) >= 0 ? 'PAYABLE_TO_EMPLOYEE' : 'RECEIVABLE_FROM_EMPLOYEE'));
  const mapKey = direction === 'RECEIVABLE_FROM_EMPLOYEE' ? 'NET_RECEIVABLE' : 'NET_PAYABLE';
  const mapping = byKey.get(mapKey);
  if (!mapping || !mapping.debit_account_id || !mapping.credit_account_id) {
    errors.push(`Missing Finance mapping: ${mapKey}`);
  } else {
    if (Number(mapping.college_id) !== collegeId) errors.push('Mapping college mismatch');
    if (Number(mapping.debit_college_id) !== collegeId) errors.push('Debit account college mismatch');
    if (Number(mapping.credit_college_id) !== collegeId) errors.push('Credit account college mismatch');
  }
  const amount = toMoney(Math.abs(Number(net)));
  const lines =
    mapping && !errors.length && !isZeroMoney(amount)
      ? [
          {
            accountId: Number(mapping.debit_account_id),
            side: 'DEBIT' as const,
            amount,
            lineKey: `${mapKey}_DR`,
            description: direction === 'RECEIVABLE_FROM_EMPLOYEE' ? 'F&F receivable from employee' : 'F&F expense',
          },
          {
            accountId: Number(mapping.credit_account_id),
            side: 'CREDIT' as const,
            amount,
            lineKey: `${mapKey}_CR`,
            description: direction === 'RECEIVABLE_FROM_EMPLOYEE' ? 'F&F recovery' : 'F&F payable to employee',
          },
        ]
      : isZeroMoney(amount) && mapping && !errors.length
        ? []
        : [];

  let debitTotal = '0.00';
  let creditTotal = '0.00';
  for (const l of lines) {
    if (l.side === 'DEBIT') debitTotal = addMoney(debitTotal, l.amount);
    else creditTotal = addMoney(creditTotal, l.amount);
  }
  if (lines.length && compareMoney(debitTotal, creditTotal) !== 0) {
    errors.push(`Unbalanced posting: debit ${debitTotal} != credit ${creditTotal}`);
  }

  const key = postingKey(Number(settlement.id), Number(settlement.calculation_version ?? 1));
  const existing = await db('finance_fnf_postings').where({ posting_key: key }).first();
  return {
    settlementId: Number(settlement.id),
    collegeId,
    postingKey: key,
    direction,
    amount,
    debitTotal,
    creditTotal,
    balanced: errors.length === 0 && compareMoney(debitTotal, creditTotal) === 0,
    validationErrors: errors,
    existingPostingId: existing ? Number(existing.id) : null,
    entries: lines,
  };
}

export async function postFnfSettlement(actor: FinanceActor, settlement: Row) {
  if (Number(settlement.college_id) !== actor.collegeId) {
    throw new AppError(403, 'Cross-college Finance posting blocked', undefined, 'FNF_CROSS_COLLEGE');
  }
  const emp = await db('employees').where({ id: settlement.employee_id }).first();
  if (!emp || Number(emp.college_id) !== actor.collegeId) {
    throw new AppError(403, 'Employee college mismatch', undefined, 'FNF_CROSS_COLLEGE');
  }
  if (String(settlement.status) !== 'APPROVED' && String(settlement.finance_posting_status) !== 'POSTED') {
    throw new AppError(400, 'Settlement must be APPROVED before Finance posting');
  }

  const version = Number(settlement.calculation_version ?? 1);
  const key = postingKey(Number(settlement.id), version);
  const existing = await db('finance_fnf_postings')
    .where({ posting_key: key })
    .whereIn('status', ['POSTED', 'POSTING'])
    .first();
  if (existing && existing.status === 'POSTED') {
    return {
      id: Number(existing.id),
      postingNumber: existing.posting_number,
      postingKey: key,
      status: 'POSTED' as const,
      idempotent: true,
    };
  }

  const preview = await buildFnfPostingPreview(actor.collegeId, settlement);
  if (!preview.balanced || preview.validationErrors.length) {
    throw new AppError(400, `Finance posting validation failed: ${preview.validationErrors.join('; ')}`);
  }

  try {
    const result = await db.transaction(async (trx) => {
      const fresh = await trx('hr_final_settlements').where({ id: settlement.id }).forUpdate().first();
      if (!fresh) throw new AppError(404, 'Settlement not found');
      if (Number(fresh.college_id) !== actor.collegeId) {
        throw new AppError(403, 'Cross-college Finance posting blocked', undefined, 'FNF_CROSS_COLLEGE');
      }
      const again = await trx('finance_fnf_postings')
        .where({ posting_key: key })
        .whereIn('status', ['POSTED', 'POSTING'])
        .first();
      if (again && again.status === 'POSTED') {
        return {
          id: Number(again.id),
          postingNumber: again.posting_number,
          postingKey: key,
          status: 'POSTED' as const,
          idempotent: true,
        };
      }

      const postingNumber = `PRFNF/${actor.collegeId}/${settlement.id}/v${version}`;
      let postingId: number;
      try {
        const [pid] = await trx('finance_fnf_postings').insert({
          college_id: actor.collegeId,
          settlement_id: Number(settlement.id),
          calculation_version: version,
          posting_key: key,
          posting_number: postingNumber,
          status: 'POSTED',
          debit_total: preview.debitTotal,
          credit_total: preview.creditTotal,
          direction: preview.direction,
          posted_by: actor.facultyUserId,
          posted_at: trx.fn.now(),
        });
        postingId = Number(pid);
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        if (e?.code === 'ER_DUP_ENTRY' || /Duplicate/i.test(String(e?.message))) {
          const dup = await trx('finance_fnf_postings').where({ posting_key: key }).first();
          if (dup) {
            return {
              id: Number(dup.id),
              postingNumber: dup.posting_number,
              postingKey: key,
              status: String(dup.status),
              idempotent: true,
            };
          }
        }
        throw err;
      }

      for (const line of preview.entries) {
        const acct = await trx('finance_gl_accounts')
          .where({ id: line.accountId, college_id: actor.collegeId })
          .first();
        if (!acct) throw new AppError(400, `GL account ${line.accountId} not in college`);
        await trx('finance_fnf_posting_lines').insert({
          posting_id: postingId,
          college_id: actor.collegeId,
          account_id: line.accountId,
          side: line.side,
          amount: line.amount,
          line_key: line.lineKey,
          description: line.description,
        });
      }

      const dueIds: number[] = [];
      const comps = await trx('hr_fnf_components')
        .where({ settlement_id: Number(settlement.id), calculation_version: version, side: 'RECOVERY' });
      for (const c of comps) {
        const ref = String(c.source_ref ?? '');
        if (ref.startsWith('DUE:')) dueIds.push(Number(ref.slice(4)));
      }
      await markDuesSettledBySettlement(
        trx,
        actor.collegeId,
        Number(settlement.employee_id),
        Number(settlement.id),
        dueIds,
      );

      return {
        id: postingId,
        postingNumber,
        postingKey: key,
        status: 'POSTED' as const,
        idempotent: false,
      };
    });

    await recordFinanceAudit({
      collegeId: actor.collegeId,
      actorId: actor.facultyUserId,
      action: 'FNF_POSTED',
      entityType: 'finance_fnf_postings',
      entityId: result.id,
      afterState: result,
    });
    return result;
  } catch (err) {
    throw err;
  }
}

export async function reverseFnfPosting(actor: FinanceActor, settlement: Row, reason: string) {
  if (!reason || reason.trim().length < 5) throw new AppError(400, 'Reversal reason required');
  if (Number(settlement.college_id) !== actor.collegeId) {
    throw new AppError(403, 'Cross-college Finance posting blocked', undefined, 'FNF_CROSS_COLLEGE');
  }
  const version = Number(settlement.calculation_version ?? 1);
  const key = postingKey(Number(settlement.id), version);
  const posting = await db('finance_fnf_postings')
    .where({ posting_key: key, college_id: actor.collegeId, status: 'POSTED' })
    .first();
  if (!posting) throw new AppError(404, 'No posted Finance entry to reverse');

  await db.transaction(async (trx) => {
    const fresh = await trx('finance_fnf_postings').where({ id: posting.id }).forUpdate().first();
    if (!fresh || fresh.status !== 'POSTED') throw new AppError(400, 'Posting already reversed or not posted');
    await trx('finance_fnf_postings').where({ id: posting.id }).update({
      status: 'REVERSED',
      reason,
    });
  });

  await recordFinanceAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'FNF_POSTING_REVERSED',
    entityType: 'finance_fnf_postings',
    entityId: Number(posting.id),
    reason,
  });
  return { id: Number(posting.id), status: 'REVERSED' as const };
}
