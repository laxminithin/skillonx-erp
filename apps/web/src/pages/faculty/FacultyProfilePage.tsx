import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Award, BadgeCheck, BookOpen, Building2, FileCheck2, GraduationCap, Layers, Paperclip,
  ShieldCheck, Trophy, Upload, Users,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import {
  Badge, Button, EmptyState, Field, Input, Modal, PageHeader, Select, StatStrip, Surface,
  Tabs, Textarea, useToast,
} from '../../components/ui';

const API_URL = (import.meta.env.VITE_API_URL as string) || '';

// ── Types ───────────────────────────────────────────────────────────────────
type DomainMeta = {
  domain: string; label: string; section: string; recordTypes: string[];
  verifiable: boolean; evidenceExpected: boolean; uniqueRefField: string | null;
};
type Meta = {
  role: string; hasEmployeeRecord: boolean; sections: string[]; verificationStatuses: string[];
  awardLevels: string[]; domains: DomainMeta[]; derivedDomains: { domain: string; label: string; section: string }[];
  canVerify: boolean;
};
type Core = {
  employeeId: number; fullName: string; department: string | null; designation: string | null;
  employmentType: string | null; employmentStatus: string; dateOfJoining: string | null;
  institutionalExperienceYears: number | null; officialEmail: string | null; officialPhone: string | null;
  photoReference: string | null;
  identifiers: { orcid: string | null; googleScholarId: string | null; scopusAuthorId: string | null; wosResearcherId: string | null; vidwanId: string | null; otherResearchId: string | null; verified: boolean };
  notApplicable: Record<string, boolean>;
};
type Rec = {
  id: number; domain: string; recordType: string | null; title: string; academicYearLabel: string | null;
  startDate: string | null; endDate: string | null; isCurrent: boolean; category: string | null;
  level: string | null; status: string | null; roleLabel: string | null; uniqueRef: string | null;
  details: Record<string, unknown>; source: string; verificationStatus: string; evidenceCount: number;
  verifyRemarks?: string | null;
  evidence?: { id: number; fileName: string; mimeType: string; fileSize: number; createdAt: string }[];
  verificationHistory?: { id: number; action: string; fromStatus: string | null; toStatus: string; actedByRole: string | null; remarks: string | null; createdAt: string }[];
};

const SECTION_TABS: { id: string; label: string }[] = [
  { id: 'OVERVIEW', label: 'Overview' },
  { id: 'ACADEMIC', label: 'Academic' },
  { id: 'EXPERIENCE', label: 'Experience' },
  { id: 'TEACHING', label: 'Teaching' },
  { id: 'RESEARCH', label: 'Research' },
  { id: 'PROFESSIONAL_DEVELOPMENT', label: 'Professional Dev' },
  { id: 'STUDENT_GUIDANCE', label: 'Student Guidance' },
  { id: 'INDUSTRY_CONSULTANCY', label: 'Industry' },
  { id: 'INSTITUTIONAL_CONTRIBUTION', label: 'Institutional' },
  { id: 'AWARDS_MEMBERSHIPS', label: 'Awards' },
  { id: 'EVIDENCE', label: 'Evidence' },
];

// Per-domain structured detail fields (kept compact; everything else is generic).
const DETAIL_FIELDS: Record<string, { key: string; label: string; type?: 'text' | 'number' }[]> = {
  PUBLICATION: [
    { key: 'authors', label: 'Authors' }, { key: 'authorPosition', label: 'Author position', type: 'number' },
    { key: 'venue', label: 'Journal / Conference / Book' }, { key: 'publisher', label: 'Publisher' },
    { key: 'volume', label: 'Volume' }, { key: 'issue', label: 'Issue' }, { key: 'pages', label: 'Pages' },
    { key: 'doi', label: 'DOI' }, { key: 'issn', label: 'ISSN' }, { key: 'isbn', label: 'ISBN' },
    { key: 'indexing', label: 'Indexing (Scopus/WoS/UGC)' }, { key: 'quartile', label: 'Quartile' },
    { key: 'impact', label: 'Impact factor' }, { key: 'citations', label: 'Citations', type: 'number' },
  ],
  PATENT: [
    { key: 'inventors', label: 'Inventors' }, { key: 'applicant', label: 'Applicant' },
    { key: 'applicationNumber', label: 'Application number' }, { key: 'publicationNumber', label: 'Publication number' },
    { key: 'grantNumber', label: 'Grant number' }, { key: 'jurisdiction', label: 'Country / jurisdiction' },
    { key: 'commercialization', label: 'Commercialization / licensing' },
  ],
  PROJECT: [
    { key: 'pi', label: 'Principal Investigator' }, { key: 'coPi', label: 'Co-PI' },
    { key: 'agency', label: 'Funding agency' }, { key: 'scheme', label: 'Scheme' },
    { key: 'sanctionRef', label: 'Sanction reference' }, { key: 'sanctionedAmount', label: 'Sanctioned amount', type: 'number' },
    { key: 'receivedAmount', label: 'Received amount', type: 'number' }, { key: 'outcome', label: 'Outcome' },
  ],
  CONSULTANCY: [
    { key: 'client', label: 'Client / industry' }, { key: 'amount', label: 'Revenue', type: 'number' },
    { key: 'deliverables', label: 'Deliverables' }, { key: 'outcome', label: 'Outcome' },
  ],
  QUALIFICATION: [
    { key: 'specialization', label: 'Specialization' }, { key: 'institution', label: 'Institution' },
    { key: 'university', label: 'University' }, { key: 'country', label: 'Country' },
    { key: 'grade', label: 'Class / CGPA' }, { key: 'supervisor', label: 'Supervisor (Ph.D.)' },
    { key: 'researchArea', label: 'Research area (Ph.D.)' }, { key: 'thesisTitle', label: 'Thesis title (Ph.D.)' },
  ],
  EXPERIENCE: [
    { key: 'organization', label: 'Organization' }, { key: 'designation', label: 'Designation' },
    { key: 'domain', label: 'Department / domain' }, { key: 'employmentType', label: 'Employment type' },
  ],
  FDP: [
    { key: 'organizer', label: 'Organizer' }, { key: 'sponsor', label: 'Sponsoring organization' },
    { key: 'venue', label: 'Venue' }, { key: 'mode', label: 'Mode (Online/Offline)' },
  ],
  CERTIFICATION: [
    { key: 'issuer', label: 'Issuing organization' }, { key: 'domain', label: 'Domain' },
    { key: 'credentialId', label: 'Credential ID' }, { key: 'lifetime', label: 'Lifetime (yes/no)' },
    { key: 'expiryDate', label: 'Expiry date (YYYY-MM-DD)' },
  ],
  MEMBERSHIP: [
    { key: 'body', label: 'Professional body' }, { key: 'membershipNumber', label: 'Membership number' },
    { key: 'membershipType', label: 'Type' }, { key: 'officeRole', label: 'Office-bearing role' },
  ],
  AWARD: [{ key: 'organization', label: 'Awarding organization' }, { key: 'description', label: 'Description' }],
  RESEARCH_GUIDANCE: [
    { key: 'scholar', label: 'Scholar / student' }, { key: 'registration', label: 'Registration ref' },
    { key: 'university', label: 'University' }, { key: 'researchArea', label: 'Research area' },
  ],
  STUDENT_PROJECT: [
    { key: 'team', label: 'Student / team' }, { key: 'usns', label: 'USNs' },
    { key: 'program', label: 'Program' }, { key: 'domain', label: 'Domain' }, { key: 'outcome', label: 'Outcome' },
  ],
  INDUSTRY_INTERACTION: [{ key: 'partner', label: 'Partner organization' }, { key: 'outcome', label: 'Outcome' }],
  INSTITUTIONAL_CONTRIBUTION: [{ key: 'scope', label: 'Scope' }, { key: 'orderRef', label: 'Appointment / order ref' }],
  RESPONSIBILITY: [{ key: 'scope', label: 'Scope' }, { key: 'orderRef', label: 'Appointment / order ref' }],
  CONFERENCE_ROLE: [{ key: 'event', label: 'Event' }, { key: 'organizer', label: 'Organizer' }],
  TEACHING_CONTRIBUTION: [{ key: 'course', label: 'Course' }, { key: 'description', label: 'Description' }],
};

const VSTATUS_STYLE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  SUBMITTED: 'bg-sky-50 text-sky-700 border-sky-200',
  VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RETURNED: 'bg-amber-50 text-amber-800 border-amber-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  NOT_REQUIRED: 'bg-slate-50 text-slate-500 border-slate-200',
};

function VStatus({ status }: { status: string }) {
  return (
    <Badge className={`border ${VSTATUS_STYLE[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {status.replace('_', ' ')}
    </Badge>
  );
}

async function downloadEvidence(id: number, fileName: string) {
  const token = localStorage.getItem('survey_token');
  const res = await fetch(`${API_URL}/api/faculty-profile/evidence/${id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function FacultyProfilePage() {
  useDocumentTitle('Academic Profile');
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const employeeId = params.get('employeeId');
  const readOnly = !!employeeId; // viewing someone else (verifier/HOD) => read-only editing
  const scope = employeeId ? `?employeeId=${employeeId}` : '';

  const [meta, setMeta] = useState<Meta | null>(null);
  const [core, setCore] = useState<Core | null>(null);
  const [overview, setOverview] = useState<Record<string, any> | null>(null);
  const [completeness, setCompleteness] = useState<Record<string, any> | null>(null);
  const [derived, setDerived] = useState<Record<string, any> | null>(null);
  const [tab, setTab] = useState('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCommon = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [m, c, ov, comp, dv] = await Promise.all([
        api<Meta>('/api/faculty-profile/meta'),
        api<Core>(`/api/faculty-profile/profile${scope}`),
        api<Record<string, any>>(`/api/faculty-profile/overview${scope}`),
        api<Record<string, any>>(`/api/faculty-profile/completeness${scope}`),
        api<Record<string, any>>(`/api/faculty-profile/derived${scope}`),
      ]);
      setMeta(m); setCore(c); setOverview(ov); setCompleteness(comp); setDerived(dv);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => { void loadCommon(); }, [loadCommon]);

  if (loading && !meta) return <div className="p-6 text-sm text-ink-muted">Loading academic profile…</div>;
  if (error) return <div className="p-6"><EmptyState title="Unable to load profile" body={error} /></div>;
  if (!meta || !core) return null;

  const sectionDomains = (section: string) => meta.domains.filter((d) => d.section === section);

  return (
    <div className="pb-16">
      <PageHeader
        title={readOnly ? core.fullName : 'My Academic Profile'}
        subtitle={
          readOnly
            ? `${core.designation ?? ''}${core.department ? ` · ${core.department}` : ''} — HRMS-authoritative identity, faculty-maintained academic record`
            : 'Structured, evidence-backed academic record — the institutional source for NBA / NAAC / IQAC and appraisal. HRMS remains authoritative for service information.'
        }
        actions={
          <div className="flex items-center gap-2">
            {typeof completeness?.percent === 'number' && (
              <Badge className="border border-accent/30 bg-accent/10 text-accent">
                {completeness.percent}% complete
              </Badge>
            )}
            {readOnly && (
              <Button variant="secondary" onClick={() => { params.delete('employeeId'); setParams(params); }}>
                Back to my profile
              </Button>
            )}
          </div>
        }
      />

      {meta.canVerify && !readOnly && <VerifierBar />}

      <div className="mb-4 overflow-x-auto">
        <Tabs tabs={SECTION_TABS} value={tab} onChange={setTab} />
      </div>

      {tab === 'OVERVIEW' && <OverviewTab core={core} overview={overview} completeness={completeness} derived={derived} />}
      {tab === 'ACADEMIC' && (
        <div className="space-y-6">
          {!readOnly && <IdentifiersCard core={core} onSaved={loadCommon} />}
          <RecordSection meta={meta} domains={sectionDomains('ACADEMIC')} scope={scope} readOnly={readOnly} employeeId={employeeId} onChange={loadCommon} />
        </div>
      )}
      {['EXPERIENCE', 'RESEARCH', 'PROFESSIONAL_DEVELOPMENT', 'AWARDS_MEMBERSHIPS', 'INDUSTRY_CONSULTANCY', 'INSTITUTIONAL_CONTRIBUTION'].includes(tab) && (
        <RecordSection meta={meta} domains={sectionDomains(tab)} scope={scope} readOnly={readOnly} employeeId={employeeId} onChange={loadCommon} />
      )}
      {tab === 'TEACHING' && (
        <div className="space-y-6">
          <DerivedTeaching derived={derived} />
          <RecordSection meta={meta} domains={sectionDomains('TEACHING')} scope={scope} readOnly={readOnly} employeeId={employeeId} onChange={loadCommon} />
        </div>
      )}
      {tab === 'STUDENT_GUIDANCE' && (
        <div className="space-y-6">
          <DerivedMentoring derived={derived} />
          <RecordSection meta={meta} domains={sectionDomains('STUDENT_GUIDANCE')} scope={scope} readOnly={readOnly} employeeId={employeeId} onChange={loadCommon} />
        </div>
      )}
      {tab === 'EVIDENCE' && <EvidenceTab completeness={completeness} />}
    </div>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab({ core, overview, completeness, derived }: { core: Core; overview: any; completeness: any; derived: any }) {
  const a = overview?.academicSummary ?? {};
  const r = overview?.currentResponsibilities ?? {};
  const rs = overview?.researchSnapshot ?? {};
  return (
    <div className="space-y-6">
      <StatStrip items={[
        { label: 'Highest Qualification', value: a.highestQualification?.recordType ?? '—' },
        { label: 'Teaching Exp (yrs)', value: a.teachingExperienceYears ?? 0 },
        { label: 'Industry Exp (yrs)', value: a.industryExperienceYears ?? 0 },
        { label: 'Institutional Exp (yrs)', value: a.institutionalExperienceYears ?? '—' },
        { label: 'Publications', value: rs.publications ?? 0 },
        { label: 'Patents', value: rs.patents ?? 0 },
      ]} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Surface>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><Users className="h-4 w-4" /> Current Responsibilities</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Courses (current)" value={`${r.courses ?? 0} / ${r.totalCourses ?? 0}`} />
            <Stat label="Active mentees" value={r.mentees ?? 0} />
            <Stat label="Class coordination" value={r.classCoordination ?? 0} />
            <Stat label="Leadership roles" value={(r.leadershipRoles ?? []).length} />
          </dl>
          {(r.leadershipRoles ?? []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {r.leadershipRoles.map((role: string) => <Badge key={role} className="bg-slate-100 text-slate-600">{role}</Badge>)}
            </div>
          )}
        </Surface>
        <Surface>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><ShieldCheck className="h-4 w-4" /> Evidence & Verification</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Verified" value={completeness?.evidence?.complete ?? 0} />
            <Stat label="Evidence missing" value={completeness?.evidence?.missing ?? 0} tone="warn" />
            <Stat label="Pending verification" value={completeness?.evidence?.pendingVerification ?? 0} tone="info" />
            <Stat label="Returned" value={completeness?.evidence?.returned ?? 0} tone="warn" />
          </dl>
        </Surface>
      </div>
      <CompletenessCard completeness={completeness} />
      {overview?.recentActivity?.length > 0 && (
        <Surface>
          <h3 className="mb-3 text-sm font-semibold text-ink">Recent Activity</h3>
          <ul className="divide-y divide-border">
            {overview.recentActivity.map((it: any) => (
              <li key={it.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate"><span className="text-ink-muted">{it.domain}</span> · {it.title}</span>
                <VStatus status={it.verificationStatus} />
              </li>
            ))}
          </ul>
        </Surface>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: any; tone?: 'warn' | 'info' }) {
  const color = tone === 'warn' ? 'text-amber-700' : tone === 'info' ? 'text-sky-700' : 'text-ink';
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className={`text-lg font-semibold tabular-nums ${color}`}>{value}</dd>
    </div>
  );
}

function CompletenessCard({ completeness }: { completeness: any }) {
  if (!completeness?.sections) return null;
  return (
    <Surface>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><Layers className="h-4 w-4" /> Profile Completeness</h3>
      <ul className="space-y-2">
        {completeness.sections.map((s: any) => (
          <li key={s.key} className="flex flex-col gap-1 rounded-lg border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{s.label}</p>
              {s.messages?.length > 0 && <p className="text-xs text-ink-muted">{s.messages[0]}</p>}
            </div>
            <CompStatus status={s.status} />
          </li>
        ))}
      </ul>
    </Surface>
  );
}

function CompStatus({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    INCOMPLETE: 'bg-slate-100 text-slate-600 border-slate-200',
    EVIDENCE_MISSING: 'bg-amber-50 text-amber-800 border-amber-200',
    VERIFICATION_PENDING: 'bg-sky-50 text-sky-700 border-sky-200',
    NOT_APPLICABLE: 'bg-slate-50 text-slate-400 border-slate-200',
  };
  return <Badge className={`border shrink-0 ${map[status] ?? ''}`}>{status.replace(/_/g, ' ')}</Badge>;
}

// ── Identifiers ───────────────────────────────────────────────────────────────
function IdentifiersCard({ core, onSaved }: { core: Core; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState(core.identifiers);
  const [saving, setSaving] = useState(false);
  const fields: { key: keyof typeof form; label: string }[] = [
    { key: 'orcid', label: 'ORCID' }, { key: 'scopusAuthorId', label: 'Scopus Author ID' },
    { key: 'googleScholarId', label: 'Google Scholar' }, { key: 'wosResearcherId', label: 'Web of Science / ResearcherID' },
    { key: 'vidwanId', label: 'Vidwan ID' }, { key: 'otherResearchId', label: 'Other research ID' },
  ];
  const save = async () => {
    setSaving(true);
    try {
      await api('/api/faculty-profile/identifiers', { method: 'PATCH', body: JSON.stringify(form) });
      toast('Research identifiers saved', 'success');
      onSaved();
    } catch (e) { toast((e as Error).message, 'error'); } finally { setSaving(false); }
  };
  return (
    <Surface>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink"><BadgeCheck className="h-4 w-4" /> Research Identifiers</h3>
        <span className="text-xs text-ink-muted">Self-entered — not institutionally verified</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((f) => (
          <Field key={String(f.key)} label={f.label}>
            <Input value={(form[f.key] as string) ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
          </Field>
        ))}
      </div>
      <div className="mt-4"><Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save identifiers'}</Button></div>
    </Surface>
  );
}

// ── Derived (read-only) ────────────────────────────────────────────────────────
function DerivedTeaching({ derived }: { derived: any }) {
  const rows = derived?.teaching ?? [];
  return (
    <Surface>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><BookOpen className="h-4 w-4" /> Teaching Assignments <span className="text-xs font-normal text-ink-muted">(derived from Academic/LMS)</span></h3>
      {rows.length === 0 ? <p className="text-sm text-ink-muted">No teaching assignments found.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-xs uppercase text-ink-muted">
              <th className="py-2 pr-3">AY</th><th className="py-2 pr-3">Course</th><th className="py-2 pr-3">Program</th><th className="py-2 pr-3">Sem/Sec</th><th className="py-2">Credits</th>
            </tr></thead>
            <tbody>
              {rows.map((t: any) => (
                <tr key={t.id} className="border-b border-border/60">
                  <td className="py-2 pr-3 whitespace-nowrap">{t.academicYear ?? '—'}{t.isCurrent && <Badge className="ml-1 bg-emerald-50 text-emerald-700">current</Badge>}</td>
                  <td className="py-2 pr-3"><span className="font-medium">{t.courseCode}</span> {t.courseName}</td>
                  <td className="py-2 pr-3">{t.program ?? '—'}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{t.semester ?? '—'} / {t.section ?? '—'}</td>
                  <td className="py-2">{t.credits ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Surface>
  );
}

function DerivedMentoring({ derived }: { derived: any }) {
  const rows = derived?.mentoring ?? [];
  const proj = derived?.studentProjects ?? [];
  return (
    <div className="space-y-6">
      <Surface>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><Users className="h-4 w-4" /> Mentoring <span className="text-xs font-normal text-ink-muted">(derived)</span></h3>
        {rows.length === 0 ? <p className="text-sm text-ink-muted">No mentee assignments.</p> : (
          <div className="flex flex-wrap gap-2">
            {rows.map((m: any, i: number) => (
              <div key={i} className="rounded-lg border border-border px-3 py-2 text-sm">
                <span className="text-ink-muted">{m.academicYear ?? 'All'}</span>: <span className="font-semibold">{m.active}</span> active / {m.total} total
              </div>
            ))}
          </div>
        )}
      </Surface>
      {proj.length > 0 && (
        <Surface>
          <h3 className="mb-3 text-sm font-semibold text-ink">Guided Student Projects <span className="text-xs font-normal text-ink-muted">(derived)</span></h3>
          <ul className="divide-y divide-border text-sm">
            {proj.map((p: any) => (
              <li key={p.id} className="py-2"><span className="font-medium">{p.title}</span> — {p.student} ({p.usn})</li>
            ))}
          </ul>
        </Surface>
      )}
    </div>
  );
}

// ── Record section (generic engine) ─────────────────────────────────────────────
function RecordSection({ meta, domains, scope, readOnly, employeeId, onChange }: {
  meta: Meta; domains: DomainMeta[]; scope: string; readOnly: boolean; employeeId: string | null; onChange: () => void;
}) {
  const [records, setRecords] = useState<Record<string, Rec[]>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ domain: DomainMeta; rec: Rec | null } | null>(null);
  const [detailFor, setDetailFor] = useState<Rec | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const out: Record<string, Rec[]> = {};
    await Promise.all(domains.map(async (d) => {
      out[d.domain] = await api<Rec[]>(`/api/faculty-profile/records${scope ? scope + '&' : '?'}domain=${d.domain}`);
    }));
    setRecords(out);
    setLoading(false);
  }, [domains, scope]);
  useEffect(() => { void load(); }, [load]);

  const refresh = () => { void load(); onChange(); };

  if (loading) return <div className="text-sm text-ink-muted">Loading records…</div>;

  return (
    <div className="space-y-6">
      {domains.map((d) => (
        <Surface key={d.domain}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink"><Trophy className="h-4 w-4" /> {d.label}</h3>
            {!readOnly && <Button variant="secondary" onClick={() => setEditing({ domain: d, rec: null })}>Add</Button>}
          </div>
          {(records[d.domain] ?? []).length === 0 ? (
            <p className="text-sm text-ink-muted">No records yet.</p>
          ) : (
            <ul className="space-y-2">
              {(records[d.domain] ?? []).map((r) => (
                <li key={r.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-ink break-words">{r.title}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {[r.recordType, r.academicYearLabel, r.level, r.status].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <VStatus status={r.verificationStatus} />
                      {r.evidenceCount > 0 && <Badge className="bg-slate-100 text-slate-600"><Paperclip className="mr-1 inline h-3 w-3" />{r.evidenceCount}</Badge>}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button variant="ghost" onClick={() => setDetailFor(r)}>Details</Button>
                    {!readOnly && ['DRAFT', 'SUBMITTED', 'RETURNED', 'REJECTED', 'NOT_REQUIRED', 'VERIFIED'].includes(r.verificationStatus) && (
                      <Button variant="ghost" onClick={() => setEditing({ domain: d, rec: r })}>Edit</Button>
                    )}
                    {!readOnly && d.verifiable && ['DRAFT', 'RETURNED', 'REJECTED'].includes(r.verificationStatus) && (
                      <SubmitBtn recordId={r.id} onDone={refresh} />
                    )}
                    {!readOnly && <EvidenceBtn recordId={r.id} onDone={refresh} />}
                    {readOnly && d.verifiable && r.verificationStatus === 'SUBMITTED' && employeeId && (
                      <VerifyControls recordId={r.id} employeeId={employeeId} onDone={refresh} />
                    )}
                  </div>
                  {r.verifyRemarks && <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">Reviewer: {r.verifyRemarks}</p>}
                </li>
              ))}
            </ul>
          )}
        </Surface>
      ))}
      {editing && (
        <RecordModal
          meta={meta}
          domain={editing.domain}
          rec={editing.rec}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}
      {detailFor && <DetailModal recordId={detailFor.id} scope={scope} onClose={() => setDetailFor(null)} />}
    </div>
  );
}

function SubmitBtn({ recordId, onDone }: { recordId: number; onDone: () => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <Button variant="ghost" disabled={busy} onClick={async () => {
      setBusy(true);
      try { await api(`/api/faculty-profile/records/${recordId}/submit`, { method: 'POST' }); toast('Submitted for verification', 'success'); onDone(); }
      catch (e) { toast((e as Error).message, 'error'); } finally { setBusy(false); }
    }}><FileCheck2 className="mr-1 inline h-3.5 w-3.5" />Submit</Button>
  );
}

function VerifyControls({ recordId, employeeId, onDone }: { recordId: number; employeeId: string; onDone: () => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const act = async (action: 'VERIFY' | 'RETURN' | 'REJECT') => {
    const remarks = action === 'VERIFY' ? '' : window.prompt(`Remarks for ${action.toLowerCase()}:`) ?? '';
    setBusy(true);
    try {
      await api(`/api/faculty-profile/records/${recordId}/verification?employeeId=${employeeId}`, { method: 'POST', body: JSON.stringify({ action, remarks }) });
      toast(`Record ${action.toLowerCase()}ed`, 'success'); onDone();
    } catch (e) { toast((e as Error).message, 'error'); } finally { setBusy(false); }
  };
  return (
    <>
      <Button variant="primary" disabled={busy} onClick={() => act('VERIFY')}>Verify</Button>
      <Button variant="secondary" disabled={busy} onClick={() => act('RETURN')}>Return</Button>
      <Button variant="ghost" disabled={busy} onClick={() => act('REJECT')}>Reject</Button>
    </>
  );
}

function EvidenceBtn({ recordId, onDone }: { recordId: number; onDone: () => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const contentBase64 = await fileToBase64(file);
      await api(`/api/faculty-profile/records/${recordId}/evidence`, {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, mimeType: file.type || 'application/pdf', fileSize: file.size, contentBase64 }),
      });
      toast('Evidence attached', 'success'); onDone();
    } catch (err) { toast((err as Error).message, 'error'); } finally { setBusy(false); e.target.value = ''; }
  };
  return (
    <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-ink-muted hover:text-ink">
      <Upload className="h-3.5 w-3.5" /> {busy ? 'Uploading…' : 'Evidence'}
      <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx" onChange={onPick} disabled={busy} />
    </label>
  );
}

// ── Record create/edit modal ─────────────────────────────────────────────────
function RecordModal({ meta, domain, rec, onClose, onSaved }: {
  meta: Meta; domain: DomainMeta; rec: Rec | null; onClose: () => void; onSaved: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    recordType: rec?.recordType ?? domain.recordTypes[0] ?? '',
    title: rec?.title ?? '',
    academicYearLabel: rec?.academicYearLabel ?? '',
    startDate: rec?.startDate?.slice(0, 10) ?? '',
    endDate: rec?.endDate?.slice(0, 10) ?? '',
    isCurrent: rec?.isCurrent ?? false,
    category: rec?.category ?? '',
    level: rec?.level ?? '',
    status: rec?.status ?? '',
    roleLabel: rec?.roleLabel ?? '',
  }));
  const [details, setDetails] = useState<Record<string, string>>(() => {
    const d: Record<string, string> = {};
    for (const f of DETAIL_FIELDS[domain.domain] ?? []) d[f.key] = rec?.details?.[f.key] != null ? String(rec.details[f.key]) : '';
    return d;
  });

  const save = async () => {
    if (!form.title.trim()) { toast('Title is required', 'error'); return; }
    setSaving(true);
    const detailPayload: Record<string, unknown> = {};
    for (const f of DETAIL_FIELDS[domain.domain] ?? []) {
      if (details[f.key] === '') continue;
      detailPayload[f.key] = f.type === 'number' ? Number(details[f.key]) : details[f.key];
    }
    const body: Record<string, unknown> = {
      recordType: form.recordType || null,
      title: form.title.trim(),
      academicYearLabel: form.academicYearLabel || null,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      isCurrent: form.isCurrent,
      category: form.category || null,
      level: form.level || null,
      status: form.status || null,
      roleLabel: form.roleLabel || null,
      details: detailPayload,
    };
    try {
      if (rec) await api(`/api/faculty-profile/records/${rec.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      else await api('/api/faculty-profile/records', { method: 'POST', body: JSON.stringify({ ...body, domain: domain.domain }) });
      toast(rec ? 'Record updated' : 'Record added', 'success');
      onSaved();
    } catch (e) { toast((e as Error).message, 'error'); } finally { setSaving(false); }
  };

  const isExperience = domain.domain === 'EXPERIENCE';
  return (
    <Modal open title={`${rec ? 'Edit' : 'Add'} — ${domain.label}`} size="lg" onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        {domain.recordTypes.length > 1 && (
          <Field label="Type"><Select value={form.recordType} onChange={(e) => setForm({ ...form, recordType: e.target.value })}>
            {domain.recordTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </Select></Field>
        )}
        <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Academic year" hint="e.g. 2024-2025"><Input value={form.academicYearLabel} onChange={(e) => setForm({ ...form, academicYearLabel: e.target.value })} /></Field>
        {isExperience && (
          <Field label="Experience category"><Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">—</option>{['TEACHING', 'INDUSTRY', 'RESEARCH', 'OTHER'].map((c) => <option key={c} value={c}>{c}</option>)}
          </Select></Field>
        )}
        {domain.domain === 'AWARD' && (
          <Field label="Level"><Select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
            <option value="">—</option>{meta.awardLevels.map((l) => <option key={l} value={l}>{l}</option>)}
          </Select></Field>
        )}
        <Field label="Start date"><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
        <Field label="End date"><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
        <Field label="Status" hint="e.g. SANCTIONED, GRANTED, COMPLETED"><Input value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })} /> Current / ongoing
        </label>
      </div>
      {(DETAIL_FIELDS[domain.domain] ?? []).length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase text-ink-muted">Details</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(DETAIL_FIELDS[domain.domain] ?? []).map((f) => (
              <Field key={f.key} label={f.label}>
                <Input value={details[f.key] ?? ''} type={f.type === 'number' ? 'number' : 'text'}
                  onChange={(e) => setDetails({ ...details, [f.key]: e.target.value })} />
              </Field>
            ))}
          </div>
          {domain.uniqueRefField && <p className="mt-2 text-xs text-ink-muted">Indexing / quartile / citation claims are recorded as self-entered and require institutional verification.</p>}
        </div>
      )}
    </Modal>
  );
}

function DetailModal({ recordId, scope, onClose }: { recordId: number; scope: string; onClose: () => void }) {
  const [rec, setRec] = useState<Rec | null>(null);
  useEffect(() => {
    void api<Rec>(`/api/faculty-profile/records/${recordId}${scope}`).then(setRec).catch(() => setRec(null));
  }, [recordId, scope]);
  return (
    <Modal open title={rec?.title ?? 'Record'} size="lg" onClose={onClose}>
      {!rec ? <p className="text-sm text-ink-muted">Loading…</p> : (
        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-2"><VStatus status={rec.verificationStatus} /><Badge className="bg-slate-100 text-slate-600">{rec.domain}</Badge>{rec.source === 'FACULTY' ? null : <Badge className="bg-sky-50 text-sky-700">derived</Badge>}</div>
          {Object.keys(rec.details ?? {}).length > 0 && (
            <dl className="grid grid-cols-2 gap-2">
              {Object.entries(rec.details).map(([k, v]) => (
                <div key={k}><dt className="text-xs text-ink-muted">{k}</dt><dd className="break-words">{String(Array.isArray(v) ? v.join(', ') : v)}</dd></div>
              ))}
            </dl>
          )}
          {(rec.evidence ?? []).length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-ink-muted">Evidence</p>
              <ul className="space-y-1">
                {rec.evidence!.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate">{e.fileName}</span>
                    <Button variant="ghost" onClick={() => downloadEvidence(e.id, e.fileName)}>Download</Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(rec.verificationHistory ?? []).length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-ink-muted">Verification history</p>
              <ol className="space-y-1">
                {rec.verificationHistory!.map((h) => (
                  <li key={h.id} className="text-xs text-ink-muted">
                    <span className="font-medium text-ink">{h.action}</span> → {h.toStatus}{h.actedByRole ? ` by ${h.actedByRole}` : ''}{h.remarks ? ` — ${h.remarks}` : ''} <span className="opacity-70">({new Date(h.createdAt).toLocaleDateString()})</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ── Evidence tab ─────────────────────────────────────────────────────────────
function EvidenceTab({ completeness }: { completeness: any }) {
  const e = completeness?.evidence ?? {};
  return (
    <div className="space-y-6">
      <StatStrip items={[
        { label: 'Verified', value: e.complete ?? 0 },
        { label: 'Evidence Missing', value: e.missing ?? 0 },
        { label: 'Pending Verification', value: e.pendingVerification ?? 0 },
        { label: 'Returned', value: e.returned ?? 0 },
      ]} />
      <CompletenessCard completeness={completeness} />
      <Surface>
        <p className="text-sm text-ink-muted">Attach evidence to individual records from each section. Evidence is stored securely, checksum-verified, and only visible to you and authorized reviewers (your HOD and institution-level authorities). Faculty can never self-verify institutional evidence.</p>
      </Surface>
    </div>
  );
}

// ── Verifier bar (inbox + directory) ─────────────────────────────────────────────
function VerifierBar() {
  const [inbox, setInbox] = useState<any[]>([]);
  const [openInbox, setOpenInbox] = useState(false);
  const [openDir, setOpenDir] = useState(false);
  const [dir, setDir] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [, setParams] = useSearchParams();

  useEffect(() => { void api<any[]>('/api/faculty-profile/verification/inbox').then(setInbox).catch(() => setInbox([])); }, []);
  const loadDir = async () => {
    setOpenDir(true);
    setDir(await api<any[]>(`/api/faculty-profile/directory${q ? `?q=${encodeURIComponent(q)}` : ''}`).catch(() => []));
  };
  return (
    <Surface className="mb-4 border-accent/30 bg-accent/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-ink"><ShieldCheck className="h-4 w-4 text-accent" /> Reviewer tools</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setOpenInbox(true)}>Verification inbox ({inbox.length})</Button>
          <Button variant="secondary" onClick={loadDir}>Faculty directory</Button>
        </div>
      </div>
      <Modal open={openInbox} title="Verification inbox" size="lg" onClose={() => setOpenInbox(false)}>
        {inbox.length === 0 ? <EmptyState title="Nothing pending" body="No submitted records await your verification." /> : (
          <ul className="divide-y divide-border">
            {inbox.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0"><span className="font-medium">{r.facultyName}</span> · {r.domain} · <span className="truncate">{r.title}</span></span>
                <Button variant="ghost" onClick={() => { setParams({ employeeId: String(r.employeeId) }); setOpenInbox(false); }}>Open</Button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
      <Modal open={openDir} title="Faculty directory" size="lg" onClose={() => setOpenDir(false)}>
        <div className="mb-3 flex gap-2">
          <Input placeholder="Search name / number" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button onClick={loadDir}>Search</Button>
        </div>
        <ul className="max-h-96 divide-y divide-border overflow-y-auto">
          {dir.map((f) => (
            <li key={f.employeeId} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="min-w-0"><span className="font-medium">{f.fullName}</span> · <span className="text-ink-muted">{f.designation ?? ''} {f.department ?? ''}</span></span>
              <Button variant="ghost" onClick={() => { setParams({ employeeId: String(f.employeeId) }); setOpenDir(false); }}>View</Button>
            </li>
          ))}
        </ul>
      </Modal>
    </Surface>
  );
}

export default FacultyProfilePage;
