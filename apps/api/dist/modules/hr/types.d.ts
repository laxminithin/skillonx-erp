import { z } from 'zod';
export declare const EMPLOYMENT_STATUSES: readonly ["DRAFT", "PRE_JOINING", "ACTIVE", "PROBATION", "CONFIRMED", "ON_NOTICE", "SUSPENDED", "ON_LONG_LEAVE", "SEPARATED", "RETIRED", "TERMINATED", "INACTIVE"];
export declare const LEAVE_STATUSES: readonly ["DRAFT", "SUBMITTED", "COVERAGE_PENDING", "UNDER_APPROVAL", "ACTION_REQUIRED", "APPROVED", "REJECTED", "CANCELLED", "WITHDRAWN", "COMPLETED"];
export declare const LEAVE_SESSIONS: readonly ["FULL_DAY", "FIRST_HALF", "SECOND_HALF"];
export declare const COVERAGE_TYPES: readonly ["SUBSTITUTE_FACULTY", "CLASS_SWAP", "RESCHEDULE", "TEAM_TEACHING", "ALREADY_COVERED", "HOD_ARRANGEMENT", "CANCELLED_WITH_AUTHORIZATION"];
export declare const COVERAGE_STATUSES: readonly ["UNRESOLVED", "REQUESTED", "ACCEPTED", "DECLINED", "VERIFIED", "COMPLETED", "CANCELLED", "HOD_ACTION_REQUIRED"];
export declare const ATTENDANCE_STATUSES: readonly ["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE", "HOLIDAY", "WEEKLY_OFF", "WORK_FROM_HOME", "ON_DUTY", "MISSING_PUNCH", "OTHER"];
export declare const PAYROLL_RUN_STATUSES: readonly ["DRAFT", "CALCULATED", "UNDER_REVIEW", "APPROVED", "LOCKED", "POSTED", "CANCELLED"];
export type HrPermission = 'hr.self.view' | 'hr.self.leave.apply' | 'hr.self.attendance.view' | 'hr.self.payslip.view' | 'hr.employee.view' | 'hr.employee.manage' | 'hr.employee.onboard' | 'hr.employee.transfer' | 'hr.employee.promote' | 'hr.employee.separate' | 'hr.attendance.view' | 'hr.attendance.manage' | 'hr.attendance.adjust' | 'hr.leave.view' | 'hr.leave.approve' | 'hr.leave.override' | 'hr.leave.balance.adjust' | 'hr.payroll.view' | 'hr.payroll.manage' | 'hr.payroll.calculate' | 'hr.payroll.approve' | 'hr.payroll.lock' | 'hr.fnf.view' | 'hr.fnf.manage' | 'hr.fnf.calculate' | 'hr.fnf.approve' | 'hr.fnf.post' | 'hr.fnf.override' | 'hr.fnf.document.release' | 'hr.fnf.reopen' | 'hr.fnf.clearance.department' | 'hr.performance.view' | 'hr.performance.manage' | 'hr.performance.calibrate' | 'hr.performance.finalize' | 'hr.performance.reopen' | 'hr.performance.report' | 'hr.recruitment.view' | 'hr.recruitment.manage' | 'hr.recruitment.approve' | 'hr.recruitment.offer' | 'hr.recruitment.join' | 'hr.recruitment.report' | 'hr.document.view' | 'hr.document.manage' | 'hr.config.manage' | 'hr.report.view' | 'hr.management.view' | 'hr.analytics.view' | 'hr.analytics.payroll.aggregate' | 'hr.analytics.payroll.detail' | 'hr.analytics.export' | 'hr.ld.self' | 'hr.ld.view' | 'hr.ld.manage' | 'hr.ld.nominate' | 'hr.ld.approve' | 'hr.ld.report' | 'hr.succession.self' | 'hr.succession.view' | 'hr.succession.manage' | 'hr.succession.nominate' | 'hr.succession.assess' | 'hr.succession.approve' | 'hr.succession.report' | 'academic.leave.coverage.manage';
export type HrActor = {
    facultyUserId: number;
    collegeId: number;
    departmentId: number | null;
    role: string;
    name?: string;
    employeeId?: number | null;
    leadershipRoles?: string[];
    hodDepartmentIds?: number[];
};
export declare const createEmployeeSchema: z.ZodObject<{
    firstName: z.ZodString;
    middleName: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    lastName: z.ZodString;
    title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    officialEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    personalEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    officialPhone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    personalPhone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    employeeCategory: z.ZodDefault<z.ZodEnum<["FACULTY", "NON_TEACHING", "MANAGEMENT", "CONTRACTUAL", "OTHER"]>>;
    departmentId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    designationId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    employmentTypeId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    reportingManagerEmployeeId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    dateOfJoining: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    employmentStatus: z.ZodOptional<z.ZodEnum<["DRAFT", "PRE_JOINING", "ACTIVE", "PROBATION", "CONFIRMED", "ON_NOTICE", "SUSPENDED", "ON_LONG_LEAVE", "SEPARATED", "RETIRED", "TERMINATED", "INACTIVE"]>>;
    facultyUserId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    authMode: z.ZodOptional<z.ZodEnum<["LINK_EXISTING", "CREATE_LOGIN", "NO_LOGIN"]>>;
    manualEmployeeNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    dateOfBirth: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    gender: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    employeeCategory: "FACULTY" | "MANAGEMENT" | "OTHER" | "NON_TEACHING" | "CONTRACTUAL";
    middleName?: string | null | undefined;
    title?: string | null | undefined;
    officialEmail?: string | null | undefined;
    personalEmail?: string | null | undefined;
    officialPhone?: string | null | undefined;
    personalPhone?: string | null | undefined;
    departmentId?: number | null | undefined;
    designationId?: number | null | undefined;
    employmentTypeId?: number | null | undefined;
    reportingManagerEmployeeId?: number | null | undefined;
    dateOfJoining?: string | null | undefined;
    employmentStatus?: "DRAFT" | "ACTIVE" | "SUSPENDED" | "PRE_JOINING" | "PROBATION" | "CONFIRMED" | "ON_NOTICE" | "ON_LONG_LEAVE" | "SEPARATED" | "RETIRED" | "TERMINATED" | "INACTIVE" | undefined;
    facultyUserId?: number | null | undefined;
    authMode?: "LINK_EXISTING" | "CREATE_LOGIN" | "NO_LOGIN" | undefined;
    manualEmployeeNumber?: string | null | undefined;
    dateOfBirth?: string | null | undefined;
    gender?: string | null | undefined;
}, {
    firstName: string;
    lastName: string;
    middleName?: string | null | undefined;
    title?: string | null | undefined;
    officialEmail?: string | null | undefined;
    personalEmail?: string | null | undefined;
    officialPhone?: string | null | undefined;
    personalPhone?: string | null | undefined;
    employeeCategory?: "FACULTY" | "MANAGEMENT" | "OTHER" | "NON_TEACHING" | "CONTRACTUAL" | undefined;
    departmentId?: number | null | undefined;
    designationId?: number | null | undefined;
    employmentTypeId?: number | null | undefined;
    reportingManagerEmployeeId?: number | null | undefined;
    dateOfJoining?: string | null | undefined;
    employmentStatus?: "DRAFT" | "ACTIVE" | "SUSPENDED" | "PRE_JOINING" | "PROBATION" | "CONFIRMED" | "ON_NOTICE" | "ON_LONG_LEAVE" | "SEPARATED" | "RETIRED" | "TERMINATED" | "INACTIVE" | undefined;
    facultyUserId?: number | null | undefined;
    authMode?: "LINK_EXISTING" | "CREATE_LOGIN" | "NO_LOGIN" | undefined;
    manualEmployeeNumber?: string | null | undefined;
    dateOfBirth?: string | null | undefined;
    gender?: string | null | undefined;
}>;
export declare const updateEmployeeSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    middleName: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    lastName: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    officialEmail: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    personalEmail: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    officialPhone: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    personalPhone: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    employeeCategory: z.ZodOptional<z.ZodDefault<z.ZodEnum<["FACULTY", "NON_TEACHING", "MANAGEMENT", "CONTRACTUAL", "OTHER"]>>>;
    departmentId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    designationId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    employmentTypeId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    reportingManagerEmployeeId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    dateOfJoining: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    employmentStatus: z.ZodOptional<z.ZodOptional<z.ZodEnum<["DRAFT", "PRE_JOINING", "ACTIVE", "PROBATION", "CONFIRMED", "ON_NOTICE", "SUSPENDED", "ON_LONG_LEAVE", "SEPARATED", "RETIRED", "TERMINATED", "INACTIVE"]>>>;
    facultyUserId: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
    authMode: z.ZodOptional<z.ZodOptional<z.ZodEnum<["LINK_EXISTING", "CREATE_LOGIN", "NO_LOGIN"]>>>;
    manualEmployeeNumber: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    dateOfBirth: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    gender: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    middleName?: string | null | undefined;
    lastName?: string | undefined;
    title?: string | null | undefined;
    officialEmail?: string | null | undefined;
    personalEmail?: string | null | undefined;
    officialPhone?: string | null | undefined;
    personalPhone?: string | null | undefined;
    employeeCategory?: "FACULTY" | "MANAGEMENT" | "OTHER" | "NON_TEACHING" | "CONTRACTUAL" | undefined;
    departmentId?: number | null | undefined;
    designationId?: number | null | undefined;
    employmentTypeId?: number | null | undefined;
    reportingManagerEmployeeId?: number | null | undefined;
    dateOfJoining?: string | null | undefined;
    employmentStatus?: "DRAFT" | "ACTIVE" | "SUSPENDED" | "PRE_JOINING" | "PROBATION" | "CONFIRMED" | "ON_NOTICE" | "ON_LONG_LEAVE" | "SEPARATED" | "RETIRED" | "TERMINATED" | "INACTIVE" | undefined;
    facultyUserId?: number | null | undefined;
    authMode?: "LINK_EXISTING" | "CREATE_LOGIN" | "NO_LOGIN" | undefined;
    manualEmployeeNumber?: string | null | undefined;
    dateOfBirth?: string | null | undefined;
    gender?: string | null | undefined;
}, {
    firstName?: string | undefined;
    middleName?: string | null | undefined;
    lastName?: string | undefined;
    title?: string | null | undefined;
    officialEmail?: string | null | undefined;
    personalEmail?: string | null | undefined;
    officialPhone?: string | null | undefined;
    personalPhone?: string | null | undefined;
    employeeCategory?: "FACULTY" | "MANAGEMENT" | "OTHER" | "NON_TEACHING" | "CONTRACTUAL" | undefined;
    departmentId?: number | null | undefined;
    designationId?: number | null | undefined;
    employmentTypeId?: number | null | undefined;
    reportingManagerEmployeeId?: number | null | undefined;
    dateOfJoining?: string | null | undefined;
    employmentStatus?: "DRAFT" | "ACTIVE" | "SUSPENDED" | "PRE_JOINING" | "PROBATION" | "CONFIRMED" | "ON_NOTICE" | "ON_LONG_LEAVE" | "SEPARATED" | "RETIRED" | "TERMINATED" | "INACTIVE" | undefined;
    facultyUserId?: number | null | undefined;
    authMode?: "LINK_EXISTING" | "CREATE_LOGIN" | "NO_LOGIN" | undefined;
    manualEmployeeNumber?: string | null | undefined;
    dateOfBirth?: string | null | undefined;
    gender?: string | null | undefined;
}>;
export declare const joinEmployeeSchema: z.ZodObject<{
    overrideOnboarding: z.ZodOptional<z.ZodBoolean>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    overrideOnboarding?: boolean | undefined;
    reason?: string | undefined;
}, {
    overrideOnboarding?: boolean | undefined;
    reason?: string | undefined;
}>;
export declare const linkUserSchema: z.ZodObject<{
    facultyUserId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    facultyUserId: number;
}, {
    facultyUserId: number;
}>;
export declare const promotionSchema: z.ZodObject<{
    newDesignationId: z.ZodNumber;
    effectiveDate: z.ZodString;
    newGradeId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    reason: z.ZodOptional<z.ZodString>;
    approvalReference: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    newDesignationId: number;
    effectiveDate: string;
    reason?: string | undefined;
    newGradeId?: number | null | undefined;
    approvalReference?: string | undefined;
}, {
    newDesignationId: number;
    effectiveDate: string;
    reason?: string | undefined;
    newGradeId?: number | null | undefined;
    approvalReference?: string | undefined;
}>;
export declare const transferSchema: z.ZodObject<{
    toDepartmentId: z.ZodNumber;
    effectiveDate: z.ZodString;
    newReportingManagerEmployeeId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    newDesignationId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    effectiveDate: string;
    toDepartmentId: number;
    reason?: string | undefined;
    newDesignationId?: number | null | undefined;
    newReportingManagerEmployeeId?: number | null | undefined;
}, {
    effectiveDate: string;
    toDepartmentId: number;
    reason?: string | undefined;
    newDesignationId?: number | null | undefined;
    newReportingManagerEmployeeId?: number | null | undefined;
}>;
export declare const reportingChangeSchema: z.ZodObject<{
    reportingManagerEmployeeId: z.ZodNullable<z.ZodNumber>;
    effectiveDate: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reportingManagerEmployeeId: number | null;
    effectiveDate: string;
    reason?: string | undefined;
}, {
    reportingManagerEmployeeId: number | null;
    effectiveDate: string;
    reason?: string | undefined;
}>;
export declare const designationChangeSchema: z.ZodObject<{
    newDesignationId: z.ZodNumber;
    effectiveDate: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
    newDesignationId: number;
    effectiveDate: string;
}, {
    reason: string;
    newDesignationId: number;
    effectiveDate: string;
}>;
export declare const contractSchema: z.ZodObject<{
    contractType: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    noticePeriodDays: z.ZodOptional<z.ZodNumber>;
    reference: z.ZodOptional<z.ZodString>;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    contractType: string;
    startDate: string;
    endDate: string;
    noticePeriodDays?: number | undefined;
    reference?: string | undefined;
    remarks?: string | undefined;
}, {
    contractType: string;
    startDate: string;
    endDate: string;
    noticePeriodDays?: number | undefined;
    reference?: string | undefined;
    remarks?: string | undefined;
}>;
export declare const resignationSchema: z.ZodObject<{
    proposedLastWorkingDate: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    proposedLastWorkingDate: string;
    reason?: string | undefined;
    remarks?: string | undefined;
}, {
    proposedLastWorkingDate: string;
    reason?: string | undefined;
    remarks?: string | undefined;
}>;
export declare const separationInitiateSchema: z.ZodObject<{
    separationType: z.ZodString;
    lastWorkingDate: z.ZodString;
    reason: z.ZodString;
    noticePeriodDays: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    reason: string;
    separationType: string;
    lastWorkingDate: string;
    noticePeriodDays?: number | undefined;
}, {
    reason: string;
    separationType: string;
    lastWorkingDate: string;
    noticePeriodDays?: number | undefined;
}>;
export declare const clearanceUpdateSchema: z.ZodObject<{
    status: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    waive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    status: string;
    notes?: string | undefined;
    waive?: boolean | undefined;
}, {
    status: string;
    notes?: string | undefined;
    waive?: boolean | undefined;
}>;
export declare const probationRecommendSchema: z.ZodObject<{
    recommendation: z.ZodString;
    performanceSummary: z.ZodOptional<z.ZodString>;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    recommendation: string;
    remarks?: string | undefined;
    performanceSummary?: string | undefined;
}, {
    recommendation: string;
    remarks?: string | undefined;
    performanceSummary?: string | undefined;
}>;
export declare const probationConfirmSchema: z.ZodObject<{
    effectiveDate: z.ZodOptional<z.ZodString>;
    reference: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    effectiveDate?: string | undefined;
    reference?: string | undefined;
}, {
    effectiveDate?: string | undefined;
    reference?: string | undefined;
}>;
export declare const probationExtendSchema: z.ZodObject<{
    newEndDate: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
    newEndDate: string;
}, {
    reason: string;
    newEndDate: string;
}>;
export declare const personalProfileSchema: z.ZodObject<{
    dateOfBirth: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    gender: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    maritalStatus: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    bloodGroup: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    nationality: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    personalEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    personalPhone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    currentAddress: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    permanentAddress: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    photoReference: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    personalEmail?: string | null | undefined;
    personalPhone?: string | null | undefined;
    dateOfBirth?: string | null | undefined;
    gender?: string | null | undefined;
    maritalStatus?: string | null | undefined;
    bloodGroup?: string | null | undefined;
    nationality?: string | null | undefined;
    currentAddress?: string | null | undefined;
    permanentAddress?: string | null | undefined;
    photoReference?: string | null | undefined;
}, {
    personalEmail?: string | null | undefined;
    personalPhone?: string | null | undefined;
    dateOfBirth?: string | null | undefined;
    gender?: string | null | undefined;
    maritalStatus?: string | null | undefined;
    bloodGroup?: string | null | undefined;
    nationality?: string | null | undefined;
    currentAddress?: string | null | undefined;
    permanentAddress?: string | null | undefined;
    photoReference?: string | null | undefined;
}>;
export declare const emergencyContactSchema: z.ZodObject<{
    name: z.ZodString;
    relationship: z.ZodString;
    phone: z.ZodString;
    alternatePhone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isPrimary: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    relationship: string;
    phone: string;
    alternatePhone?: string | null | undefined;
    address?: string | null | undefined;
    isPrimary?: boolean | undefined;
}, {
    name: string;
    relationship: string;
    phone: string;
    alternatePhone?: string | null | undefined;
    address?: string | null | undefined;
    isPrimary?: boolean | undefined;
}>;
export declare const emergencyContactUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    relationship: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    alternatePhone: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    isPrimary: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    relationship?: string | undefined;
    phone?: string | undefined;
    alternatePhone?: string | null | undefined;
    address?: string | null | undefined;
    isPrimary?: boolean | undefined;
}, {
    name?: string | undefined;
    relationship?: string | undefined;
    phone?: string | undefined;
    alternatePhone?: string | null | undefined;
    address?: string | null | undefined;
    isPrimary?: boolean | undefined;
}>;
export declare const leaveRequestSchema: z.ZodObject<{
    leaveTypeId: z.ZodNumber;
    fromDate: z.ZodString;
    toDate: z.ZodString;
    fromSession: z.ZodDefault<z.ZodEnum<["FULL_DAY", "FIRST_HALF", "SECOND_HALF"]>>;
    toSession: z.ZodDefault<z.ZodEnum<["FULL_DAY", "FIRST_HALF", "SECOND_HALF"]>>;
    reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    isEmergency: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    leaveTypeId: number;
    fromDate: string;
    toDate: string;
    fromSession: "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";
    toSession: "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";
    reason?: string | null | undefined;
    isEmergency?: boolean | undefined;
}, {
    leaveTypeId: number;
    fromDate: string;
    toDate: string;
    reason?: string | null | undefined;
    fromSession?: "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF" | undefined;
    toSession?: "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF" | undefined;
    isEmergency?: boolean | undefined;
}>;
export declare const coverageRequestSchema: z.ZodObject<{
    coverageId: z.ZodNumber;
    substituteEmployeeId: z.ZodNumber;
    coverageType: z.ZodDefault<z.ZodEnum<["SUBSTITUTE_FACULTY", "CLASS_SWAP", "RESCHEDULE", "TEAM_TEACHING", "ALREADY_COVERED", "HOD_ARRANGEMENT", "CANCELLED_WITH_AUTHORIZATION"]>>;
    message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    coverageId: number;
    substituteEmployeeId: number;
    coverageType: "SUBSTITUTE_FACULTY" | "CLASS_SWAP" | "RESCHEDULE" | "TEAM_TEACHING" | "ALREADY_COVERED" | "HOD_ARRANGEMENT" | "CANCELLED_WITH_AUTHORIZATION";
    message?: string | null | undefined;
}, {
    coverageId: number;
    substituteEmployeeId: number;
    message?: string | null | undefined;
    coverageType?: "SUBSTITUTE_FACULTY" | "CLASS_SWAP" | "RESCHEDULE" | "TEAM_TEACHING" | "ALREADY_COVERED" | "HOD_ARRANGEMENT" | "CANCELLED_WITH_AUTHORIZATION" | undefined;
}>;
export declare const hodArrangementSchema: z.ZodObject<{
    coverageId: z.ZodNumber;
    reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    coverageId: number;
    reason?: string | null | undefined;
}, {
    coverageId: number;
    reason?: string | null | undefined;
}>;
export declare const classSwapSchema: z.ZodObject<{
    coverageId: z.ZodNumber;
    swapEmployeeId: z.ZodNumber;
    targetTimetableSlotId: z.ZodNumber;
    targetDate: z.ZodString;
    message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    coverageId: number;
    swapEmployeeId: number;
    targetTimetableSlotId: number;
    targetDate: string;
    message?: string | null | undefined;
}, {
    coverageId: number;
    swapEmployeeId: number;
    targetTimetableSlotId: number;
    targetDate: string;
    message?: string | null | undefined;
}>;
export declare const rescheduleSchema: z.ZodObject<{
    coverageId: z.ZodNumber;
    makeupDate: z.ZodString;
    startTime: z.ZodString;
    endTime: z.ZodString;
    roomId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    makeupKind: z.ZodOptional<z.ZodEnum<["RESCHEDULE", "MAKEUP", "EXTRA_CLASS"]>>;
}, "strip", z.ZodTypeAny, {
    coverageId: number;
    makeupDate: string;
    startTime: string;
    endTime: string;
    roomId?: number | null | undefined;
    makeupKind?: "RESCHEDULE" | "MAKEUP" | "EXTRA_CLASS" | undefined;
}, {
    coverageId: number;
    makeupDate: string;
    startTime: string;
    endTime: string;
    roomId?: number | null | undefined;
    makeupKind?: "RESCHEDULE" | "MAKEUP" | "EXTRA_CLASS" | undefined;
}>;
export declare const managerSubstituteSchema: z.ZodObject<{
    substituteEmployeeId: z.ZodNumber;
    skipConsent: z.ZodOptional<z.ZodBoolean>;
    reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    substituteEmployeeId: number;
    reason?: string | null | undefined;
    skipConsent?: boolean | undefined;
}, {
    substituteEmployeeId: number;
    reason?: string | null | undefined;
    skipConsent?: boolean | undefined;
}>;
export declare const authorizedCancelSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const REGULARIZATION_REASONS: readonly ["MISSED_PUNCH", "DEVICE_FAILURE", "OFFICIAL_WORK", "WRONG_SHIFT", "APPROVED_LATE_ARRIVAL", "APPROVED_EARLY_DEPARTURE", "OTHER"];
export declare const regularizationSchema: z.ZodObject<{
    attendanceDate: z.ZodString;
    regularizationReason: z.ZodEnum<["MISSED_PUNCH", "DEVICE_FAILURE", "OFFICIAL_WORK", "WRONG_SHIFT", "APPROVED_LATE_ARRIVAL", "APPROVED_EARLY_DEPARTURE", "OTHER"]>;
    requestedInAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    requestedOutAt: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    reason: z.ZodString;
    newStatus: z.ZodOptional<z.ZodEnum<["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE", "HOLIDAY", "WEEKLY_OFF", "WORK_FROM_HOME", "ON_DUTY", "MISSING_PUNCH", "OTHER"]>>;
}, "strip", z.ZodTypeAny, {
    reason: string;
    attendanceDate: string;
    regularizationReason: "OTHER" | "MISSED_PUNCH" | "DEVICE_FAILURE" | "OFFICIAL_WORK" | "WRONG_SHIFT" | "APPROVED_LATE_ARRIVAL" | "APPROVED_EARLY_DEPARTURE";
    requestedInAt?: string | null | undefined;
    requestedOutAt?: string | null | undefined;
    newStatus?: "PRESENT" | "ABSENT" | "HALF_DAY" | "ON_LEAVE" | "HOLIDAY" | "WEEKLY_OFF" | "WORK_FROM_HOME" | "ON_DUTY" | "MISSING_PUNCH" | "OTHER" | undefined;
}, {
    reason: string;
    attendanceDate: string;
    regularizationReason: "OTHER" | "MISSED_PUNCH" | "DEVICE_FAILURE" | "OFFICIAL_WORK" | "WRONG_SHIFT" | "APPROVED_LATE_ARRIVAL" | "APPROVED_EARLY_DEPARTURE";
    requestedInAt?: string | null | undefined;
    requestedOutAt?: string | null | undefined;
    newStatus?: "PRESENT" | "ABSENT" | "HALF_DAY" | "ON_LEAVE" | "HOLIDAY" | "WEEKLY_OFF" | "WORK_FROM_HOME" | "ON_DUTY" | "MISSING_PUNCH" | "OTHER" | undefined;
}>;
export declare const attendanceOverrideSchema: z.ZodObject<{
    status: z.ZodEnum<["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE", "HOLIDAY", "WEEKLY_OFF", "WORK_FROM_HOME", "ON_DUTY", "MISSING_PUNCH", "OTHER"]>;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "PRESENT" | "ABSENT" | "HALF_DAY" | "ON_LEAVE" | "HOLIDAY" | "WEEKLY_OFF" | "WORK_FROM_HOME" | "ON_DUTY" | "MISSING_PUNCH" | "OTHER";
    reason: string;
}, {
    status: "PRESENT" | "ABSENT" | "HALF_DAY" | "ON_LEAVE" | "HOLIDAY" | "WEEKLY_OFF" | "WORK_FROM_HOME" | "ON_DUTY" | "MISSING_PUNCH" | "OTHER";
    reason: string;
}>;
export declare const attendanceSettingsSchema: z.ZodObject<{
    defaultWorkScheduleId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    defaultShiftId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    sandwichLeavePolicy: z.ZodOptional<z.ZodEnum<["DISABLED", "WEEKLY_OFF", "HOLIDAY", "BOTH"]>>;
    lateMarksCountAsLop: z.ZodOptional<z.ZodBoolean>;
    autoFlagMissingPunch: z.ZodOptional<z.ZodBoolean>;
    missingPunchGraceHours: z.ZodOptional<z.ZodNumber>;
    requireRegularizationApproval: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    defaultWorkScheduleId?: number | null | undefined;
    defaultShiftId?: number | null | undefined;
    sandwichLeavePolicy?: "DISABLED" | "HOLIDAY" | "WEEKLY_OFF" | "BOTH" | undefined;
    lateMarksCountAsLop?: boolean | undefined;
    autoFlagMissingPunch?: boolean | undefined;
    missingPunchGraceHours?: number | undefined;
    requireRegularizationApproval?: boolean | undefined;
}, {
    defaultWorkScheduleId?: number | null | undefined;
    defaultShiftId?: number | null | undefined;
    sandwichLeavePolicy?: "DISABLED" | "HOLIDAY" | "WEEKLY_OFF" | "BOTH" | undefined;
    lateMarksCountAsLop?: boolean | undefined;
    autoFlagMissingPunch?: boolean | undefined;
    missingPunchGraceHours?: number | undefined;
    requireRegularizationApproval?: boolean | undefined;
}>;
export declare const shiftSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    startTime: z.ZodString;
    endTime: z.ZodString;
    breakDurationMinutes: z.ZodOptional<z.ZodNumber>;
    graceInMinutes: z.ZodOptional<z.ZodNumber>;
    graceOutMinutes: z.ZodOptional<z.ZodNumber>;
    minimumFullDayMinutes: z.ZodOptional<z.ZodNumber>;
    minimumHalfDayMinutes: z.ZodOptional<z.ZodNumber>;
    crossesMidnight: z.ZodOptional<z.ZodBoolean>;
    effectiveFrom: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    effectiveTo: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    startTime: string;
    endTime: string;
    breakDurationMinutes?: number | undefined;
    graceInMinutes?: number | undefined;
    graceOutMinutes?: number | undefined;
    minimumFullDayMinutes?: number | undefined;
    minimumHalfDayMinutes?: number | undefined;
    crossesMidnight?: boolean | undefined;
    effectiveFrom?: string | null | undefined;
    effectiveTo?: string | null | undefined;
}, {
    code: string;
    name: string;
    startTime: string;
    endTime: string;
    breakDurationMinutes?: number | undefined;
    graceInMinutes?: number | undefined;
    graceOutMinutes?: number | undefined;
    minimumFullDayMinutes?: number | undefined;
    minimumHalfDayMinutes?: number | undefined;
    crossesMidnight?: boolean | undefined;
    effectiveFrom?: string | null | undefined;
    effectiveTo?: string | null | undefined;
}>;
export declare const holidaySchema: z.ZodObject<{
    name: z.ZodString;
    holidayDate: z.ZodString;
    holidayType: z.ZodOptional<z.ZodEnum<["NATIONAL", "STATE", "INSTITUTION", "RESTRICTED"]>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    departmentId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    employeeCategory: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    holidayDate: string;
    employeeCategory?: string | null | undefined;
    departmentId?: number | null | undefined;
    holidayType?: "NATIONAL" | "STATE" | "INSTITUTION" | "RESTRICTED" | undefined;
    description?: string | null | undefined;
}, {
    name: string;
    holidayDate: string;
    employeeCategory?: string | null | undefined;
    departmentId?: number | null | undefined;
    holidayType?: "NATIONAL" | "STATE" | "INSTITUTION" | "RESTRICTED" | undefined;
    description?: string | null | undefined;
}>;
export declare const monthReopenSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const punchImportSchema: z.ZodObject<{
    employeeId: z.ZodNumber;
    punchAt: z.ZodString;
    punchType: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    externalEventId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    deviceId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    employeeId: number;
    punchAt: string;
    punchType?: string | null | undefined;
    externalEventId?: string | null | undefined;
    deviceId?: string | null | undefined;
}, {
    employeeId: number;
    punchAt: string;
    punchType?: string | null | undefined;
    externalEventId?: string | null | undefined;
    deviceId?: string | null | undefined;
}>;
