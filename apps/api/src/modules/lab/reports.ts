import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { LabActor } from './types.js';
import { assertLabPermission, scopedLabIds } from './access.js';

function today() { return new Date().toISOString().slice(0, 10); }

export const REPORT_TYPES = [
  'asset-register', 'lab-inventory', 'faulty-assets', 'repair-history', 'issue-return',
  'overdue-items', 'stock-ledger', 'low-stock', 'software-license', 'warranty-amc-expiry',
  'lab-readiness', 'requirement-status',
] as const;

export async function runReport(actor: LabActor, type: string, filters: { labId?: number } = {}) {
  assertLabPermission(actor, 'lab.report.view');
  if (!(REPORT_TYPES as readonly string[]).includes(type)) throw new AppError(400, 'Unknown report type');
  const ids = await scopedLabIds(actor);
  const scoped = ids === 'ALL' ? null : ids;
  if (scoped && scoped.length === 0) return { type, columns: [], rows: [], generatedAt: today() };
  const cid = actor.collegeId;
  const filt = <Q extends { whereIn: (c: string, v: number[]) => Q; where: (c: string, v: unknown) => Q }>(q: Q, col = 'lab_id') => {
    let out = scoped ? q.whereIn(col, scoped) : q;
    if (filters.labId) out = out.where(col, filters.labId);
    return out;
  };

  switch (type) {
    case 'asset-register':
    case 'faulty-assets': {
      let q = filt(db('lab_assets as a').leftJoin('labs as l', 'l.id', 'a.lab_id').where('a.college_id', cid), 'a.lab_id')
        .select('a.asset_tag', 'a.name', 'a.category', 'l.name as lab', 'a.operational_status', 'a.condition', 'a.serial_number', 'a.make', 'a.model')
        .orderBy('a.asset_tag');
      if (type === 'faulty-assets') q = q.whereIn('a.operational_status', ['FAULTY', 'UNDER_REPAIR']);
      return { type, columns: ['asset_tag', 'name', 'category', 'lab', 'operational_status', 'condition', 'serial_number', 'make', 'model'], rows: await q, generatedAt: today() };
    }
    case 'lab-inventory': {
      const rows = await filt(db('lab_assets').where('college_id', cid))
        .select('lab_id', 'category').count<{ count: number }[]>({ count: 'id' }).groupBy('lab_id', 'category');
      return { type, columns: ['lab_id', 'category', 'count'], rows, generatedAt: today() };
    }
    case 'repair-history': {
      const rows = await filt(db('lab_repairs as r').leftJoin('labs as l', 'l.id', 'r.lab_id').leftJoin('lab_assets as a', 'a.id', 'r.asset_id').where('r.college_id', cid), 'r.lab_id')
        .select('l.name as lab', 'a.asset_tag', 'r.requested_action', 'r.priority', 'r.status', 'r.approval_status', 'r.estimated_cost', 'r.actual_cost', 'r.created_at', 'r.completed_at')
        .orderBy('r.created_at', 'desc');
      return { type, columns: ['lab', 'asset_tag', 'requested_action', 'priority', 'status', 'approval_status', 'estimated_cost', 'actual_cost', 'created_at', 'completed_at'], rows, generatedAt: today() };
    }
    case 'issue-return':
    case 'overdue-items': {
      let q = filt(db('lab_issues as i').leftJoin('labs as l', 'l.id', 'i.lab_id').leftJoin('lab_assets as a', 'a.id', 'i.asset_id').where('i.college_id', cid), 'i.lab_id')
        .select('l.name as lab', 'a.asset_tag', 'i.description', 'i.recipient_type', 'i.issue_date', 'i.expected_return', 'i.actual_return', 'i.status')
        .orderBy('i.issue_date', 'desc');
      if (type === 'overdue-items') q = q.where('i.status', 'ISSUED').whereNotNull('i.expected_return').where('i.expected_return', '<', today());
      return { type, columns: ['lab', 'asset_tag', 'description', 'recipient_type', 'issue_date', 'expected_return', 'actual_return', 'status'], rows: await q, generatedAt: today() };
    }
    case 'stock-ledger': {
      const rows = await filt(db('lab_stock_movements as m').leftJoin('lab_stock_items as s', 's.id', 'm.stock_item_id').where('m.college_id', cid), 'm.lab_id')
        .select('s.name as item', 'm.movement_type', 'm.quantity', 'm.balance_after', 'm.reason', 'm.created_at')
        .orderBy('m.created_at', 'desc').limit(1000);
      return { type, columns: ['item', 'movement_type', 'quantity', 'balance_after', 'reason', 'created_at'], rows, generatedAt: today() };
    }
    case 'low-stock': {
      const rows = await filt(db('lab_stock_items as s').leftJoin('labs as l', 'l.id', 's.lab_id').where('s.college_id', cid).where('s.status', 'ACTIVE').whereRaw('s.current_stock <= s.min_threshold'), 's.lab_id')
        .select('l.name as lab', 's.name as item', 's.current_stock', 's.min_threshold', 's.unit');
      return { type, columns: ['lab', 'item', 'current_stock', 'min_threshold', 'unit'], rows, generatedAt: today() };
    }
    case 'software-license': {
      const rows = await filt(db('lab_software as sw').leftJoin('labs as l', 'l.id', 'sw.lab_id').where('sw.college_id', cid), 'sw.lab_id')
        .select('l.name as lab', 'sw.name', 'sw.version', 'sw.license_type', 'sw.license_count', 'sw.expiry_date', 'sw.installation_status');
      return { type, columns: ['lab', 'name', 'version', 'license_type', 'license_count', 'expiry_date', 'installation_status'], rows, generatedAt: today() };
    }
    case 'warranty-amc-expiry': {
      const soon = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
      const rows = await filt(db('lab_assets as a').leftJoin('labs as l', 'l.id', 'a.lab_id').where('a.college_id', cid), 'a.lab_id')
        .where((b) => b.where('a.warranty_end', '<=', soon).orWhere('a.amc_end', '<=', soon))
        .select('a.asset_tag', 'a.name', 'l.name as lab', 'a.warranty_end', 'a.amc_end', 'a.vendor')
        .orderBy('a.warranty_end');
      return { type, columns: ['asset_tag', 'name', 'lab', 'warranty_end', 'amc_end', 'vendor'], rows, generatedAt: today() };
    }
    case 'lab-readiness': {
      const rows = await filt(db('lab_sessions as ls').leftJoin('labs as l', 'l.id', 'ls.lab_id').where('ls.college_id', cid), 'ls.lab_id')
        .select('l.name as lab', 'ls.session_date', 'ls.readiness_status', 'ls.start_time', 'ls.end_time')
        .orderBy('ls.session_date', 'desc').limit(500);
      return { type, columns: ['lab', 'session_date', 'readiness_status', 'start_time', 'end_time'], rows, generatedAt: today() };
    }
    case 'requirement-status': {
      const rows = await filt(db('lab_requirements as r').leftJoin('labs as l', 'l.id', 'r.lab_id').where('r.college_id', cid), 'r.lab_id')
        .select('l.name as lab', 'r.request_type', 'r.item', 'r.quantity', 'r.priority', 'r.status', 'r.estimated_cost', 'r.purchase_ref', 'r.created_at')
        .orderBy('r.created_at', 'desc');
      return { type, columns: ['lab', 'request_type', 'item', 'quantity', 'priority', 'status', 'estimated_cost', 'purchase_ref', 'created_at'], rows, generatedAt: today() };
    }
    default:
      throw new AppError(400, 'Unknown report type');
  }
}
