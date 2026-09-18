import { cn } from '../../lib/utils';
import type { QuizAnswer, QuizQuestion } from '../../types/quiz';

type Mode = 'answer' | 'preview' | 'review';

export function QuizQuestionRenderer({
  question,
  value,
  onChange,
  mode = 'answer',
  error,
  showCorrect,
}: {
  question: QuizQuestion;
  value?: QuizAnswer;
  onChange?: (value: QuizAnswer) => void;
  mode?: Mode;
  error?: string;
  showCorrect?: boolean;
}) {
  const disabled = mode !== 'answer';
  const selected = value?.selectedOptionIds ?? [];
  const options = [...(question.options ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const correctIds = new Set(
    question.correctOptionIds ?? options.filter((o) => o.isCorrect).map((o) => o.id),
  );

  const set = (patch: Partial<QuizAnswer>) => {
    if (disabled || !onChange) return;
    onChange({
      questionId: question.id,
      selectedOptionIds: selected,
      numericAnswer: value?.numericAnswer ?? null,
      textAnswer: value?.textAnswer ?? null,
      ...patch,
    });
  };

  if (question.questionType === 'NUMERIC') {
    return (
      <div className="space-y-3">
        <input
          type="number"
          step="any"
          className="h-11 w-full max-w-xs rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-[var(--color-accent-ring)]"
          disabled={disabled}
          inputMode="decimal"
          aria-label="Numeric answer"
          aria-invalid={Boolean(error)}
          placeholder="Enter a number"
          value={value?.numericAnswer ?? ''}
          onChange={(e) =>
            set({ numericAnswer: e.target.value === '' ? null : Number(e.target.value) })
          }
        />
        {showCorrect && question.numericAnswer != null ? (
          <p className="text-sm text-ink-secondary">
            Correct answer: {question.numericAnswer}
            {question.numericTolerance ? ` ± ${question.numericTolerance}` : ''}
          </p>
        ) : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    );
  }

  if (question.questionType === 'SHORT_ANSWER') {
    return (
      <div className="space-y-3">
        <input
          className="h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-[var(--color-accent-ring)]"
          disabled={disabled}
          aria-label="Short answer"
          placeholder={mode === 'preview' ? 'Student short answer' : 'Your answer'}
          value={value?.textAnswer ?? ''}
          onChange={(e) => set({ textAnswer: e.target.value })}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    );
  }

  const multi = question.questionType === 'MULTIPLE_SELECT';

  return (
    <div className="space-y-2" role={multi ? 'group' : 'radiogroup'} aria-label="Answer options">
      {options.map((opt, index) => {
        const id = opt.id ?? index;
        const active = selected.includes(Number(id));
        const isRight = showCorrect && correctIds.has(Number(id));
        const isWrongPick = showCorrect && active && !correctIds.has(Number(id));
        return (
          <button
            key={id}
            type="button"
            role={multi ? 'checkbox' : 'radio'}
            aria-checked={active}
            disabled={disabled}
            onClick={() => {
              if (multi) {
                const next = active ? selected.filter((x) => x !== Number(id)) : [...selected, Number(id)];
                set({ selectedOptionIds: next });
              } else {
                set({ selectedOptionIds: [Number(id)] });
              }
            }}
            className={cn(
              'flex w-full items-center gap-3 rounded-[var(--radius-md)] border px-3.5 py-3 text-left text-sm transition',
              active && !showCorrect && 'border-accent bg-accent-soft text-ink',
              !active && !showCorrect && 'border-border bg-surface hover:border-border-strong',
              isRight && 'border-accent bg-accent-soft',
              isWrongPick && 'border-danger bg-danger-soft',
              disabled && 'cursor-default',
            )}
          >
            <span
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center border',
                multi ? 'rounded-[3px]' : 'rounded-full',
                active || isRight ? 'border-accent bg-accent' : 'border-border-strong',
                isWrongPick && 'border-danger bg-danger',
              )}
              aria-hidden
            >
              {active || isRight ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
            </span>
            <span className="min-w-0 flex-1">{opt.label}</span>
            {showCorrect && isRight ? (
              <span className="text-[11px] font-medium text-accent">Correct</span>
            ) : null}
            {showCorrect && isWrongPick ? (
              <span className="text-[11px] font-medium text-danger">Your answer</span>
            ) : null}
          </button>
        );
      })}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
