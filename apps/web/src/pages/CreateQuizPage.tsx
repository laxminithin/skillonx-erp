import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Button, Field, Input, PageHeader, Select, Surface, Textarea, useToast } from '../components/ui';
import { DEFAULT_TIMEZONE, zonedLocalToUtcIso } from '../lib/timezone';

type Lookups = {
  departments: Array<{ id: number; name: string }>;
  academicYears: Array<{ id: number; label: string }>;
  semesters: Array<{ id: number; label: string }>;
  courses: Array<{ id: number; name: string; code: string; department_id: number | null }>;
  sections: Array<{ id: number; label: string; department_id: number | null }>;
  timezone?: string;
};

type Module = {
  id: number;
  name: string;
  courseId: number;
  questionCount: number;
  difficultyCounts?: { easy: number; intermediate: number; difficult: number; needsReview: number };
};

type Inventory = { totals: { EASY: number; INTERMEDIATE: number; DIFFICULT: number } };

const PRESETS = [
  { id: 'quick', label: 'Quick Quiz', easy: 5, intermediate: 3, difficult: 2, duration: 15 },
  { id: 'standard', label: 'Standard Quiz', easy: 8, intermediate: 8, difficult: 4, duration: 20 },
  { id: 'challenge', label: 'Challenge Quiz', easy: 4, intermediate: 8, difficult: 8, duration: 20 },
  { id: 'custom', label: 'Custom', easy: 10, intermediate: 5, difficult: 5, duration: 20 },
] as const;

const emptyManual = {
  title: '',
  description: '',
  instructions: '',
  courseId: '',
  moduleId: '',
  academicYearId: '',
  semesterId: '',
  departmentId: '',
  classSectionId: '',
  durationMinutes: '20',
};

function MixStepper({
  label,
  value,
  available,
  onChange,
}: {
  label: string;
  value: number;
  available: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink">{label}</p>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => onChange(Math.max(0, value - 1))}>
            –
          </Button>
          <Input
            className="h-8 w-16 text-center tabular-nums"
            type="number"
            min={0}
            max={available}
            value={value}
            onChange={(e) => onChange(Math.max(0, Math.min(available, Number(e.target.value) || 0)))}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => onChange(Math.min(available, value + 1))}
          >
            +
          </Button>
        </div>
      </div>
      <p className="mt-1 text-xs text-ink-muted">Available: {available}</p>
      {value > available ? (
        <p className="mt-1 text-xs text-danger">
          Only {available} {label} questions are available for the selected modules.
        </p>
      ) : null}
    </div>
  );
}

export function CreateQuizPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();
  const [mode, setMode] = useState<'generate' | 'manual'>('generate');
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [inventory, setInventory] = useState<Inventory>({ totals: { EASY: 0, INTERMEDIATE: 0, DIFFICULT: 0 } });
  const [courseId, setCourseId] = useState('');
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  const [preset, setPreset] = useState<(typeof PRESETS)[number]['id']>('custom');
  const [easy, setEasy] = useState(10);
  const [intermediate, setIntermediate] = useState(5);
  const [difficult, setDifficult] = useState(5);
  const [duration, setDuration] = useState('20');
  const [title, setTitle] = useState('');
  const [marksPerQuestion, setMarksPerQuestion] = useState('1');
  const [passPercentage, setPassPercentage] = useState('40');
  const [attempts, setAttempts] = useState('1');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [distribution, setDistribution] = useState<'BALANCED' | 'RANDOM'>('BALANCED');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState(emptyManual);

  useEffect(() => {
    api<Lookups>('/api/meta/lookups').then(setLookups).catch(console.error);
  }, []);

  useEffect(() => {
    const fromQuery = params.get('courseId');
    if (fromQuery) setCourseId(fromQuery);
  }, [params]);

  useEffect(() => {
    const id = mode === 'manual' ? manual.courseId : courseId;
    if (!id) {
      if (mode === 'manual') return;
      setModules([]);
      setSelectedModules([]);
      return;
    }
    api<{ modules: Module[] }>(`/api/quiz-bank/modules?courseId=${id}`)
      .then((d) => {
        setModules(d.modules);
        if (mode === 'generate') {
          const preferred = params.get('moduleId');
          if (preferred && d.modules.some((m) => String(m.id) === preferred)) {
            setSelectedModules([Number(preferred)]);
          } else {
            setSelectedModules(d.modules.map((m) => m.id));
          }
        }
      })
      .catch(console.error);
  }, [courseId, manual.courseId, mode, params]);

  useEffect(() => {
    if (!courseId || !selectedModules.length) {
      setInventory({ totals: { EASY: 0, INTERMEDIATE: 0, DIFFICULT: 0 } });
      return;
    }
    const params = new URLSearchParams({
      courseId,
      moduleIds: selectedModules.join(','),
    });
    api<Inventory>(`/api/quiz-bank/inventory?${params}`)
      .then(setInventory)
      .catch(console.error);
  }, [courseId, selectedModules]);

  const course = lookups?.courses.find((c) => String(c.id) === courseId);
  const totalQuestions = easy + intermediate + difficult;
  const marks = totalQuestions * (Number(marksPerQuestion) || 1);
  const tz = lookups?.timezone || DEFAULT_TIMEZONE;

  const autoTitle = useMemo(() => {
    if (!course) return '';
    const names = modules
      .filter((m) => selectedModules.includes(m.id))
      .map((m) => m.name.match(/\b(Module|Unit)\s+\d+/i)?.[0] || m.name);
    if (!names.length) return `${course.name} Quiz`;
    return `${course.name} — ${names.join(' & ')} Quiz`;
  }, [course, modules, selectedModules]);

  const applyPreset = (id: (typeof PRESETS)[number]['id']) => {
    const p = PRESETS.find((x) => x.id === id)!;
    setPreset(id);
    setEasy(p.easy);
    setIntermediate(p.intermediate);
    setDifficult(p.difficult);
    setDuration(String(p.duration));
  };

  const generate = async (e: FormEvent) => {
    e.preventDefault();
    if (!courseId || !selectedModules.length) {
      setError('Select a subject and at least one module');
      return;
    }
    if (easy > inventory.totals.EASY) {
      setError(`Only ${inventory.totals.EASY} Easy questions are available for the selected modules.`);
      return;
    }
    if (intermediate > inventory.totals.INTERMEDIATE) {
      setError(
        `Only ${inventory.totals.INTERMEDIATE} Intermediate questions are available for the selected modules.`,
      );
      return;
    }
    if (difficult > inventory.totals.DIFFICULT) {
      setError(`Only ${inventory.totals.DIFFICULT} Difficult questions are available for the selected modules.`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api<{ quiz: { id: number } }>('/api/quizzes/generate', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim() || autoTitle,
          courseId: Number(courseId),
          moduleIds: selectedModules,
          easyCount: easy,
          intermediateCount: intermediate,
          difficultCount: difficult,
          distribution,
          durationMinutes: Number(duration) || 20,
          marksPerQuestion: Number(marksPerQuestion) || 1,
          passPercentage: Number(passPercentage) || 40,
          attemptsAllowed: Number(attempts) || 1,
          shuffleQuestions: true,
          shuffleOptions: true,
          showScoreImmediately: true,
          showCorrectAnswers: 'AFTER_END',
          startAt: startAt ? zonedLocalToUtcIso(startAt, tz) : null,
          endAt: endAt ? zonedLocalToUtcIso(endAt, tz) : null,
        }),
      });
      toast('Quiz generated — review questions before publishing');
      navigate(`/quizzes/${res.quiz.id}?tab=questions`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const createManual = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api<{ quiz: { id: number } }>('/api/quizzes', {
        method: 'POST',
        body: JSON.stringify({
          title: manual.title,
          description: manual.description || null,
          instructions: manual.instructions || null,
          courseId: manual.courseId ? Number(manual.courseId) : null,
          moduleId: manual.moduleId ? Number(manual.moduleId) : null,
          academicYearId: manual.academicYearId ? Number(manual.academicYearId) : null,
          semesterId: manual.semesterId ? Number(manual.semesterId) : null,
          departmentId: manual.departmentId ? Number(manual.departmentId) : null,
          classSectionId: manual.classSectionId ? Number(manual.classSectionId) : null,
          durationMinutes: manual.durationMinutes ? Number(manual.durationMinutes) : 20,
          showScoreImmediately: true,
          showCorrectAnswers: 'AFTER_END',
          attemptsAllowed: 1,
          passPercentage: 40,
          shuffleQuestions: true,
          shuffleOptions: true,
        }),
      });
      navigate(`/quizzes/${res.quiz.id}?tab=questions`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Create Quiz" subtitle="Generate a balanced quiz from the Question Bank in under a minute." />
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode('generate')}
          className={`rounded-[var(--radius-md)] border px-4 py-3 text-left ${
            mode === 'generate' ? 'border-ink bg-accent-soft' : 'border-border hover:bg-surface-muted'
          }`}
        >
          <p className="text-sm font-semibold text-ink">Quick Generate</p>
          <p className="mt-1 text-xs text-ink-muted">Recommended. Automatically build a balanced quiz.</p>
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`rounded-[var(--radius-md)] border px-4 py-3 text-left ${
            mode === 'manual' ? 'border-ink bg-accent-soft' : 'border-border hover:bg-surface-muted'
          }`}
        >
          <p className="text-sm font-semibold text-ink">Build Manually</p>
          <p className="mt-1 text-xs text-ink-muted">Choose individual questions yourself.</p>
        </button>
      </div>

      {mode === 'generate' ? (
        <form onSubmit={generate}>
          <Surface className="max-w-3xl space-y-5">
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Field label="Subject">
              <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
                <option value="">Select subject</option>
                {lookups?.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            {courseId ? (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-medium text-ink-secondary">Modules</p>
                  <button
                    type="button"
                    className="text-xs font-medium text-accent"
                    onClick={() =>
                      setSelectedModules(
                        selectedModules.length === modules.length ? [] : modules.map((m) => m.id),
                      )
                    }
                  >
                    {selectedModules.length === modules.length ? 'Clear' : 'Select all modules'}
                  </button>
                </div>
                <div className="space-y-2">
                  {modules.map((m) => (
                    <label
                      key={m.id}
                      className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedModules.includes(m.id)}
                          onChange={() =>
                            setSelectedModules((prev) =>
                              prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id],
                            )
                          }
                        />
                        {m.name}
                      </span>
                      <span className="text-xs text-ink-muted">{m.questionCount} questions</span>
                    </label>
                  ))}
                  {!modules.length ? (
                    <p className="text-sm text-ink-muted">No modules in the Question Bank for this subject yet.</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {courseId && selectedModules.length ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p.id)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        preset === p.id ? 'bg-ink text-white' : 'bg-surface-muted text-ink-secondary'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div>
                  <p className="mb-2 text-[13px] font-medium text-ink-secondary">Question mix</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <MixStepper label="Easy" value={easy} available={inventory.totals.EASY} onChange={setEasy} />
                    <MixStepper
                      label="Intermediate"
                      value={intermediate}
                      available={inventory.totals.INTERMEDIATE}
                      onChange={setIntermediate}
                    />
                    <MixStepper
                      label="Difficult"
                      value={difficult}
                      available={inventory.totals.DIFFICULT}
                      onChange={setDifficult}
                    />
                  </div>
                  <p className="mt-3 text-sm font-medium text-ink">
                    {totalQuestions} questions · {marks} marks
                  </p>
                </div>
                {selectedModules.length > 1 ? (
                  <Field label="Question distribution">
                    <Select
                      value={distribution}
                      onChange={(e) => setDistribution(e.target.value as 'BALANCED' | 'RANDOM')}
                    >
                      <option value="BALANCED">Balanced across modules</option>
                      <option value="RANDOM">Random across selected modules</option>
                    </Select>
                  </Field>
                ) : null}
                <Field label="Duration (minutes)">
                  <Input type="number" min={1} max={600} value={duration} onChange={(e) => setDuration(e.target.value)} />
                </Field>
                <button
                  type="button"
                  className="text-xs font-medium text-accent"
                  onClick={() => setShowAdvanced((v) => !v)}
                >
                  {showAdvanced ? 'Hide extra settings' : 'More settings'}
                </button>
                {showAdvanced ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Quiz title" optional>
                      <Input value={title} placeholder={autoTitle} onChange={(e) => setTitle(e.target.value)} />
                    </Field>
                    <Field label="Marks per question">
                      <Input
                        type="number"
                        min={0.5}
                        step={0.5}
                        value={marksPerQuestion}
                        onChange={(e) => setMarksPerQuestion(e.target.value)}
                      />
                    </Field>
                    <Field label="Pass percentage">
                      <Input value={passPercentage} onChange={(e) => setPassPercentage(e.target.value)} />
                    </Field>
                    <Field label="Attempts">
                      <Input type="number" min={1} value={attempts} onChange={(e) => setAttempts(e.target.value)} />
                    </Field>
                    <Field label="Start" optional>
                      <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                    </Field>
                    <Field label="End" optional>
                      <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                    </Field>
                  </div>
                ) : null}
              </>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => navigate('/quizzes')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !courseId || !selectedModules.length || totalQuestions < 1}>
                {loading ? 'Generating…' : 'Generate Quiz'}
              </Button>
            </div>
          </Surface>
        </form>
      ) : (
        <form onSubmit={createManual}>
          <Surface className="max-w-3xl space-y-5">
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Field label="Quiz title">
              <Input required value={manual.title} onChange={(e) => setManual({ ...manual, title: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Subject">
                <Select
                  value={manual.courseId}
                  onChange={(e) => setManual({ ...manual, courseId: e.target.value, moduleId: '' })}
                >
                  <option value="">Select subject</option>
                  {lookups?.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Module" optional>
                <Select
                  value={manual.moduleId}
                  onChange={(e) => setManual({ ...manual, moduleId: e.target.value })}
                  disabled={!manual.courseId}
                >
                  <option value="">Any / mixed modules</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Instructions" optional>
              <Textarea value={manual.instructions} onChange={(e) => setManual({ ...manual, instructions: e.target.value })} />
            </Field>
            <Field label="Duration (minutes)">
              <Input
                type="number"
                min={1}
                max={600}
                value={manual.durationMinutes}
                onChange={(e) => setManual({ ...manual, durationMinutes: e.target.value })}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => navigate('/quizzes')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating…' : 'Continue to questions'}
              </Button>
            </div>
          </Surface>
        </form>
      )}
    </div>
  );
}
