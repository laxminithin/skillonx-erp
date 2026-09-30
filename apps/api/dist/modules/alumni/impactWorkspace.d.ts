import type { AlumniAdminActor } from './service.js';
import { type MetricResult } from './typesImpact.js';
export declare function getImpactWorkspace(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    registry: {
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
    view: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    note: string;
    engagementFunnel: {
        stage: string;
        value: number;
        note: string;
    }[];
    programFunnel: {
        stage: string;
        value: number;
    }[];
    needFunnel: {
        stage: string;
        value: number;
    }[];
    view: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    series: {
        academicYearId: number;
        label: any;
        isCurrent: boolean;
        periodComplete: boolean;
        coverageNote: string | null | undefined;
        metrics: {
            metricKey: string;
            value: number | null;
            numerator: number | null;
            denominator: number | null;
            version: number;
        }[];
    }[];
    note: string;
    view: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    departmentId: number | null | undefined;
    sections: {
        title: string;
        metrics: MetricResult[];
    }[];
    note: string;
    view: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    period: import("./typesImpact.js").ImpactPeriod;
    departments: {
        departmentId: number;
        departmentName: any;
        departmentCode: any;
        metrics: MetricResult[];
    }[];
    truncated: boolean;
    note: string;
    view: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
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
    view: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
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
    view: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    note: string;
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
    frameworks: {
        id: number;
        code: any;
        label: any;
        description: any;
        isActive: boolean;
    }[];
    view: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    snapshots: {
        id: number;
        reportType: any;
        title: any;
        periodLabel: any;
        periodComplete: boolean;
        generatedAt: string | null;
        status: any;
    }[];
    reportTypes: string[];
    view: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    view: string;
    role: string;
    sections: {
        title: string;
        metrics: MetricResult[];
    }[];
    note: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    view: string;
    sections: {
        title: string;
        metrics: MetricResult[];
    }[];
    evidenceReadiness: {
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
    };
    note: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    view: string;
    sections: {
        title: string;
        metrics: MetricResult[];
    }[];
    note: string;
    workspaceLinks: string[];
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    view: string;
    focus: string;
    sections: {
        title: string;
        metrics: MetricResult[];
    }[];
    departmentDrilldownAvailable: boolean;
    note: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    view: string;
    sections: {
        title: string;
        metrics: MetricResult[];
    }[];
    note: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    view: string;
    sections: {
        title: string;
        metrics: MetricResult[];
    }[];
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
}>;
export declare function getExecutiveDashboard(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    registry: {
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
    view: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    note: string;
    engagementFunnel: {
        stage: string;
        value: number;
        note: string;
    }[];
    programFunnel: {
        stage: string;
        value: number;
    }[];
    needFunnel: {
        stage: string;
        value: number;
    }[];
    view: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    series: {
        academicYearId: number;
        label: any;
        isCurrent: boolean;
        periodComplete: boolean;
        coverageNote: string | null | undefined;
        metrics: {
            metricKey: string;
            value: number | null;
            numerator: number | null;
            denominator: number | null;
            version: number;
        }[];
    }[];
    note: string;
    view: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    departmentId: number | null | undefined;
    sections: {
        title: string;
        metrics: MetricResult[];
    }[];
    note: string;
    view: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    period: import("./typesImpact.js").ImpactPeriod;
    departments: {
        departmentId: number;
        departmentName: any;
        departmentCode: any;
        metrics: MetricResult[];
    }[];
    truncated: boolean;
    note: string;
    view: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
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
    view: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
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
    view: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    note: string;
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
    frameworks: {
        id: number;
        code: any;
        label: any;
        description: any;
        isActive: boolean;
    }[];
    view: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    snapshots: {
        id: number;
        reportType: any;
        title: any;
        periodLabel: any;
        periodComplete: boolean;
        generatedAt: string | null;
        status: any;
    }[];
    reportTypes: string[];
    view: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    view: string;
    role: string;
    sections: {
        title: string;
        metrics: MetricResult[];
    }[];
    note: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    view: string;
    sections: {
        title: string;
        metrics: MetricResult[];
    }[];
    evidenceReadiness: {
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
    };
    note: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    view: string;
    sections: {
        title: string;
        metrics: MetricResult[];
    }[];
    note: string;
    workspaceLinks: string[];
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    view: string;
    focus: string;
    sections: {
        title: string;
        metrics: MetricResult[];
    }[];
    departmentDrilldownAvailable: boolean;
    note: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    view: string;
    sections: {
        title: string;
        metrics: MetricResult[];
    }[];
    note: string;
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
} | {
    view: string;
    sections: {
        title: string;
        metrics: MetricResult[];
    }[];
    views: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
    period: import("./typesImpact.js").ImpactPeriod;
    config: {
        smallCohortThreshold: number;
        engagementLookbackMonths: number;
    };
    sourceOfTruth: {
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
    privacyNote: string;
}>;
