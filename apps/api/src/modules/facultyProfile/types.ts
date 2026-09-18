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
  /**
   * Departments this actor is HOD of, per the canonical Academic Leadership
   * authority (`resolveLeadershipContext`). Populated by the router's leadership
   * enrichment. When absent, access falls back to the legacy `role === 'HOD'`
   * + `departmentId` semantics so existing role-based HOD accounts and unit
   * fixtures keep working.
   */
  hodDepartmentIds?: number[];
};

// Logical profile sections (spec §B2 navigation)
export const PROFILE_SECTIONS = [
  'OVERVIEW',
  'ACADEMIC',
  'EXPERIENCE',
  'TEACHING',
  'RESEARCH',
  'PROFESSIONAL_DEVELOPMENT',
  'STUDENT_GUIDANCE',
  'INDUSTRY_CONSULTANCY',
  'INSTITUTIONAL_CONTRIBUTION',
  'AWARDS_MEMBERSHIPS',
  'EVIDENCE',
] as const;
export type ProfileSection = (typeof PROFILE_SECTIONS)[number];

// Verification lifecycle (spec §B21)
export const VERIFICATION_STATUSES = ['DRAFT', 'SUBMITTED', 'VERIFIED', 'RETURNED', 'REJECTED', 'NOT_REQUIRED'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const VERIFICATION_ACTIONS = ['SUBMIT', 'VERIFY', 'RETURN', 'REJECT', 'REOPEN'] as const;
export type VerificationAction = (typeof VERIFICATION_ACTIONS)[number];

export const AWARD_LEVELS = ['INSTITUTIONAL', 'UNIVERSITY', 'STATE', 'NATIONAL', 'INTERNATIONAL'] as const;

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

// Faculty-entered (writable) domains
export const WRITABLE_DOMAINS: Record<string, DomainConfig> = {
  QUALIFICATION: {
    domain: 'QUALIFICATION',
    label: 'Qualifications',
    section: 'ACADEMIC',
    recordTypes: ['DIPLOMA', 'UG', 'PG', 'MPHIL', 'PHD', 'POSTDOC', 'OTHER'],
    verifiable: true,
    evidenceExpected: true,
  },
  EXPERIENCE: {
    domain: 'EXPERIENCE',
    label: 'Experience',
    section: 'EXPERIENCE',
    recordTypes: ['TEACHING', 'INDUSTRY', 'RESEARCH', 'OTHER'],
    verifiable: true,
    evidenceExpected: true,
  },
  TEACHING_CONTRIBUTION: {
    domain: 'TEACHING_CONTRIBUTION',
    label: 'Teaching Contributions',
    section: 'TEACHING',
    recordTypes: [
      'INNOVATIVE_PEDAGOGY', 'ICT', 'EXPERIENTIAL', 'PROJECT_BASED', 'FLIPPED', 'CASE_STUDY',
      'SIMULATION', 'INDUSTRY_SUPPORTED', 'BEYOND_SYLLABUS', 'CONTENT_DEVELOPMENT',
    ],
    verifiable: true,
    evidenceExpected: true,
  },
  PUBLICATION: {
    domain: 'PUBLICATION',
    label: 'Publications',
    section: 'RESEARCH',
    recordTypes: ['JOURNAL', 'CONFERENCE', 'BOOK', 'BOOK_CHAPTER', 'EDITED_VOLUME', 'OTHER'],
    verifiable: true,
    evidenceExpected: true,
    uniqueRefField: 'doi',
  },
  PATENT: {
    domain: 'PATENT',
    label: 'Patents & IPR',
    section: 'RESEARCH',
    recordTypes: ['PATENT', 'COPYRIGHT', 'DESIGN', 'TRADEMARK', 'OTHER'],
    verifiable: true,
    evidenceExpected: true,
    uniqueRefField: 'applicationNumber',
  },
  PROJECT: {
    domain: 'PROJECT',
    label: 'Funded / Sponsored Projects',
    section: 'RESEARCH',
    recordTypes: ['SPONSORED', 'FUNDED', 'GRANT'],
    verifiable: true,
    evidenceExpected: true,
  },
  CONSULTANCY: {
    domain: 'CONSULTANCY',
    label: 'Consultancy & Industry Projects',
    section: 'INDUSTRY_CONSULTANCY',
    recordTypes: ['CONSULTANCY', 'INDUSTRY_PROJECT'],
    verifiable: true,
    evidenceExpected: true,
  },
  FDP: {
    domain: 'FDP',
    label: 'FDP / STTP / Workshops / Training',
    section: 'PROFESSIONAL_DEVELOPMENT',
    recordTypes: [
      'FDP', 'STTP', 'WORKSHOP', 'SEMINAR', 'TRAINING', 'REFRESHER', 'ORIENTATION',
      'CERTIFICATION_PROGRAMME', 'CONFERENCE', 'HACKATHON', 'OTHER',
    ],
    verifiable: true,
    evidenceExpected: true,
  },
  CERTIFICATION: {
    domain: 'CERTIFICATION',
    label: 'Certifications',
    section: 'PROFESSIONAL_DEVELOPMENT',
    recordTypes: ['CERTIFICATION'],
    verifiable: true,
    evidenceExpected: true,
    uniqueRefField: 'credentialId',
  },
  CONFERENCE_ROLE: {
    domain: 'CONFERENCE_ROLE',
    label: 'Conference / Expert Contributions',
    section: 'PROFESSIONAL_DEVELOPMENT',
    recordTypes: [
      'PARTICIPANT', 'PAPER_PRESENTER', 'SESSION_CHAIR', 'KEYNOTE', 'INVITED_SPEAKER',
      'RESOURCE_PERSON', 'REVIEWER', 'JURY', 'EXTERNAL_EXAMINER', 'SUBJECT_EXPERT',
      'BOARD_MEMBER', 'COMMITTEE_EXPERT',
    ],
    verifiable: true,
    evidenceExpected: false,
  },
  MEMBERSHIP: {
    domain: 'MEMBERSHIP',
    label: 'Professional Memberships',
    section: 'AWARDS_MEMBERSHIPS',
    recordTypes: ['MEMBERSHIP'],
    verifiable: true,
    evidenceExpected: true,
  },
  AWARD: {
    domain: 'AWARD',
    label: 'Awards & Recognition',
    section: 'AWARDS_MEMBERSHIPS',
    recordTypes: ['AWARD'],
    verifiable: true,
    evidenceExpected: true,
  },
  STUDENT_PROJECT: {
    domain: 'STUDENT_PROJECT',
    label: 'Student Project Guidance',
    section: 'STUDENT_GUIDANCE',
    recordTypes: ['UG', 'PG', 'CAPSTONE', 'MINI_PROJECT', 'OTHER'],
    verifiable: true,
    evidenceExpected: false,
  },
  RESEARCH_GUIDANCE: {
    domain: 'RESEARCH_GUIDANCE',
    label: 'Research Guidance',
    section: 'STUDENT_GUIDANCE',
    recordTypes: ['UG', 'PG_DISSERTATION', 'PHD', 'CO_GUIDANCE'],
    verifiable: true,
    evidenceExpected: true,
  },
  INDUSTRY_INTERACTION: {
    domain: 'INDUSTRY_INTERACTION',
    label: 'Industry Interaction',
    section: 'INDUSTRY_CONSULTANCY',
    recordTypes: [
      'VISIT', 'TRAINING', 'MOU', 'COLLAB_PROJECT', 'INTERNSHIP_COORD', 'EXPERT_INTERACTION',
      'INDUSTRY_PROBLEM', 'CONSULTANCY', 'TECH_TRANSFER', 'MENTORING', 'OTHER',
    ],
    verifiable: true,
    evidenceExpected: false,
  },
  INSTITUTIONAL_CONTRIBUTION: {
    domain: 'INSTITUTIONAL_CONTRIBUTION',
    label: 'Institutional / Extension Contribution',
    section: 'INSTITUTIONAL_CONTRIBUTION',
    recordTypes: [
      'ACCREDITATION', 'ADMISSIONS', 'EXAMINATION', 'PLACEMENT', 'ALUMNI', 'INNOVATION',
      'DEPARTMENT_ACTIVITY', 'COMMITTEE', 'STUDENT_ACTIVITY', 'OUTREACH', 'COMMUNITY',
      'SUSTAINABILITY', 'NSS', 'OTHER',
    ],
    verifiable: true,
    evidenceExpected: false,
  },
  RESPONSIBILITY: {
    domain: 'RESPONSIBILITY',
    label: 'Administrative / Academic Responsibilities',
    section: 'INSTITUTIONAL_CONTRIBUTION',
    recordTypes: [
      'NBA_COORDINATOR', 'NAAC_COORDINATOR', 'IQAC', 'EXAM_DUTY', 'PLACEMENT_COORD',
      'INTERNSHIP_COORD', 'COMMITTEE', 'CLUB', 'INNOVATION', 'OTHER',
    ],
    verifiable: true,
    evidenceExpected: true,
  },
};

// Derived (read-only) domains — projected from authoritative modules.
export const DERIVED_DOMAINS = {
  TEACHING: { domain: 'TEACHING', label: 'Teaching Assignments', section: 'TEACHING' as ProfileSection },
  MENTORING: { domain: 'MENTORING', label: 'Mentoring', section: 'STUDENT_GUIDANCE' as ProfileSection },
  COORDINATION: { domain: 'COORDINATION', label: 'Class Coordination', section: 'INSTITUTIONAL_CONTRIBUTION' as ProfileSection },
  LEADERSHIP: { domain: 'LEADERSHIP', label: 'Academic Leadership', section: 'INSTITUTIONAL_CONTRIBUTION' as ProfileSection },
} as const;

export function domainConfig(domain: string): DomainConfig | null {
  return WRITABLE_DOMAINS[domain] ?? null;
}

export function isWritableDomain(domain: string): boolean {
  return Object.prototype.hasOwnProperty.call(WRITABLE_DOMAINS, domain);
}

// ── Validation schemas ─────────────────────────────────────────────────────
const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .optional()
  .nullable();

export const identifiersSchema = z.object({
  orcid: z.string().trim().max(32).optional().nullable(),
  googleScholarId: z.string().trim().max(128).optional().nullable(),
  scopusAuthorId: z.string().trim().max(64).optional().nullable(),
  wosResearcherId: z.string().trim().max(64).optional().nullable(),
  vidwanId: z.string().trim().max(64).optional().nullable(),
  otherResearchId: z.string().trim().max(255).optional().nullable(),
  photoReference: z.string().trim().max(512).optional().nullable(),
});
export type IdentifiersInput = z.infer<typeof identifiersSchema>;

export const notApplicableSchema = z.object({
  section: z.enum(PROFILE_SECTIONS),
  notApplicable: z.boolean(),
});

export const recordCreateSchema = z.object({
  domain: z.string().refine((d) => isWritableDomain(d), 'Unknown or non-writable domain'),
  recordType: z.string().trim().max(48).optional().nullable(),
  title: z.string().trim().min(1).max(512),
  academicYearId: z.number().int().positive().optional().nullable(),
  academicYearLabel: z.string().trim().max(32).optional().nullable(),
  startDate: optionalDate,
  endDate: optionalDate,
  isCurrent: z.boolean().optional(),
  category: z.string().trim().max(64).optional().nullable(),
  level: z.string().trim().max(32).optional().nullable(),
  status: z.string().trim().max(32).optional().nullable(),
  roleLabel: z.string().trim().max(128).optional().nullable(),
  details: z.record(z.string(), z.unknown()).optional().nullable(),
});
export type RecordCreateInput = z.infer<typeof recordCreateSchema>;

export const recordUpdateSchema = recordCreateSchema.partial().omit({ domain: true });

export const evidenceMetaSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(128),
  fileSize: z.number().int().nonnegative().max(25 * 1024 * 1024),
  contentBase64: z.string().min(1),
  evidenceCategory: z.string().trim().max(64).optional().nullable(),
  evidenceSubcategory: z.string().trim().max(64).optional().nullable(),
  description: z.string().trim().max(4000).optional().nullable(),
  reference: z.string().trim().max(512).optional().nullable(),
});

export const verificationActionSchema = z.object({
  action: z.enum(['VERIFY', 'RETURN', 'REJECT']),
  remarks: z.string().trim().max(4000).optional().nullable(),
});

export const ALLOWED_EVIDENCE_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);
