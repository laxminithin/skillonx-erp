/**
 * Finance-owned payroll posting journal.
 * Payroll calculates money; Finance posts accounting. Idempotent on payroll_run_id.
 *
 * Reopen policy (mirrored in Payroll):
 *   If POSTED → must reverse via reversePayrollPosting before any payroll reopen.
 *   Locked payroll values remain immutable even after reversal; only status/posting refs change.
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { FinanceActor } from './types.js';
import { assertFinancePermission } from './access.js';
import { toMoney, addMoney, compareMoney, isZeroMoney } from './money.js';
import { recordFinanceAudit } from './audit.js';

type Row = Record<string, unknown>;

const DEFAULT_ACCOUNTS = [
  { code: 'SALARY_EXPENSE', name: 'Salary Expense', accountType: 'EXPENSE' },
  { code: 'EMPLOYER_CONTRIB_EXPENSE', name: 'Employer Contribution Expense', accountType: 'EXPENSE' },
  { code: 'NET_PAY_PAYABLE', name: 'Net Pay Payable', accountType: 'LIABILITY' },
  { code: 'STATUTORY_PF_PAYABLE', name: 'PF Payable', accountType: 'LIABILITY' },
  { code: 'STATUTORY_ESI_PAYABLE', name: 'ESI Payable', accountType: 'LIABILITY' },
  { code: 'STATUTORY_PT_PAYABLE', name: 'Professional Tax Payable', accountType: 'LIABILITY' },
  { code: 'STATUTORY_TDS_PAYABLE', name: 'TDS Payable', accountType: 'LIABILITY' },
  { code: 'OTHER_DEDUCTION_PAYABLE', name: 'Other Deduction Payable', accountType: 'LIABILITY' },
];

const DEFAULT_MAPPINGS: Array<{ key: string; debit: string; credit: string }> = [
  { key: 'SALARY_EXPENSE', debit: 'SALARY_EXPENSE', credit: 'NET_PAY_PAYABLE' },
  { key: 'NET_PAYABLE', debit: 'SALARY_EXPENSE', credit: 'NET_PAY_PAYABLE' },
  { key: 'STATUTORY_PF', debit: 'SALARY_EXPENSE', credit: 'STATUTORY_PF_PAYABLE' },
  { key: 'STATUTORY_ESI', debit: 'SALARY_EXPENSE', credit: 'STATUTORY_ESI_PAYABLE' },
  { key: 'STATUTORY_PT', debit: 'SALARY_EXPENSE', credit: 'STATUTORY_PT_PAYABLE' },
  { key: 'STATUTORY_TDS', debit: 'SALARY_EXPENSE', credit: 'STATUTORY_TDS_PAYABLE' },
  { key: 'OTHER_DEDUCTION', debit: 'SALARY_EXPENSE', credit: 'OTHER_DEDUCTION_PAYABLE' },
  { key: 'EMPLOYER_CONTRIBUTION', debit: 'EMPLOYER_CONTRIB_EXPENSE', credit: 'STATUTORY_PF_PAYABLE' },
];

export async function ensurePayrollFinanceDefaults(collegeId: number) {
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

  if (!(await db.schema.hasTable('finance_payroll_account_mappings'))) return;
  for (const m of DEFAULT_MAPPINGS) {
    const existing = await db('finance_payroll_account_mappings')
      .where({ college_id: collegeId, mapping_key: m.key })
      .first();
    if (!existing) {
      await db('finance_payroll_account_mappings').insert({
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
  await ensurePayrollFinanceDefaults(collegeId);
  const rows = await db('finance_payroll_account_mappings as m')
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
  return rows;
}

function assertMappingTenant(mapping: Row, collegeId: number) {
  if (Number(mapping.college_id) !== collegeId) {
    throw new AppError(403, 'Finance account mapping college mismatch');
  }
  if (mapping.debit_account_id && Number(mapping.debit_college_id) !== collegeId) {
    throw new AppError(403, 'Debit account college mismatch');
  }
  if (mapping.credit_account_id && Number(mapping.credit_college_id) !== collegeId) {
    throw new AppError(403, 'Credit account college mismatch');
  }
}

type PostingLine = {
  accountId: number;
  side: 'DEBIT' | 'CREDIT';
  amount: string;
  lineKey: string;
  description: string;
};

async function buildLines(collegeId: number, run: Row): Promise<{ lines: PostingLine[]; errors: string[] }> {
  const errors: string[] = [];
  if (Number(run.college_id) !== collegeId) {
    errors.push('Payroll run college mismatch');
    return { lines: [], errors };
  }

  const mappings = await loadMappings(collegeId);
  const byKey = new Map(mappings.map((m: Row) => [String(m.mapping_key), m]));

  const requireMap = (key: string) => {
    const m = byKey.get(key);
    if (!m || !m.debit_account_id || !m.credit_account_id) {
      errors.push(`Missing Finance mapping: ${key}`);
      return null;
    }
    assertMappingTenant(m, collegeId);
    return m;
  };

  const employees = await db('payroll_run_employees')
    .where({ payroll_run_id: run.id })
    .whereNotIn('calculation_status', ['SKIPPED', 'ERROR']);

  let gross = '0.00';
  let deductions = '0.00';
  let net = '0.00';
  const statutory: Record<string, string> = {
    PF: '0.00',
    ESI: '0.00',
    PT: '0.00',
    TDS: '0.00',
  };
  let otherDed = '0.00';
  let employer = '0.00';

  for (const emp of employees) {
    gross = addMoney(gross, emp.gross_amount);
    deductions = addMoney(deductions, emp.deduction_amount);
    net = addMoney(net, emp.net_amount);
    const comps = await db('payroll_run_components').where({ payroll_run_employee_id: emp.id });
    for (const c of comps) {
      const code = String(c.component_code || '');
      const type = String(c.component_type || '');
      const amt = toMoney(c.amount);
      if (type === 'DEDUCTION') {
        if (code in statutory) statutory[code] = addMoney(statutory[code], amt);
        else if (code !== 'LOP') otherDed = addMoney(otherDed, amt);
      }
      if (type === 'EMPLOYER_CONTRIBUTION') employer = addMoney(employer, amt);
    }
  }

  // Reconciliation: sum of employee nets must match run net_total
  if (run.net_total != null && compareMoney(net, run.net_total) !== 0) {
    errors.push(`Run totals out of balance: employee net ${net} vs run ${run.net_total}`);
  }
  if (run.gross_total != null && compareMoney(gross, run.gross_total) !== 0) {
    errors.push(`Gross mismatch: employee ${gross} vs run ${run.gross_total}`);
  }

  const lines: PostingLine[] = [];
  const pushPair = (key: string, amount: string, desc: string) => {
    if (isZeroMoney(amount) || Number(amount) <= 0) return;
    const m = requireMap(key);
    if (!m) return;
    lines.push({
      accountId: Number(m.debit_account_id),
      side: 'DEBIT',
      amount,
      lineKey: `${key}_DR`,
      description: desc,
    });
    lines.push({
      accountId: Number(m.credit_account_id),
      side: 'CREDIT',
      amount,
      lineKey: `${key}_CR`,
      description: desc,
    });
  };

  // Net pay: debit salary expense, credit net payable
  pushPair('NET_PAYABLE', net, 'Employee net pay payable');

  // Statutory withholdings — expense already in gross path; credit liability, debit reduces net path.
  // Accounting model: Debit Salary Expense (gross), Credit Net Payable (net), Credit statutory payables (deductions).
  // Rebuild cleaner: single gross expense debit, credit net + statutory + other.
  lines.length = 0;
  errors.length = 0;

  const salaryMap = requireMap('SALARY_EXPENSE') || requireMap('NET_PAYABLE');
  if (!salaryMap) {
    /* already pushed error */
  } else {
    // Debit full gross as salary expense
    lines.push({
      accountId: Number(salaryMap.debit_account_id),
      side: 'DEBIT',
      amount: gross,
      lineKey: 'SALARY_EXPENSE_DR',
      description: 'Salary expense (gross earnings)',
    });
  }

  const netMap = requireMap('NET_PAYABLE');
  if (netMap && Number(net) > 0) {
    lines.push({
      accountId: Number(netMap.credit_account_id),
      side: 'CREDIT',
      amount: net,
      lineKey: 'NET_PAYABLE_CR',
      description: 'Net pay payable',
    });
  }

  for (const [code, key] of [
    ['PF', 'STATUTORY_PF'],
    ['ESI', 'STATUTORY_ESI'],
    ['PT', 'STATUTORY_PT'],
    ['TDS', 'STATUTORY_TDS'],
  ] as const) {
    const amt = statutory[code];
    if (Number(amt) <= 0) continue;
    const m = requireMap(key);
    if (!m) continue;
    lines.push({
      accountId: Number(m.credit_account_id),
      side: 'CREDIT',
      amount: amt,
      lineKey: `${key}_CR`,
      description: `${code} payable`,
    });
  }

  if (Number(otherDed) > 0) {
    const m = requireMap('OTHER_DEDUCTION');
    if (m) {
      lines.push({
        accountId: Number(m.credit_account_id),
        side: 'CREDIT',
        amount: otherDed,
        lineKey: 'OTHER_DEDUCTION_CR',
        description: 'Other deductions payable',
      });
    }
  }

  if (Number(employer) > 0) {
    const m = requireMap('EMPLOYER_CONTRIBUTION');
    if (m) {
      lines.push({
        accountId: Number(m.debit_account_id),
        side: 'DEBIT',
        amount: employer,
        lineKey: 'EMPLOYER_CONTRIB_DR',
        description: 'Employer contribution expense',
      });
      lines.push({
        accountId: Number(m.credit_account_id),
        side: 'CREDIT',
        amount: employer,
        lineKey: 'EMPLOYER_CONTRIB_CR',
        description: 'Employer contribution payable',
      });
    }
  }

  let debitTotal = '0.00';
  let creditTotal = '0.00';
  for (const l of lines) {
    if (l.side === 'DEBIT') debitTotal = addMoney(debitTotal, l.amount);
    else creditTotal = addMoney(creditTotal, l.amount);
  }
  if (compareMoney(debitTotal, creditTotal) !== 0) {
    errors.push(`Finance posting unbalanced: debit ${debitTotal} != credit ${creditTotal}`);
  }

  return { lines, errors };
}

export async function buildPayrollPostingPreview(collegeId: number, run: Row) {
  if (!['LOCKED', 'POSTED', 'APPROVED'].includes(String(run.status))) {
    // Allow preview for calculated too, but flag
  }
  const { lines, errors } = await buildLines(collegeId, run);
  const existing = await db('finance_payroll_postings').where({ payroll_run_id: run.id }).first();
  let debitTotal = '0.00';
  let creditTotal = '0.00';
  for (const l of lines) {
    if (l.side === 'DEBIT') debitTotal = addMoney(debitTotal, l.amount);
    else creditTotal = addMoney(creditTotal, l.amount);
  }
  return {
    payrollRunId: Number(run.id),
    collegeId,
    financePostingStatus: run.finance_posting_status ?? 'NOT_POSTED',
    existingPostingId: existing ? Number(existing.id) : null,
    existingPostingNumber: existing?.posting_number ?? null,
    validationErrors: errors,
    debitTotal,
    creditTotal,
    balanced: compareMoney(debitTotal, creditTotal) === 0 && errors.length === 0,
    entries: lines.map((l) => ({
      accountId: l.accountId,
      side: l.side,
      amount: l.amount,
      lineKey: l.lineKey,
      description: l.description,
    })),
  };
}

export async function postPayrollRun(actor: FinanceActor, run: Row) {
  assertFinancePermission(actor, 'finance.payroll.post');
  if (Number(run.college_id) !== actor.collegeId) {
    throw new AppError(404, 'Payroll run not found');
  }
  if (!['LOCKED', 'APPROVED'].includes(String(run.status)) && String(run.status) !== 'POSTED') {
    // Prefer LOCKED
    if (String(run.status) !== 'LOCKED') {
      throw new AppError(400, 'Payroll must be LOCKED before Finance posting');
    }
  }
  if (String(run.status) !== 'LOCKED' && String(run.status) !== 'POSTED') {
    throw new AppError(400, 'Payroll must be LOCKED before Finance posting');
  }
  if (String(run.validation_status) === 'FAILED' || Number(run.validation_error_count) > 0) {
    throw new AppError(400, 'Cannot post payroll with validation errors');
  }

  // Idempotent: existing live posting
  const existing = await db('finance_payroll_postings')
    .where({ payroll_run_id: run.id })
    .whereIn('status', ['POSTED', 'POSTING'])
    .first();
  if (existing && existing.status === 'POSTED') {
    return {
      id: Number(existing.id),
      postingNumber: existing.posting_number,
      status: 'POSTED',
      idempotent: true,
    };
  }

  const preview = await buildPayrollPostingPreview(actor.collegeId, run);
  if (!preview.balanced || preview.validationErrors.length) {
    throw new AppError(400, `Finance posting validation failed: ${preview.validationErrors.join('; ')}`);
  }

  try {
    const result = await db.transaction(async (trx) => {
      const freshRun = await trx('payroll_runs').where({ id: run.id }).forUpdate().first();
      if (!freshRun) throw new AppError(404, 'Payroll run not found');
      if (Number(freshRun.college_id) !== actor.collegeId) throw new AppError(404, 'Payroll run not found');

      const again = await trx('finance_payroll_postings')
        .where({ payroll_run_id: run.id })
        .whereIn('status', ['POSTED', 'POSTING'])
        .first();
      if (again && again.status === 'POSTED') {
        return {
          id: Number(again.id),
          postingNumber: again.posting_number,
          status: 'POSTED' as const,
          idempotent: true,
        };
      }

      await trx('payroll_runs').where({ id: run.id }).update({ finance_posting_status: 'POSTING' });

      const postingNumber = `PRPAY/${actor.collegeId}/${run.id}/${Date.now()}`;
      let postingId: number;
      try {
        const [pid] = await trx('finance_payroll_postings').insert({
          college_id: actor.collegeId,
          payroll_run_id: run.id,
          posting_number: postingNumber,
          status: 'POSTED',
          debit_total: preview.debitTotal,
          credit_total: preview.creditTotal,
          posted_by: actor.facultyUserId,
          posted_at: trx.fn.now(),
        });
        postingId = Number(pid);
      } catch (err: unknown) {
        const e = err as { code?: string; message?: string };
        if (e?.code === 'ER_DUP_ENTRY' || /Duplicate/i.test(String(e?.message))) {
          const dup = await trx('finance_payroll_postings').where({ payroll_run_id: run.id }).first();
          if (dup) {
            return {
              id: Number(dup.id),
              postingNumber: dup.posting_number,
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
        await trx('finance_payroll_posting_lines').insert({
          posting_id: postingId,
          college_id: actor.collegeId,
          account_id: line.accountId,
          side: line.side,
          amount: line.amount,
          line_key: line.lineKey,
          description: line.description,
        });
      }

      await trx('payroll_runs').where({ id: run.id }).update({
        finance_posting_status: 'POSTED',
        finance_posting_id: postingId,
        posted_at: trx.fn.now(),
        status: 'POSTED',
      });

      return {
        id: postingId,
        postingNumber,
        status: 'POSTED' as const,
        idempotent: false,
      };
    });

    await recordFinanceAudit({
      collegeId: actor.collegeId,
      actorId: actor.facultyUserId,
      action: 'PAYROLL_POSTED',
      entityType: 'finance_payroll_postings',
      entityId: result.id,
      afterState: result,
    });

    return result;
  } catch (err) {
    await db('payroll_runs').where({ id: run.id }).update({
      finance_posting_status: 'FAILED',
    });
    throw err;
  }
}

export async function reversePayrollPosting(actor: FinanceActor, run: Row, reason: string) {
  assertFinancePermission(actor, 'finance.refund.approve');
  if (!reason || reason.trim().length < 5) throw new AppError(400, 'Reversal reason required');
  if (Number(run.college_id) !== actor.collegeId) throw new AppError(404, 'Payroll run not found');

  const posting = await db('finance_payroll_postings')
    .where({ payroll_run_id: run.id, college_id: actor.collegeId, status: 'POSTED' })
    .first();
  if (!posting) throw new AppError(404, 'No posted Finance entry to reverse');

  const result = await db.transaction(async (trx) => {
    const fresh = await trx('finance_payroll_postings').where({ id: posting.id }).forUpdate().first();
    if (!fresh || fresh.status !== 'POSTED') throw new AppError(400, 'Posting already reversed or not posted');

    const lines = await trx('finance_payroll_posting_lines').where({ posting_id: posting.id });
    const revNumber = `PRPAY-REV/${actor.collegeId}/${run.id}/${Date.now()}`;

    // Reversal posting is a separate journal; unique on payroll_run_id means we mark original REVERSED
    // and store reversal reference. We do NOT insert a second row with same payroll_run_id.
    await trx('finance_payroll_postings').where({ id: posting.id }).update({
      status: 'REVERSED',
      reason,
      reversed_by_posting_id: null,
    });

    // Create reversal artifact lines mirrored (store on same posting as audit JSON via new lines with REV_ prefix)
    for (const line of lines) {
      await trx('finance_payroll_posting_lines').insert({
        posting_id: posting.id,
        college_id: actor.collegeId,
        account_id: line.account_id,
        side: line.side === 'DEBIT' ? 'CREDIT' : 'DEBIT',
        amount: line.amount,
        line_key: `REV_${line.line_key}`,
        description: `Reversal: ${line.description || ''}`.slice(0, 255),
      });
    }

    await trx('finance_payroll_postings').where({ id: posting.id }).update({
      reversed_by_posting_id: posting.id,
      reason: `${reason} [${revNumber}]`,
    });

    await trx('payroll_runs').where({ id: run.id }).update({
      finance_posting_status: 'REVERSED',
      status: 'LOCKED',
    });

    return { postingId: Number(posting.id), reversalNumber: revNumber, status: 'REVERSED' };
  });

  await recordFinanceAudit({
    collegeId: actor.collegeId,
    actorId: actor.facultyUserId,
    action: 'PAYROLL_POSTING_REVERSED',
    entityType: 'finance_payroll_postings',
    entityId: result.postingId,
    reason,
    afterState: result,
  });

  return result;
}
