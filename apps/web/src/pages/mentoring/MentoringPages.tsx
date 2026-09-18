import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CalendarClock, ClipboardList, Flag, GitBranch, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatStrip,
  Surface,
  Tabs,
  Textarea,
  useToast,
} from '../../components/ui';

type Attention = 'NORMAL' | 'WATCH' | 'ATTENTION' | 'HIGH';

const ATTENTION_STYLE: Record<Attention, string> = {
  NORMAL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  WATCH: 'bg-sky-50 text-sky-700 border-sky-200',
  ATTENTION: 'bg-amber-50 text-amber-800 border-amber-200',
  HIGH: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function AttentionBadge({ level }: { level: Attention }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${ATTENTION_STYLE[level]}`}>
      {(level === 'HIGH' || level === 'ATTENTION') && <AlertTriangle className="h-3 w-3" aria-hidden />}
      {level}
    </span>
  );
}

type Trend = 'IMPROVING' | 'DECLINING' | 'STEADY' | 'INSUFFICIENT_DATA';

type Mentee = {
  studentId: number;
  name: string;
  usn: string;
  department: string | null;
  semester: string | null;
  section: string | null;
  attendancePct: number | null;
  attendanceShortage: boolean;
  ciePct: number | null;
  backlogs: number;
  attention: Attention;
  riskReasons: string[];
  lastSession: string | null;
  nextFollowUp: string | null;
  openActions: number;
  certifications: number;
  achievements: number;
  internships: number;
  internshipStatus: string | null;
  placementStatus: string | null;
  trainingActive: number;
  activeAlerts: number;
  criticalAlerts: number;
  pendingRequests: number;
  academicTrend: Trend;
  latestSgpa: number | null;
};

type Dashboard = {
  summary: {
    activeMentees: number;
    requiringAttention: number;
    highAttention: number;
    sessionsThisMonth: number;
    overdueFollowUps: number;
    resolvedInterventions: number;
  };
  actionRequired: Array<{ kind: string; label: string; studentId?: number; usn?: string }>;
  mentees: Mentee[];
  followUps: {
    overdue: FollowUp[];
    dueToday: FollowUp[];
    upcoming: FollowUp[];
  };
  recentInterventions: Array<{ id: number; studentId: number; studentName: string; usn: string; category: string | null; scheduledAt: string | null; agenda: string }>;
};

type FollowUp = { sessionId: number; studentId: number; studentName: string; usn: string; followUpDate: string; agenda: string };

function fmtDate(v: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}

export function MentorDashboardPage() {
  useDocumentTitle('Mentoring');
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Dashboard>('/api/mentoring/dashboard')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const s = data?.summary;
  return (
    <div>
      <PageHeader
        title="Mentoring & Student Advisory"
        subtitle="Who needs my attention today?"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/mentoring/requests"><Button variant="secondary"><ClipboardList className="h-4 w-4" aria-hidden /> Student Requests</Button></Link>
            <Link to="/mentoring/my-mentees"><Button variant="secondary"><Users className="h-4 w-4" aria-hidden /> My Mentees</Button></Link>
          </div>
        }
      />
      <StatStrip
        loading={loading}
        items={[
          { label: 'Active mentees', value: s?.activeMentees ?? '—' },
          { label: 'Need attention', value: s?.requiringAttention ?? '—' },
          { label: 'High attention', value: s?.highAttention ?? '—' },
          { label: 'Sessions this month', value: s?.sessionsThisMonth ?? '—' },
          { label: 'Overdue follow-ups', value: s?.overdueFollowUps ?? '—' },
          { label: 'Resolved actions', value: s?.resolvedInterventions ?? '—' },
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2 space-y-6">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <Flag className="h-4 w-4 text-rose-600" aria-hidden /> Action required
            </h2>
            <Surface>
              {!data?.actionRequired.length ? (
                <p className="text-sm text-ink-muted">Nothing needs immediate attention. Good work.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.actionRequired.map((a, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="flex items-center gap-2">
                        <Badge className="bg-surface-muted text-ink-muted">{a.kind.replace(/_/g, ' ')}</Badge>
                        {a.label}
                      </span>
                      {a.studentId ? (
                        <Link className="text-accent hover:underline" to={`/mentoring/students/${a.studentId}`}>
                          Open
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Surface>
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <Users className="h-4 w-4" aria-hidden /> My mentees
            </h2>
            <Surface className="!p-0 overflow-hidden">
              {loading ? (
                <p className="p-5 text-sm text-ink-muted">Loading…</p>
              ) : !data?.mentees.length ? (
                <div className="p-5">
                  <EmptyState title="No mentees assigned" body="Assigned students will appear here." />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-muted">
                      <tr>
                        <th className="px-4 py-2.5">Student</th>
                        <th className="px-4 py-2.5">Attention</th>
                        <th className="px-4 py-2.5">Attendance</th>
                        <th className="px-4 py-2.5">Backlogs</th>
                        <th className="px-4 py-2.5">Last session</th>
                        <th className="px-4 py-2.5">Next follow-up</th>
                        <th className="px-4 py-2.5">Open actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.mentees.map((m) => (
                        <tr key={m.studentId} className="hover:bg-surface-muted/40">
                          <td className="px-4 py-2.5">
                            <Link to={`/mentoring/students/${m.studentId}`} className="font-medium text-accent hover:underline">
                              {m.name}
                            </Link>
                            <div className="text-xs text-ink-muted">{m.usn} · {m.semester ?? '—'} {m.section ?? ''}</div>
                          </td>
                          <td className="px-4 py-2.5"><AttentionBadge level={m.attention} /></td>
                          <td className="px-4 py-2.5 tabular-nums">{m.attendancePct != null ? `${m.attendancePct}%` : '—'}</td>
                          <td className="px-4 py-2.5 tabular-nums">{m.backlogs}</td>
                          <td className="px-4 py-2.5">{fmtDate(m.lastSession)}</td>
                          <td className="px-4 py-2.5">{fmtDate(m.nextFollowUp)}</td>
                          <td className="px-4 py-2.5 tabular-nums">{m.openActions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Surface>
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <CalendarClock className="h-4 w-4" aria-hidden /> Follow-ups
            </h2>
            <Surface className="space-y-3">
              <FollowUpGroup title="Overdue" tone="text-rose-600" items={data?.followUps.overdue ?? []} />
              <FollowUpGroup title="Due today" tone="text-amber-700" items={data?.followUps.dueToday ?? []} />
              <FollowUpGroup title="Upcoming" tone="text-ink-muted" items={data?.followUps.upcoming ?? []} />
              {!data?.followUps.overdue.length && !data?.followUps.dueToday.length && !data?.followUps.upcoming.length ? (
                <p className="text-sm text-ink-muted">No pending follow-ups.</p>
              ) : null}
            </Surface>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">Recent interventions</h2>
            <Surface>
              {!data?.recentInterventions.length ? (
                <p className="text-sm text-ink-muted">No recent sessions.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data.recentInterventions.map((r) => (
                    <li key={r.id} className="py-2.5 text-sm">
                      <Link to={`/mentoring/students/${r.studentId}`} className="font-medium text-accent hover:underline">
                        {r.studentName}
                      </Link>
                      <div className="text-xs text-ink-muted">{r.category ?? 'General'} · {fmtDate(r.scheduledAt)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Surface>
          </section>
        </div>
      </div>
    </div>
  );
}

function FollowUpGroup({ title, tone, items }: { title: string; tone: string; items: FollowUp[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${tone}`}>{title} ({items.length})</p>
      <ul className="space-y-1">
        {items.map((f) => (
          <li key={f.sessionId} className="text-sm">
            <Link to={`/mentoring/students/${f.studentId}`} className="text-accent hover:underline">{f.studentName}</Link>
            <span className="text-ink-muted"> · {fmtDate(f.followUpDate)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── My Mentees (dedicated snapshot with filters) ──────────────────────────

const TREND_LABEL: Record<Trend, string> = {
  IMPROVING: '▲ Improving',
  DECLINING: '▼ Declining',
  STEADY: '► Steady',
  INSUFFICIENT_DATA: '—',
};
const TREND_STYLE: Record<Trend, string> = {
  IMPROVING: 'text-emerald-700',
  DECLINING: 'text-rose-700',
  STEADY: 'text-ink-muted',
  INSUFFICIENT_DATA: 'text-ink-muted',
};

export function MyMenteesPage() {
  useDocumentTitle('My Mentees');
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    semester: '',
    section: '',
    riskLevel: '',
    attendanceShortage: false,
    academicPerformance: '',
    pendingAction: false,
  });

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filters.semester) p.set('semester', filters.semester);
    if (filters.section) p.set('section', filters.section);
    if (filters.riskLevel) p.set('riskLevel', filters.riskLevel);
    if (filters.attendanceShortage) p.set('attendanceShortage', '1');
    if (filters.academicPerformance) p.set('academicPerformance', filters.academicPerformance);
    if (filters.pendingAction) p.set('pendingAction', '1');
    api<{ mentees: Mentee[] }>(`/api/mentoring/mentees?${p.toString()}`)
      .then((d) => setMentees(d.mentees))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  // Distinct semester/section options come from the full unfiltered load; keep it simple
  // by deriving from the current result set (filters narrow, never invent, options).
  const semesters = useMemo(() => [...new Set(mentees.map((m) => m.semester).filter(Boolean))] as string[], [mentees]);
  const sections = useMemo(() => [...new Set(mentees.map((m) => m.section).filter(Boolean))] as string[], [mentees]);

  const set = (k: keyof typeof filters, v: string | boolean) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <PageHeader title="My Mentees" subtitle="Assigned mentee snapshot — attendance, academics, risk, and interventions at a glance." />

      <Surface className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Semester">
            <Select value={filters.semester} onChange={(e) => set('semester', e.target.value)}>
              <option value="">All</option>
              {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Section">
            <Select value={filters.section} onChange={(e) => set('section', e.target.value)}>
              <option value="">All</option>
              {sections.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Risk level">
            <Select value={filters.riskLevel} onChange={(e) => set('riskLevel', e.target.value)}>
              <option value="">All</option>
              <option value="HIGH">High</option>
              <option value="ATTENTION">Attention</option>
              <option value="WATCH">Watch</option>
              <option value="NORMAL">Normal</option>
            </Select>
          </Field>
          <Field label="Academic performance">
            <Select value={filters.academicPerformance} onChange={(e) => set('academicPerformance', e.target.value)}>
              <option value="">All</option>
              <option value="AT_RISK">Declining</option>
              <option value="STEADY">Steady</option>
              <option value="IMPROVING">Improving</option>
            </Select>
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={filters.attendanceShortage} onChange={(e) => set('attendanceShortage', e.target.checked)} />
            Attendance shortage only
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={filters.pendingAction} onChange={(e) => set('pendingAction', e.target.checked)} />
            Pending action only
          </label>
        </div>
      </Surface>

      <Surface className="!p-0 overflow-hidden">
        {loading ? (
          <p className="p-5 text-sm text-ink-muted">Loading…</p>
        ) : !mentees.length ? (
          <div className="p-5"><EmptyState title="No mentees match" body="Adjust the filters or check your mentor allocation." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-4 py-2.5">Student</th>
                  <th className="px-4 py-2.5">Attention</th>
                  <th className="px-4 py-2.5">Attendance</th>
                  <th className="px-4 py-2.5">CIE</th>
                  <th className="px-4 py-2.5">Trend</th>
                  <th className="px-4 py-2.5">Backlogs</th>
                  <th className="px-4 py-2.5">Portfolio</th>
                  <th className="px-4 py-2.5">Alerts</th>
                  <th className="px-4 py-2.5">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mentees.map((m) => (
                  <tr key={m.studentId} className="hover:bg-surface-muted/40">
                    <td className="px-4 py-2.5">
                      <Link to={`/mentoring/students/${m.studentId}`} className="font-medium text-accent hover:underline">{m.name}</Link>
                      <div className="text-xs text-ink-muted">{m.usn} · {m.semester ?? '—'} {m.section ?? ''}</div>
                    </td>
                    <td className="px-4 py-2.5"><AttentionBadge level={m.attention} /></td>
                    <td className="px-4 py-2.5 tabular-nums">
                      {m.attendancePct != null ? `${m.attendancePct}%` : '—'}
                      {m.attendanceShortage ? <Badge className="ml-1 bg-rose-50 text-rose-700">short</Badge> : null}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{m.ciePct != null ? `${m.ciePct}%` : '—'}</td>
                    <td className={`px-4 py-2.5 ${TREND_STYLE[m.academicTrend]}`}>{TREND_LABEL[m.academicTrend]}</td>
                    <td className="px-4 py-2.5 tabular-nums">{m.backlogs}</td>
                    <td className="px-4 py-2.5 text-xs text-ink-muted">
                      {m.certifications}c · {m.internships}i · {m.achievements}a
                      {m.placementStatus ? <div className="text-emerald-700">{m.placementStatus}</div> : null}
                    </td>
                    <td className="px-4 py-2.5">
                      {m.activeAlerts ? <Badge className={m.criticalAlerts ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}>{m.activeAlerts}</Badge> : <span className="text-ink-muted">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {m.pendingRequests ? <Badge className="bg-sky-50 text-sky-700">{m.pendingRequests} req</Badge> : null}
                      {m.openActions ? <Badge className="ml-1 bg-surface-muted text-ink-muted">{m.openActions} act</Badge> : null}
                      {!m.pendingRequests && !m.openActions ? <span className="text-ink-muted">—</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
    </div>
  );
}

// ── Student 360 ──────────────────────────────────────────────────────────

type Student360 = {
  identity: { studentId: number; name: string; usn: string; email: string | null; phone: string | null; program: string | null; department: string | null; semester: string | null; section: string | null };
  academic: { cgpa: number | null; backlogs: Array<{ code?: string; name?: string; grade?: string }>; semesters: unknown[]; cie: { avgPct: number | null; sheets: number }; trend: { series: Array<{ semesterId: number; sgpa: number }>; direction: Trend } };
  portfolio: {
    certifications: Array<{ id: number; certificate_name: string; provider: string | null; issue_date: string | null; verification_status: string }>;
    internships: Array<{ id: number; organization: string; role: string | null; start_date: string | null; end_date: string | null }>;
    placements: Array<{ id: number; company: string | null; role: string | null; offer_status: string; offer_date: string | null }>;
    training: Array<{ id: number; program: string; status: string; completion_status: string }>;
    achievements: Array<{ id: number; title: string; achievement_type: string; issuer: string | null; achievement_date: string | null }>;
  };
  alerts: Array<{ id: number; alert_type: string; severity: string; title: string; message: string; created_at: string }>;
  requests: Array<{ id: number; request_number: string | null; title: string; status: string; current_stage: string | null; request_type: string | null; submitted_at: string | null }>;
  attendance: { overallPct: number | null; threshold: number; subjects: Array<{ courseId: number; course: string; pct: number | null; shortage: boolean }> };
  learning: { assignments: { total: number; submitted: number; overdue: number }; quizzes: { attempts: number; avgPct: number | null } };
  risk: { attention: Attention; reasons: string[]; dimensions: Array<{ dimension: string; level: Attention; value: number | null; reason: string | null }> };
  mentoring: {
    sessions: Array<{ id: number; status: string; meetingType: string; category: string | null; visibility: string; scheduledAt: string | null; agenda: string; studentVisibleNotes: string | null; privateNotes: string | null; followUpDate: string | null; followUpStatus: string | null; outcome: string | null }>;
    actions: Array<{ id: number; title: string; owner: string; status: string; priority: string; dueDate: string | null; completedAt: string | null }>;
    escalations: Array<{ id: number; reasonCode: string; targetLevel: string; status: string; createdAt: string }>;
    referrals: Array<{ id: number; targetFunction: string; subject: string; status: string }>;
    parentInteractions: Array<{ id: number; interactionDate: string; mode: string; purpose: string }>;
  };
};

export function MentorStudent360Page() {
  const { id } = useParams();
  const studentId = Number(id);
  const [data, setData] = useState<Student360 | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [dialog, setDialog] = useState<null | 'session' | 'action' | 'escalation' | 'referral' | 'parent'>(null);
  const { toast } = useToast();

  const reload = useCallback(() => {
    setLoading(true);
    api<Student360>(`/api/mentoring/students/${studentId}`)
      .then(setData)
      .catch((e) => toast(String((e as { message?: string })?.message ?? 'Unable to load'), 'error'))
      .finally(() => setLoading(false));
  }, [studentId, toast]);

  useEffect(() => { reload(); }, [reload]);

  useDocumentTitle(data ? `${data.identity.name} · Mentoring` : 'Student 360');

  if (loading && !data) return <div className="p-6 text-sm text-ink-muted">Loading student 360…</div>;
  if (!data) return <div className="p-6"><EmptyState title="Unavailable" body="This student is not one of your assigned mentees." /></div>;

  const id360 = data.identity;
  return (
    <div>
      <Link to="/mentoring" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to mentoring
      </Link>
      <PageHeader
        title={id360.name}
        subtitle={`${id360.usn} · ${id360.program ?? ''} · ${id360.department ?? ''} · ${id360.semester ?? ''} ${id360.section ?? ''}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setDialog('session')}>Record session</Button>
            <Button variant="secondary" onClick={() => setDialog('action')}>Add action</Button>
            <Button variant="secondary" onClick={() => setDialog('escalation')}>Escalate</Button>
            <Button variant="secondary" onClick={() => setDialog('referral')}>Refer</Button>
            <Button variant="secondary" onClick={() => setDialog('parent')}>Parent contact</Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <AttentionBadge level={data.risk.attention} />
        <span className="text-sm text-ink-muted">Contact: {id360.email ?? '—'} · {id360.phone ?? '—'}</span>
      </div>

      <Surface className="mb-6 border-l-4 border-l-amber-400">
        <h3 className="mb-2 text-sm font-semibold text-ink">Why this attention level?</h3>
        {data.risk.reasons.length ? (
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-ink">
            {data.risk.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">No risk signals detected across attendance, academics, engagement, backlogs or follow-ups.</p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {data.risk.dimensions.map((d) => (
            <div key={d.dimension} className="rounded-md border border-border px-2.5 py-2 text-xs">
              <div className="text-ink-muted">{d.dimension.replace(/_/g, ' ')}</div>
              <AttentionBadge level={d.level} />
            </div>
          ))}
        </div>
      </Surface>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'attendance', label: 'Attendance' },
          { id: 'academic', label: 'Academic' },
          { id: 'learning', label: 'Learning' },
          { id: 'portfolio', label: 'Portfolio' },
          { id: 'history', label: 'Mentoring history' },
        ]}
      />

      <div className="mt-4">
        {tab === 'overview' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat label="CGPA" value={data.academic.cgpa ?? '—'} />
            <MiniStat label="Backlogs" value={data.academic.backlogs.length} />
            <MiniStat label="Attendance" value={data.attendance.overallPct != null ? `${data.attendance.overallPct}%` : '—'} />
            <MiniStat label="CIE avg" value={data.academic.cie.avgPct != null ? `${data.academic.cie.avgPct}%` : '—'} />
          </div>
        )}

        {tab === 'attendance' && (
          <Surface className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-ink-muted">
                  <tr><th className="px-4 py-2">Subject</th><th className="px-4 py-2">Attendance</th><th className="px-4 py-2">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.attendance.subjects.length ? data.attendance.subjects.map((sj) => (
                    <tr key={sj.courseId}>
                      <td className="px-4 py-2">{sj.course}</td>
                      <td className="px-4 py-2 tabular-nums">{sj.pct != null ? `${sj.pct}%` : '—'}</td>
                      <td className="px-4 py-2">{sj.shortage ? <Badge className="bg-rose-50 text-rose-700">Shortage</Badge> : <Badge className="bg-emerald-50 text-emerald-700">OK</Badge>}</td>
                    </tr>
                  )) : <tr><td className="px-4 py-3 text-ink-muted" colSpan={3}>No attendance records.</td></tr>}
                </tbody>
              </table>
            </div>
          </Surface>
        )}

        {tab === 'academic' && (
          <Surface>
            <p className="mb-2 text-sm">CGPA: <strong>{data.academic.cgpa ?? '—'}</strong> · CIE average: <strong>{data.academic.cie.avgPct != null ? `${data.academic.cie.avgPct}%` : '—'}</strong></p>
            <h4 className="mb-1 text-sm font-semibold text-ink">Backlogs</h4>
            {data.academic.backlogs.length ? (
              <ul className="list-disc pl-5 text-sm">
                {data.academic.backlogs.map((b, i) => <li key={i}>{b.name ?? b.code} {b.grade ? `(${b.grade})` : ''}</li>)}
              </ul>
            ) : <p className="text-sm text-ink-muted">No active backlogs.</p>}
          </Surface>
        )}

        {tab === 'learning' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat label="Assignments" value={`${data.learning.assignments.submitted}/${data.learning.assignments.total}`} />
            <MiniStat label="Overdue" value={data.learning.assignments.overdue} />
            <MiniStat label="Quiz attempts" value={data.learning.quizzes.attempts} />
            <MiniStat label="Quiz avg" value={data.learning.quizzes.avgPct != null ? `${data.learning.quizzes.avgPct}%` : '—'} />
          </div>
        )}

        {tab === 'portfolio' && <MenteePortfolio data={data} />}

        {tab === 'history' && <MentoringHistory data={data} />}
      </div>

      {(data.alerts.length > 0 || data.requests.length > 0) && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink"><AlertTriangle className="h-4 w-4 text-amber-600" aria-hidden /> Academic alerts</h3>
            <Surface>
              {data.alerts.length ? (
                <ul className="space-y-2">
                  {data.alerts.map((a) => (
                    <li key={a.id} className="text-sm">
                      <Badge className={/CRIT|HIGH|DANGER/i.test(a.severity) ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}>{a.severity}</Badge>
                      <span className="ml-2 font-medium">{a.title}</span>
                      <div className="text-xs text-ink-muted">{a.message}</div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-ink-muted">No active alerts.</p>}
            </Surface>
          </section>
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink"><ClipboardList className="h-4 w-4" aria-hidden /> Permission / leave requests</h3>
            <Surface>
              {data.requests.length ? (
                <ul className="space-y-2">
                  {data.requests.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                      <span>
                        <span className="font-medium">{r.request_type ?? r.title}</span>
                        <span className="text-xs text-ink-muted"> · {r.request_number ?? '—'}</span>
                      </span>
                      <Badge className="bg-surface-muted text-ink-muted">{r.status.replace(/_/g, ' ')}</Badge>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-ink-muted">No requests.</p>}
            </Surface>
          </section>
        </div>
      )}

      {dialog && (
        <MentoringDialog
          kind={dialog}
          studentId={studentId}
          sessions={data.mentoring.sessions.map((s) => ({ id: s.id, label: `${fmtDate(s.scheduledAt)} · ${s.agenda}` }))}
          onClose={() => setDialog(null)}
          onSaved={() => { setDialog(null); reload(); }}
        />
      )}
    </div>
  );
}

function MenteePortfolio({ data }: { data: Student360 }) {
  const p = data.portfolio;
  const trend = data.academic.trend;
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-sm font-semibold text-ink">Academic performance trend</h3>
        <Surface>
          {trend.series.length ? (
            <div className="flex flex-wrap items-end gap-3">
              {trend.series.map((s) => (
                <div key={s.semesterId} className="text-center">
                  <div className="mx-auto w-8 rounded-t bg-accent/70" style={{ height: `${Math.max(6, (s.sgpa / 10) * 60)}px` }} />
                  <div className="mt-1 text-xs tabular-nums text-ink">{s.sgpa.toFixed(2)}</div>
                  <div className="text-[10px] text-ink-muted">S{s.semesterId}</div>
                </div>
              ))}
              <span className={`ml-2 text-sm ${TREND_STYLE[trend.direction]}`}>{TREND_LABEL[trend.direction]}</span>
            </div>
          ) : <p className="text-sm text-ink-muted">No published semester results yet.</p>}
        </Surface>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <PortfolioList
          title="Certifications"
          empty="No certifications on record."
          items={p.certifications.map((c) => ({ id: c.id, primary: c.certificate_name, secondary: `${c.provider ?? '—'} · ${fmtDate(c.issue_date)}`, tag: c.verification_status }))}
        />
        <PortfolioList
          title="Internships"
          empty="No internships on record."
          items={p.internships.map((i) => ({ id: i.id, primary: i.organization, secondary: `${i.role ?? '—'} · ${fmtDate(i.start_date)} – ${fmtDate(i.end_date)}` }))}
        />
        <PortfolioList
          title="Placement offers"
          empty="No placement offers."
          items={p.placements.map((o) => ({ id: o.id, primary: o.company ?? o.role ?? 'Offer', secondary: `${o.role ?? ''} · ${fmtDate(o.offer_date)}`, tag: o.offer_status }))}
        />
        <PortfolioList
          title="Training programs"
          empty="No training enrollments."
          items={p.training.map((t) => ({ id: t.id, primary: t.program, secondary: t.status, tag: t.completion_status }))}
        />
        <PortfolioList
          title="Achievements"
          empty="No achievements on record."
          items={p.achievements.map((a) => ({ id: a.id, primary: a.title, secondary: `${a.achievement_type.replace(/_/g, ' ')} · ${a.issuer ?? '—'} · ${fmtDate(a.achievement_date)}` }))}
        />
      </div>
      <p className="text-xs text-ink-muted">Portfolio data is owned by Placement &amp; Student Services; mentors view a read-only projection.</p>
    </div>
  );
}

function PortfolioList({ title, empty, items }: { title: string; empty: string; items: Array<{ id: number; primary: string; secondary?: string; tag?: string }> }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-ink">{title}</h3>
      <Surface>
        {items.length ? (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="flex items-start justify-between gap-2 text-sm">
                <span>
                  <span className="font-medium">{it.primary}</span>
                  {it.secondary ? <div className="text-xs text-ink-muted">{it.secondary}</div> : null}
                </span>
                {it.tag ? <Badge className="bg-surface-muted text-ink-muted">{it.tag.replace(/_/g, ' ')}</Badge> : null}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-ink-muted">{empty}</p>}
      </Surface>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Surface>
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{value}</p>
    </Surface>
  );
}

function MentoringHistory({ data }: { data: Student360 }) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-sm font-semibold text-ink">Sessions</h3>
        {data.mentoring.sessions.length ? (
          <div className="space-y-2">
            {data.mentoring.sessions.map((s) => (
              <Surface key={s.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium">{s.agenda}</div>
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <Badge className="bg-surface-muted text-ink-muted">{s.meetingType}</Badge>
                    {s.category ? <Badge className="bg-surface-muted text-ink-muted">{s.category.replace(/_/g, ' ')}</Badge> : null}
                    <Badge className={s.visibility === 'CONFIDENTIAL' ? 'bg-rose-50 text-rose-700' : 'bg-surface-muted text-ink-muted'}>{s.visibility}</Badge>
                    <span>{fmtDate(s.scheduledAt)}</span>
                  </div>
                </div>
                {s.studentVisibleNotes ? <p className="mt-1 text-sm text-ink">Shared: {s.studentVisibleNotes}</p> : null}
                {s.privateNotes ? <p className="mt-1 text-sm text-ink-muted">Private: {s.privateNotes}</p> : null}
                {s.followUpDate ? <p className="mt-1 text-xs text-amber-700">Follow-up {fmtDate(s.followUpDate)} · {s.followUpStatus}</p> : null}
              </Surface>
            ))}
          </div>
        ) : <p className="text-sm text-ink-muted">No sessions recorded.</p>}
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink"><ClipboardList className="h-4 w-4" aria-hidden /> Action plan</h3>
        {data.mentoring.actions.length ? (
          <ul className="space-y-1 text-sm">
            {data.mentoring.actions.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                <span>{a.title} <span className="text-xs text-ink-muted">({a.owner})</span></span>
                <Badge className={a.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-muted text-ink-muted'}>{a.status}</Badge>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-ink-muted">No action items.</p>}
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink"><GitBranch className="h-4 w-4" aria-hidden /> Escalations & referrals</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <Surface>
            <p className="mb-1 text-xs font-semibold uppercase text-ink-muted">Escalations</p>
            {data.mentoring.escalations.length ? data.mentoring.escalations.map((e) => (
              <div key={e.id} className="text-sm">{e.reasonCode.replace(/_/g, ' ')} → {e.targetLevel} <Badge className="bg-surface-muted text-ink-muted">{e.status}</Badge></div>
            )) : <p className="text-sm text-ink-muted">None.</p>}
          </Surface>
          <Surface>
            <p className="mb-1 text-xs font-semibold uppercase text-ink-muted">Referrals</p>
            {data.mentoring.referrals.length ? data.mentoring.referrals.map((r) => (
              <div key={r.id} className="text-sm">{r.targetFunction} · {r.subject} <Badge className="bg-surface-muted text-ink-muted">{r.status}</Badge></div>
            )) : <p className="text-sm text-ink-muted">None.</p>}
          </Surface>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-ink">Parent / guardian interactions</h3>
        {data.mentoring.parentInteractions.length ? (
          <ul className="space-y-1 text-sm">
            {data.mentoring.parentInteractions.map((p) => (
              <li key={p.id} className="rounded-md border border-border px-3 py-2">{fmtDate(p.interactionDate)} · {p.mode} · {p.purpose}</li>
            ))}
          </ul>
        ) : <p className="text-sm text-ink-muted">No parent interactions recorded.</p>}
      </section>
    </div>
  );
}

// ── Create dialogs ───────────────────────────────────────────────────────

function MentoringDialog({
  kind,
  studentId,
  sessions,
  onClose,
  onSaved,
}: {
  kind: 'session' | 'action' | 'escalation' | 'referral' | 'parent';
  studentId: number;
  sessions: Array<{ id: number; label: string }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const title = useMemo(() => ({
    session: 'Record mentoring session',
    action: 'Add action item',
    escalation: 'Escalate to leadership',
    referral: 'Refer to another function',
    parent: 'Record parent/guardian interaction',
  }[kind]), [kind]);

  async function submit() {
    setSaving(true);
    const post = (path: string, body: Record<string, unknown>) =>
      api(path, { method: 'POST', body: JSON.stringify(body) });
    try {
      if (kind === 'session') {
        await post('/api/mentoring/sessions', {
          studentId,
          meetingType: form.meetingType || 'IN_PERSON',
          sessionCategory: form.category || 'GENERAL_GUIDANCE',
          agenda: form.agenda,
          observations: form.observations || null,
          studentVisibleNotes: form.studentVisibleNotes || null,
          privateNotes: form.privateNotes || null,
          visibility: form.visibility || 'MENTORING_TEAM',
          followUpDate: form.followUpDate || null,
          status: 'COMPLETED',
        });
      } else if (kind === 'action') {
        await post('/api/mentoring/actions', {
          studentId, title: form.title, description: form.description || null,
          owner: form.owner || 'STUDENT', priority: form.priority || 'NORMAL', dueDate: form.dueDate || null,
        });
      } else if (kind === 'escalation') {
        await post('/api/mentoring/escalations', {
          studentId, reasonCode: form.reasonCode || 'PERSISTENT_ACADEMIC_RISK', reason: form.reason, targetLevel: form.targetLevel || 'HOD',
        });
      } else if (kind === 'referral') {
        await post('/api/mentoring/referrals', {
          studentId, targetFunction: form.targetFunction || 'ACADEMIC_SERVICES', subject: form.subject, context: form.context || null,
        });
      } else if (kind === 'parent') {
        await post('/api/mentoring/parent-interactions', {
          studentId, interactionDate: form.interactionDate || new Date().toISOString().slice(0, 10),
          mode: form.mode || 'PHONE', initiatedBy: form.initiatedBy || 'MENTOR', purpose: form.purpose,
          summary: form.summary || null, agreedFollowUp: form.agreedFollowUp || null,
        });
      }
      toast('Saved', 'success');
      onSaved();
    } catch (e) {
      toast(String((e as { message?: string })?.message ?? 'Could not save'), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      title={title}
      onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={saving}>Save</Button></>}
    >
      <div className="space-y-3">
        {kind === 'session' && (
          <>
            <Field label="Type">
              <Select value={form.meetingType || 'IN_PERSON'} onChange={(e) => set('meetingType', e.target.value)}>
                {['IN_PERSON', 'PHONE', 'ONLINE', 'PARENT_INTERACTION', 'OTHER'].map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Category">
              <Select value={form.category || 'GENERAL_GUIDANCE'} onChange={(e) => set('category', e.target.value)}>
                {['ACADEMIC_PERFORMANCE','ATTENDANCE','BACKLOG','STUDY_PLANNING','CAREER_PLACEMENT','HIGHER_STUDIES','SKILL_DEVELOPMENT','GENERAL_GUIDANCE','FINANCIAL_ADMIN_REFERRAL','PERSONAL_CONCERN','PARENT_INTERACTION','OTHER'].map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Agenda"><Input value={form.agenda || ''} onChange={(e) => set('agenda', e.target.value)} required /></Field>
            <Field label="Observations"><Textarea value={form.observations || ''} onChange={(e) => set('observations', e.target.value)} /></Field>
            <Field label="Student-visible notes" hint="Shared with the student"><Textarea value={form.studentVisibleNotes || ''} onChange={(e) => set('studentVisibleNotes', e.target.value)} /></Field>
            <Field label="Private notes" hint="Confidentiality controlled below"><Textarea value={form.privateNotes || ''} onChange={(e) => set('privateNotes', e.target.value)} /></Field>
            <Field label="Confidentiality">
              <Select value={form.visibility || 'MENTORING_TEAM'} onChange={(e) => set('visibility', e.target.value)}>
                {['SHARED','MENTORING_TEAM','CONFIDENTIAL'].map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Follow-up date (optional)"><Input type="date" value={form.followUpDate || ''} onChange={(e) => set('followUpDate', e.target.value)} /></Field>
          </>
        )}
        {kind === 'action' && (
          <>
            <Field label="Title"><Input value={form.title || ''} onChange={(e) => set('title', e.target.value)} required /></Field>
            <Field label="Description"><Textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)} /></Field>
            <Field label="Owner"><Select value={form.owner || 'STUDENT'} onChange={(e) => set('owner', e.target.value)}>{['STUDENT','MENTOR'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
            <Field label="Priority"><Select value={form.priority || 'NORMAL'} onChange={(e) => set('priority', e.target.value)}>{['LOW','NORMAL','HIGH'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
            <Field label="Due date"><Input type="date" value={form.dueDate || ''} onChange={(e) => set('dueDate', e.target.value)} /></Field>
          </>
        )}
        {kind === 'escalation' && (
          <>
            <Field label="Reason code"><Select value={form.reasonCode || 'PERSISTENT_ACADEMIC_RISK'} onChange={(e) => set('reasonCode', e.target.value)}>{['PERSISTENT_ACADEMIC_RISK','SEVERE_ATTENDANCE_SHORTAGE','REPEATED_INTERVENTION_FAILURE','ADMINISTRATIVE_SUPPORT_REQUIRED','OTHER'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
            <Field label="Escalate to"><Select value={form.targetLevel || 'HOD'} onChange={(e) => set('targetLevel', e.target.value)}>{['HOD','PRINCIPAL'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
            <Field label="Reason"><Textarea value={form.reason || ''} onChange={(e) => set('reason', e.target.value)} required /></Field>
          </>
        )}
        {kind === 'referral' && (
          <>
            <Field label="Refer to"><Select value={form.targetFunction || 'ACADEMIC_SERVICES'} onChange={(e) => set('targetFunction', e.target.value)}>{['ACADEMIC_SERVICES','TP','FINANCE','GRIEVANCE','HOD','PRINCIPAL','OTHER'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
            <Field label="Subject"><Input value={form.subject || ''} onChange={(e) => set('subject', e.target.value)} required /></Field>
            <Field label="Context (minimum necessary)" hint="Do not include confidential notes"><Textarea value={form.context || ''} onChange={(e) => set('context', e.target.value)} /></Field>
          </>
        )}
        {kind === 'parent' && (
          <>
            <Field label="Date"><Input type="date" value={form.interactionDate || ''} onChange={(e) => set('interactionDate', e.target.value)} /></Field>
            <Field label="Mode"><Select value={form.mode || 'PHONE'} onChange={(e) => set('mode', e.target.value)}>{['PHONE','IN_PERSON','ONLINE','LETTER','OTHER'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
            <Field label="Initiated by"><Select value={form.initiatedBy || 'MENTOR'} onChange={(e) => set('initiatedBy', e.target.value)}>{['MENTOR','PARENT','INSTITUTION'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
            <Field label="Purpose"><Input value={form.purpose || ''} onChange={(e) => set('purpose', e.target.value)} required /></Field>
            <Field label="Summary"><Textarea value={form.summary || ''} onChange={(e) => set('summary', e.target.value)} /></Field>
            <Field label="Agreed follow-up"><Textarea value={form.agreedFollowUp || ''} onChange={(e) => set('agreedFollowUp', e.target.value)} /></Field>
          </>
        )}
      </div>
      {sessions.length ? null : null}
    </Modal>
  );
}
