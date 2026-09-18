import { db } from '../../db/index.js';
import type { HrActor } from './types.js';
import { requireEmployeeForActor } from './access.js';

type Row = Record<string, unknown>;

export async function notifyEmployee(params: {
  employeeId: number;
  collegeId: number;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  relatedType?: string | null;
  relatedId?: number | null;
  dedupeKey?: string | null;
}) {
  if (!(await db.schema.hasTable('employee_notifications'))) return;
  const emp = await db('employees').where({ id: params.employeeId }).first();
  const payload = {
    college_id: params.collegeId,
    employee_id: params.employeeId,
    faculty_user_id: emp?.faculty_user_id ?? null,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    link: params.link ?? null,
    related_type: params.relatedType ?? null,
    related_id: params.relatedId ?? null,
    dedupe_key: params.dedupeKey ?? null,
  };
  try {
    if (params.dedupeKey) {
      const existing = await db('employee_notifications')
        .where({ employee_id: params.employeeId, dedupe_key: params.dedupeKey })
        .first();
      if (existing) return;
    }
    // Short lock wait — never leave orphan long-running inserts that block the table.
    await db.transaction(async (trx) => {
      await trx.raw('SET innodb_lock_wait_timeout = 2');
      await trx('employee_notifications').insert(payload);
    });
  } catch {
    /* dedupe race / lock wait — non-blocking */
  }
}

export async function listEmployeeNotifications(actor: HrActor, unreadOnly = false) {
  const emp = await requireEmployeeForActor(actor);
  let q = db('employee_notifications').where({ employee_id: emp.id }).orderBy('created_at', 'desc').limit(50);
  if (unreadOnly) q = q.whereNull('read_at');
  const rows = await q;
  return rows.map((r: Row) => ({
    id: Number(r.id),
    type: r.type,
    title: r.title,
    body: r.body,
    link: r.link,
    readAt: r.read_at,
    createdAt: r.created_at,
  }));
}
