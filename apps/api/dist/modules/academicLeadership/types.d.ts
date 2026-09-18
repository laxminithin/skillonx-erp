import { z } from 'zod';
import type { HrActor } from '../hr/types.js';
export declare const LEADERSHIP_ROLES: readonly ["HOD", "PRINCIPAL"];
export type LeadershipRole = (typeof LEADERSHIP_ROLES)[number];
export declare const LEADERSHIP_ASSIGNMENT_STATUSES: readonly ["ACTIVE", "ENDED", "REVOKED"];
export type LeadershipAssignmentStatus = (typeof LEADERSHIP_ASSIGNMENT_STATUSES)[number];
export type AcademicCapability = 'academic.faculty.self' | 'academic.department.view' | 'academic.department.manage' | 'academic.department.faculty.view' | 'academic.department.workload.view' | 'academic.department.timetable.view' | 'academic.department.attendance.view' | 'academic.department.leave.approve' | 'academic.department.performance.view' | 'academic.department.continuity.view' | 'academic.department.allocation.manage' | 'academic.institution.view' | 'academic.institution.departments.view' | 'academic.institution.performance.view' | 'academic.institution.continuity.view' | 'academic.institution.approvals';
export declare const HOD_CAPABILITIES: AcademicCapability[];
export declare const PRINCIPAL_CAPABILITIES: AcademicCapability[];
export declare const MANAGEMENT_CAPABILITIES: AcademicCapability[];
export declare const FACULTY_CAPABILITIES: AcademicCapability[];
export type LeadershipAssignment = {
    id: number;
    collegeId: number;
    employeeId: number;
    role: LeadershipRole;
    departmentId: number | null;
    effectiveFrom: string;
    effectiveTo: string | null;
    status: LeadershipAssignmentStatus;
    remarks: string | null;
    createdBy: number | null;
    updatedBy: number | null;
    createdAt?: unknown;
    updatedAt?: unknown;
    employeeName?: string | null;
    employeeNumber?: string | null;
    departmentName?: string | null;
    departmentCode?: string | null;
};
export type LeadershipContext = {
    employeeId: number | null;
    roles: LeadershipRole[];
    isHod: boolean;
    isPrincipal: boolean;
    hodDepartmentIds: number[];
    assignments: LeadershipAssignment[];
    capabilities: AcademicCapability[];
};
export type LeadershipActor = HrActor & {
    leadershipRoles?: string[];
    hodDepartmentIds?: number[];
};
export declare const createAssignmentSchema: z.ZodObject<{
    employeeId: z.ZodNumber;
    role: z.ZodEnum<["HOD", "PRINCIPAL"]>;
    departmentId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    effectiveFrom: z.ZodString;
    effectiveTo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    remarks: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    effectiveFrom: string;
    employeeId: number;
    role: "HOD" | "PRINCIPAL";
    departmentId?: number | null | undefined;
    remarks?: string | null | undefined;
    effectiveTo?: string | null | undefined;
}, {
    effectiveFrom: string;
    employeeId: number;
    role: "HOD" | "PRINCIPAL";
    departmentId?: number | null | undefined;
    remarks?: string | null | undefined;
    effectiveTo?: string | null | undefined;
}>;
export declare const updateAssignmentSchema: z.ZodObject<{
    effectiveTo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "ENDED", "REVOKED"]>>;
    remarks: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status?: "ACTIVE" | "ENDED" | "REVOKED" | undefined;
    remarks?: string | null | undefined;
    effectiveTo?: string | null | undefined;
}, {
    status?: "ACTIVE" | "ENDED" | "REVOKED" | undefined;
    remarks?: string | null | undefined;
    effectiveTo?: string | null | undefined;
}>;
export declare const assignFacultySchema: z.ZodObject<{
    classId: z.ZodNumber;
    classSubjectId: z.ZodNumber;
    facultyId: z.ZodNumber;
    isPrimary: z.ZodOptional<z.ZodBoolean>;
    canManage: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    classId: number;
    classSubjectId: number;
    facultyId: number;
    isPrimary?: boolean | undefined;
    canManage?: boolean | undefined;
}, {
    classId: number;
    classSubjectId: number;
    facultyId: number;
    isPrimary?: boolean | undefined;
    canManage?: boolean | undefined;
}>;
export declare const FAR_FUTURE = "9999-12-31";
export declare function asDateOnly(value: unknown): string;
export declare function rangesOverlap(aFrom: string, aTo: string | null | undefined, bFrom: string, bTo: string | null | undefined): boolean;
export declare function isEffectiveOn(from: string, to: string | null | undefined, asOf: string): boolean;
