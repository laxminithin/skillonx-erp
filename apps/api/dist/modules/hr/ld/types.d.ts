/**
 * Employee L&D — constants, state machines and validation schemas.
 */
import { z } from 'zod';
export declare const DEV_NEED_STATUSES: readonly ["IDENTIFIED", "PLANNED", "IN_PROGRESS", "COMPLETED", "WAIVED", "CANCELLED"];
export declare const DEV_NEED_TRANSITIONS: Record<string, string[]>;
export declare const PROGRAM_STATUSES: readonly ["DRAFT", "PUBLISHED", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "IN_PROGRESS", "COMPLETED", "CLOSED", "CANCELLED"];
export declare const PROGRAM_TRANSITIONS: Record<string, string[]>;
/** Statuses in which enrollment/nomination is permitted. */
export declare const PROGRAM_ENROLLABLE: readonly ["REGISTRATION_OPEN"];
export declare const NOMINATION_STATUSES: readonly ["SUBMITTED", "MANAGER_APPROVED", "APPROVED", "REJECTED", "WITHDRAWN", "CONVERTED"];
export declare const ENROLLMENT_STATUSES: readonly ["CONFIRMED", "WAITLISTED", "CANCELLED", "DROPPED"];
export declare const LD_ATTENDANCE_STATUSES: readonly ["PRESENT", "ABSENT", "EXCUSED", "NOT_REQUIRED"];
export declare const DELIVERY_MODES: readonly ["IN_PERSON", "ONLINE", "HYBRID", "SELF_PACED"];
export declare const APPLICABILITY_TYPES: readonly ["ALL", "FACULTY", "NON_FACULTY", "DEPARTMENT", "DESIGNATION", "EMPLOYMENT_TYPE", "SPECIFIC"];
export declare const DEV_NEED_SOURCES: readonly ["APPRAISAL", "SELF", "MANAGER", "HR", "INSTITUTIONAL", "ROLE", "COMPLIANCE"];
export declare const CATEGORIES: readonly ["TECHNICAL", "PEDAGOGY", "RESEARCH", "LEADERSHIP", "COMPLIANCE", "COMMUNICATION", "MANAGEMENT", "DIGITAL", "DOMAIN", "INSTITUTIONAL", "OTHER"];
export declare function canTransition(map: Record<string, string[]>, from: string, to: string): boolean;
export declare const providerSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["INTERNAL", "EXTERNAL"]>>;
    contact: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    website: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type: "INTERNAL" | "EXTERNAL";
    name: string;
    website?: string | null | undefined;
    contact?: string | null | undefined;
}, {
    name: string;
    type?: "INTERNAL" | "EXTERNAL" | undefined;
    website?: string | null | undefined;
    contact?: string | null | undefined;
}>;
export declare const courseSchema: z.ZodObject<{
    code: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    category: z.ZodDefault<z.ZodEnum<["TECHNICAL", "PEDAGOGY", "RESEARCH", "LEADERSHIP", "COMPLIANCE", "COMMUNICATION", "MANAGEMENT", "DIGITAL", "DOMAIN", "INSTITUTIONAL", "OTHER"]>>;
    providerType: z.ZodDefault<z.ZodEnum<["INTERNAL", "EXTERNAL"]>>;
    defaultDeliveryMode: z.ZodDefault<z.ZodEnum<["IN_PERSON", "ONLINE", "HYBRID", "SELF_PACED"]>>;
    durationHours: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    learningObjectives: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    targetAudience: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    skillTags: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>;
    validityMonths: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    isMandatoryDefault: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code: string;
    title: string;
    category: "MANAGEMENT" | "OTHER" | "TECHNICAL" | "COMMUNICATION" | "DOMAIN" | "RESEARCH" | "INSTITUTIONAL" | "COMPLIANCE" | "PEDAGOGY" | "LEADERSHIP" | "DIGITAL";
    providerType: "INTERNAL" | "EXTERNAL";
    defaultDeliveryMode: "ONLINE" | "HYBRID" | "IN_PERSON" | "SELF_PACED";
    description?: string | null | undefined;
    durationHours?: number | null | undefined;
    learningObjectives?: string | null | undefined;
    targetAudience?: string | null | undefined;
    skillTags?: string[] | null | undefined;
    validityMonths?: number | null | undefined;
    isMandatoryDefault?: boolean | undefined;
}, {
    code: string;
    title: string;
    description?: string | null | undefined;
    category?: "MANAGEMENT" | "OTHER" | "TECHNICAL" | "COMMUNICATION" | "DOMAIN" | "RESEARCH" | "INSTITUTIONAL" | "COMPLIANCE" | "PEDAGOGY" | "LEADERSHIP" | "DIGITAL" | undefined;
    durationHours?: number | null | undefined;
    providerType?: "INTERNAL" | "EXTERNAL" | undefined;
    defaultDeliveryMode?: "ONLINE" | "HYBRID" | "IN_PERSON" | "SELF_PACED" | undefined;
    learningObjectives?: string | null | undefined;
    targetAudience?: string | null | undefined;
    skillTags?: string[] | null | undefined;
    validityMonths?: number | null | undefined;
    isMandatoryDefault?: boolean | undefined;
}>;
export declare const courseUpdateSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    category: z.ZodOptional<z.ZodDefault<z.ZodEnum<["TECHNICAL", "PEDAGOGY", "RESEARCH", "LEADERSHIP", "COMPLIANCE", "COMMUNICATION", "MANAGEMENT", "DIGITAL", "DOMAIN", "INSTITUTIONAL", "OTHER"]>>>;
    providerType: z.ZodOptional<z.ZodDefault<z.ZodEnum<["INTERNAL", "EXTERNAL"]>>>;
    defaultDeliveryMode: z.ZodOptional<z.ZodDefault<z.ZodEnum<["IN_PERSON", "ONLINE", "HYBRID", "SELF_PACED"]>>>;
    durationHours: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    learningObjectives: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    targetAudience: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    skillTags: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString, "many">>>>;
    validityMonths: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    isMandatoryDefault: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    title?: string | undefined;
    description?: string | null | undefined;
    category?: "MANAGEMENT" | "OTHER" | "TECHNICAL" | "COMMUNICATION" | "DOMAIN" | "RESEARCH" | "INSTITUTIONAL" | "COMPLIANCE" | "PEDAGOGY" | "LEADERSHIP" | "DIGITAL" | undefined;
    durationHours?: number | null | undefined;
    providerType?: "INTERNAL" | "EXTERNAL" | undefined;
    defaultDeliveryMode?: "ONLINE" | "HYBRID" | "IN_PERSON" | "SELF_PACED" | undefined;
    learningObjectives?: string | null | undefined;
    targetAudience?: string | null | undefined;
    skillTags?: string[] | null | undefined;
    validityMonths?: number | null | undefined;
    isMandatoryDefault?: boolean | undefined;
}, {
    code?: string | undefined;
    title?: string | undefined;
    description?: string | null | undefined;
    category?: "MANAGEMENT" | "OTHER" | "TECHNICAL" | "COMMUNICATION" | "DOMAIN" | "RESEARCH" | "INSTITUTIONAL" | "COMPLIANCE" | "PEDAGOGY" | "LEADERSHIP" | "DIGITAL" | undefined;
    durationHours?: number | null | undefined;
    providerType?: "INTERNAL" | "EXTERNAL" | undefined;
    defaultDeliveryMode?: "ONLINE" | "HYBRID" | "IN_PERSON" | "SELF_PACED" | undefined;
    learningObjectives?: string | null | undefined;
    targetAudience?: string | null | undefined;
    skillTags?: string[] | null | undefined;
    validityMonths?: number | null | undefined;
    isMandatoryDefault?: boolean | undefined;
}>;
export declare const programSchema: z.ZodObject<{
    courseId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    providerId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    code: z.ZodString;
    title: z.ZodString;
    providerType: z.ZodDefault<z.ZodEnum<["INTERNAL", "EXTERNAL"]>>;
    trainerEmployeeId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    externalTrainerName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    deliveryMode: z.ZodDefault<z.ZodEnum<["IN_PERSON", "ONLINE", "HYBRID", "SELF_PACED"]>>;
    startDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    endDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    venue: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    link: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    durationHours: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    capacity: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    registrationOpensAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    registrationClosesAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    applicabilityType: z.ZodDefault<z.ZodEnum<["ALL", "FACULTY", "NON_FACULTY", "DEPARTMENT", "DESIGNATION", "EMPLOYMENT_TYPE", "SPECIFIC"]>>;
    applicabilityRef: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        departmentIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        designationIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        employmentTypeIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        employeeIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "strip", z.ZodTypeAny, {
        departmentIds?: number[] | undefined;
        employeeIds?: number[] | undefined;
        designationIds?: number[] | undefined;
        employmentTypeIds?: number[] | undefined;
    }, {
        departmentIds?: number[] | undefined;
        employeeIds?: number[] | undefined;
        designationIds?: number[] | undefined;
        employmentTypeIds?: number[] | undefined;
    }>>>;
    isMandatory: z.ZodOptional<z.ZodBoolean>;
    mandatoryDueDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    cost: z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNumber>>>;
    completionRule: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        attendanceThreshold: z.ZodOptional<z.ZodNumber>;
        requireAssessment: z.ZodOptional<z.ZodBoolean>;
        assessmentPassMark: z.ZodOptional<z.ZodNumber>;
        requireMandatorySessions: z.ZodOptional<z.ZodBoolean>;
        requireTrainerConfirmation: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        attendanceThreshold?: number | undefined;
        requireAssessment?: boolean | undefined;
        assessmentPassMark?: number | undefined;
        requireMandatorySessions?: boolean | undefined;
        requireTrainerConfirmation?: boolean | undefined;
    }, {
        attendanceThreshold?: number | undefined;
        requireAssessment?: boolean | undefined;
        assessmentPassMark?: number | undefined;
        requireMandatorySessions?: boolean | undefined;
        requireTrainerConfirmation?: boolean | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    title: string;
    providerType: "INTERNAL" | "EXTERNAL";
    deliveryMode: "ONLINE" | "HYBRID" | "IN_PERSON" | "SELF_PACED";
    applicabilityType: "FACULTY" | "ALL" | "DEPARTMENT" | "NON_FACULTY" | "DESIGNATION" | "EMPLOYMENT_TYPE" | "SPECIFIC";
    link?: string | null | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    isMandatory?: boolean | undefined;
    capacity?: number | null | undefined;
    courseId?: number | null | undefined;
    durationHours?: number | null | undefined;
    venue?: string | null | undefined;
    cost?: Record<string, number> | null | undefined;
    providerId?: number | null | undefined;
    trainerEmployeeId?: number | null | undefined;
    externalTrainerName?: string | null | undefined;
    registrationOpensAt?: string | null | undefined;
    registrationClosesAt?: string | null | undefined;
    applicabilityRef?: {
        departmentIds?: number[] | undefined;
        employeeIds?: number[] | undefined;
        designationIds?: number[] | undefined;
        employmentTypeIds?: number[] | undefined;
    } | null | undefined;
    mandatoryDueDate?: string | null | undefined;
    completionRule?: {
        attendanceThreshold?: number | undefined;
        requireAssessment?: boolean | undefined;
        assessmentPassMark?: number | undefined;
        requireMandatorySessions?: boolean | undefined;
        requireTrainerConfirmation?: boolean | undefined;
    } | null | undefined;
}, {
    code: string;
    title: string;
    link?: string | null | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    isMandatory?: boolean | undefined;
    capacity?: number | null | undefined;
    courseId?: number | null | undefined;
    durationHours?: number | null | undefined;
    providerType?: "INTERNAL" | "EXTERNAL" | undefined;
    deliveryMode?: "ONLINE" | "HYBRID" | "IN_PERSON" | "SELF_PACED" | undefined;
    venue?: string | null | undefined;
    cost?: Record<string, number> | null | undefined;
    providerId?: number | null | undefined;
    trainerEmployeeId?: number | null | undefined;
    externalTrainerName?: string | null | undefined;
    registrationOpensAt?: string | null | undefined;
    registrationClosesAt?: string | null | undefined;
    applicabilityType?: "FACULTY" | "ALL" | "DEPARTMENT" | "NON_FACULTY" | "DESIGNATION" | "EMPLOYMENT_TYPE" | "SPECIFIC" | undefined;
    applicabilityRef?: {
        departmentIds?: number[] | undefined;
        employeeIds?: number[] | undefined;
        designationIds?: number[] | undefined;
        employmentTypeIds?: number[] | undefined;
    } | null | undefined;
    mandatoryDueDate?: string | null | undefined;
    completionRule?: {
        attendanceThreshold?: number | undefined;
        requireAssessment?: boolean | undefined;
        assessmentPassMark?: number | undefined;
        requireMandatorySessions?: boolean | undefined;
        requireTrainerConfirmation?: boolean | undefined;
    } | null | undefined;
}>;
export declare const programUpdateSchema: z.ZodObject<{
    courseId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    providerId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    code: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    providerType: z.ZodOptional<z.ZodDefault<z.ZodEnum<["INTERNAL", "EXTERNAL"]>>>;
    trainerEmployeeId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    externalTrainerName: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    deliveryMode: z.ZodOptional<z.ZodDefault<z.ZodEnum<["IN_PERSON", "ONLINE", "HYBRID", "SELF_PACED"]>>>;
    startDate: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    endDate: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    venue: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    link: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    durationHours: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    capacity: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    registrationOpensAt: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    registrationClosesAt: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    applicabilityType: z.ZodOptional<z.ZodDefault<z.ZodEnum<["ALL", "FACULTY", "NON_FACULTY", "DEPARTMENT", "DESIGNATION", "EMPLOYMENT_TYPE", "SPECIFIC"]>>>;
    applicabilityRef: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodObject<{
        departmentIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        designationIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        employmentTypeIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        employeeIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "strip", z.ZodTypeAny, {
        departmentIds?: number[] | undefined;
        employeeIds?: number[] | undefined;
        designationIds?: number[] | undefined;
        employmentTypeIds?: number[] | undefined;
    }, {
        departmentIds?: number[] | undefined;
        employeeIds?: number[] | undefined;
        designationIds?: number[] | undefined;
        employmentTypeIds?: number[] | undefined;
    }>>>>;
    isMandatory: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    mandatoryDueDate: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    cost: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodNumber>>>>;
    completionRule: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodObject<{
        attendanceThreshold: z.ZodOptional<z.ZodNumber>;
        requireAssessment: z.ZodOptional<z.ZodBoolean>;
        assessmentPassMark: z.ZodOptional<z.ZodNumber>;
        requireMandatorySessions: z.ZodOptional<z.ZodBoolean>;
        requireTrainerConfirmation: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        attendanceThreshold?: number | undefined;
        requireAssessment?: boolean | undefined;
        assessmentPassMark?: number | undefined;
        requireMandatorySessions?: boolean | undefined;
        requireTrainerConfirmation?: boolean | undefined;
    }, {
        attendanceThreshold?: number | undefined;
        requireAssessment?: boolean | undefined;
        assessmentPassMark?: number | undefined;
        requireMandatorySessions?: boolean | undefined;
        requireTrainerConfirmation?: boolean | undefined;
    }>>>>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    link?: string | null | undefined;
    title?: string | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    isMandatory?: boolean | undefined;
    capacity?: number | null | undefined;
    courseId?: number | null | undefined;
    durationHours?: number | null | undefined;
    providerType?: "INTERNAL" | "EXTERNAL" | undefined;
    deliveryMode?: "ONLINE" | "HYBRID" | "IN_PERSON" | "SELF_PACED" | undefined;
    venue?: string | null | undefined;
    cost?: Record<string, number> | null | undefined;
    providerId?: number | null | undefined;
    trainerEmployeeId?: number | null | undefined;
    externalTrainerName?: string | null | undefined;
    registrationOpensAt?: string | null | undefined;
    registrationClosesAt?: string | null | undefined;
    applicabilityType?: "FACULTY" | "ALL" | "DEPARTMENT" | "NON_FACULTY" | "DESIGNATION" | "EMPLOYMENT_TYPE" | "SPECIFIC" | undefined;
    applicabilityRef?: {
        departmentIds?: number[] | undefined;
        employeeIds?: number[] | undefined;
        designationIds?: number[] | undefined;
        employmentTypeIds?: number[] | undefined;
    } | null | undefined;
    mandatoryDueDate?: string | null | undefined;
    completionRule?: {
        attendanceThreshold?: number | undefined;
        requireAssessment?: boolean | undefined;
        assessmentPassMark?: number | undefined;
        requireMandatorySessions?: boolean | undefined;
        requireTrainerConfirmation?: boolean | undefined;
    } | null | undefined;
}, {
    code?: string | undefined;
    link?: string | null | undefined;
    title?: string | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    isMandatory?: boolean | undefined;
    capacity?: number | null | undefined;
    courseId?: number | null | undefined;
    durationHours?: number | null | undefined;
    providerType?: "INTERNAL" | "EXTERNAL" | undefined;
    deliveryMode?: "ONLINE" | "HYBRID" | "IN_PERSON" | "SELF_PACED" | undefined;
    venue?: string | null | undefined;
    cost?: Record<string, number> | null | undefined;
    providerId?: number | null | undefined;
    trainerEmployeeId?: number | null | undefined;
    externalTrainerName?: string | null | undefined;
    registrationOpensAt?: string | null | undefined;
    registrationClosesAt?: string | null | undefined;
    applicabilityType?: "FACULTY" | "ALL" | "DEPARTMENT" | "NON_FACULTY" | "DESIGNATION" | "EMPLOYMENT_TYPE" | "SPECIFIC" | undefined;
    applicabilityRef?: {
        departmentIds?: number[] | undefined;
        employeeIds?: number[] | undefined;
        designationIds?: number[] | undefined;
        employmentTypeIds?: number[] | undefined;
    } | null | undefined;
    mandatoryDueDate?: string | null | undefined;
    completionRule?: {
        attendanceThreshold?: number | undefined;
        requireAssessment?: boolean | undefined;
        assessmentPassMark?: number | undefined;
        requireMandatorySessions?: boolean | undefined;
        requireTrainerConfirmation?: boolean | undefined;
    } | null | undefined;
}>;
export declare const programStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["DRAFT", "PUBLISHED", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "IN_PROGRESS", "COMPLETED", "CLOSED", "CANCELLED"]>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "PUBLISHED" | "CLOSED" | "COMPLETED" | "CANCELLED" | "IN_PROGRESS" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED";
    reason?: string | undefined;
}, {
    status: "DRAFT" | "PUBLISHED" | "CLOSED" | "COMPLETED" | "CANCELLED" | "IN_PROGRESS" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED";
    reason?: string | undefined;
}>;
export declare const sessionSchema: z.ZodObject<{
    title: z.ZodString;
    sessionDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    startTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    endTime: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    trainerEmployeeId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    externalTrainerName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    venue: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    link: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isMandatory: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    title: string;
    link?: string | null | undefined;
    startTime?: string | null | undefined;
    endTime?: string | null | undefined;
    isMandatory?: boolean | undefined;
    sessionDate?: string | null | undefined;
    venue?: string | null | undefined;
    trainerEmployeeId?: number | null | undefined;
    externalTrainerName?: string | null | undefined;
}, {
    title: string;
    link?: string | null | undefined;
    startTime?: string | null | undefined;
    endTime?: string | null | undefined;
    isMandatory?: boolean | undefined;
    sessionDate?: string | null | undefined;
    venue?: string | null | undefined;
    trainerEmployeeId?: number | null | undefined;
    externalTrainerName?: string | null | undefined;
}>;
export declare const devNeedSchema: z.ZodObject<{
    employeeId: z.ZodOptional<z.ZodNumber>;
    sourceType: z.ZodDefault<z.ZodEnum<["APPRAISAL", "SELF", "MANAGER", "HR", "INSTITUTIONAL", "ROLE", "COMPLIANCE"]>>;
    sourceRefId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    developmentArea: z.ZodString;
    targetCompetency: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    priority: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>;
    targetPeriod: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    priority: "MEDIUM" | "HIGH" | "LOW";
    sourceType: "HR" | "INSTITUTIONAL" | "MANAGER" | "APPRAISAL" | "SELF" | "ROLE" | "COMPLIANCE";
    developmentArea: string;
    employeeId?: number | undefined;
    targetCompetency?: string | null | undefined;
    sourceRefId?: number | null | undefined;
    targetPeriod?: string | null | undefined;
}, {
    developmentArea: string;
    employeeId?: number | undefined;
    priority?: "MEDIUM" | "HIGH" | "LOW" | undefined;
    sourceType?: "HR" | "INSTITUTIONAL" | "MANAGER" | "APPRAISAL" | "SELF" | "ROLE" | "COMPLIANCE" | undefined;
    targetCompetency?: string | null | undefined;
    sourceRefId?: number | null | undefined;
    targetPeriod?: string | null | undefined;
}>;
export declare const devNeedTransitionSchema: z.ZodObject<{
    status: z.ZodEnum<["IDENTIFIED", "PLANNED", "IN_PROGRESS", "COMPLETED", "WAIVED", "CANCELLED"]>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "IDENTIFIED" | "COMPLETED" | "CANCELLED" | "IN_PROGRESS" | "PLANNED" | "WAIVED";
    reason?: string | undefined;
}, {
    status: "IDENTIFIED" | "COMPLETED" | "CANCELLED" | "IN_PROGRESS" | "PLANNED" | "WAIVED";
    reason?: string | undefined;
}>;
export declare const nominationSchema: z.ZodObject<{
    programId: z.ZodNumber;
    employeeId: z.ZodOptional<z.ZodNumber>;
    developmentNeedId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    estimatedCost: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    supportingRef: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    eligibilityOverride: z.ZodOptional<z.ZodBoolean>;
    overrideReason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    programId: number;
    reason?: string | null | undefined;
    employeeId?: number | undefined;
    estimatedCost?: number | null | undefined;
    overrideReason?: string | null | undefined;
    developmentNeedId?: number | null | undefined;
    supportingRef?: string | null | undefined;
    eligibilityOverride?: boolean | undefined;
}, {
    programId: number;
    reason?: string | null | undefined;
    employeeId?: number | undefined;
    estimatedCost?: number | null | undefined;
    overrideReason?: string | null | undefined;
    developmentNeedId?: number | null | undefined;
    supportingRef?: string | null | undefined;
    eligibilityOverride?: boolean | undefined;
}>;
export declare const nominationDecisionSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
export declare const enrollSchema: z.ZodObject<{
    programId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    programId: number;
}, {
    programId: number;
}>;
export declare const attendanceSchema: z.ZodObject<{
    sessionId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    entries: z.ZodArray<z.ZodObject<{
        employeeId: z.ZodNumber;
        status: z.ZodEnum<["PRESENT", "ABSENT", "EXCUSED", "NOT_REQUIRED"]>;
    }, "strip", z.ZodTypeAny, {
        status: "PRESENT" | "ABSENT" | "EXCUSED" | "NOT_REQUIRED";
        employeeId: number;
    }, {
        status: "PRESENT" | "ABSENT" | "EXCUSED" | "NOT_REQUIRED";
        employeeId: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    entries: {
        status: "PRESENT" | "ABSENT" | "EXCUSED" | "NOT_REQUIRED";
        employeeId: number;
    }[];
    sessionId?: number | null | undefined;
}, {
    entries: {
        status: "PRESENT" | "ABSENT" | "EXCUSED" | "NOT_REQUIRED";
        employeeId: number;
    }[];
    sessionId?: number | null | undefined;
}>;
export declare const completionSchema: z.ZodObject<{
    employeeId: z.ZodNumber;
    assessmentScore: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    grade: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    employeeId: number;
    grade?: string | null | undefined;
    assessmentScore?: number | null | undefined;
}, {
    employeeId: number;
    grade?: string | null | undefined;
    assessmentScore?: number | null | undefined;
}>;
export declare const certificateIssueSchema: z.ZodObject<{
    employeeId: z.ZodNumber;
    title: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    employeeId: number;
    title?: string | undefined;
}, {
    employeeId: number;
    title?: string | undefined;
}>;
export declare const externalCertSchema: z.ZodObject<{
    programId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    title: z.ZodString;
    provider: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    issuedOn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    expiresOn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    fileReference: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    provider?: string | null | undefined;
    programId?: number | null | undefined;
    fileReference?: string | null | undefined;
    issuedOn?: string | null | undefined;
    expiresOn?: string | null | undefined;
}, {
    title: string;
    provider?: string | null | undefined;
    programId?: number | null | undefined;
    fileReference?: string | null | undefined;
    issuedOn?: string | null | undefined;
    expiresOn?: string | null | undefined;
}>;
export declare const certVerifySchema: z.ZodObject<{
    decision: z.ZodEnum<["VERIFIED", "REJECTED"]>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    decision: "VERIFIED" | "REJECTED";
    reason?: string | undefined;
}, {
    decision: "VERIFIED" | "REJECTED";
    reason?: string | undefined;
}>;
export declare const feedbackSchema: z.ZodObject<{
    programId: z.ZodNumber;
    rating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    relevanceRating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    learningGained: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    comments: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    programId: number;
    rating?: number | null | undefined;
    comments?: string | null | undefined;
    relevanceRating?: number | null | undefined;
    learningGained?: string | null | undefined;
}, {
    programId: number;
    rating?: number | null | undefined;
    comments?: string | null | undefined;
    relevanceRating?: number | null | undefined;
    learningGained?: string | null | undefined;
}>;
export declare const managerReviewSchema: z.ZodObject<{
    programId: z.ZodNumber;
    employeeId: z.ZodNumber;
    improvementObserved: z.ZodOptional<z.ZodBoolean>;
    objectiveMet: z.ZodOptional<z.ZodBoolean>;
    followUpRequired: z.ZodOptional<z.ZodBoolean>;
    comments: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    employeeId: number;
    programId: number;
    comments?: string | null | undefined;
    improvementObserved?: boolean | undefined;
    objectiveMet?: boolean | undefined;
    followUpRequired?: boolean | undefined;
}, {
    employeeId: number;
    programId: number;
    comments?: string | null | undefined;
    improvementObserved?: boolean | undefined;
    objectiveMet?: boolean | undefined;
    followUpRequired?: boolean | undefined;
}>;
export declare const closeNeedSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
