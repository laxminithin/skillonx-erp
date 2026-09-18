import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  GitMerge,
  GraduationCap,
  ListChecks,
  PenLine,
  Plus,
  ScanSearch,
  Sparkles,
  FileStack,
  LibraryBig,
  Briefcase,
} from 'lucide-react';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { api } from '../lib/api';
import { useAuth } from '../auth/AuthContext';
import type { LecturerCourseCard, LecturerDashboard } from '../lib/lecturerDashboard';
import {
  Button,
  EmptyState,
  PageHeader,
  Skeleton,
  Surface,
} from '../components/ui';
import { formatDateTime, greetingForNow, cn } from '../lib/utils';

const CREATE_ACTIONS = [
  { label: 'Quiz', to: '/quizzes/create', icon: ListChecks },
  { label: 'Assignment', to: '/assignments/create', icon: PenLine },
  { label: 'Survey', to: '/surveys/create', icon: ClipboardList },
  { label: 'Lesson Plan', to: '/lesson-plans/create', icon: BookOpen },
  { label: 'Academic Mapping', to: '/copo/create', icon: GitMerge },
  { label: 'Gap Analysis', to: '/gap-analysis/create', icon: ScanSearch },
  { label: 'Beyond Syllabus', to: '/beyond-syllabus/create', icon: Sparkles },
  { label: 'CO Evaluation', to: '/co-evaluation/create', icon: ClipboardCheck },
  { label: 'Previous Year QPs', to: '/previous-year-papers', icon: LibraryBig },
  { label: 'Internal QP', to: '/internal-question-papers/create', icon: FileStack },
];

function MetricStrip({
  loading,
  metrics,
}: {
  loading: boolean;
  metrics?: LecturerDashboard['metrics'];
}) {
  const items = [
    { label: 'My Courses', value: metrics?.myCourses ?? 0 },
    { label: 'Active Assessments', value: metrics?.activeAssessments ?? 0 },
    { label: 'Pending Evaluation', value: metrics?.pendingEvaluations ?? 0 },
    {
      label: 'Plans Ready',
      value:
        metrics?.academicPlans != null
          ? `${metrics.academicPlans.ready} / ${metrics.academicPlans.total || 0}`
          : '0 / 0',
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border lg:grid-cols-4">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface px-5 py-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-8 w-16" />
            </div>
          ))
        : items.map((m) => (
            <div key={m.label} className="bg-surface px-5 py-5">
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-muted">
                {m.label}
              </p>
              <p className="mt-2 text-[2rem] font-semibold tracking-tight text-ink tabular-nums">
                {m.value}
              </p>
            </div>
          ))}
    </div>
  );
}

function ContextBar({ context }: { context: LecturerDashboard['context'] }) {
  if (!context.courseCount && !context.academicYearLabel) return null;

  if (context.multiContext) {
    return (
      <p className="mb-5 text-sm text-ink-muted">
        Teaching across multiple programs / semesters · {context.courseCount} course
        {context.courseCount === 1 ? '' : 's'}
      </p>
    );
  }

  const chips = [
    context.academicYearLabel ? { label: 'Academic Year', value: context.academicYearLabel } : null,
    context.programName ? { label: 'Program', value: context.programName } : null,
    context.semesterLabel ? { label: 'Semester', value: context.semesterLabel } : null,
    { label: 'Courses', value: String(context.courseCount) },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  if (!chips.length) return null;

  return (
    <div className="mb-5 flex flex-wrap gap-x-6 gap-y-2 border-b border-border pb-4">
      {chips.map((c) => (
        <div key={c.label}>
          <p className="text-[11px] uppercase tracking-[0.1em] text-ink-muted">{c.label}</p>
          <p className="mt-0.5 text-sm font-medium text-ink">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function mappingLabel(status: string) {
  if (status === 'FINALIZED') return 'Finalized';
  if (status === 'DRAFT') return 'Draft';
  if (status === 'IN_PROGRESS') return 'In Progress';
  if (status === 'MISSING') return 'Not Created';
  return status;
}

function gapLabel(status: string | null, openGaps: number) {
  if (!status) return 'Not Created';
  if (openGaps > 0) return 'In Progress';
  if (status === 'COMPLETED') return 'Completed';
  if (status === 'DRAFT') return 'Draft';
  return status.replaceAll('_', ' ');
}

function CourseRow({ course }: { course: LecturerCourseCard }) {
  const m = course.modules;
  const meta = [course.code, course.programCode || course.programName, course.semesterLabel]
    .filter(Boolean)
    .join(' · ');

  const lesson =
    m.lessonPlan.totalUnits != null && m.lessonPlan.totalUnits > 0
      ? `${m.lessonPlan.completedUnits ?? 0} / ${m.lessonPlan.totalUnits}`
      : m.lessonPlan.status
        ? m.lessonPlan.status
        : 'Not Created';

  const assessmentsActive =
    m.quizzes.active + m.assignments.active + m.surveys.active;

  return (
    <div className="border-b border-border px-5 py-4 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold tracking-tight text-ink">{course.name}</h3>
          <p className="mt-0.5 text-xs text-ink-muted">{meta}</p>
        </div>
        <Link
          to={`/courses/${course.courseId}`}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline"
        >
          Open Course <ArrowRight size={14} />
        </Link>
      </div>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Lesson Plan</dt>
          <dd className="mt-0.5 text-sm text-ink">{lesson}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Assessments</dt>
          <dd className="mt-0.5 text-sm text-ink">
            {assessmentsActive > 0 ? `${assessmentsActive} Active` : 'None active'}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Mapping</dt>
          <dd className="mt-0.5 text-sm text-ink">{mappingLabel(m.academicMapping.status)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-ink-muted">Gap Analysis</dt>
          <dd className="mt-0.5 text-sm text-ink">
            {gapLabel(m.gapAnalysis.status, m.gapAnalysis.openGaps)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function CreateMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu">
        <Plus size={16} />
        Create
        <ChevronDown size={14} className="opacity-70" />
      </Button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1.5 w-56 overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface py-1 shadow-md animate-fade-in"
        >
          {CREATE_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink transition hover:bg-surface-muted"
              onClick={() => setOpen(false)}
            >
              <a.icon size={15} className="text-ink-muted" />
              {a.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function severityTone(severity: string) {
  if (severity === 'high') return 'border-l-danger';
  if (severity === 'medium') return 'border-l-warning';
  return 'border-l-border-strong';
}

function formatUpcomingWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const time = new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);

  if (sameDay(d, today)) return `Today · ${time}`;
  if (sameDay(d, tomorrow)) return `Tomorrow · ${time}`;
  return formatDateTime(iso);
}

function MyHrCard() {
  const [balances, setBalances] = useState<Array<{ leaveTypeCode: string; availableBalance: number }>>([]);
  useEffect(() => {
    api<Array<{ leaveTypeCode: string; availableBalance: number }>>('/api/hr/me/leave/balances')
      .then(setBalances)
      .catch(() => setBalances([]));
  }, []);
  const cl = balances.find((b) => b.leaveTypeCode === 'CL');
  const el = balances.find((b) => b.leaveTypeCode === 'EL');
  return (
    <Surface className="mb-6 flex flex-wrap items-center justify-between gap-4 border-accent/15">
      <div className="flex items-start gap-3">
        <div className="rounded-[var(--radius-md)] bg-accent-soft p-2 text-accent">
          <Briefcase size={20} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">My HR</p>
          <p className="mt-1 text-sm text-ink-muted">
            Casual Leave: <span className="font-semibold text-ink">{cl?.availableBalance ?? '—'}</span>
            {' · '}
            Earned Leave: <span className="font-semibold text-ink">{el?.availableBalance ?? '—'}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/hr/leave/apply"><Button size="sm">Apply Leave</Button></Link>
        <Link to="/hr"><Button size="sm" variant="secondary">View My HR</Button></Link>
      </div>
    </Surface>
  );
}

export function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const [data, setData] = useState<LecturerDashboard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [takingAttendance, setTakingAttendance] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<LecturerDashboard>('/api/dashboard/lecturer')
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? 'Faculty';
  const isEmpty =
    !loading &&
    data &&
    data.metrics.myCourses === 0 &&
    data.metrics.activeAssessments === 0 &&
    data.metrics.pendingEvaluations === 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${greetingForNow()}, ${firstName}`}
        subtitle="Manage your courses, assessments, academic planning and student learning from one workspace."
        breadcrumb={<span className="text-[11px] font-semibold uppercase tracking-[0.14em]">Lecturer LMS</span>}
        actions={<CreateMenu />}
      />

      {error ? (
        <div className="mb-4 rounded-[var(--radius-md)] border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
          <button
            type="button"
            className="ml-3 font-medium underline"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {data?.context ? <ContextBar context={data.context} /> : null}

      <MetricStrip loading={loading} metrics={data?.metrics} />

      {!loading && data?.nextClass ? (
        <Surface className="mb-6 flex flex-wrap items-center justify-between gap-3 border-accent/20 bg-accent-soft/30">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Next class</p>
            <p className="mt-1 text-lg font-semibold">
              {data.nextClass.startTime} · {data.nextClass.courseName}
            </p>
            <p className="text-sm text-ink-muted">
              {[data.nextClass.className, data.nextClass.roomName].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.nextClass.courseId ? (
              <Link to={`/courses/${data.nextClass.courseId}`}>
                <Button variant="secondary">Open Course</Button>
              </Link>
            ) : null}
            <Button
              disabled={takingAttendance || (!data.nextClass.slotId && !data.nextClass.overrideId)}
              onClick={async () => {
                if (!data.nextClass) return;
                setTakingAttendance(true);
                try {
                  const session = await api<{ session: { id: number; courseId: number; academicClassId: number } }>(
                    '/api/timetable/attendance',
                    {
                      method: 'POST',
                      body: JSON.stringify({
                        date: data.nextClass.date,
                        slotId: data.nextClass.slotId,
                        overrideId: data.nextClass.overrideId,
                      }),
                    },
                  );
                  window.location.assign(
                    `/courses/${session.session.courseId}/attendance?classId=${session.session.academicClassId}`,
                  );
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Could not open attendance');
                  setTakingAttendance(false);
                }
              }}
            >
              Take Attendance
            </Button>
          </div>
        </Surface>
      ) : null}

      <MyHrCard />

      {isEmpty ? (
        <EmptyState
          icon={<GraduationCap size={22} />}
          title="Welcome to your Lecturer LMS"
          body="Start by setting up your first academic workflow — a lesson plan, quiz, or assignment for your courses."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/lesson-plans/create">
                <Button>
                  <Plus size={16} /> Create Lesson Plan
                </Button>
              </Link>
              <Link to="/quizzes/create">
                <Button variant="secondary">
                  <Plus size={16} /> Create Quiz
                </Button>
              </Link>
              <Link to="/assignments/create">
                <Button variant="secondary">
                  <Plus size={16} /> Create Assignment
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-8 lg:gap-10">
          {/* Attention — first on mobile via order */}
          <section className="order-1 lg:order-none">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Attention Required</h2>
            </div>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.attentionItems?.length ? (
              <ul className="space-y-1">
                {data.attentionItems.map((item, i) => (
                  <li key={`${item.kind}-${i}`}>
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center justify-between gap-3 border-l-2 bg-surface px-4 py-3 transition hover:bg-surface-muted',
                        severityTone(item.severity),
                      )}
                    >
                      <span className="text-sm text-ink">{item.title}</span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-accent">
                        Review <ArrowRight size={14} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">Nothing needs your attention right now.</p>
            )}
          </section>

          <section className="order-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">My Courses</h2>
              <Link
                to="/courses"
                className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <Surface padded={false}>
              {loading ? (
                <div className="space-y-3 p-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : data?.courses?.length ? (
                data.courses.map((c) => <CourseRow key={c.courseId} course={c} />)
              ) : (
                <div className="p-5">
                  <p className="text-sm text-ink-muted">
                    No courses assigned yet. Create a lesson plan or assessment to get started.
                  </p>
                </div>
              )}
            </Surface>
          </section>

          <div className="order-3 grid gap-8 lg:grid-cols-2">
            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink">Today & Upcoming</h2>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : data?.upcoming?.length ? (
                <ul className="divide-y divide-border border-y border-border">
                  {data.upcoming.map((u, i) => (
                    <li key={`${u.kind}-${i}`}>
                      <Link
                        to={u.href}
                        className="flex flex-col gap-0.5 py-3 transition hover:bg-surface-muted/60 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                      >
                        <div>
                          <p className="text-sm font-medium text-ink">{u.title}</p>
                          {u.courseCode ? (
                            <p className="text-xs text-ink-muted">{u.courseCode}</p>
                          ) : null}
                        </div>
                        <p className="shrink-0 text-xs text-ink-muted">{formatUpcomingWhen(u.at)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">No upcoming items in the next two weeks.</p>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink">Assessments</h2>
              {loading ? (
                <Skeleton className="h-28 w-full" />
              ) : (
                <dl className="space-y-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-sm text-ink">Quizzes</dt>
                    <dd className="text-sm text-ink-secondary">
                      {data?.assessments.quizzes.active ?? 0} Active
                      {(data?.assessments.quizzes.completed ?? 0) > 0
                        ? ` · ${data!.assessments.quizzes.completed} Completed`
                        : ''}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-sm text-ink">Assignments</dt>
                    <dd className="text-sm text-ink-secondary">
                      {data?.assessments.assignments.active ?? 0} Active
                      {(data?.assessments.assignments.pendingEvaluation ?? 0) > 0
                        ? ` · ${data!.assessments.assignments.pendingEvaluation} Pending Evaluation`
                        : ''}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-sm text-ink">Surveys</dt>
                    <dd className="text-sm text-ink-secondary">
                      {data?.assessments.surveys.active ?? 0} Active
                      {(data?.assessments.surveys.responses ?? 0) > 0
                        ? ` · ${data!.assessments.surveys.responses} Responses`
                        : ''}
                    </dd>
                  </div>
                </dl>
              )}

              <h2 className="mb-3 mt-8 text-sm font-semibold text-ink">Student Engagement</h2>
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <dl className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <dt className="text-ink-muted">Quiz Attempts</dt>
                    <dd className="tabular-nums text-ink">{data?.engagement.quizAttempts ?? 0}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-ink-muted">Assignment Submissions</dt>
                    <dd className="tabular-nums text-ink">
                      {data?.engagement.assignmentSubmissions ?? 0}
                    </dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-ink-muted">Survey Responses</dt>
                    <dd className="tabular-nums text-ink">{data?.engagement.surveyResponses ?? 0}</dd>
                  </div>
                </dl>
              )}
            </section>
          </div>

          <div className="order-4 grid gap-8 lg:grid-cols-2">
            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink">Academic Planning</h2>
              {loading ? (
                <Skeleton className="h-36 w-full" />
              ) : (
                <dl className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <dt className="text-ink">Lesson Plans</dt>
                    <dd className="text-ink-secondary">
                      {data?.academicPlanning.lessonPlans.created ?? 0} /{' '}
                      {data?.academicPlanning.lessonPlans.expected ?? 0} Created
                    </dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-ink">Academic Mapping</dt>
                    <dd className="text-ink-secondary">
                      {data?.academicPlanning.academicMapping.finalized ?? 0} Finalized
                      {(data?.academicPlanning.academicMapping.draft ?? 0) > 0
                        ? ` · ${data!.academicPlanning.academicMapping.draft} Draft`
                        : ''}
                    </dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-ink">Gap Analysis</dt>
                    <dd className="text-ink-secondary">
                      {data?.academicPlanning.gapAnalysis.inProgress ?? 0} In Progress
                      {(data?.academicPlanning.gapAnalysis.completed ?? 0) > 0
                        ? ` · ${data!.academicPlanning.gapAnalysis.completed} Completed`
                        : ''}
                    </dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-ink">Beyond Syllabus</dt>
                    <dd className="text-ink-secondary">
                      {data?.academicPlanning.beyondSyllabus.inProgress ?? 0} Active
                      {(data?.academicPlanning.beyondSyllabus.completed ?? 0) > 0
                        ? ` · ${data!.academicPlanning.beyondSyllabus.completed} Completed`
                        : ''}
                    </dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-ink">CO Evaluation</dt>
                    <dd className="text-ink-secondary">
                      {data?.academicPlanning.coEvaluation.finalized ?? 0} Finalized
                      {(data?.academicPlanning.coEvaluation.draft ?? 0) > 0
                        ? ` · ${data!.academicPlanning.coEvaluation.draft} Draft`
                        : ''}
                    </dd>
                  </div>
                </dl>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink">Recent Activity</h2>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : data?.recentActivity?.length ? (
                <ul className="divide-y divide-border border-y border-border">
                  {data.recentActivity.map((a, i) => (
                    <li key={`${a.kind}-${i}`}>
                      {a.href ? (
                        <Link
                          to={a.href}
                          className="block py-2.5 text-sm text-ink transition hover:text-accent"
                        >
                          {a.summary}
                        </Link>
                      ) : (
                        <p className="py-2.5 text-sm text-ink">{a.summary}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted">Activity will appear as you teach and assess.</p>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
