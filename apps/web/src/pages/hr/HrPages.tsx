import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Input, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/utils';
import {
  CoverageClassCard,
  CoverageReviewList,
  CoverageRequestsInbox,
  ManagerCoverageDrawer,
  type CoverageRow,
} from './HrCoverageUi';
import { HrAttendanceCalendarPage } from './HrAttendanceClosurePages';

type LeaveBalance = {
  leaveTypeId: number;
  leaveTypeCode: string;
  leaveTypeName: string;
  availableBalance: number;
};

type LeaveRequest = {
  id: number;
  requestNumber: string;
  leaveTypeName: string;
  fromDate: string;
  toDate: string;
  requestedDays: number;
  status: string;
  isEmergency: boolean;
};

export function HrSelfDashboardPage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  useDocumentTitle('My HR');

  useEffect(() => {
    api<LeaveBalance[]>('/api/hr/me/leave/balances').then(setBalances).catch(() => setBalances([]));
    api<LeaveRequest[]>('/api/hr/me/leave/requests').then(setRequests).catch(() => setRequests([]));
  }, []);

  const cl = balances.find((b) => b.leaveTypeCode === 'CL');
  const el = balances.find((b) => b.leaveTypeCode === 'EL');

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="My HR" subtitle="Leave, attendance, payslips and HR profile" />
      <Surface className="p-5">
        <p className="text-xs uppercase tracking-wide text-ink-muted">Leave balance</p>
        <div className="mt-3 flex flex-wrap gap-6">
          <div>
            <p className="text-sm text-ink-muted">Casual Leave</p>
            <p className="text-2xl font-semibold tabular-nums">{cl?.availableBalance ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Earned Leave</p>
            <p className="text-2xl font-semibold tabular-nums">{el?.availableBalance ?? '—'}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/hr/leave/apply"><Button>Apply Leave</Button></Link>
          <Link to="/hr/attendance"><Button variant="secondary">My Attendance</Button></Link>
          <Link to="/hr/payslips"><Button variant="secondary">Payslips</Button></Link>
          <Link to="/hr/me/performance"><Button variant="secondary">My Performance</Button></Link>
          <Link to="/hr/learning"><Button variant="secondary">My Learning</Button></Link>
          <Link to="/hr/profile"><Button variant="secondary">HR Profile</Button></Link>
          <Link to="/hr/service-history"><Button variant="secondary">Service History</Button></Link>
          <Link to="/hr/resignation"><Button variant="secondary">Resignation</Button></Link>
          <Link to="/hr/separation"><Button variant="secondary">My Exit</Button></Link>
        </div>
      </Surface>
      <CoverageRequestsInbox />
      <Surface className="p-5">
        <h2 className="text-sm font-semibold">Recent leave requests</h2>
        {requests.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">No leave requests yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-ink-muted">
                <tr>
                  <th className="py-2 pr-4">Request</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Dates</th>
                  <th className="py-2 pr-4">Days</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.slice(0, 5).map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-2 pr-4 font-mono text-xs">{r.requestNumber}</td>
                    <td className="py-2 pr-4">{r.leaveTypeName}</td>
                    <td className="py-2 pr-4">{formatDate(r.fromDate)} – {formatDate(r.toDate)}</td>
                    <td className="py-2 pr-4 tabular-nums">{r.requestedDays}</td>
                    <td className="py-2">{r.status}</td>
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

export function HrApplyLeavePage() {
  const [step, setStep] = useState(1);
  const [types, setTypes] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [requestId, setRequestId] = useState<number | null>(null);
  const [coverages, setCoverages] = useState<CoverageRow[]>([]);
  const [summary, setSummary] = useState<{ resolved: number; totalAffected: number; status: string; unresolved: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const isTodayLeave = fromDate === today || toDate === today;
  useDocumentTitle('Apply Leave');

  useEffect(() => {
    api<typeof types>('/api/hr/me/leave/types').then(setTypes).catch(() => setTypes([]));
  }, []);

  async function refreshCoverage(id: number) {
    const data = await api<{ coverages: CoverageRow[]; summary: typeof summary }>(`/api/hr/me/leave/requests/${id}/coverage`);
    setCoverages(data.coverages);
    setSummary(data.summary);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const created = await api<{ id: number }>('/api/hr/me/leave/requests', {
        method: 'POST',
        body: JSON.stringify({
          leaveTypeId: Number(leaveTypeId),
          fromDate,
          toDate,
          fromSession: 'FULL_DAY',
          toSession: 'FULL_DAY',
          reason,
          isEmergency,
        }),
      });
      setRequestId(created.id);
      await refreshCoverage(created.id);
      setStep(2);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to create leave');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitLeave() {
    if (!requestId) return;
    setSubmitting(true);
    try {
      await api(`/api/hr/me/leave/requests/${requestId}/submit`, { method: 'POST' });
      setMessage('Leave request submitted.');
      setStep(5);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Submit blocked — complete coverage first');
    } finally {
      setSubmitting(false);
    }
  }

  const stepLabels = ['Leave', 'Impact', 'Arrange', 'Review', 'Submit'];

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-4 px-1 pb-8">
      <PageHeader title="Apply Leave" subtitle="Step-by-step leave with academic continuity" />
      <div className="flex flex-wrap gap-2 text-xs">
        {stepLabels.map((label, i) => (
          <span key={label} className={`rounded-full px-3 py-1 ${step === i + 1 ? 'bg-accent text-white' : 'bg-surface-muted text-ink-muted'}`}>
            {i + 1}. {label}
          </span>
        ))}
      </div>

      {isTodayLeave && isEmergency ? (
        <Surface className="border-warning/40 bg-warning/10 p-4">
          <p className="text-sm font-semibold text-warning">URGENT ACADEMIC ARRANGEMENT</p>
          <p className="mt-1 text-sm">You have teaching sessions today. Arrange now or request HOD to arrange.</p>
        </Surface>
      ) : null}

      {step === 1 ? (
        <Surface className="p-5">
          <form onSubmit={handleCreate} className="space-y-4">
            <label className="block text-sm">
              Leave type
              <select className="mt-1 w-full rounded border border-border bg-surface px-3 py-2" value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)} required>
                <option value="">Select…</option>
                {types.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">From<Input type="date" className="mt-1" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required /></label>
              <label className="block text-sm">To<Input type="date" className="mt-1" value={toDate} onChange={(e) => setToDate(e.target.value)} required /></label>
            </div>
            <label className="block text-sm">
              Reason
              <textarea className="mt-1 w-full rounded border border-border bg-surface px-3 py-2" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)} />
              Emergency leave
            </label>
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Continue'}</Button>
          </form>
        </Surface>
      ) : null}

      {step >= 2 && summary ? (
        <Surface className="space-y-3 p-5">
          <p className="text-sm font-semibold">Step 2 — Academic impact</p>
          <p className="text-sm">{summary.totalAffected} class(es) affected</p>
          {step === 2 ? <Button onClick={() => setStep(3)}>Arrange classes</Button> : null}
        </Surface>
      ) : null}

      {step >= 3 && coverages.length > 0 ? (
        <Surface className="space-y-4 p-5">
          <p className="text-sm font-semibold">Step 3 — Arrange classes</p>
          {coverages.map((c) => (
            <CoverageClassCard
              key={c.id}
              coverage={c}
              requestId={requestId ?? 0}
              onUpdated={() => requestId && refreshCoverage(requestId)}
            />
          ))}
          {step === 3 ? <Button onClick={() => setStep(4)}>Coverage review</Button> : null}
        </Surface>
      ) : null}

      {step >= 4 && summary ? (
        <Surface className="p-5">
          <p className="text-sm font-semibold">Step 4 — Academic coverage</p>
          <p className="mt-1 text-sm">{summary.totalAffected} affected classes</p>
          <CoverageReviewList coverages={coverages} />
          <p className="mt-3 text-lg font-semibold tabular-nums">
            {summary.resolved} / {summary.totalAffected} {summary.status}
          </p>
          {summary.unresolved > 0 && !isEmergency ? (
            <p className="text-sm text-warning">{summary.unresolved} class(es) still require arrangement.</p>
          ) : null}
          {step === 4 ? (
            <Button className="mt-3" onClick={handleSubmitLeave} disabled={submitting || (!isEmergency && summary.status !== 'COMPLETE')}>
              Submit leave
            </Button>
          ) : null}
        </Surface>
      ) : null}

      {step === 5 ? (
        <Surface className="p-5">
          <p className="font-semibold text-success">Leave submitted successfully.</p>
        </Surface>
      ) : null}

      {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
      <Link to="/hr" className="text-sm text-accent hover:underline">← Back to My HR</Link>
    </div>
  );
}

export function HrProfilePage() {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  useDocumentTitle('HR Profile');
  useEffect(() => {
    api<Record<string, unknown>>('/api/hr/me/profile').then(setProfile).catch(() => setProfile(null));
  }, []);
  if (!profile) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="HR Profile" />
      <Surface className="space-y-2 p-5 text-sm">
        <p><span className="text-ink-muted">Employee #</span> {String(profile.employeeNumber)}</p>
        <p><span className="text-ink-muted">Name</span> {String(profile.displayName)}</p>
        <p><span className="text-ink-muted">Department</span> {String(profile.departmentName ?? '—')}</p>
        <p><span className="text-ink-muted">Designation</span> {String(profile.designationName ?? '—')}</p>
        <p><span className="text-ink-muted">Status</span> {String(profile.employmentStatus)}</p>
      </Surface>
    </div>
  );
}

export function HrAttendancePage() {
  return <HrAttendanceCalendarPage />;
}

export function HrAdminDashboardPage() {
  const [data, setData] = useState<Record<string, number> | null>(null);
  useDocumentTitle('HR Admin');
  useEffect(() => {
    api<Record<string, number>>('/api/hr/admin/dashboard').then(setData).catch(() => setData(null));
  }, []);
  if (!data) return <Skeleton className="h-40 w-full" />;
  const cards = [
    { label: 'Total Employees', value: data.totalEmployees },
    { label: 'Faculty', value: data.facultyEmployees ?? 0 },
    { label: 'Non-Teaching', value: data.nonTeachingEmployees ?? 0 },
    { label: 'Active', value: data.activeEmployees },
    { label: 'On Probation', value: data.probationEmployees },
    { label: 'On Notice', value: data.employeesOnNotice ?? 0 },
    { label: 'Joining Soon', value: data.joiningSoon ?? 0 },
    { label: 'Contracts Expiring', value: data.contractsExpiring ?? 0 },
    { label: 'Incomplete Onboarding', value: data.incompleteOnboarding ?? 0 },
    { label: 'Clearance Pending', value: data.clearancePending ?? 0 },
    { label: 'Open HR Actions', value: data.openHrActions ?? 0 },
  ];
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="HR Dashboard" subtitle="Employee lifecycle, leave, attendance and payroll" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Surface key={c.label} className="p-4">
            <p className="text-xs uppercase text-ink-muted">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</p>
          </Surface>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/hr/admin/employees"><Button variant="secondary">Employees</Button></Link>
        <Link to="/hr/admin/onboarding"><Button variant="secondary">Onboarding</Button></Link>
        <Link to="/hr/admin/leave"><Button variant="secondary">Leave</Button></Link>
        <Link to="/hr/admin/attendance"><Button variant="secondary">Attendance</Button></Link>
        <Link to="/hr/payroll"><Button variant="secondary">Payroll</Button></Link>
        <Link to="/hr/fnf"><Button variant="secondary">Final Settlement</Button></Link>
        <Link to="/hr/performance"><Button variant="secondary">Performance</Button></Link>
        <Link to="/hr/recruitment"><Button variant="secondary">Recruitment</Button></Link>
        <Link to="/hr/analytics"><Button>Analytics</Button></Link>
        <Link to="/hr/ld"><Button variant="secondary">Learning & Dev</Button></Link>
        <Link to="/hr/succession"><Button variant="secondary">Succession</Button></Link>
        <Link to="/hr/me/performance"><Button variant="secondary">My Performance</Button></Link>
        <Link to="/hr/manager"><Button variant="secondary">Manager</Button></Link>
        <Link to="/hr/management"><Button variant="secondary">Management</Button></Link>
      </div>
    </div>
  );
}

export function HrAdminEmployeesPage() {
  const [items, setItems] = useState<Array<{ id: number; displayName: string; employeeNumber: string; employmentStatus: string; departmentName?: string; designationName?: string }>>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  useDocumentTitle('Employees');

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    api<{ items: typeof items }>(`/api/hr/admin/employees?${params}`).then((d) => setItems(d.items)).catch(() => setItems([]));
  }, [search, status]);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Employees" />
      <div className="flex flex-wrap gap-2">
        <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <select className="rounded border border-border bg-surface px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PROBATION">Probation</option>
          <option value="PRE_JOINING">Pre-Joining</option>
          <option value="ON_NOTICE">On Notice</option>
        </select>
        <Link to="/hr/admin/employees/new"><Button size="sm">Add Employee</Button></Link>
        <Link to="/hr/admin/onboarding"><Button variant="secondary" size="sm">Onboarding</Button></Link>
      </div>
      <div className="overflow-x-auto rounded border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Employee #</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{e.employeeNumber}</td>
                <td className="px-4 py-3">{e.displayName}</td>
                <td className="px-4 py-3">{e.departmentName ?? '—'}</td>
                <td className="px-4 py-3">{e.designationName ?? '—'}</td>
                <td className="px-4 py-3">{e.employmentStatus}</td>
                <td className="px-4 py-3">
                  <Link to={`/hr/admin/employees/${e.id}`} className="text-accent hover:underline">360</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function HrManagerPage() {
  const [pending, setPending] = useState<LeaveRequest[]>([]);
  const [coverageTab, setCoverageTab] = useState<'attention' | 'today' | 'upcoming' | 'resolved'>('attention');
  const [coverage, setCoverage] = useState<Array<Record<string, unknown>>>([]);
  const [drawerId, setDrawerId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [team, setTeam] = useState<Array<Record<string, unknown>>>([]);
  const [probationReviews, setProbationReviews] = useState<Array<Record<string, unknown>>>([]);
  const [separations, setSeparations] = useState<Array<Record<string, unknown>>>([]);
  useDocumentTitle('Manager HR');

  const loadCoverage = () => {
    api<typeof coverage>(`/api/hr/manager/coverage?filter=${coverageTab}`).then(setCoverage).catch(() => setCoverage([]));
  };

  useEffect(() => {
    api<{ pendingLeave: LeaveRequest[] }>('/api/hr/manager/dashboard').then((d) => setPending(d.pendingLeave ?? []));
    api<typeof team>('/api/hr/manager/team').then(setTeam).catch(() => setTeam([]));
    api<typeof probationReviews>('/api/hr/manager/probation').then(setProbationReviews).catch(() => setProbationReviews([]));
    api<typeof separations>('/api/hr/manager/separations').then(setSeparations).catch(() => setSeparations([]));
  }, []);

  useEffect(() => { loadCoverage(); }, [coverageTab]);

  const emergency = coverage.filter((c) => c.priority === 'CRITICAL' || c.isEmergency);

  async function approve(id: number) {
    try {
      await api(`/api/hr/manager/leave/${id}/approve`, { method: 'POST', body: JSON.stringify({}) });
      setMessage('Leave approved.');
      setPending((p) => p.filter((r) => r.id !== id));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Approval failed');
    }
  }

  async function reject(id: number) {
    await api(`/api/hr/manager/leave/${id}/reject`, { method: 'POST', body: JSON.stringify({}) });
    setPending((p) => p.filter((r) => r.id !== id));
  }

  return (
    <div className="animate-fade-in min-w-0 max-w-full space-y-4 px-1 pb-8">
      <PageHeader title="Manager / HOD" subtitle="Team leave, attendance and academic coverage" />
      {message ? <p className="text-sm text-ink-muted">{message}</p> : null}

      {emergency.length > 0 && coverageTab === 'attention' ? (
        <Surface className="border-danger/30 bg-danger/5 p-4">
          <h2 className="text-sm font-semibold text-danger">Emergency coverage — CRITICAL</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {emergency.map((c) => (
              <li key={String(c.id)} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <strong>{String(c.employeeName)}</strong> · {formatDate(String(c.affectedDate))} · {String(c.subjectName)} {String(c.className)}
                  <span className="ml-2 rounded bg-danger/20 px-1 text-xs text-danger">{String(c.priority ?? 'CRITICAL')}</span>
                </span>
                <Button size="sm" onClick={() => setDrawerId(Number(c.id))}>Arrange now</Button>
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}

      <Surface className="p-4">
        <h2 className="text-sm font-semibold">Pending leave</h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">No pending requests.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {pending.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 border-b border-border py-2 sm:flex-row sm:items-center sm:justify-between">
                <span>{r.leaveTypeName} · {formatDate(r.fromDate)} – {formatDate(r.toDate)} · {r.status}</span>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => approve(r.id)}>Approve</Button>
                  <Button variant="secondary" onClick={() => reject(r.id)}>Reject</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Surface>

      <Surface className="p-4">
        <h2 className="text-sm font-semibold">My team</h2>
        {team.length === 0 ? <p className="mt-2 text-sm text-ink-muted">No direct reports.</p> : (
          <ul className="mt-2 space-y-1 text-sm">
            {team.map((e) => (
              <li key={String(e.id)}>{String(e.displayName ?? e.display_name)} · {String(e.employmentStatus ?? e.employment_status)}</li>
            ))}
          </ul>
        )}
      </Surface>

      <Surface className="p-4">
        <h2 className="text-sm font-semibold">Probation reviews</h2>
        {probationReviews.length === 0 ? <p className="mt-2 text-sm text-ink-muted">No probation reviews due.</p> : (
          <ul className="mt-2 space-y-2 text-sm">
            {probationReviews.map((p) => (
              <li key={String(p.id)} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2">
                <span>{String(p.employeeName ?? p.display_name ?? 'Employee')} · due {p.current_end_date ? formatDate(String(p.current_end_date)) : '—'}</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    await api(`/api/hr/manager/probation/${p.id}/recommend`, {
                      method: 'POST',
                      body: JSON.stringify({ recommendation: 'CONFIRM', remarks: 'Manager recommendation via UI' }),
                    });
                    setMessage('Probation recommendation submitted.');
                  }}
                >
                  Recommend confirm
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Surface>

      <Surface className="p-4">
        <h2 className="text-sm font-semibold">Team separations</h2>
        {separations.length === 0 ? <p className="mt-2 text-sm text-ink-muted">No separation requests.</p> : (
          <ul className="mt-2 space-y-1 text-sm">
            {separations.map((s) => (
              <li key={String(s.id)}>{String(s.employeeName ?? s.display_name)} · {String(s.status)}</li>
            ))}
          </ul>
        )}
      </Surface>

      <Surface className="p-4">
        <h2 className="text-sm font-semibold">Academic coverage</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {(['attention', 'today', 'upcoming', 'resolved'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`rounded px-3 py-1.5 text-xs capitalize ${coverageTab === tab ? 'bg-accent text-white' : 'bg-surface-muted'}`}
              onClick={() => setCoverageTab(tab)}
            >
              {tab === 'attention' ? 'Needs attention' : tab}
            </button>
          ))}
        </div>
        <div className="mt-3 max-w-full overflow-x-auto">
          <table className="w-max min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-ink-muted">
              <tr>
                <th className="py-2 pr-3">Faculty</th>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Class</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2 pr-3">Priority</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {coverage.map((c) => (
                <tr key={String(c.id)} className="border-t border-border">
                  <td className="py-2 pr-3">{String(c.employeeName ?? '—')}</td>
                  <td className="py-2 pr-3">{formatDate(String(c.affectedDate))}</td>
                  <td className="py-2 pr-3">{String(c.className)} {String(c.subjectName)}</td>
                  <td className="py-2 pr-3">{String(c.coverageType ?? '—')}</td>
                  <td className="py-2 pr-3">
                    <span className={c.priority === 'CRITICAL' ? 'font-semibold text-danger' : ''}>{String(c.priority ?? 'NORMAL')}</span>
                  </td>
                  <td className="py-2 pr-3">{String(c.status)}</td>
                  <td className="py-2">
                    <Button variant="secondary" size="sm" onClick={() => setDrawerId(Number(c.id))}>Actions</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      {drawerId ? (
        <ManagerCoverageDrawer
          coverageId={drawerId}
          onClose={() => setDrawerId(null)}
          onUpdated={() => { loadCoverage(); setDrawerId(null); }}
        />
      ) : null}
    </div>
  );
}

export function HrManagementPage() {
  const [data, setData] = useState<{ totalHeadcount: number; byDepartment: unknown[] } | null>(null);
  useDocumentTitle('HR Management');
  useEffect(() => {
    api<typeof data>('/api/hr/management/dashboard').then(setData).catch(() => setData(null));
  }, []);
  if (!data) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Management HR Analytics" subtitle="Read-only workforce insights" />
      <div className="flex flex-wrap gap-2">
        <Link to="/hr/analytics"><Button>Open HR Analytics</Button></Link>
      </div>
      <Surface className="p-4">
        <p className="text-xs uppercase text-ink-muted">Total headcount</p>
        <p className="text-3xl font-semibold tabular-nums">{data.totalHeadcount}</p>
      </Surface>
    </div>
  );
}
