import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Input, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/utils';
import { ProgressBar, StatusPill, StudentEmpty, statusToneFor } from './studentUi';

export function StudentPerformancePage() {
  const [data, setData] = useState<{
    overall: {
      progress: number;
      assignments: { obtained: number; max: number; done: number; total: number };
      quizzes: { obtained: number; max: number; done: number; total: number };
      internals: { obtained: number; max: number; done: number; total: number };
      attendance?: number | null;
      attendanceStanding?: { label: string } | null;
    } | null;
    subjects: Array<{
      courseId: number;
      name: string;
      code: string;
      learningProgress: number;
      assignments: { obtained: number; max: number };
      quizzes: { obtained: number; max: number };
      internals: { obtained: number; max: number };
      attendance: number | null;
    }>;
  } | null>(null);
  useDocumentTitle('Performance');
  useEffect(() => {
    api<NonNullable<typeof data>>('/api/student/performance').then(setData).catch(() => setData({ overall: null, subjects: [] }));
  }, []);
  if (!data) return <Skeleton className="h-40 w-full" />;
  const o = data.overall;
  return (
    <div className="animate-fade-in">
      <PageHeader title="Performance" subtitle="Assignments, quizzes, internals, attendance, and learning progress stay separate. No combined grade is invented." />
      {o ? (
        <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border sm:grid-cols-5">
          {[
            { label: 'Learning', value: `${o.progress}%` },
            { label: 'Assignments', value: o.assignments.max ? `${o.assignments.obtained}/${o.assignments.max}` : '—' },
            { label: 'Quizzes', value: o.quizzes.max ? `${o.quizzes.obtained}/${o.quizzes.max}` : '—' },
            { label: 'Internals', value: o.internals.max ? `${o.internals.obtained}/${o.internals.max}` : '—' },
            { label: 'Attendance', value: o.attendance != null ? `${o.attendance}%` : '—' },
          ].map((m) => (
            <div key={m.label} className="bg-surface px-5 py-5">
              <p className="text-[12px] uppercase tracking-wide text-ink-muted">{m.label}</p>
              <p className="mt-2 text-xl font-semibold tabular-nums">{m.value}</p>
            </div>
          ))}
        </div>
      ) : null}
      {data.subjects.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.subjects.map((s) => (
            <Link key={s.courseId} to={`/lms/subjects/${s.courseId}?tab=performance`} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 hover:border-border-strong">
              <p className="text-xs uppercase tracking-wide text-ink-muted">{s.code}</p>
              <p className="mt-1 font-semibold">{s.name}</p>
              <ProgressBar className="mt-3" value={s.learningProgress} />
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-ink-muted">Assignments</dt>
                  <dd>{s.assignments.max ? `${s.assignments.obtained}/${s.assignments.max}` : '—'}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Quizzes</dt>
                  <dd>{s.quizzes.max ? `${s.quizzes.obtained}/${s.quizzes.max}` : '—'}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">IA</dt>
                  <dd>{s.internals.max ? `${s.internals.obtained}/${s.internals.max}` : '—'}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Attendance</dt>
                  <dd>{s.attendance != null ? `${s.attendance}%` : '—'}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      ) : (
        <StudentEmpty title="No results yet" body="Performance fills in as assignments, quizzes, and internals are released." />
      )}
    </div>
  );
}

export function StudentHistoryPage() {
  const [data, setData] = useState<{ history: Array<{ classId: number; displayName: string; academicYearLabel: string; semesterLabel: string; status: string; current: boolean }> } | null>(null);
  useDocumentTitle('Academic History');
  useEffect(() => {
    api<NonNullable<typeof data>>('/api/student/history').then(setData).catch(() => setData({ history: [] }));
  }, []);
  if (!data) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="animate-fade-in">
      <PageHeader title="Academic history" subtitle="Each semester stays its own class. Past records are not overwritten." />
      {data.history.length ? (
        <Surface padded={false}>
          {data.history.map((row) => (
            <Link key={row.classId} to={`/lms/history/${row.classId}`} className="flex items-center justify-between border-b border-border px-5 py-4 last:border-0 hover:bg-surface-muted">
              <div>
                <p className="font-medium">{row.displayName}</p>
                <p className="text-xs text-ink-muted">{row.academicYearLabel} · {row.semesterLabel}</p>
              </div>
              <StatusPill tone={row.current ? 'accent' : 'muted'}>{row.current ? 'ACTIVE' : row.status}</StatusPill>
            </Link>
          ))}
        </Surface>
      ) : (
        <StudentEmpty title="No history yet" body="Completed semesters will list here as you progress." />
      )}
    </div>
  );
}

export function StudentHistoryClassPage() {
  const { classId } = useParams();
  const [data, setData] = useState<{
    class: { displayName: string; academicYearLabel: string };
    attendance?: { overall: number | null; standing?: { label: string } | null } | null;
    subjects: Array<{
      courseId: number;
      name: string;
      code: string;
      facultyName: string | null;
      progress: number;
      attendance?: number | null;
    }>;
  } | null>(null);
  useDocumentTitle('Semester');
  useEffect(() => {
    api<NonNullable<typeof data>>(`/api/student/history/${classId}`).then(setData);
  }, [classId]);
  if (!data) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={data.class.displayName}
        subtitle={`${data.class.academicYearLabel}${
          data.attendance?.overall != null ? ` · Attendance ${data.attendance.overall}%` : ''
        }`}
      />
      <div className="grid gap-3 md:grid-cols-2">
        {data.subjects.map((s) => (
          <Link key={s.courseId} to={`/lms/subjects/${s.courseId}`} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <p className="text-xs text-ink-muted">{s.code}</p>
            <p className="font-semibold">{s.name}</p>
            <p className="text-sm text-ink-muted">{s.facultyName || '—'}</p>
            {s.attendance != null ? (
              <p className="mt-2 text-sm text-ink-secondary">Attendance {s.attendance}%</p>
            ) : null}
            <ProgressBar className="mt-3" value={s.progress} />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function StudentPapersPage() {
  const [params, setParams] = useSearchParams();
  const [papers, setPapers] = useState<Array<{ id: number; subjectName: string; courseCode?: string; examYear?: number | null; examType?: string | null; scheme?: string | null; sourceUrl?: string | null }>>([]);
  useDocumentTitle('Previous papers');
  useEffect(() => {
    const qs = params.toString();
    api<{ papers: typeof papers }>(`/api/student/papers${qs ? `?${qs}` : ''}`)
      .then((d) => setPapers(d.papers))
      .catch(() => setPapers([]));
  }, [params]);
  return (
    <div className="animate-fade-in">
      <PageHeader title="Previous year papers" subtitle="Read-only library for subjects in your class." />
      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        <Input
          placeholder="Year"
          defaultValue={params.get('year') || ''}
          onBlur={(e) => {
            const next = new URLSearchParams(params);
            if (e.target.value) next.set('year', e.target.value);
            else next.delete('year');
            setParams(next);
          }}
        />
        <Input
          placeholder="Scheme"
          defaultValue={params.get('scheme') || ''}
          onBlur={(e) => {
            const next = new URLSearchParams(params);
            if (e.target.value) next.set('scheme', e.target.value);
            else next.delete('scheme');
            setParams(next);
          }}
        />
        <Input
          placeholder="Exam type"
          defaultValue={params.get('examType') || ''}
          onBlur={(e) => {
            const next = new URLSearchParams(params);
            if (e.target.value) next.set('examType', e.target.value);
            else next.delete('examType');
            setParams(next);
          }}
        />
      </div>
      {papers.length ? (
        <Surface padded={false}>
          {papers.map((p) => (
            <div key={p.id} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0">
              <Link to={`/lms/papers/${p.id}`} className="min-w-0 hover:text-accent">
                <p className="font-medium">{p.subjectName}</p>
                <p className="text-xs text-ink-muted">{p.courseCode} · {p.examType} · {p.examYear} · {p.scheme}</p>
              </Link>
              {p.sourceUrl ? (
                <a className="text-sm font-medium text-accent" href={p.sourceUrl} target="_blank" rel="noreferrer">
                  Download
                </a>
              ) : null}
            </div>
          ))}
        </Surface>
      ) : (
        <StudentEmpty title="No papers found" body="Try another filter, or open a subject to see its papers." />
      )}
    </div>
  );
}

export function StudentPaperDetailPage() {
  const { id } = useParams();
  const [paper, setPaper] = useState<{
    subjectName: string;
    examYear?: number | null;
    examType?: string | null;
    sourceUrl?: string | null;
    questions: Array<{ id: number; questionNumber: number; questionText: string; maxMarks: number | null }>;
  } | null>(null);
  useDocumentTitle('Question paper');
  useEffect(() => {
    api<{ paper: NonNullable<typeof paper> }>(`/api/student/papers/${id}`).then((d) => setPaper(d.paper));
  }, [id]);
  if (!paper) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={paper.subjectName}
        subtitle={`${paper.examType || ''} ${paper.examYear || ''}`}
        actions={
          paper.sourceUrl ? (
            <a href={paper.sourceUrl} target="_blank" rel="noreferrer">
              <Button>Download</Button>
            </a>
          ) : null
        }
      />
      <ol className="space-y-4">
        {paper.questions.map((q) => (
          <li key={q.id} className="rounded-[var(--radius-md)] border border-border bg-surface p-4">
            <p className="text-xs text-ink-muted">Q{q.questionNumber}{q.maxMarks != null ? ` · ${q.maxMarks} marks` : ''}</p>
            <p className="mt-1 whitespace-pre-wrap">{q.questionText}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function StudentNotificationsPage() {
  const [data, setData] = useState<{ notifications: Array<{ id: number; title: string; body?: string | null; status: string; createdAt: string; link?: string | null }>; unread: number } | null>(null);
  useDocumentTitle('Notifications');
  const load = () => api<NonNullable<typeof data>>('/api/student/notifications').then(setData);
  useEffect(() => {
    load().catch(() => setData({ notifications: [], unread: 0 }));
  }, []);
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Notifications"
        subtitle={data ? `${data.unread} unread` : undefined}
        actions={
          <Button
            variant="secondary"
            onClick={async () => {
              await api('/api/student/notifications/read-all', { method: 'POST' });
              load();
            }}
          >
            Mark all read
          </Button>
        }
      />
      {data?.notifications.length ? (
        <Surface padded={false}>
          {data.notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              className="block w-full border-b border-border px-5 py-3 text-left last:border-0 hover:bg-surface-muted"
              onClick={async () => {
                await api(`/api/student/notifications/${n.id}/read`, { method: 'POST' });
                if (n.link) window.location.assign(n.link);
                else load();
              }}
            >
              <div className="flex items-center gap-2">
                <p className="font-medium">{n.title}</p>
                {n.status === 'UNREAD' ? <StatusPill tone="accent">Unread</StatusPill> : null}
              </div>
              {n.body ? <p className="text-sm text-ink-muted">{n.body}</p> : null}
              <p className="text-xs text-ink-muted">{formatDate(n.createdAt)}</p>
            </button>
          ))}
        </Surface>
      ) : (
        <StudentEmpty title="No notifications" body="Class approvals, new work, and released results will appear here." />
      )}
    </div>
  );
}

export function StudentCalendarPage() {
  const [events, setEvents] = useState<Array<{ id: string; kind: string; title: string; date: string | null; path: string }>>([]);
  useDocumentTitle('Calendar');
  useEffect(() => {
    api<{ events: typeof events }>('/api/student/calendar').then((d) => setEvents(d.events)).catch(() => setEvents([]));
  }, []);
  return (
    <div className="animate-fade-in">
      <PageHeader title="Calendar" subtitle="Deadlines and academic dates for your current class." />
      {events.length ? (
        <Surface padded={false}>
          {events.map((e) => (
            <Link key={e.id} to={e.path} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0 hover:bg-surface-muted">
              <div>
                <p className="font-medium">{e.title}</p>
                <p className="text-xs text-ink-muted">{e.kind} · {formatDate(e.date)}</p>
              </div>
            </Link>
          ))}
        </Surface>
      ) : (
        <StudentEmpty title="No events yet" body="Assignment deadlines, quizzes, and academic calendar dates will collect here." />
      )}
    </div>
  );
}

export function StudentSavedPage() {
  const [rows, setRows] = useState<Array<{ id: number; title: string; path: string; kind: string }>>([]);
  useDocumentTitle('Saved');
  useEffect(() => {
    api<{ bookmarks: typeof rows }>('/api/student/bookmarks').then((d) => setRows(d.bookmarks)).catch(() => setRows([]));
  }, []);
  return (
    <div className="animate-fade-in">
      <PageHeader title="Saved items" subtitle="References only — the original files stay in the subject library." />
      {rows.length ? (
        <Surface padded={false}>
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0">
              <Link to={r.path} className="hover:text-accent">
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-ink-muted">{r.kind}</p>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await api(`/api/student/bookmarks/${r.id}`, { method: 'DELETE' });
                  setRows((cur) => cur.filter((x) => x.id !== r.id));
                }}
              >
                Remove
              </Button>
            </div>
          ))}
        </Surface>
      ) : (
        <StudentEmpty title="Nothing saved" body="Save a topic, paper, or announcement to find it later." />
      )}
    </div>
  );
}

export function StudentSearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [results, setResults] = useState<Array<{ kind: string; id: number; title: string; subtitle: string; path: string }>>([]);
  useDocumentTitle('Search');
  useEffect(() => {
    if (q.length < 2) return;
    api<{ results: typeof results }>(`/api/student/search?q=${encodeURIComponent(q)}`)
      .then((d) => setResults(d.results))
      .catch(() => setResults([]));
  }, [q]);
  return (
    <div className="animate-fade-in">
      <PageHeader title="Search" subtitle={q ? `Results for “${q}”` : 'Search subjects, modules, materials, and announcements you can access.'} />
      {results.length ? (
        <Surface padded={false}>
          {results.map((r) => (
            <Link key={`${r.kind}-${r.id}`} to={r.path} className="block border-b border-border px-5 py-3 last:border-0 hover:bg-surface-muted">
              <p className="font-medium">{r.title}</p>
              <p className="text-xs text-ink-muted">{r.kind} · {r.subtitle}</p>
            </Link>
          ))}
        </Surface>
      ) : (
        <StudentEmpty title={q ? 'No matches' : 'Search your LMS'} body="Only content from your approved class is searchable." />
      )}
    </div>
  );
}
