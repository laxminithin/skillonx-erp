import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/utils';
import { StatusPill, StudentEmpty } from './studentUi';

type Summary = {
  overall: number | null;
  standing: { label: string; tone: string };
  belowCount: number;
  policy: { minimumPercentage: number };
  subjects: Array<{
    courseId: number;
    code: string;
    name: string;
    percentage: number | null;
    standing: { label: string; tone: string };
    PRESENT: number;
    ABSENT: number;
    LATE: number;
    EXCUSED: number;
    total: number;
  }>;
};

type Detail = {
  course: { id: number; code: string; name: string };
  percentage: number | null;
  standing: { label: string; tone: string };
  PRESENT: number;
  ABSENT: number;
  LATE: number;
  EXCUSED: number;
  total: number;
  history: Array<{ sessionId: number; date: string; topicLabel?: string | null; status: string }>;
};

function tone(t: string): 'success' | 'warning' | 'danger' | 'muted' | 'accent' {
  if (t === 'success') return 'success';
  if (t === 'warning') return 'warning';
  if (t === 'danger') return 'danger';
  return 'muted';
}

export function StudentAttendancePage() {
  useDocumentTitle('Attendance');
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Summary>('/api/student/attendance')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!data) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Attendance" subtitle={`Recommended minimum ${data.policy.minimumPercentage}%`} />
      <Surface className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Overall</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums">{data.overall != null ? `${data.overall}%` : '—'}</p>
          <div className="mt-2">
            <StatusPill tone={tone(data.standing.tone)}>{data.standing.label}</StatusPill>
          </div>
        </div>
        {data.belowCount > 0 ? (
          <p className="text-sm text-warning">{data.belowCount} subject(s) below recommended level</p>
        ) : (
          <p className="text-sm text-ink-muted">All subjects meet the recommended level where recorded.</p>
        )}
      </Surface>

      {data.subjects.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {data.subjects.map((s) => (
            <Link key={s.courseId} to={`/lms/attendance/${s.courseId}`}>
              <Surface className="h-full transition hover:border-accent/40">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{s.code}</p>
                <p className="mt-1 font-semibold">{s.name}</p>
                <p className="mt-3 text-2xl font-semibold tabular-nums">{s.percentage != null ? `${s.percentage}%` : '—'}</p>
                <div className="mt-2">
                  <StatusPill tone={tone(s.standing.tone)}>{s.standing.label}</StatusPill>
                </div>
                <p className="mt-3 text-xs text-ink-muted">
                  {s.PRESENT} present · {s.ABSENT} absent · {s.LATE} late · {s.total} sessions
                </p>
              </Surface>
            </Link>
          ))}
        </div>
      ) : (
        <StudentEmpty title="No attendance yet" body="Attendance appears after your faculty finalizes class sessions." />
      )}
    </div>
  );
}

export function StudentSubjectAttendancePage() {
  const { courseId } = useParams();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useDocumentTitle(data?.course.name || 'Attendance');

  useEffect(() => {
    if (!courseId) return;
    api<Detail>(`/api/student/attendance/subjects/${courseId}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!data) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={data.course.name}
        subtitle={`${data.course.code} · Attendance`}
        actions={
          <Link to="/lms/attendance">
            <Button variant="secondary">All subjects</Button>
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border sm:grid-cols-5">
        {[
          { label: 'Attendance', value: data.percentage != null ? `${data.percentage}%` : '—' },
          { label: 'Present', value: String(data.PRESENT) },
          { label: 'Absent', value: String(data.ABSENT) },
          { label: 'Late', value: String(data.LATE) },
          { label: 'Excused', value: String(data.EXCUSED) },
        ].map((m) => (
          <div key={m.label} className="bg-surface px-4 py-4">
            <p className="text-[11px] uppercase tracking-wide text-ink-muted">{m.label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">{m.value}</p>
          </div>
        ))}
      </div>
      <div>
        <StatusPill tone={tone(data.standing.tone)}>{data.standing.label}</StatusPill>
      </div>
      <Surface padded={false}>
        {data.history.length ? (
          data.history.map((h) => (
            <div key={h.sessionId} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0">
              <div>
                <p className="font-medium">{formatDate(h.date)}</p>
                <p className="text-xs text-ink-muted">{h.topicLabel || 'Class session'}</p>
              </div>
              <StatusPill tone={h.status === 'PRESENT' || h.status === 'LATE' ? 'success' : h.status === 'EXCUSED' ? 'accent' : 'danger'}>
                {h.status}
              </StatusPill>
            </div>
          ))
        ) : (
          <div className="p-5">
            <StudentEmpty title="No sessions" body="No finalized attendance sessions for this subject yet." />
          </div>
        )}
      </Surface>
    </div>
  );
}
