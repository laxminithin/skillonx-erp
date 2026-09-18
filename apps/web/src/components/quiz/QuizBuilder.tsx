import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Button, Field, Input, Modal, Select, Textarea } from '../ui';
import { QuizQuestionRenderer } from './QuizQuestionRenderer';
import { QUIZ_DIFFICULTY_LABELS, QUIZ_TYPE_LABELS, type QuizDetail, type QuizQuestion } from '../../types/quiz';

type BankItem = QuizQuestion & { moduleId: number; moduleName?: string; reviewStatus?: string };
type Module = { id: number; name: string; questionCount: number };

function SortableQuestion({
  question,
  index,
  locked,
  generated,
  moduleName,
  onRemove,
  onChangeMarks,
  onReplace,
  onChoose,
}: {
  question: QuizQuestion;
  index: number;
  locked: boolean;
  generated: boolean;
  moduleName?: string;
  onRemove: () => void;
  onChangeMarks: (marks: number) => void;
  onReplace: () => void;
  onChoose: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });
  const correct = question.options.find((o) => o.isCorrect);
  const letter = correct
    ? String.fromCharCode(65 + question.options.findIndex((o) => o === correct || o.id === correct.id))
    : null;
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="rounded-[var(--radius-md)] border border-border bg-surface p-4"
    >
      <div className="mb-3 flex items-start gap-2">
        {!locked ? (
          <button type="button" className="mt-1 text-ink-muted" {...attributes} {...listeners} aria-label="Reorder">
            <GripVertical size={16} />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-ink-muted">
            Question {index + 1}
            {moduleName ? ` · ${moduleName}` : ''}
            {question.difficulty ? ` · ${QUIZ_DIFFICULTY_LABELS[question.difficulty] || question.difficulty}` : ''}
            {question.primaryCoCode ? ` · ${question.primaryCoCode}` : ''}
            {` · ${question.marks} mark${Number(question.marks) === 1 ? '' : 's'}`}
          </p>
          <p className="mt-1 text-sm font-medium text-ink">{question.questionText}</p>
          {question.primaryCoCode || question.derivedOutcomes?.pos?.length ? (
            <p className="mt-1 text-xs text-ink-muted">
              {question.primaryCoCode ? `Primary CO: ${question.primaryCoCode}` : 'No primary CO'}
              {question.derivedOutcomes?.pos?.length
                ? ` · PO ${question.derivedOutcomes.pos.join(', ')}`
                : ''}
              {question.derivedOutcomes?.psos?.length
                ? ` · PSO ${question.derivedOutcomes.psos.join(', ')}`
                : ''}
              {question.derivedOutcomes?.sdgs?.length
                ? ` · SDG ${question.derivedOutcomes.sdgs.join(', ')}`
                : ''}
            </p>
          ) : null}
        </div>
        {!locked ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Input
              className="h-8 w-16"
              type="number"
              min={0.5}
              step={0.5}
              value={question.marks}
              onChange={(e) => onChangeMarks(Number(e.target.value))}
              aria-label="Marks"
            />
            {generated ? (
              <>
                <Button variant="secondary" size="sm" onClick={onReplace}>
                  Replace
                </Button>
                <Button variant="ghost" size="sm" onClick={onChoose}>
                  Choose
                </Button>
              </>
            ) : null}
            <Button variant="ghost" size="sm" onClick={onRemove} aria-label="Remove question">
              <Trash2 size={15} />
            </Button>
          </div>
        ) : null}
      </div>
      <QuizQuestionRenderer question={question} mode="preview" showCorrect />
      {correct ? (
        <p className="mt-2 text-xs text-ink-secondary">
          Correct Answer: {letter} — {correct.label}
        </p>
      ) : null}
    </div>
  );
}

export function QuizBuilder({
  quiz,
  onReload,
}: {
  quiz: QuizDetail;
  onReload: (quiz?: QuizDetail) => void;
}) {
  const locked = Boolean(quiz.structureLocked);
  const [open, setOpen] = useState<'new' | 'bank' | 'preview' | 'choose' | null>(null);
  const [chooseFor, setChooseFor] = useState<number | null>(null);
  const [replacements, setReplacements] = useState<BankItem[]>([]);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [bank, setBank] = useState<BankItem[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moduleFilter, setModuleFilter] = useState<number[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [form, setForm] = useState({
    questionText: '',
    questionType: 'SINGLE_CHOICE',
    marks: '1',
    explanation: '',
    numericAnswer: '',
    primaryCoCode: '',
    difficulty: 'EASY',
    options: [
      { label: '', isCorrect: true },
      { label: '', isCorrect: false },
      { label: '', isCorrect: false },
      { label: '', isCorrect: false },
    ],
  });
  const [courseOutcomes, setCourseOutcomes] = useState<Array<{ coCode: string; statement: string }>>([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    if (!quiz.courseId) return;
    api<{ modules: Module[] }>(`/api/quiz-bank/modules?courseId=${quiz.courseId}`).then((d) =>
      setModules(d.modules),
    );
    api<{ outcomes: Array<{ code?: string; coCode?: string; statement: string }> }>(
      `/api/copo/course-outcomes?courseId=${quiz.courseId}`,
    )
      .then((d) => {
        setCourseOutcomes(
          (d.outcomes || []).map((r) => ({
            coCode: String(r.coCode || r.code || '').toUpperCase(),
            statement: String(r.statement || ''),
          })).filter((r) => r.coCode),
        );
      })
      .catch(() => setCourseOutcomes([]));
  }, [quiz.courseId]);

  const loadBank = async () => {
    if (!quiz.courseId) return;
    const params = new URLSearchParams({ courseId: String(quiz.courseId), pageSize: '80', reviewStatus: 'APPROVED' });
    if (typeFilter) params.set('questionType', typeFilter);
    const d = await api<{ questions: BankItem[] }>(`/api/quiz-bank/questions?${params}`);
    const filtered = moduleFilter.length
      ? d.questions.filter((q) => moduleFilter.includes(q.moduleId))
      : d.questions;
    setBank(filtered);
  };

  useEffect(() => {
    if (open === 'bank') loadBank();
  }, [open, moduleFilter, typeFilter]);

  const totalMarks = useMemo(
    () => quiz.questions.reduce((sum, q) => sum + Number(q.marks), 0),
    [quiz.questions],
  );

  const generated = Boolean(
    quiz.randomSelection && typeof quiz.randomSelection === 'object' && (quiz.randomSelection as { mode?: string }).mode === 'GENERATED',
  );
  const mix = quiz.questions.reduce(
    (acc, q) => {
      const d = q.difficulty === 'MEDIUM' ? 'INTERMEDIATE' : q.difficulty === 'HARD' ? 'DIFFICULT' : q.difficulty;
      if (d === 'EASY') acc.easy += 1;
      else if (d === 'INTERMEDIATE') acc.intermediate += 1;
      else if (d === 'DIFFICULT') acc.difficult += 1;
      return acc;
    },
    { easy: 0, intermediate: 0, difficult: 0 },
  );

  const replaceAuto = async (questionId: number) => {
    const res = await api<{ quiz: QuizDetail }>(`/api/quizzes/${quiz.id}/questions/${questionId}/replace`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    onReload(res.quiz);
  };

  const openChoose = async (questionId: number) => {
    setChooseFor(questionId);
    const d = await api<{ questions: BankItem[] }>(
      `/api/quizzes/${quiz.id}/questions/${questionId}/replacements`,
    );
    setReplacements(d.questions);
    setOpen('choose');
  };

  const regenerate = async (confirmManualReplacements = false) => {
    try {
      const res = await api<{ quiz: QuizDetail }>(`/api/quizzes/${quiz.id}/regenerate`, {
        method: 'POST',
        body: JSON.stringify({ confirmManualReplacements }),
      });
      onReload(res.quiz);
      setConfirmRegen(false);
    } catch (err) {
      if (err instanceof Error && /replaced manually/i.test(err.message)) setConfirmRegen(true);
      else throw err;
    }
  };

  const persist = async (path: string, body?: unknown) => {
    const res = await api<{ quiz: QuizDetail }>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    onReload(res.quiz);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    if (locked || !event.over || event.active.id === event.over.id) return;
    const ids = quiz.questions.map((q) => q.id);
    const oldIndex = ids.indexOf(Number(event.active.id));
    const newIndex = ids.indexOf(Number(event.over.id));
    const next = arrayMove(quiz.questions, oldIndex, newIndex);
    await persist(`/api/quizzes/${quiz.id}/reorder`, {
      questions: next.map((q, i) => ({ id: q.id, sortOrder: i })),
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={locked} onClick={() => setOpen('bank')}>
            Add from Question Bank
          </Button>
          <Button size="sm" variant="secondary" disabled={locked} onClick={() => setOpen('new')}>
            <Plus size={14} /> Create new
          </Button>
          {generated && !locked ? (
            <Button size="sm" variant="tertiary" onClick={() => regenerate()}>
              Regenerate Questions
            </Button>
          ) : null}
          <Button size="sm" variant="tertiary" onClick={() => setOpen('preview')}>
            Preview
          </Button>
        </div>
        {generated ? (
          <div className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm">
            <p className="font-medium text-ink">Quiz ready</p>
            <p className="mt-1 text-ink-secondary">
              {quiz.questions.length} questions · {totalMarks} marks · {quiz.durationMinutes ?? '—'} minutes
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Easy {mix.easy} · Intermediate {mix.intermediate} · Difficult {mix.difficult}
            </p>
          </div>
        ) : null}
        {!quiz.questions.length ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-border p-8 text-center text-sm text-ink-muted">
            Add questions from the bank or create a new one.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={quiz.questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {quiz.questions.map((q, i) => (
                  <SortableQuestion
                    key={q.id}
                    question={q}
                    index={i}
                    locked={locked}
                    generated={generated}
                    moduleName={q.moduleName || modules.find((m) => m.id === q.moduleId)?.name}
                    onRemove={() =>
                      api(`/api/quizzes/${quiz.id}/questions/${q.id}`, { method: 'DELETE' }).then((r) =>
                        onReload((r as { quiz: QuizDetail }).quiz),
                      )
                    }
                    onChangeMarks={(marks) =>
                      api(`/api/quizzes/${quiz.id}/questions/${q.id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ marks }),
                      }).then((r) => onReload((r as { quiz: QuizDetail }).quiz))
                    }
                    onReplace={() => replaceAuto(q.id)}
                    onChoose={() => openChoose(q.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
      <aside className="space-y-3 rounded-[var(--radius-md)] border border-border bg-surface p-4">
        <p className="text-sm font-semibold text-ink">Quiz paper</p>
        <p className="text-sm text-ink-secondary">{quiz.questions.length} questions</p>
        <p className="text-sm text-ink-secondary">{totalMarks} total marks</p>
        <p className="text-sm text-ink-secondary">{quiz.durationMinutes ?? '—'} minutes</p>
        {quiz.academicCoverage ? (
          <div className="rounded-[var(--radius-md)] border border-border px-3 py-2 text-xs">
            <p className="font-semibold text-ink">Quiz Academic Coverage</p>
            <p className="mt-1 text-ink-muted">
              {Object.entries(quiz.academicCoverage.byCo)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([co, n]) => `${co}: ${n}`)
                .join(' · ') || 'No COs mapped yet'}
              {quiz.academicCoverage.unmapped
                ? ` · Unmapped: ${quiz.academicCoverage.unmapped}`
                : ''}
              {` · Total: ${quiz.academicCoverage.total}`}
            </p>
          </div>
        ) : null}
        {generated ? (
          <p className="text-xs text-ink-muted">
            Easy {mix.easy} · Intermediate {mix.intermediate} · Difficult {mix.difficult}
          </p>
        ) : null}
        {locked ? <p className="text-xs text-ink-muted">Structure is locked after students start.</p> : null}
        {quiz.effectiveStatus === 'DRAFT' && quiz.questions.length ? (
          <Button
            className="w-full"
            onClick={() =>
              api(`/api/quizzes/${quiz.id}/publish`, { method: 'POST' }).then((r) =>
                onReload((r as { quiz: QuizDetail }).quiz),
              )
            }
          >
            Publish Quiz
          </Button>
        ) : null}
      </aside>

      <Modal open={open === 'new'} onClose={() => setOpen(null)} title="New question">
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            await persist(`/api/quizzes/${quiz.id}/questions`, {
              questionText: form.questionText,
              questionType: form.questionType,
              marks: Number(form.marks) || 1,
              difficulty: form.difficulty || null,
              explanation: form.explanation || null,
              numericAnswer: form.numericAnswer ? Number(form.numericAnswer) : null,
              options: form.options.filter((o) => o.label.trim()),
              moduleId: quiz.moduleId,
              primaryCoCode: form.primaryCoCode,
            });
            setOpen(null);
          }}
        >
          <Field label="Question">
            <Textarea required value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} />
          </Field>
          <Field label="Primary CO">
            <Select
              required
              value={form.primaryCoCode}
              onChange={(e) => setForm({ ...form, primaryCoCode: e.target.value })}
            >
              <option value="">Select CO from subject master…</option>
              {courseOutcomes.map((co) => (
                <option key={co.coCode} value={co.coCode}>
                  {co.coCode} — {co.statement.slice(0, 80)}
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
          <Field label="Type">
            <Select value={form.questionType} onChange={(e) => setForm({ ...form, questionType: e.target.value })}>
              {Object.entries(QUIZ_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          {form.questionType === 'NUMERIC' ? (
            <Field label="Correct answer">
              <Input value={form.numericAnswer} onChange={(e) => setForm({ ...form, numericAnswer: e.target.value })} />
            </Field>
          ) : (
            form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="nq"
                  checked={opt.isCorrect}
                  onChange={() =>
                    setForm({ ...form, options: form.options.map((o, j) => ({ ...o, isCorrect: j === i })) })
                  }
                />
                <Input
                  value={opt.label}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      options: form.options.map((o, j) => (j === i ? { ...o, label: e.target.value } : o)),
                    })
                  }
                />
              </div>
            ))
          )}
          <Button type="submit">Add question</Button>
        </form>
      </Modal>

      <Modal open={open === 'bank'} onClose={() => setOpen(null)} title="Add from Question Bank">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {modules.map((m) => (
              <label key={m.id} className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={moduleFilter.includes(m.id)}
                  onChange={() =>
                    setModuleFilter((prev) =>
                      prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id],
                    )
                  }
                />
                {m.name}
              </label>
            ))}
          </div>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            {Object.entries(QUIZ_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {bank.map((item) => (
              <label key={item.id} className="flex items-start gap-2 rounded-[var(--radius-md)] border border-border p-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={() =>
                    setSelected((prev) =>
                      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id],
                    )
                  }
                />
                <span>
                  {item.questionText}
                  <span className="mt-0.5 block text-xs text-ink-muted">{item.moduleName}</span>
                </span>
              </label>
            ))}
          </div>
          <Button
            disabled={!selected.length}
            onClick={async () => {
              await persist(`/api/quizzes/${quiz.id}/questions/from-bank`, { bankQuestionIds: selected });
              setSelected([]);
              setOpen(null);
            }}
          >
            Add {selected.length || ''} selected
          </Button>
        </div>
      </Modal>

      <Modal open={open === 'preview'} onClose={() => setOpen(null)} title="Student preview">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-muted">Preview mode — no attempt is created</p>
        <div className="space-y-6">
          {quiz.questions.map((q, i) => (
            <div key={q.id}>
              <p className="mb-2 text-xs text-ink-muted">
                Question {i + 1} of {quiz.questions.length}
              </p>
              <p className="mb-3 text-sm font-medium">{q.questionText}</p>
              <QuizQuestionRenderer question={q} mode="preview" />
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={open === 'choose'} onClose={() => setOpen(null)} title="Replace from Question Bank">
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {replacements.map((item) => (
            <button
              key={item.id}
              type="button"
              className="block w-full rounded-[var(--radius-md)] border border-border p-3 text-left text-sm hover:bg-surface-muted"
              onClick={async () => {
                if (!chooseFor) return;
                const res = await api<{ quiz: QuizDetail }>(
                  `/api/quizzes/${quiz.id}/questions/${chooseFor}/replace`,
                  { method: 'POST', body: JSON.stringify({ bankQuestionId: item.id }) },
                );
                onReload(res.quiz);
                setOpen(null);
              }}
            >
              <p className="text-xs text-ink-muted">
                {item.moduleName} · {QUIZ_DIFFICULTY_LABELS[item.difficulty || ''] || item.difficulty}
              </p>
              <p className="mt-1 font-medium">{item.questionText}</p>
            </button>
          ))}
          {!replacements.length ? <p className="text-sm text-ink-muted">No unused eligible questions.</p> : null}
        </div>
      </Modal>

      {confirmRegen ? (
        <Modal open onClose={() => setConfirmRegen(false)} title="Regenerate questions?">
          <p className="text-sm text-ink-secondary">
            Some questions were replaced manually. Regenerating will discard those replacements and pick a new set
            using the same mix.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmRegen(false)}>
              Cancel
            </Button>
            <Button onClick={() => regenerate(true)}>Regenerate</Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
