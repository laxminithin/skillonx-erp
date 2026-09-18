import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Field, Modal, PageHeader, Skeleton, Surface, Tabs, Textarea } from '../../components/ui';
import { QuizQuestionRenderer } from '../../components/quiz/QuizQuestionRenderer';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/utils';
import { type QuizAnswer, type QuizQuestion } from '../../types/quiz';
import { StatusPill, StudentEmpty, formatRemaining, statusToneFor } from './studentUi';

type Task = {
  id: string;
  kind: string;
  title: string;
  courseName?: string;
  dueAt: string | null;
  status: string;
  path: string;
  completed: boolean;
};

export function StudentTasksPage() {
  const [tab, setTab] = useState('ALL');
  const [tasks, setTasks] = useState<Task[] | null>(null);
  useDocumentTitle('My Tasks');
  useEffect(() => {
    api<{ tasks: Task[] }>(`/api/student/tasks?tab=${tab}`)
      .then((d) => setTasks(d.tasks))
      .catch(() => setTasks([]));
  }, [tab]);
  return (
    <div className="animate-fade-in">
      <PageHeader title="My Tasks" subtitle="Work across every subject in your current class." />
      <Tabs
        tabs={[
          { id: 'ALL', label: 'All' },
          { id: 'DUE_SOON', label: 'Due soon' },
          { id: 'ASSIGNMENTS', label: 'Assignments' },
          { id: 'QUIZZES', label: 'Quizzes' },
          { id: 'ASSESSMENTS', label: 'Assessments' },
          { id: 'COMPLETED', label: 'Completed' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className="mt-4">
        {!tasks ? (
          <Skeleton className="h-40 w-full" />
        ) : tasks.length ? (
          <Surface padded={false}>
            {tasks.map((t) => (
              <Link key={t.id} to={t.path} className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 last:border-0 hover:bg-surface-muted">
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-ink-muted">
                    {t.courseName} · {formatDate(t.dueAt)} {formatRemaining(t.dueAt) ? `· ${formatRemaining(t.dueAt)}` : ''}
                  </p>
                </div>
                <StatusPill tone={statusToneFor(t.status)}>{t.status.replaceAll('_', ' ')}</StatusPill>
              </Link>
            ))}
          </Surface>
        ) : (
          <StudentEmpty title="No tasks" body="Published assignments, quizzes, and assessments will collect here." />
        )}
      </div>
    </div>
  );
}

type AssignmentRow = {
  id: number;
  title: string;
  courseName?: string;
  dueAt?: string | null;
  studentStatus: string;
};

export function StudentAssignmentsPage() {
  const [rows, setRows] = useState<AssignmentRow[] | null>(null);
  useDocumentTitle('Assignments');
  useEffect(() => {
    api<{ assignments: AssignmentRow[] }>('/api/student/assignments')
      .then((d) => setRows(d.assignments))
      .catch(() => setRows([]));
  }, []);
  return (
    <div className="animate-fade-in">
      <PageHeader title="Assignments" subtitle="Submit before the deadline. Marks appear only after faculty release." />
      {!rows ? (
        <Skeleton className="h-40 w-full" />
      ) : rows.length ? (
        <Surface padded={false}>
          {rows.map((a) => (
            <Link key={a.id} to={`/lms/assignments/${a.id}`} className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 last:border-0 hover:bg-surface-muted">
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-ink-muted">{a.courseName} · Due {formatDate(a.dueAt)}</p>
              </div>
              <StatusPill tone={statusToneFor(a.studentStatus)}>{a.studentStatus.replaceAll('_', ' ')}</StatusPill>
            </Link>
          ))}
        </Surface>
      ) : (
        <StudentEmpty title="No assignments" body="When faculty publish an assignment for your class, it will appear here." />
      )}
    </div>
  );
}

export function StudentAssignmentDetailPage() {
  const { id } = useParams();
  const assignmentId = Number(id);
  const navigate = useNavigate();
  const [data, setData] = useState<{
    historical?: boolean;
    assignment: {
      title: string;
      courseName?: string;
      moduleName?: string | null;
      facultyName?: string | null;
      assignedAt?: string | null;
      dueAt?: string | null;
      maxMarks: number;
      instructions?: string | null;
      cos: string[];
      questions: Array<{ id: number; questionText: string; marks: number; co?: string | null }>;
    };
    submission: {
      id: number;
      token: string;
      status: string;
      submittedAt?: string | null;
      obtainedMarks: number | null;
      totalMarks: number | null;
      feedbackReleased: boolean;
    } | null;
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [token, setToken] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  useDocumentTitle(data?.assignment.title || 'Assignment');

  useEffect(() => {
    if (!Number.isFinite(assignmentId)) return;
    api<NonNullable<typeof data>>(`/api/student/assignments/${assignmentId}`).then((d) => {
      setData(d);
      if (d.submission?.token) setToken(d.submission.token);
    });
  }, [assignmentId]);

  if (!data) return <Skeleton className="h-48 w-full" />;
  const a = data.assignment;

  const start = async () => {
    setBusy(true);
    try {
      const res = await api<{ submissionToken: string; answers?: Array<{ questionId: number | string; textAnswer?: string | null }> }>(
        `/api/student/assignments/${assignmentId}/start`,
        { method: 'POST' },
      );
      setToken(res.submissionToken);
      const next: Record<string, string> = {};
      for (const ans of res.answers ?? []) next[String(ans.questionId)] = ans.textAnswer || '';
      setAnswers(next);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not start');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!token) return;
    await api(`/api/student/assignments/${assignmentId}/answers`, {
      method: 'POST',
      body: JSON.stringify({
        submissionToken: token,
        answers: Object.entries(answers).map(([questionId, textAnswer]) => ({ questionId, textAnswer })),
      }),
    });
    setNotice('Draft saved.');
  };

  const submit = async () => {
    if (!token) return;
    setBusy(true);
    try {
      const res = await api<{ submission?: { id?: number; submittedAt?: string } }>(`/api/student/assignments/${assignmentId}/submissions`, {
        method: 'POST',
        body: JSON.stringify({
          submissionToken: token,
          answers: Object.entries(answers).map(([questionId, textAnswer]) => ({ questionId, textAnswer })),
        }),
      });
      setConfirm(false);
      setNotice(`Submitted successfully${res.submission?.id ? ` · Submission ${res.submission.id}` : ''}.`);
      const fresh = await api<NonNullable<typeof data>>(`/api/student/assignments/${assignmentId}`);
      setData(fresh);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={a.title}
        subtitle={`${a.courseName || ''} · ${a.moduleName || ''} · ${a.facultyName || ''}`}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Surface>
          <p className="text-xs text-ink-muted">Due</p>
          <p className="font-medium">{formatDate(a.dueAt)}</p>
          <p className="text-xs text-ink-muted">{formatRemaining(a.dueAt)}</p>
        </Surface>
        <Surface>
          <p className="text-xs text-ink-muted">Maximum marks</p>
          <p className="font-medium">{a.maxMarks}</p>
        </Surface>
        <Surface>
          <p className="text-xs text-ink-muted">Status</p>
          <StatusPill tone={statusToneFor(data.submission?.status || 'NOT_STARTED')}>
            {(data.submission?.status || 'NOT STARTED').replaceAll('_', ' ')}
          </StatusPill>
        </Surface>
      </div>
      {a.cos.length ? <p className="mb-3 text-sm text-ink-muted">CO: {a.cos.join(', ')}</p> : null}
      {a.instructions ? <Surface className="mb-4"><p className="whitespace-pre-wrap text-sm">{a.instructions}</p></Surface> : null}
      {notice ? <p className="mb-3 text-sm text-ink-secondary">{notice}</p> : null}

      {data.submission?.feedbackReleased ? (
        <Surface className="mb-4">
          <p className="font-medium">Evaluation</p>
          <p className="mt-1 text-sm">
            {data.submission.obtainedMarks}/{data.submission.totalMarks}
          </p>
        </Surface>
      ) : data.submission?.status === 'SUBMITTED' || data.submission?.status === 'LATE' ? (
        <p className="mb-4 text-sm text-ink-muted">Submitted. Marks will appear after faculty release.</p>
      ) : null}

      {token || data.submission?.status === 'DRAFT' ? (
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            setConfirm(true);
          }}
          className="space-y-4"
        >
          {a.questions.map((q, i) => (
            <Field key={q.id} label={`Q${i + 1}. ${q.questionText} (${q.marks} marks)`}>
              <Textarea
                value={answers[String(q.id)] || ''}
                onChange={(e) => setAnswers({ ...answers, [String(q.id)]: e.target.value })}
                disabled={data.historical || ['SUBMITTED', 'LATE', 'EVALUATED', 'RETURNED'].includes(data.submission?.status || '')}
              />
            </Field>
          ))}
          {!data.historical && !['SUBMITTED', 'LATE', 'EVALUATED', 'RETURNED'].includes(data.submission?.status || '') ? (
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={save} disabled={busy}>
                Save draft
              </Button>
              <Button type="submit" disabled={busy}>
                Submit
              </Button>
            </div>
          ) : null}
        </form>
      ) : (
        <Button onClick={start} disabled={busy || data.historical}>
          {busy ? 'Opening…' : 'Start assignment'}
        </Button>
      )}

      <Modal
        open={confirm}
        title="Submit assignment?"
        description="Once submitted, you may not be able to edit this submission."
        onClose={() => setConfirm(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={busy}>
              Confirm submit
            </Button>
          </>
        }
      />
      <p className="mt-6">
        <button type="button" className="text-sm text-ink-muted" onClick={() => navigate(-1)}>
          Back
        </button>
      </p>
    </div>
  );
}

type QuizRow = {
  id: number;
  title: string;
  courseName?: string;
  moduleName?: string | null;
  durationMinutes?: number | null;
  attemptsAllowed: number;
  endAt?: string | null;
  bucket: string;
  totalMarks?: number | null;
};

export function StudentQuizzesPage() {
  const [tab, setTab] = useState('AVAILABLE');
  const [rows, setRows] = useState<QuizRow[] | null>(null);
  useDocumentTitle('Quizzes');
  useEffect(() => {
    api<{ quizzes: QuizRow[] }>('/api/student/quizzes')
      .then((d) => setRows(d.quizzes))
      .catch(() => setRows([]));
  }, []);
  const filtered = (rows || []).filter((q) => (tab === 'ALL' ? true : q.bucket === tab));
  return (
    <div className="animate-fade-in">
      <PageHeader title="Quizzes" subtitle="Timed attempts for published quizzes in your class subjects." />
      <Tabs
        tabs={[
          { id: 'AVAILABLE', label: 'Available' },
          { id: 'UPCOMING', label: 'Upcoming' },
          { id: 'COMPLETED', label: 'Completed' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className="mt-4">
        {!rows ? (
          <Skeleton className="h-40 w-full" />
        ) : filtered.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((q) => (
              <Link key={q.id} to={`/lms/quizzes/${q.id}`} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 hover:border-border-strong">
                <p className="font-semibold">{q.title}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {q.courseName} {q.moduleName ? `· ${q.moduleName}` : ''}
                </p>
                <p className="mt-2 text-sm text-ink-secondary">
                  {q.durationMinutes ? `${q.durationMinutes} min` : 'Untimed'} · {q.attemptsAllowed} attempt{q.attemptsAllowed === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-ink-muted">Available until {formatDate(q.endAt)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <StudentEmpty title="No quizzes" body="Published quizzes for your class subjects appear here." />
        )}
      </div>
    </div>
  );
}

export function StudentQuizDetailPage() {
  const { id } = useParams();
  const quizId = Number(id);
  const navigate = useNavigate();
  const [data, setData] = useState<{
    accessible?: boolean;
    message?: string;
    historical?: boolean;
    quiz: {
      title: string;
      courseName?: string;
      moduleName?: string | null;
      durationMinutes?: number | null;
      attemptsAllowed: number;
      attemptsUsed: number;
      questionCount: number;
      totalMarks: number;
      endAt?: string | null;
      instructions?: string | null;
    };
    attempt: { token: string; status: string } | null;
  } | null>(null);
  useDocumentTitle(data?.quiz.title || 'Quiz');
  useEffect(() => {
    if (!Number.isFinite(quizId)) return;
    api<NonNullable<typeof data>>(`/api/student/quizzes/${quizId}`).then(setData);
  }, [quizId]);
  if (!data) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="animate-fade-in">
      <PageHeader title={data.quiz.title} subtitle={`${data.quiz.courseName || ''} · ${data.quiz.moduleName || ''}`} />
      <Surface>
        <p className="text-sm text-ink-secondary">
          {data.quiz.questionCount} questions · {data.quiz.totalMarks} marks · {data.quiz.durationMinutes ? `${data.quiz.durationMinutes} minutes` : 'Untimed'} · {data.quiz.attemptsUsed}/{data.quiz.attemptsAllowed} attempts
        </p>
        <p className="mt-1 text-sm text-ink-muted">Available until {formatDate(data.quiz.endAt)}</p>
        {data.quiz.instructions ? <p className="mt-3 whitespace-pre-wrap text-sm">{data.quiz.instructions}</p> : null}
        {data.message && !data.accessible ? <p className="mt-3 text-sm text-warning">{data.message}</p> : null}
        <div className="mt-4">
          <Button
            disabled={data.historical || data.accessible === false}
            onClick={() => navigate(`/lms/quizzes/${quizId}/attempt`)}
          >
            {data.attempt?.status === 'IN_PROGRESS' ? 'Resume quiz' : 'Start quiz'}
          </Button>
        </div>
      </Surface>
    </div>
  );
}

function formatTimer(seconds: number | null) {
  if (seconds == null) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function StudentQuizAttemptPage() {
  const { id } = useParams();
  const quizId = Number(id);
  const [index, setIndex] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, QuizAnswer>>({});
  const [remaining, setRemaining] = useState<number | null>(null);
  const [title, setTitle] = useState('Quiz');
  const [done, setDone] = useState<{ message?: string; result?: { obtainedMarks: number; totalMarks: number } | null } | null>(null);
  const [error, setError] = useState('');
  const saving = useRef(false);
  useDocumentTitle(title);

  useEffect(() => {
    if (!Number.isFinite(quizId)) return;
    api<{
      attemptToken: string;
      questions: QuizQuestion[];
      answers?: QuizAnswer[];
      remainingSeconds?: number | null;
      quiz?: { title?: string };
      result?: { obtainedMarks: number; totalMarks: number } | null;
      message?: string;
      submitted?: boolean;
    }>(`/api/student/quizzes/${quizId}/start`, { method: 'POST' })
      .then((res) => {
        if (res.submitted || res.result) {
          setDone({ message: res.message, result: res.result });
          return;
        }
        setToken(res.attemptToken);
        setQuestions(res.questions || []);
        setTitle(res.quiz?.title || 'Quiz');
        setRemaining(res.remainingSeconds ?? null);
        const map: Record<number, QuizAnswer> = {};
        for (const a of res.answers || []) map[a.questionId] = a;
        setAnswers(map);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not start quiz'));
  }, [quizId]);

  useEffect(() => {
    if (remaining == null || done) return;
    const t = window.setInterval(() => {
      setRemaining((v) => {
        if (v == null) return v;
        if (v <= 1) {
          window.clearInterval(t);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [remaining == null, done]);

  const persist = async (submit = false) => {
    if (!token || saving.current) return;
    saving.current = true;
    try {
      const payload = {
        attemptToken: token,
        answers: Object.values(answers),
      };
      const path = submit ? `/api/student/quizzes/${quizId}/submit` : `/api/student/quizzes/${quizId}/answers`;
      const res = await api<{ result?: { obtainedMarks: number; totalMarks: number } | null; message?: string; submitted?: boolean }>(path, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (submit || res.submitted) setDone({ message: res.message, result: res.result ?? null });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      saving.current = false;
    }
  };

  useEffect(() => {
    if (!token || done) return;
    const t = window.setInterval(() => persist(false), 15000);
    return () => window.clearInterval(t);
  }, [token, answers, done]);

  useEffect(() => {
    if (remaining === 0 && token && !done) persist(true);
  }, [remaining]);

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (done) {
    return (
      <div className="mx-auto max-w-lg animate-fade-in py-10 text-center">
        <h1 className="text-2xl font-semibold">Response submitted</h1>
        {done.result ? (
          <p className="mt-3 text-lg">
            Score: {done.result.obtainedMarks}/{done.result.totalMarks}
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">
            {done.message || 'Your response has been submitted. Results will be available after faculty release.'}
          </p>
        )}
        <Link to="/lms/quizzes" className="mt-6 inline-block text-sm font-medium text-accent">
          Back to quizzes
        </Link>
      </div>
    );
  }
  if (!questions.length) return <Skeleton className="h-48 w-full" />;
  const q = questions[index];

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-ink-muted">
            Question {index + 1} of {questions.length}
          </p>
        </div>
        {remaining != null ? (
          <p className="tabular-nums text-sm font-semibold" aria-live="polite">
            {formatTimer(remaining)}
          </p>
        ) : null}
      </div>
      <div className="mb-4 h-1 rounded-full bg-surface-muted" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={questions.length}>
        <div className="h-full rounded-full bg-accent" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>
      <Surface>
        <QuizQuestionRenderer
          question={q}
          value={answers[q.id]}
          onChange={(value) => setAnswers((prev) => ({ ...prev, [q.id]: value }))}
        />
      </Surface>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          Previous
        </Button>
        <Button variant="secondary" disabled={index >= questions.length - 1} onClick={() => setIndex((i) => i + 1)}>
          Next
        </Button>
        <Button onClick={() => persist(true)}>Submit quiz</Button>
      </div>
    </div>
  );
}

export function StudentAssessmentsPage() {
  const [rows, setRows] = useState<Array<{
    id: number;
    title: string;
    courseName?: string;
    date?: string | null;
    marks: number | null;
    maxMarks: number;
    status: string;
    percentage: number | null;
    coBreakup: Array<{ code: string; awarded: number; max: number }>;
  }> | null>(null);
  useDocumentTitle('Assessments');
  useEffect(() => {
    api<{ assessments: NonNullable<typeof rows> }>('/api/student/assessments')
      .then((d) => setRows(d.assessments))
      .catch(() => setRows([]));
  }, []);
  return (
    <div className="animate-fade-in">
      <PageHeader title="Internal assessments" subtitle="Question paper generation stays with faculty. You see dates, marks, and released results." />
      {!rows ? (
        <Skeleton className="h-40 w-full" />
      ) : rows.length ? (
        <div className="space-y-3">
          {rows.map((a) => (
            <Surface key={a.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-sm text-ink-muted">{a.courseName} · {formatDate(a.date)}</p>
                </div>
                <StatusPill tone={statusToneFor(a.status)}>{a.status.replaceAll('_', ' ')}</StatusPill>
              </div>
              {a.status === 'RESULT_RELEASED' ? (
                <div className="mt-3">
                  <p className="text-sm">
                    {a.marks}/{a.maxMarks} {a.percentage != null ? `(${a.percentage}%)` : ''}
                  </p>
                  {a.coBreakup.length ? (
                    <ul className="mt-2 text-sm text-ink-muted">
                      {a.coBreakup.map((co) => (
                        <li key={co.code}>
                          {co.code}: {co.awarded}/{co.max}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-sm text-ink-muted">
                  {a.status === 'RESULT_PENDING' ? 'Result pending faculty release.' : `Maximum ${a.maxMarks} marks`}
                </p>
              )}
            </Surface>
          ))}
        </div>
      ) : (
        <StudentEmpty title="No assessments yet" body="Internal assessments appear here when faculty publish or release results." />
      )}
    </div>
  );
}
