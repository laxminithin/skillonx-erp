/**
 * Alumni Impact workspace views (C7) — executive / principal / management /
 * HOD / IQAC / operations analytics. Aggregates C1–C6; does not replace them.
 */
import { AppError } from '../../utils/errors.js';
import { canAccessImpact, canViewExecutiveImpact, isDepartmentScopedImpact, isIqacScoped, } from './accessImpact.js';
import { computeAllMetrics, computeFunnels, departmentBreakdown, trendSeries, } from './impactEngine.js';
import * as impact from './impactService.js';
import { WORKSPACE_VIEWS } from './typesImpact.js';
function assertAccess(actor) {
    if (!canAccessImpact(actor))
        throw new AppError(403, 'Impact access denied');
}
function filtersFromQuery(query, actor) {
    const filters = {
        periodType: query.periodType,
        periodLabel: query.periodLabel ? String(query.periodLabel) : null,
        start: query.start ? String(query.start) : null,
        end: query.end ? String(query.end) : null,
        academicYearId: query.academicYearId ? Number(query.academicYearId) : null,
        departmentId: query.departmentId ? Number(query.departmentId) : null,
        programmeId: query.programmeId ? Number(query.programmeId) : null,
        batch: query.batch ? String(query.batch) : null,
        graduationYear: query.graduationYear ? Number(query.graduationYear) : null,
        impactDomain: query.impactDomain ? String(query.impactDomain) : null,
    };
    if (isDepartmentScopedImpact(actor) && actor.departmentId != null) {
        filters.departmentId = Number(actor.departmentId);
    }
    return filters;
}
function pick(metrics, keys) {
    return keys
        .map((k) => metrics.find((m) => m.metricKey === k))
        .filter(Boolean);
}
function section(title, keys, metrics) {
    return { title, metrics: pick(metrics, keys) };
}
export async function getImpactWorkspace(actor, query = {}) {
    assertAccess(actor);
    await impact.ensureMetricRegistrySeeded(actor.collegeId);
    const view = String(query.view || 'EXECUTIVE').toUpperCase();
    const filters = filtersFromQuery(query, actor);
    const { period, metrics, config } = await computeAllMetrics(actor, filters);
    const base = {
        view,
        views: WORKSPACE_VIEWS,
        period,
        config,
        sourceOfTruth: impact.getSourceOfTruthMatrix(),
        privacyNote: 'Aggregates preferred. Personal drill-down is role-gated; contact/CRM notes never exposed.',
    };
    if (view === 'REGISTRY') {
        return { ...base, registry: impact.getRegistry() };
    }
    if (view === 'FUNNELS') {
        const funnels = await computeFunnels(actor, filters);
        return { ...base, ...funnels };
    }
    if (view === 'TRENDS') {
        const trends = await trendSeries(actor, filters);
        return { ...base, ...trends };
    }
    if (view === 'DEPARTMENT') {
        if (isDepartmentScopedImpact(actor) && !canViewExecutiveImpact(actor)) {
            const deptMetrics = await computeAllMetrics(actor, filters);
            return {
                ...base,
                departmentId: filters.departmentId,
                sections: buildDepartmentSections(deptMetrics.metrics),
                note: 'HOD scope — no cross-department private data.',
            };
        }
        const breakdown = await departmentBreakdown(actor, filters);
        return { ...base, ...breakdown };
    }
    if (view === 'EVIDENCE') {
        const ledger = await impact.listEvidenceLedger(actor, query);
        return { ...base, ...ledger };
    }
    if (view === 'GAPS') {
        const gaps = await impact.analyzeGaps(actor, filters);
        return { ...base, ...gaps };
    }
    if (view === 'ACCREDITATION') {
        const frameworks = await impact.listFrameworks(actor);
        const mappings = await impact.listMappings(actor, query);
        return {
            ...base,
            ...frameworks,
            ...mappings,
            note: 'Accreditation mappings are configurable. No NBA/NAAC criteria are fabricated.',
        };
    }
    if (view === 'REPORTS') {
        const snapshots = await impact.listSnapshots(actor);
        return {
            ...base,
            reportTypes: [
                'ANNUAL_IMPACT',
                'DEPARTMENT',
                'MENTORSHIP',
                'RECRUITMENT_INTERNSHIP',
                'EXPERT_INDUSTRY',
                'RECOGNITION_VALUE',
                'ACCREDITATION_EVIDENCE',
                'DATA_QUALITY',
            ],
            ...snapshots,
        };
    }
    if (view === 'HOD' || (isDepartmentScopedImpact(actor) && view === 'EXECUTIVE')) {
        return {
            ...base,
            view: 'HOD',
            role: 'HOD',
            sections: buildDepartmentSections(metrics),
            note: 'Department-scoped alumni impact. No cross-department private data.',
        };
    }
    if (view === 'IQAC' || isIqacScoped(actor)) {
        return {
            ...base,
            view: 'IQAC',
            sections: [
                section('Alumni engagement indicators', [
                    'engagement.active_alumni',
                    'engagement.repeat_alumni',
                    'engagement.response_rate',
                    'engagement.programs',
                ], metrics),
                section('Student-beneficiary indicators', [
                    'students.unique_benefited',
                    'students.beneficiary_interactions',
                    'mentorship.students_supported',
                    'internship.students_benefited',
                ], metrics),
                section('Industry-connect indicators', [
                    'industry.connections',
                    'experts.sessions_delivered',
                    'recruitment.placements_supported',
                    'research.collaborations',
                    'bos.participation',
                ], metrics),
                section('Data-quality indicators', [
                    'alumni.verified_rate',
                    'alumni.career_coverage',
                    'alumni.contact_coverage',
                    'alumni.profile_stale',
                ], metrics),
            ],
            evidenceReadiness: await impact.analyzeGaps(actor, filters),
            note: 'Uses existing IQAC/NBA roles — no new IQAC portal invented.',
        };
    }
    if (view === 'OPERATIONS') {
        return {
            ...base,
            view: 'OPERATIONS',
            sections: [
                section('Engagement ops', [
                    'engagement.contacted',
                    'engagement.responded',
                    'engagement.open_followups',
                    'engagement.overdue_followups',
                    'engagement.campaigns',
                ], metrics),
                section('Matching / needs', ['needs.open', 'needs.fulfilled', 'students.unique_benefited'], metrics),
                section('Recognition pipeline', ['recognition.alumni_recognised', 'recognition.value_participants'], metrics),
                section('Data refresh', [
                    'alumni.profile_stale',
                    'alumni.identity_unresolved',
                    'alumni.willingness_coverage',
                ], metrics),
            ],
            note: 'Operational analytics — reuse C2–C6 workspaces for transactional work.',
            workspaceLinks: [
                '/alumni-admin/crm',
                '/alumni-admin/engagement',
                '/alumni-admin/matching',
                '/alumni-admin/recognition',
                '/alumni-admin/intelligence',
            ],
        };
    }
    if (view === 'PRINCIPAL') {
        if (!canViewExecutiveImpact(actor) && actor.role !== 'PRINCIPAL' && actor.role !== 'VICE_PRINCIPAL') {
            // still allow if they have impact access — filter already scoped
        }
        return {
            ...base,
            view: 'PRINCIPAL',
            focus: 'Academic / institutional governance',
            sections: buildExecutiveSections(metrics),
            departmentDrilldownAvailable: true,
            note: 'Institution-wide with department/programme drill-down. Evidence access follows RBAC.',
        };
    }
    if (view === 'MANAGEMENT') {
        return {
            ...base,
            view: 'MANAGEMENT',
            sections: buildExecutiveSections(metrics),
            note: 'Institutional outcome summary. Personal CRM notes/contact details are not exposed.',
        };
    }
    // EXECUTIVE default
    if (!canViewExecutiveImpact(actor) && isDepartmentScopedImpact(actor)) {
        return {
            ...base,
            view: 'HOD',
            sections: buildDepartmentSections(metrics),
        };
    }
    return {
        ...base,
        view: 'EXECUTIVE',
        sections: buildExecutiveSections(metrics),
    };
}
function buildExecutiveSections(metrics) {
    return [
        section('A. Alumni Health', [
            'alumni.total',
            'alumni.verified',
            'alumni.reachable',
            'alumni.profile_current',
        ], metrics),
        section('B. Engagement', [
            'engagement.active_alumni',
            'engagement.repeat_alumni',
            'engagement.programs',
            'engagement.response_rate',
        ], metrics),
        section('C. Student Impact', [
            'mentorship.students_supported',
            'internship.positions_enabled',
            'recruitment.placements_supported',
            'projects.supported',
            'students.unique_benefited',
        ], metrics),
        section('D. Academic / Industry Impact', [
            'experts.sessions_delivered',
            'industry.connections',
            'research.collaborations',
            'bos.participation',
            'innovation.startup_support',
        ], metrics),
        section('E. Value & Community', [
            'recognition.alumni_recognised',
            'recognition.value_participants',
            'contribution.non_financial',
            'contribution.financial_refs',
        ], metrics),
        section('F. Need Pipeline', ['needs.open', 'needs.fulfilled'], metrics),
        section('G. Data Quality', [
            'alumni.verified_rate',
            'alumni.career_coverage',
            'alumni.contact_coverage',
            'alumni.profile_stale',
        ], metrics),
    ];
}
function buildDepartmentSections(metrics) {
    return [
        section('Alumni base', ['alumni.total', 'alumni.verified', 'alumni.reachable'], metrics),
        section('Engagement', ['engagement.active_alumni', 'engagement.repeat_alumni'], metrics),
        section('Mentorship', ['mentorship.alumni_mentors', 'mentorship.students_supported'], metrics),
        section('Recruitment & Internship', [
            'recruitment.placements_supported',
            'internship.positions_enabled',
        ], metrics),
        section('Experts & Projects', ['experts.sessions_delivered', 'projects.supported', 'industry.connections'], metrics),
        section('Recognition & Value', ['recognition.alumni_recognised', 'recognition.value_participants'], metrics),
        section('Needs', ['needs.open', 'needs.fulfilled'], metrics),
        section('Students benefited', ['students.unique_benefited'], metrics),
    ];
}
export async function getExecutiveDashboard(actor, query = {}) {
    return getImpactWorkspace(actor, { ...query, view: 'EXECUTIVE' });
}
