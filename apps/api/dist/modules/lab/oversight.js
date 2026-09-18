import { db } from '../../db/index.js';
import { assertLabPermission, scopedLabIds } from './access.js';
function today() { return new Date().toISOString().slice(0, 10); }
/**
 * Oversight analytics for Lab In-charge / HOD / Principal / Management.
 * Scope is resolved by scopedLabIds (assignment → department → institution),
 * so the same function safely serves every oversight tier without leaking
 * out-of-scope labs.
 */
export async function oversight(actor) {
    assertLabPermission(actor, 'lab.oversight.view');
    const ids = await scopedLabIds(actor);
    const cid = actor.collegeId;
    const scoped = ids === 'ALL' ? null : ids;
    if (scoped && scoped.length === 0) {
        return { scope: 'NONE', summary: emptySummary(), departments: [], labs: [], faults: [], pendingApprovals: [], lowStock: [] };
    }
    const inScope = (q, col = 'lab_id') => scoped ? q.whereIn(col, scoped) : q;
    const [labs, assets, lowStock, faults, repairs, requirements] = await Promise.all([
        inScope(db('labs as l').leftJoin('departments as d', 'd.id', 'l.department_id').where('l.college_id', cid), 'l.id')
            .select('l.id', 'l.name', 'l.status', 'l.department_id', 'd.name as department_name'),
        inScope(db('lab_assets').where('college_id', cid)).select('lab_id', 'operational_status').count({ c: 'id' }).groupBy('lab_id', 'operational_status'),
        inScope(db('lab_stock_items').where('college_id', cid).where('status', 'ACTIVE').whereRaw('current_stock <= min_threshold')).select('id', 'lab_id', 'name', 'current_stock', 'min_threshold'),
        inScope(db('lab_faults').where('college_id', cid).whereNotIn('status', ['RESOLVED', 'CLOSED'])).select('id', 'lab_id', 'severity', 'status', 'description'),
        inScope(db('lab_repairs').where('college_id', cid).whereNotIn('status', ['COMPLETED', 'CANCELLED'])).select('id', 'lab_id', 'status', 'approval_status'),
        inScope(db('lab_requirements as r').leftJoin('labs as l', 'l.id', 'r.lab_id').where('r.college_id', cid), 'r.lab_id')
            .whereIn('r.status', ['SUBMITTED', 'INCHARGE_APPROVED', 'HOD_APPROVED'])
            .select('r.id', 'r.lab_id', 'l.name as lab_name', 'r.item', 'r.status', 'r.priority', 'r.request_type'),
    ]);
    const perLab = new Map();
    for (const l of labs)
        perLab.set(Number(l.id), { labId: Number(l.id), labName: l.name, departmentId: l.department_id ? Number(l.department_id) : null, departmentName: l.department_name, total: 0, faulty: 0, underRepair: 0, available: 0 });
    for (const a of assets) {
        const p = perLab.get(Number(a.lab_id));
        if (!p)
            continue;
        const c = Number(a.c);
        const s = String(a.operational_status);
        p.total += c;
        if (s === 'FAULTY')
            p.faulty += c;
        else if (s === 'UNDER_REPAIR')
            p.underRepair += c;
        else if (s === 'AVAILABLE' || s === 'IN_USE')
            p.available += c;
    }
    const lowByLab = new Map();
    for (const s of lowStock)
        lowByLab.set(Number(s.lab_id), (lowByLab.get(Number(s.lab_id)) ?? 0) + 1);
    const faultByLab = new Map();
    for (const f of faults)
        faultByLab.set(Number(f.lab_id), (faultByLab.get(Number(f.lab_id)) ?? 0) + 1);
    const labRows = [...perLab.values()].map((p) => ({
        ...p,
        lowStock: lowByLab.get(p.labId) ?? 0,
        openFaults: faultByLab.get(p.labId) ?? 0,
        readinessPct: p.total > 0 ? Math.round((p.available / p.total) * 100) : 100,
    }));
    // Department comparison.
    const deptMap = new Map();
    for (const l of labRows) {
        const key = l.departmentName ?? 'Unassigned';
        if (!deptMap.has(key))
            deptMap.set(key, { department: key, labs: 0, assets: 0, faulty: 0, underRepair: 0, lowStock: 0, openFaults: 0 });
        const d = deptMap.get(key);
        d.labs += 1;
        d.assets += l.total;
        d.faulty += l.faulty;
        d.underRepair += l.underRepair;
        d.lowStock += l.lowStock;
        d.openFaults += l.openFaults;
    }
    return {
        scope: ids === 'ALL' ? 'INSTITUTION' : 'DEPARTMENT',
        summary: {
            labs: labRows.length,
            operationalLabs: labs.filter((l) => l.status === 'ACTIVE').length,
            assets: labRows.reduce((a, b) => a + b.total, 0),
            faulty: labRows.reduce((a, b) => a + b.faulty, 0),
            underRepair: labRows.reduce((a, b) => a + b.underRepair, 0),
            lowStockItems: lowStock.length,
            openFaults: faults.length,
            repairBacklog: repairs.length,
            pendingApprovals: requirements.length,
            avgReadinessPct: labRows.length ? Math.round(labRows.reduce((a, b) => a + b.readinessPct, 0) / labRows.length) : 100,
        },
        departments: [...deptMap.values()],
        labs: labRows,
        faults: faults.slice(0, 25),
        pendingApprovals: requirements.map((r) => ({ id: Number(r.id), labId: Number(r.lab_id), labName: r.lab_name, item: r.item, status: r.status, priority: r.priority, requestType: r.request_type })),
        lowStock: lowStock.map((s) => ({ id: Number(s.id), labId: Number(s.lab_id), name: s.name, currentStock: Number(s.current_stock), minThreshold: Number(s.min_threshold) })),
        generatedAt: today(),
    };
}
function emptySummary() {
    return { labs: 0, operationalLabs: 0, assets: 0, faulty: 0, underRepair: 0, lowStockItems: 0, openFaults: 0, repairBacklog: 0, pendingApprovals: 0, avgReadinessPct: 100 };
}
