import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Archive,
  CalendarClock,
  Check,
  Copy,
  Download,
  ExternalLink,
  Link2,
  Trash2,
  XCircle,
} from 'lucide-react';
import { api, downloadQuizExport } from '../lib/api';
import {
  Button,
  ConfirmDangerModal,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  Surface,
} from '../components/ui';
import { copyToClipboard, formatDateTime } from '../lib/utils';
import { DEFAULT_TIMEZONE, utcToZonedLocalInput, zonedLocalToUtcIso } from '../lib/timezone';
import { QuizBuilder } from '../components/quiz/QuizBuilder';
import { QuizQuestionRenderer } from '../components/quiz/QuizQuestionRenderer';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import type { QuizDetail } from '../types/quiz';

const TABS = ['overview', 'questions', 'settings', 'share', 'results', 'analytics'] as const;
type Tab = (typeof TABS)[number];

export function QuizDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.includes(params.get('tab') as Tab) ? params.get('tab') : 'overview') as Tab;
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = (next?: QuizDetail) => {
    if (next) {
      setQuiz(next);
      return;
    }
    api<{ quiz: QuizDetail }>(`/api/quizzes/${id}`)
      .then((d) => setQuiz(d.quiz))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  };

  useEffect(() => {
    load();
  }, [id]);

  useDocumentTitle(quiz?.title);

  const run = async (action: () => Promise<unknown>, message: string, nextTab?: Tab) => {
    setWorking(true);
    try {
      const res = await action();
      const payload = res as { quiz?: QuizDetail };
      if (payload.quiz) setQuiz(payload.quiz);
      else load();
      if (nextTab) setParams({ tab: nextTab });
    } catch (e) {
      setError(e instanceof Error ? e.message : message);
    } finally {
      setWorking(false);
    }
  };

  const remove = async () => {
    setWorking(true);
    try {
      await api(`/api/quizzes/${quiz!.id}`, { method: 'DELETE' });
      navigate('/quizzes');
    } catch (e) {
      setDeleteOpen(false);
      setError(e instanceof Error ? e.message : 'Could not delete quiz');
    } finally {
      setWorking(false);
    }
  };

  if (error && !quiz) return <p className="text-sm text-danger">{error}</p>;
  if (!quiz) return <p className="text-sm text-ink-muted">Loading…</p>;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={quiz.title}
        subtitle={[quiz.courseName, quiz.moduleName].filter(Boolean).join(' · ')}
        breadcrumb={<Link to="/quizzes">Quizzes</Link>}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={quiz.effectiveStatus} />
            <Button variant="danger-soft" size="sm" disabled={working} onClick={() => setDeleteOpen(true)}>
              <Trash2 size={14} /> Delete
            </Button>
          </div>
        }
      />
      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}
      <div className="mb-5 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setParams({ tab: t })}
            className={`px-3 py-2 text-sm capitalize ${
              tab === t ? 'border-b-2 border-accent font-medium text-ink' : 'text-ink-muted'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'overview' ? (
        <Overview
          quiz={quiz}
          onPublish={() =>
            run(() => api(`/api/quizzes/${quiz.id}/publish`, { method: 'POST' }), 'Published', 'share')
          }
        />
      ) : null}
      {tab === 'questions' ? <QuizBuilder quiz={quiz} onReload={load} /> : null}
      {tab === 'settings' ? <SettingsTab quiz={quiz} onReload={load} /> : null}
      {tab === 'share' ? <ShareTab quiz={quiz} working={working} run={run} /> : null}
      {tab === 'results' ? <ResultsTab quiz={quiz} /> : null}
      {tab === 'analytics' ? <AnalyticsTab quiz={quiz} /> : null}
      <ConfirmDangerModal
        open={deleteOpen}
        title="Delete this quiz?"
        description="This removes the quiz from your list. Quizzes with student attempts cannot be deleted — archive them instead."
        confirmLabel="Delete Quiz"
        loading={working}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          void remove();
        }}
      />
    </div>
  );
}

function Overview({ quiz, onPublish }: { quiz: QuizDetail; onPublish?: () => void }) {
  return (
    <div className="space-y-4">
      {quiz.effectiveStatus === 'DRAFT' && onPublish ? (
        <Surface className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-secondary">Add questions, then publish to generate a student link and QR code.</p>
          <Button onClick={onPublish}>Publish quiz</Button>
        </Surface>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        ['Questions', quiz.questionCount ?? quiz.questions.length],
        ['Total marks', quiz.totalMarks ?? quiz.questions.reduce((s, q) => s + Number(q.marks), 0)],
        ['Duration', quiz.durationMinutes ? `${quiz.durationMinutes} min` : '—'],
        ['Attempts', quiz.attemptCount ?? 0],
      ].map(([label, value]) => (
        <Surface key={String(label)}>
          <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
        </Surface>
      ))}
      </div>
    </div>
  );
}

function SettingsTab({ quiz, onReload }: { quiz: QuizDetail; onReload: (q?: QuizDetail) => void }) {
  const tz = quiz.timezone || DEFAULT_TIMEZONE;
  const [form, setForm] = useState({
    durationMinutes: String(quiz.durationMinutes ?? 20),
    attemptsAllowed: String(quiz.attemptsAllowed ?? 1),
    passPercentage: String(quiz.passPercentage ?? 40),
    shuffleQuestions: quiz.shuffleQuestions,
    shuffleOptions: quiz.shuffleOptions,
    showScoreImmediately: quiz.showScoreImmediately,
    showCorrectAnswers: quiz.showCorrectAnswers,
    showExplanation: quiz.showExplanation,
    startAt: utcToZonedLocalInput(quiz.startAt, tz),
    endAt: utcToZonedLocalInput(quiz.endAt, tz),
    instructions: quiz.instructions || '',
  });
  const save = async () => {
    const res = await api<{ quiz: QuizDetail }>(`/api/quizzes/${quiz.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        durationMinutes: Number(form.durationMinutes) || null,
        attemptsAllowed: Number(form.attemptsAllowed),
        passPercentage: Number(form.passPercentage),
        shuffleQuestions: form.shuffleQuestions,
        shuffleOptions: form.shuffleOptions,
        showScoreImmediately: form.showScoreImmediately,
        showCorrectAnswers: form.showCorrectAnswers,
        showExplanation: form.showExplanation,
        instructions: form.instructions || null,
        startAt: form.startAt ? zonedLocalToUtcIso(form.startAt, tz) : null,
        endAt: form.endAt ? zonedLocalToUtcIso(form.endAt, tz) : null,
      }),
    });
    onReload(res.quiz);
  };
  return (
    <Surface className="max-w-2xl space-y-4">
      <Field label="Instructions">
        <Input value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Duration (min)">
          <Input value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} />
        </Field>
        <Field label="Attempts (0 = unlimited)">
          <Input value={form.attemptsAllowed} onChange={(e) => setForm({ ...form, attemptsAllowed: e.target.value })} />
        </Field>
        <Field label="Pass %">
          <Input value={form.passPercentage} onChange={(e) => setForm({ ...form, passPercentage: e.target.value })} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={`Start (${tz === 'Asia/Kolkata' ? 'IST' : tz})`} optional>
          <Input type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
        </Field>
        <Field label="End" optional>
          <Input type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.shuffleQuestions} onChange={(e) => setForm({ ...form, shuffleQuestions: e.target.checked })} />
        Shuffle questions
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.shuffleOptions} onChange={(e) => setForm({ ...form, shuffleOptions: e.target.checked })} />
        Shuffle options
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.showScoreImmediately} onChange={(e) => setForm({ ...form, showScoreImmediately: e.target.checked })} />
        Show score immediately
      </label>
      <Field label="Correct answers">
        <Select value={form.showCorrectAnswers} onChange={(e) => setForm({ ...form, showCorrectAnswers: e.target.value })}>
          <option value="IMMEDIATELY">Immediately</option>
          <option value="AFTER_END">After quiz ends</option>
          <option value="NEVER">Never</option>
        </Select>
      </Field>
      <Button onClick={save}>Save settings</Button>
    </Surface>
  );
}

function ShareTab({
  quiz,
  working,
  run,
}: {
  quiz: QuizDetail;
  working: boolean;
  run: (action: () => Promise<unknown>, message: string, nextTab?: Tab) => Promise<void>;
}) {
  const shareUrl = quiz.shareCode ? `${window.location.origin}/q/${quiz.shareCode}` : '';
  const [copied, setCopied] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [endLocal, setEndLocal] = useState('');
  const [archiveOpen, setArchiveOpen] = useState(false);

  if (!shareUrl) {
    return (
      <EmptyState
        title="Publish to create a student link"
        body="A public URL and QR code are generated when this quiz is published."
        action={
          <Button
            disabled={working}
            onClick={() => run(() => api(`/api/quizzes/${quiz.id}/publish`, { method: 'POST' }), 'Published', 'share')}
          >
            Publish quiz
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Surface>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-accent-soft p-2.5 text-accent">
            <Link2 size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Student quiz link</h3>
            <p className="mt-1 text-sm text-ink-muted">Share this link or classroom QR. Students open /q/… — not a survey link.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2 rounded-xl border border-border bg-surface-muted/40 p-3 sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 break-all text-sm">{shareUrl}</p>
          <Button
            variant="secondary"
            onClick={async () => {
              if (await copyToClipboard(shareUrl)) {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1800);
              }
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={shareUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <ExternalLink size={16} /> Open student link
          </a>
          {['ACTIVE', 'SCHEDULED'].includes(quiz.effectiveStatus) ? (
            <Button variant="secondary" disabled={working} onClick={() => run(() => api(`/api/quizzes/${quiz.id}/close`, { method: 'POST' }), 'Closed')}>
              <XCircle size={16} /> Close Quiz
            </Button>
          ) : null}
          {quiz.effectiveStatus === 'CLOSED' ? (
            <Button disabled={working} onClick={() => run(() => api(`/api/quizzes/${quiz.id}/reopen`, { method: 'POST' }), 'Reopened')}>
              Reopen
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => setExtendOpen(true)}>
            <CalendarClock size={16} /> Extend
          </Button>
          <Button variant="ghost" onClick={() => setArchiveOpen(true)}>
            <Archive size={16} /> Archive
          </Button>
        </div>
      </Surface>
      <Surface className="flex flex-col items-center">
        <div id="quiz-share-qr">
          <QRCodeSVG value={shareUrl} size={210} level="H" marginSize={1} />
        </div>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => {
            const svg = document.querySelector('#quiz-share-qr svg');
            if (!svg) return;
            const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quiz-${quiz.shareCode}-qr.svg`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download QR
        </Button>
      </Surface>
      <Modal open={extendOpen} onClose={() => setExtendOpen(false)} title="Extend quiz">
        <Field label="New end">
          <Input type="datetime-local" value={endLocal} onChange={(e) => setEndLocal(e.target.value)} />
        </Field>
        <Button
          className="mt-3"
          onClick={() => {
            const endAt = zonedLocalToUtcIso(endLocal, quiz.timezone || DEFAULT_TIMEZONE);
            run(() => api(`/api/quizzes/${quiz.id}/extend`, { method: 'POST', body: JSON.stringify({ endAt, reopen: true }) }), 'Extended');
            setExtendOpen(false);
          }}
        >
          Save
        </Button>
      </Modal>
      <ConfirmDangerModal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Archive this quiz?"
        description="No new attempts will be accepted. Historical results remain available."
        confirmLabel="Archive"
        onConfirm={() => run(() => api(`/api/quizzes/${quiz.id}/archive`, { method: 'POST' }), 'Archived')}
      />
    </div>
  );
}

function ResultsTab({ quiz }: { quiz: QuizDetail }) {
  const [data, setData] = useState<{
    summary: { attempted: number; averageMarks: number; highestMarks: number; lowestMarks: number; passPercentage: number };
    attempts: Array<{
      attemptToken: string;
      studentName: string;
      usn: string;
      attemptNumber: number;
      obtainedMarks: number;
      totalMarks: number;
      percentage: number;
      result: string;
      startedAt: string;
      submittedAt: string;
      timeTakenSeconds: number;
    }>;
  } | null>(null);
  const [detail, setDetail] = useState<null | Awaited<ReturnType<typeof loadDetail>>>(null);

  async function loadDetail(token: string) {
    return api<{
      studentName: string;
      usn: string;
      obtainedMarks: number;
      totalMarks: number;
      percentage: number;
      passed: boolean;
      questions: Array<{
        id: number;
        questionText: string;
        questionType: string;
        marks: number;
        explanation?: string | null;
        options: Array<{ id: number; label: string; isCorrect: boolean }>;
        studentOptionIds: number[];
        studentNumericAnswer: number | null;
        studentTextAnswer: string | null;
        awardedMarks: number;
        isCorrect: boolean | null;
        correctOptionIds: number[];
        numericAnswer?: number | null;
      }>;
    }>(`/api/quizzes/${quiz.id}/results/${token}`);
  }

  useEffect(() => {
    api<NonNullable<typeof data>>(`/api/quizzes/${quiz.id}/results`).then(setData).catch(console.error);
  }, [quiz.id]);

  if (!data) return <p className="text-sm text-ink-muted">Loading results…</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-5">
        {[
          ['Attempted', data.summary.attempted],
          ['Average', data.summary.averageMarks],
          ['Highest', data.summary.highestMarks],
          ['Lowest', data.summary.lowestMarks],
          ['Pass %', data.summary.passPercentage],
        ].map(([l, v]) => (
          <Surface key={String(l)} className="!py-3">
            <p className="text-xs text-ink-muted">{l}</p>
            <p className="text-lg font-semibold tabular-nums">{v}</p>
          </Surface>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => downloadQuizExport(quiz.id, 'xlsx')}>
          <Download size={15} /> Excel
        </Button>
        <Button variant="secondary" onClick={() => downloadQuizExport(quiz.id, 'csv')}>
          CSV
        </Button>
      </div>
      <Surface className="!p-0 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-ink-muted">
              {['Student', 'USN', 'Attempt', 'Marks', '%', 'Result', 'Submitted', ''].map((h) => (
                <th key={h} className="px-4 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.attempts.map((a) => (
              <tr key={a.attemptToken} className="border-b border-border last:border-0">
                <td className="px-4 py-2">{a.studentName}</td>
                <td className="px-4 py-2">{a.usn}</td>
                <td className="px-4 py-2">{a.attemptNumber}</td>
                <td className="px-4 py-2 tabular-nums">
                  {a.obtainedMarks}/{a.totalMarks}
                </td>
                <td className="px-4 py-2 tabular-nums">{a.percentage}</td>
                <td className="px-4 py-2">{a.result}</td>
                <td className="px-4 py-2 text-ink-muted">{formatDateTime(a.submittedAt)}</td>
                <td className="px-4 py-2">
                  <Button size="sm" variant="ghost" onClick={() => loadDetail(a.attemptToken).then(setDetail)}>
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Surface>
      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail ? `${detail.studentName} · ${detail.usn}` : 'Attempt'}>
        {detail ? (
          <div className="space-y-4">
            <p className="text-sm">
              {detail.obtainedMarks}/{detail.totalMarks} · {detail.percentage}% · {detail.passed ? 'Passed' : 'Failed'}
            </p>
            {detail.questions.map((q, i) => (
              <div key={q.id} className="rounded-[var(--radius-md)] border border-border p-3">
                <p className="text-xs text-ink-muted">
                  Q{i + 1} · {q.awardedMarks}/{q.marks}
                </p>
                <p className="mt-1 text-sm font-medium">{q.questionText}</p>
                <div className="mt-2">
                  <QuizQuestionRenderer
                    question={{
                      id: q.id,
                      questionText: q.questionText,
                      questionType: q.questionType as QuizDetail['questions'][number]['questionType'],
                      marks: q.marks,
                      options: q.options,
                      correctOptionIds: q.correctOptionIds,
                      numericAnswer: q.numericAnswer,
                    }}
                    value={{
                      questionId: q.id,
                      selectedOptionIds: q.studentOptionIds,
                      numericAnswer: q.studentNumericAnswer,
                      textAnswer: q.studentTextAnswer,
                    }}
                    mode="review"
                    showCorrect
                  />
                </div>
                {q.explanation ? <p className="mt-2 text-xs text-ink-muted">{q.explanation}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function AnalyticsTab({ quiz }: { quiz: QuizDetail }) {
  const [data, setData] = useState<{
    overview?: { attempted: number; averagePercentage: number; passPercentage: number };
    questions: Array<{ questionText: string; correctPct: number; incorrectPct: number; unansweredPct: number; moduleName?: string | null }>;
    modulePerformance: Array<{ moduleName: string; averagePct: number }>;
    coPerformance?: Array<{
      coCode: string;
      coStatement?: string | null;
      status: 'ASSESSED' | 'NOT_ASSESSED';
      questionCount: number;
      availableMarks: number;
      marksAwarded: number | null;
      averagePerformancePct: number | null;
      correctResponseRate: number | null;
      note?: string;
    }>;
  } | null>(null);
  const [coPerf, setCoPerf] = useState<{
    note?: string;
    evaluatedAttemptCount?: number;
    cos: Array<{
      coCode: string;
      questionCount: number;
      availableMarks: number;
      classAverageMarks: number;
      averagePercent: number | null;
    }>;
  } | null>(null);
  useEffect(() => {
    api<NonNullable<typeof data>>(`/api/quizzes/${quiz.id}/analytics`).then(setData).catch(console.error);
    // Dedicated CO performance endpoint (parallel to assignments)
    api<NonNullable<typeof coPerf>>(`/api/quizzes/${quiz.id}/co-performance`)
      .then(setCoPerf)
      .catch(() => {
        /* optional if older API */
      });
  }, [quiz.id]);
  if (!data) return <p className="text-sm text-ink-muted">Loading analytics…</p>;
  return (
    <div className="space-y-5">
      <Surface>
        <h3 className="text-sm font-semibold">Overview</h3>
        <p className="mt-2 text-sm text-ink-muted">
          Attempts {data.overview?.attempted ?? data.questions.length ? (data as { attempted?: number }).attempted ?? '—' : '—'}
          {' · '}Avg {(data.overview?.averagePercentage ?? (data as { averagePercentage?: number }).averagePercentage) ?? '—'}%
          {' · '}Pass rate {(data.overview?.passPercentage ?? (data as { passPercentage?: number }).passPercentage) ?? '—'}%
        </p>
      </Surface>
      {coPerf?.cos?.length ? (
        <Surface>
          <h3 className="text-sm font-semibold">CO Performance</h3>
          <p className="mt-1 text-xs text-ink-muted">
            {coPerf.note || 'Class average by mapped CO — not final CO attainment.'}
            {coPerf.evaluatedAttemptCount != null
              ? ` · ${coPerf.evaluatedAttemptCount} submitted attempt(s)`
              : ''}
          </p>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-xs uppercase text-ink-muted">
              <tr>
                <th className="py-1">CO</th>
                <th className="py-1">Questions</th>
                <th className="py-1">Available</th>
                <th className="py-1">Class avg</th>
                <th className="py-1">Avg %</th>
              </tr>
            </thead>
            <tbody>
              {coPerf.cos.map((row) => (
                <tr key={row.coCode} className="border-t border-border/60">
                  <td className="py-1.5 font-medium">{row.coCode}</td>
                  <td className="py-1.5 tabular-nums">{row.questionCount}</td>
                  <td className="py-1.5 tabular-nums">{row.availableMarks}</td>
                  <td className="py-1.5 tabular-nums">{row.classAverageMarks}</td>
                  <td className="py-1.5 tabular-nums">
                    {row.averagePercent != null ? `${row.averagePercent}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      ) : data.coPerformance?.length ? (
        <Surface>
          <h3 className="text-sm font-semibold">CO Performance</h3>
          <p className="mt-1 text-xs text-ink-muted">
            CO Assessment Performance — not final CO Attainment. Not Assessed is not shown as 0%.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {data.coPerformance.map((row) => (
              <li key={row.coCode} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-2">
                <div>
                  <span className="font-medium">{row.coCode}</span>
                  {row.coStatement ? (
                    <span className="ml-2 text-xs text-ink-muted">{row.coStatement.slice(0, 90)}</span>
                  ) : null}
                </div>
                {row.status === 'NOT_ASSESSED' ? (
                  <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Not Assessed</span>
                ) : (
                  <span className="tabular-nums text-xs text-ink-muted">
                    Q{row.questionCount} · {row.availableMarks} mk avail · {row.marksAwarded ?? 0} awarded ·{' '}
                    {row.averagePerformancePct ?? 0}% avg · {row.correctResponseRate ?? 0}% correct
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}
      {data.modulePerformance.length ? (
        <Surface>
          <h3 className="text-sm font-semibold">Module performance</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {data.modulePerformance.map((m) => (
              <li key={m.moduleName} className="flex justify-between">
                <span>{m.moduleName}</span>
                <span className="tabular-nums">{m.averagePct}%</span>
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}
      <Surface>
        <h3 className="text-sm font-semibold">Question Performance</h3>
        <ul className="mt-3 space-y-3">
          {data.questions.map((q, i) => (
            <li key={i} className="text-sm">
              <p className="font-medium text-ink">
                Q{i + 1}. {q.questionText}
              </p>
              <p className="text-xs text-ink-muted">
                Correct {q.correctPct}% · Incorrect {q.incorrectPct}% · Unanswered {q.unansweredPct}%
              </p>
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
