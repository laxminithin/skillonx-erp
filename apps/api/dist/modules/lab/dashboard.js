import { db } from '../../db/index.js';
import { assertLabPermission, scopedLabIds } from './access.js';
import { upcomingSessions } from './sessions.js';
function today() { return new Date().toISOString().slice(0, 10); }
/**
 * Single aggregated operational dashboard. All counts are batched grouped
 * queries (never per-asset loops) and the independent queries run in parallel.
 */
export async function labAssistantDashboard(actor) {
    assertLabPermission(actor, 'lab.view');
    const ids = await scopedLabIds(actor);
    const cid = actor.collegeId;
    const scoped = ids === 'ALL' ? null : ids;
    if (scoped && scoped.length === 0) {
        return emptyDashboard();
    }
    const inScope = (q, col = 'lab_id') => scoped ? q.whereIn(col, scoped) : q;
    const [labs, assetByStatus, lowStock, overdue, awaitingReturn, openFaults, pendingRepairs, pendingSwReqs, pendingRequirements, sessions, recent,] = await Promise.all([
        inScope(db('labs').where('college_id', cid).where('status', 'ACTIVE'), 'id').select('id', 'name'),
        inScope(db('lab_assets').where('college_id', cid)).select('lab_id', 'operational_status').count({ c: 'id' }).groupBy('lab_id', 'operational_status'),
        inScope(db('lab_stock_items').where('college_id', cid).where('status', 'ACTIVE').whereRaw('current_stock <= min_threshold')).select('id', 'lab_id', 'name', 'current_stock', 'min_threshold', 'unit'),
        inScope(db('lab_issues').where('college_id', cid).where('status', 'ISSUED').whereNotNull('expected_return').where('expected_return', '<', today())).select('id', 'lab_id', 'description', 'asset_id', 'expected_return', 'recipient_type'),
        inScope(db('lab_issues').where('college_id', cid).where('status', 'ISSUED')).count({ c: 'id' }),
        inScope(db('lab_faults').where('college_id', cid).whereNotIn('status', ['RESOLVED', 'CLOSED'])).select('id', 'lab_id', 'description', 'severity', 'status'),
        inScope(db('lab_repairs').where('college_id', cid).where('approval_status', 'PENDING')).count({ c: 'id' }),
        inScope(db('lab_software_requests').where('college_id', cid).whereIn('status', ['REQUESTED', 'UNDER_REVIEW'])).count({ c: 'id' }),
        inScope(db('lab_requirements').where('college_id', cid).whereIn('status', ['SUBMITTED', 'INCHARGE_APPROVED', 'HOD_APPROVED'])).count({ c: 'id' }),
        upcomingSessions(actor, 7),
        inScope(db('lab_audit_log').where('college_id', cid)).select('action', 'entity_type', 'entity_id', 'created_at').orderBy('created_at', 'desc').limit(15).catch(() => []),
    ]);
    // Aggregate asset health per status.
    const health = { active: 0, available: 0, inUse: 0, faulty: 0, underRepair: 0, reserved: 0, retired: 0, lost: 0 };
    const perLab = new Map();
    for (const r of assetByStatus) {
        const c = Number(r.c);
        const s = String(r.operational_status);
        const lab = Number(r.lab_id);
        if (!perLab.has(lab))
            perLab.set(lab, { available: 0, total: 0, faulty: 0, underRepair: 0 });
        const p = perLab.get(lab);
        p.total += c;
        if (s === 'AVAILABLE') {
            health.available += c;
            p.available += c;
        }
        else if (s === 'IN_USE') {
            health.inUse += c;
            p.available += c;
        }
        else if (s === 'FAULTY') {
            health.faulty += c;
            p.faulty += c;
        }
        else if (s === 'UNDER_REPAIR') {
            health.underRepair += c;
            p.underRepair += c;
        }
        else if (s === 'RESERVED')
            health.reserved += c;
        else if (s === 'RETIRED')
            health.retired += c;
        else if (s === 'LOST')
            health.lost += c;
        if (!['RETIRED', 'LOST'].includes(s))
            health.active += c;
    }
    const todayStr = today();
    const todaySessions = sessions.filter((s) => s.sessionDate === todayStr);
    const notReady = sessions.filter((s) => s.readinessStatus !== 'READY' && s.readinessStatus !== 'COMPLETED');
    const labHealth = labs.map((l) => {
        const p = perLab.get(Number(l.id)) ?? { available: 0, total: 0, faulty: 0, underRepair: 0 };
        const readiness = p.total > 0 ? Math.round((p.available / p.total) * 100) : 100;
        return { labId: Number(l.id), labName: l.name, ...p, readinessPct: readiness };
    });
    return {
        summary: {
            labs: labs.length,
            activeAssets: health.active,
            faultyAssets: health.faulty,
            underRepair: health.underRepair,
            lowStockItems: lowStock.length,
            overdueItems: overdue.length,
            itemsAwaitingReturn: Number(awaitingReturn[0]?.c ?? 0),
            openFaults: openFaults.length,
            pendingRepairs: Number(pendingRepairs[0]?.c ?? 0),
            pendingSoftwareRequests: Number(pendingSwReqs[0]?.c ?? 0),
            pendingRequirements: Number(pendingRequirements[0]?.c ?? 0),
            sessionsNeedingPrep: notReady.length,
            readinessPct: labHealth.length ? Math.round(labHealth.reduce((a, b) => a + b.readinessPct, 0) / labHealth.length) : 100,
        },
        actionRequired: {
            faultyAssets: openFaults.slice(0, 10),
            overdueItems: overdue.slice(0, 10),
            lowStock: lowStock.map((s) => ({ id: Number(s.id), labId: Number(s.lab_id), name: s.name, currentStock: Number(s.current_stock), minThreshold: Number(s.min_threshold), unit: s.unit })).slice(0, 10),
            sessionsNeedingPrep: notReady.slice(0, 10),
        },
        todaySessions,
        upcomingSessions: sessions.slice(0, 20),
        health,
        labHealth,
        recentActivity: recent.map((r) => ({ action: r.action, entityType: r.entity_type, entityId: r.entity_id, at: r.created_at })),
    };
}
function emptyDashboard() {
    return {
        summary: { labs: 0, activeAssets: 0, faultyAssets: 0, underRepair: 0, lowStockItems: 0, overdueItems: 0, itemsAwaitingReturn: 0, openFaults: 0, pendingRepairs: 0, pendingSoftwareRequests: 0, pendingRequirements: 0, sessionsNeedingPrep: 0, readinessPct: 100 },
        actionRequired: { faultyAssets: [], overdueItems: [], lowStock: [], sessionsNeedingPrep: [] },
        todaySessions: [], upcomingSessions: [], health: { active: 0, available: 0, inUse: 0, faulty: 0, underRepair: 0, reserved: 0, retired: 0, lost: 0 }, labHealth: [], recentActivity: [],
    };
}
