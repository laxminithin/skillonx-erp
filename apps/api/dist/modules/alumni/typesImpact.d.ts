/**
 * Alumni Institutional Impact & Accreditation Analytics (C7) — types & registry.
 *
 * Zero fabrication: no hard-coded NBA/NAAC criterion numbers.
 * Activity ≠ engagement ≠ opportunity ≠ outcome ≠ impact without evidence.
 */
import { z } from 'zod';
export declare const IMPACT_DOMAINS: readonly ["ALUMNI_BASE", "DATA_QUALITY", "ENGAGEMENT", "MENTORSHIP", "CAREER_GUIDANCE", "RECRUITMENT", "INTERNSHIP", "EXPERT_ENGAGEMENT", "PROJECT_SUPPORT", "INDUSTRY_CONNECT", "RESEARCH_COLLABORATION", "INNOVATION_STARTUP", "BOS_CURRICULUM", "INSTITUTIONAL_COLLABORATION", "COMMUNITY", "RECOGNITION", "ALUMNI_VALUE", "CONTRIBUTION", "STUDENT_IMPACT", "DEPARTMENT_IMPACT", "OTHER"];
export type ImpactDomain = (typeof IMPACT_DOMAINS)[number];
export declare const CALCULATION_TYPES: readonly ["COUNT", "RATE", "UNIQUE_COUNT", "SUM", "FUNNEL_STAGE", "RATIO"];
export declare const METRIC_UNITS: readonly ["count", "percent", "ratio", "hours", "currency_ref"];
export declare const ATTRIBUTION_LEVELS: readonly ["DIRECT", "SUPPORTED", "ASSOCIATED", "UNKNOWN"];
export type AttributionLevel = (typeof ATTRIBUTION_LEVELS)[number];
export declare const PERIOD_TYPES: readonly ["ACADEMIC_YEAR", "CALENDAR_YEAR", "SEMESTER", "CUSTOM"];
export type PeriodType = (typeof PERIOD_TYPES)[number];
export declare const EVIDENCE_SOURCE_TYPES: readonly ["C1_PROFILE", "C2_OUTCOME", "C2_INTERACTION", "C4_CAMPAIGN", "C5_NEED", "C5_FULFILMENT", "C6_RECOGNITION", "C6_VALUE", "C6_COMMUNITY", "FINANCE_REF", "PLACEMENT_REF", "STUDENT_PROJECT", "OTHER"];
export declare const LEDGER_VERIFICATION: readonly ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED", "PROJECTED"];
export declare const GAP_TYPES: readonly ["OUTCOME_WITHOUT_EVIDENCE", "EVIDENCE_UNVERIFIED", "MISSING_BENEFICIARY_LINK", "MISSING_DEPARTMENT_LINK", "STALE_PROFILE_DEPENDENCY", "ATTRIBUTION_UNKNOWN", "METRIC_SOURCE_INCOMPLETE"];
export declare const REPORT_TYPES: readonly ["ANNUAL_IMPACT", "DEPARTMENT", "MENTORSHIP", "RECRUITMENT_INTERNSHIP", "EXPERT_INDUSTRY", "RECOGNITION_VALUE", "ACCREDITATION_EVIDENCE", "DATA_QUALITY", "CUSTOM"];
export declare const WORKSPACE_VIEWS: readonly ["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"];
export declare const SUPPORTED_DIMENSIONS: readonly ["institution", "department", "programme", "batch", "graduation_year"];
/**
 * Meaningful engagement (v1): at least one CRM interaction flagged
 * is_meaningful_engagement=true, OR relationship.last_engagement_at within
 * lookback, OR verified CRM outcome in period.
 * Explicitly EXCLUDES: system notifications, profile page views, campaign targeting alone.
 */
export declare const MEANINGFUL_ENGAGEMENT_DEFINITION_V1 = "At least one CRM interaction with is_meaningful_engagement=true OR relationship last_engagement_at within lookback months OR a verified CRM outcome in the reporting period. Excludes system notifications, profile views, and campaign targeting alone.";
export type MetricDefinitionSeed = {
    metricKey: string;
    name: string;
    description: string;
    impactDomain: ImpactDomain;
    calculationType: (typeof CALCULATION_TYPES)[number];
    numeratorDefinition?: string | null;
    denominatorDefinition?: string | null;
    unit: (typeof METRIC_UNITS)[number];
    sourceModules: string[];
    evidenceRequirements: string;
    supportedDimensions: string[];
    freshnessExpectations: string;
    version: number;
    activeFrom: string;
};
/** Central metric registry — do not scatter KPI definitions in UI. */
export declare const METRIC_REGISTRY: MetricDefinitionSeed[];
export declare const SOURCE_OF_TRUTH_MATRIX: readonly [{
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
export declare const FORBIDDEN_IMPACT_CLAIMS: readonly ["placement_caused_by_alumnus_without_evidence", "invented_nba_naac_criteria", "invented_research_publications", "invented_bos_participation", "invented_startup_funding", "invented_mou", "monetary_value_of_non_financial", "reciprocity_score", "best_department_leaderboard", "activity_as_impact", "promised_as_verified_outcome", "associated_reported_as_direct"];
export declare const KNOWN_LIMITATIONS: readonly ["No dedicated Research module — research metrics only from verified C2/C5.", "No dedicated BoS module — BoS metrics only from verified C2/C5.", "No dedicated Startup module — no funding/investment estimates.", "No hard-coded NBA/NAAC criterion numbers — frameworks are institution-configured.", "Institutional mentoring module has no alumni_profile FK — alumni mentorship from C2/C5.", "Institutional placement % remains placement/analytics SoT — C7 reports ALUMNI_SUPPORTED only.", "C4 external channels remain MANUAL_ONLY/UNAVAILABLE (inherited from C4/C6).", "No VIEWED participation telemetry (C6).", "No LinkedIn/social enrichment (C6).", "PDF export not guaranteed — CSV/JSON via existing patterns."];
export type ImpactPeriod = {
    periodType: PeriodType;
    periodLabel: string | null;
    start: string | null;
    end: string | null;
    complete: boolean;
    academicYearId?: number | null;
    academicYearLabel?: string | null;
    coverageNote?: string | null;
};
export type MetricResult = {
    metricKey: string;
    name: string;
    version: number;
    impactDomain: ImpactDomain;
    value: number | null;
    numerator: number | null;
    denominator: number | null;
    unit: string;
    definition: string;
    sourceModules: string[];
    attributionDefault: AttributionLevel;
    period: ImpactPeriod;
    noData?: boolean;
    dataQualityNote?: string | null;
    drilldownKey?: string | null;
};
export declare const periodQuerySchema: z.ZodObject<{
    periodType: z.ZodOptional<z.ZodEnum<["ACADEMIC_YEAR", "CALENDAR_YEAR", "SEMESTER", "CUSTOM"]>>;
    periodLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    start: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    end: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    academicYearId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    programmeId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    batch: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    graduationYear: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    impactDomain: z.ZodNullable<z.ZodOptional<z.ZodEnum<["ALUMNI_BASE", "DATA_QUALITY", "ENGAGEMENT", "MENTORSHIP", "CAREER_GUIDANCE", "RECRUITMENT", "INTERNSHIP", "EXPERT_ENGAGEMENT", "PROJECT_SUPPORT", "INDUSTRY_CONNECT", "RESEARCH_COLLABORATION", "INNOVATION_STARTUP", "BOS_CURRICULUM", "INSTITUTIONAL_COLLABORATION", "COMMUNITY", "RECOGNITION", "ALUMNI_VALUE", "CONTRIBUTION", "STUDENT_IMPACT", "DEPARTMENT_IMPACT", "OTHER"]>>>;
    metricKey: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    view: z.ZodOptional<z.ZodEnum<["EXECUTIVE", "PRINCIPAL", "MANAGEMENT", "HOD", "OPERATIONS", "IQAC", "DEPARTMENT", "TRENDS", "FUNNELS", "EVIDENCE", "GAPS", "ACCREDITATION", "REPORTS", "REGISTRY"]>>;
}, "strict", z.ZodTypeAny, {
    end?: string | null | undefined;
    departmentId?: number | null | undefined;
    academicYearId?: number | null | undefined;
    view?: "HOD" | "PRINCIPAL" | "MANAGEMENT" | "REPORTS" | "EXECUTIVE" | "DEPARTMENT" | "EVIDENCE" | "ACCREDITATION" | "IQAC" | "OPERATIONS" | "TRENDS" | "FUNNELS" | "GAPS" | "REGISTRY" | undefined;
    periodType?: "CUSTOM" | "SEMESTER" | "ACADEMIC_YEAR" | "CALENDAR_YEAR" | undefined;
    periodLabel?: string | null | undefined;
    graduationYear?: number | null | undefined;
    programmeId?: number | null | undefined;
    batch?: string | null | undefined;
    start?: string | null | undefined;
    impactDomain?: "OTHER" | "INTERNSHIP" | "ENGAGEMENT" | "COMMUNITY" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "PROJECT_SUPPORT" | "RECOGNITION" | "RESEARCH_COLLABORATION" | "INDUSTRY_CONNECT" | "CAREER_GUIDANCE" | "ALUMNI_BASE" | "DATA_QUALITY" | "EXPERT_ENGAGEMENT" | "INNOVATION_STARTUP" | "BOS_CURRICULUM" | "INSTITUTIONAL_COLLABORATION" | "ALUMNI_VALUE" | "STUDENT_IMPACT" | "DEPARTMENT_IMPACT" | null | undefined;
    metricKey?: string | null | undefined;
}, {
    end?: string | null | undefined;
    departmentId?: number | null | undefined;
    academicYearId?: number | null | undefined;
    view?: "HOD" | "PRINCIPAL" | "MANAGEMENT" | "REPORTS" | "EXECUTIVE" | "DEPARTMENT" | "EVIDENCE" | "ACCREDITATION" | "IQAC" | "OPERATIONS" | "TRENDS" | "FUNNELS" | "GAPS" | "REGISTRY" | undefined;
    periodType?: "CUSTOM" | "SEMESTER" | "ACADEMIC_YEAR" | "CALENDAR_YEAR" | undefined;
    periodLabel?: string | null | undefined;
    graduationYear?: number | null | undefined;
    programmeId?: number | null | undefined;
    batch?: string | null | undefined;
    start?: string | null | undefined;
    impactDomain?: "OTHER" | "INTERNSHIP" | "ENGAGEMENT" | "COMMUNITY" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "PROJECT_SUPPORT" | "RECOGNITION" | "RESEARCH_COLLABORATION" | "INDUSTRY_CONNECT" | "CAREER_GUIDANCE" | "ALUMNI_BASE" | "DATA_QUALITY" | "EXPERT_ENGAGEMENT" | "INNOVATION_STARTUP" | "BOS_CURRICULUM" | "INSTITUTIONAL_COLLABORATION" | "ALUMNI_VALUE" | "STUDENT_IMPACT" | "DEPARTMENT_IMPACT" | null | undefined;
    metricKey?: string | null | undefined;
}>;
export declare const frameworkCreateSchema: z.ZodObject<{
    code: z.ZodString;
    label: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    code: string;
    label: string;
    description?: string | null | undefined;
}, {
    code: string;
    label: string;
    description?: string | null | undefined;
}>;
export declare const criterionCreateSchema: z.ZodObject<{
    frameworkId: z.ZodNumber;
    code: z.ZodString;
    label: z.ZodString;
    parentCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    code: string;
    label: string;
    frameworkId: number;
    description?: string | null | undefined;
    sortOrder?: number | undefined;
    parentCode?: string | null | undefined;
}, {
    code: string;
    label: string;
    frameworkId: number;
    description?: string | null | undefined;
    sortOrder?: number | undefined;
    parentCode?: string | null | undefined;
}>;
export declare const mappingCreateSchema: z.ZodObject<{
    frameworkId: z.ZodNumber;
    criterionId: z.ZodNumber;
    metricKey: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    impactDomain: z.ZodNullable<z.ZodOptional<z.ZodEnum<["ALUMNI_BASE", "DATA_QUALITY", "ENGAGEMENT", "MENTORSHIP", "CAREER_GUIDANCE", "RECRUITMENT", "INTERNSHIP", "EXPERT_ENGAGEMENT", "PROJECT_SUPPORT", "INDUSTRY_CONNECT", "RESEARCH_COLLABORATION", "INNOVATION_STARTUP", "BOS_CURRICULUM", "INSTITUTIONAL_COLLABORATION", "COMMUNITY", "RECOGNITION", "ALUMNI_VALUE", "CONTRIBUTION", "STUDENT_IMPACT", "DEPARTMENT_IMPACT", "OTHER"]>>>;
    outcomeType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    academicYear: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    evidenceReferences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    criterionId: number;
    frameworkId: number;
    notes?: string | null | undefined;
    academicYear?: string | null | undefined;
    outcomeType?: string | null | undefined;
    impactDomain?: "OTHER" | "INTERNSHIP" | "ENGAGEMENT" | "COMMUNITY" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "PROJECT_SUPPORT" | "RECOGNITION" | "RESEARCH_COLLABORATION" | "INDUSTRY_CONNECT" | "CAREER_GUIDANCE" | "ALUMNI_BASE" | "DATA_QUALITY" | "EXPERT_ENGAGEMENT" | "INNOVATION_STARTUP" | "BOS_CURRICULUM" | "INSTITUTIONAL_COLLABORATION" | "ALUMNI_VALUE" | "STUDENT_IMPACT" | "DEPARTMENT_IMPACT" | null | undefined;
    metricKey?: string | null | undefined;
    evidenceReferences?: string[] | undefined;
}, {
    criterionId: number;
    frameworkId: number;
    notes?: string | null | undefined;
    academicYear?: string | null | undefined;
    outcomeType?: string | null | undefined;
    impactDomain?: "OTHER" | "INTERNSHIP" | "ENGAGEMENT" | "COMMUNITY" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "PROJECT_SUPPORT" | "RECOGNITION" | "RESEARCH_COLLABORATION" | "INDUSTRY_CONNECT" | "CAREER_GUIDANCE" | "ALUMNI_BASE" | "DATA_QUALITY" | "EXPERT_ENGAGEMENT" | "INNOVATION_STARTUP" | "BOS_CURRICULUM" | "INSTITUTIONAL_COLLABORATION" | "ALUMNI_VALUE" | "STUDENT_IMPACT" | "DEPARTMENT_IMPACT" | null | undefined;
    metricKey?: string | null | undefined;
    evidenceReferences?: string[] | undefined;
}>;
export declare const mappingVerifySchema: z.ZodObject<{
    verificationStatus: z.ZodEnum<["DRAFT", "ACTIVE", "VERIFIED", "ARCHIVED"]>;
}, "strict", z.ZodTypeAny, {
    verificationStatus: "DRAFT" | "ACTIVE" | "ARCHIVED" | "VERIFIED";
}, {
    verificationStatus: "DRAFT" | "ACTIVE" | "ARCHIVED" | "VERIFIED";
}>;
export declare const snapshotCreateSchema: z.ZodObject<{
    reportType: z.ZodEnum<["ANNUAL_IMPACT", "DEPARTMENT", "MENTORSHIP", "RECRUITMENT_INTERNSHIP", "EXPERT_INDUSTRY", "RECOGNITION_VALUE", "ACCREDITATION_EVIDENCE", "DATA_QUALITY", "CUSTOM"]>;
    title: z.ZodString;
    periodType: z.ZodOptional<z.ZodEnum<["ACADEMIC_YEAR", "CALENDAR_YEAR", "SEMESTER", "CUSTOM"]>>;
    periodLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    start: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    end: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    programmeId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    batch: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    graduationYear: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    impactDomain: z.ZodNullable<z.ZodOptional<z.ZodEnum<["ALUMNI_BASE", "DATA_QUALITY", "ENGAGEMENT", "MENTORSHIP", "CAREER_GUIDANCE", "RECRUITMENT", "INTERNSHIP", "EXPERT_ENGAGEMENT", "PROJECT_SUPPORT", "INDUSTRY_CONNECT", "RESEARCH_COLLABORATION", "INNOVATION_STARTUP", "BOS_CURRICULUM", "INSTITUTIONAL_COLLABORATION", "COMMUNITY", "RECOGNITION", "ALUMNI_VALUE", "CONTRIBUTION", "STUDENT_IMPACT", "DEPARTMENT_IMPACT", "OTHER"]>>>;
    metricKeys: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    title: string;
    reportType: "CUSTOM" | "DEPARTMENT" | "MENTORSHIP" | "DATA_QUALITY" | "ANNUAL_IMPACT" | "RECRUITMENT_INTERNSHIP" | "EXPERT_INDUSTRY" | "RECOGNITION_VALUE" | "ACCREDITATION_EVIDENCE";
    end?: string | null | undefined;
    departmentId?: number | null | undefined;
    periodType?: "CUSTOM" | "SEMESTER" | "ACADEMIC_YEAR" | "CALENDAR_YEAR" | undefined;
    periodLabel?: string | null | undefined;
    graduationYear?: number | null | undefined;
    programmeId?: number | null | undefined;
    batch?: string | null | undefined;
    start?: string | null | undefined;
    impactDomain?: "OTHER" | "INTERNSHIP" | "ENGAGEMENT" | "COMMUNITY" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "PROJECT_SUPPORT" | "RECOGNITION" | "RESEARCH_COLLABORATION" | "INDUSTRY_CONNECT" | "CAREER_GUIDANCE" | "ALUMNI_BASE" | "DATA_QUALITY" | "EXPERT_ENGAGEMENT" | "INNOVATION_STARTUP" | "BOS_CURRICULUM" | "INSTITUTIONAL_COLLABORATION" | "ALUMNI_VALUE" | "STUDENT_IMPACT" | "DEPARTMENT_IMPACT" | null | undefined;
    metricKeys?: string[] | undefined;
}, {
    title: string;
    reportType: "CUSTOM" | "DEPARTMENT" | "MENTORSHIP" | "DATA_QUALITY" | "ANNUAL_IMPACT" | "RECRUITMENT_INTERNSHIP" | "EXPERT_INDUSTRY" | "RECOGNITION_VALUE" | "ACCREDITATION_EVIDENCE";
    end?: string | null | undefined;
    departmentId?: number | null | undefined;
    periodType?: "CUSTOM" | "SEMESTER" | "ACADEMIC_YEAR" | "CALENDAR_YEAR" | undefined;
    periodLabel?: string | null | undefined;
    graduationYear?: number | null | undefined;
    programmeId?: number | null | undefined;
    batch?: string | null | undefined;
    start?: string | null | undefined;
    impactDomain?: "OTHER" | "INTERNSHIP" | "ENGAGEMENT" | "COMMUNITY" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "PROJECT_SUPPORT" | "RECOGNITION" | "RESEARCH_COLLABORATION" | "INDUSTRY_CONNECT" | "CAREER_GUIDANCE" | "ALUMNI_BASE" | "DATA_QUALITY" | "EXPERT_ENGAGEMENT" | "INNOVATION_STARTUP" | "BOS_CURRICULUM" | "INSTITUTIONAL_COLLABORATION" | "ALUMNI_VALUE" | "STUDENT_IMPACT" | "DEPARTMENT_IMPACT" | null | undefined;
    metricKeys?: string[] | undefined;
}>;
export declare const reportBuildSchema: z.ZodObject<{
    reportType: z.ZodEnum<["ANNUAL_IMPACT", "DEPARTMENT", "MENTORSHIP", "RECRUITMENT_INTERNSHIP", "EXPERT_INDUSTRY", "RECOGNITION_VALUE", "ACCREDITATION_EVIDENCE", "DATA_QUALITY", "CUSTOM"]>;
    periodType: z.ZodOptional<z.ZodEnum<["ACADEMIC_YEAR", "CALENDAR_YEAR", "SEMESTER", "CUSTOM"]>>;
    periodLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    start: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    end: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    academicYearId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    programmeId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    batch: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    graduationYear: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    impactDomain: z.ZodNullable<z.ZodOptional<z.ZodEnum<["ALUMNI_BASE", "DATA_QUALITY", "ENGAGEMENT", "MENTORSHIP", "CAREER_GUIDANCE", "RECRUITMENT", "INTERNSHIP", "EXPERT_ENGAGEMENT", "PROJECT_SUPPORT", "INDUSTRY_CONNECT", "RESEARCH_COLLABORATION", "INNOVATION_STARTUP", "BOS_CURRICULUM", "INSTITUTIONAL_COLLABORATION", "COMMUNITY", "RECOGNITION", "ALUMNI_VALUE", "CONTRIBUTION", "STUDENT_IMPACT", "DEPARTMENT_IMPACT", "OTHER"]>>>;
    createSnapshot: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    reportType: "CUSTOM" | "DEPARTMENT" | "MENTORSHIP" | "DATA_QUALITY" | "ANNUAL_IMPACT" | "RECRUITMENT_INTERNSHIP" | "EXPERT_INDUSTRY" | "RECOGNITION_VALUE" | "ACCREDITATION_EVIDENCE";
    end?: string | null | undefined;
    departmentId?: number | null | undefined;
    academicYearId?: number | null | undefined;
    periodType?: "CUSTOM" | "SEMESTER" | "ACADEMIC_YEAR" | "CALENDAR_YEAR" | undefined;
    periodLabel?: string | null | undefined;
    graduationYear?: number | null | undefined;
    programmeId?: number | null | undefined;
    batch?: string | null | undefined;
    start?: string | null | undefined;
    impactDomain?: "OTHER" | "INTERNSHIP" | "ENGAGEMENT" | "COMMUNITY" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "PROJECT_SUPPORT" | "RECOGNITION" | "RESEARCH_COLLABORATION" | "INDUSTRY_CONNECT" | "CAREER_GUIDANCE" | "ALUMNI_BASE" | "DATA_QUALITY" | "EXPERT_ENGAGEMENT" | "INNOVATION_STARTUP" | "BOS_CURRICULUM" | "INSTITUTIONAL_COLLABORATION" | "ALUMNI_VALUE" | "STUDENT_IMPACT" | "DEPARTMENT_IMPACT" | null | undefined;
    createSnapshot?: boolean | undefined;
}, {
    reportType: "CUSTOM" | "DEPARTMENT" | "MENTORSHIP" | "DATA_QUALITY" | "ANNUAL_IMPACT" | "RECRUITMENT_INTERNSHIP" | "EXPERT_INDUSTRY" | "RECOGNITION_VALUE" | "ACCREDITATION_EVIDENCE";
    end?: string | null | undefined;
    departmentId?: number | null | undefined;
    academicYearId?: number | null | undefined;
    periodType?: "CUSTOM" | "SEMESTER" | "ACADEMIC_YEAR" | "CALENDAR_YEAR" | undefined;
    periodLabel?: string | null | undefined;
    graduationYear?: number | null | undefined;
    programmeId?: number | null | undefined;
    batch?: string | null | undefined;
    start?: string | null | undefined;
    impactDomain?: "OTHER" | "INTERNSHIP" | "ENGAGEMENT" | "COMMUNITY" | "RECRUITMENT" | "MENTORSHIP" | "CONTRIBUTION" | "PROJECT_SUPPORT" | "RECOGNITION" | "RESEARCH_COLLABORATION" | "INDUSTRY_CONNECT" | "CAREER_GUIDANCE" | "ALUMNI_BASE" | "DATA_QUALITY" | "EXPERT_ENGAGEMENT" | "INNOVATION_STARTUP" | "BOS_CURRICULUM" | "INSTITUTIONAL_COLLABORATION" | "ALUMNI_VALUE" | "STUDENT_IMPACT" | "DEPARTMENT_IMPACT" | null | undefined;
    createSnapshot?: boolean | undefined;
}>;
