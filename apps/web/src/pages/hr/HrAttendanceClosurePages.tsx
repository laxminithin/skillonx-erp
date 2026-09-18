import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Input, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/utils';

type DayRecord = {
  date: string;
  attendanceStatus: string;
  lateMinutes?: number;
  firstInAt?: string;
  lastOutAt?: string;
};

type MonthSummary = {
  workingDays: number;
  presentDays: number;
  absenceDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  halfDays: number;
  holidays: number;
  weeklyOffs: number;
  payableDays: number;
  lopDays: number;
  lateCount: number;
};

const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-800',
  ABSENT: 'bg-red-100 text-red-800',
  HALF_DAY: 'bg-amber-100 text-amber-800',
  ON_LEAVE: 'bg-blue-100 text-blue-800',
  HOLIDAY: 'bg-purple-100 text-purple-800',
  WEEKLY_OFF: 'bg-slate-100 text-slate-600',
  ON_DUTY: 'bg-cyan-100 text-cyan-800',
  WORK_FROM_HOME: 'bg-indigo-100 text-indigo-800',
  MISSING_PUNCH: 'bg-orange-100 text-orange-800',
  NOT_JOINED: 'bg-slate-50 text-slate-400',
  SEPARATED: 'bg-slate-50 text-slate-400',
  SUSPENDED: 'bg-yellow-100 text-yellow-800',
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'bg-surface-muted text-ink-muted';
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{status.replace(/_/g, ' ')}</span>;
}

export function HrAttendanceCalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState<DayRecord[]>([]);
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  useDocumentTitle('My Attendance');

  useEffect(() => {
    setLoading(true);
    api<{ summary: MonthSummary | null; days: DayRecord[] }>(`/api/hr/me/attendance/summary?year=${year}&month=${month}`)
      .then((d) => {
        setSummary(d.summary);
        setDays(d.days);
      })
      .catch(() => {
        setSummary(null);
        setDays([]);
      })
      .finally(() => setLoading(false));
  }, [year, month]);

  const summaryCards = summary
    ? [
        { label: 'Working days', value: summary.workingDays },
        { label: 'Present', value: summary.presentDays },
        { label: 'Absent', value: summary.absenceDays },
        { label: 'Paid leave', value: summary.paidLeaveDays },
        { label: 'LOP / unpaid', value: summary.unpaidLeaveDays },
        { label: 'Half days', value: summary.halfDays },
        { label: 'Payable days', value: summary.payableDays },
        { label: 'LOP days', value: summary.lopDays },
        { label: 'Late marks', value: summary.lateCount },
      ]
    : [];

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title="My Attendance"
        subtitle="Monthly calendar and summary"
        actions={
          <Link to="/hr/attendance/regularization">
            <Button variant="secondary" size="sm">Regularization</Button>
          </Link>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <Input type="number" className="w-24" value={month} onChange={(e) => setMonth(Number(e.target.value))} min={1} max={12} />
        <Input type="number" className="w-28" value={year} onChange={(e) => setYear(Number(e.target.value))} />
      </div>
      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          {summaryCards.length > 0 && (
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {summaryCards.map((c) => (
                <Surface key={c.label} className="p-3">
                  <p className="text-xs text-ink-muted">{c.label}</p>
                  <p className="text-lg font-semibold tabular-nums">{c.value}</p>
                </Surface>
              ))}
            </div>
          )}
          <div className="hidden md:block overflow-x-auto rounded border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">In</th>
                  <th className="px-4 py-3">Out</th>
                  <th className="px-4 py-3">Late</th>
                </tr>
              </thead>
              <tbody>
                {days.map((r) => (
                  <tr key={r.date} className="border-t border-border">
                    <td className="px-4 py-3">{formatDate(r.date)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.attendanceStatus} /></td>
                    <td className="px-4 py-3 text-xs">{r.firstInAt ? new Date(r.firstInAt).toLocaleTimeString() : '—'}</td>
                    <td className="px-4 py-3 text-xs">{r.lastOutAt ? new Date(r.lastOutAt).toLocaleTimeString() : '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{r.lateMinutes ?? 0}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-2">
            {days.map((r) => (
              <Surface key={r.date} className="p-3 flex justify-between items-center gap-2">
                <div>
                  <p className="font-medium">{formatDate(r.date)}</p>
                  <StatusBadge status={r.attendanceStatus} />
                </div>
                {r.lateMinutes ? <span className="text-xs text-ink-muted">Late {r.lateMinutes}m</span> : null}
              </Surface>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function HrRegularizationPage() {
  const [requests, setRequests] = useState<Array<{ id: number; attendanceDate: string; status: string; regularizationReason: string }>>([]);
  const [form, setForm] = useState({ attendanceDate: '', regularizationReason: 'MISSED_PUNCH', reason: '', requestedInAt: '', requestedOutAt: '' });
  const [submitting, setSubmitting] = useState(false);
  useDocumentTitle('Attendance Regularization');

  useEffect(() => {
    api<typeof requests>('/api/hr/me/attendance/regularizations').then(setRequests).catch(() => setRequests([]));
  }, []);

  async function submit() {
    setSubmitting(true);
    try {
      await api('/api/hr/me/attendance/regularizations', {
        method: 'POST',
        body: JSON.stringify({
          attendanceDate: form.attendanceDate,
          regularizationReason: form.regularizationReason,
          reason: form.reason,
          requestedInAt: form.requestedInAt || null,
          requestedOutAt: form.requestedOutAt || null,
        }),
      });
      const refreshed = await api<typeof requests>('/api/hr/me/attendance/regularizations');
      setRequests(refreshed);
      setForm({ attendanceDate: '', regularizationReason: 'MISSED_PUNCH', reason: '', requestedInAt: '', requestedOutAt: '' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Regularization" subtitle="Request correction for missing or incorrect attendance" />
      <Surface className="p-4 space-y-3 max-w-lg">
        <Input type="date" value={form.attendanceDate} onChange={(e) => setForm({ ...form, attendanceDate: e.target.value })} />
        <select className="w-full rounded border border-border px-3 py-2 text-sm" value={form.regularizationReason} onChange={(e) => setForm({ ...form, regularizationReason: e.target.value })}>
          <option value="MISSED_PUNCH">Missed punch</option>
          <option value="DEVICE_FAILURE">Device failure</option>
          <option value="OFFICIAL_WORK">Official work</option>
          <option value="WRONG_SHIFT">Wrong shift</option>
          <option value="OTHER">Other</option>
        </select>
        <Input type="time" value={form.requestedInAt} onChange={(e) => setForm({ ...form, requestedInAt: e.target.value })} placeholder="In time" />
        <Input type="time" value={form.requestedOutAt} onChange={(e) => setForm({ ...form, requestedOutAt: e.target.value })} placeholder="Out time" />
        <textarea className="w-full rounded border border-border px-3 py-2 text-sm" rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Explain the reason..." />
        <Button onClick={submit} disabled={submitting || !form.attendanceDate || form.reason.length < 3}>Submit request</Button>
      </Surface>
      <div className="space-y-2">
        {requests.map((r) => (
          <Surface key={r.id} className="p-3 flex justify-between">
            <span>{formatDate(r.attendanceDate)} — {r.regularizationReason}</span>
            <StatusBadge status={r.status} />
          </Surface>
        ))}
      </div>
    </div>
  );
}

export function HrManagerAttendancePage() {
  const [team, setTeam] = useState<Array<{ employeeName: string; employeeNumber: string; attendanceStatus: string }>>([]);
  const [pending, setPending] = useState<Array<{ id: number; employeeName: string; attendanceDate: string; regularizationReason: string }>>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  useDocumentTitle('Team Attendance');

  useEffect(() => {
    api<typeof team>(`/api/hr/manager/attendance/team?date=${date}`).then(setTeam).catch(() => setTeam([]));
    api<typeof pending>('/api/hr/manager/attendance/regularizations').then(setPending).catch(() => setPending([]));
  }, [date]);

  async function approve(id: number) {
    await api(`/api/hr/manager/attendance/regularizations/${id}/approve`, { method: 'POST', body: JSON.stringify({ remarks: 'Approved' }) });
    setPending(await api('/api/hr/manager/attendance/regularizations'));
  }

  async function reject(id: number) {
    await api(`/api/hr/manager/attendance/regularizations/${id}/reject`, { method: 'POST', body: JSON.stringify({ remarks: 'Rejected' }) });
    setPending(await api('/api/hr/manager/attendance/regularizations'));
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Team Attendance" />
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-xs" />
      <Surface className="overflow-x-auto">
        <table className="min-w-full text-sm hidden md:table">
          <thead className="bg-surface-muted text-xs uppercase text-ink-muted">
            <tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">#</th><th className="px-4 py-3">Status</th></tr>
          </thead>
          <tbody>
            {team.map((t, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-4 py-3">{t.employeeName}</td>
                <td className="px-4 py-3 font-mono text-xs">{t.employeeNumber}</td>
                <td className="px-4 py-3"><StatusBadge status={t.attendanceStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="md:hidden space-y-2 p-2">
          {team.map((t, i) => (
            <div key={i} className="flex justify-between border-b border-border py-2">
              <span>{t.employeeName}</span>
              <StatusBadge status={t.attendanceStatus} />
            </div>
          ))}
        </div>
      </Surface>
      <div>
        <h2 className="text-sm font-semibold mb-2">Pending regularizations ({pending.length})</h2>
        <div className="space-y-2">
          {pending.map((p) => (
            <Surface key={p.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-medium">{p.employeeName}</p>
                <p className="text-xs text-ink-muted">{formatDate(p.attendanceDate)} — {p.regularizationReason}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => approve(p.id)}>Approve</Button>
                <Button size="sm" variant="secondary" onClick={() => reject(p.id)}>Reject</Button>
              </div>
            </Surface>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HrAdminAttendancePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [register, setRegister] = useState<{ closure: { status: string; exceptionCount: number }; summaries: Array<{ employeeName: string; employeeNumber: string; workingDays: number; payableDays: number; lopDays: number; absenceDays: number; unresolvedCount: number }> } | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [processing, setProcessing] = useState(false);
  useDocumentTitle('HR Attendance');

  useEffect(() => {
    api<typeof register>(`/api/hr/admin/attendance/register?year=${year}&month=${month}`).then(setRegister).catch(() => setRegister(null));
    api<Record<string, number>>('/api/hr/admin/attendance/dashboard').then(setStats).catch(() => setStats(null));
  }, [year, month]);

  async function runAction(action: string) {
    setProcessing(true);
    try {
      await api(`/api/hr/admin/attendance/months/${year}/${month}/${action}`, { method: 'POST', body: '{}' });
      setRegister(await api(`/api/hr/admin/attendance/register?year=${year}&month=${month}`));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Attendance Register"
        subtitle="Monthly closure and LOP inputs"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/hr/admin/attendance/settings"><Button variant="secondary" size="sm">Settings</Button></Link>
            <Link to="/hr/admin/attendance/holidays"><Button variant="secondary" size="sm">Holidays</Button></Link>
          </div>
        }
      />
      {stats && (
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(stats).map(([k, v]) => (
            <Surface key={k} className="p-3">
              <p className="text-xs text-ink-muted">{k.replace(/([A-Z])/g, ' $1')}</p>
              <p className="text-lg font-semibold tabular-nums">{v}</p>
            </Surface>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Input type="number" className="w-24" value={month} onChange={(e) => setMonth(Number(e.target.value))} min={1} max={12} />
        <Input type="number" className="w-28" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        {register && (
          <span className="text-sm">Closure: <strong>{register.closure.status}</strong> ({register.closure.exceptionCount} exceptions)</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={processing} onClick={() => runAction('process')}>Process</Button>
        <Button size="sm" variant="secondary" disabled={processing} onClick={() => runAction('finalize')}>Finalize</Button>
        <Button size="sm" variant="secondary" disabled={processing} onClick={() => runAction('lock')}>Lock</Button>
      </div>
      {register && (
        <Surface className="overflow-x-auto">
          <table className="min-w-full text-sm hidden lg:table">
            <thead className="bg-surface-muted text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Working</th>
                <th className="px-3 py-2">Payable</th>
                <th className="px-3 py-2">LOP</th>
                <th className="px-3 py-2">Absent</th>
                <th className="px-3 py-2">Unresolved</th>
              </tr>
            </thead>
            <tbody>
              {register.summaries.map((s, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-3 py-2">{s.employeeName}</td>
                  <td className="px-3 py-2 font-mono text-xs">{s.employeeNumber}</td>
                  <td className="px-3 py-2 tabular-nums">{s.workingDays}</td>
                  <td className="px-3 py-2 tabular-nums">{s.payableDays}</td>
                  <td className="px-3 py-2 tabular-nums">{s.lopDays}</td>
                  <td className="px-3 py-2 tabular-nums">{s.absenceDays}</td>
                  <td className="px-3 py-2 tabular-nums">{s.unresolvedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="lg:hidden space-y-2 p-2">
            {register.summaries.map((s, i) => (
              <Surface key={i} className="p-3">
                <p className="font-medium">{s.employeeName}</p>
                <p className="text-xs text-ink-muted">Payable {s.payableDays} · LOP {s.lopDays} · Absent {s.absenceDays}</p>
              </Surface>
            ))}
          </div>
        </Surface>
      )}
    </div>
  );
}

export function HrAttendanceSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [schedules, setSchedules] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [shifts, setShifts] = useState<Array<{ id: number; name: string; code: string }>>([]);
  useDocumentTitle('Attendance Settings');

  useEffect(() => {
    api<Record<string, unknown>>('/api/hr/admin/attendance/settings').then(setSettings).catch(() => setSettings(null));
    api<typeof schedules>('/api/hr/admin/attendance/work-schedules').then(setSchedules).catch(() => setSchedules([]));
    api<typeof shifts>('/api/hr/admin/attendance/shifts').then(setShifts).catch(() => setShifts([]));
  }, []);

  async function save(patch: Record<string, unknown>) {
    const updated = await api<Record<string, unknown>>('/api/hr/admin/attendance/settings', { method: 'PATCH', body: JSON.stringify(patch) });
    setSettings(updated);
  }

  if (!settings) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Attendance Settings" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Attendance Settings" />
      <Surface className="p-4 space-y-4 max-w-xl">
        <label className="block text-sm">
          Sandwich leave policy
          <select className="mt-1 w-full rounded border border-border px-3 py-2" value={String(settings.sandwichLeavePolicy)} onChange={(e) => save({ sandwichLeavePolicy: e.target.value })}>
            <option value="DISABLED">Disabled</option>
            <option value="WEEKLY_OFF">Weekly off between leave</option>
            <option value="HOLIDAY">Holiday between leave</option>
            <option value="BOTH">Both</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!settings.lateMarksCountAsLop} onChange={(e) => save({ lateMarksCountAsLop: e.target.checked })} />
          Late marks count as LOP
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!settings.autoFlagMissingPunch} onChange={(e) => save({ autoFlagMissingPunch: e.target.checked })} />
          Auto-flag missing punch
        </label>
        <label className="block text-sm">
          Default work schedule
          <select className="mt-1 w-full rounded border border-border px-3 py-2" value={Number(settings.defaultWorkScheduleId ?? 0)} onChange={(e) => save({ defaultWorkScheduleId: Number(e.target.value) || null })}>
            <option value={0}>—</option>
            {schedules.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          Default shift
          <select className="mt-1 w-full rounded border border-border px-3 py-2" value={Number(settings.defaultShiftId ?? 0)} onChange={(e) => save({ defaultShiftId: Number(e.target.value) || null })}>
            <option value={0}>—</option>
            {shifts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      </Surface>
      <Link to="/hr/admin/attendance"><Button variant="secondary">Back to register</Button></Link>
    </div>
  );
}

export function HrAttendanceHolidaysPage() {
  const [holidays, setHolidays] = useState<Array<{ id: number; name: string; holidayDate: string; holidayType: string }>>([]);
  const [form, setForm] = useState({ name: '', holidayDate: '', holidayType: 'INSTITUTION' });
  useDocumentTitle('Holiday Calendar');

  useEffect(() => {
    api<typeof holidays>('/api/hr/admin/attendance/holidays').then(setHolidays).catch(() => setHolidays([]));
  }, []);

  async function addHoliday() {
    await api('/api/hr/admin/attendance/holidays', { method: 'POST', body: JSON.stringify(form) });
    setHolidays(await api('/api/hr/admin/attendance/holidays'));
    setForm({ name: '', holidayDate: '', holidayType: 'INSTITUTION' });
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Holiday Calendar" />
      <Surface className="p-4 space-y-2 max-w-md">
        <Input placeholder="Holiday name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input type="date" value={form.holidayDate} onChange={(e) => setForm({ ...form, holidayDate: e.target.value })} />
        <Button onClick={addHoliday} disabled={!form.name || !form.holidayDate}>Add holiday</Button>
      </Surface>
      <div className="space-y-2">
        {holidays.map((h) => (
          <Surface key={h.id} className="p-3 flex justify-between">
            <span>{formatDate(h.holidayDate)} — {h.name}</span>
            <span className="text-xs text-ink-muted">{h.holidayType}</span>
          </Surface>
        ))}
      </div>
    </div>
  );
}
