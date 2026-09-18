import { z } from 'zod';

export type HostelPermission =
  | 'hostel.view'
  | 'hostel.config.manage'
  | 'hostel.application.review'
  | 'hostel.resident.manage'
  | 'hostel.allocation.manage'
  | 'hostel.transfer.manage'
  | 'hostel.outpass.approve'
  | 'hostel.leave.approve'
  | 'hostel.gate.manage'
  | 'hostel.visitor.manage'
  | 'hostel.complaint.manage'
  | 'hostel.maintenance.manage'
  | 'hostel.incident.manage'
  | 'hostel.inventory.manage'
  | 'hostel.damage.manage'
  | 'hostel.vacating.manage'
  | 'hostel.clearance.manage'
  | 'hostel.report.view'
  | 'hostel.mess.manage'
  | 'hostel.management.view';

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

export type HostelVisibility =
  | 'HIDDEN'
  | 'APPLICATION_AVAILABLE'
  | 'APPLICATION_DRAFT'
  | 'APPLICATION_PENDING'
  | 'WAITLISTED'
  | 'APPROVED'
  | 'ALLOCATION_PENDING'
  | 'RESIDENT'
  | 'VACATING'
  | 'FORMER_RESIDENT';

export type HostelNoDueStatus = 'CLEAR' | 'DUE' | 'BLOCKED' | 'NOT_APPLICABLE';

export type HostelNoDueReason =
  | 'ACTIVE_ALLOCATION'
  | 'VACATING_INCOMPLETE'
  | 'KEY_NOT_RETURNED'
  | 'ASSET_PENDING'
  | 'DAMAGE_PENDING'
  | 'HOSTEL_FINANCIAL_DUE'
  | 'MESS_FINANCIAL_DUE'
  | 'DAMAGE_FINANCIAL_SETTLEMENT_PENDING'
  | 'OTHER';

export type EligibilityResult = {
  status: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'ELIGIBLE_WITH_OVERRIDE';
  reasons: Array<{ code: string; message: string; passed: boolean }>;
};

export const hostelApplicationSchema = z.object({
  preferredHostelId: z.number().int().positive().optional(),
  preferredRoomType: z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_SHARING', 'DORMITORY', 'CUSTOM']).optional(),
  accommodationPeriod: z.string().trim().max(64).optional(),
  messRequired: z.boolean().optional(),
  messPlanId: z.number().int().positive().optional(),
  specialRequirement: z.string().trim().max(2000).optional(),
  localGuardianName: z.string().trim().max(255).optional(),
  localGuardianPhone: z.string().trim().max(32).optional(),
  emergencyContactName: z.string().trim().max(255).optional(),
  emergencyContactPhone: z.string().trim().max(32).optional(),
  additionalNote: z.string().trim().max(2000).optional(),
  rulesAccepted: z.boolean().optional(),
  declarationAccepted: z.boolean().optional(),
});

export const outpassSchema = z.object({
  purpose: z.string().trim().min(1).max(500),
  destination: z.string().trim().max(255).optional(),
  expectedExitAt: z.string(),
  expectedReturnAt: z.string(),
});

export const leaveSchema = z.object({
  leaveType: z.enum(['HOME_VISIT', 'MEDICAL', 'ACADEMIC', 'PERSONAL', 'VACATION', 'OTHER']).optional(),
  fromAt: z.string(),
  toAt: z.string(),
  destination: z.string().trim().max(255).optional(),
  reason: z.string().trim().max(2000).optional(),
  guardianConfirmed: z.boolean().optional(),
});

export const complaintSchema = z.object({
  category: z.enum([
    'ELECTRICAL', 'PLUMBING', 'CLEANING', 'FURNITURE', 'INTERNET',
    'ROOM', 'BATHROOM', 'MESS', 'PEST', 'SECURITY', 'OTHER',
  ]),
  description: z.string().trim().min(1).max(5000),
  roomId: z.number().int().positive().optional(),
});

export const visitorRequestSchema = z.object({
  name: z.string().trim().min(1).max(255),
  phone: z.string().trim().max(32).optional(),
  relationship: z.string().trim().max(64).optional(),
  purpose: z.string().trim().max(500).optional(),
  expectedExitAt: z.string().optional(),
});

export const messFeedbackSchema = z.object({
  mealDate: z.string(),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER', 'SPECIAL']),
  rating: z.number().int().min(1).max(5),
  category: z.string().trim().max(32).optional(),
  comment: z.string().trim().max(2000).optional(),
});
