import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Button, Field, Input, PageHeader, Surface, Textarea, useToast } from '../components/ui';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import {
  schemeFromQuestion,
  type AssignmentSubmissionDetail,
  type EvaluationScheme,
  type SchemeMarkCriterion,
} from '../types/assignment';

type CriterionDraft = { id: string; awarded: string; feedback: string };

type QuestionDraft = {
  snapshotQuestionId: string | number;
  criteria: CriterionDraft[];
  feedback: string;
};

function initDrafts(detail: AssignmentSubmissionDetail): QuestionDraft[] {
  return detail.questions.map((q) => {
    const scheme =
      schemeFromQuestion(q) ||
      ({
        criteria: [{ id: 'overall', label: 'Overall', maxMarks: Number(q.marks) || 0 }],
      } as EvaluationScheme);
    const existing = q.schemeMarks?.criteria as SchemeMarkCriterion[] | undefined;
    return {
      snapshotQuestionId: q.id,
      feedback: q.feedback || '',
      criteria: scheme.criteria.map((c) => {
        const prior = existing?.find((x) => x.id === c.id);
        return {
          id: c.id,
          awarded: prior != null ? String(prior.awarded) : '',
          feedback: prior?.feedback || '',
        };
      }),
    };
  });
}

function parseAwarded(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function mapEvalError(e: unknown): string {
  if (!(e instanceof Error)) return 'Evaluation failed';
  const err = e as Error & { code?: string; details?: { questionIds?: Array<string | number> } };
  switch (err.code) {
    case 'ASSIGNMENT_EVALUATION_INCOMPLETE': {
      const n = err.details?.questionIds?.length;
      return n === 1
        ? '1 question still requires evaluation.'
        : n
          ? `${n} questions still require evaluation.`
          : err.message;
    }
    case 'ASSIGNMENT_EVALUATION_NOT_FINALIZED':
      return 'Finalize the evaluation before releasing the result.';
    case 'ASSIGNMENT_RESULT_ALREADY_RELEASED':
      return 'Result already released.';
    case 'ASSIGNMENT_CRITERION_MARKS_INVALID':
    case 'ASSIGNMENT_MARKS_OUT_OF_RANGE':
    case 'ASSIGNMENT_SCHEME_TOTAL_MISMATCH':
    case 'ASSIGNMENT_SNAPSHOT_EMPTY':
    case 'ASSIGNMENT_EVALUATION_INVALID':
    case 'ASSIGNMENT_EVALUATION_EMPTY':
      return err.message;
    default:
      return err.message || 'Evaluation failed';
  }
}

export function AssignmentSubmissionEvalPage() {
  const { id, submissionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [detail, setDetail] = useState<AssignmentSubmissionDetail | null>(null);
  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [overallFeedback, setOverallFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [focusQuestionIdx, setFocusQuestionIdx] = useState<number | null>(null);

  const token = decodeURIComponent(submissionId || '');

  useEffect(() => {
    if (!id || !token) return;
    api<AssignmentSubmissionDetail>(`/api/assignments/${id}/submissions/${encodeURIComponent(token)}`)
      .then((d) => {
        const payload = (d as unknown as { submission?: AssignmentSubmissionDetail }).submission || d;
        setDetail(payload);
        setDrafts(initDrafts(payload));
        setOverallFeedback(payload.overallFeedback || '');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [id, token]);

  useDocumentTitle(detail ? `Evaluate · ${detail.studentName}` : 'Evaluate submission');

  const readiness = useMemo(() => {
    if (!detail) {
      return {
        awarded: 0,
        max: 0,
        evaluatedCount: 0,
        totalQuestions: 0,
        incompleteIdx: [] as number[],
        schemeOk: true,
        schemeIssues: [] as string[],
        ready: false,
      };
    }
    let awarded = 0;
    let max = 0;
    const incompleteIdx: number[] = [];
    const schemeIssues: string[] = [];

    detail.questions.forEach((q, i) => {
      const qMax = Number(q.marks) || 0;
      max += qMax;
      const draft = drafts[i];
      const scheme =
        schemeFromQuestion(q) ||
        ({
          criteria: [{ id: 'overall', label: 'Overall', maxMarks: qMax }],
        } as EvaluationScheme);

      const schemeMax = scheme.criteria.reduce((s, c) => s + Number(c.maxMarks), 0);
      if (Math.abs(schemeMax - qMax) > 0.01) {
        schemeIssues.push(
          `Question ${i + 1}: scheme totals ${schemeMax} but question is worth ${qMax}.`,
        );
      }

      if (!draft) {
        incompleteIdx.push(i);
        return;
      }

      let qAwarded = 0;
      let missing = false;
      for (let ci = 0; ci < scheme.criteria.length; ci++) {
        const c = scheme.criteria[ci];
        const row = draft.criteria[ci];
        const val = parseAwarded(row?.awarded ?? '');
        if (val == null) {
          missing = true;
          continue;
        }
        if (val < 0 || val > Number(c.maxMarks) + 1e-9) {
          schemeIssues.push(
            `Question ${i + 1}: "${c.label}" has ${val} marks but maximum is ${c.maxMarks}.`,
          );
        }
        qAwarded += val;
      }
      if (missing) incompleteIdx.push(i);
      else awarded += qAwarded;
    });

    return {
      awarded: Math.round(awarded * 100) / 100,
      max,
      evaluatedCount: detail.questions.length - incompleteIdx.length,
      totalQuestions: detail.questions.length,
      incompleteIdx,
      schemeOk: schemeIssues.length === 0,
      schemeIssues,
      ready: incompleteIdx.length === 0 && schemeIssues.length === 0 && detail.questions.length > 0,
    };
  }, [detail, drafts]);

  const buildBody = (mode: 'DRAFT' | 'FINALIZE' | 'RELEASE') => ({
    mode,
    releaseResults: false,
    overallFeedback: overallFeedback || null,
    questions:
      mode === 'RELEASE'
        ? []
        : drafts.map((d) => ({
            snapshotQuestionId: d.snapshotQuestionId,
            feedback: d.feedback || null,
            criteria: d.criteria.map((c) => ({
              id: c.id,
              // Explicit 0 is valid; blank becomes 0 only for draft saves of filled rows.
              awarded: parseAwarded(c.awarded) ?? 0,
              feedback: c.feedback || null,
            })),
          })),
  });

  const save = async (mode: 'DRAFT' | 'FINALIZE' | 'RELEASE') => {
    if (!detail || !id) return;
    if (mode === 'FINALIZE' && !readiness.ready) {
      const first = readiness.incompleteIdx[0];
      if (first != null) setFocusQuestionIdx(first);
      toast(
        readiness.incompleteIdx.length
          ? `${readiness.incompleteIdx.length} question${readiness.incompleteIdx.length === 1 ? '' : 's'} still require marks.`
          : readiness.schemeIssues[0] || 'Evaluation is not ready to finalize.',
        'error',
      );
      return;
    }
    if (mode === 'RELEASE' && detail.evaluationStatus !== 'EVALUATED' && detail.evaluationStatus !== 'RELEASED') {
      toast('Finalize the evaluation before releasing the result.', 'error');
      return;
    }
    setBusy(true);
    try {
      const res = await api<AssignmentSubmissionDetail>(
        mode === 'RELEASE'
          ? `/api/assignments/${id}/submissions/${encodeURIComponent(token)}/release-results`
          : `/api/assignments/${id}/submissions/${encodeURIComponent(token)}/evaluate`,
        {
          method: 'POST',
          body: mode === 'RELEASE' ? undefined : JSON.stringify(buildBody(mode)),
        },
      );
      const payload = (res as unknown as { submission?: AssignmentSubmissionDetail }).submission || res;
      setDetail(payload);
      setDrafts(initDrafts(payload));
      if (mode === 'RELEASE') toast('Result released');
      else if (mode === 'FINALIZE') toast('Evaluation finalized');
      else toast('Draft evaluation saved');
    } catch (e) {
      toast(mapEvalError(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-3 p-4">
        <p className="text-sm text-danger">{error}</p>
        <Link to={`/assignments/${id}?tab=submissions`} className="text-sm text-accent">
          Back to submissions
        </Link>
      </div>
    );
  }

  if (!detail) return <p className="p-6 text-sm text-ink-muted">Loading submission…</p>;

  const isFinalized = detail.evaluationStatus === 'EVALUATED' || detail.evaluationStatus === 'RELEASED';
  const isReleased = detail.resultsReleased || detail.evaluationStatus === 'RELEASED';
  const percentage =
    detail.percentage != null
      ? detail.percentage
      : readiness.max > 0
        ? Math.round((readiness.awarded / readiness.max) * 10000) / 100
        : 0;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title={detail.studentName}
        subtitle={`${detail.usn || ''} · ${detail.status}${detail.isLate ? ' · LATE' : ''} · ${detail.evaluationStatus}`}
        breadcrumb={
          <Link to={`/assignments/${id}?tab=submissions`}>Submissions</Link>
        }
        actions={
          <Button variant="secondary" onClick={() => navigate(`/assignments/${id}?tab=submissions`)}>
            Back
          </Button>
        }
      />

      <Surface className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Evaluation readiness
        </p>
        <ul className="space-y-1 text-sm">
          <li>
            Questions {readiness.evaluatedCount} / {readiness.totalQuestions} evaluated
            {readiness.incompleteIdx.length === 0 && readiness.totalQuestions > 0 ? ' ✓' : ''}
          </li>
          <li>
            Scheme totals {readiness.schemeOk ? 'Valid ✓' : 'Issues'}
          </li>
          <li className="tabular-nums">
            Marks {readiness.awarded} / {readiness.max}
            {readiness.ready ? ' ✓' : ''}
          </li>
          <li>Overall feedback Optional</li>
          <li>
            {readiness.ready ? 'Ready to finalize ✓' : 'Not ready to finalize'}
          </li>
        </ul>
        {readiness.incompleteIdx.length > 0 ? (
          <p className="text-sm text-danger">
            {readiness.incompleteIdx.length === 1
              ? '1 question still requires marks.'
              : `${readiness.incompleteIdx.length} questions still require marks.`}{' '}
            <button
              type="button"
              className="text-accent underline"
              onClick={() => setFocusQuestionIdx(readiness.incompleteIdx[0] ?? null)}
            >
              Go to Question {(readiness.incompleteIdx[0] ?? 0) + 1}
            </button>
          </p>
        ) : null}
        {readiness.schemeIssues.length > 0 ? (
          <ul className="space-y-1 text-sm text-danger">
            {readiness.schemeIssues.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        ) : null}
        {!detail.questions.length ? (
          <p className="text-sm text-danger">
            This submission has no questions in its snapshot. Re-publish the assignment or ask the
            student to start a new attempt.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="secondary" disabled={busy} onClick={() => save('DRAFT')}>
            Save draft
          </Button>
          <Button disabled={busy || !readiness.ready} onClick={() => save('FINALIZE')}>
            Finalize evaluation
          </Button>
        </div>
      </Surface>

      {isFinalized ? (
        <Surface className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Result release
          </p>
          <ul className="space-y-1 text-sm">
            <li>Evaluation Finalized ✓</li>
            <li className="tabular-nums">
              Marks {detail.obtainedMarks ?? readiness.awarded} / {detail.totalMarks ?? readiness.max}
            </li>
            <li className="tabular-nums">Percentage {percentage}%</li>
            <li>Feedback {detail.overallFeedback ? 'Available' : 'Optional / empty'}</li>
            <li>Solution release Not included (separate action)</li>
            <li>{isReleased ? 'Result released ✓' : 'Result not yet released'}</li>
          </ul>
          <Button disabled={busy || isReleased} onClick={() => save('RELEASE')}>
            {isReleased ? 'Result released' : 'Release result'}
          </Button>
        </Surface>
      ) : null}

      {detail.questions.map((q, idx) => {
        const scheme =
          schemeFromQuestion(q) ||
          ({
            criteria: [{ id: 'overall', label: 'Overall', maxMarks: Number(q.marks) || 0 }],
          } as EvaluationScheme);
        const draft = drafts[idx];
        if (!draft) return null;
        const qAwarded = draft.criteria.reduce((s, c) => {
          const v = parseAwarded(c.awarded);
          return s + (v ?? 0);
        }, 0);
        const highlight = focusQuestionIdx === idx;
        return (
          <div
            key={String(q.id)}
            id={`eval-q-${idx}`}
            ref={
              highlight
                ? (el) => {
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                : undefined
            }
          >
          <Surface
            className={`space-y-3 ${highlight ? 'ring-2 ring-accent' : ''}`}
          >
            <div>
              <p className="text-sm font-semibold">
                Q{idx + 1} · {q.marks} marks · {q.primaryCoCode || '—'}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{q.questionText}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Student answer</p>
              <pre className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap rounded bg-surface-muted/50 p-3 font-sans text-sm">
                {q.textAnswer || '(no answer)'}
              </pre>
              {q.wordCount != null ? (
                <p className="mt-1 text-xs text-ink-muted">{q.wordCount} words</p>
              ) : null}
            </div>
            {(q.expectedAnswerGuidance || q.modelSolution) && (
              <details className="text-xs text-ink-muted">
                <summary className="cursor-pointer">Model solution / key points</summary>
                <pre className="mt-1 whitespace-pre-wrap font-sans">
                  {q.expectedAnswerGuidance || q.modelSolution}
                </pre>
              </details>
            )}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Criterion marks · total {qAwarded} / {q.marks} (calculated)
              </p>
              {scheme.criteria.map((c, ci) => {
                const row = draft.criteria[ci];
                return (
                  <div key={c.id} className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_100px]">
                    <div>
                      <p className="text-sm font-medium">
                        {c.label}{' '}
                        <span className="font-normal text-ink-muted">(max {c.maxMarks})</span>
                      </p>
                      {c.guidance ? <p className="text-xs text-ink-muted">{c.guidance}</p> : null}
                      <Input
                        className="mt-2"
                        placeholder="Criterion feedback (optional)"
                        value={row?.feedback || ''}
                        onChange={(e) => {
                          const next = [...drafts];
                          const criteria = [...next[idx].criteria];
                          criteria[ci] = { ...criteria[ci], feedback: e.target.value };
                          next[idx] = { ...next[idx], criteria };
                          setDrafts(next);
                        }}
                      />
                    </div>
                    <Field label="Marks">
                      <Input
                        type="number"
                        min={0}
                        max={c.maxMarks}
                        step={0.5}
                        value={row?.awarded ?? ''}
                        onChange={(e) => {
                          const next = [...drafts];
                          const criteria = [...next[idx].criteria];
                          criteria[ci] = { ...criteria[ci], awarded: e.target.value };
                          next[idx] = { ...next[idx], criteria };
                          setDrafts(next);
                        }}
                      />
                    </Field>
                  </div>
                );
              })}
              <Field label="Question feedback (optional)">
                <Textarea
                  value={draft.feedback}
                  onChange={(e) => {
                    const next = [...drafts];
                    next[idx] = { ...next[idx], feedback: e.target.value };
                    setDrafts(next);
                  }}
                />
              </Field>
            </div>
          </Surface>
          </div>
        );
      })}

      <Surface className="space-y-2">
        <Field label="Overall feedback (optional)">
          <Textarea value={overallFeedback} onChange={(e) => setOverallFeedback(e.target.value)} />
        </Field>
      </Surface>
    </div>
  );
}
