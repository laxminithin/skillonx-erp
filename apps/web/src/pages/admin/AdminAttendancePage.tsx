import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

type Overview = {
  policy: { minimumPercentage: number };
  classes: Array<{
    classId: number;
    name: string;
    code: string;
    status: string;
    approvedStudents: number;
    sessions: number;
    draftSessions: number;
    average: number | null;
  }>;
  subjects: Array<{
    courseId: number;
    code: string;
    name: string;
    sessions: number;
    average: number | null;
  }>;
  faculty: Array<{ facultyId: number; name: string; completed: number; open: number }>;
};

export function AdminAttendancePage() {
  useDocumentTitle('Attendance');
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Overview>('/api/attendance/admin/overview')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

  if (!data && !error) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Attendance"
        subtitle={`Class-derived attendance. Recommended minimum ${data?.policy.minimumPercentage ?? 85}%.`}
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Surface>
        <h2 className="text-sm font-semibold">Class-wise</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-ink-muted">
                <th className="py-2 pr-3 font-medium">Class</th>
                <th className="py-2 pr-3 font-medium">Students</th>
                <th className="py-2 pr-3 font-medium">Sessions</th>
                <th className="py-2 font-medium">Average</th>
              </tr>
            </thead>
            <tbody>
              {(data?.classes || []).map((c) => (
                <tr key={c.classId} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3">
                    {c.name}
                    <span className="ml-2 text-xs text-ink-muted">{c.code}</span>
                  </td>
                  <td className="py-2 pr-3 tabular-nums">{c.approvedStudents}</td>
                  <td className="py-2 pr-3 tabular-nums">
                    {c.sessions}
                    {c.draftSessions ? ` (+${c.draftSessions} open)` : ''}
                  </td>
                  <td className="py-2 tabular-nums">{c.average != null ? `${c.average}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface>
          <h2 className="text-sm font-semibold">Subject-wise</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.subjects || []).map((s) => (
              <li key={s.courseId} className="flex items-center justify-between gap-3">
                <span>
                  {s.name} <span className="text-ink-muted">{s.code}</span>
                </span>
                <span className="tabular-nums text-ink-secondary">
                  {s.sessions} sessions · {s.average != null ? `${s.average}%` : '—'}
                </span>
              </li>
            ))}
          </ul>
        </Surface>
        <Surface>
          <h2 className="text-sm font-semibold">Faculty session completion</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.faculty || []).map((f) => (
              <li key={f.facultyId} className="flex items-center justify-between gap-3">
                <span>{f.name}</span>
                <span className="tabular-nums text-ink-secondary">
                  {f.completed} completed · {f.open} open
                </span>
              </li>
            ))}
          </ul>
        </Surface>
      </div>
    </div>
  );
}
