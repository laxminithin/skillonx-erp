import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BrandMark } from '../components/Brand';
import { Button, Field, Input, Surface } from '../components/ui';
import {
  getPublicAssignment,
  getPublicAssignmentSubmission,
  savePublicAssignmentAnswers,
  startPublicAssignment,
  submitPublicAssignment,
} from '../lib/api';
import { formatDate } from '../lib/utils';
import { useDocumentTitle } from '../lib/useDocumentTitle';

type LandingAssignment = {
  title: string;
  courseName?: string;
  moduleName?: string;
  instructions?: string | null;
  questionCount?: number;
  totalMarks?: number;
  dueAt?: string | null;
  effectiveStatus?: string;
};

type LandingPayload = {
  accessible?: boolean;
  message?: string;
  lateWindow?: boolean;
  assignment?: LandingAssignment;
};

type SessionQuestion = {
  id: number | string;
  questionText: string;
  marks: number;
  textAnswer?: string | null;
  wordCount?: number | null;
  awardedMarks?: number | null;
  feedback?: string | null;
};

type SessionPayload = {
  submissionToken: string;
  status: string;
  questions: SessionQuestion[];
  obtainedMarks?: number | null;
  totalMarks?: number | null;
  percentage?: number | null;
  resultsReleased?: boolean;
  assignment: LandingAssignment;
};

function tokenKey(code: string) {
  return `assignment_submission_${code}`;
}

function countWords(text: string) {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

function normalizeSession(raw: unknown): SessionPayload {
  const p = raw as SessionPayload & {
    resultsReleased?: boolean;
    answers?: Array<{ questionId: string | number; textAnswer?: string | null }>;
  };
  const answerMap = new Map(
    (p.answers || []).map((a) => [String(a.questionId), a.textAnswer || '']),
  );
  return {
    ...p,
    resultsReleased: !!p.resultsReleased,
    questions: (p.questions || []).map((q) => ({
      ...q,
      textAnswer: q.textAnswer ?? answerMap.get(String(q.id)) ?? null,
    })),
  };
}

export function StudentAssignmentPage() {
  const { code = '' } = useParams();
  const [landing, setLanding] = useState<LandingPayload | null>(null);
  const [error, setError] = useState('');
  const [identity, setIdentity] = useState({ name: '', email: '', usn: '' });
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const saveTimer = useRef<number | null>(null);

  const title = landing?.assignment?.title || session?.assignment?.title;
  useDocumentTitle(title ? `${title} · Assignment` : 'Assignment');

  useEffect(() => {
    getPublicAssignment(code)
      .then(async (raw) => {
        const d = raw as LandingPayload;
        setLanding(d);
        const stored = sessionStorage.getItem(tokenKey(code));
        if (stored) {
          try {
            const existing = normalizeSession(await getPublicAssignmentSubmission(code, stored));
            applySession(existing);
          } catch {
            sessionStorage.removeItem(tokenKey(code));
          }
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Assignment not found'));
  }, [code]);

  const applySession = (payload: SessionPayload) => {
    setSession(payload);
    sessionStorage.setItem(tokenKey(code), payload.submissionToken);
    const map: Record<string, string> = {};
    for (const q of payload.questions) map[String(q.id)] = q.textAnswer || '';
    setAnswers(map);
  };

  const start = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload = normalizeSession(await startPublicAssignment(code, identity));
      applySession(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start');
    }
  };

  const persist = (next: Record<string, string>, token: string) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      setSaving(true);
      try {
        await savePublicAssignmentAnswers(
          code,
          token,
          Object.entries(next).map(([questionId, textAnswer]) => ({
            questionId: Number(questionId),
            textAnswer,
          })),
        );
        setLastSavedAt(new Date());
      } catch (err) {
        console.error(err);
      } finally {
        setSaving(false);
      }
    }, 700);
  };

  const updateAnswer = (questionId: string, text: string) => {
    const next = { ...answers, [questionId]: text };
    setAnswers(next);
    if (session?.submissionToken && session.status === 'IN_PROGRESS') {
      persist(next, session.submissionToken);
    }
  };

  const answeredCount = useMemo(
    () => Object.values(answers).filter((a) => a.trim().length > 0).length,
    [answers],
  );

  const submit = async () => {
    if (!session) return;
    try {
      const payload = normalizeSession(
        await submitPublicAssignment(
          code,
          session.submissionToken,
          Object.entries(answers).map(([questionId, textAnswer]) => ({
            questionId: Number(questionId),
            textAnswer,
          })),
        ),
      );
      applySession(payload);
      setConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    }
  };

  if (error && !landing && !session) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <Surface className="space-y-3">
          <BrandMark product="Assignment" />
          <h1 className="text-lg font-semibold">Assignment unavailable</h1>
          <p className="mt-2 text-sm text-ink-muted">{error}</p>
        </Surface>
      </div>
    );
  }

  if (!session && landing?.assignment) {
    const a = landing.assignment;
    const canStart = landing.accessible !== false;
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
        <Surface className="space-y-3 text-center">
          <div className="flex justify-center">
            <BrandMark product="Assignment" />
          </div>
          <h1 className="text-2xl font-semibold">Assignment</h1>
          <p className="text-ink-muted">{a.courseName}</p>
          <p className="text-lg font-medium">{a.title}</p>
          <p className="text-sm text-ink-muted">
            {a.questionCount ?? 0} Questions · {a.totalMarks ?? 0} Marks
          </p>
          {a.dueAt ? <p className="text-sm">Due {formatDate(a.dueAt)}</p> : null}
          {landing.lateWindow ? (
            <p className="text-sm text-amber-700">Late submission window is open.</p>
          ) : null}
          {a.instructions ? (
            <p className="whitespace-pre-wrap text-left text-sm text-ink-secondary">{a.instructions}</p>
          ) : null}
        </Surface>
        {canStart ? (
          <Surface>
            <form className="space-y-3" onSubmit={start}>
              <Field label="Name">
                <Input
                  required
                  value={identity.name}
                  onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <Input
                  required
                  type="email"
                  value={identity.email}
                  onChange={(e) => setIdentity({ ...identity, email: e.target.value })}
                />
              </Field>
              <Field label="USN">
                <Input
                  required
                  value={identity.usn}
                  onChange={(e) => setIdentity({ ...identity, usn: e.target.value })}
                />
              </Field>
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <Button type="submit" className="w-full">
                Start Assignment
              </Button>
            </form>
          </Surface>
        ) : (
          <Surface>
            <p className="text-sm text-ink-muted">{landing.message || 'Not open for submissions.'}</p>
          </Surface>
        )}
      </div>
    );
  }

  if (!session) return null;

  const locked = session.status !== 'IN_PROGRESS';
  const showResults =
    session.resultsReleased ||
    session.questions.some((q) => q.awardedMarks != null);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <Surface className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">SkillonX Assignment</p>
            <h1 className="text-xl font-semibold">{session.assignment.title}</h1>
            <p className="text-sm text-ink-muted">{session.assignment.courseName}</p>
          </div>
          <BrandMark product="Assignment" size="sm" />
        </div>
        {session.assignment.instructions ? (
          <p className="whitespace-pre-wrap text-sm text-ink-muted">{session.assignment.instructions}</p>
        ) : null}
        <p className="text-xs text-ink-muted">
          {saving
            ? 'Saving draft…'
            : lastSavedAt
              ? `Draft saved ${lastSavedAt.toLocaleTimeString()}`
              : 'Draft autosaves as you type'}{' '}
          · Answered {answeredCount}/{session.questions.length}
        </p>
      </Surface>

      {session.questions.map((q, idx) => {
        const qid = String(q.id);
        return (
          <Surface key={qid} className="space-y-2">
            <p className="text-sm font-semibold">
              Q{idx + 1} — {q.marks} Marks
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{q.questionText}</p>
            <textarea
              className="min-h-48 w-full rounded-md border border-border bg-white px-3 py-3 text-base leading-relaxed"
              disabled={locked}
              value={answers[qid] || ''}
              onChange={(e) => updateAnswer(qid, e.target.value)}
              placeholder="Type or paste your answer here…"
              spellCheck
            />
            <p className="text-xs text-ink-muted">Words: {countWords(answers[qid] || '')}</p>
            {showResults && q.awardedMarks != null ? (
              <p className="text-sm">
                Marks: {q.awardedMarks}/{q.marks}
                {q.feedback ? <span className="text-ink-muted"> — {q.feedback}</span> : null}
              </p>
            ) : null}
          </Surface>
        );
      })}

      {!locked ? (
        <div className="flex justify-end gap-2">
          <Button onClick={() => setConfirmOpen(true)}>Submit Assignment</Button>
        </div>
      ) : (
        <Surface>
          <p className="font-medium">Submitted</p>
          {showResults && session.obtainedMarks != null ? (
            <p className="mt-1 text-sm">
              Score: {session.obtainedMarks}/{session.totalMarks} ({session.percentage}%)
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-muted">Awaiting faculty evaluation.</p>
          )}
        </Surface>
      )}

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Surface className="w-full max-w-md space-y-3">
            <h2 className="text-lg font-semibold">Submit Assignment?</h2>
            <p className="text-sm">
              Answered: {answeredCount} / {session.questions.length}
            </p>
            <p className="text-sm">Unanswered: {session.questions.length - answeredCount}</p>
            <p className="text-xs text-ink-muted">You typically cannot edit answers after submit.</p>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                Continue Editing
              </Button>
              <Button onClick={submit}>Submit Assignment</Button>
            </div>
          </Surface>
        </div>
      ) : null}
    </div>
  );
}
