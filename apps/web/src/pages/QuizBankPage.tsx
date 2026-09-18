import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import {
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Surface,
  Textarea,
  useToast,
} from '../components/ui';
import { QuizQuestionRenderer } from '../components/quiz/QuizQuestionRenderer';
import { QUIZ_DIFFICULTY_LABELS, QUIZ_TYPE_LABELS, type QuizQuestion } from '../types/quiz';

type DifficultyCounts = {
  easy: number;
  intermediate: number;
  difficult: number;
  needsReview: number;
  approved?: number;
  total?: number;
};

type Subject = {
  courseId: number;
  courseName: string;
  courseCode: string;
  questionCount: number;
  easy?: number;
  intermediate?: number;
  difficult?: number;
  needsReview?: number;
  modules: Array<{
    id: number;
    name: string;
    questionCount: number;
    courseId: number;
    difficultyCounts?: DifficultyCounts;
  }>;
};

type BankQuestion = QuizQuestion & {
  courseId: number;
  moduleId: number;
  reviewStatus: string;
  reviewNotes?: string | null;
  courseName?: string;
  moduleName?: string;
  sourceFile?: string | null;
  sourceReference?: string | null;
  originalDifficulty?: string | null;
  importBatch?: string | null;
  primaryCoCode?: string | null;
  verificationStatus?: string | null;
  mappingBasis?: string | null;
  derivedOutcomes?: unknown;
  coMappingBlocked?: boolean;
};

const emptyQuestion = {
  questionText: '',
  questionType: 'SINGLE_CHOICE',
  marks: '1',
  difficulty: 'EASY',
  explanation: '',
  numericAnswer: '',
  numericTolerance: '0',
  primaryCoCode: '',
  options: [
    { label: '', isCorrect: false },
    { label: '', isCorrect: false },
    { label: '', isCorrect: false },
    { label: '', isCorrect: false },
  ],
};

const DIFF_TABS = ['', 'EASY', 'INTERMEDIATE', 'DIFFICULT'] as const;

export function QuizBankPage() {
  const { toast } = useToast();
  const [overview, setOverview] = useState<{ subjects: Subject[] } | null>(null);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [moduleId, setModuleId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [coCode, setCoCode] = useState('');
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);
  const [needsCoReview, setNeedsCoReview] = useState(false);
  const [courseOutcomes, setCourseOutcomes] = useState<Array<{ code: string; statement: string }>>([]);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [modal, setModal] = useState<'question' | 'module' | 'import' | null>(null);
  const [form, setForm] = useState(emptyQuestion);
  const [moduleName, setModuleName] = useState('');
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [importReport, setImportReport] = useState<{
    subjectsFound: number;
    questionsDiscovered: number;
    validated: number;
    imported: number;
    needsReview: number;
    duplicates: number;
    missingAnswer: number;
    malformed: number;
    unmatchedSubjects: string[];
    createdSubjects: string[];
    subjects: Array<{
      subject: string;
      mapping: string;
      modules: Array<{
        name: string;
        easy: number;
        intermediate: number;
        difficult: number;
        needsReview: number;
        imported: number;
      }>;
    }>;
  } | null>(null);

  const selectedSubject = overview?.subjects.find((s) => s.courseId === courseId);
  const selectedModule = selectedSubject?.modules.find((m) => m.id === moduleId);

  const loadOverview = () =>
    api<{ subjects: Subject[] }>('/api/quiz-bank/overview')
      .then((data) => {
        setOverview(data);
        if (!courseId && data.subjects[0]) setCourseId(data.subjects[0].courseId);
      })
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));

  const loadQuestions = () => {
    if (!courseId) return;
    const params = new URLSearchParams({ courseId: String(courseId), pageSize: '250' });
    if (moduleId) params.set('moduleId', String(moduleId));
    if (q) params.set('q', q);
    if (type) params.set('questionType', type);
    if (difficulty) params.set('difficulty', difficulty);
    if (coCode) params.set('coCode', coCode);
    if (needsReviewOnly) params.set('reviewStatus', 'NEEDS_REVIEW');
    if (needsCoReview) params.set('needsCoReview', '1');
    api<{ questions: BankQuestion[] }>(`/api/quiz-bank/questions?${params}`)
      .then((d) => setQuestions(d.questions))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (!courseId) {
      setCourseOutcomes([]);
      return;
    }
    api<{ outcomes: Array<{ code: string; statement: string }> }>(
      `/api/copo/course-outcomes?courseId=${courseId}`,
    )
      .then((d) => setCourseOutcomes(d.outcomes || []))
      .catch(() => setCourseOutcomes([]));
  }, [courseId]);

  useEffect(() => {
    loadQuestions();
  }, [courseId, moduleId, q, type, difficulty, coCode, needsReviewOnly, needsCoReview]);

  const saveQuestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!courseId || !moduleId) {
      toast('Select a subject and module first', 'error');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        courseId,
        moduleId,
        questionText: form.questionText,
        questionType: form.questionType,
        marks: Number(form.marks) || 1,
        difficulty: form.difficulty || null,
        explanation: form.explanation || null,
        numericAnswer: form.numericAnswer ? Number(form.numericAnswer) : null,
        numericTolerance: form.numericTolerance ? Number(form.numericTolerance) : 0,
        primaryCoCode: form.primaryCoCode || null,
        options:
          form.questionType === 'NUMERIC' || form.questionType === 'SHORT_ANSWER'
            ? []
            : form.options.filter((o) => o.label.trim()),
      };
      if (editId) {
        await api(`/api/quiz-bank/questions/${editId}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/api/quiz-bank/questions', { method: 'POST', body: JSON.stringify(payload) });
      }
      setModal(null);
      setEditId(null);
      setForm(emptyQuestion);
      loadOverview();
      loadQuestions();
      toast(editId ? 'Question updated' : 'Question added');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save', 'error');
    } finally {
      setBusy(false);
    }
  };

  const addModule = async (e: FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    setBusy(true);
    try {
      await api('/api/quiz-bank/modules', {
        method: 'POST',
        body: JSON.stringify({ courseId, name: moduleName }),
      });
      setModal(null);
      setModuleName('');
      loadOverview();
      toast('Module created');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create module', 'error');
    } finally {
      setBusy(false);
    }
  };

  const runImport = async (dryRun = false) => {
    setBusy(true);
    try {
      const report = await api<NonNullable<typeof importReport>>('/api/quiz-bank/import/apply', {
        method: 'POST',
        body: JSON.stringify({ createMissingSubjects: true, dryRun }),
      });
      setImportReport(report);
      setModal('import');
      if (!dryRun) {
        loadOverview();
        loadQuestions();
        toast(`Imported ${report.imported} questions`);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Import failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const filteredQuestions = useMemo(() => questions, [questions]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Question Bank"
        subtitle="Academic questions organised by Subject → Module → Difficulty → CO."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => runImport(false)} disabled={busy}>
              Import public files
            </Button>
            <Button
              onClick={() => {
                setEditId(null);
                setForm(emptyQuestion);
                setModal('question');
              }}
            >
              Add Question
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex gap-1 border-b border-border">
        <span className="border-b-2 border-accent px-3 py-2 text-sm font-medium text-ink">Quiz</span>
        <Link
          to="/assignments/bank"
          className="px-3 py-2 text-sm text-ink-muted hover:text-ink"
        >
          Assignment
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1">
          <Field label="Subject">
            <Select
              value={courseId ?? ''}
              onChange={(e) => {
                setCourseId(e.target.value ? Number(e.target.value) : null);
                setModuleId(null);
              }}
            >
              <option value="">Select subject</option>
              {overview?.subjects.map((s) => (
                <option key={s.courseId} value={s.courseId}>
                  {s.courseName}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Button
          variant={needsReviewOnly ? 'primary' : 'secondary'}
          onClick={() => {
            setNeedsReviewOnly((v) => !v);
            setModuleId(null);
          }}
        >
          Needs Review{selectedSubject?.needsReview ? ` (${selectedSubject.needsReview})` : ''}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setModal('module')} disabled={!courseId}>
          + Module
        </Button>
      </div>

      {selectedSubject && !moduleId && !needsReviewOnly ? (
        <div className="grid gap-4 md:grid-cols-2">
          {selectedSubject.modules.map((m) => {
            const c = m.difficultyCounts;
            return (
              <Surface key={m.id}>
                <p className="text-sm font-semibold text-ink">{m.name}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{m.questionCount} questions</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-ink-muted">Easy</p>
                    <p className="font-medium tabular-nums">{c?.easy ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">Intermediate</p>
                    <p className="font-medium tabular-nums">{c?.intermediate ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">Difficult</p>
                    <p className="font-medium tabular-nums">{c?.difficult ?? 0}</p>
                  </div>
                </div>
                {c?.needsReview ? (
                  <p className="mt-2 text-xs text-danger">{c.needsReview} need review</p>
                ) : null}
                <Button className="mt-4" size="sm" onClick={() => setModuleId(m.id)}>
                  View Questions
                </Button>
              </Surface>
            );
          })}
          {!selectedSubject.modules.length ? (
            <EmptyState title="No modules" body="Add a module for this subject, then import questions." />
          ) : null}
        </div>
      ) : null}

      {(moduleId || needsReviewOnly) && selectedSubject ? (
        <div>
          {moduleId ? (
            <button type="button" className="mb-3 text-sm text-accent" onClick={() => setModuleId(null)}>
              ← {selectedSubject.courseName}
            </button>
          ) : null}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-muted">{selectedSubject.courseName}</p>
              <h2 className="text-lg font-semibold">{needsReviewOnly ? 'Needs Review' : selectedModule?.name}</h2>
            </div>
          </div>
          {!needsReviewOnly ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {DIFF_TABS.map((tab) => (
                <button
                  key={tab || 'all'}
                  type="button"
                  onClick={() => setDifficulty(tab)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    difficulty === tab ? 'bg-ink text-white' : 'bg-surface-muted text-ink-secondary'
                  }`}
                >
                  {tab ? QUIZ_DIFFICULTY_LABELS[tab] : 'All'}
                </button>
              ))}
              <Select
                className="h-8 w-40 text-xs"
                value={coCode}
                onChange={(e) => setCoCode(e.target.value)}
              >
                <option value="">All COs</option>
                {courseOutcomes.map((co) => (
                  <option key={co.code} value={co.code}>
                    {co.code}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                onClick={() => setNeedsCoReview((v) => !v)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  needsCoReview ? 'bg-ink text-white' : 'bg-surface-muted text-ink-secondary'
                }`}
              >
                Needs CO review
              </button>
            </div>
          ) : null}
          <div className="mb-3 flex gap-2">
            <Input placeholder="Search questions…" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={type} onChange={(e) => setType(e.target.value)} className="w-48">
              <option value="">All types</option>
              {Object.entries(QUIZ_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          {!filteredQuestions.length ? (
            <EmptyState
              title={needsReviewOnly ? 'No questions need review' : 'Question Bank empty'}
              body={
                needsReviewOnly
                  ? 'All imported questions in this view have verified answer keys.'
                  : 'No questions have been added for this module yet.'
              }
            />
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((item) => {
                const correct = item.options.find((o) => o.isCorrect);
                const letter = correct
                  ? String.fromCharCode(65 + item.options.findIndex((o) => o.id === correct.id || o === correct))
                  : null;
                return (
                  <Surface key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                          {QUIZ_DIFFICULTY_LABELS[item.difficulty || ''] || 'Unspecified'}
                          {item.moduleName ? ` · ${item.moduleName}` : ''}
                          {item.primaryCoCode ? ` · ${item.primaryCoCode}` : ' · No CO'}
                          {item.verificationStatus ? ` · ${item.verificationStatus}` : ''}
                          {` · ${item.marks} mark${Number(item.marks) === 1 ? '' : 's'}`}
                          {item.reviewStatus === 'NEEDS_REVIEW' ? ' · Needs review' : ''}
                        </p>
                        <p className="mt-1 text-sm font-medium text-ink">{item.questionText}</p>
                        {item.reviewNotes ? <p className="mt-1 text-xs text-danger">{item.reviewNotes}</p> : null}
                      </div>
                      <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDetailId(item.id)}
                      >
                        Detail
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditId(item.id);
                          setModuleId(item.moduleId);
                          setForm({
                            questionText: item.questionText,
                            questionType: item.questionType,
                            marks: String(item.marks),
                            difficulty: item.difficulty || 'EASY',
                            explanation: item.explanation || '',
                            numericAnswer: item.numericAnswer != null ? String(item.numericAnswer) : '',
                            numericTolerance:
                              item.numericTolerance != null ? String(item.numericTolerance) : '0',
                            primaryCoCode: item.primaryCoCode || '',
                            options: item.options.length
                              ? item.options.map((o) => ({ label: o.label, isCorrect: !!o.isCorrect }))
                              : emptyQuestion.options,
                          });
                          setModal('question');
                        }}
                      >
                        Edit
                      </Button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <QuizQuestionRenderer question={item} mode="preview" showCorrect />
                    </div>
                    {correct ? (
                      <p className="mt-2 text-xs text-ink-secondary">
                        Correct Answer: {letter} — {correct.label}
                      </p>
                    ) : null}
                  </Surface>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {!selectedSubject ? (
        <EmptyState title="Select a subject" body="Imported academic questions appear here by module." />
      ) : null}

      <Modal
        open={modal === 'question'}
        onClose={() => setModal(null)}
        title={editId ? 'Edit question' : 'Add question'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button form="bank-q" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <form id="bank-q" onSubmit={saveQuestion} className="space-y-3">
          <Field label="Question">
            <Textarea required value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select
                value={form.questionType}
                onChange={(e) => setForm({ ...form, questionType: e.target.value })}
              >
                {Object.entries(QUIZ_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Difficulty">
              <Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option value="EASY">Easy</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="DIFFICULT">Difficult</option>
              </Select>
            </Field>
          </div>
          <Field label="Primary CO">
            <Select
              required
              value={form.primaryCoCode}
              onChange={(e) => setForm({ ...form, primaryCoCode: e.target.value })}
            >
              <option value="">Select from subject CO master…</option>
              {courseOutcomes.map((co) => (
                <option key={co.code} value={co.code}>
                  {co.code} — {co.statement.slice(0, 80)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Marks">
            <Input value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} />
          </Field>
          {form.questionType === 'NUMERIC' ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Correct answer">
                <Input
                  value={form.numericAnswer}
                  onChange={(e) => setForm({ ...form, numericAnswer: e.target.value })}
                />
              </Field>
              <Field label="Tolerance">
                <Input
                  value={form.numericTolerance}
                  onChange={(e) => setForm({ ...form, numericTolerance: e.target.value })}
                />
              </Field>
            </div>
          ) : form.questionType !== 'SHORT_ANSWER' ? (
            <div className="space-y-2">
              <p className="text-[13px] font-medium text-ink-secondary">Options and correct answer</p>
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type={form.questionType === 'MULTIPLE_SELECT' ? 'checkbox' : 'radio'}
                    name="correct"
                    checked={opt.isCorrect}
                    onChange={() =>
                      setForm({
                        ...form,
                        options: form.options.map((o, j) =>
                          form.questionType === 'MULTIPLE_SELECT'
                            ? j === i
                              ? { ...o, isCorrect: !o.isCorrect }
                              : o
                            : { ...o, isCorrect: j === i },
                        ),
                      })
                    }
                    aria-label={`Mark option ${i + 1} correct`}
                  />
                  <Input
                    value={opt.label}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        options: form.options.map((o, j) => (j === i ? { ...o, label: e.target.value } : o)),
                      })
                    }
                  />
                </div>
              ))}
            </div>
          ) : null}
          <Field label="Explanation" optional>
            <Textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={modal === 'module'}
        onClose={() => setModal(null)}
        title="Add module"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>
              Close
            </Button>
            <Button form="mod" type="submit" disabled={busy}>
              Create
            </Button>
          </>
        }
      >
        <form id="mod" onSubmit={addModule}>
          <Field label="Module name">
            <Input required value={moduleName} onChange={(e) => setModuleName(e.target.value)} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={modal === 'import'}
        onClose={() => setModal(null)}
        title="Question Bank import report"
        footer={
          <Button variant="secondary" onClick={() => setModal(null)}>
            Close
          </Button>
        }
      >
        {importReport ? (
          <div className="max-h-[70vh] space-y-3 overflow-y-auto text-sm">
            <p>
              Discovered {importReport.questionsDiscovered} · Validated {importReport.validated} · Imported{' '}
              {importReport.imported} · Needs review {importReport.needsReview} · Duplicates {importReport.duplicates}
            </p>
            <p>
              Missing answer {importReport.missingAnswer} · Malformed {importReport.malformed}
            </p>
            {importReport.createdSubjects.length ? (
              <p>Created subjects: {importReport.createdSubjects.join(', ')}</p>
            ) : null}
            {importReport.unmatchedSubjects.length ? (
              <p className="text-danger">Unmatched subjects: {importReport.unmatchedSubjects.join(', ')}</p>
            ) : null}
            {importReport.subjects.map((s) => (
              <div key={s.subject} className="rounded-[var(--radius-md)] border border-border p-3">
                <p className="font-medium">
                  {s.subject} <span className="text-xs font-normal text-ink-muted">({s.mapping})</span>
                </p>
                {s.modules.map((m) => (
                  <p key={m.name} className="mt-1 text-xs text-ink-secondary">
                    {m.name}: Easy {m.easy} · Intermediate {m.intermediate} · Difficult {m.difficult} · Needs review{' '}
                    {m.needsReview} · Imported {m.imported}
                  </p>
                ))}
              </div>
            ))}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={detailId != null}
        onClose={() => setDetailId(null)}
        title="Question academic mapping"
        footer={
          <Button variant="secondary" onClick={() => setDetailId(null)}>
            Close
          </Button>
        }
      >
        {detailId != null ? (
          <BankQuestionDetail id={detailId} />
        ) : null}
      </Modal>
    </div>
  );
}

function BankQuestionDetail({ id }: { id: number }) {
  const [q, setQ] = useState<BankQuestion | null>(null);
  useEffect(() => {
    api<{ question: BankQuestion & { coStatement?: string | null; derivedOutcomes?: { pos?: Array<{ code: string }>; psos?: Array<{ code: string }>; sdgs?: Array<{ code: string }> } } }>(
      `/api/quiz-bank/questions/${id}`,
    )
      .then((d) => setQ(d.question as BankQuestion))
      .catch(() => setQ(null));
  }, [id]);
  if (!q) return <p className="text-sm text-ink-muted">Loading…</p>;
  const derived = q.derivedOutcomes as
    | { pos?: Array<{ code?: string } | string>; psos?: Array<{ code?: string } | string>; sdgs?: Array<{ code?: string } | string>; mappingVersionId?: number }
    | null
    | undefined;
  const codes = (arr?: Array<{ code?: string } | string>) =>
    (arr || [])
      .map((x) => (typeof x === 'string' ? x : x.code))
      .filter(Boolean)
      .join(', ') || '—';
  return (
    <div className="space-y-3 text-sm">
      <p className="font-medium text-ink">{q.questionText}</p>
      <p className="text-xs text-ink-muted">
        {q.moduleName} · {q.difficulty} · {q.primaryCoCode || 'No CO'} · {q.verificationStatus || '—'}
      </p>
      <p>
        <span className="font-medium">Primary CO:</span> {q.primaryCoCode || '—'}
        {(q as { coStatement?: string }).coStatement
          ? ` — ${(q as { coStatement?: string }).coStatement}`
          : ''}
      </p>
      <p>
        <span className="font-medium">Derived PO:</span> {codes(derived?.pos as Array<{ code?: string } | string>)}
      </p>
      <p>
        <span className="font-medium">Derived PSO:</span> {codes(derived?.psos as Array<{ code?: string } | string>)}
      </p>
      <p>
        <span className="font-medium">Derived SDG:</span> {codes(derived?.sdgs as Array<{ code?: string } | string>)}
      </p>
      <p>
        <span className="font-medium">Mapping source:</span> {q.mappingBasis || '—'} / {(q as { mappingSource?: string }).mappingSource || '—'}
      </p>
      <p>
        <span className="font-medium">Academic mapping version:</span>{' '}
        {derived && 'mappingVersionId' in derived ? String(derived.mappingVersionId ?? '—') : '—'}
      </p>
    </div>
  );
}
