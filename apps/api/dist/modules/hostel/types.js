import { z } from 'zod';
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
