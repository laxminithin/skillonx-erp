import { z } from 'zod';
/**
 * Faculty Academic & Professional Profile — types & domain configuration.
 *
 * The profile is a UNIFIED record engine. Each contribution is a `faculty_records`
 * row tagged with a `domain`. This config drives validation, sectioning,
 * completeness and UI without a bespoke table per domain. Derived domains
 * (teaching, mentoring, coordinator, responsibilities) are projected from the
 * authoritative modules at read time and are NOT writable here.
 */
export type FacultyProfileActor = {
    facultyUserId: number;
    collegeId: number;
    departmentId: number | null;
    role: string;
    name: string;
};
export declare const PROFILE_SECTIONS: readonly ["OVERVIEW", "ACADEMIC", "EXPERIENCE", "TEACHING", "RESEARCH", "PROFESSIONAL_DEVELOPMENT", "STUDENT_GUIDANCE", "INDUSTRY_CONSULTANCY", "INSTITUTIONAL_CONTRIBUTION", "AWARDS_MEMBERSHIPS", "EVIDENCE"];
export type ProfileSection = (typeof PROFILE_SECTIONS)[number];
export declare const VERIFICATION_STATUSES: readonly ["DRAFT", "SUBMITTED", "VERIFIED", "RETURNED", "REJECTED", "NOT_REQUIRED"];
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export declare const VERIFICATION_ACTIONS: readonly ["SUBMIT", "VERIFY", "RETURN", "REJECT", "REOPEN"];
export type VerificationAction = (typeof VERIFICATION_ACTIONS)[number];
export declare const AWARD_LEVELS: readonly ["INSTITUTIONAL", "UNIVERSITY", "STATE", "NATIONAL", "INTERNATIONAL"];
export type DomainConfig = {
    domain: string;
    label: string;
    section: ProfileSection;
    recordTypes: string[];
    /** Whether records in this domain participate in the verification workflow. */
    verifiable: boolean;
    /** Whether evidence is expected for completeness (missing -> EVIDENCE_MISSING). */
    evidenceExpected: boolean;
    /** Whether this domain is derived (read-only projection) rather than faculty-entered. */
    derived?: boolean;
    /** Field in details that carries the dedupe key, if any (also stored in unique_ref). */
    uniqueRefField?: string;
};
export declare const WRITABLE_DOMAINS: Record<string, DomainConfig>;
export declare const DERIVED_DOMAINS: {
    readonly TEACHING: {
        readonly domain: "TEACHING";
        readonly label: "Teaching Assignments";
        readonly section: ProfileSection;
    };
    readonly MENTORING: {
        readonly domain: "MENTORING";
        readonly label: "Mentoring";
        readonly section: ProfileSection;
    };
    readonly COORDINATION: {
        readonly domain: "COORDINATION";
        readonly label: "Class Coordination";
        readonly section: ProfileSection;
    };
    readonly LEADERSHIP: {
        readonly domain: "LEADERSHIP";
        readonly label: "Academic Leadership";
        readonly section: ProfileSection;
    };
};
export declare function domainConfig(domain: string): DomainConfig | null;
export declare function isWritableDomain(domain: string): boolean;
export declare const identifiersSchema: z.ZodObject<{
    orcid: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    googleScholarId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    scopusAuthorId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    wosResearcherId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    vidwanId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    otherResearchId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    photoReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    photoReference?: string | null | undefined;
    orcid?: string | null | undefined;
    googleScholarId?: string | null | undefined;
    scopusAuthorId?: string | null | undefined;
    wosResearcherId?: string | null | undefined;
    vidwanId?: string | null | undefined;
    otherResearchId?: string | null | undefined;
}, {
    photoReference?: string | null | undefined;
    orcid?: string | null | undefined;
    googleScholarId?: string | null | undefined;
    scopusAuthorId?: string | null | undefined;
    wosResearcherId?: string | null | undefined;
    vidwanId?: string | null | undefined;
    otherResearchId?: string | null | undefined;
}>;
export type IdentifiersInput = z.infer<typeof identifiersSchema>;
export declare const notApplicableSchema: z.ZodObject<{
    section: z.ZodEnum<["OVERVIEW", "ACADEMIC", "EXPERIENCE", "TEACHING", "RESEARCH", "PROFESSIONAL_DEVELOPMENT", "STUDENT_GUIDANCE", "INDUSTRY_CONSULTANCY", "INSTITUTIONAL_CONTRIBUTION", "AWARDS_MEMBERSHIPS", "EVIDENCE"]>;
    notApplicable: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    section: "ACADEMIC" | "RESEARCH" | "EXPERIENCE" | "OVERVIEW" | "TEACHING" | "PROFESSIONAL_DEVELOPMENT" | "STUDENT_GUIDANCE" | "INDUSTRY_CONSULTANCY" | "INSTITUTIONAL_CONTRIBUTION" | "AWARDS_MEMBERSHIPS" | "EVIDENCE";
    notApplicable: boolean;
}, {
    section: "ACADEMIC" | "RESEARCH" | "EXPERIENCE" | "OVERVIEW" | "TEACHING" | "PROFESSIONAL_DEVELOPMENT" | "STUDENT_GUIDANCE" | "INDUSTRY_CONSULTANCY" | "INSTITUTIONAL_CONTRIBUTION" | "AWARDS_MEMBERSHIPS" | "EVIDENCE";
    notApplicable: boolean;
}>;
export declare const recordCreateSchema: z.ZodObject<{
    domain: z.ZodEffects<z.ZodString, string, string>;
    recordType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    title: z.ZodString;
    academicYearId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    academicYearLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    startDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    endDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isCurrent: z.ZodOptional<z.ZodBoolean>;
    category: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    level: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    roleLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    details: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    domain: string;
    status?: string | null | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    level?: string | null | undefined;
    category?: string | null | undefined;
    academicYearId?: number | null | undefined;
    isCurrent?: boolean | undefined;
    academicYearLabel?: string | null | undefined;
    details?: Record<string, unknown> | null | undefined;
    recordType?: string | null | undefined;
    roleLabel?: string | null | undefined;
}, {
    title: string;
    domain: string;
    status?: string | null | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    level?: string | null | undefined;
    category?: string | null | undefined;
    academicYearId?: number | null | undefined;
    isCurrent?: boolean | undefined;
    academicYearLabel?: string | null | undefined;
    details?: Record<string, unknown> | null | undefined;
    recordType?: string | null | undefined;
    roleLabel?: string | null | undefined;
}>;
export type RecordCreateInput = z.infer<typeof recordCreateSchema>;
export declare const recordUpdateSchema: z.ZodObject<Omit<{
    domain: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    recordType: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    title: z.ZodOptional<z.ZodString>;
    academicYearId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    academicYearLabel: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    startDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    endDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    isCurrent: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    category: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    level: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    status: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    roleLabel: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    details: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>>;
}, "domain">, "strip", z.ZodTypeAny, {
    status?: string | null | undefined;
    title?: string | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    level?: string | null | undefined;
    category?: string | null | undefined;
    academicYearId?: number | null | undefined;
    isCurrent?: boolean | undefined;
    academicYearLabel?: string | null | undefined;
    details?: Record<string, unknown> | null | undefined;
    recordType?: string | null | undefined;
    roleLabel?: string | null | undefined;
}, {
    status?: string | null | undefined;
    title?: string | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    level?: string | null | undefined;
    category?: string | null | undefined;
    academicYearId?: number | null | undefined;
    isCurrent?: boolean | undefined;
    academicYearLabel?: string | null | undefined;
    details?: Record<string, unknown> | null | undefined;
    recordType?: string | null | undefined;
    roleLabel?: string | null | undefined;
}>;
export declare const evidenceMetaSchema: z.ZodObject<{
    fileName: z.ZodString;
    mimeType: z.ZodString;
    fileSize: z.ZodNumber;
    contentBase64: z.ZodString;
    evidenceCategory: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    evidenceSubcategory: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    reference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    fileName: string;
    mimeType: string;
    contentBase64: string;
    fileSize: number;
    reference?: string | null | undefined;
    description?: string | null | undefined;
    evidenceCategory?: string | null | undefined;
    evidenceSubcategory?: string | null | undefined;
}, {
    fileName: string;
    mimeType: string;
    contentBase64: string;
    fileSize: number;
    reference?: string | null | undefined;
    description?: string | null | undefined;
    evidenceCategory?: string | null | undefined;
    evidenceSubcategory?: string | null | undefined;
}>;
export declare const verificationActionSchema: z.ZodObject<{
    action: z.ZodEnum<["VERIFY", "RETURN", "REJECT"]>;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    action: "RETURN" | "REJECT" | "VERIFY";
    remarks?: string | null | undefined;
}, {
    action: "RETURN" | "REJECT" | "VERIFY";
    remarks?: string | null | undefined;
}>;
export declare const ALLOWED_EVIDENCE_MIME: Set<string>;
