import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { AlumniActor, AlumniAdminActor } from './service.js';
import { canAdminAlumni, canSuggestAlumni } from './access360.js';
import { computeAlumniCompleteness } from './completeness360.js';
import { attentionFromFreshness, computeFreshness, ensureDefaultFreshnessConfig } from './freshness.js';
import { listProvenance } from './provenance.js';
import { buildRelationshipSummary } from './relationship.js';
import { WILLINGNESS_DB, WILLINGNESS_KEYS } from './types360.js';
import { buildCrm360Section, buildCrmSelfSection } from './crmWorkspace.js';
import { ensureRelationship } from './crmService.js';
import { buildProfileIntelligence, loadSignalBundle } from './intelligenceEngine.js';
import { buildEngagement360Section } from './engagementService.js';
import { buildMatching360Section } from './matchingService.js';
import { buildRecognition360Section } from './recognitionService.js';

function parseJson<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return raw as T;
}

async function loadProfile(collegeId: number, profileId: number) {
  const row = await db('alumni_profiles as ap')
    .leftJoin('students as st', 'st.id', 'ap.student_id')
    .leftJoin('departments as d', 'd.id', 'ap.historical_department_id')
    .leftJoin('programs as p', 'p.id', 'ap.historical_program_id')
    .leftJoin('colleges as c', 'c.id', 'ap.college_id')
    .where('ap.college_id', collegeId)
    .where('ap.id', profileId)
    .select(
      'ap.*',
      'st.phone as student_phone',
      'st.name as student_live_name',
      'st.email as student_live_email',
      'd.name as department_name',
      'd.code as department_code',
      'p.name as program_name',
      'p.code as program_code',
      'c.name as college_name',
      'c.code as college_code',
    )
    .first();
  if (!row) throw new AppError(404, 'Alumni profile not found');
  return row;
}

function serializeWillingness(row: Record<string, any>) {
  const out: Record<string, boolean | null> = {};
  for (const key of WILLINGNESS_KEYS) {
    const col = WILLINGNESS_DB[key];
    out[key] = row[col] == null ? null : Boolean(row[col]);
  }
  return {
    ...out,
    confirmedAt: row.willingness_confirmed_at ? new Date(row.willingness_confirmed_at).toISOString() : null,
    /** Explicit only — null means not expressed (never inferred). */
    note: 'Willingness is shown only when explicitly stated by the alumnus.',
  };
}

function serializeEmployment(row: Record<string, any>) {
  return {
    id: Number(row.id),
    organization: row.organization,
    designation: row.designation,
    industry: row.industry,
    functionalArea: row.functional_area ?? null,
    seniority: row.seniority ?? null,
    location: row.location,
    startDate: row.start_date,
    endDate: row.end_date,
    isCurrent: Boolean(row.is_current),
    employmentType: row.employment_type,
    description: row.description,
    verificationStatus: row.verification_status,
    sourceType: row.source_type ?? 'ALUMNI_SELF',
    sourceReference: row.source_reference ?? null,
    capturedAt: row.captured_at ? new Date(row.captured_at).toISOString() : null,
    lastVerifiedAt: row.last_verified_at ? new Date(row.last_verified_at).toISOString() : null,
    confidence: row.confidence != null ? Number(row.confidence) : null,
    evidenceReference: row.evidence_reference ?? null,
  };
}

async function projectTpmsCareer(collegeId: number, studentId: number) {
  const projected: {
    placementOffers: any[];
    studentExperiences: any[];
    note: string;
  } = {
    placementOffers: [],
    studentExperiences: [],
    note: 'Projected read-only from T&P; Alumni employment remains the post-grad delta.',
  };
  try {
    if (await db.schema.hasTable('placement_offers')) {
      projected.placementOffers = await db('placement_offers as po')
        .leftJoin('placement_companies as pc', 'pc.id', 'po.company_id')
        .where({ 'po.college_id': collegeId, 'po.student_id': studentId })
        .select(
          'po.id',
          'po.offer_status',
          'po.package_ctc',
          'po.role_title',
          'po.updated_at',
          'pc.name as company_name',
        )
        .orderBy('po.updated_at', 'desc')
        .limit(20);
    }
  } catch { /* optional */ }
  try {
    if (await db.schema.hasTable('student_experiences')) {
      projected.studentExperiences = await db('student_experiences')
        .where({ college_id: collegeId, student_id: studentId })
        .orderBy('start_date', 'desc')
        .limit(20);
    }
  } catch { /* optional */ }
  return projected;
}

async function projectFinanceContributions(collegeId: number, alumniProfileId: number) {
  if (!(await db.schema.hasTable('alumni_contributions'))) return [];
  const rows = await db('alumni_contributions as ac')
    .leftJoin('fee_receipts as fr', 'fr.id', 'ac.finance_receipt_id')
    .where({ 'ac.college_id': collegeId, 'ac.alumni_profile_id': alumniProfileId })
    .select('ac.*', 'fr.receipt_number as finance_receipt_number', 'fr.amount as finance_receipt_amount')
    .orderBy('ac.created_at', 'desc')
    .limit(50);
  return rows.map((r) => ({
    id: Number(r.id),
    purpose: r.purpose,
    amount: r.amount,
    status: r.status,
    financeReceiptId: r.finance_receipt_id != null ? Number(r.finance_receipt_id) : null,
    financeReceiptNumber: r.finance_receipt_number ?? null,
    financeReceiptAmount: r.finance_receipt_amount ?? null,
    note: r.note,
    createdAt: r.created_at,
    provenance: {
      sourceType: r.finance_receipt_id ? 'FINANCE' : 'ALUMNI_SELF',
      verificationStatus: r.finance_receipt_id ? 'AUTHORITATIVE' : 'SELF_DECLARED',
    },
  }));
}

export type ViewerMode = 'self' | 'admin' | 'network';

export async function getAlumni360(
  opts: {
    collegeId: number;
    profileId: number;
    viewer: ViewerMode;
    actorAlumniId?: number;
    actorFacultyId?: number;
    actorRole?: string;
    actorDepartmentId?: number | null;
  },
) {
  const profile = await loadProfile(opts.collegeId, opts.profileId);
  await ensureDefaultFreshnessConfig(opts.collegeId);

  if (opts.viewer === 'network') {
    if (profile.verification_state !== 'VERIFIED' || profile.directory_visible === false) {
      throw new AppError(404, 'Alumni profile not found');
    }
  }

  const studentId = Number(profile.student_id);

  const [employmentRaw, higherStudies, entrepreneurship, achievements, capabilities, relationship] = await Promise.all([
    db('alumni_employment')
      .where({ college_id: opts.collegeId, alumni_profile_id: opts.profileId })
      .orderBy('is_current', 'desc')
      .orderBy('start_date', 'desc'),
    db.schema.hasTable('alumni_higher_studies').then((ok) =>
      ok
        ? db('alumni_higher_studies').where({ college_id: opts.collegeId, alumni_profile_id: opts.profileId }).orderBy('start_year', 'desc')
        : [],
    ),
    db.schema.hasTable('alumni_entrepreneurship').then((ok) =>
      ok
        ? db('alumni_entrepreneurship').where({ college_id: opts.collegeId, alumni_profile_id: opts.profileId }).orderBy('year_founded', 'desc')
        : [],
    ),
    db.schema.hasTable('alumni_achievements').then((ok) =>
      ok
        ? db('alumni_achievements').where({ college_id: opts.collegeId, alumni_profile_id: opts.profileId }).orderBy('achievement_date', 'desc')
        : [],
    ),
    db.schema.hasTable('alumni_interest_capabilities').then((ok) =>
      ok
        ? db('alumni_interest_capabilities').where({ college_id: opts.collegeId, alumni_profile_id: opts.profileId })
        : [],
    ),
    buildRelationshipSummary(opts.collegeId, opts.profileId, studentId),
  ]);

  // Ensure CRM relationship row exists for admin/self (lazy create)
  if (opts.viewer === 'admin' || opts.viewer === 'self') {
    try {
      await ensureRelationship(opts.collegeId, opts.profileId, profile);
    } catch {
      /* CRM migration may not be applied yet */
    }
  }

  let crmSection: unknown = undefined;
  let intelligenceSection: unknown = undefined;
  let engagementSection: unknown = undefined;
  let matchingSection: unknown = undefined;
  let recognitionSection: unknown = undefined;
  if (opts.viewer === 'admin' && opts.actorFacultyId) {
    try {
      crmSection = await buildCrm360Section(
        {
          facultyUserId: opts.actorFacultyId,
          collegeId: opts.collegeId,
          departmentId: opts.actorDepartmentId ?? null,
          role: opts.actorRole || 'COLLEGE_ADMIN',
          name: '',
        },
        opts.profileId,
        profile,
      );
    } catch {
      crmSection = { available: false };
    }
    try {
      const bundle = await loadSignalBundle(opts.collegeId, opts.profileId, profile);
      intelligenceSection = buildProfileIntelligence(bundle);
    } catch {
      intelligenceSection = { available: false };
    }
    try {
      engagementSection = await buildEngagement360Section(opts.collegeId, opts.profileId);
    } catch {
      engagementSection = { available: false };
    }
    try {
      matchingSection = await buildMatching360Section(opts.collegeId, opts.profileId);
    } catch {
      matchingSection = { available: false };
    }
    try {
      recognitionSection = await buildRecognition360Section(opts.collegeId, opts.profileId);
    } catch {
      recognitionSection = { available: false };
    }
  } else if (opts.viewer === 'self') {
    try {
      crmSection = await buildCrmSelfSection(opts.collegeId, opts.profileId);
    } catch {
      crmSection = { available: false };
    }
    // Internal intelligence is never exposed to alumni self-service
    intelligenceSection = undefined;
    // Self view: preferences only — not admin campaign suppressions / internal notes
    engagementSection = {
      available: true,
      selfView: true,
      contactPreferences: {
        email: profile.comm_email_opt_in !== false,
        sms: Boolean(profile.comm_sms_opt_in),
        phone: Boolean(profile.comm_phone_opt_in),
        whatsapp: Boolean(profile.comm_whatsapp_opt_in),
        globalOptOut: Boolean(profile.global_comm_opt_out),
      },
    };
    // Matching evidence / staff ranking never exposed to alumni
    matchingSection = undefined;
    // Recognition admin workspace detail stays admin-only; alumni use /recognition/mine
    recognitionSection = undefined;
  }

  // Filter archived employment if column exists
  let employment = employmentRaw as Record<string, any>[];
  if (employment.length && Object.prototype.hasOwnProperty.call(employment[0], 'is_archived')) {
    employment = employment.filter((e) => !e.is_archived);
  }

  // Privacy: network viewers only see employment when visibility allows
  const adminOrSelf = opts.viewer === 'admin' || opts.viewer === 'self';
  if (opts.viewer === 'network' && profile.employment_visibility === 'PRIVATE') {
    employment = [];
  } else if (opts.viewer === 'network' && profile.employment_visibility === 'INSTITUTION_ONLY') {
    employment = [];
  }

  const [tpms, contributions, provenance, completeness] = await Promise.all([
    adminOrSelf ? projectTpmsCareer(opts.collegeId, studentId) : Promise.resolve(null),
    adminOrSelf ? projectFinanceContributions(opts.collegeId, opts.profileId) : Promise.resolve([]),
    adminOrSelf ? listProvenance(opts.collegeId, opts.profileId) : Promise.resolve([]),
    computeAlumniCompleteness({
      profile,
      employment,
      higherStudies: higherStudies as any[],
      achievements: achievements as any[],
      entrepreneurship: entrepreneurship as any[],
      capabilities: capabilities as any[],
      relationship: {
        eventsAttended: relationship.eventsAttended,
        contributions: relationship.contributions,
        mentoringInteractions: relationship.mentoringInteractions,
      },
    }),
  ]);

  const freshness = await computeFreshness(opts.collegeId, profile, employment);
  const attention = attentionFromFreshness(freshness).map((f) => ({
    domain: f.domain,
    state: f.state,
    message: f.message,
  }));

  const currentRole = employment.find((e) => e.is_current) ?? null;

  const identity = {
    alumniId: Number(profile.id),
    studentId,
    name: profile.historical_name,
    usn: profile.historical_usn,
    email: adminOrSelf || profile.email_visibility === 'PUBLIC' || (opts.viewer === 'network' && profile.email_visibility === 'ALUMNI_NETWORK')
      ? profile.email
      : null,
    phone: adminOrSelf || profile.phone_visibility === 'PUBLIC' || (opts.viewer === 'network' && profile.phone_visibility === 'ALUMNI_NETWORK')
      ? (profile.phone_override ?? profile.student_phone ?? null)
      : null,
    communicationPreferences: adminOrSelf
      ? {
          email: profile.comm_email_opt_in !== false,
          sms: Boolean(profile.comm_sms_opt_in),
          phone: Boolean(profile.comm_phone_opt_in),
          whatsapp: Boolean(profile.comm_whatsapp_opt_in),
        }
      : undefined,
    currentLocation: [profile.current_city, profile.current_country].filter(Boolean).join(', ') || null,
    currentCity: profile.current_city,
    currentCountry: profile.current_country,
    profilePhotoUrl: profile.profile_photo_url,
    verificationStatus: profile.verification_state,
    lifecycleState: profile.lifecycle_state,
    headline: profile.headline,
  };

  const academic = {
    institution: profile.college_name,
    institutionCode: profile.college_code,
    department: profile.department_name,
    departmentCode: profile.department_code,
    programme: profile.program_name,
    programmeCode: profile.program_code,
    batch: profile.batch_label,
    admissionYear: profile.admission_year,
    graduationYear: profile.graduation_year,
    provenance: {
      sourceType: 'ERP',
      verificationStatus: 'AUTHORITATIVE',
      note: 'Historical academic linkage; live student row remains authoritative for pre-grad identity.',
    },
  };

  const careerTimeline = employment.map(serializeEmployment);

  const expertise = {
    skills: parseJson<string[]>(profile.skills, []),
    technologies: parseJson<string[]>(profile.technologies, []),
    domains: parseJson<string[]>(profile.domains_expertise, []),
    industryExpertise: parseJson<string[]>(profile.industry_expertise, []),
    researchExpertise: parseJson<string[]>(profile.research_expertise, []),
    certifications: parseJson<string[]>(profile.certifications, []),
  };

  const privacy = adminOrSelf
    ? {
        email: profile.email_visibility,
        phone: profile.phone_visibility,
        biography: profile.bio_visibility,
        employment: profile.employment_visibility,
        social: profile.social_visibility,
        networking: profile.networking_visibility,
        directoryVisible: profile.directory_visible !== false,
        connectionVisible: profile.connection_visible !== false,
        professionalDataVisible: profile.professional_data_visible !== false,
        layers: {
          INSTITUTIONAL_INTERNAL: adminOrSelf,
          DIRECTORY_VISIBLE: profile.directory_visible !== false,
          ALUMNI_CONNECTION: profile.connection_visible !== false,
          COMMUNICATION: adminOrSelf,
          OPTIONAL_PROFESSIONAL: profile.professional_data_visible !== false,
        },
      }
    : undefined;

  return {
    identity,
    academic,
    career: {
      current: currentRole ? serializeEmployment(currentRole) : null,
      timeline: careerTimeline,
      tpmsProjection: tpms,
    },
    higherEducation: higherStudies,
    skillsExpertise: expertise,
    achievements: {
      records: achievements,
      entrepreneurship,
    },
    interestsAvailability: {
      willingness: serializeWillingness(profile),
      capabilities: (capabilities as any[]).map((c) => ({
        id: Number(c.id),
        domain: c.capability_domain,
        details: parseJson(c.details, {}),
        isActive: Boolean(c.is_active),
        sourceType: c.source_type,
        verificationStatus: c.verification_status,
        confirmedAt: c.confirmed_at ? new Date(c.confirmed_at).toISOString() : null,
      })),
      legacy: {
        networkingAvailable: Boolean(profile.networking_available),
        mentorshipAvailable: Boolean(profile.mentorship_available),
        mentorshipAreas: parseJson<string[]>(profile.mentorship_areas, []),
        interests: parseJson<string[]>(profile.interests, []),
      },
    },
    institutionalRelationship: relationship,
    crm: crmSection,
    intelligence: intelligenceSection,
    engagement: engagementSection,
    matching: matchingSection,
    recognition: recognitionSection,
    privacy,    dataQuality: {
      completeness,
      freshness,
      attentionRequired: attention,
      provenance: adminOrSelf ? provenance : undefined,
    },
    biography: adminOrSelf || profile.bio_visibility === 'PUBLIC' || (opts.viewer === 'network' && profile.bio_visibility === 'ALUMNI_NETWORK')
      ? profile.biography
      : null,
    contributions: adminOrSelf ? contributions : undefined,
    meta: {
      viewer: opts.viewer,
      generatedAt: new Date().toISOString(),
      aggregate: true,
    },
  };
}

export async function getAlumni360ForSelf(actor: AlumniActor) {
  return getAlumni360({
    collegeId: actor.collegeId,
    profileId: actor.alumniProfileId,
    viewer: 'self',
    actorAlumniId: actor.alumniProfileId,
  });
}

export async function getAlumni360ForAdmin(actor: AlumniAdminActor, profileId: number) {
  if (!canSuggestAlumni(actor) && !canAdminAlumni(actor)) {
    throw new AppError(403, 'Alumni administration access required');
  }
  const profile = await db('alumni_profiles').where({ id: profileId, college_id: actor.collegeId }).first();
  if (!profile) throw new AppError(404, 'Alumni profile not found');

  // Department-scoped faculty/HOD: only same historical department
  if (['HOD', 'FACULTY'].includes(actor.role) && actor.departmentId != null) {
    if (profile.historical_department_id != null && Number(profile.historical_department_id) !== actor.departmentId) {
      throw new AppError(403, 'Alumni profile outside your department scope');
    }
  }

  return getAlumni360({
    collegeId: actor.collegeId,
    profileId,
    viewer: 'admin',
    actorFacultyId: actor.facultyUserId,
    actorRole: actor.role,
    actorDepartmentId: actor.departmentId,
  });
}
