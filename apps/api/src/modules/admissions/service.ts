import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import type { Knex } from 'knex';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { getPasswordError, PASSWORD_MIN_LENGTH } from '../../utils/password.js';
import { signToken } from '../../utils/token.js';
import { toMoney } from '../finance/money.js';
import { createAdmissionApplicantDemand, getAdmissionApplicantDemand } from '../finance/demands.js';
import { generateReceipt } from '../finance/receipts.js';
import { assertAdmissionPermission, assertApplicantVisible, assertDocumentVisible } from './access.js';
import { auditFromActor } from './audit.js';
import { notifyApplicant, notifyAdmissionsStaff } from './notify.js';
import { notifyStudent } from '../academicClasses/studentNotifications.js';
import type { AdmissionActor, EligibilityExplanation } from './types.js';

const statuses = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_VERIFICATION',
  'DOCUMENTS_PENDING',
  'ELIGIBILITY_REVIEW',
  'ELIGIBLE',
  'INELIGIBLE',
  'NEEDS_REVIEW',
  'SELECTED',
  'WAITLISTED',
  'OFFERED',
  'PAYMENT_PENDING',
  'ADMISSION_CONFIRMED',
  'CONVERTED_TO_STUDENT',
  'CANCELLED',
  'WITHDRAWN',
] as const;

export const cycleSchema = z.object({
  name: z.string().trim().min(2).max(255),
  academicYearId: z.number().int().positive(),
  applicationStart: z.string().optional().nullable(),
  applicationEnd: z.string().optional().nullable(),
  admissionStart: z.string().optional().nullable(),
  admissionEnd: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED']).default('DRAFT'),
});

export const intakeSchema = z.object({
  cycleId: z.number().int().positive(),
  academicYearId: z.number().int().positive(),
  programId: z.number().int().positive(),
  departmentId: z.number().int().positive().optional().nullable(),
  schemeId: z.number().int().positive().optional().nullable(),
  semesterId: z.number().int().positive().optional().nullable(),
  classSectionId: z.number().int().positive().optional().nullable(),
  category: z.string().trim().max(64).optional().nullable(),
  approvedIntake: z.number().int().positive(),
});

export const enquirySchema = z.object({
  cycleId: z.number().int().positive().optional().nullable(),
  name: z.string().trim().min(2).max(255),
  phone: z.string().trim().max(32).optional().nullable(),
  email: z.string().email().optional().nullable(),
  interestedProgramId: z.number().int().positive().optional().nullable(),
  source: z.enum(['WEBSITE', 'WALK_IN', 'PHONE', 'REFERRAL', 'EVENT', 'SOCIAL', 'OTHER']).default('OTHER'),
  assignedTo: z.number().int().positive().optional().nullable(),
  nextFollowUp: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const applicantSchema = z.object({
  cycleId: z.number().int().positive(),
  enquiryId: z.number().int().positive().optional().nullable(),
  name: z.string().trim().min(2).max(255),
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  phone: z.string().trim().max(32).optional().nullable(),
  profile: z.record(z.unknown()).optional().nullable(),
  address: z.record(z.unknown()).optional().nullable(),
  guardian: z.record(z.unknown()).optional().nullable(),
  password: z.string().optional(),
  admissionCategory: z.string().trim().max(64).optional().nullable(),
  education: z.array(z.object({
    qualification: z.string().trim().min(1).max(128),
    institution: z.string().trim().max(255).optional().nullable(),
    boardUniversity: z.string().trim().max(255).optional().nullable(),
    yearOfPassing: z.number().int().min(1900).max(2200).optional().nullable(),
    registrationNumber: z.string().trim().max(128).optional().nullable(),
    marksPercentage: z.number().min(0).max(100).optional().nullable(),
    cgpa: z.number().min(0).max(10).optional().nullable(),
    subjects: z.array(z.object({
      name: z.string(),
      marks: z.number().optional().nullable(),
    })).optional().nullable(),
  })).default([]),
  preferences: z.array(z.object({
    programId: z.number().int().positive(),
    preferenceOrder: z.number().int().positive().default(1),
  })).min(1),
});

export const applicantLoginSchema = z.object({
  applicationNumber: z.string().trim().min(3).max(64),
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1),
});

export const documentRequirementSchema = z.object({
  cycleId: z.number().int().positive(),
  programId: z.number().int().positive().optional().nullable(),
  category: z.string().trim().max(64).optional().nullable(),
  documentCode: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(255),
  isRequired: z.boolean().default(true),
  allowedMimeTypes: z.array(z.string()).optional().nullable(),
  maxSizeBytes: z.number().int().positive().optional().nullable(),
});

export const documentUploadSchema = z.object({
  requirementId: z.number().int().positive().optional().nullable(),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(128),
  fileSizeBytes: z.number().int().positive(),
  storageKey: z.string().trim().min(8).max(512),
});

export const eligibilityRuleSchema = z.object({
  cycleId: z.number().int().positive(),
  programId: z.number().int().positive().optional().nullable(),
  ruleType: z.enum(['MIN_PERCENTAGE', 'SUBJECTS', 'DOCUMENTS']).default('MIN_PERCENTAGE'),
  minPercentage: z.number().min(0).max(100).optional().nullable(),
  requiredSubjects: z.array(z.string()).optional().nullable(),
  verifiedDocumentsRequired: z.boolean().default(true),
});

export const selectionSchema = z.object({
  programId: z.number().int().positive(),
  intakeId: z.number().int().positive().optional().nullable(),
  status: z.enum(['SELECTED', 'WAITLISTED', 'NOT_SELECTED']),
  waitlistRank: z.number().int().positive().optional().nullable(),
  meritScore: z.number().optional().nullable(),
  meritExplanation: z.record(z.unknown()).optional().nullable(),
  remarks: z.string().max(2000).optional().nullable(),
});

export const offerSchema = z.object({
  programId: z.number().int().positive(),
  offerDate: z.string().default(() => new Date().toISOString().slice(0, 10)),
  expiresAt: z.string().optional().nullable(),
  conditions: z.string().max(3000).optional().nullable(),
});

export const confirmSchema = z.object({
  intakeId: z.number().int().positive(),
});

export const admissionDemandSchema = z.object({
  feeHeadId: z.number().int().positive(),
  amount: z.number().positive(),
  dueDate: z.string().optional().nullable(),
});

export const overrideEligibilitySchema = z.object({
  status: z.enum(['ELIGIBLE', 'INELIGIBLE', 'NEEDS_REVIEW']),
  reason: z.string().trim().min(8).max(2000),
});

function today() {
  return new Date().toISOString().slice(0, 10);
}

function json(value: unknown) {
  return value == null ? null : JSON.stringify(value);
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'object') return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

async function nextApplicationNumber(trx: Knex.Transaction, collegeId: number, cycleId: number) {
  const cycle = await trx('admission_cycles as c')
    .join('colleges as col', 'col.id', 'c.college_id')
    .where({ 'c.id': cycleId, 'c.college_id': collegeId })
    .select('c.id', 'col.code')
    .first();
  if (!cycle) throw new AppError(404, 'Admission cycle not found');
  const count = await trx('admission_applicants')
    .where({ college_id: collegeId, cycle_id: cycleId })
    .count({ c: '*' })
    .first();
  const seq = String(Number(count?.c ?? 0) + 1).padStart(5, '0');
  return `${String(cycle.code).toUpperCase()}/ADM/${cycleId}/${seq}`;
}

async function nextAdmissionNumber(trx: Knex.Transaction, collegeId: number) {
  const college = await trx('colleges').where({ id: collegeId }).first();
  if (!college) throw new AppError(404, 'College not found');
  const year = new Date().getFullYear();
  const count = await trx('admission_student_conversions')
    .where({ college_id: collegeId })
    .whereRaw('admission_number LIKE ?', [`${String(college.code).toUpperCase()}/ADN/${year}/%`])
    .count({ c: '*' })
    .first();
  return `${String(college.code).toUpperCase()}/ADN/${year}/${String(Number(count?.c ?? 0) + 1).padStart(5, '0')}`;
}

export async function createCycle(actor: AdmissionActor, input: z.infer<typeof cycleSchema>) {
  assertAdmissionPermission(actor, 'admissions.config.manage');
  const [id] = await db('admission_cycles').insert({
    college_id: actor.collegeId,
    academic_year_id: input.academicYearId,
    name: input.name,
    application_start: input.applicationStart ?? null,
    application_end: input.applicationEnd ?? null,
    admission_start: input.admissionStart ?? null,
    admission_end: input.admissionEnd ?? null,
    status: input.status,
    created_by: actor.facultyUserId ?? null,
  });
  await auditFromActor(actor, 'CYCLE_CREATED', 'admission_cycle', Number(id));
  return db('admission_cycles').where({ id }).first();
}

export async function createIntake(actor: AdmissionActor, input: z.infer<typeof intakeSchema>) {
  assertAdmissionPermission(actor, 'admissions.config.manage');
  const cycle = await db('admission_cycles').where({ id: input.cycleId, college_id: actor.collegeId }).first();
  if (!cycle) throw new AppError(404, 'Admission cycle not found');
  const [id] = await db('admission_program_intakes').insert({
    college_id: actor.collegeId,
    cycle_id: input.cycleId,
    academic_year_id: input.academicYearId,
    program_id: input.programId,
    department_id: input.departmentId ?? null,
    scheme_id: input.schemeId ?? null,
    semester_id: input.semesterId ?? null,
    class_section_id: input.classSectionId ?? null,
    category: input.category ?? null,
    approved_intake: input.approvedIntake,
  });
  await auditFromActor(actor, 'INTAKE_CREATED', 'admission_program_intake', Number(id));
  return db('admission_program_intakes').where({ id }).first();
}

export async function createEnquiry(actor: AdmissionActor, input: z.infer<typeof enquirySchema>) {
  assertAdmissionPermission(actor, 'admissions.enquiry.manage');
  const [id] = await db('admission_enquiries').insert({
    college_id: actor.collegeId,
    cycle_id: input.cycleId ?? null,
    name: input.name,
    phone: input.phone ?? null,
    email: input.email?.trim().toLowerCase() ?? null,
    interested_program_id: input.interestedProgramId ?? null,
    source: input.source,
    assigned_to: input.assignedTo ?? actor.facultyUserId ?? null,
    next_follow_up: input.nextFollowUp ?? null,
    notes: input.notes ?? null,
  });
  await auditFromActor(actor, 'ENQUIRY_CREATED', 'admission_enquiry', Number(id));
  return db('admission_enquiries').where({ id }).first();
}

export async function createApplicant(actor: AdmissionActor, input: z.infer<typeof applicantSchema>) {
  assertAdmissionPermission(actor, 'admissions.application.manage');
  return db.transaction(async (trx) => {
    const applicationNumber = await nextApplicationNumber(trx, actor.collegeId, input.cycleId);
    const passwordHash = input.password ? await bcrypt.hash(input.password, 10) : null;
    const [id] = await trx('admission_applicants').insert({
      college_id: actor.collegeId,
      cycle_id: input.cycleId,
      enquiry_id: input.enquiryId ?? null,
      application_number: applicationNumber,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      profile_json: json(input.profile),
      address_json: json(input.address),
      guardian_json: json(input.guardian),
      password_hash: passwordHash,
      portal_status: 'ACTIVE',
      admission_category: input.admissionCategory ?? null,
    });
    for (const edu of input.education) {
      await trx('admission_applicant_education').insert({
        applicant_id: id,
        college_id: actor.collegeId,
        qualification: edu.qualification,
        institution: edu.institution ?? null,
        board_university: edu.boardUniversity ?? null,
        year_of_passing: edu.yearOfPassing ?? null,
        registration_number: edu.registrationNumber ?? null,
        marks_percentage: edu.marksPercentage ?? null,
        cgpa: edu.cgpa ?? null,
        subjects_json: json(edu.subjects ?? []),
      });
    }
    for (const pref of input.preferences) {
      await trx('admission_program_preferences').insert({
        applicant_id: id,
        college_id: actor.collegeId,
        program_id: pref.programId,
        preference_order: pref.preferenceOrder,
      });
    }
    if (input.enquiryId) {
      await trx('admission_enquiries').where({ id: input.enquiryId, college_id: actor.collegeId }).update({
        status: 'CONVERTED',
        converted_applicant_id: id,
        updated_at: trx.fn.now(),
      });
    }
    await auditFromActor(actor, input.enquiryId ? 'ENQUIRY_CONVERTED_TO_APPLICANT' : 'APPLICANT_CREATED', 'admission_applicant', Number(id), {
      after: { applicationNumber },
    });
    return trx('admission_applicants').where({ id }).first();
  });
}

export async function applicantLogin(input: z.infer<typeof applicantLoginSchema>) {
  const applicant = await db('admission_applicants')
    .where({ application_number: input.applicationNumber, email: input.email })
    .first();
  if (!applicant || applicant.portal_status === 'DISABLED' || !applicant.password_hash) {
    throw new AppError(401, 'Invalid applicant credentials');
  }
  const ok = await bcrypt.compare(input.password, String(applicant.password_hash));
  if (!ok) throw new AppError(401, 'Invalid applicant credentials');
  const user = {
    id: Number(applicant.id),
    kind: 'applicant' as const,
    name: String(applicant.name),
    email: String(applicant.email),
    role: 'APPLICANT',
    collegeId: Number(applicant.college_id),
    departmentId: null,
  };
  const token = signToken({
    kind: 'applicant',
    applicantId: Number(applicant.id),
    collegeId: Number(applicant.college_id),
    role: 'APPLICANT',
    email: String(applicant.email),
    name: String(applicant.name),
  });
  return { token, user };
}

export async function applicantMe(actor: AdmissionActor) {
  if (actor.kind !== 'APPLICANT' || !actor.applicantId) throw new AppError(403, 'Applicant access required');
  const applicant = await db('admission_applicants').where({ id: actor.applicantId, college_id: actor.collegeId }).first();
  if (!applicant) throw new AppError(404, 'Applicant not found');
  return {
    id: Number(applicant.id),
    kind: 'applicant' as const,
    name: String(applicant.name),
    email: String(applicant.email),
    role: 'APPLICANT',
    collegeId: Number(applicant.college_id),
    departmentId: null,
  };
}

export async function submitApplication(actor: AdmissionActor, applicantId: number) {
  if (actor.kind !== 'APPLICANT') {
    assertAdmissionPermission(actor, 'admissions.application.manage');
  }
  const applicant = await assertApplicantVisible(actor, applicantId);
  if (!['DRAFT', 'DOCUMENTS_PENDING'].includes(String(applicant.status))) {
    throw new AppError(400, `Cannot submit application from ${applicant.status}`);
  }
  await db('admission_applicants').where({ id: applicantId }).update({
    status: 'SUBMITTED',
    submitted_at: db.fn.now(),
    updated_at: db.fn.now(),
  });
  await auditFromActor(actor, 'APPLICATION_SUBMITTED', 'admission_applicant', applicantId, { before: applicant });
  await notifyApplicant({
    collegeId: applicant.college_id,
    applicantId,
    type: 'APPLICATION_SUBMITTED',
    title: 'Application submitted',
    body: `Your application ${applicant.application_number} has been submitted and is now under review.`,
    link: '/admissions/portal',
    relatedType: 'admission_applicant',
    relatedId: applicantId,
    dedupeKey: `submitted:${applicantId}`,
  });
  await notifyAdmissionsStaff(applicant.college_id, {
    type: 'ADMISSION_APPLICATION_SUBMITTED',
    title: `New application to review: ${applicant.application_number}`,
    link: `/admissions/applications/${applicantId}`,
    relatedType: 'admission_applicant',
    relatedId: applicantId,
    dedupeSuffix: `submitted:${applicantId}`,
  });
  return db('admission_applicants').where({ id: applicantId }).first();
}

export async function createDocumentRequirement(actor: AdmissionActor, input: z.infer<typeof documentRequirementSchema>) {
  assertAdmissionPermission(actor, 'admissions.config.manage');
  const [id] = await db('admission_document_requirements').insert({
    college_id: actor.collegeId,
    cycle_id: input.cycleId,
    program_id: input.programId ?? null,
    category: input.category ?? null,
    document_code: input.documentCode,
    name: input.name,
    is_required: input.isRequired,
    allowed_mime_types: json(input.allowedMimeTypes ?? null),
    max_size_bytes: input.maxSizeBytes ?? null,
  });
  await auditFromActor(actor, 'DOCUMENT_REQUIREMENT_CREATED', 'admission_document_requirement', Number(id));
  return db('admission_document_requirements').where({ id }).first();
}

export async function uploadDocument(actor: AdmissionActor, applicantId: number, input: z.infer<typeof documentUploadSchema>) {
  await assertApplicantVisible(actor, applicantId);
  const req = input.requirementId
    ? await db('admission_document_requirements').where({ id: input.requirementId, college_id: actor.collegeId }).first()
    : null;
  if (input.requirementId && !req) throw new AppError(404, 'Document requirement not found');
  if (req?.allowed_mime_types) {
    const allowed = parseJson<string[]>(req.allowed_mime_types, []);
    if (allowed.length && !allowed.includes(input.mimeType)) throw new AppError(400, 'This file type is not allowed');
  }
  if (req?.max_size_bytes && input.fileSizeBytes > Number(req.max_size_bytes)) {
    throw new AppError(400, 'This file is larger than the allowed size');
  }
  const previous = input.requirementId
    ? await db('admission_documents')
        .where({ applicant_id: applicantId, requirement_id: input.requirementId })
        .orderBy('version', 'desc')
        .first()
    : null;
  const [id] = await db('admission_documents').insert({
    college_id: actor.collegeId,
    applicant_id: applicantId,
    requirement_id: input.requirementId ?? null,
    version: previous ? Number(previous.version) + 1 : 1,
    file_name: input.fileName,
    mime_type: input.mimeType,
    file_size_bytes: input.fileSizeBytes,
    storage_key: input.storageKey,
    verification_status: 'PENDING',
  });
  await auditFromActor(actor, previous ? 'DOCUMENT_RESUBMITTED' : 'DOCUMENT_UPLOADED', 'admission_document', Number(id), {
    after: { applicantId, requirementId: input.requirementId ?? null },
  });
  return db('admission_documents').where({ id }).first();
}

export async function verifyDocument(actor: AdmissionActor, documentId: number, status: 'VERIFIED' | 'REJECTED' | 'RESUBMISSION_REQUIRED', remarks?: string | null) {
  assertAdmissionPermission(actor, 'admissions.document.verify');
  const before = await assertDocumentVisible(actor, documentId);
  await db.transaction(async (trx) => {
    await trx('admission_documents').where({ id: documentId }).update({
      verification_status: status,
      verified_by: actor.facultyUserId ?? null,
      verified_at: trx.fn.now(),
      remarks: remarks ?? null,
      updated_at: trx.fn.now(),
    });
    await trx('admission_document_verification_history').insert({
      college_id: actor.collegeId,
      document_id: documentId,
      from_status: before.verification_status,
      to_status: status,
      actor_id: actor.facultyUserId ?? null,
      remarks: remarks ?? null,
    });
    if (status !== 'VERIFIED') {
      await trx('admission_applicants').where({ id: before.applicant_id }).update({
        status: 'DOCUMENTS_PENDING',
        updated_at: trx.fn.now(),
      });
    }
  });
  await auditFromActor(actor, 'DOCUMENT_VERIFIED', 'admission_document', documentId, {
    before,
    after: { status, remarks },
    reason: remarks ?? null,
  });
  if (status !== 'VERIFIED') {
    // Applicant-facing action-required notice. Never include document contents
    // or storage keys — only the requirement outcome and any reviewer remark.
    await notifyApplicant({
      collegeId: actor.collegeId,
      applicantId: Number(before.applicant_id),
      type: status === 'REJECTED' ? 'DOCUMENT_REJECTED' : 'DOCUMENT_RESUBMISSION_REQUESTED',
      title: status === 'REJECTED' ? 'A document was rejected' : 'Document resubmission requested',
      body: `Action is required on one of your submitted documents.${remarks ? ` Reviewer note: ${remarks}` : ''}`,
      link: '/admissions/portal/documents',
      relatedType: 'admission_document',
      relatedId: documentId,
      dedupeKey: `doc:${documentId}:${status}`,
    });
  }
  return db('admission_documents').where({ id: documentId }).first();
}

export async function createEligibilityRule(actor: AdmissionActor, input: z.infer<typeof eligibilityRuleSchema>) {
  assertAdmissionPermission(actor, 'admissions.config.manage');
  const [id] = await db('admission_eligibility_rules').insert({
    college_id: actor.collegeId,
    cycle_id: input.cycleId,
    program_id: input.programId ?? null,
    rule_type: input.ruleType,
    min_percentage: input.minPercentage ?? null,
    required_subjects: json(input.requiredSubjects ?? []),
    verified_documents_required: input.verifiedDocumentsRequired,
  });
  await auditFromActor(actor, 'ELIGIBILITY_RULE_CREATED', 'admission_eligibility_rule', Number(id));
  return db('admission_eligibility_rules').where({ id }).first();
}

async function primaryPreference(applicantId: number, trx = db) {
  return trx('admission_program_preferences').where({ applicant_id: applicantId }).orderBy('preference_order').first();
}

export async function evaluateEligibility(actor: AdmissionActor, applicantId: number) {
  assertAdmissionPermission(actor, 'admissions.eligibility.evaluate');
  const applicant = await assertApplicantVisible(actor, applicantId);
  const pref = await primaryPreference(applicantId);
  if (!pref) throw new AppError(400, 'Applicant has no program preference');
  const rules = await db('admission_eligibility_rules')
    .where({ college_id: actor.collegeId, cycle_id: applicant.cycle_id, is_active: true })
    .andWhere(function () {
      this.whereNull('program_id').orWhere('program_id', pref.program_id);
    });
  const educations = await db('admission_applicant_education').where({ applicant_id: applicantId });
  const docs = await db('admission_documents').where({ applicant_id: applicantId });
  const requiredDocs = await db('admission_document_requirements')
    .where({ college_id: actor.collegeId, cycle_id: applicant.cycle_id, is_active: true, is_required: true })
    .andWhere(function () {
      this.whereNull('program_id').orWhere('program_id', pref.program_id);
    });

  const explanations: EligibilityExplanation[] = [];
  let hasFail = false;
  let hasReview = false;
  const bestPct = Math.max(...educations.map((e) => Number(e.marks_percentage ?? -1)), -1);
  for (const rule of rules) {
    if (rule.rule_type === 'MIN_PERCENTAGE' && rule.min_percentage != null) {
      const min = Number(rule.min_percentage);
      if (bestPct >= min) {
        explanations.push({ rule: 'MIN_PERCENTAGE', status: 'PASS', message: `Best qualifying percentage ${bestPct}% meets required minimum ${min}%.` });
      } else if (bestPct >= 0) {
        hasFail = true;
        explanations.push({ rule: 'MIN_PERCENTAGE', status: 'FAIL', message: `Best qualifying percentage ${bestPct}% is below required minimum ${min}%.` });
      } else {
        hasReview = true;
        explanations.push({ rule: 'MIN_PERCENTAGE', status: 'REVIEW', message: `Marks percentage is not available for the configured minimum ${min}%.` });
      }
    }
    if (rule.rule_type === 'SUBJECTS') {
      const required = parseJson<string[]>(rule.required_subjects, []).map((s) => s.toLowerCase());
      const seen = new Set<string>();
      for (const edu of educations) {
        for (const subject of parseJson<Array<{ name?: string }>>(edu.subjects_json, [])) {
          if (subject.name) seen.add(subject.name.toLowerCase());
        }
      }
      const missing = required.filter((s) => !seen.has(s));
      if (missing.length) {
        hasReview = true;
        explanations.push({ rule: 'SUBJECTS', status: 'REVIEW', message: `Required subjects need review: ${missing.join(', ')}.` });
      } else {
        explanations.push({ rule: 'SUBJECTS', status: 'PASS', message: `Required subjects are present: ${required.join(', ')}.` });
      }
    }
  }
  if (rules.some((r) => r.verified_documents_required) || !rules.length) {
    const missing = requiredDocs.filter((req) => !docs.some((d) => Number(d.requirement_id) === Number(req.id) && d.verification_status === 'VERIFIED'));
    if (missing.length) {
      hasReview = true;
      explanations.push({ rule: 'DOCUMENTS', status: 'REVIEW', message: `Required verified documents pending: ${missing.map((m) => m.name).join(', ')}.` });
    } else {
      explanations.push({ rule: 'DOCUMENTS', status: 'PASS', message: 'All configured required documents are verified.' });
    }
  }
  const status = hasFail ? 'INELIGIBLE' : hasReview ? 'NEEDS_REVIEW' : 'ELIGIBLE';
  const [decisionId] = await db('admission_eligibility_decisions').insert({
    college_id: actor.collegeId,
    applicant_id: applicantId,
    status,
    explanation_json: json(explanations),
    evaluated_by: actor.facultyUserId ?? null,
  });
  await db('admission_applicants').where({ id: applicantId }).update({ status, updated_at: db.fn.now() });
  await auditFromActor(actor, 'ELIGIBILITY_EVALUATED', 'admission_applicant', applicantId, { after: { status, explanations } });
  await notifyApplicant({
    collegeId: actor.collegeId,
    applicantId,
    type: 'ELIGIBILITY_OUTCOME',
    title: `Eligibility outcome: ${status}`,
    body: `Your eligibility has been evaluated. Current status: ${status}.`,
    link: '/admissions/portal',
    relatedType: 'admission_eligibility_decision',
    relatedId: Number(decisionId),
    dedupeKey: `eligibility:${decisionId}`,
  });
  return db('admission_eligibility_decisions').where({ id: decisionId }).first();
}

export async function overrideEligibility(actor: AdmissionActor, applicantId: number, input: z.infer<typeof overrideEligibilitySchema>) {
  assertAdmissionPermission(actor, 'admissions.eligibility.override');
  await assertApplicantVisible(actor, applicantId);
  const explanation = [{ rule: 'MANUAL_OVERRIDE', status: 'PASS', message: input.reason }];
  const [id] = await db('admission_eligibility_decisions').insert({
    college_id: actor.collegeId,
    applicant_id: applicantId,
    status: input.status,
    explanation_json: json(explanation),
    evaluated_by: actor.facultyUserId ?? null,
    is_override: true,
    override_reason: input.reason,
  });
  await db('admission_applicants').where({ id: applicantId }).update({ status: input.status, updated_at: db.fn.now() });
  await auditFromActor(actor, 'ELIGIBILITY_OVERRIDDEN', 'admission_applicant', applicantId, { after: input, reason: input.reason });
  await notifyApplicant({
    collegeId: actor.collegeId,
    applicantId,
    type: 'ELIGIBILITY_OUTCOME',
    title: `Eligibility outcome: ${input.status}`,
    body: `Your eligibility status has been updated to ${input.status}.`,
    link: '/admissions/portal',
    relatedType: 'admission_eligibility_decision',
    relatedId: Number(id),
    dedupeKey: `eligibility:${id}`,
  });
  return db('admission_eligibility_decisions').where({ id }).first();
}

export async function selectApplicant(actor: AdmissionActor, applicantId: number, input: z.infer<typeof selectionSchema>) {
  assertAdmissionPermission(actor, 'admissions.selection.manage');
  const applicant = await assertApplicantVisible(actor, applicantId);
  if (!['ELIGIBLE', 'NEEDS_REVIEW', 'WAITLISTED'].includes(String(applicant.status))) {
    throw new AppError(400, 'Only eligible or reviewed candidates can enter selection workflow');
  }
  await db.transaction(async (trx) => {
    const existing = await trx('admission_selections').where({ applicant_id: applicantId }).first();
    if (existing?.intake_id && existing.status === 'SELECTED') {
      await trx('admission_program_intakes').where({ id: existing.intake_id }).decrement('selected_count', 1);
    }
    if (existing) {
      await trx('admission_selections').where({ id: existing.id }).update({
        program_id: input.programId,
        intake_id: input.intakeId ?? null,
        status: input.status,
        waitlist_rank: input.waitlistRank ?? null,
        merit_score: input.meritScore ?? null,
        merit_explanation: json(input.meritExplanation),
        selected_by: actor.facultyUserId ?? null,
        remarks: input.remarks ?? null,
        updated_at: trx.fn.now(),
      });
    } else {
      await trx('admission_selections').insert({
        college_id: actor.collegeId,
        applicant_id: applicantId,
        program_id: input.programId,
        intake_id: input.intakeId ?? null,
        status: input.status,
        waitlist_rank: input.waitlistRank ?? null,
        merit_score: input.meritScore ?? null,
        merit_explanation: json(input.meritExplanation),
        selected_by: actor.facultyUserId ?? null,
        remarks: input.remarks ?? null,
      });
    }
    if (input.status === 'SELECTED' && input.intakeId) {
      await trx('admission_program_intakes').where({ id: input.intakeId, college_id: actor.collegeId }).increment('selected_count', 1);
    }
    await trx('admission_applicants').where({ id: applicantId }).update({
      status: input.status === 'SELECTED' ? 'SELECTED' : input.status === 'WAITLISTED' ? 'WAITLISTED' : 'INELIGIBLE',
      updated_at: trx.fn.now(),
    });
  });
  await auditFromActor(actor, 'SELECTION_UPDATED', 'admission_applicant', applicantId, { after: input });
  if (input.status === 'SELECTED') {
    await notifyApplicant({
      collegeId: actor.collegeId,
      applicantId,
      type: 'SELECTION_RESULT',
      title: 'You have been selected',
      body: 'Congratulations — you have been selected. Please watch for your admission offer.',
      link: '/admissions/portal',
      relatedType: 'admission_applicant',
      relatedId: applicantId,
      dedupeKey: `selected:${applicantId}`,
    });
  } else if (input.status === 'WAITLISTED') {
    await notifyApplicant({
      collegeId: actor.collegeId,
      applicantId,
      type: 'WAITLISTED',
      title: 'You have been waitlisted',
      body: `You have been placed on the waitlist${input.waitlistRank ? ` (rank ${input.waitlistRank})` : ''}. We will notify you if a seat becomes available.`,
      link: '/admissions/portal',
      relatedType: 'admission_applicant',
      relatedId: applicantId,
      dedupeKey: `waitlisted:${applicantId}:${input.waitlistRank ?? ''}`,
    });
  }
  return db('admission_selections').where({ applicant_id: applicantId }).first();
}

export async function issueOffer(actor: AdmissionActor, applicantId: number, input: z.infer<typeof offerSchema>) {
  assertAdmissionPermission(actor, 'admissions.offer.manage');
  const applicant = await assertApplicantVisible(actor, applicantId);
  if (!['SELECTED', 'OFFERED'].includes(String(applicant.status))) throw new AppError(400, 'Only selected candidates can receive offers');
  const existing = await db('admission_offers').where({ applicant_id: applicantId }).first();
  if (existing) {
    await db('admission_offers').where({ id: existing.id }).update({
      program_id: input.programId,
      offer_date: input.offerDate,
      expires_at: input.expiresAt ?? null,
      conditions: input.conditions ?? null,
      status: 'OFFERED',
      updated_at: db.fn.now(),
    });
  } else {
    await db('admission_offers').insert({
      college_id: actor.collegeId,
      applicant_id: applicantId,
      program_id: input.programId,
      offer_date: input.offerDate,
      expires_at: input.expiresAt ?? null,
      conditions: input.conditions ?? null,
      created_by: actor.facultyUserId ?? null,
    });
  }
  await db('admission_applicants').where({ id: applicantId }).update({ status: 'OFFERED', updated_at: db.fn.now() });
  await auditFromActor(actor, 'OFFER_ISSUED', 'admission_applicant', applicantId, { after: input });
  await notifyApplicant({
    collegeId: actor.collegeId,
    applicantId,
    type: 'OFFER_ISSUED',
    title: 'Admission offer issued',
    body: `An admission offer has been issued to you (offer date ${input.offerDate}). Please review and complete the admission fee to confirm your seat.`,
    link: '/admissions/portal/offer',
    relatedType: 'admission_applicant',
    relatedId: applicantId,
    dedupeKey: `offer:${applicantId}:${input.offerDate}`,
  });
  return db('admission_offers').where({ applicant_id: applicantId }).first();
}

async function latestEligibility(applicantId: number, trx: Knex.Transaction) {
  return trx('admission_eligibility_decisions').where({ applicant_id: applicantId }).orderBy('evaluated_at', 'desc').first();
}

async function assertConfirmationGate(trx: Knex.Transaction, applicant: Record<string, unknown>, intakeId: number) {
  if (!['SELECTED', 'OFFERED', 'PAYMENT_PENDING', 'ADMISSION_CONFIRMED', 'CONVERTED_TO_STUDENT'].includes(String(applicant.status))) {
    throw new AppError(400, 'Candidate is not selected/offered for admission');
  }
  if (!applicant.submitted_at) throw new AppError(400, 'Application has not been submitted');
  const selection = await trx('admission_selections').where({ applicant_id: applicant.id, status: 'SELECTED' }).first();
  if (!selection) throw new AppError(400, 'Candidate has not been selected');
  const decision = await latestEligibility(Number(applicant.id), trx);
  if (!decision || decision.status !== 'ELIGIBLE') throw new AppError(400, 'Eligibility is not cleared');
  const reqs = await trx('admission_document_requirements')
    .where({ college_id: applicant.college_id, cycle_id: applicant.cycle_id, is_active: true, is_required: true })
    .andWhere(function () {
      this.whereNull('program_id').orWhere('program_id', selection.program_id);
    });
  const docs = await trx('admission_documents').where({ applicant_id: applicant.id });
  const missing = reqs.filter((req) => !docs.some((doc) => Number(doc.requirement_id) === Number(req.id) && doc.verification_status === 'VERIFIED'));
  if (missing.length) throw new AppError(400, 'Required admission documents are not verified', { missing: missing.map((m) => m.name) }, 'ADMISSION_GATE_BLOCKED');
  const intake = await trx('admission_program_intakes').where({ id: intakeId, college_id: applicant.college_id }).forUpdate().first();
  if (!intake) throw new AppError(404, 'Admission intake not found');
  if (Number(intake.admitted_count) >= Number(intake.approved_intake)) {
    throw new AppError(409, 'No seats are available for this intake', undefined, 'INTAKE_FULL');
  }
  if (!intake.semester_id) {
    throw new AppError(400, 'Admission intake must map to an initial semester before confirmation');
  }
  const demand = await trx('admission_finance_demands as afd')
    .join('student_fee_demands as d', 'd.id', 'afd.demand_id')
    .where({ 'afd.applicant_id': applicant.id, 'afd.college_id': applicant.college_id, 'afd.purpose': 'ADMISSION_FEE' })
    .select('d.*')
    .first();
  if (demand && Number(demand.outstanding_amount) > 0) {
    throw new AppError(400, 'Admission fee is not fully paid in Finance', {
      demandId: Number(demand.id),
      outstandingAmount: toMoney(demand.outstanding_amount),
      paymentState: demand.status,
    }, 'ADMISSION_PAYMENT_PENDING');
  }
  return { selection, intake };
}

async function activateResetForStudent(trx: Knex.Transaction, studentId: number) {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  await trx('students').where({ id: studentId }).update({
    reset_token: tokenHash,
    reset_token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    updated_at: trx.fn.now(),
  });
  return rawToken;
}

export async function confirmAdmission(actor: AdmissionActor, applicantId: number, input: z.infer<typeof confirmSchema>) {
  assertAdmissionPermission(actor, 'admissions.confirm');
  let conversion: Record<string, unknown> | undefined;
  let activationToken: string | null = null;
  await db.transaction(async (trx) => {
    const applicant = await trx('admission_applicants').where({ id: applicantId, college_id: actor.collegeId }).forUpdate().first();
    if (!applicant) throw new AppError(404, 'Applicant not found');
    const existing = await trx('admission_student_conversions').where({ applicant_id: applicantId }).first();
    if (existing) {
      conversion = existing;
      return;
    }
    const { intake } = await assertConfirmationGate(trx, applicant, input.intakeId);
    const duplicateEmail = await trx('students')
      .where({ college_id: actor.collegeId, email: String(applicant.email).toLowerCase() })
      .first();
    if (duplicateEmail) {
      throw new AppError(409, 'A canonical student already exists with this verified email', {
        studentId: Number(duplicateEmail.id),
      }, 'POTENTIAL_DUPLICATE_STUDENT');
    }
    const admissionNumber = await nextAdmissionNumber(trx, actor.collegeId);
    const hash = await bcrypt.hash(randomBytes(24).toString('hex'), 10);
    const [studentId] = await trx('students').insert({
      college_id: actor.collegeId,
      department_id: intake.department_id ?? null,
      program_id: intake.program_id,
      scheme_id: intake.scheme_id ?? null,
      academic_year_id: intake.academic_year_id,
      semester_id: intake.semester_id ?? null,
      class_section_id: intake.class_section_id ?? null,
      name: applicant.name,
      usn: null,
      admission_number: admissionNumber,
      email: String(applicant.email).toLowerCase(),
      phone: applicant.phone ?? null,
      password_hash: hash,
      is_active: true,
      profile_completed_at: trx.fn.now(),
    });
    const [registrationId] = await trx('student_semester_registrations').insert({
      college_id: actor.collegeId,
      student_id: studentId,
      academic_year_id: intake.academic_year_id,
      program_id: intake.program_id,
      department_id: intake.department_id ?? null,
      semester_id: intake.semester_id,
      scheme_id: intake.scheme_id ?? null,
      class_section_id: intake.class_section_id ?? null,
      status: 'ACTIVE',
    });
    const academicClass = await trx('academic_classes')
      .where({
        college_id: actor.collegeId,
        academic_year_id: intake.academic_year_id,
        program_id: intake.program_id,
        semester_id: intake.semester_id,
      })
      .modify((q) => {
        if (intake.class_section_id) q.andWhere('class_section_id', intake.class_section_id);
      })
      .first();
    if (academicClass) {
      await trx('academic_class_enrollments').insert({
        college_id: actor.collegeId,
        student_id: studentId,
        academic_class_id: academicClass.id,
        semester_registration_id: registrationId,
        status: 'APPROVED',
        requested_at: trx.fn.now(),
        approved_at: trx.fn.now(),
        approved_by: actor.facultyUserId ?? null,
        remarks: 'Created by Admissions conversion',
      });
    }
    await trx('admission_seat_allocations').insert({
      college_id: actor.collegeId,
      applicant_id: applicantId,
      intake_id: input.intakeId,
      allocated_by: actor.facultyUserId ?? null,
    });
    await trx('admission_program_intakes').where({ id: input.intakeId }).increment('admitted_count', 1);
    const snapshot = {
      academicYearId: Number(intake.academic_year_id),
      programId: Number(intake.program_id),
      departmentId: intake.department_id != null ? Number(intake.department_id) : null,
      schemeId: intake.scheme_id != null ? Number(intake.scheme_id) : null,
      semesterId: intake.semester_id != null ? Number(intake.semester_id) : null,
      classSectionId: intake.class_section_id != null ? Number(intake.class_section_id) : null,
      academicClassId: academicClass ? Number(academicClass.id) : null,
    };
    const [conversionId] = await trx('admission_student_conversions').insert({
      college_id: actor.collegeId,
      applicant_id: applicantId,
      student_id: studentId,
      admission_number: admissionNumber,
      converted_by: actor.facultyUserId ?? null,
      mapping_snapshot: json(snapshot),
    });
    await trx('admission_applicants').where({ id: applicantId }).update({
      status: 'CONVERTED_TO_STUDENT',
      updated_at: trx.fn.now(),
    });
    const admissionDemandIds = await trx('admission_finance_demands')
      .where({ applicant_id: applicantId, college_id: actor.collegeId })
      .pluck('demand_id');
    if (admissionDemandIds.length) {
      await trx('student_fee_demands')
        .whereIn('id', admissionDemandIds)
        .update({ student_id: studentId, updated_at: trx.fn.now() });
      const paymentIds = await trx('payment_allocations')
        .whereIn('demand_id', admissionDemandIds)
        .pluck('payment_id');
      if (paymentIds.length) {
        await trx('student_payments')
          .whereIn('id', paymentIds)
          .update({ student_id: studentId, updated_at: trx.fn.now() });
        for (const paymentId of [...new Set(paymentIds.map((id) => Number(id)))]) {
          const payment = await trx('student_payments').where({ id: paymentId }).first();
          if (payment?.status === 'SUCCESS') {
            await generateReceipt(trx, {
              collegeId: actor.collegeId,
              studentId: Number(studentId),
              paymentId,
              actorId: actor.facultyUserId,
            });
          }
        }
      }
    }
    activationToken = await activateResetForStudent(trx, Number(studentId));
    conversion = await trx('admission_student_conversions').where({ id: conversionId }).first();
  });

  if (!conversion) throw new AppError(500, 'Admission conversion failed');
  await auditFromActor(actor, 'ADMISSION_CONFIRMED_AND_CONVERTED', 'admission_applicant', applicantId, {
    after: { conversionId: conversion.id, studentId: conversion.student_id },
  });
  // Admission confirmed (gate satisfied incl. Finance payment recognised).
  // Deduped so an idempotent retry (existing conversion) never re-notifies.
  await notifyApplicant({
    collegeId: actor.collegeId,
    applicantId,
    type: 'ADMISSION_CONFIRMED',
    title: 'Admission confirmed',
    body: 'Your admission has been confirmed. Your student account is being activated — use your activation link to set your password and sign in.',
    link: '/admissions/portal',
    relatedType: 'admission_applicant',
    relatedId: applicantId,
    dedupeKey: `admission-confirmed:${applicantId}`,
  });
  // Converted-student activation notice via the canonical student channel.
  await notifyStudent({
    studentId: Number(conversion.student_id),
    collegeId: actor.collegeId,
    type: 'STUDENT_ACTIVATION_READY',
    title: 'Welcome — activate your student account',
    body: 'Your admission is confirmed. Activate your account to access your classes and dashboard.',
    link: '/login',
    relatedType: 'admission_conversion',
    relatedId: Number(conversion.id),
    dedupeKeyOverride: `STUDENT_ACTIVATION_READY:admission_conversion:${conversion.id}`,
  });
  return { conversion, activationToken };
}

export async function createAdmissionFeeDemand(actor: AdmissionActor, applicantId: number, input: z.infer<typeof admissionDemandSchema>) {
  assertAdmissionPermission(actor, 'admissions.offer.manage');
  const applicant = await assertApplicantVisible(actor, applicantId);
  const pref = await primaryPreference(applicantId);
  if (!pref) throw new AppError(400, 'Applicant has no program preference');
  const intake = await db('admission_program_intakes')
    .where({ college_id: actor.collegeId, cycle_id: applicant.cycle_id, program_id: pref.program_id })
    .first();
  if (!intake) throw new AppError(400, 'No intake is configured for the applicant program');
  const demand = await createAdmissionApplicantDemand(actor.collegeId, {
    applicantId,
    academicYearId: Number(intake.academic_year_id),
    semesterId: intake.semester_id != null ? Number(intake.semester_id) : undefined,
    feeHeadId: input.feeHeadId,
    amount: input.amount,
    dueDate: input.dueDate ?? today(),
    createdBy: actor.facultyUserId,
  });
  await db('admission_applicants').where({ id: applicantId }).update({
    status: 'PAYMENT_PENDING',
    updated_at: db.fn.now(),
  });
  await auditFromActor(actor, 'ADMISSION_FINANCE_DEMAND_CREATED', 'admission_applicant', applicantId, {
    after: { demandId: demand.id, amount: input.amount },
  });
  // Admissions-domain "payment required" notice. Finance remains canonical for
  // the receipt / transaction notification once payment is recognised.
  await notifyApplicant({
    collegeId: actor.collegeId,
    applicantId,
    type: 'ADMISSION_FEE_DEMAND',
    title: 'Admission fee payment required',
    body: `An admission fee of ${toMoney(input.amount)} is now payable to confirm your admission. Due date ${input.dueDate ?? today()}.`,
    link: '/admissions/portal/fees',
    relatedType: 'admission_finance_demand',
    relatedId: Number(demand.id),
    dedupeKey: `demand:${demand.id}`,
  });
  return demand;
}

export async function cancelApplication(actor: AdmissionActor, applicantId: number, reason: string) {
  await assertApplicantVisible(actor, applicantId);
  const converted = await db('admission_student_conversions').where({ applicant_id: applicantId }).first();
  if (converted) throw new AppError(400, 'Converted students must use the post-admission withdrawal workflow');
  await db('admission_applicants').where({ id: applicantId }).update({
    status: 'CANCELLED',
    cancelled_at: db.fn.now(),
    cancellation_reason: reason,
    updated_at: db.fn.now(),
  });
  await auditFromActor(actor, 'APPLICATION_CANCELLED', 'admission_applicant', applicantId, { reason });
  await notifyApplicant({
    collegeId: actor.collegeId,
    applicantId,
    type: 'APPLICATION_CANCELLED',
    title: 'Application cancelled',
    body: `Your application has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
    link: '/admissions/portal',
    relatedType: 'admission_applicant',
    relatedId: applicantId,
    dedupeKey: `cancelled:${applicantId}`,
  });
  return db('admission_applicants').where({ id: applicantId }).first();
}

export async function dashboard(actor: AdmissionActor) {
  assertAdmissionPermission(actor, 'admissions.report.view');
  const pipeline = await db('admission_applicants')
    .where({ college_id: actor.collegeId })
    .select('status')
    .count({ count: '*' })
    .groupBy('status');
  const intake = await db('admission_program_intakes as i')
    .leftJoin('programs as p', 'p.id', 'i.program_id')
    .where('i.college_id', actor.collegeId)
    .select('i.id', 'p.name as program_name', 'i.approved_intake', 'i.selected_count', 'i.admitted_count')
    .orderBy('p.name');
  const actions = {
    submitted: Number((await db('admission_applicants').where({ college_id: actor.collegeId, status: 'SUBMITTED' }).count({ c: '*' }).first())?.c ?? 0),
    documentsPending: Number((await db('admission_documents').where({ college_id: actor.collegeId, verification_status: 'PENDING' }).count({ c: '*' }).first())?.c ?? 0),
    resubmissions: Number((await db('admission_documents').where({ college_id: actor.collegeId, verification_status: 'RESUBMISSION_REQUIRED' }).count({ c: '*' }).first())?.c ?? 0),
    eligibilityReview: Number((await db('admission_applicants').where({ college_id: actor.collegeId, status: 'NEEDS_REVIEW' }).count({ c: '*' }).first())?.c ?? 0),
    selectionPending: Number((await db('admission_applicants').where({ college_id: actor.collegeId, status: 'ELIGIBLE' }).count({ c: '*' }).first())?.c ?? 0),
    paymentPending: Number((await db('admission_applicants').where({ college_id: actor.collegeId, status: 'PAYMENT_PENDING' }).count({ c: '*' }).first())?.c ?? 0),
    confirmationReady: Number((await db('admission_applicants').where({ college_id: actor.collegeId, status: 'OFFERED' }).count({ c: '*' }).first())?.c ?? 0),
    conversionFailures: 0,
    seatWarnings: intake.filter((i) => Number(i.approved_intake) - Number(i.admitted_count) <= 5).length,
  };
  return {
    actionRequired: actions,
    pipeline: pipeline.map((p) => ({ status: String((p as Record<string, unknown>).status), count: Number(p.count) })),
    intake: intake.map((i) => ({
      id: Number(i.id),
      program: i.program_name,
      approvedIntake: Number(i.approved_intake),
      selected: Number(i.selected_count),
      admitted: Number(i.admitted_count),
      remaining: Number(i.approved_intake) - Number(i.admitted_count),
    })),
  };
}

export async function listApplications(actor: AdmissionActor, filters: { status?: string; cycleId?: number; programId?: number; q?: string }) {
  assertAdmissionPermission(actor, 'admissions.application.manage');
  const q = db('admission_applicants as a')
    .leftJoin('admission_program_preferences as pp', function joinPref() {
      this.on('pp.applicant_id', 'a.id').andOn('pp.preference_order', db.raw('1'));
    })
    .leftJoin('programs as p', 'p.id', 'pp.program_id')
    .leftJoin('admission_finance_demands as afd', 'afd.applicant_id', 'a.id')
    .leftJoin('student_fee_demands as d', 'd.id', 'afd.demand_id')
    .where('a.college_id', actor.collegeId)
    .select('a.id', 'a.application_number', 'a.name', 'a.email', 'a.phone', 'a.status', 'a.submitted_at', 'p.name as program_name', 'd.status as payment_state', 'd.outstanding_amount');
  if (filters.status) {
    if (!statuses.includes(filters.status as any)) throw new AppError(400, 'Invalid application status');
    q.andWhere('a.status', filters.status);
  }
  if (filters.cycleId) q.andWhere('a.cycle_id', filters.cycleId);
  if (filters.programId) q.andWhere('pp.program_id', filters.programId);
  if (filters.q) q.andWhere(function () {
    this.where('a.application_number', 'like', `%${filters.q}%`)
      .orWhere('a.name', 'like', `%${filters.q}%`)
      .orWhere('a.email', 'like', `%${filters.q}%`)
      .orWhere('a.phone', 'like', `%${filters.q}%`);
  });
  return q.orderBy('a.updated_at', 'desc').limit(100);
}

export async function getApplicationWorkspace(actor: AdmissionActor, applicantId: number) {
  const applicant = await assertApplicantVisible(actor, applicantId);
  const [education, preferences, documents, eligibility, selection, offer, conversion, audit, finance] = await Promise.all([
    db('admission_applicant_education').where({ applicant_id: applicantId }),
    db('admission_program_preferences as pp').join('programs as p', 'p.id', 'pp.program_id').where('pp.applicant_id', applicantId).select('pp.*', 'p.name as program_name'),
    db('admission_documents').where({ applicant_id: applicantId }).orderBy('requirement_id').orderBy('version', 'desc'),
    db('admission_eligibility_decisions').where({ applicant_id: applicantId }).orderBy('evaluated_at', 'desc').first(),
    db('admission_selections').where({ applicant_id: applicantId }).first(),
    db('admission_offers').where({ applicant_id: applicantId }).first(),
    db('admission_student_conversions').where({ applicant_id: applicantId }).first(),
    actor.kind === 'APPLICANT' ? Promise.resolve([]) : db('admission_audit_log').where({ entity_type: 'admission_applicant', entity_id: applicantId }).orderBy('created_at', 'desc').limit(25),
    getAdmissionApplicantDemand(applicantId, actor.collegeId),
  ]);
  return { applicant, education, preferences, documents, eligibility, selection, offer, conversion, audit, finance };
}

export function validateActivationPassword(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH) throw new AppError(400, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  const error = getPasswordError(password);
  if (error) throw new AppError(400, error);
}
