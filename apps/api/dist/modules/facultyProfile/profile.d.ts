import type { EmployeeScope } from './access.js';
import type { FacultyProfileActor, IdentifiersInput } from './types.js';
type Row = Record<string, unknown>;
/** Ensure a faculty_academic_profiles row exists for the employee; returns it. */
export declare function ensureProfile(collegeId: number, employee: EmployeeScope): Promise<Row>;
/**
 * Core profile — HRMS is authoritative for identity/service info (projected
 * read-only); the faculty-maintained layer adds only academic identifiers and
 * the optional photo override.
 */
export declare function coreProfile(collegeId: number, employee: EmployeeScope): Promise<{
    employeeId: number;
    employeeNumber: unknown;
    facultyUserId: number | null;
    fullName: unknown;
    department: {} | null;
    departmentId: number | null;
    designation: {} | null;
    employmentType: {} | null;
    employmentStatus: unknown;
    dateOfJoining: unknown;
    institutionalExperienceYears: number | null;
    officialEmail: {} | null;
    officialPhone: {} | null;
    photoReference: string;
    authoritative: {
        identity: string;
        service: string;
    };
    identifiers: {
        orcid: {} | null;
        googleScholarId: {} | null;
        scopusAuthorId: {} | null;
        wosResearcherId: {} | null;
        vidwanId: {} | null;
        otherResearchId: {} | null;
        verified: boolean;
    };
    notApplicable: Record<string, boolean>;
}>;
export declare function updateIdentifiers(actor: FacultyProfileActor, employee: EmployeeScope, input: IdentifiersInput): Promise<{
    employeeId: number;
    employeeNumber: unknown;
    facultyUserId: number | null;
    fullName: unknown;
    department: {} | null;
    departmentId: number | null;
    designation: {} | null;
    employmentType: {} | null;
    employmentStatus: unknown;
    dateOfJoining: unknown;
    institutionalExperienceYears: number | null;
    officialEmail: {} | null;
    officialPhone: {} | null;
    photoReference: string;
    authoritative: {
        identity: string;
        service: string;
    };
    identifiers: {
        orcid: {} | null;
        googleScholarId: {} | null;
        scopusAuthorId: {} | null;
        wosResearcherId: {} | null;
        vidwanId: {} | null;
        otherResearchId: {} | null;
        verified: boolean;
    };
    notApplicable: Record<string, boolean>;
}>;
export declare function setNotApplicable(actor: FacultyProfileActor, employee: EmployeeScope, section: string, notApplicable: boolean): Promise<Record<string, boolean>>;
/** Academic-year context: current + all labels (spec §B25). */
export declare function academicYears(collegeId: number): Promise<{
    current: {
        id: number;
        label: any;
    } | null;
    all: {
        id: number;
        label: any;
        isCurrent: boolean;
    }[];
}>;
export declare function parseJson<T>(raw: unknown, fallback: T): T;
export {};
