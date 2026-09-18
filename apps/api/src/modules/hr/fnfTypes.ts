import { z } from 'zod';

export const FNF_STATUSES = [
  'DRAFT',
  'CLEARANCE_PENDING',
  'READY_FOR_CALCULATION',
  'CALCULATED',
  'REVIEW',
  'APPROVED',
  'FINANCE_POSTED',
  'SETTLED',
  'CLOSED',
  'ON_HOLD',
  'REJECTED',
  'CANCELLED',
  'REOPENED',
] as const;

export type FnfStatus = (typeof FNF_STATUSES)[number];

export const FNF_LOCKED_STATUSES: FnfStatus[] = ['APPROVED', 'FINANCE_POSTED', 'SETTLED', 'CLOSED'];

export const FNF_TRANSITIONS: Record<FnfStatus, FnfStatus[]> = {
  DRAFT: ['CLEARANCE_PENDING', 'CANCELLED'],
  CLEARANCE_PENDING: ['READY_FOR_CALCULATION', 'CALCULATED', 'ON_HOLD', 'CANCELLED'],
  READY_FOR_CALCULATION: ['CALCULATED', 'CLEARANCE_PENDING', 'ON_HOLD'],
  CALCULATED: ['REVIEW', 'CALCULATED', 'CLEARANCE_PENDING', 'ON_HOLD'],
  REVIEW: ['APPROVED', 'REJECTED', 'CALCULATED', 'ON_HOLD'],
  APPROVED: ['FINANCE_POSTED', 'REOPENED'],
  FINANCE_POSTED: ['SETTLED', 'REOPENED'],
  SETTLED: ['CLOSED', 'REOPENED'],
  CLOSED: ['REOPENED'],
  ON_HOLD: ['CLEARANCE_PENDING', 'CANCELLED'],
  REJECTED: ['CLEARANCE_PENDING', 'CANCELLED'],
  CANCELLED: [],
  REOPENED: ['CLEARANCE_PENDING'],
};

export const CLEARANCE_DOMAINS = [
  'DEPARTMENT',
  'HR',
  'FINANCE',
  'LIBRARY',
  'HOSTEL',
  'TRANSPORT',
  'ASSET',
  'IT',
  'OTHER',
] as const;

export type ClearanceDomain = (typeof CLEARANCE_DOMAINS)[number];

export const CLEARANCE_STATUSES = ['PENDING', 'CLEARED', 'DUE', 'WAIVED', 'NOT_APPLICABLE'] as const;
export type ClearanceStatus = (typeof CLEARANCE_STATUSES)[number];

export const FNF_SNAPSHOT_VERSION = '1';

export const createFnfCaseSchema = z.object({
  separationRequestId: z.number().int().positive(),
});

export const clearanceDecisionSchema = z.object({
  status: z.enum(CLEARANCE_STATUSES),
  remarks: z.string().trim().max(2000).optional(),
  dueAmount: z.number().optional(),
  waive: z.boolean().optional(),
  override: z.boolean().optional(),
  overrideReason: z.string().trim().min(5).max(2000).optional(),
});

export const noticeWaiverSchema = z.object({
  waived: z.boolean(),
  reason: z.string().trim().min(3).max(2000),
});

export const fnfAdjustmentSchema = z.object({
  side: z.enum(['PAYABLE', 'RECOVERY']),
  code: z.string().trim().min(1).max(32).default('MANUAL'),
  amount: z.number().positive(),
  reason: z.string().trim().min(5).max(500),
  supportingReference: z.string().trim().max(128).optional(),
});

export const fnfRejectSchema = z.object({
  reason: z.string().trim().min(5).max(2000),
});

export const fnfReopenSchema = z.object({
  reason: z.string().trim().min(5).max(2000),
});

export const fnfHoldSchema = z.object({
  reason: z.string().trim().min(3).max(2000),
});

export const fnfAssetItemSchema = z.object({
  itemCode: z.string().trim().min(1).max(32),
  itemName: z.string().trim().min(1).max(128),
  recoveryAmount: z.number().min(0).optional(),
});

export const employeeFinanceDueSchema = z.object({
  employeeId: z.number().int().positive(),
  dueType: z.enum(['LOAN', 'ADVANCE', 'MISC', 'ASSET', 'OTHER']),
  amount: z.number().positive(),
  sourceRef: z.string().trim().max(64).optional(),
  remarks: z.string().trim().max(500).optional(),
});

export type FnfComponentInput = {
  side: 'PAYABLE' | 'RECOVERY';
  code: string;
  name: string;
  source: string;
  basis?: string | null;
  quantity?: number | null;
  rate?: string | null;
  amount: string;
  ruleReference?: string | null;
  sourceRef?: string | null;
  trace?: Record<string, unknown>;
};
