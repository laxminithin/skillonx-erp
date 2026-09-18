import { z } from 'zod';
export type HostelPermission = 'hostel.view' | 'hostel.config.manage' | 'hostel.application.review' | 'hostel.resident.manage' | 'hostel.allocation.manage' | 'hostel.transfer.manage' | 'hostel.outpass.approve' | 'hostel.leave.approve' | 'hostel.gate.manage' | 'hostel.visitor.manage' | 'hostel.complaint.manage' | 'hostel.maintenance.manage' | 'hostel.incident.manage' | 'hostel.inventory.manage' | 'hostel.damage.manage' | 'hostel.vacating.manage' | 'hostel.clearance.manage' | 'hostel.report.view' | 'hostel.mess.manage' | 'hostel.management.view';
export type HostelActor = {
    facultyUserId: number;
    collegeId: number;
    departmentId: number | null;
    role: string;
    name?: string;
};
export type StudentActor = {
    studentId: number;
    collegeId: number;
    usn?: string;
    name?: string;
};
export type HostelVisibility = 'HIDDEN' | 'APPLICATION_AVAILABLE' | 'APPLICATION_DRAFT' | 'APPLICATION_PENDING' | 'WAITLISTED' | 'APPROVED' | 'ALLOCATION_PENDING' | 'RESIDENT' | 'VACATING' | 'FORMER_RESIDENT';
export type HostelNoDueStatus = 'CLEAR' | 'DUE' | 'BLOCKED' | 'NOT_APPLICABLE';
export type HostelNoDueReason = 'ACTIVE_ALLOCATION' | 'VACATING_INCOMPLETE' | 'KEY_NOT_RETURNED' | 'ASSET_PENDING' | 'DAMAGE_PENDING' | 'HOSTEL_FINANCIAL_DUE' | 'MESS_FINANCIAL_DUE' | 'DAMAGE_FINANCIAL_SETTLEMENT_PENDING' | 'OTHER';
export type EligibilityResult = {
    status: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'ELIGIBLE_WITH_OVERRIDE';
    reasons: Array<{
        code: string;
        message: string;
        passed: boolean;
    }>;
};
export declare const hostelApplicationSchema: z.ZodObject<{
    preferredHostelId: z.ZodOptional<z.ZodNumber>;
    preferredRoomType: z.ZodOptional<z.ZodEnum<["SINGLE", "DOUBLE", "TRIPLE", "FOUR_SHARING", "DORMITORY", "CUSTOM"]>>;
    accommodationPeriod: z.ZodOptional<z.ZodString>;
    messRequired: z.ZodOptional<z.ZodBoolean>;
    messPlanId: z.ZodOptional<z.ZodNumber>;
    specialRequirement: z.ZodOptional<z.ZodString>;
    localGuardianName: z.ZodOptional<z.ZodString>;
    localGuardianPhone: z.ZodOptional<z.ZodString>;
    emergencyContactName: z.ZodOptional<z.ZodString>;
    emergencyContactPhone: z.ZodOptional<z.ZodString>;
    additionalNote: z.ZodOptional<z.ZodString>;
    rulesAccepted: z.ZodOptional<z.ZodBoolean>;
    declarationAccepted: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    preferredHostelId?: number | undefined;
    preferredRoomType?: "CUSTOM" | "SINGLE" | "DOUBLE" | "TRIPLE" | "FOUR_SHARING" | "DORMITORY" | undefined;
    accommodationPeriod?: string | undefined;
    messRequired?: boolean | undefined;
    messPlanId?: number | undefined;
    specialRequirement?: string | undefined;
    localGuardianName?: string | undefined;
    localGuardianPhone?: string | undefined;
    emergencyContactName?: string | undefined;
    emergencyContactPhone?: string | undefined;
    additionalNote?: string | undefined;
    rulesAccepted?: boolean | undefined;
    declarationAccepted?: boolean | undefined;
}, {
    preferredHostelId?: number | undefined;
    preferredRoomType?: "CUSTOM" | "SINGLE" | "DOUBLE" | "TRIPLE" | "FOUR_SHARING" | "DORMITORY" | undefined;
    accommodationPeriod?: string | undefined;
    messRequired?: boolean | undefined;
    messPlanId?: number | undefined;
    specialRequirement?: string | undefined;
    localGuardianName?: string | undefined;
    localGuardianPhone?: string | undefined;
    emergencyContactName?: string | undefined;
    emergencyContactPhone?: string | undefined;
    additionalNote?: string | undefined;
    rulesAccepted?: boolean | undefined;
    declarationAccepted?: boolean | undefined;
}>;
export declare const outpassSchema: z.ZodObject<{
    purpose: z.ZodString;
    destination: z.ZodOptional<z.ZodString>;
    expectedExitAt: z.ZodString;
    expectedReturnAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    purpose: string;
    expectedExitAt: string;
    expectedReturnAt: string;
    destination?: string | undefined;
}, {
    purpose: string;
    expectedExitAt: string;
    expectedReturnAt: string;
    destination?: string | undefined;
}>;
export declare const leaveSchema: z.ZodObject<{
    leaveType: z.ZodOptional<z.ZodEnum<["HOME_VISIT", "MEDICAL", "ACADEMIC", "PERSONAL", "VACATION", "OTHER"]>>;
    fromAt: z.ZodString;
    toAt: z.ZodString;
    destination: z.ZodOptional<z.ZodString>;
    reason: z.ZodOptional<z.ZodString>;
    guardianConfirmed: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    fromAt: string;
    toAt: string;
    reason?: string | undefined;
    destination?: string | undefined;
    leaveType?: "OTHER" | "ACADEMIC" | "PERSONAL" | "VACATION" | "HOME_VISIT" | "MEDICAL" | undefined;
    guardianConfirmed?: boolean | undefined;
}, {
    fromAt: string;
    toAt: string;
    reason?: string | undefined;
    destination?: string | undefined;
    leaveType?: "OTHER" | "ACADEMIC" | "PERSONAL" | "VACATION" | "HOME_VISIT" | "MEDICAL" | undefined;
    guardianConfirmed?: boolean | undefined;
}>;
export declare const complaintSchema: z.ZodObject<{
    category: z.ZodEnum<["ELECTRICAL", "PLUMBING", "CLEANING", "FURNITURE", "INTERNET", "ROOM", "BATHROOM", "MESS", "PEST", "SECURITY", "OTHER"]>;
    description: z.ZodString;
    roomId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description: string;
    category: "OTHER" | "ROOM" | "ELECTRICAL" | "PLUMBING" | "CLEANING" | "FURNITURE" | "INTERNET" | "BATHROOM" | "MESS" | "PEST" | "SECURITY";
    roomId?: number | undefined;
}, {
    description: string;
    category: "OTHER" | "ROOM" | "ELECTRICAL" | "PLUMBING" | "CLEANING" | "FURNITURE" | "INTERNET" | "BATHROOM" | "MESS" | "PEST" | "SECURITY";
    roomId?: number | undefined;
}>;
export declare const visitorRequestSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    relationship: z.ZodOptional<z.ZodString>;
    purpose: z.ZodOptional<z.ZodString>;
    expectedExitAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    relationship?: string | undefined;
    phone?: string | undefined;
    purpose?: string | undefined;
    expectedExitAt?: string | undefined;
}, {
    name: string;
    relationship?: string | undefined;
    phone?: string | undefined;
    purpose?: string | undefined;
    expectedExitAt?: string | undefined;
}>;
export declare const messFeedbackSchema: z.ZodObject<{
    mealDate: z.ZodString;
    mealType: z.ZodEnum<["BREAKFAST", "LUNCH", "SNACKS", "DINNER", "SPECIAL"]>;
    rating: z.ZodNumber;
    category: z.ZodOptional<z.ZodString>;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    mealDate: string;
    mealType: "LUNCH" | "SPECIAL" | "BREAKFAST" | "SNACKS" | "DINNER";
    rating: number;
    comment?: string | undefined;
    category?: string | undefined;
}, {
    mealDate: string;
    mealType: "LUNCH" | "SPECIAL" | "BREAKFAST" | "SNACKS" | "DINNER";
    rating: number;
    comment?: string | undefined;
    category?: string | undefined;
}>;
