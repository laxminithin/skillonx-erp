import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../lib/api';
import { EmptyState, Input, PageHeader, Surface } from '../components/ui';
import { formatDateTime, SURVEY_TYPE_LABELS } from '../lib/utils';

type Student = {
  id: number;
  name: string;
  usn: string;
  email: string;
  departmentName?: string;
  submissionCount: number;
};

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (query = q) => {
    setLoading(true);
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    try {
      const res = await api<{ students: Student[] }>(`/api/students${params}`);
      setStudents(res.students);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Students"
        subtitle="Central student master with survey participation history."
      />
      <div className="mb-4 flex gap-2">
        <div className="relative max-w-md flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Search by name, USN, or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <button
          type="button"
          className="h-10 rounded-[var(--radius-md)] bg-accent px-3.5 text-sm font-medium text-white"
          onClick={() => load()}
        >
          Search
        </button>
      </div>

      {loading ? (
        <Surface className="text-sm text-ink-muted">Loading students…</Surface>
      ) : !students.length ? (
        <EmptyState
          title="No students yet"
          body="Students appear after their first survey response."
        />
      ) : (
        <Surface padded={false}>
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[12px] uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-3 font-medium">USN</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Surveys</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-muted/50">
                  <td className="px-5 py-3.5">
                    <Link to={`/students/${s.id}`} className="font-medium text-accent hover:underline">
                      {s.usn}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">{s.name}</td>
                  <td className="px-5 py-3.5 text-ink-muted">{s.email}</td>
                  <td className="px-5 py-3.5 text-ink-muted">{s.departmentName || '—'}</td>
                  <td className="px-5 py-3.5 tabular-nums">{s.submissionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      )}
    </div>
  );
}

export function StudentDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<{
    student: { name: string; usn: string; email: string };
    history: Array<{
      submissionId: number;
      surveyId: number;
      title: string;
      surveyType: string;
      submittedAt: string;
      identityMode: string;
    }>;
  } | null>(null);

  useEffect(() => {
    api<NonNullable<typeof data>>(`/api/students/${id}`).then(setData).catch(console.error);
  }, [id]);

  if (!data) return <div className="text-ink-muted">Loading…</div>;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={data.student.name}
        subtitle={`${data.student.usn} · ${data.student.email}`}
      />
      <Surface>
        <h3 className="text-sm font-semibold">Survey history</h3>
        <div className="mt-4 space-y-2">
          {data.history.map((h) => (
            <Link
              key={h.submissionId}
              to={`/surveys/${h.surveyId}?tab=responses`}
              className="block rounded-[var(--radius-md)] border border-border px-4 py-3 transition hover:border-accent/40"
            >
              <p className="font-medium">{h.title}</p>
              <p className="text-sm text-ink-muted">
                {SURVEY_TYPE_LABELS[h.surveyType] ?? h.surveyType} · {formatDateTime(h.submittedAt)}
                {h.identityMode === 'ANONYMOUS' ? ' · Anonymous survey' : ''}
              </p>
            </Link>
          ))}
          {!data.history.length ? (
            <p className="text-sm text-ink-muted">No completed surveys yet.</p>
          ) : null}
        </div>
      </Surface>
    </div>
  );
}
