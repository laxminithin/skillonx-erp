import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Field, Input, PageHeader, Select, Skeleton, Surface, Textarea } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/utils';
import { StatusPill, statusToneFor } from '../lms/studentUi';

type StaffCase = {
  id: number;
  grievanceNumber?: string;
  caseNumber?: string;
  category: string;
  subject: string;
  description?: string;
  status: string;
  priority?: string;
  confidentiality: string;
  studentName?: string | null;
  usn?: string | null;
  assignedToFacultyId?: number | null;
  assignedRole?: string | null;
  dueAt?: string | null;
  resolutionSummary?: string | null;
  timeline?: Array<{ type: string; publicMessage?: string | null; internalMessage?: string | null; createdAt: string }>;
  internalNotes?: Array<{ id: number; visibility: string; body: string; createdAt: string }>;
  messages?: Array<{ id: number; author: string; body: string; createdAt: string }>;
  attachments?: Array<{ id: number; fileName: string; mimeType: string; fileSize: number; visibility: string; createdAt: string }>;
  referrals?: Array<{ id: number; targetModule: string; safeReference?: string | null; status: string; safeSummary?: string | null; createdAt: string }>;
  appeals?: Array<{ id: number; reason: string; status: string; routedToRole?: string | null; createdAt: string }>;
};

function pretty(value?: string | null) {
  return String(value ?? '').replace(/_/g, ' ');
}

export function StaffActionCenterPage() {
  const [data, setData] = useState<{
    approvals: Array<{ requestId: number; requestNumber: string; title: string; typeLabel: string; studentName: string; usn: string; stepLabel: string }>;
    grievanceCount: number;
    meetingRequestCount: number;
    total: number;
  } | null>(null);
  useDocumentTitle('Action Center');

  useEffect(() => {
    api<NonNullable<typeof data>>('/api/student-services/action-center').then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in">
      <PageHeader title="My Approvals" subtitle={`${data.total} item(s) need your attention`} />
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Surface className="text-center"><p className="text-2xl font-semibold">{data.approvals.length}</p><p className="text-xs text-ink-muted">Requests</p></Surface>
        <Surface className="text-center"><p className="text-2xl font-semibold">{data.grievanceCount}</p><p className="text-xs text-ink-muted">Grievances</p></Surface>
        <Surface className="text-center"><p className="text-2xl font-semibold">{data.meetingRequestCount}</p><p className="text-xs text-ink-muted">Meetings</p></Surface>
      </div>
      {data.approvals.length === 0 ? (
        <Surface><p className="text-sm text-ink-muted">No pending approvals.</p></Surface>
      ) : (
        <div className="space-y-3">
          {data.approvals.map((a) => (
            <Link key={a.requestId} to={`/student-services/requests/${a.requestId}`} className="block rounded-[var(--radius-lg)] border border-border bg-surface p-4 hover:border-border-strong">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-xs text-ink-muted">{a.typeLabel} · {a.stepLabel}</p>
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-sm text-ink-muted">{a.studentName} ({a.usn})</p>
                  <p className="font-mono text-xs text-ink-muted">{a.requestNumber}</p>
                </div>
                <StatusPill tone="warning">Pending</StatusPill>
              </div>
            </Link>
          ))}
        </div>
      )}
      {data.grievanceCount > 0 ? (
        <Link to="/student-services/grievances" className="mt-4 inline-flex rounded-[var(--radius-md)] border border-border px-4 py-2 text-sm">View Grievances</Link>
      ) : null}
    </div>
  );
}

export function StaffRequestDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<{
    id: number;
    requestNumber: string;
    title: string;
    status: string;
    currentStage: string;
    student: { name: string; usn: string; departmentName: string };
    type: { label: string; generatesCertificate: boolean };
    timeline: Array<{ label: string; status: string; actorRole: string }>;
  } | null>(null);
  const [remarks, setRemarks] = useState('');
  const [acting, setActing] = useState(false);
  useDocumentTitle('Request Review');

  useEffect(() => {
    if (!id) return;
    api<NonNullable<typeof data>>(`/api/student-services/requests/${id}`).then(setData);
  }, [id]);

  async function act(action: string) {
    if (!id) return;
    setActing(true);
    try {
      const updated = await api<NonNullable<typeof data>>(`/api/student-services/requests/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, remarks }),
      });
      setData(updated);
      setRemarks('');
    } finally {
      setActing(false);
    }
  }

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader
        title={data.title}
        subtitle={data.requestNumber}
        actions={<StatusPill tone={statusToneFor(data.status)}>{data.status.replace(/_/g, ' ')}</StatusPill>}
      />
      <Surface className="mb-4">
        <p className="text-sm"><strong>{data.student.name}</strong> · {data.student.usn} · {data.student.departmentName}</p>
        <p className="text-sm text-ink-muted">{data.type.label} · {data.currentStage}</p>
      </Surface>
      <Surface className="mb-4">
        <h3 className="mb-3 text-sm font-semibold">Workflow</h3>
        <ol className="space-y-2">
          {data.timeline.map((s, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className={`h-2 w-2 rounded-full ${s.status === 'COMPLETED' ? 'bg-success' : s.status === 'IN_PROGRESS' ? 'bg-accent' : 'bg-surface-muted'}`} />
              {s.label} <span className="text-ink-muted">({s.actorRole})</span>
            </li>
          ))}
        </ol>
      </Surface>
      {!['COMPLETED', 'REJECTED', 'CANCELLED'].includes(data.status) ? (
        <Surface>
          <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks (visible to student unless internal)" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" disabled={acting} onClick={() => act('APPROVE')}>Approve</Button>
            <Button size="sm" variant="secondary" disabled={acting} onClick={() => act('REQUEST_ACTION')}>Request Action</Button>
            <Button size="sm" variant="danger" disabled={acting} onClick={() => act('REJECT')}>Reject</Button>
            {data.type.generatesCertificate && data.status === 'APPROVED' ? (
              <Button size="sm" disabled={acting} onClick={() => act('COMPLETE')}>Generate Certificate</Button>
            ) : null}
          </div>
        </Surface>
      ) : null}
    </div>
  );
}

export function StaffGrievancesPage() {
  const [grievances, setGrievances] = useState<StaffCase[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  useDocumentTitle('Grievance Queue');
  useEffect(() => {
    api<any>('/api/student-services/grievance-dashboard').then(setDashboard).catch(() => setDashboard(null));
  }, []);
  useEffect(() => {
    const q = new URLSearchParams();
    if (status) q.set('status', status);
    if (category) q.set('category', category);
    if (search) q.set('search', search);
    api<{ grievances: StaffCase[] }>(`/api/student-services/grievances?${q.toString()}`).then((d) => setGrievances(d.grievances));
  }, [status, category, search]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Grievance & Welfare Workspace" subtitle="Triage, route, resolve, and monitor need-to-know student cases" />
      {dashboard ? (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['New', dashboard.actionRequired?.newCases],
            ['Unassigned', dashboard.actionRequired?.unassigned],
            ['Awaiting Student', dashboard.actionRequired?.awaitingStudent],
            ['Restricted', dashboard.health?.restricted],
          ].map(([label, value]) => <Surface key={label} className="text-center"><p className="text-2xl font-semibold">{value ?? 0}</p><p className="text-xs text-ink-muted">{label}</p></Surface>)}
        </div>
      ) : null}
      <Surface className="mb-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Input placeholder="Search case number" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {['SUBMITTED','TRIAGED','ASSIGNED','UNDER_REVIEW','PENDING_INFORMATION','REFERRED','RESOLVED','REOPENED'].map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {['GENERAL_GRIEVANCE','ACADEMIC','EXAMINATION','FINANCE','HOSTEL','TRANSPORT','LIBRARY','LAB','FACILITIES','PLACEMENT','STUDENT_WELFARE','SAFETY_CONCERN','ANTI_RAGGING','HARASSMENT'].map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Button variant="secondary" onClick={() => { setStatus(''); setCategory(''); setSearch(''); }}>Reset</Button>
        </div>
      </Surface>
      <div className="space-y-3">
        {grievances.map((g) => (
          <Link key={g.id} to={`/student-services/grievances/${g.id}`} className="block rounded-[var(--radius-lg)] border border-border bg-surface p-4 hover:border-border-strong">
            <div className="flex justify-between gap-3">
              <div>
                <p className="text-xs text-ink-muted">{pretty(g.category)} · {pretty(g.confidentiality)} · {g.caseNumber ?? g.grievanceNumber}</p>
                <p className="font-semibold">{g.subject}</p>
                <p className="text-sm text-ink-muted">{g.studentName ?? 'Restricted'} {g.usn ? `(${g.usn})` : ''}</p>
                {g.dueAt ? <p className="text-xs text-ink-muted">Due {formatDate(g.dueAt)}</p> : null}
              </div>
              <StatusPill tone={statusToneFor(g.status)}>{pretty(g.status)}</StatusPill>
            </div>
          </Link>
        ))}
        {!grievances.length ? <Surface><p className="text-sm text-ink-muted">No cases match this view.</p></Surface> : null}
      </div>
    </div>
  );
}

export function StaffMenteesPage() {
  const [mentees, setMentees] = useState<Array<{
    studentId: number;
    name: string;
    usn: string;
    department: string;
    semester: string;
    pendingMeetings: number;
    insights: { attendance: number | null; cgpa: number | null; backlogs: unknown[]; alerts: string[] };
  }>>([]);
  useDocumentTitle('My Mentees');
  useEffect(() => {
    api<{ mentees: typeof mentees }>('/api/student-services/mentees').then((d) => setMentees(d.mentees));
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="My Mentees" subtitle="Academic advising dashboard" />
      {mentees.length === 0 ? (
        <Surface><p className="text-sm text-ink-muted">No mentees assigned.</p></Surface>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {mentees.map((m) => (
            <Surface key={m.studentId}>
              <p className="font-semibold">{m.name}</p>
              <p className="text-sm text-ink-muted">{m.usn} · {m.department} · {m.semester}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div><dt className="text-ink-muted">Attendance</dt><dd>{m.insights.attendance != null ? `${m.insights.attendance}%` : '—'}</dd></div>
                <div><dt className="text-ink-muted">CGPA</dt><dd>{m.insights.cgpa ?? '—'}</dd></div>
                <div><dt className="text-ink-muted">Backlogs</dt><dd>{m.insights.backlogs.length}</dd></div>
                <div><dt className="text-ink-muted">Pending Meetings</dt><dd>{m.pendingMeetings}</dd></div>
              </dl>
              {m.insights.alerts.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-warning">
                  {m.insights.alerts.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              ) : null}
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}

export function StaffServicesDashboardPage() {
  const [stats, setStats] = useState<{ pending: number; approvedToday: number; ready: number; openGrievances: number } | null>(null);
  useDocumentTitle('Student Services');
  useEffect(() => {
    api<NonNullable<typeof stats>>('/api/student-services/dashboard').then(setStats);
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Student Services" subtitle="Request processing and academic services dashboard" />
      {stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Pending Review', value: stats.pending },
            { label: 'Approved Today', value: stats.approvedToday },
            { label: 'Ready for Pickup', value: stats.ready },
            { label: 'Open Grievances', value: stats.openGrievances },
          ].map((s) => (
            <Surface key={s.label} className="text-center">
              <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
              <p className="mt-1 text-xs text-ink-muted">{s.label}</p>
            </Surface>
          ))}
        </div>
      ) : (
        <Skeleton className="h-24 w-full" />
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/student-services/action-center" className="inline-flex rounded-[var(--radius-md)] bg-accent px-3 py-1.5 text-sm font-medium text-white">Action Center</Link>
        <Link to="/student-services/grievances" className="inline-flex rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-sm">Grievances</Link>
        <Link to="/student-services/mentees" className="inline-flex rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-sm">Mentees</Link>
      </div>
    </div>
  );
}

export function StaffGrievanceDetailPage() {
  const { id } = useParams();
  const [g, setG] = useState<StaffCase | null>(null);
  const [triage, setTriage] = useState({ category: '', priority: 'NORMAL', confidentiality: 'NORMAL', reason: '' });
  const [assignFacultyId, setAssignFacultyId] = useState('');
  const [clarification, setClarification] = useState('');
  const [note, setNote] = useState('');
  const [referral, setReferral] = useState({ targetModule: 'MAINTENANCE', safeReference: '', safeSummary: '' });
  const [resolution, setResolution] = useState('');
  const [remarks, setRemarks] = useState('');
  useDocumentTitle('Grievance Review');

  async function load() {
    if (!id) return;
    api<NonNullable<typeof g>>(`/api/student-services/grievances/${id}`).then(setG);
  }
  useEffect(() => { load(); }, [id]);

  async function post(path: string, body: unknown) {
    if (!id) return;
    const updated = await api<StaffCase>(`/api/student-services/grievances/${id}/${path}`, { method: 'POST', body: JSON.stringify(body) });
    setG(updated);
  }

  async function triageCase() {
    await post('triage', { ...triage, category: triage.category || undefined, reason: triage.reason || undefined });
  }

  async function assign() {
    if (!assignFacultyId) return;
    await post('assign', { facultyId: Number(assignFacultyId), remarks: 'Assigned from case workspace' });
    setAssignFacultyId('');
  }

  async function resolve() {
    if (!id || !resolution) return;
    await post('resolve', { resolutionSummary: resolution, remarks });
    setResolution('');
    setRemarks('');
  }

  if (!g) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in">
      <PageHeader title={g.subject} subtitle={`${g.caseNumber ?? g.grievanceNumber} · ${g.studentName ?? 'Restricted requester'} ${g.usn ? `(${g.usn})` : ''}`} actions={<StatusPill tone={statusToneFor(g.status)}>{pretty(g.status)}</StatusPill>} />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Surface>
            <div className="mb-3 flex flex-wrap gap-2">
              <StatusPill tone="muted">{pretty(g.category)}</StatusPill>
              <StatusPill tone={g.confidentiality === 'RESTRICTED' ? 'danger' : g.confidentiality === 'CONFIDENTIAL' ? 'warning' : 'muted'}>{pretty(g.confidentiality)}</StatusPill>
              {g.priority ? <StatusPill tone={statusToneFor(g.priority)}>{pretty(g.priority)}</StatusPill> : null}
              {g.dueAt ? <span className="text-xs text-ink-muted">Due {formatDate(g.dueAt)}</span> : null}
            </div>
            {g.description ? <p className="whitespace-pre-wrap text-sm leading-6">{g.description}</p> : <p className="text-sm text-ink-muted">Restricted case details are hidden for this viewer.</p>}
          </Surface>

          <Surface>
            <h3 className="mb-3 text-sm font-semibold">Attachments</h3>
            {(g.attachments ?? []).length ? (
              <div className="space-y-2">
                {(g.attachments ?? []).map((a) => (
                  <a
                    key={a.id}
                    href={`/api/student-services/grievance-attachments/${a.id}/download`}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm hover:border-border-strong"
                  >
                    <span className="min-w-0 truncate">{a.fileName}</span>
                    <span className="shrink-0 text-xs text-ink-muted">{pretty(a.visibility)}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">No attachments available to this viewer.</p>
            )}
          </Surface>

          <Surface>
            <h3 className="mb-3 text-sm font-semibold">Timeline</h3>
            <div className="space-y-3">
              {(g.timeline ?? []).map((event, i) => (
                <div key={`${event.type}-${i}`} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{pretty(event.type)}</p>
                  {event.publicMessage ? <p className="text-ink-muted">{event.publicMessage}</p> : null}
                  {event.internalMessage ? <p className="mt-1 text-xs text-warning">{event.internalMessage}</p> : null}
                  <p className="mt-1 text-xs text-ink-muted">{formatDate(event.createdAt)}</p>
                </div>
              ))}
            </div>
          </Surface>

          <div className="grid gap-4 lg:grid-cols-2">
            <Surface>
              <h3 className="mb-3 text-sm font-semibold">Requester Communication</h3>
              <div className="mb-3 max-h-64 space-y-2 overflow-auto">
                {(g.messages ?? []).map((m) => <div key={m.id} className="rounded-lg bg-surface-muted p-2 text-sm"><p className="text-xs text-ink-muted">{m.author} · {formatDate(m.createdAt)}</p><p>{m.body}</p></div>)}
              </div>
              <Textarea rows={3} value={clarification} onChange={(e) => setClarification(e.target.value)} placeholder="Request clarification from the student" />
              <Button className="mt-2" size="sm" disabled={!clarification.trim()} onClick={async () => { await post('clarification', { body: clarification }); setClarification(''); }}>Request Clarification</Button>
            </Surface>

            <Surface>
              <h3 className="mb-3 text-sm font-semibold">Internal Notes</h3>
              <div className="mb-3 max-h-64 space-y-2 overflow-auto">
                {(g.internalNotes ?? []).map((n) => <div key={n.id} className="rounded-lg bg-surface-muted p-2 text-sm"><p className="text-xs text-ink-muted">{n.visibility} · {formatDate(n.createdAt)}</p><p>{n.body}</p></div>)}
              </div>
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note, never visible to student" />
              <Button className="mt-2" size="sm" disabled={!note.trim()} onClick={async () => { await post('internal-notes', { body: note, visibility: g.confidentiality === 'RESTRICTED' ? 'RESTRICTED' : 'TEAM' }); setNote(''); }}>Add Internal Note</Button>
            </Surface>
          </div>
        </div>

        <div className="space-y-4">
          <Surface>
            <h3 className="mb-3 text-sm font-semibold">Triage</h3>
            <div className="space-y-3">
              <Field label="Category"><Select value={triage.category} onChange={(e) => setTriage({ ...triage, category: e.target.value })}><option value="">Keep current</option>{['GENERAL_GRIEVANCE','ACADEMIC','EXAMINATION','FINANCE','HOSTEL','TRANSPORT','LIBRARY','LAB','FACILITIES','PLACEMENT','STUDENT_WELFARE','SAFETY_CONCERN','ANTI_RAGGING','HARASSMENT'].map((s) => <option key={s}>{s}</option>)}</Select></Field>
              <Field label="Official priority"><Select value={triage.priority} onChange={(e) => setTriage({ ...triage, priority: e.target.value })}>{['LOW','NORMAL','HIGH','URGENT'].map((s) => <option key={s}>{s}</option>)}</Select></Field>
              <Field label="Confidentiality"><Select value={triage.confidentiality} onChange={(e) => setTriage({ ...triage, confidentiality: e.target.value })}>{['NORMAL','CONFIDENTIAL','RESTRICTED'].map((s) => <option key={s}>{s}</option>)}</Select></Field>
              <Textarea rows={2} value={triage.reason} onChange={(e) => setTriage({ ...triage, reason: e.target.value })} placeholder="Triage reason" />
              <Button size="sm" onClick={triageCase}>Save Triage</Button>
            </div>
          </Surface>

          <Surface>
            <h3 className="mb-3 text-sm font-semibold">Assignment</h3>
            <Input type="number" value={assignFacultyId} onChange={(e) => setAssignFacultyId(e.target.value)} placeholder="Faculty user ID" />
            <Button className="mt-2" size="sm" disabled={!assignFacultyId} onClick={assign}>Assign</Button>
          </Surface>

          <Surface>
            <h3 className="mb-3 text-sm font-semibold">Referral</h3>
            <Select value={referral.targetModule} onChange={(e) => setReferral({ ...referral, targetModule: e.target.value })}>{['MAINTENANCE','MENTORING','OFFICE','FINANCE','COE','HOSTEL','TRANSPORT','LIBRARY','LAB','PLACEMENT','OTHER'].map((s) => <option key={s}>{s}</option>)}</Select>
            <Input className="mt-2" value={referral.safeReference} onChange={(e) => setReferral({ ...referral, safeReference: e.target.value })} placeholder="Safe reference" />
            <Textarea className="mt-2" rows={2} value={referral.safeSummary} onChange={(e) => setReferral({ ...referral, safeSummary: e.target.value })} placeholder="Minimum necessary summary" />
            <Button className="mt-2" size="sm" onClick={async () => post('referrals', referral)}>Refer</Button>
            {(g.referrals ?? []).map((r) => <p key={r.id} className="mt-2 text-xs text-ink-muted">{r.targetModule}: {r.safeReference || r.status}</p>)}
          </Surface>

          <Surface>
            <h3 className="mb-3 text-sm font-semibold">Resolution</h3>
            <Textarea rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Safe resolution summary visible to student" />
            <Textarea className="mt-2" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Internal resolution detail" />
            <Button className="mt-2" size="sm" disabled={!resolution.trim()} onClick={resolve}>Resolve</Button>
          </Surface>

          {(g.appeals ?? []).length ? (
            <Surface>
              <h3 className="mb-3 text-sm font-semibold">Appeals</h3>
              {(g.appeals ?? []).map((a) => <div key={a.id} className="rounded-lg border border-border p-2 text-sm"><p>{a.reason}</p><p className="text-xs text-ink-muted">{a.status} · {a.routedToRole}</p></div>)}
            </Surface>
          ) : null}
        </div>
      </div>
    </div>
  );
}
