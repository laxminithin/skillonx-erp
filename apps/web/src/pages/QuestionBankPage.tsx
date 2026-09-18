import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../lib/api';
import {
  Button,
  EmptyState,
  Field,
  FilterChip,
  Input,
  PageHeader,
  Select,
  Surface,
  Textarea,
} from '../components/ui';
import { QUESTION_TYPE_LABELS } from '../types/survey';

type BankItem = {
  id: number;
  prompt: string;
  questionType: string;
  category?: string;
  tags: string[];
};

const TAGS = ['Teaching', 'Course', 'Lab', 'Infrastructure', 'Faculty', 'NBA', 'NAAC', 'Training'];

export function QuestionBankPage() {
  const [items, setItems] = useState<BankItem[]>([]);
  const [tag, setTag] = useState('');
  const [q, setQ] = useState('');
  const [prompt, setPrompt] = useState('');
  const [questionType, setQuestionType] = useState('LIKERT');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Teaching']);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tag) params.set('tag', tag);
    if (q) params.set('q', q);
    try {
      const res = await api<{ items: BankItem[] }>(`/api/question-bank?${params}`);
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(console.error);
  }, [tag]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Question Bank"
        subtitle="Reuse vetted questions across semesters and survey types."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Search questions…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={!tag} onClick={() => setTag('')}>
            All
          </FilterChip>
          {TAGS.map((t) => (
            <FilterChip key={t} active={tag === t} onClick={() => setTag(t)}>
              {t}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-2">
          {loading ? (
            <Surface className="text-sm text-ink-muted">Loading questions…</Surface>
          ) : !items.length ? (
            <EmptyState
              title="No questions in the bank yet"
              body="Add reusable prompts here, then pull them into any survey."
            />
          ) : (
            items.map((item) => (
              <Surface key={item.id} className="!p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{item.prompt}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {QUESTION_TYPE_LABELS[item.questionType] ?? item.questionType}
                      {item.tags?.length ? ` · ${item.tags.join(', ')}` : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await api(`/api/question-bank/${item.id}`, { method: 'DELETE' });
                      await load();
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </Surface>
            ))
          )}
        </div>

        <Surface className="h-fit space-y-4">
          <h3 className="text-sm font-semibold">Add to bank</h3>
          <Field label="Prompt">
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} required />
          </Field>
          <Field label="Type">
            <Select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
              <option value="LIKERT">Likert</option>
              <option value="STAR_RATING">Star Rating</option>
              <option value="SMILE_RATING">Smile Rating</option>
              <option value="NUMERICAL">Numeric</option>
              <option value="YES_NO">Yes / No</option>
              <option value="SHORT_ANSWER">Short Answer</option>
              <option value="LONG_ANSWER">Long Answer</option>
              <option value="MULTIPLE_CHOICE">Single Choice</option>
              <option value="CHECKBOX">Multiple Choice</option>
            </Select>
          </Field>
          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-secondary">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map((t) => {
                const on = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setSelectedTags((prev) =>
                        on ? prev.filter((x) => x !== t) : [...prev, t],
                      )
                    }
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      on ? 'bg-accent text-white' : 'bg-surface-muted text-ink-muted'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={async () => {
              if (!prompt.trim()) return;
              await api('/api/question-bank', {
                method: 'POST',
                body: JSON.stringify({
                  prompt,
                  questionType,
                  tags: selectedTags,
                  category: selectedTags[0] || 'GENERAL',
                }),
              });
              setPrompt('');
              await load();
            }}
          >
            Save question
          </Button>
        </Surface>
      </div>
    </div>
  );
}
