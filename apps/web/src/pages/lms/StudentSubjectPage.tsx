import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, PageHeader, Skeleton, Surface, Tabs } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/utils';
import { ProgressBar, StatusPill, StudentEmpty, statusToneFor } from './studentUi';

type SubjectData = {
  historical?: boolean;
  class: { displayName: string; semesterLabel: string };
  subject: {
    name: string;
    code?: string;
    facultyName?: string | null;
    faculty?: Array<{ name: string }>;
    courseType?: string;
    credits?: number | null;
    progress: number;
    pendingTasks?: number;
  };
  modules: Array<{
    id: number;
    name: string;
    progress: number;
    completedTopics: number;
    topicCount: number;
    topics: Array<{ id: number; name: string; completed: boolean; subtopics: Array<{ name: string }> }>;
  }>;
  outcomes: Array<{ code: string; statement: string }>;
  announcements: Array<{ id: number; title: string; body?: string | null; unread?: boolean; faculty?: string | null }>;
  beyondSyllabus: Array<{
    id: number;
    title: string;
    whyItMatters?: string | null;
    learningObjective?: string | null;
    resources?: string | null;
    activity?: string | null;
  }>;
  assignments: Array<{ id: number; title: string; dueAt?: string | null; studentStatus: string }>;
  quizzes: Array<{ id: number; title: string; endAt?: string | null; bucket: string }>;
  assessments: Array<{ id: number; title: string; status: string; marks?: number | null; maxMarks?: number | null }>;
  coPerformance: Array<{ code: string; statement: string; band: string; percentage: number | null; tone: string }>;
  continueLearning?: { path: string; label: string } | null;
  attendance?: {
    percentage: number | null;
    standing?: { label: string; tone: string } | null;
    PRESENT?: number;
    ABSENT?: number;
    total?: number;
  } | null;
};

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'modules', label: 'Modules' },
  { id: 'materials', label: 'Materials' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'quizzes', label: 'Quizzes' },
  { id: 'assessments', label: 'Assessments' },
  { id: 'papers', label: 'Previous Papers' },
  { id: 'performance', label: 'Performance' },
];

export function StudentSubjectPage() {
  const { courseId } = useParams();
  const id = Number(courseId);
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'overview';
  const [data, setData] = useState<SubjectData | null>(null);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    api<SubjectData>(`/api/student/subjects/${id}`)
      .then(setData)
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setCode((e as { code?: string }).code || '');
      });
  }, [id]);

  useDocumentTitle(data?.subject.name || 'Subject');

  if (code === 'ENROLLMENT_PENDING') {
    return (
      <StudentEmpty
        title="Waiting for class approval"
        body="You will get access to all class subjects after your class coordinator approves your membership."
      />
    );
  }
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!data) return <Skeleton className="h-48 w-full" />;

  const s = data.subject;
  const faculty = s.facultyName || s.faculty?.[0]?.name || 'Faculty to be assigned';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={s.name}
        subtitle={`${s.code || ''} · ${faculty} · ${data.class.displayName}${s.credits != null ? ` · ${s.credits} credits` : ''}${s.courseType ? ` · ${s.courseType}` : ''}`}
        actions={
          data.continueLearning ? (
            <Button onClick={() => navigate(data.continueLearning!.path)}>Continue learning</Button>
          ) : null
        }
      />
      <ProgressBar className="mb-5 max-w-sm" value={s.progress} label="Course progress" />
      {data.attendance?.percentage != null ? (
        <p className="mb-4 text-sm text-ink-secondary">
          Attendance {data.attendance.percentage}%
          {data.attendance.standing?.label ? ` · ${data.attendance.standing.label}` : ''}
          {' · '}
          <Link to={`/lms/attendance/${id}`} className="font-medium text-accent">
            View history
          </Link>
        </p>
      ) : null}
      {data.historical ? <p className="mb-4 text-sm text-ink-muted">Historical semester — records are read only.</p> : null}

      <Tabs
        tabs={TABS}
        value={TABS.some((t) => t.id === tab) ? tab : 'overview'}
        onChange={(id) => setParams({ tab: id })}
      />

      <div className="mt-5">
        {tab === 'overview' ? <Overview data={data} courseId={id} /> : null}
        {tab === 'modules' ? <Modules data={data} courseId={id} /> : null}
        {tab === 'materials' ? <Materials courseId={id} /> : null}
        {tab === 'assignments' ? <WorkList items={data.assignments.map((a) => ({ ...a, path: `/lms/assignments/${a.id}`, meta: formatDate(a.dueAt), status: a.studentStatus }))} empty="No published assignments yet." /> : null}
        {tab === 'quizzes' ? <WorkList items={data.quizzes.map((q) => ({ ...q, path: `/lms/quizzes/${q.id}`, meta: formatDate(q.endAt), status: q.bucket }))} empty="No published quizzes yet." /> : null}
        {tab === 'assessments' ? <WorkList items={data.assessments.map((a) => ({ ...a, path: '/lms/assessments', meta: a.marks != null ? `${a.marks}/${a.maxMarks}` : 'Result pending', status: a.status }))} empty="No internal assessments yet." /> : null}
        {tab === 'papers' ? <Papers courseId={id} /> : null}
        {tab === 'performance' ? <SubjectPerformance data={data} /> : null}
      </div>
    </div>
  );
}

function Overview({ data, courseId }: { data: SubjectData; courseId: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Surface>
        <h2 className="text-sm font-semibold">Course outcomes</h2>
        {data.outcomes.length ? (
          <ul className="mt-3 space-y-2">
            {data.outcomes.map((o) => (
              <li key={o.code}>
                <p className="text-sm font-medium">{o.code}</p>
                <p className="text-sm text-ink-muted">{o.statement}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">Outcomes will appear once the syllabus is mapped.</p>
        )}
      </Surface>
      <Surface>
        <h2 className="text-sm font-semibold">What to do next</h2>
        <p className="mt-2 text-sm text-ink-muted">{data.subject.pendingTasks || 0} pending activities · {data.modules.filter((m) => m.progress === 100).length} modules completed</p>
        <Link to={`/lms/subjects/${courseId}?tab=modules`} className="mt-3 inline-block text-sm font-medium text-accent">
          Open modules
        </Link>
        {data.announcements[0] ? (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted">Latest announcement</p>
            <p className="mt-1 font-medium">{data.announcements[0].title}</p>
            {data.announcements[0].body ? <p className="text-sm text-ink-muted">{data.announcements[0].body}</p> : null}
          </div>
        ) : null}
      </Surface>
      {data.beyondSyllabus.length ? (
        <Surface className="lg:col-span-2">
          <h2 className="text-sm font-semibold">Beyond syllabus</h2>
          <ul className="mt-3 space-y-3">
            {data.beyondSyllabus.map((item) => (
              <li key={item.id}>
                <p className="font-medium">{item.title}</p>
                {item.whyItMatters ? <p className="text-sm text-ink-muted">Why learn this? {item.whyItMatters}</p> : null}
                {item.resources ? <p className="text-sm">{item.resources}</p> : null}
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}
    </div>
  );
}

function Modules({ data, courseId }: { data: SubjectData; courseId: number }) {
  if (!data.modules.length) {
    return <StudentEmpty title="No modules yet" body="Published lesson structure will appear here." />;
  }
  return (
    <div className="space-y-4">
      {data.modules.map((mod) => (
        <Surface key={mod.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{mod.name}</h3>
              <p className="text-sm text-ink-muted">
                {mod.completedTopics}/{mod.topicCount || mod.topics.length} topics complete
              </p>
            </div>
            <ProgressBar className="w-40" value={mod.progress} />
          </div>
          <ul className="mt-4 space-y-2">
            {mod.topics.map((topic) => (
              <li key={topic.id}>
                <Link to={`/lms/subjects/${courseId}/topics/${topic.id}`} className="flex items-center gap-2 text-sm hover:text-accent">
                  <span aria-hidden>{topic.completed ? '✓' : '○'}</span>
                  <span>{topic.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Surface>
      ))}
    </div>
  );
}

function Materials({ courseId }: { courseId: number }) {
  const [rows, setRows] = useState<Array<{ id: string; title: string; type: string; moduleName: string | null; path: string }>>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    api<{ materials: typeof rows }>(`/api/student/subjects/${courseId}/materials`)
      .then((d) => setRows(d.materials))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [courseId]);
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!rows.length) return <StudentEmpty title="No materials yet" body="Published notes, slides, and references will appear here." />;
  return (
    <Surface padded={false}>
      {rows.map((row) => (
        <Link key={row.id} to={row.path} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0 hover:bg-surface-muted">
          <div>
            <p className="font-medium">{row.title}</p>
            <p className="text-xs text-ink-muted">{row.type}{row.moduleName ? ` · ${row.moduleName}` : ''}</p>
          </div>
        </Link>
      ))}
    </Surface>
  );
}

function WorkList({
  items,
  empty,
}: {
  items: Array<{ id: number; title: string; path: string; meta?: string | null; status: string }>;
  empty: string;
}) {
  if (!items.length) return <StudentEmpty title="Nothing here yet" body={empty} />;
  return (
    <Surface padded={false}>
      {items.map((item) => (
        <Link key={item.id} to={item.path} className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 last:border-0 hover:bg-surface-muted">
          <div>
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-ink-muted">{item.meta}</p>
          </div>
          <StatusPill tone={statusToneFor(item.status)}>{item.status.replaceAll('_', ' ')}</StatusPill>
        </Link>
      ))}
    </Surface>
  );
}

function Papers({ courseId }: { courseId: number }) {
  const [papers, setPapers] = useState<Array<{ id: number; subjectName: string; examYear?: number | null; examType?: string | null; sourceUrl?: string | null }>>([]);
  useEffect(() => {
    api<{ papers: typeof papers }>(`/api/student/papers?courseId=${courseId}`)
      .then((d) => setPapers(d.papers))
      .catch(() => setPapers([]));
  }, [courseId]);
  if (!papers.length) return <StudentEmpty title="No previous papers" body="Previous-year papers for this subject will appear here when available." />;
  return (
    <Surface padded={false}>
      {papers.map((p) => (
        <Link key={p.id} to={`/lms/papers/${p.id}`} className="block border-b border-border px-5 py-3 last:border-0 hover:bg-surface-muted">
          <p className="font-medium">{p.subjectName}</p>
          <p className="text-xs text-ink-muted">{p.examType} · {p.examYear || '—'}</p>
        </Link>
      ))}
    </Surface>
  );
}

function SubjectPerformance({ data }: { data: SubjectData }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Surface>
        <h2 className="text-sm font-semibold">CO progress</h2>
        {data.coPerformance.length ? (
          <ul className="mt-3 space-y-2">
            {data.coPerformance.map((co) => (
              <li key={co.code} className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{co.code}</p>
                  <p className="text-sm text-ink-muted">{co.statement}</p>
                </div>
                <StatusPill tone={statusToneFor(co.band)}>
                  {co.band}
                  {co.percentage != null ? ` ${co.percentage}%` : ''}
                </StatusPill>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">CO feedback appears after results are released.</p>
        )}
      </Surface>
      <Surface>
        <h2 className="text-sm font-semibold">Learning</h2>
        <ProgressBar className="mt-3" value={data.subject.progress} />
        <p className="mt-3 text-sm text-ink-muted">{data.modules.length} modules · {data.assignments.length} assignments · {data.quizzes.length} quizzes</p>
      </Surface>
    </div>
  );
}

export function StudentTopicPage() {
  const { courseId, topicId } = useParams();
  const cid = Number(courseId);
  const tid = Number(topicId);
  const navigate = useNavigate();
  const [data, setData] = useState<{
    topic: {
      name: string;
      moduleName: string | null;
      hours: number;
      completed: boolean;
      subtopics: Array<{ id: number; name: string; hours: number }>;
    };
    previous: { id: number; name: string } | null;
    next: { id: number; name: string } | null;
    assignments: Array<{ id: number; title: string }>;
    quizzes: Array<{ id: number; title: string }>;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(cid) || !Number.isFinite(tid)) return;
    api<NonNullable<typeof data>>(`/api/student/subjects/${cid}/topics/${tid}`).then(setData);
  }, [cid, tid]);
  useDocumentTitle(data?.topic.name || 'Topic');
  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={data.topic.name}
        subtitle={`${data.topic.moduleName || 'Module'}${data.topic.hours ? ` · ${data.topic.hours} hours` : ''}`}
      />
      <article className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        {data.topic.subtopics.length ? (
          <ul className="space-y-2">
            {data.topic.subtopics.map((s) => (
              <li key={s.id} className="text-sm">
                {s.name}
                {s.hours ? <span className="text-ink-muted"> · {s.hours}h</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">Lesson notes for this topic will appear here when published.</p>
        )}
        {data.assignments.length || data.quizzes.length ? (
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-sm font-medium">Practice</p>
            <ul className="mt-2 space-y-1 text-sm">
              {data.assignments.map((a) => (
                <li key={`a-${a.id}`}>
                  <Link className="text-accent" to={`/lms/assignments/${a.id}`}>{a.title}</Link>
                </li>
              ))}
              {data.quizzes.map((q) => (
                <li key={`q-${q.id}`}>
                  <Link className="text-accent" to={`/lms/quizzes/${q.id}`}>{q.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={!data.previous}
          onClick={() => data.previous && navigate(`/lms/subjects/${cid}/topics/${data.previous.id}`)}
        >
          Previous topic
        </Button>
        <Button
          disabled={busy || data.topic.completed}
          onClick={async () => {
            setBusy(true);
            try {
              await api(`/api/student/subjects/${cid}/topics/${tid}/complete`, { method: 'POST' });
              setData({ ...data, topic: { ...data.topic, completed: true } });
            } finally {
              setBusy(false);
            }
          }}
        >
          {data.topic.completed ? 'Completed' : 'Mark complete'}
        </Button>
        <Button
          variant="secondary"
          disabled={!data.next}
          onClick={() => data.next && navigate(`/lms/subjects/${cid}/topics/${data.next.id}`)}
        >
          Next topic
        </Button>
      </div>
    </div>
  );
}

export function StudentLearningPage() {
  const [data, setData] = useState<{ subjects: Array<{ courseId: number; name: string; code: string; progress: number; pendingTasks?: number }> } | null>(null);
  useDocumentTitle('Learning');
  useEffect(() => {
    api<NonNullable<typeof data>>('/api/student/subjects').then(setData).catch(() => setData({ subjects: [] }));
  }, []);
  if (!data) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="animate-fade-in">
      <PageHeader title="Learning" subtitle="Open a subject to continue modules and lessons." />
      {data.subjects.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.subjects.map((s) => (
            <Link key={s.courseId} to={`/lms/subjects/${s.courseId}?tab=modules`} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 hover:border-border-strong">
              <p className="text-xs uppercase tracking-wide text-ink-muted">{s.code}</p>
              <p className="mt-1 font-semibold">{s.name}</p>
              <ProgressBar className="mt-3" value={s.progress} />
            </Link>
          ))}
        </div>
      ) : (
        <StudentEmpty title="Nothing to study yet" body="Subjects appear here after class approval." />
      )}
    </div>
  );
}
