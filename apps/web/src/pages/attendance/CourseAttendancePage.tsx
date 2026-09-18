import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api, downloadAttendanceCsv } from '../../lib/api';
import { Button, Field, Input, PageHeader, Select, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { StatusPill } from '../lms/studentUi';

type SessionDetail = {
  session: {
    id: number;
    academicClassId: number;
    courseId: number;
    sessionDate: string;
    periodNumber: number | null;
    topicLabel: string | null;
    status: string;
    className?: string;
    courseName?: string;
  };
  summary: { PRESENT: number; ABSENT: number; LATE: number; EXCUSED: number; total: number; percentage: number | null };
  records: Array<{ studentId: number; usn: string; name: string; status: string; remarks?: string | null }>;
};

type SessionList = {
  sessions: Array<{ id: number; sessionDate: string; status: string; className?: string; topicLabel?: string | null }>;
};

type Analytics = {
  sessions: number;
  average: number | null;
  belowThreshold: Array<{ studentId: number; usn: string; name: string; percentage: number | null }>;
  policy: { minimumPercentage: number };
};

const statuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const;

export function CourseAttendancePage() {
  const { courseId } = useParams();
  const [params] = useSearchParams();
  const classId = params.get('classId') ? Number(params.get('classId')) : undefined;
  const id = Number(courseId);
  const [list, setList] = useState<SessionList | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [createForm, setCreateForm] = useState({
    academicClassId: classId ? String(classId) : '',
    sessionDate: new Date().toISOString().slice(0, 10),
    periodNumber: '1',
    topicLabel: '',
  });

  useDocumentTitle(detail?.session.courseName || 'Attendance');

  const reload = async () => {
    if (!Number.isFinite(id)) return;
    const sessions = await api<SessionList>(
      `/api/attendance/courses/${id}/sessions${classId ? `?classId=${classId}` : ''}`,
    );
    setList(sessions);
    if (classId) {
      const a = await api<Analytics>(`/api/attendance/courses/${id}/classes/${classId}/analytics`);
      setAnalytics(a);
    }
  };

  useEffect(() => {
    reload().catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [id, classId]);

  useEffect(() => {
    if (!activeId) {
      setDetail(null);
      return;
    }
    api<SessionDetail>(`/api/attendance/sessions/${activeId}`)
      .then(setDetail)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load session'));
  }, [activeId]);

  const createSession = async (e: FormEvent) => {
    e.preventDefault();
    if (!createForm.academicClassId) {
      setError('Select or provide an academic class id (from class LMS).');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const created = await api<SessionDetail>('/api/attendance/sessions', {
        method: 'POST',
        body: JSON.stringify({
          academicClassId: Number(createForm.academicClassId),
          courseId: id,
          sessionDate: createForm.sessionDate,
          periodNumber: Number(createForm.periodNumber) || 1,
          topicLabel: createForm.topicLabel || null,
        }),
      });
      setActiveId(created.session.id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create session');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (studentId: number, status: string) => {
    if (!detail) return;
    let reason: string | undefined;
    if (detail.session.status === 'COMPLETED') {
      const entered = window.prompt('Reason for changing finalized attendance?');
      if (!entered?.trim()) {
        setError('A reason is required to change finalized attendance.');
        return;
      }
      reason = entered.trim();
    }
    setBusy(true);
    try {
      const next = await api<SessionDetail>(`/api/attendance/sessions/${detail.session.id}/records`, {
        method: 'PATCH',
        body: JSON.stringify({
          records: [{ studentId, status }],
          reason,
        }),
      });
      setDetail(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update');
    } finally {
      setBusy(false);
    }
  };

  const markAllPresent = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      setDetail(await api(`/api/attendance/sessions/${detail.session.id}/mark-all-present`, { method: 'POST' }));
    } finally {
      setBusy(false);
    }
  };

  const finalize = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      setDetail(await api(`/api/attendance/sessions/${detail.session.id}/finalize`, { method: 'POST' }));
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const classHint = useMemo(() => classId || createForm.academicClassId, [classId, createForm.academicClassId]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Attendance"
        subtitle="Class roll comes from approved Academic Class enrollments."
        actions={
          <div className="flex flex-wrap gap-2">
            {classId ? (
              <Button
                variant="secondary"
                onClick={() => downloadAttendanceCsv(id, classId).catch((e) => setError(e instanceof Error ? e.message : 'Export failed'))}
              >
                Export CSV
              </Button>
            ) : null}
            <Link to={`/courses/${id}`}>
              <Button variant="secondary">Back to course</Button>
            </Link>
          </div>
        }
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {analytics ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Surface>
            <p className="text-xs uppercase text-ink-muted">Sessions</p>
            <p className="mt-1 text-2xl font-semibold">{analytics.sessions}</p>
          </Surface>
          <Surface>
            <p className="text-xs uppercase text-ink-muted">Average</p>
            <p className="mt-1 text-2xl font-semibold">{analytics.average != null ? `${analytics.average}%` : '—'}</p>
          </Surface>
          <Surface>
            <p className="text-xs uppercase text-ink-muted">Below {analytics.policy.minimumPercentage}%</p>
            <p className="mt-1 text-2xl font-semibold">{analytics.belowThreshold.length}</p>
          </Surface>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <Surface>
            <h2 className="text-sm font-semibold">New session</h2>
            <form className="mt-3 space-y-3" onSubmit={createSession}>
              <Field label="Academic class ID">
                <Input
                  required
                  value={createForm.academicClassId}
                  onChange={(e) => setCreateForm({ ...createForm, academicClassId: e.target.value })}
                  placeholder={classHint ? String(classHint) : 'e.g. 1'}
                />
              </Field>
              <Field label="Date">
                <Input
                  type="date"
                  required
                  value={createForm.sessionDate}
                  onChange={(e) => setCreateForm({ ...createForm, sessionDate: e.target.value })}
                />
              </Field>
              <Field label="Period">
                <Input
                  value={createForm.periodNumber}
                  onChange={(e) => setCreateForm({ ...createForm, periodNumber: e.target.value })}
                />
              </Field>
              <Field label="Topic label" optional>
                <Input
                  value={createForm.topicLabel}
                  onChange={(e) => setCreateForm({ ...createForm, topicLabel: e.target.value })}
                />
              </Field>
              <p className="text-xs text-ink-muted">Changes save as you mark. Finalize when the period is complete.</p>
              <Button type="submit" disabled={busy} className="w-full">
                Create session
              </Button>
            </form>
          </Surface>
          <Surface padded={false}>
            <div className="border-b border-border px-4 py-3 text-sm font-semibold">Sessions</div>
            {!list ? (
              <div className="p-4">
                <Skeleton className="h-16 w-full" />
              </div>
            ) : list.sessions.length ? (
              list.sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  className={`block w-full border-b border-border px-4 py-3 text-left last:border-0 hover:bg-surface-muted ${
                    activeId === s.id ? 'bg-accent-soft/40' : ''
                  }`}
                >
                  <p className="font-medium">{s.sessionDate}</p>
                  <p className="text-xs text-ink-muted">
                    {s.className} · {s.status}
                  </p>
                </button>
              ))
            ) : (
              <p className="p-4 text-sm text-ink-muted">No sessions yet.</p>
            )}
          </Surface>
        </div>

        <div>
          {!detail ? (
            <Surface>
              <p className="text-sm text-ink-muted">Select or create a session to mark attendance.</p>
            </Surface>
          ) : (
            <Surface>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{detail.session.sessionDate}</h2>
                  <p className="text-sm text-ink-muted">
                    {detail.session.className} · {detail.session.topicLabel || 'Class session'}
                  </p>
                  <div className="mt-2">
                    <StatusPill tone={detail.session.status === 'COMPLETED' ? 'success' : 'accent'}>
                      {detail.session.status}
                    </StatusPill>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" disabled={busy} onClick={markAllPresent}>
                    Mark all present
                  </Button>
                  {detail.session.status !== 'COMPLETED' ? (
                    <Button disabled={busy} onClick={finalize}>
                      Finalize
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-muted">
                {detail.summary.PRESENT}/{detail.summary.total} present
                {detail.summary.percentage != null ? ` · ${detail.summary.percentage}%` : ''}
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-ink-muted">
                      <th className="py-2 pr-3 font-medium">USN</th>
                      <th className="py-2 pr-3 font-medium">Name</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.records.map((r) => (
                      <tr key={r.studentId} className="border-b border-border last:border-0">
                        <td className="py-2 pr-3 font-mono text-xs">{r.usn}</td>
                        <td className="py-2 pr-3">{r.name}</td>
                        <td className="py-2">
                          <Select
                            value={r.status}
                            disabled={busy}
                            onChange={(e) => setStatus(r.studentId, e.target.value)}
                          >
                            {statuses.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Surface>
          )}
        </div>
      </div>
    </div>
  );
}
