import type { AlumniAdminActor } from './service.js';
import { type ImpactFilters } from './impactEngine.js';
import { criterionCreateSchema, frameworkCreateSchema, mappingCreateSchema, mappingVerifySchema, reportBuildSchema, snapshotCreateSchema } from './typesImpact.js';
import { z } from 'zod';
export declare function assertAccess(actor: AlumniAdminActor): void;
export declare function assertOperate(actor: AlumniAdminActor): void;
export declare function getSourceOfTruthMatrix(): {
    matrix: readonly [{
        readonly capability: "Alumni identity / verification / contact / freshness";
        readonly authoritative: "C1 alumni_profiles + provenance";
        readonly c7Role: "PROJECT";
        readonly notes: "Health metrics only; incomplete ≠ inactive";
    }, {
        readonly capability: "Career / employment / entrepreneurship";
        readonly authoritative: "C1 alumni_employment / higher_studies / entrepreneurship";
        readonly c7Role: "PROJECT";
        readonly notes: "Coverage metrics; not impact";
    }, {
        readonly capability: "CRM relationships / meaningful engagement";
        readonly authoritative: "C2 alumni_relationships + interactions";
        readonly c7Role: "PROJECT";
        readonly notes: "Meaningful engagement definition versioned";
    }, {
        readonly capability: "Verified outcomes";
        readonly authoritative: "C2 alumni_crm_outcomes VERIFIED";
        readonly c7Role: "PRIMARY IMPACT SOURCE";
        readonly notes: "Attribution levels required";
    }, {
        readonly capability: "Engagement programs / campaigns / funnels";
        readonly authoritative: "C4";
        readonly c7Role: "PROJECT";
        readonly notes: "Targeting ≠ engagement";
    }, {
        readonly capability: "Connect needs / fulfilment / beneficiaries";
        readonly authoritative: "C5";
        readonly c7Role: "PROJECT";
        readonly notes: "Promised ≠ verified; need-to-impact funnel";
    }, {
        readonly capability: "Recognition / value / communities";
        readonly authoritative: "C6";
        readonly c7Role: "PROJECT";
        readonly notes: "Alumni→Institution vs Institution→Alumni separate; no reciprocity score";
    }, {
        readonly capability: "Institutional placement rate";
        readonly authoritative: "placement/analytics";
        readonly c7Role: "REFERENCE ONLY";
        readonly notes: "Never fork placement %";
    }, {
        readonly capability: "Mentoring coverage (institutional)";
        readonly authoritative: "mentoring module";
        readonly c7Role: "REFERENCE ONLY";
        readonly notes: "No alumni_profile FK; alumni mentorship from C2/C5";
    }, {
        readonly capability: "Finance fee collection";
        readonly authoritative: "finance/reports";
        readonly c7Role: "REFERENCE ONLY";
        readonly notes: "Alumni financial contribution only via authoritative refs";
    }, {
        readonly capability: "Student projects";
        readonly authoritative: "placement student_projects";
        readonly c7Role: "REFERENCE";
        readonly notes: "Do not duplicate project rows";
    }, {
        readonly capability: "Research / BoS / Startup ERP modules";
        readonly authoritative: "NONE";
        readonly c7Role: "LIMITATION";
        readonly notes: "Only verified C2/C5 evidence";
    }, {
        readonly capability: "NBA/NAAC criterion catalogue";
        readonly authoritative: "Configurable C7 frameworks";
        readonly c7Role: "OWN (empty until configured)";
        readonly notes: "Zero fabrication of criterion numbers";
    }, {
        readonly capability: "Academic year masters";
        readonly authoritative: "academic_years";
        readonly c7Role: "REUSE";
        readonly notes: "Default reporting uses is_current";
    }, {
        readonly capability: "Department / programme masters";
        readonly authoritative: "departments / programs";
        readonly c7Role: "REUSE";
        readonly notes: "No shadow tables";
    }, {
        readonly capability: "Management executive KPIs";
        readonly authoritative: "management/overview";
        readonly c7Role: "LINK / NEW KEYS ONLY";
        readonly notes: "Do not redefine student/faculty/fee KPIs";
    }, {
        readonly capability: "IQAC / NBA roles";
        readonly authoritative: "FACULTY_ROLES";
        readonly c7Role: "REUSE ACCESS";
        readonly notes: "No new IQAC portal/role";
    }, {
        readonly capability: "Metric definitions / versions";
        readonly authoritative: "C7 METRIC_REGISTRY + alumni_impact_metric_defs";
        readonly c7Role: "OWN";
        readonly notes: "Never silently redefine history";
    }, {
        readonly capability: "Evidence ledger";
        readonly authoritative: "C7 projection of C1–C6";
        readonly c7Role: "OWN (projection)";
        readonly notes: "Prefer reference over copy";
    }, {
        readonly capability: "Report snapshots";
        readonly authoritative: "C7 alumni_impact_report_snapshots";
        readonly c7Role: "OWN";
        readonly notes: "Immutable historical definitions";
    }];
    forbiddenClaims: readonly ["placement_caused_by_alumnus_without_evidence", "invented_nba_naac_criteria", "invented_research_publications", "invented_bos_participation", "invented_startup_funding", "invented_mou", "monetary_value_of_non_financial", "reciprocity_score", "best_department_leaderboard", "activity_as_impact", "promised_as_verified_outcome", "associated_reported_as_direct"];
    knownLimitations: readonly ["No dedicated Research module — research metrics only from verified C2/C5.", "No dedicated BoS module — BoS metrics only from verified C2/C5.", "No dedicated Startup module — no funding/investment estimates.", "No hard-coded NBA/NAAC criterion numbers — frameworks are institution-configured.", "Institutional mentoring module has no alumni_profile FK — alumni mentorship from C2/C5.", "Institutional placement % remains placement/analytics SoT — C7 reports ALUMNI_SUPPORTED only.", "C4 external channels remain MANUAL_ONLY/UNAVAILABLE (inherited from C4/C6).", "No VIEWED participation telemetry (C6).", "No LinkedIn/social enrichment (C6).", "PDF export not guaranteed — CSV/JSON via existing patterns."];
    principle: string;
};
export declare function audit(input: {
    collegeId: number;
    actorFacultyId?: number | null;
    action: string;
    entityType?: string | null;
    entityId?: number | null;
    metadata?: unknown;
}): Promise<void>;
export declare function requireTables(): Promise<void>;
export declare function ensureMetricRegistrySeeded(collegeId: number): Promise<{
    seeded: number;
}>;
export declare function getRegistry(): {
    metrics: {
        definitionVersion: number;
        metricKey: string;
        name: string;
        description: string;
        impactDomain: import("./typesImpact.js").ImpactDomain;
        calculationType: typeof import("./typesImpact.js").CALCULATION_TYPES[number];
        numeratorDefinition?: string | null;
        denominatorDefinition?: string | null;
        unit: typeof import("./typesImpact.js").METRIC_UNITS[number];
        sourceModules: string[];
        evidenceRequirements: string;
        supportedDimensions: string[];
        freshnessExpectations: string;
        version: number;
        activeFrom: string;
    }[];
    versioningNote: string;
};
export declare function getMetrics(actor: AlumniAdminActor, filters?: ImpactFilters): Promise<{
    period: import("./typesImpact.js").ImpactPeriod;
    metrics: import("./typesImpact.js").MetricResult[];
    config: Awaited<ReturnType<(collegeId: number) => Promise<{
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    }>>>;
}>;
export declare function getDrilldown(actor: AlumniAdminActor, metricKey: string, filters?: ImpactFilters): Promise<{
    error: string;
    metricKey: string;
    definition?: undefined;
    period?: undefined;
    count?: undefined;
    attributionNote?: undefined;
    privacy?: undefined;
    rows?: undefined;
    correctionHint?: undefined;
} | {
    metricKey: string;
    definition: import("./typesImpact.js").MetricDefinitionSeed;
    period: import("./typesImpact.js").ImpactPeriod;
    count: number;
    attributionNote: string;
    privacy: {
        suppressed: boolean;
        reason: string;
    } | {
        suppressed: boolean;
        reason?: undefined;
    };
    rows: any[];
    correctionHint: string;
    error?: undefined;
}>;
/** Project C2 verified outcomes (+ C5/C6) into the evidence ledger without duplicating SoT. */
export declare function syncEvidenceLedger(actor: AlumniAdminActor, filters?: ImpactFilters): Promise<{
    inserted: number;
    skipped: number;
    period: import("./typesImpact.js").ImpactPeriod;
}>;
export declare function listEvidenceLedger(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    items: {
        id: number;
        impactDomain: any;
        metricKey: any;
        sourceType: any;
        sourceReference: any;
        evidenceReference: any;
        departmentId: number | null;
        academicYear: any;
        eventDate: any;
        verificationStatus: any;
        attributionLevel: any;
        alumniProfileId: number | null;
        alumniName: any;
        quantity: number | null;
        notes: any;
    }[];
    note: string;
}>;
export declare function analyzeGaps(actor: AlumniAdminActor, filters?: ImpactFilters): Promise<{
    period: import("./typesImpact.js").ImpactPeriod;
    gapCount: number;
    byType: Record<string, number>;
    gaps: {
        gapType: string;
        severity: "INFO" | "WARN" | "HIGH";
        sourceType: string;
        sourceReference: string;
        detail: string;
        metricKey?: string | null;
    }[];
    note: string;
}>;
export declare function listFrameworks(actor: AlumniAdminActor): Promise<{
    frameworks: {
        id: number;
        code: any;
        label: any;
        description: any;
        isActive: boolean;
    }[];
    note: string;
}>;
export declare function createFramework(actor: AlumniAdminActor, body: z.infer<typeof frameworkCreateSchema>): Promise<{
    framework: {
        code: string;
        label: string;
        description?: string | null | undefined;
        id: number;
    };
}>;
export declare function createCriterion(actor: AlumniAdminActor, body: z.infer<typeof criterionCreateSchema>): Promise<{
    criterion: {
        code: string;
        label: string;
        frameworkId: number;
        description?: string | null | undefined;
        sortOrder?: number | undefined;
        parentCode?: string | null | undefined;
        id: number;
    };
}>;
export declare function listCriteria(actor: AlumniAdminActor, frameworkId: number): Promise<{
    criteria: {
        id: number;
        frameworkId: number;
        code: any;
        label: any;
        parentCode: any;
        description: any;
        sortOrder: number;
    }[];
}>;
export declare function createMapping(actor: AlumniAdminActor, body: z.infer<typeof mappingCreateSchema>): Promise<{
    mapping: {
        verificationStatus: string;
        criterionId: number;
        frameworkId: number;
        notes?: string | null | undefined;
        academicYear?: string | null | undefined;
        outcomeType?: string | null | undefined;
        impactDomain?: "OTHER" | "INTERNSHIP" | "ENGAGEMENT" | "COMMUNITY" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "PROJECT_SUPPORT" | "RECOGNITION" | "RESEARCH_COLLABORATION" | "INDUSTRY_CONNECT" | "CAREER_GUIDANCE" | "ALUMNI_BASE" | "DATA_QUALITY" | "EXPERT_ENGAGEMENT" | "INNOVATION_STARTUP" | "BOS_CURRICULUM" | "INSTITUTIONAL_COLLABORATION" | "ALUMNI_VALUE" | "STUDENT_IMPACT" | "DEPARTMENT_IMPACT" | null | undefined;
        metricKey?: string | null | undefined;
        evidenceReferences?: string[] | undefined;
        id: number;
    };
}>;
export declare function verifyMapping(actor: AlumniAdminActor, mappingId: number, body: z.infer<typeof mappingVerifySchema>): Promise<{
    ok: boolean;
    id: number;
    verificationStatus: "DRAFT" | "ACTIVE" | "ARCHIVED" | "VERIFIED";
}>;
export declare function listMappings(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    mappings: {
        id: number;
        frameworkId: number;
        frameworkCode: any;
        frameworkLabel: any;
        criterionId: number;
        criterionCode: any;
        criterionLabel: any;
        metricKey: any;
        impactDomain: any;
        outcomeType: any;
        academicYear: any;
        evidenceReferences: any;
        notes: any;
        verificationStatus: any;
    }[];
}>;
export declare function buildEvidencePack(actor: AlumniAdminActor, body: z.infer<typeof reportBuildSchema>): Promise<{
    pack: {
        institutionCollegeId: number;
        departmentId: number | null;
        programmeId: number | null;
        academicYear: string | null;
        period: import("./typesImpact.js").ImpactPeriod;
        reportType: "CUSTOM" | "DEPARTMENT" | "MENTORSHIP" | "DATA_QUALITY" | "ANNUAL_IMPACT" | "RECRUITMENT_INTERNSHIP" | "EXPERT_INDUSTRY" | "RECOGNITION_VALUE" | "ACCREDITATION_EVIDENCE";
        metrics: {
            metricKey: string;
            name: string;
            version: number;
            definition: string;
            value: number | null;
            numerator: number | null;
            denominator: number | null;
            unit: string;
            sourceModules: string[];
            attributionDefault: "UNKNOWN" | "DIRECT" | "SUPPORTED" | "ASSOCIATED";
            dataQualityNote: string | null | undefined;
        }[];
        evidenceReferences: {
            id: number;
            impactDomain: any;
            metricKey: any;
            sourceType: any;
            sourceReference: any;
            evidenceReference: any;
            departmentId: number | null;
            academicYear: any;
            eventDate: any;
            verificationStatus: any;
            attributionLevel: any;
            alumniProfileId: number | null;
            alumniName: any;
            quantity: number | null;
            notes: any;
        }[];
        gaps: Record<string, number>;
        generatedAt: string;
        generatedBy: {
            facultyUserId: number;
            role: string;
            name: string;
        };
        limitations: readonly ["No dedicated Research module — research metrics only from verified C2/C5.", "No dedicated BoS module — BoS metrics only from verified C2/C5.", "No dedicated Startup module — no funding/investment estimates.", "No hard-coded NBA/NAAC criterion numbers — frameworks are institution-configured.", "Institutional mentoring module has no alumni_profile FK — alumni mentorship from C2/C5.", "Institutional placement % remains placement/analytics SoT — C7 reports ALUMNI_SUPPORTED only.", "C4 external channels remain MANUAL_ONLY/UNAVAILABLE (inherited from C4/C6).", "No VIEWED participation telemetry (C6).", "No LinkedIn/social enrichment (C6).", "PDF export not guaranteed — CSV/JSON via existing patterns."];
        fabricationNote: string;
    };
    snapshotId: number | null;
}>;
export declare function buildReport(actor: AlumniAdminActor, body: z.infer<typeof reportBuildSchema>): Promise<{
    report: {
        title: string;
        reportType: "CUSTOM" | "DEPARTMENT" | "MENTORSHIP" | "DATA_QUALITY" | "ANNUAL_IMPACT" | "RECRUITMENT_INTERNSHIP" | "EXPERT_INDUSTRY" | "RECOGNITION_VALUE" | "ACCREDITATION_EVIDENCE";
        period: import("./typesImpact.js").ImpactPeriod;
        filters: ImpactFilters;
        metrics: import("./typesImpact.js").MetricResult[];
        config: {
            smallCohortThreshold: number;
            engagementLookbackMonths: number;
        };
        generatedAt: string;
        generatedBy: {
            facultyUserId: number;
            role: string;
        };
        metricVersions: {
            metricKey: string;
            version: number;
        }[];
    };
    snapshotId: number | null;
}>;
export declare function createSnapshot(actor: AlumniAdminActor, body: z.infer<typeof snapshotCreateSchema>): Promise<{
    snapshot: {
        id: number;
        title: string;
        reportType: "CUSTOM" | "DEPARTMENT" | "MENTORSHIP" | "DATA_QUALITY" | "ANNUAL_IMPACT" | "RECRUITMENT_INTERNSHIP" | "EXPERT_INDUSTRY" | "RECOGNITION_VALUE" | "ACCREDITATION_EVIDENCE";
        period: import("./typesImpact.js").ImpactPeriod;
        immutable: boolean;
        note: string;
    };
}>;
export declare function getSnapshot(actor: AlumniAdminActor, id: number): Promise<{
    snapshot: {
        id: number;
        reportType: any;
        title: any;
        periodType: any;
        periodLabel: any;
        periodStart: any;
        periodEnd: any;
        periodComplete: boolean;
        filters: any;
        metricDefs: any;
        results: any;
        evidenceRefs: any;
        dataQuality: any;
        status: any;
        generatedBy: number | null;
        generatedAt: string | null;
        immutable: boolean;
    };
}>;
export declare function listSnapshots(actor: AlumniAdminActor): Promise<{
    snapshots: {
        id: number;
        reportType: any;
        title: any;
        periodLabel: any;
        periodComplete: boolean;
        generatedAt: string | null;
        status: any;
    }[];
}>;
export declare function exportReportCsv(actor: AlumniAdminActor, body: z.infer<typeof reportBuildSchema>): Promise<{
    filename: string;
    contentType: string;
    csv: string;
    period: import("./typesImpact.js").ImpactPeriod;
    generatedAt: string;
}>;
