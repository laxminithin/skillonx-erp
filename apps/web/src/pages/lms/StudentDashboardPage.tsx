import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../auth/AuthContext';
import { Button, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate, greetingForNow } from '../../lib/utils';
import { ProgressBar, StatusPill, StudentEmpty, SubjectCard, formatRemaining, statusToneFor } from './studentUi';

export type StudentClass = {
  displayName: string;
  academicYearLabel: string;
  departmentCode: string;
  semesterLabel: string;
  sectionLabel: string;
  id?: number;
};

export type SubjectCardData = {
  courseId: number;
  code: string;
  name: string;
  kind?: string;
  courseType?: string;
  credits?: number | null;
  facultyName: string | null;
  faculty?: Array<{ name: string }>;
  progress: number;
  pendingTasks?: number;
  nextActivity?: { title: string } | null;
};

type Dashboard = {
  class: StudentClass | null;
  pending: Array<{
    enrollmentId: number;
    name: string;
    displayName?: string;
    status: string;
    departmentCode?: string;
    semesterNumber?: number;
    semesterLabel?: string;
    sectionLabel?: string;
  }>;
  subjects: SubjectCardData[];
  backlogs: Array<{ courseId: number; code: string; name: string }>;
  additional?: Array<{ courseId: number; code: string; name: string; reason: string }>;
  announcements: Array<{ id: number; title: string; body?: string | null; unread?: boolean; authorName?: string | null; publishedAt?: string }>;
  todayClasses?: Array<{
    id: string;
    startTime: string;
    endTime: string;
    courseName: string | null;
    faculty: Array<{ name: string }>;
    roomName: string | null;
    state: string;
    holidayLabel?: string | null;
  }>;
  upcoming: {
    assignments: number;
    quizzes: number;
    assessments: number;
    materials: number;
    items: Array<{ kind: string; id: number; title: string; endAt: string; courseName?: string; path: string }>;
  };
  recentlyAdded: Array<{ kind: string; id: number; title: string; at: string; path: string }>;
  performance: {
    assignments: { obtained: number; max: number };
    quizzes: { obtained: number; max: number };
    internals: { obtained: number; max: number };
    attendance?: number | null;
    attendanceStanding?: { label: string; tone: string } | null;
    attendanceBelowCount?: number;
  } | null;
  attendance?: {
    overall: number | null;
    standing?: { label: string; tone: string } | null;
    belowCount?: number;
  } | null;
  continueLearning: {
    courseId: number;
    courseName: string;
    moduleName?: string | null;
    topicName?: string | null;
    path: string;
    label: string;
  } | null;
  progress: number;
  electiveOptions?: Array<{ id: number; courseId: number; name: string; code: string; electiveGroup?: string | null; faculty?: Array<{ name: string }> }>;
  selectedElectiveIds?: number[];
};

function scoreLabel(part?: { obtained: number; max: number } | null) {
  if (!part || !part.max) return '—';
  return `${part.obtained}/${part.max}`;
}

export function StudentDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useDocumentTitle('Dashboard');

  useEffect(() => {
    api<Dashboard>('/api/student/dashboard')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error) return <p className="text-sm text-danger">{error}</p>;

  const pending = data?.pending?.filter((p) => p.status === 'PENDING') ?? [];
  const rejected = data?.pending?.filter((p) => p.status === 'REJECTED') ?? [];

  if (!data?.class) {
    return (
      <div className="animate-fade-in">
        <PageHeader title={`${greetingForNow()}, ${user?.name?.split(' ')[0] || 'Student'}`} subtitle="Student LMS" />
        {pending[0] ? (
          <Surface className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Awaiting approval</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              Your request to join {pending[0].displayName || pending[0].name || `${pending[0].departmentCode} Semester ${pending[0].semesterLabel || pending[0].semesterNumber} Section ${pending[0].sectionLabel}`} is awaiting approval.
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              You will get access to all class subjects after approval. You only enroll in the class once — not subject by subject.
            </p>
          </Surface>
        ) : rejected[0] ? (
          <StudentEmpty
            title="Enrollment was not approved"
            body="Speak with your class coordinator if you believe this was a mistake. You can request again from a valid class join link."
          />
        ) : (
          <StudentEmpty
            title="No class LMS yet"
            body="Open the class join link shared by your faculty. One approval activates every mapped subject for the semester."
          />
        )}
      </div>
    );
  }

  const c = data.class;
  const first = user?.name?.split(' ')[0] || 'Student';

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{greetingForNow()}</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight text-ink sm:text-4xl">{first}</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            {c.departmentCode} · {c.semesterLabel} · Section {c.sectionLabel}
          </p>
          <p className="text-sm text-ink-muted">Academic Year {c.academicYearLabel}</p>
        </div>
        <div className="min-w-[180px] rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-3">
          <ProgressBar value={data.progress} label="Semester progress" />
        </div>
      </div>

      {data.continueLearning ? (
        <Surface className="flex flex-wrap items-center justify-between gap-3 border-accent/20 bg-accent-soft/30">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Continue learning</p>
            <p className="mt-1 text-lg font-semibold">{data.continueLearning.courseName}</p>
            <p className="text-sm text-ink-muted">{data.continueLearning.label}</p>
          </div>
          <Link to={data.continueLearning.path}>
            <Button>Continue</Button>
          </Link>
        </Surface>
      ) : null}

      {data.todayClasses?.length ? (
        <Surface>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Today's classes</h2>
            <Link to="/lms/timetable" className="text-sm font-medium text-accent">
              Full timetable
            </Link>
          </div>
          <ul className="space-y-3">
            {data.todayClasses.map((item) => (
              <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-medium">{item.courseName || item.holidayLabel || 'Class'}</p>
                  <p className="text-xs text-ink-muted">
                    {[item.faculty?.map((f) => f.name).join(', '), item.roomName].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <p className="text-sm tabular-nums text-ink-muted">
                  {item.startTime}–{item.endTime}
                </p>
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Surface className="lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Upcoming work</h2>
          {data.upcoming.items.length ? (
            <ul className="mt-3 space-y-3">
              {data.upcoming.items.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Link to={item.path} className="block rounded-[var(--radius-md)] px-2 py-1.5 hover:bg-surface-muted hover:text-accent">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-ink-muted">
                      {item.courseName} · {formatDate(item.endAt)} {formatRemaining(item.endAt) ? `· ${formatRemaining(item.endAt)}` : ''}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">Nothing due right now — nice work.</p>
          )}
        </Surface>
        <Surface>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Attendance</h2>
          <p className="mt-3 text-3xl font-semibold tabular-nums">
            {data.performance?.attendance != null ? `${data.performance.attendance}%` : '—'}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {data.performance?.attendanceStanding?.label || 'No sessions recorded yet'}
          </p>
          {(data.performance?.attendanceBelowCount || 0) > 0 ? (
            <p className="mt-2 text-xs text-warning">
              {data.performance?.attendanceBelowCount} subject(s) below recommended level
            </p>
          ) : null}
          <Link to="/lms/attendance" className="mt-4 inline-block text-sm font-medium text-accent">
            View attendance
          </Link>
        </Surface>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">My subjects</h2>
          <Link to="/lms/subjects" className="text-sm font-medium text-accent">
            View all
          </Link>
        </div>
        {data.subjects.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {data.subjects.map((s) => (
              <SubjectCard key={s.courseId} {...s} facultyName={s.facultyName || s.faculty?.[0]?.name} />
            ))}
          </div>
        ) : (
          <StudentEmpty title="No subjects mapped" body="Your class does not have subjects mapped yet. Your coordinator will add them." />
        )}
      </section>

      {data.backlogs.length ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Backlog / repeat courses</h2>
          <Surface padded={false}>
            {data.backlogs.map((s) => (
              <Link key={s.courseId} to={`/lms/subjects/${s.courseId}`} className="flex items-center justify-between border-b border-border px-5 py-4 last:border-0 hover:bg-surface-muted">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-ink-muted">{s.code} · Repeat course</p>
                </div>
                <ArrowRight size={16} className="text-ink-muted" />
              </Link>
            ))}
          </Surface>
        </section>
      ) : null}

      {data.electiveOptions?.length ? (
        <ElectivePicker classId={c.id} options={data.electiveOptions} selected={data.selectedElectiveIds || []} />
      ) : null}

      {data.announcements[0] ? (
        <Surface>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Announcements</h2>
          <ul className="mt-3 space-y-3">
            {data.announcements.slice(0, 3).map((a) => (
              <li key={a.id}>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{a.title}</p>
                  {a.unread ? <StatusPill tone="accent">New</StatusPill> : null}
                </div>
                {a.body ? <p className="mt-1 text-sm text-ink-muted">{a.body}</p> : null}
                <p className="mt-1 text-xs text-ink-muted">{a.authorName} · {formatDate(a.publishedAt)}</p>
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}

      {data.performance ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Performance snapshot</h2>
            <Link to="/lms/performance" className="text-sm font-medium text-accent">
              Details
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border sm:grid-cols-5">
            {[
              { label: 'Assignments', value: scoreLabel(data.performance.assignments) },
              { label: 'Quizzes', value: scoreLabel(data.performance.quizzes) },
              { label: 'Internals', value: scoreLabel(data.performance.internals) },
              { label: 'Attendance', value: data.performance.attendance != null ? `${data.performance.attendance}%` : '—' },
              { label: 'Learning', value: `${data.progress}%` },
            ].map((m) => (
              <div key={m.label} className="bg-surface px-4 py-4 sm:px-5 sm:py-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">{m.label}</p>
                <p className="mt-2 text-lg font-semibold tabular-nums sm:text-xl">{m.value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ElectivePicker({
  classId,
  options,
  selected,
}: {
  classId?: number;
  options: NonNullable<Dashboard['electiveOptions']>;
  selected: number[];
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState('');
  if (!classId || !options.length) return null;
  const groups = new Map<string, typeof options>();
  for (const opt of options) {
    const key = opt.electiveGroup || 'Elective';
    const list = groups.get(key) ?? [];
    list.push(opt);
    groups.set(key, list);
  }
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Elective selection</h2>
      {[...groups.entries()].map(([group, opts]) => (
        <Surface key={group} className="mb-3">
          <p className="font-medium">{group}</p>
          <p className="mt-1 text-sm text-ink-muted">Choose one. Only the approved elective appears in your LMS.</p>
          {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
          <ul className="mt-3 space-y-2">
            {opts.map((opt) => {
              const on = selected.includes(opt.id);
              return (
                <li key={opt.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border px-3 py-2">
                  <div>
                    <p className="font-medium">{opt.name}</p>
                    <p className="text-xs text-ink-muted">
                      {opt.code} · {opt.faculty?.[0]?.name || 'Faculty to be assigned'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={on ? 'secondary' : 'primary'}
                    disabled={on || busy === opt.id}
                    onClick={async () => {
                      setBusy(opt.id);
                      setError('');
                      try {
                        await api(`/api/student/classes/${classId}/electives`, {
                          method: 'POST',
                          body: JSON.stringify({ classSubjectId: opt.id }),
                        });
                        window.location.reload();
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Could not save selection');
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    {on ? 'Selected' : busy === opt.id ? 'Saving…' : 'Select'}
                  </Button>
                </li>
              );
            })}
          </ul>
        </Surface>
      ))}
    </section>
  );
}

export function StudentSubjectsPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  useDocumentTitle('My Subjects');
  useEffect(() => {
    api<Dashboard>('/api/student/subjects')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, []);
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!data) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="animate-fade-in">
      <PageHeader title="My Subjects" subtitle={data.class?.displayName || 'Class subjects appear automatically after approval.'} />
      {data.subjects.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.subjects.map((s) => (
            <SubjectCard key={s.courseId} {...s} facultyName={s.facultyName || s.faculty?.[0]?.name} />
          ))}
        </div>
      ) : (
        <StudentEmpty title="No subjects yet" body="Subjects come from your approved academic class. You do not enroll subject by subject." />
      )}
      {data.backlogs.length ? (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Backlog</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data.backlogs.map((s) => (
              <SubjectCard key={s.courseId} courseId={s.courseId} name={s.name} code={s.code} progress={0} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function StudentMorePage() {
  useDocumentTitle('More');
  const links = [
    { to: '/lms/learning', label: 'Learning' },
    { to: '/lms/assignments', label: 'Assignments' },
    { to: '/lms/quizzes', label: 'Quizzes' },
    { to: '/lms/assessments', label: 'Assessments' },
    { to: '/lms/papers', label: 'Previous papers' },
    { to: '/lms/attendance', label: 'Attendance' },
    { to: '/lms/timetable', label: 'Timetable' },
    { to: '/lms/calendar', label: 'Calendar' },
    { to: '/lms/saved', label: 'Saved items' },
    { to: '/lms/notifications', label: 'Notifications' },
    { to: '/lms/history', label: 'Academic history' },
    { to: '/lms/profile', label: 'Profile' },
  ];
  return (
    <div className="animate-fade-in">
      <PageHeader title="More" subtitle="The rest of your Student LMS." />
      <Surface padded={false}>
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="flex items-center justify-between border-b border-border px-5 py-4 last:border-0 hover:bg-surface-muted">
            {l.label}
            <ArrowRight size={16} className="text-ink-muted" />
          </Link>
        ))}
      </Surface>
    </div>
  );
}

export { statusToneFor };
