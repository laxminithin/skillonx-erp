import { db } from '../../db/index.js';
import type { EmployeeScope } from './access.js';
import { WRITABLE_DOMAINS, type FacultyProfileActor, type ProfileSection } from './types.js';
import { ensureProfile, parseJson } from './profile.js';

type SectionStatus = 'COMPLETE' | 'INCOMPLETE' | 'EVIDENCE_MISSING' | 'VERIFICATION_PENDING' | 'NOT_APPLICABLE';

type RecordAgg = {
  id: number;
  domain: string;
  recordType: string | null;
  title: string;
  verificationStatus: string;
  evidenceCount: number;
};

// Which writable domains roll up into each completeness section, plus derived hints.
const SECTION_DOMAINS: Record<string, { section: ProfileSection; label: string; domains: string[]; expectAtLeastOne: boolean }> = {
  QUALIFICATIONS: { section: 'ACADEMIC', label: 'Qualifications', domains: ['QUALIFICATION'], expectAtLeastOne: true },
  EXPERIENCE: { section: 'EXPERIENCE', label: 'Experience', domains: ['EXPERIENCE'], expectAtLeastOne: true },
  TEACHING: { section: 'TEACHING', label: 'Teaching', domains: ['TEACHING_CONTRIBUTION'], expectAtLeastOne: false },
  RESEARCH: { section: 'RESEARCH', label: 'Research', domains: ['PUBLICATION', 'PATENT', 'PROJECT'], expectAtLeastOne: false },
  PROFESSIONAL_DEVELOPMENT: { section: 'PROFESSIONAL_DEVELOPMENT', label: 'Professional development', domains: ['FDP', 'CERTIFICATION', 'CONFERENCE_ROLE'], expectAtLeastOne: false },
  STUDENT_GUIDANCE: { section: 'STUDENT_GUIDANCE', label: 'Student guidance', domains: ['STUDENT_PROJECT', 'RESEARCH_GUIDANCE'], expectAtLeastOne: false },
  INSTITUTIONAL_CONTRIBUTION: { section: 'INSTITUTIONAL_CONTRIBUTION', label: 'Institutional contribution', domains: ['INSTITUTIONAL_CONTRIBUTION', 'RESPONSIBILITY', 'INDUSTRY_INTERACTION', 'CONSULTANCY'], expectAtLeastOne: false },
  AWARDS_MEMBERSHIPS: { section: 'AWARDS_MEMBERSHIPS', label: 'Awards & memberships', domains: ['AWARD', 'MEMBERSHIP'], expectAtLeastOne: false },
};

function humanDomain(domain: string): string {
  return (WRITABLE_DOMAINS[domain]?.label ?? domain).replace(/s$/, '').toLowerCase();
}

export async function computeCompleteness(actor: FacultyProfileActor, employee: EmployeeScope) {
  const profile = await ensureProfile(actor.collegeId, employee);
  const na = parseJson(profile.not_applicable, {}) as Record<string, boolean>;

  const rows = (await db('faculty_records as r')
    .leftJoin(
      db('faculty_record_evidence').select('record_id').count('* as n').groupBy('record_id').as('ev'),
      'ev.record_id',
      'r.id',
    )
    .where({ 'r.college_id': actor.collegeId, 'r.employee_id': employee.id })
    .where('r.is_archived', false)
    .select('r.id', 'r.domain', 'r.record_type', 'r.title', 'r.verification_status', 'ev.n as evidence_count')) as Record<string, unknown>[];

  const records: RecordAgg[] = rows.map((r) => ({
    id: Number(r.id),
    domain: String(r.domain),
    recordType: (r.record_type as string) ?? null,
    title: String(r.title),
    verificationStatus: String(r.verification_status),
    evidenceCount: Number(r.evidence_count ?? 0),
  }));

  // Derived teaching presence (counts toward TEACHING section even with no manual contributions).
  const derivedTeachingCount = employee.facultyUserId
    ? Number(
        (await db('academic_class_subject_faculty')
          .where({ college_id: actor.collegeId, faculty_id: employee.facultyUserId })
          .count('* as n')
          .first())?.n ?? 0,
      )
    : 0;

  // Core HR basics
  const emp = await db('employees').where({ id: employee.id, college_id: actor.collegeId }).first();
  const hasIdentifiers = !!(profile.orcid || profile.google_scholar_id || profile.scopus_author_id || profile.wos_researcher_id || profile.vidwan_id || profile.other_research_id);

  const sections: {
    key: string;
    section: ProfileSection;
    label: string;
    status: SectionStatus;
    messages: string[];
    counts: { total: number; verified: number; pending: number; evidenceMissing: number };
  }[] = [];

  // BASIC_HR (HRMS authoritative)
  {
    const messages: string[] = [];
    let status: SectionStatus = 'COMPLETE';
    if (!emp?.department_id || !emp?.designation_id || !emp?.date_of_joining) {
      status = 'INCOMPLETE';
      messages.push('Core HR profile is incomplete in HRMS — contact HR.');
    }
    sections.push({ key: 'BASIC_HR', section: 'OVERVIEW', label: 'Basic HR profile', status, messages, counts: zero() });
  }

  // ACADEMIC_IDENTIFIERS
  {
    const naKey = 'ACADEMIC';
    if (na[naKey]) {
      sections.push({ key: 'ACADEMIC_IDENTIFIERS', section: 'ACADEMIC', label: 'Academic identifiers', status: 'NOT_APPLICABLE', messages: [], counts: zero() });
    } else {
      const status: SectionStatus = hasIdentifiers ? 'COMPLETE' : 'INCOMPLETE';
      const messages = hasIdentifiers ? [] : ['Add at least one research identifier (ORCID / Scopus / Scholar).'];
      sections.push({ key: 'ACADEMIC_IDENTIFIERS', section: 'ACADEMIC', label: 'Academic identifiers', status, messages, counts: zero() });
    }
  }

  for (const [key, cfg] of Object.entries(SECTION_DOMAINS)) {
    if (na[cfg.section] || na[key]) {
      sections.push({ key, section: cfg.section, label: cfg.label, status: 'NOT_APPLICABLE', messages: [], counts: zero() });
      continue;
    }
    const sectionRecords = records.filter((r) => cfg.domains.includes(r.domain));
    const messages: string[] = [];
    let total = sectionRecords.length;
    let verified = 0;
    let pending = 0;
    let evidenceMissing = 0;

    for (const r of sectionRecords) {
      const dc = WRITABLE_DOMAINS[r.domain];
      if (r.verificationStatus === 'VERIFIED') verified += 1;
      if (r.verificationStatus === 'SUBMITTED') pending += 1;
      if (dc?.evidenceExpected && r.evidenceCount === 0) {
        evidenceMissing += 1;
        messages.push(`${humanDomain(r.domain)} record "${truncate(r.title)}" has no supporting document.`);
      }
      if (r.verificationStatus === 'RETURNED') messages.push(`${humanDomain(r.domain)} record "${truncate(r.title)}" was returned for clarification.`);
    }

    // TEACHING can be satisfied by derived assignments.
    if (key === 'TEACHING') total += derivedTeachingCount;

    if (pending > 0) messages.unshift(`${pending} ${cfg.label.toLowerCase()} record${pending === 1 ? '' : 's'} awaiting verification.`);

    let status: SectionStatus;
    if (total === 0) {
      status = 'INCOMPLETE';
      if (cfg.expectAtLeastOne) messages.push(`No ${cfg.label.toLowerCase()} recorded yet.`);
      else messages.push(`No ${cfg.label.toLowerCase()} records — add them or mark the section not applicable.`);
    } else if (evidenceMissing > 0) {
      status = 'EVIDENCE_MISSING';
    } else if (pending > 0) {
      status = 'VERIFICATION_PENDING';
    } else {
      status = 'COMPLETE';
    }
    sections.push({ key, section: cfg.section, label: cfg.label, status, messages, counts: { total: sectionRecords.length, verified, pending, evidenceMissing } });
  }

  // Aggregate evidence view
  const evidenceMissingTotal = records.filter((r) => WRITABLE_DOMAINS[r.domain]?.evidenceExpected && r.evidenceCount === 0).length;
  const pendingTotal = records.filter((r) => r.verificationStatus === 'SUBMITTED').length;
  const returnedTotal = records.filter((r) => r.verificationStatus === 'RETURNED').length;
  const verifiedTotal = records.filter((r) => r.verificationStatus === 'VERIFIED').length;

  // Overall percentage: meaningful sections only (exclude N/A), weighting COMPLETE=1, PENDING/EVIDENCE=0.5.
  const scored = sections.filter((s) => s.status !== 'NOT_APPLICABLE');
  const scoreOf = (s: SectionStatus) => (s === 'COMPLETE' ? 1 : s === 'VERIFICATION_PENDING' || s === 'EVIDENCE_MISSING' ? 0.5 : 0);
  const percent = scored.length ? Math.round((scored.reduce((a, s) => a + scoreOf(s.status), 0) / scored.length) * 100) : 0;

  const result = {
    percent,
    sections,
    evidence: {
      complete: verifiedTotal,
      missing: evidenceMissingTotal,
      pendingVerification: pendingTotal,
      returned: returnedTotal,
    },
    computedAt: new Date().toISOString(),
  };

  await db('faculty_academic_profiles')
    .where({ college_id: actor.collegeId, employee_id: employee.id })
    .update({ completeness_cache: JSON.stringify(result), completeness_updated_at: db.fn.now() });

  return result;
}

function zero() {
  return { total: 0, verified: 0, pending: 0, evidenceMissing: 0 };
}
function truncate(s: string, n = 48) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
