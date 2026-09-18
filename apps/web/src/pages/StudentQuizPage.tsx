import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { BrandMark } from '../components/Brand';
import { Button, Field, Input } from '../components/ui';
import { QuizQuestionRenderer } from '../components/quiz/QuizQuestionRenderer';
import { api } from '../lib/api';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { hasQuizAnswer, type QuizAnswer, type QuizQuestion } from '../types/quiz';

type PublicQuiz = {
  title: string;
  description?: string | null;
  instructions?: string | null;
  courseName?: string | null;
  moduleName?: string | null;
  durationMinutes?: number | null;
  attemptsAllowed?: number;
  passPercentage?: number;
  questionCount?: number;
  totalMarks?: number;
  shuffleQuestions?: boolean;
  showScoreImmediately?: boolean;
  effectiveStatus?: string;
  timezone?: string;
};

type Page = 'welcome' | 'identity' | 'instructions' | 'attempt' | 'result' | 'unavailable';

type ResultPayload = {
  submitted?: boolean;
  result?: {
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
    passed: boolean;
    timeTakenSeconds: number;
  } | null;
  review?: Array<{
    id: number;
    questionText: string;
    questionType: string;
    marks: number;
    options: Array<{ id: number; label: string }>;
    yourOptionIds: number[];
    yourNumericAnswer: number | null;
    yourTextAnswer: string | null;
    awardedMarks: number;
    isCorrect: boolean | null;
    unanswered: boolean;
    correctOptionIds?: number[];
    explanation?: string | null;
    numericAnswer?: number | null;
  }> | null;
  scoreReleased?: boolean;
  answersReleased?: boolean;
  message?: string;
  quiz?: { title: string; courseName?: string; moduleName?: string };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function tokenKey(code: string) {
  return `quiz-attempt:${code}`;
}

function formatRemaining(seconds: number | null) {
  if (seconds == null) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function StudentQuizPage() {
  const { code } = useParams();
  const [page, setPage] = useState<Page>('welcome');
  const [quiz, setQuiz] = useState<PublicQuiz | null>(null);
  const [loadError, setLoadError] = useState('');
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);
  const [student, setStudent] = useState({ name: '', usn: '', email: '' });
  const [infoErrors, setInfoErrors] = useState<Record<string, string>>({});
  const [attemptToken, setAttemptToken] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, QuizAnswer>>({});
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [result, setResult] = useState<ResultPayload | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const saveTimer = useRef<number | null>(null);

  useDocumentTitle(quiz?.title ? `${quiz.title} · Quiz` : 'Quiz');

  useEffect(() => {
    if (!code) return;
    api<{ accessible: boolean; message?: string; quiz?: PublicQuiz }>(`/api/public/q/${encodeURIComponent(code)}`, {
      auth: false,
    })
      .then((d) => {
        setQuiz(d.quiz || null);
        if (!d.accessible) {
          setMessage(d.message || 'This quiz is not open.');
          setPage('unavailable');
          return;
        }
        const stored = sessionStorage.getItem(tokenKey(code));
        if (stored) {
          return api<Record<string, unknown>>(
            `/api/public/q/${encodeURIComponent(code)}/attempt/${encodeURIComponent(stored)}`,
            { auth: false },
          ).then((attempt) => applyAttempt(attempt));
        }
      })
      .catch(() => setLoadError('This quiz link is invalid or no longer available.'));
  }, [code]);

  useEffect(() => {
    if (page !== 'attempt' || remaining == null) return;
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev == null) return prev;
        if (prev <= 1) {
          window.clearInterval(id);
          void submit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [page, remaining == null]);

  const applyAttempt = (payload: Record<string, unknown>) => {
    if (payload.submitted) {
      setResult(payload as ResultPayload);
      setPage('result');
      return;
    }
    const qs = (payload.questions as QuizQuestion[]) || [];
    const saved = (payload.answers as QuizAnswer[]) || [];
    setAttemptToken(String(payload.attemptToken));
    setQuestions(qs);
    setAnswers(Object.fromEntries(saved.map((a) => [a.questionId, a])));
    setRemaining(typeof payload.remainingSeconds === 'number' ? payload.remainingSeconds : null);
    if (code) sessionStorage.setItem(tokenKey(code), String(payload.attemptToken));
    setPage('attempt');
  };

  const start = async () => {
    if (!code) return;
    setWorking(true);
    try {
      const payload = await api<Record<string, unknown>>(`/api/public/q/${encodeURIComponent(code)}/start`, {
        method: 'POST',
        auth: false,
        body: JSON.stringify(student),
      });
      applyAttempt(payload);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not start the quiz');
    } finally {
      setWorking(false);
    }
  };

  const persistAnswers = (next: Record<number, QuizAnswer>, token: string) => {
    if (!code) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      api(`/api/public/q/${encodeURIComponent(code)}/answers`, {
        method: 'PATCH',
        auth: false,
        body: JSON.stringify({ attemptToken: token, answers: Object.values(next) }),
      }).then((res) => {
        const r = res as { submitted?: boolean };
        if (r.submitted) {
          setResult(res as ResultPayload);
          setPage('result');
        }
      }).catch(() => undefined);
    }, 400);
  };

  const setAnswer = (answer: QuizAnswer) => {
    const next = { ...answers, [answer.questionId]: answer };
    setAnswers(next);
    if (attemptToken) persistAnswers(next, attemptToken);
  };

  const answeredCount = questions.filter((q) => hasQuizAnswer(answers[q.id])).length;

  const submit = async (auto = false) => {
    if (!code || !attemptToken) return;
    setWorking(true);
    try {
      const payload = await api<ResultPayload>(`/api/public/q/${encodeURIComponent(code)}/submit`, {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ attemptToken, answers: Object.values(answers) }),
      });
      setResult(payload);
      setPage('result');
      if (code) sessionStorage.removeItem(tokenKey(code));
    } catch (e) {
      if (!auto) setMessage(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setWorking(false);
      setConfirmOpen(false);
    }
  };

  const validateIdentity = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!student.name.trim()) next.name = 'Enter your name';
    if (!student.usn.trim() || student.usn.trim().length < 5) next.usn = 'Enter a valid USN';
    if (!EMAIL_PATTERN.test(student.email)) next.email = 'Enter a valid email';
    setInfoErrors(next);
    if (!Object.keys(next).length) setPage('instructions');
  };

  const current = questions[index];
  const lowTime = remaining != null && remaining <= 60;

  if (loadError) {
    return (
      <Shell>
        <p className="text-sm text-ink-muted">{loadError}</p>
      </Shell>
    );
  }
  if (!quiz) {
    return (
      <Shell>
        <p className="text-sm text-ink-muted">Loading quiz…</p>
      </Shell>
    );
  }

  if (page === 'unavailable') {
    return (
      <Shell>
        <h1 className="text-xl font-semibold">{quiz.title}</h1>
        <p className="mt-2 text-sm text-ink-muted">{message}</p>
      </Shell>
    );
  }

  if (page === 'welcome') {
    return (
      <Shell>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Quiz</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{quiz.title}</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {[quiz.courseName, quiz.moduleName].filter(Boolean).join(' · ')}
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Questions" value={quiz.questionCount ?? '—'} />
          <Stat label="Marks" value={quiz.totalMarks ?? '—'} />
          <Stat label="Minutes" value={quiz.durationMinutes ?? '—'} />
          <Stat label="Pass mark" value={`${quiz.passPercentage ?? 40}%`} />
        </dl>
        <p className="mt-4 text-sm text-ink-muted">Attempts allowed: {quiz.attemptsAllowed === 0 ? 'Unlimited' : quiz.attemptsAllowed ?? 1}</p>
        <Button className="mt-6 w-full sm:w-auto" onClick={() => setPage('identity')}>
          Continue
        </Button>
      </Shell>
    );
  }

  if (page === 'identity') {
    return (
      <Shell>
        <h1 className="text-xl font-semibold">Identify yourself</h1>
        <form className="mt-5 space-y-4" onSubmit={validateIdentity}>
          <Field label="Name" error={infoErrors.name}>
            <Input value={student.name} onChange={(e) => setStudent({ ...student, name: e.target.value })} />
          </Field>
          <Field label="USN" error={infoErrors.usn}>
            <Input value={student.usn} onChange={(e) => setStudent({ ...student, usn: e.target.value })} />
          </Field>
          <Field label="Email" error={infoErrors.email}>
            <Input type="email" value={student.email} onChange={(e) => setStudent({ ...student, email: e.target.value })} />
          </Field>
          {message ? <p className="text-sm text-danger">{message}</p> : null}
          <Button type="submit" className="w-full sm:w-auto">
            Continue
          </Button>
        </form>
      </Shell>
    );
  }

  if (page === 'instructions') {
    return (
      <Shell>
        <h1 className="text-xl font-semibold">Before you begin</h1>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink-secondary">
          <li>{quiz.questionCount} questions · {quiz.totalMarks} marks</li>
          <li>{quiz.durationMinutes} minutes · the quiz submits automatically when time expires</li>
          <li>{quiz.attemptsAllowed === 1 ? 'One attempt' : `${quiz.attemptsAllowed || 'Unlimited'} attempts`}</li>
          {quiz.shuffleQuestions ? <li>Questions may be shuffled</li> : null}
          <li>
            {quiz.showScoreImmediately
              ? 'Marks will be shown immediately after submission'
              : 'Marks may be released after the quiz ends'}
          </li>
        </ul>
        {quiz.instructions ? <p className="mt-4 text-sm text-ink-secondary">{quiz.instructions}</p> : null}
        {message ? <p className="mt-3 text-sm text-danger">{message}</p> : null}
        <Button className="mt-6" disabled={working} onClick={start}>
          {working ? 'Starting…' : 'Start Quiz'}
        </Button>
      </Shell>
    );
  }

  if (page === 'result' && result) {
    const r = result.result;
    return (
      <Shell wide>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Quiz completed</p>
        <h1 className="mt-2 text-2xl font-semibold">{result.quiz?.title || quiz.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {[result.quiz?.courseName || quiz.courseName, result.quiz?.moduleName || quiz.moduleName]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {r ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <Stat label="Marks" value={`${r.obtainedMarks} / ${r.totalMarks}`} />
            <Stat label="Percentage" value={`${r.percentage}%`} />
            <Stat label="Result" value={r.passed ? 'Passed' : 'Failed'} />
            <Stat label="Time taken" value={formatRemaining(r.timeTakenSeconds)} />
          </div>
        ) : (
          <p className="mt-6 text-sm text-ink-secondary">{result.message}</p>
        )}
        {result.answersReleased && result.review ? (
          <Button className="mt-6" variant="secondary" onClick={() => setShowReview((v) => !v)}>
            {showReview ? 'Hide answers' : 'View answers'}
          </Button>
        ) : null}
        {showReview && result.review ? (
          <div className="mt-6 space-y-4">
            {result.review.map((q, i) => (
              <div key={q.id} className="rounded-[var(--radius-md)] border border-border p-4">
                <p className="text-xs text-ink-muted">
                  Q{i + 1} · {q.awardedMarks}/{q.marks} {q.isCorrect ? '· Correct' : q.unanswered ? '· Unanswered' : '· Incorrect'}
                </p>
                <p className="mt-1 text-sm font-medium">{q.questionText}</p>
                <div className="mt-3">
                  <QuizQuestionRenderer
                    question={{
                      id: q.id,
                      questionText: q.questionText,
                      questionType: q.questionType as QuizQuestion['questionType'],
                      marks: q.marks,
                      options: q.options,
                      correctOptionIds: q.correctOptionIds,
                      numericAnswer: q.numericAnswer,
                    }}
                    value={{
                      questionId: q.id,
                      selectedOptionIds: q.yourOptionIds,
                      numericAnswer: q.yourNumericAnswer,
                      textAnswer: q.yourTextAnswer,
                    }}
                    mode="review"
                    showCorrect
                  />
                </div>
                {q.explanation ? <p className="mt-2 text-sm text-ink-muted">{q.explanation}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
      </Shell>
    );
  }

  if (!current) {
    return (
      <Shell>
        <p className="text-sm text-ink-muted">Preparing questions…</p>
      </Shell>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <BrandMark />
          {remaining != null ? (
            <p
              className={`text-sm tabular-nums ${lowTime ? 'font-semibold text-ink' : 'text-ink-secondary'}`}
              aria-live="polite"
              aria-label={`Time remaining ${formatRemaining(remaining)}`}
            >
              Time remaining {formatRemaining(remaining)}
            </p>
          ) : null}
        </div>
      </header>
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <section>
          <p className="text-xs font-medium text-ink-muted">
            Question {index + 1} of {questions.length}
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full bg-accent" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
          </div>
          <h2 className="mt-5 text-[17px] font-medium leading-snug text-ink">{current.questionText}</h2>
          <p className="mt-1 text-xs text-ink-muted">{current.marks} mark{Number(current.marks) === 1 ? '' : 's'}</p>
          <div className="mt-4">
            <QuizQuestionRenderer question={current} value={answers[current.id]} onChange={setAnswer} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="secondary" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
              Previous
            </Button>
            {index < questions.length - 1 ? (
              <Button onClick={() => setIndex((i) => i + 1)}>Next</Button>
            ) : (
              <Button onClick={() => setConfirmOpen(true)}>Submit Quiz</Button>
            )}
          </div>
        </section>
        <aside className="lg:sticky lg:top-20">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">Questions</p>
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-5">
            {questions.map((q, i) => {
              const answered = hasQuizAnswer(answers[q.id]);
              return (
                <button
                  key={q.id}
                  type="button"
                  aria-label={`Question ${i + 1}${answered ? ', answered' : ', unanswered'}${i === index ? ', current' : ''}`}
                  onClick={() => setIndex(i)}
                  className={`h-9 rounded-[var(--radius-sm)] text-xs font-medium ${
                    i === index
                      ? 'bg-ink text-white'
                      : answered
                        ? 'bg-accent-soft text-ink'
                        : 'bg-surface-muted text-ink-muted'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <Button className="mt-4 w-full" variant="secondary" onClick={() => setConfirmOpen(true)}>
            Submit Quiz
          </Button>
        </aside>
      </main>
      {confirmOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-[var(--radius-md)] bg-surface p-5 shadow-lg">
            <h3 className="text-lg font-semibold">Submit quiz?</h3>
            <p className="mt-2 text-sm text-ink-secondary">
              You have answered {answeredCount} of {questions.length} questions.
              {answeredCount < questions.length
                ? ` ${questions.length - answeredCount} unanswered.`
                : ' All questions are answered.'}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                Continue Quiz
              </Button>
              <Button disabled={working} onClick={() => submit(false)}>
                Submit Quiz
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Shell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-bg">
      <div className={`mx-auto px-4 py-10 ${wide ? 'max-w-5xl' : 'max-w-xl'}`}>
        <BrandMark />
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
