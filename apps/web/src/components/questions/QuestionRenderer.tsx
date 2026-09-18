import { useState } from 'react';
import { cn } from '../../lib/utils';
import {
  cleanLabel,
  normalizeType,
  type AnswerValue,
  type SurveyQuestion,
} from '../../types/survey';

type Mode = 'answer' | 'preview' | 'readonly';

type Props = {
  question: SurveyQuestion;
  value?: AnswerValue;
  onChange?: (value: AnswerValue) => void;
  mode?: Mode;
  error?: string;
  compact?: boolean;
  showPrompt?: boolean;
};

function baseAnswer(question: SurveyQuestion, value?: AnswerValue): AnswerValue {
  return {
    questionId: question.id,
    textAnswer: value?.textAnswer ?? null,
    numericAnswer: value?.numericAnswer ?? null,
    selectedOptionId: value?.selectedOptionId ?? null,
    jsonAnswer: value?.jsonAnswer ?? null,
    comment: value?.comment ?? null,
  };
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  mode = 'answer',
  error,
  compact = false,
  showPrompt = true,
}: Props) {
  const type = normalizeType(question.questionType);
  const disabled = mode === 'preview' || mode === 'readonly';
  const answer = baseAnswer(question, value);
  const options = [...(question.options ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );

  const set = (patch: Partial<AnswerValue>) => {
    if (disabled || !onChange) return;
    onChange({ ...answer, ...patch, questionId: question.id });
  };

  return (
    <div className={cn('space-y-3', compact && 'space-y-2')}>
      {showPrompt ? (
        <div>
          <p className={cn('font-medium text-ink', compact ? 'text-sm' : 'text-[15px] leading-snug')}>
            {question.prompt}
            {question.isRequired ? <span className="ml-1 text-danger">*</span> : null}
          </p>
          {question.helpText ? (
            <p className="mt-1 text-sm text-ink-muted">{question.helpText}</p>
          ) : null}
        </div>
      ) : null}

      {type === 'STAR_RATING' ? (
        <StarInput
          options={options}
          selectedId={answer.selectedOptionId}
          disabled={disabled}
          onSelect={(opt) =>
            set({ selectedOptionId: opt.id ?? null, numericAnswer: opt.value ?? null })
          }
        />
      ) : null}

      {type === 'SMILE_RATING' ? (
        <SmileInput
          options={options}
          selectedId={answer.selectedOptionId}
          disabled={disabled}
          onSelect={(opt) =>
            set({ selectedOptionId: opt.id ?? null, numericAnswer: opt.value ?? null })
          }
        />
      ) : null}

      {type === 'NUMERICAL' ? (
        <NumericScale
          options={options}
          selectedId={answer.selectedOptionId}
          disabled={disabled}
          minLabel={(question.config?.minLabel as string) || options[0]?.label}
          maxLabel={(question.config?.maxLabel as string) || options[options.length - 1]?.label}
          onSelect={(opt) =>
            set({ selectedOptionId: opt.id ?? null, numericAnswer: opt.value ?? null })
          }
        />
      ) : null}

      {type === 'LIKERT' ? (
        <LikertScale
          options={options}
          selectedId={answer.selectedOptionId}
          disabled={disabled}
          onSelect={(opt) =>
            set({ selectedOptionId: opt.id ?? null, numericAnswer: opt.value ?? null })
          }
        />
      ) : null}

      {type === 'YES_NO' || type === 'MULTIPLE_CHOICE' ? (
        <ChoiceList
          options={options}
          selectedId={answer.selectedOptionId}
          disabled={disabled}
          onSelect={(opt) =>
            set({ selectedOptionId: opt.id ?? null, numericAnswer: opt.value ?? null })
          }
        />
      ) : null}

      {type === 'CHECKBOX' ? (
        <CheckboxGroup
          options={options}
          selected={answer.jsonAnswer ?? []}
          disabled={disabled}
          onChange={(ids) => set({ jsonAnswer: ids })}
        />
      ) : null}

      {type === 'DROPDOWN' ? (
        <select
          className="h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-[var(--color-accent-ring)]"
          disabled={disabled}
          value={answer.selectedOptionId ?? ''}
          onChange={(e) => {
            const id = e.target.value ? Number(e.target.value) : null;
            const opt = options.find((o) => o.id === id);
            set({ selectedOptionId: id, numericAnswer: opt?.value ?? null });
          }}
        >
          <option value="">Select an option</option>
          {options.map((opt) => (
            <option key={opt.id ?? opt.label} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : null}

      {type === 'SHORT_ANSWER' ? (
        <input
          className="h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-[var(--color-accent-ring)]"
          disabled={disabled}
          placeholder={mode === 'preview' ? 'Student short answer' : 'Your answer'}
          value={answer.textAnswer ?? ''}
          onChange={(e) => set({ textAnswer: e.target.value })}
        />
      ) : null}

      {type === 'LONG_ANSWER' ? (
        <textarea
          className="min-h-28 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-[var(--color-accent-ring)]"
          disabled={disabled}
          placeholder={mode === 'preview' ? 'Student comments appear here' : 'Share your thoughts'}
          value={answer.textAnswer ?? ''}
          onChange={(e) => set({ textAnswer: e.target.value })}
        />
      ) : null}

      {question.allowComment ? (
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">Additional comment</label>
          <input
            className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-[var(--color-accent-ring)]"
            disabled={disabled}
            placeholder="Optional comment"
            value={answer.comment ?? ''}
            onChange={(e) => set({ comment: e.target.value })}
          />
        </div>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

function StarInput({
  options,
  selectedId,
  disabled,
  onSelect,
}: {
  options: SurveyQuestion['options'];
  selectedId?: number | null;
  disabled?: boolean;
  onSelect: (opt: SurveyQuestion['options'][number]) => void;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const selectedIndex = options.findIndex((o) => o.id === selectedId);
  const visualIndex = hoverIndex ?? focusIndex ?? selectedIndex;

  return (
    <div>
      <div
        className="flex flex-wrap gap-1.5"
        role="radiogroup"
        aria-label="Star rating"
        onMouseLeave={() => setHoverIndex(null)}
      >
        {options.map((opt, index) => {
          const active = visualIndex >= 0 && index <= visualIndex;
          const selected = selectedIndex === index;
          return (
            <button
              key={opt.id ?? index}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onMouseEnter={() => !disabled && setHoverIndex(index)}
              onFocus={() => !disabled && setFocusIndex(index)}
              onBlur={() => setFocusIndex(null)}
              onClick={() => onSelect(opt)}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] transition duration-150 disabled:cursor-default',
                active ? 'text-accent' : 'text-star-empty hover:text-accent/55',
                selected && 'ring-2 ring-[var(--color-accent-ring)]',
              )}
              aria-label={opt.label}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill={active ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden
              >
                <path d="M12 3.6l2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 15.9l-4.8 2.52.92-5.34L4.24 9.24l5.36-.78L12 3.6z" />
              </svg>
            </button>
          );
        })}
      </div>
      {selectedIndex >= 0 ? (
        <p className="mt-2 text-sm text-ink-muted">{options[selectedIndex]?.label}</p>
      ) : options.length > 1 ? (
        <div className="mt-2 flex justify-between text-xs text-ink-muted">
          <span>{cleanLabel(options[0]?.label || '')}</span>
          <span>{cleanLabel(options[options.length - 1]?.label || '')}</span>
        </div>
      ) : null}
    </div>
  );
}

function SmileFace({ value, active }: { value: number; active?: boolean }) {
  const tone = active ? 'text-accent' : 'text-ink-muted';
  const mouths: Record<number, string> = {
    1: 'M8 16c1.5-2 6.5-2 8 0',
    2: 'M8 15.5c1.2-1.2 6.8-1.2 8 0',
    3: 'M8 15.5h8',
    4: 'M8 14.5c1.5 2 6.5 2 8 0',
    5: 'M7.5 14c2 3.2 7 3.2 9 0',
  };
  return (
    <svg viewBox="0 0 24 24" className={cn('h-8 w-8', tone)} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
      <path d={mouths[value] || mouths[3]} strokeLinecap="round" />
    </svg>
  );
}

function SmileInput({
  options,
  selectedId,
  disabled,
  onSelect,
}: {
  options: SurveyQuestion['options'];
  selectedId?: number | null;
  disabled?: boolean;
  onSelect: (opt: SurveyQuestion['options'][number]) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2" role="radiogroup" aria-label="Satisfaction rating">
      {options.map((opt, index) => {
        const active = opt.id === selectedId;
        const value = Number(opt.value ?? index + 1);
        return (
          <button
            key={opt.id ?? index}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onSelect(opt)}
            className={cn(
              'flex min-h-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-[var(--radius-lg)] border px-1 py-2.5 transition duration-150',
              active
                ? 'border-accent bg-accent-soft ring-2 ring-[var(--color-accent-ring)]'
                : 'border-transparent bg-surface-muted/70 hover:bg-surface-muted',
              disabled && 'cursor-default',
            )}
            aria-label={cleanLabel(opt.label)}
          >
            <SmileFace value={value} active={active} />
            <span
              className={cn(
                'text-center text-[10px] font-medium leading-tight sm:text-[11px]',
                active ? 'text-accent' : 'text-ink-muted',
              )}
            >
              {cleanLabel(opt.label)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function NumericScale({
  options,
  selectedId,
  disabled,
  minLabel,
  maxLabel,
  onSelect,
}: {
  options: SurveyQuestion['options'];
  selectedId?: number | null;
  disabled?: boolean;
  minLabel?: string;
  maxLabel?: string;
  onSelect: (opt: SurveyQuestion['options'][number]) => void;
}) {
  return (
    <div>
      <div
        className="flex flex-wrap overflow-hidden rounded-[var(--radius-md)] border border-border"
        role="radiogroup"
        aria-label="Numeric rating"
      >
        {options.map((opt, index) => {
          const active = opt.id === selectedId;
          return (
            <button
              key={opt.id ?? index}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onSelect(opt)}
              className={cn(
                'min-h-11 flex-1 basis-10 border-r border-border text-sm font-medium transition last:border-r-0',
                active
                  ? 'bg-accent text-white'
                  : 'bg-surface text-ink-secondary hover:bg-surface-muted',
                disabled && 'cursor-default',
              )}
              aria-label={`${opt.value ?? index + 1}${opt.label && opt.label !== String(opt.value ?? index + 1) ? ` — ${opt.label}` : ''}`}
            >
              {opt.value ?? index + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-ink-muted">
        <span>{cleanLabel(minLabel || 'Low')}</span>
        <span>{cleanLabel(maxLabel || 'High')}</span>
      </div>
    </div>
  );
}

function LikertScale({
  options,
  selectedId,
  disabled,
  onSelect,
}: {
  options: SurveyQuestion['options'];
  selectedId?: number | null;
  disabled?: boolean;
  onSelect: (opt: SurveyQuestion['options'][number]) => void;
}) {
  return (
    <div className="space-y-2 sm:space-y-0">
      <div
        className="hidden overflow-hidden rounded-[var(--radius-md)] border border-border sm:flex"
        role="radiogroup"
        aria-label="Level of agreement"
      >
        {options.map((opt, index) => {
          const active = opt.id === selectedId;
          return (
            <button
              key={opt.id ?? index}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onSelect(opt)}
              className={cn(
                'min-h-[3.25rem] flex-1 border-r border-border px-2 py-2 text-center text-[12px] font-medium leading-snug transition last:border-r-0',
                active
                  ? 'bg-accent text-white'
                  : 'bg-surface text-ink-secondary hover:bg-surface-muted',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <div className="space-y-2 sm:hidden" role="radiogroup" aria-label="Level of agreement">
        {options.map((opt, index) => {
          const active = opt.id === selectedId;
          return (
            <button
              key={opt.id ?? index}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onSelect(opt)}
              className={cn(
                'flex w-full items-center rounded-[var(--radius-md)] border px-3 py-3 text-left text-sm transition',
                active
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-border bg-surface text-ink',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChoiceList({
  options,
  selectedId,
  disabled,
  onSelect,
}: {
  options: SurveyQuestion['options'];
  selectedId?: number | null;
  disabled?: boolean;
  onSelect: (opt: SurveyQuestion['options'][number]) => void;
}) {
  return (
    <div className="space-y-2" role="radiogroup" aria-label="Response options">
      {options.map((opt, index) => {
        const active = opt.id === selectedId;
        return (
          <button
            key={opt.id ?? index}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onSelect(opt)}
            className={cn(
              'flex w-full items-center gap-3 rounded-[var(--radius-md)] border px-3.5 py-3 text-left text-sm transition',
              active
                ? 'border-accent bg-accent-soft text-ink'
                : 'border-border bg-surface hover:border-border-strong',
              disabled && 'cursor-default',
            )}
          >
            <span
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                active ? 'border-accent bg-accent' : 'border-border-strong',
              )}
            >
              {active ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
            </span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function CheckboxGroup({
  options,
  selected,
  disabled,
  onChange,
}: {
  options: SurveyQuestion['options'];
  selected: number[];
  disabled?: boolean;
  onChange: (ids: number[]) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt, index) => {
        const id = opt.id ?? index;
        const checked = selected.includes(id);
        return (
          <label
            key={id}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border px-3.5 py-3 text-sm transition',
              checked ? 'border-accent bg-accent-soft' : 'border-border bg-surface',
              disabled && 'cursor-default',
            )}
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-accent"
              disabled={disabled}
              checked={checked}
              onChange={() => {
                if (disabled) return;
                onChange(checked ? selected.filter((x) => x !== id) : [...selected, id]);
              }}
            />
            <span>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}
