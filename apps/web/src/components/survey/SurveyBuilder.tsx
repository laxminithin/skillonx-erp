import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Copy,
  GripVertical,
  Library,
  Plus,
  Smartphone,
  Trash2,
  X,
  Star,
  Smile,
  Hash,
  ListOrdered,
  CircleDot,
  CheckSquare,
  ToggleLeft,
  Type,
  AlignLeft,
  ChevronDown,
} from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import { Button, Field, Input, SaveIndicator, Select, Textarea } from '../ui';
import { QuestionRenderer } from '../questions/QuestionRenderer';
import {
  QUESTION_TYPE_LABELS,
  type SurveyDetail,
  type SurveyQuestion,
  type SurveySection,
} from '../../types/survey';

const QUESTION_TYPE_GROUPS = [
  {
    label: 'Ratings',
    items: [
      { value: 'STAR_RATING', label: 'Star Rating', icon: Star },
      { value: 'SMILE_RATING', label: 'Smile Rating', icon: Smile },
      { value: 'NUMERICAL', label: 'Numeric Rating', icon: Hash },
      { value: 'LIKERT', label: 'Likert Scale', icon: ListOrdered },
    ],
  },
  {
    label: 'Choice',
    items: [
      { value: 'MULTIPLE_CHOICE', label: 'Single Choice', icon: CircleDot },
      { value: 'CHECKBOX', label: 'Multiple Choice', icon: CheckSquare },
      { value: 'DROPDOWN', label: 'Dropdown', icon: ChevronDown },
      { value: 'YES_NO', label: 'Yes / No', icon: ToggleLeft },
    ],
  },
  {
    label: 'Written',
    items: [
      { value: 'SHORT_ANSWER', label: 'Short Answer', icon: Type },
      { value: 'LONG_ANSWER', label: 'Long Answer', icon: AlignLeft },
    ],
  },
];

type Lookups = {
  questionTypes: Array<{ value: string; label: string }>;
};

type BankItem = {
  id: number;
  prompt: string;
  questionType: string;
  tags: string[];
};

type Props = {
  survey: SurveyDetail;
  lookups: Lookups;
  onChange: (survey: SurveyDetail) => void;
};

export function SurveyBuilder({ survey, lookups, onChange }: Props) {
  const locked = !survey.canEditStructure;
  const [activeSectionId, setActiveSectionId] = useState(survey.sections[0]?.id);
  const [expandedId, setExpandedId] = useState<number | null>(
    survey.sections[0]?.questions[0]?.id ?? null,
  );
  const [showPreview, setShowPreview] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [bankItems, setBankItems] = useState<BankItem[]>([]);
  const [selectedBank, setSelectedBank] = useState<number[]>([]);
  const [sectionTitle, setSectionTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const activeSection =
    survey.sections.find((s) => s.id === activeSectionId) ?? survey.sections[0];

  const refresh = async () => {
    const res = await api<{ survey: SurveyDetail }>(`/api/surveys/${survey.id}`);
    onChange(res.survey);
    return res.survey;
  };

  const openBank = async () => {
    const res = await api<{ items: BankItem[] }>('/api/question-bank');
    setBankItems(res.items);
    setSelectedBank([]);
    setBankOpen(true);
  };

  const addSection = async () => {
    if (locked) return;
    setSaving(true);
    setError('');
    try {
      await api(`/api/surveys/${survey.id}/sections`, {
        method: 'POST',
        body: JSON.stringify({
          title: sectionTitle.trim() || `Section ${survey.sections.length + 1}`,
        }),
      });
      setSectionTitle('');
      const next = await refresh();
      setActiveSectionId(next.sections[next.sections.length - 1]?.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add section');
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = async (type = 'STAR_RATING') => {
    if (!activeSection || locked) return;
    setTypePickerOpen(false);
    setSaving(true);
    setError('');
    try {
      const res = await api<{ survey: SurveyDetail }>(`/api/surveys/${survey.id}/questions`, {
        method: 'POST',
        body: JSON.stringify({
          sectionId: activeSection.id,
          questionType: type,
          prompt: 'Untitled question',
          isRequired: true,
          allowComment: false,
          config: defaultConfig(type),
          options: defaultOptions(type),
        }),
      });
      onChange(res.survey);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1200);
      const created = res.survey.sections
        .flatMap((s) => s.questions)
        .sort((a, b) => b.id - a.id)[0];
      if (created) setExpandedId(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add question');
    } finally {
      setSaving(false);
    }
  };

  const updateQuestion = async (question: SurveyQuestion, patch: Record<string, unknown>) => {
    if (locked) return;
    setSaving(true);
    setError('');
    try {
      const res = await api<{ survey: SurveyDetail }>(
        `/api/surveys/${survey.id}/questions/${question.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify(patch),
        },
      );
      onChange(res.survey);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update question');
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async (questionId: number) => {
    if (locked) return;
    await api(`/api/surveys/${survey.id}/questions/${questionId}`, { method: 'DELETE' });
    await refresh();
  };

  const duplicateQuestion = async (questionId: number) => {
    if (locked) return;
    const res = await api<{ survey: SurveyDetail }>(
      `/api/surveys/${survey.id}/questions/${questionId}/duplicate`,
      { method: 'POST' },
    );
    onChange(res.survey);
  };

  const deleteSection = async (sectionId: number) => {
    if (locked) return;
    await api(`/api/surveys/${survey.id}/sections/${sectionId}`, { method: 'DELETE' });
    const next = await refresh();
    setActiveSectionId(next.sections[0]?.id);
  };

  const importBank = async () => {
    if (!activeSection || !selectedBank.length) return;
    setSaving(true);
    try {
      const res = await api<{ survey: SurveyDetail }>(`/api/surveys/${survey.id}/questions/from-bank`, {
        method: 'POST',
        body: JSON.stringify({ sectionId: activeSection.id, bankItemIds: selectedBank }),
      });
      onChange(res.survey);
      setBankOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not import questions');
    } finally {
      setSaving(false);
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    if (locked || !activeSection) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = activeSection.questions.map((q) => q.id);
    const oldIndex = ids.indexOf(Number(active.id));
    const newIndex = ids.indexOf(Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(activeSection.questions, oldIndex, newIndex).map((q, index) => ({
      ...q,
      sortOrder: index,
    }));

    onChange({
      ...survey,
      sections: survey.sections.map((s) =>
        s.id === activeSection.id ? { ...s, questions: reordered } : s,
      ),
    });

    try {
      const res = await api<{ survey: SurveyDetail }>(`/api/surveys/${survey.id}/reorder`, {
        method: 'POST',
        body: JSON.stringify({
          questions: survey.sections.flatMap((s) =>
            (s.id === activeSection.id ? reordered : s.questions).map((q, index) => ({
              id: q.id,
              sectionId: s.id,
              sortOrder: s.id === activeSection.id ? index : q.sortOrder,
            })),
          ),
        }),
      });
      onChange(res.survey);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reorder');
      await refresh();
    }
  };

  const previewSections = useMemo(() => survey.sections, [survey.sections]);

  return (
    <div className="space-y-4">
      {locked ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warn">
          Structure is locked because this survey has responses or is archived. Duplicate the survey
          to edit questions safely.
        </div>
      ) : null}
      {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</div> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {survey.sections.map((section, idx) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSectionId(section.id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-[13px] font-medium transition',
                section.id === activeSection?.id
                  ? 'bg-ink text-white'
                  : 'bg-surface text-ink-muted ring-1 ring-border hover:text-ink',
              )}
            >
              <span className="mr-1.5 text-[11px] opacity-60">{String(idx + 1).padStart(2, '0')}</span>
              {section.title}
            </button>
          ))}
          <SaveIndicator saving={saving} saved={savedFlash} />
        </div>
        <div className="relative flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setShowPreview(true)} className="xl:hidden">
            <Smartphone size={16} /> Preview
          </Button>
          <Button variant="secondary" disabled={locked || saving} onClick={openBank}>
            <Library size={16} /> From bank
          </Button>
          <Button disabled={locked || saving} onClick={() => setTypePickerOpen((v) => !v)}>
            <Plus size={16} /> Add question
          </Button>
          {typePickerOpen ? (
            <div className="absolute right-0 top-12 z-30 w-[min(360px,calc(100vw-2rem))] rounded-[var(--radius-xl)] border border-border bg-surface p-3 shadow-lg animate-fade-in">
              {QUESTION_TYPE_GROUPS.map((group) => (
                <div key={group.label} className="mb-3 last:mb-0">
                  <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          className="flex items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-2 text-left text-[13px] font-medium text-ink transition hover:bg-surface-muted"
                          onClick={() => addQuestion(item.value)}
                        >
                          <Icon size={15} className="text-ink-muted" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <Field label="New section">
                  <Input
                    value={sectionTitle}
                    disabled={locked}
                    placeholder="e.g. Laboratory Experience"
                    onChange={(e) => setSectionTitle(e.target.value)}
                  />
                </Field>
              </div>
              <Button variant="secondary" disabled={locked || saving} onClick={addSection}>
                + Add section
              </Button>
              {activeSection && survey.sections.length > 1 ? (
                <Button
                  variant="ghost"
                  disabled={locked}
                  onClick={() => deleteSection(activeSection.id)}
                >
                  Delete section
                </Button>
              ) : null}
            </div>
          </div>

          {!activeSection?.questions.length ? (
            <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
              <p className="font-medium text-ink">No questions in this section yet</p>
              <p className="mt-1 text-sm text-ink-muted">
                Add a custom question or import from the question bank.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Button disabled={locked} onClick={() => addQuestion('LIKERT')}>
                  + Add question
                </Button>
                <Button variant="secondary" disabled={locked} onClick={openBank}>
                  From bank
                </Button>
              </div>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext
                items={activeSection.questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {activeSection.questions.map((question, index) => (
                    <SortableQuestionCard
                      key={question.id}
                      question={question}
                      index={index}
                      expanded={expandedId === question.id}
                      locked={locked}
                      lookups={lookups}
                      onExpand={() =>
                        setExpandedId((id) => (id === question.id ? null : question.id))
                      }
                      onUpdate={(patch) => updateQuestion(question, patch)}
                      onDuplicate={() => duplicateQuestion(question.id)}
                      onDelete={() => deleteQuestion(question.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <aside className="hidden xl:block">
          <PhonePreview surveyTitle={survey.title} sections={previewSections} />
        </aside>
      </div>

      {showPreview ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-medium">Student preview</p>
              <button type="button" onClick={() => setShowPreview(false)}>
                <X size={18} />
              </button>
            </div>
            <PhonePreview surveyTitle={survey.title} sections={previewSections} embedded />
          </div>
        </div>
      ) : null}

      {bankOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-2xl">Question bank</h3>
                <p className="text-sm text-ink-muted">
                  Questions are copied into this survey so bank edits stay isolated.
                </p>
              </div>
              <button type="button" onClick={() => setBankOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2">
              {bankItems.map((item) => {
                const checked = selectedBank.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={cn(
                      'flex cursor-pointer gap-3 rounded-xl border px-3 py-3',
                      checked ? 'border-accent bg-accent-soft' : 'border-line',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedBank((ids) =>
                          checked ? ids.filter((id) => id !== item.id) : [...ids, item.id],
                        )
                      }
                    />
                    <div>
                      <p className="text-sm font-medium">{item.prompt}</p>
                      <p className="text-xs text-ink-muted">
                        {QUESTION_TYPE_LABELS[item.questionType] ?? item.questionType}
                        {item.tags?.length ? ` · ${item.tags.join(', ')}` : ''}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setBankOpen(false)}>
                Cancel
              </Button>
              <Button disabled={!selectedBank.length || saving} onClick={importBank}>
                Add selected
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SortableQuestionCard({
  question,
  index,
  expanded,
  locked,
  lookups,
  onExpand,
  onUpdate,
  onDuplicate,
  onDelete,
}: {
  question: SurveyQuestion;
  index: number;
  expanded: boolean;
  locked: boolean;
  lookups: Lookups;
  onExpand: () => void;
  onUpdate: (patch: Record<string, unknown>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
    disabled: locked,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const type = question.questionType;
  const [draft, setDraft] = useState({
    prompt: question.prompt,
    helpText: question.helpText ?? '',
    questionType: question.questionType,
    isRequired: question.isRequired,
    allowComment: question.allowComment ?? false,
    config: question.config ?? {},
    options: question.options.map((o) => ({ label: o.label, value: o.value ?? null })),
  });

  useEffect(() => {
    setDraft({
      prompt: question.prompt,
      helpText: question.helpText ?? '',
      questionType: question.questionType,
      isRequired: question.isRequired,
      allowComment: question.allowComment ?? false,
      config: question.config ?? {},
      options: question.options.map((o) => ({ label: o.label, value: o.value ?? null })),
    });
  }, [question.id, question.prompt, question.questionType, question.isRequired, question.allowComment, question.helpText, question.config, question.options]);

  const needsOptions = ['MULTIPLE_CHOICE', 'CHECKBOX', 'DROPDOWN'].includes(draft.questionType);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-[var(--radius-lg)] border border-border bg-surface shadow-xs transition',
        isDragging && 'opacity-80 shadow-md ring-1 ring-accent/20',
        expanded && 'ring-1 ring-accent/25',
      )}
    >
      <div className="flex items-start gap-2 px-3 py-3">
        <button
          type="button"
          className="mt-1 cursor-grab text-ink-muted/50 opacity-0 transition group-hover:opacity-100 hover:text-ink-muted active:cursor-grabbing [[data-dragging]_&]:opacity-100"
          {...attributes}
          {...listeners}
          disabled={locked}
          aria-label="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onExpand}>
          <div className="flex items-baseline gap-2">
            <span className="text-[12px] font-semibold tabular-nums text-ink-muted">
              {String(index + 1).padStart(2, '0')}
            </span>
            <p className="truncate font-medium text-ink">{question.prompt}</p>
          </div>
          <p className="mt-0.5 pl-7 text-xs text-ink-muted">
            {QUESTION_TYPE_LABELS[type] ?? type}
            {question.isRequired ? ' · Required' : ''}
          </p>
        </button>
        <div className="flex gap-1">
          <button
            type="button"
            className="rounded-md p-1.5 text-ink-muted hover:bg-surface"
            disabled={locked}
            onClick={onDuplicate}
            title="Duplicate"
          >
            <Copy size={15} />
          </button>
          <button
            type="button"
            className="rounded-md p-1.5 text-ink-muted hover:bg-red-50 hover:text-danger"
            disabled={locked}
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="grid gap-4 border-t border-line px-4 py-4 lg:grid-cols-2">
          <div className="space-y-3">
            <Field label="Question">
              <Textarea
                value={draft.prompt}
                disabled={locked}
                onChange={(e) => setDraft((d) => ({ ...d, prompt: e.target.value }))}
              />
            </Field>
            <Field label="Help text (optional)">
              <Input
                value={draft.helpText}
                disabled={locked}
                onChange={(e) => setDraft((d) => ({ ...d, helpText: e.target.value }))}
              />
            </Field>
            <Field label="Answer type">
              <Select
                value={draft.questionType}
                disabled={locked}
                onChange={(e) => {
                  const nextType = e.target.value;
                  setDraft((d) => ({
                    ...d,
                    questionType: nextType,
                    config: defaultConfig(nextType),
                    options: defaultOptions(nextType),
                  }));
                }}
              >
                {lookups.questionTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>

            <TypeConfig
              type={draft.questionType}
              config={draft.config}
              options={draft.options}
              locked={locked}
              onConfig={(config) => setDraft((d) => ({ ...d, config }))}
              onOptions={(options) => setDraft((d) => ({ ...d, options }))}
            />

            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.isRequired}
                  disabled={locked}
                  onChange={(e) => setDraft((d) => ({ ...d, isRequired: e.target.checked }))}
                />
                Required
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.allowComment}
                  disabled={locked}
                  onChange={(e) => setDraft((d) => ({ ...d, allowComment: e.target.checked }))}
                />
                Allow additional comment
              </label>
            </div>

            <Button
              disabled={locked || !draft.prompt.trim() || (needsOptions && draft.options.length < 2)}
              onClick={() =>
                onUpdate({
                  prompt: draft.prompt.trim(),
                  helpText: draft.helpText || null,
                  questionType: draft.questionType,
                  isRequired: draft.isRequired,
                  allowComment: draft.allowComment,
                  config: draft.config,
                  options: draft.options,
                })
              }
            >
              Save question
            </Button>
          </div>

          <div className="rounded-xl bg-surface p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Student preview
            </p>
            <QuestionRenderer
              question={{
                ...question,
                prompt: draft.prompt || question.prompt,
                helpText: draft.helpText,
                questionType: draft.questionType,
                isRequired: draft.isRequired,
                allowComment: draft.allowComment,
                config: draft.config,
                options: draft.options.map((o, i) => ({
                  id: question.options[i]?.id ?? i + 1,
                  label: o.label,
                  value: o.value,
                  sortOrder: i,
                })),
              }}
              mode="preview"
              compact
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TypeConfig({
  type,
  config,
  options,
  locked,
  onConfig,
  onOptions,
}: {
  type: string;
  config: Record<string, unknown>;
  options: Array<{ label: string; value: number | null }>;
  locked: boolean;
  onConfig: (config: Record<string, unknown>) => void;
  onOptions: (options: Array<{ label: string; value: number | null }>) => void;
}) {
  if (type === 'STAR_RATING') {
    return (
      <Field label="Star scale">
        <Select
          disabled={locked}
          value={String(config.maxStars ?? 5)}
          onChange={(e) => {
            const maxStars = Number(e.target.value);
            onConfig({ ...config, maxStars });
            onOptions(defaultOptions('STAR_RATING', { maxStars }));
          }}
        >
          <option value="3">3 Stars</option>
          <option value="5">5 Stars</option>
          <option value="10">10 Stars</option>
        </Select>
      </Field>
    );
  }

  if (type === 'NUMERICAL') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <Field label="Minimum">
          <Input
            type="number"
            disabled={locked}
            value={Number(config.min ?? 1)}
            onChange={(e) => {
              const min = Number(e.target.value);
              const next = { ...config, min };
              onConfig(next);
              onOptions(defaultOptions('NUMERICAL', next));
            }}
          />
        </Field>
        <Field label="Maximum">
          <Input
            type="number"
            disabled={locked}
            value={Number(config.max ?? 10)}
            onChange={(e) => {
              const max = Number(e.target.value);
              const next = { ...config, max };
              onConfig(next);
              onOptions(defaultOptions('NUMERICAL', next));
            }}
          />
        </Field>
        <Field label="Min label">
          <Input
            disabled={locked}
            value={String(config.minLabel ?? '')}
            placeholder="Very Poor"
            onChange={(e) => {
              const next = { ...config, minLabel: e.target.value };
              onConfig(next);
              onOptions(defaultOptions('NUMERICAL', next));
            }}
          />
        </Field>
        <Field label="Max label">
          <Input
            disabled={locked}
            value={String(config.maxLabel ?? '')}
            placeholder="Excellent"
            onChange={(e) => {
              const next = { ...config, maxLabel: e.target.value };
              onConfig(next);
              onOptions(defaultOptions('NUMERICAL', next));
            }}
          />
        </Field>
      </div>
    );
  }

  if (type === 'YES_NO') {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          disabled={locked}
          checked={!!config.includeNotApplicable}
          onChange={(e) => {
            const next = { ...config, includeNotApplicable: e.target.checked };
            onConfig(next);
            onOptions(defaultOptions('YES_NO', next));
          }}
        />
        Include Not Applicable
      </label>
    );
  }

  if (['MULTIPLE_CHOICE', 'CHECKBOX', 'DROPDOWN', 'LIKERT', 'SMILE_RATING'].includes(type)) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">Options</p>
        {options.map((opt, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={opt.label}
              disabled={locked}
              onChange={(e) => {
                const next = options.map((o, i) =>
                  i === index ? { ...o, label: e.target.value } : o,
                );
                onOptions(next);
              }}
            />
            {['MULTIPLE_CHOICE', 'CHECKBOX', 'DROPDOWN'].includes(type) ? (
              <button
                type="button"
                className="rounded-md px-2 text-ink-muted hover:text-danger"
                disabled={locked || options.length <= 2}
                onClick={() => onOptions(options.filter((_, i) => i !== index))}
              >
                <Trash2 size={15} />
              </button>
            ) : null}
          </div>
        ))}
        {['MULTIPLE_CHOICE', 'CHECKBOX', 'DROPDOWN'].includes(type) ? (
          <Button
            variant="secondary"
            disabled={locked}
            onClick={() =>
              onOptions([...options, { label: `Option ${options.length + 1}`, value: options.length + 1 }])
            }
          >
            + Add option
          </Button>
        ) : null}
        {type === 'CHECKBOX' ? (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Field label="Min selections">
              <Input
                type="number"
                disabled={locked}
                value={Number(config.minSelections ?? 0)}
                onChange={(e) => onConfig({ ...config, minSelections: Number(e.target.value) })}
              />
            </Field>
            <Field label="Max selections">
              <Input
                type="number"
                disabled={locked}
                value={Number(config.maxSelections ?? options.length)}
                onChange={(e) => onConfig({ ...config, maxSelections: Number(e.target.value) })}
              />
            </Field>
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}

function PhonePreview({
  surveyTitle,
  sections,
  embedded = false,
}: {
  surveyTitle: string;
  sections: SurveySection[];
  embedded?: boolean;
}) {
  const questions = sections.flatMap((s) =>
    s.questions.map((q) => ({ ...q, sectionTitle: s.title })),
  );
  return (
    <div className={cn(!embedded && 'sticky top-6')}>
      {!embedded ? (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Student preview
        </p>
      ) : null}
      <div className="overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-md">
        <div className="bg-sidebar px-4 pb-5 pt-3 text-white">
          <div className="mx-auto mb-3 h-1 w-14 rounded-full bg-white/25" />
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">SkillonX Survey</p>
          <h3 className="mt-1 font-display text-xl leading-tight">{surveyTitle}</h3>
          <p className="mt-1 text-xs text-white/60">
            {questions.length} question{questions.length === 1 ? '' : 's'} · Mobile
          </p>
        </div>
        <div className="scroll-thin max-h-[32rem] space-y-3 overflow-auto bg-bg p-3">
          {!questions.length ? (
            <p className="rounded-[var(--radius-lg)] bg-surface p-4 text-sm text-ink-muted">
              Add questions to see the live preview.
            </p>
          ) : (
            questions.slice(0, 6).map((q) => (
              <div key={q.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-accent">
                  {q.sectionTitle}
                </p>
                <QuestionRenderer question={q} mode="preview" compact />
              </div>
            ))
          )}
          {questions.length > 6 ? (
            <p className="text-center text-xs text-ink-muted">
              +{questions.length - 6} more question{questions.length - 6 === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function defaultConfig(type: string, overrides: Record<string, unknown> = {}) {
  if (type === 'STAR_RATING') return { maxStars: 5, ...overrides };
  if (type === 'NUMERICAL') return { min: 1, max: 10, minLabel: '', maxLabel: '', ...overrides };
  if (type === 'YES_NO') return { includeNotApplicable: false, ...overrides };
  if (type === 'CHECKBOX') return { minSelections: 0, maxSelections: 10, ...overrides };
  return { ...overrides };
}

function defaultOptions(type: string, config: Record<string, unknown> = {}) {
  if (type === 'STAR_RATING') {
    const max = Number(config.maxStars ?? 5);
    const labels = ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent'];
    return Array.from({ length: max }, (_, i) => ({
      label: labels[i] ?? String(i + 1),
      value: i + 1,
    }));
  }
  if (type === 'SMILE_RATING') {
    return [
      { label: 'Very Dissatisfied', value: 1 },
      { label: 'Dissatisfied', value: 2 },
      { label: 'Neutral', value: 3 },
      { label: 'Satisfied', value: 4 },
      { label: 'Very Satisfied', value: 5 },
    ];
  }
  if (type === 'LIKERT') {
    return [
      { label: 'Strongly Disagree', value: 1 },
      { label: 'Disagree', value: 2 },
      { label: 'Neutral', value: 3 },
      { label: 'Agree', value: 4 },
      { label: 'Strongly Agree', value: 5 },
    ];
  }
  if (type === 'YES_NO') {
    const opts = [
      { label: 'Yes', value: 1 },
      { label: 'No', value: 0 },
    ];
    if (config.includeNotApplicable) opts.push({ label: 'Not Applicable', value: -1 });
    return opts;
  }
  if (type === 'NUMERICAL') {
    const min = Number(config.min ?? 1);
    const max = Number(config.max ?? 10);
    return Array.from({ length: Math.max(0, max - min + 1) }, (_, i) => {
      const value = min + i;
      let label = String(value);
      if (value === min && config.minLabel) label = String(config.minLabel);
      if (value === max && config.maxLabel) label = String(config.maxLabel);
      return { label, value };
    });
  }
  if (['MULTIPLE_CHOICE', 'CHECKBOX', 'DROPDOWN'].includes(type)) {
    return [
      { label: 'Option 1', value: 1 },
      { label: 'Option 2', value: 2 },
    ];
  }
  return [];
}
