/**
 * APPROVED CROSS-MODULE CHANGE: Examination remuneration receiver (Finance-owned).
 *
 * Finance is NOT reopened. This is the minimum governed receiver for an approved
 * Examination remuneration obligation, following the existing preview -> post -> reverse
 * posting pattern (mirrors payrollPosting) and idempotent on the source obligation.
 *
 * Source of truth for the amount is the Examination obligation row, read server-side.
 * The browser never supplies the payable amount (§6).
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertFinancePermission } from './access.js';
import { toMoney, compareMoney } from './money.js';
import { recordFinanceAudit } from './audit.js';
const ACCOUNTS = [
    { code: 'EXAM_REMUNERATION_EXPENSE', name: 'Examination Remuneration Expense', accountType: 'EXPENSE' },
    { code: 'EXAM_REMUNERATION_PAYABLE', name: 'Examination Remuneration Payable', accountType: 'LIABILITY' },
];
export async function ensureExamRemunerationDefaults(collegeId) {
    if (!(await db.schema.hasTable('finance_gl_accounts')))
        return {};
    const ids = {};
    for (const a of ACCOUNTS) {
        let row = await db('finance_gl_accounts').where({ college_id: collegeId, code: a.code }).first();
        if (!row) {
            const [id] = await db('finance_gl_accounts').insert({
                college_id: collegeId,
                code: a.code,
                name: a.name,
                account_type: a.accountType,
                is_active: true,
            });
            ids[a.code] = Number(id);
        }
        else {
            ids[a.code] = Number(row.id);
        }
    }
    return ids;
}
async function loadApprovedObligation(collegeId, remunerationItemId) {
    const item = await db('exam_remuneration_items').where({ id: remunerationItemId, college_id: collegeId }).first();
    if (!item)
        throw new AppError(404, 'Remuneration obligation not found');
    return item;
}
export async function previewExamRemunerationPosting(collegeId, remunerationItemId) {
    const item = await loadApprovedObligation(collegeId, remunerationItemId);
    const ids = await ensureExamRemunerationDefaults(collegeId);
    const amount = toMoney(item.amount);
    const existing = await db('finance_exam_remuneration_postings').where({ remuneration_item_id: item.id }).first();
    const entries = [
        { accountId: ids.EXAM_REMUNERATION_EXPENSE, side: 'DEBIT', amount, lineKey: 'EXAM_REMUN_EXPENSE_DR', description: 'Examination remuneration expense' },
        { accountId: ids.EXAM_REMUNERATION_PAYABLE, side: 'CREDIT', amount, lineKey: 'EXAM_REMUN_PAYABLE_CR', description: 'Examination remuneration payable' },
    ];
    return {
        remunerationItemId: Number(item.id),
        obligationStatus: item.status,
        amount,
        debitTotal: amount,
        creditTotal: amount,
        balanced: compareMoney(amount, amount) === 0,
        existingPostingId: existing ? Number(existing.id) : null,
        existingPostingStatus: existing?.status ?? null,
        entries,
    };
}
/**
 * Idempotent post: the same approved obligation, posted once, twice, or concurrently,
 * produces exactly ONE financial posting (§7). Amount is read from the obligation (§6).
 */
export async function postExamRemuneration(actor, remunerationItemId) {
    assertFinancePermission(actor, 'finance.payroll.post');
    const item = await loadApprovedObligation(actor.collegeId, remunerationItemId);
    if (item.status === 'REVERSED')
        throw new AppError(400, 'Remuneration obligation has been reversed');
    if (item.status !== 'APPROVED' && item.status !== 'HANDED_OFF') {
        throw new AppError(400, 'Remuneration must be COE-approved before Finance posting');
    }
    if (!(Number(item.amount) > 0))
        throw new AppError(400, 'Remuneration amount must be positive');
    const existing = await db('finance_exam_remuneration_postings')
        .where({ remuneration_item_id: item.id, status: 'POSTED' })
        .first();
    if (existing) {
        return { id: Number(existing.id), postingNumber: existing.posting_number, status: 'POSTED', amount: Number(item.amount), idempotent: true };
    }
    const ids = await ensureExamRemunerationDefaults(actor.collegeId);
    const amount = toMoney(item.amount);
    const result = await db.transaction(async (trx) => {
        // serialize concurrent posts of the same obligation
        const fresh = await trx('exam_remuneration_items').where({ id: item.id }).forUpdate().first();
        if (!fresh || Number(fresh.college_id) !== actor.collegeId)
            throw new AppError(404, 'Remuneration obligation not found');
        const again = await trx('finance_exam_remuneration_postings')
            .where({ remuneration_item_id: item.id, status: 'POSTED' })
            .first();
        if (again) {
            return { id: Number(again.id), postingNumber: again.posting_number, status: 'POSTED', idempotent: true };
        }
        const postingNumber = `EXREMUN/${actor.collegeId}/${item.id}/${Date.now()}`;
        let postingId;
        try {
            const [pid] = await trx('finance_exam_remuneration_postings').insert({
                college_id: actor.collegeId,
                remuneration_item_id: item.id,
                posting_number: postingNumber,
                status: 'POSTED',
                debit_total: amount,
                credit_total: amount,
                posted_by: actor.facultyUserId,
                posted_at: trx.fn.now(),
            });
            postingId = Number(pid);
        }
        catch (err) {
            const e = err;
            if (e?.code === 'ER_DUP_ENTRY' || /Duplicate/i.test(String(e?.message))) {
                const dup = await trx('finance_exam_remuneration_postings').where({ remuneration_item_id: item.id }).first();
                if (dup)
                    return { id: Number(dup.id), postingNumber: dup.posting_number, status: String(dup.status), idempotent: true };
            }
            throw err;
        }
        for (const line of [
            { accountId: ids.EXAM_REMUNERATION_EXPENSE, side: 'DEBIT', lineKey: 'EXAM_REMUN_EXPENSE_DR', description: 'Examination remuneration expense' },
            { accountId: ids.EXAM_REMUNERATION_PAYABLE, side: 'CREDIT', lineKey: 'EXAM_REMUN_PAYABLE_CR', description: 'Examination remuneration payable' },
        ]) {
            const acct = await trx('finance_gl_accounts').where({ id: line.accountId, college_id: actor.collegeId }).first();
            if (!acct)
                throw new AppError(400, `GL account ${line.accountId} not in college`);
            await trx('finance_exam_remuneration_posting_lines').insert({
                posting_id: postingId,
                college_id: actor.collegeId,
                account_id: line.accountId,
                side: line.side,
                amount,
                line_key: line.lineKey,
                description: line.description,
            });
        }
        await trx('exam_remuneration_items').where({ id: item.id }).update({ status: 'HANDED_OFF', finance_posting_id: postingId, updated_at: trx.fn.now() });
        return { id: postingId, postingNumber, status: 'POSTED', idempotent: false };
    });
    await recordFinanceAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'EXAM_REMUNERATION_POSTED',
        entityType: 'finance_exam_remuneration_postings',
        entityId: result.id,
        afterState: { ...result, amount: Number(item.amount) },
    });
    return { ...result, amount: Number(item.amount) };
}
export async function reverseExamRemuneration(actor, remunerationItemId, reason) {
    assertFinancePermission(actor, 'finance.refund.approve');
    if (!reason || reason.trim().length < 5)
        throw new AppError(400, 'Reversal reason required');
    const item = await loadApprovedObligation(actor.collegeId, remunerationItemId);
    const posting = await db('finance_exam_remuneration_postings')
        .where({ remuneration_item_id: item.id, college_id: actor.collegeId, status: 'POSTED' })
        .first();
    if (!posting)
        throw new AppError(404, 'No posted remuneration to reverse');
    const result = await db.transaction(async (trx) => {
        const fresh = await trx('finance_exam_remuneration_postings').where({ id: posting.id }).forUpdate().first();
        if (!fresh || fresh.status !== 'POSTED')
            throw new AppError(400, 'Posting already reversed or not posted');
        const lines = await trx('finance_exam_remuneration_posting_lines').where({ posting_id: posting.id });
        // reversal preserves history: original stays, mirrored lines are appended, status flips (never deleted)
        for (const line of lines) {
            await trx('finance_exam_remuneration_posting_lines').insert({
                posting_id: posting.id,
                college_id: actor.collegeId,
                account_id: line.account_id,
                side: line.side === 'DEBIT' ? 'CREDIT' : 'DEBIT',
                amount: line.amount,
                line_key: `REV_${line.line_key}`,
                description: `Reversal: ${line.description || ''}`.slice(0, 255),
            });
        }
        await trx('finance_exam_remuneration_postings').where({ id: posting.id }).update({ status: 'REVERSED', reason, updated_at: trx.fn.now() });
        await trx('exam_remuneration_items').where({ id: item.id }).update({ status: 'REVERSED', updated_at: trx.fn.now() });
        return { postingId: Number(posting.id), status: 'REVERSED' };
    });
    await recordFinanceAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'EXAM_REMUNERATION_REVERSED',
        entityType: 'finance_exam_remuneration_postings',
        entityId: result.postingId,
        reason,
    });
    return result;
}
/** Finance-authoritative readback of the payable state. */
export async function getExamRemunerationReadback(collegeId, remunerationItemId) {
    const item = await loadApprovedObligation(collegeId, remunerationItemId);
    const posting = await db('finance_exam_remuneration_postings').where({ remuneration_item_id: item.id }).first();
    const lines = posting
        ? await db('finance_exam_remuneration_posting_lines').where({ posting_id: posting.id }).orderBy('id')
        : [];
    return {
        remunerationItemId: Number(item.id),
        obligationStatus: item.status,
        amount: Number(item.amount),
        posting: posting
            ? {
                id: Number(posting.id),
                postingNumber: posting.posting_number,
                status: posting.status,
                debitTotal: Number(posting.debit_total),
                creditTotal: Number(posting.credit_total),
                postedAt: posting.posted_at,
            }
            : null,
        lines: lines.map((l) => ({ side: l.side, amount: Number(l.amount), lineKey: l.line_key, description: l.description })),
    };
}
