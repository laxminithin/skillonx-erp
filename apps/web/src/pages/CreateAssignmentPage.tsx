import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, generateAssignment } from '../lib/api';
import { Button, Field, Input, PageHeader, Select, Surface, Textarea, useToast } from '../components/ui';
import { DEFAULT_TIMEZONE, zonedLocalToUtcIso } from '../lib/timezone';
import {
  ASSIGNMENT_QUESTION_TYPES,
  ASSIGNMENT_QUESTION_TYPE_LABELS,
  GENERATOR_PRESET_META,
  type GeneratorPreset,
} from '../types/assignment';
import { useDocumentTitle } from '../lib/useDocumentTitle';

type Lookups = {
  departments: Array<{ id: number; name: string }>;
  academicYears: Array<{ id: number; label: string }>;
  semesters: Array<{ id: number; label: string }>;
  courses: Array<{ id: number; name: string; code: string; department_id: number | null }>;
  sections: Array<{ id: number; label: string; department_id: number | null }>;
  programs?: Array<{ id: number; name: string; department_id?: number | null }>;
  timezone?: string;
};

type Module = {
  id: number;
  name: string;
  courseId?: number;
  questionCount?: number;
};

type Inventory = { totals: { EASY: number; INTERMEDIATE: number; DIFFICULT: number } };

const PRESET_ORDER: GeneratorPreset[] = ['SHORT', 'STANDARD', 'DEEP_DIVE', 'CUSTOM'];

function MixStepper({
  label,
  value,
  available,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  available: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink">{label}</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled}
            onClick={() => onChange(Math.max(0, value - 1))}
          >
            –
          </Button>
          <Input
            className="h-8 w-16 text-center tabular-nums"
            type="number"
            min={0}
            max={available}
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(Math.max(0, Math.min(available, Number(e.target.value) || 0)))}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled}
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

export function CreateAssignmentPage() {
  useDocumentTitle('Create Assignment');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [inventory, setInventory] = useState<Inventory>({ totals: { EASY: 0, INTERMEDIATE: 0, DIFFICULT: 0 } });
  const [academicYearId, setAcademicYearId] = useState('');
  const [programId, setProgramId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [classSectionId, setClassSectionId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  const [preset, setPreset] = useState<GeneratorPreset>('STANDARD');
  const [easy, setEasy] = useState(GENERATOR_PRESET_META.STANDARD.easy);
  const [intermediate, setIntermediate] = useState(GENERATOR_PRESET_META.STANDARD.intermediate);
  const [difficult, setDifficult] = useState(GENERATOR_PRESET_META.STANDARD.difficult);
  const [questionType, setQuestionType] = useState('');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [passPercentage, setPassPercentage] = useState('40');
  const [attempts, setAttempts] = useState('1');
  const [startAt, setStartAt] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [lateAllowed, setLateAllowed] = useState(false);
  const [lateDeadline, setLateDeadline] = useState('');
  const [distribution, setDistribution] = useState<'BALANCED' | 'RANDOM'>('BALANCED');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<Lookups>('/api/meta/lookups').then(setLookups).catch(console.error);
  }, []);

  useEffect(() => {
    const fromQuery = params.get('courseId');
    if (fromQuery) setCourseId(fromQuery);
  }, [params]);

  useEffect(() => {
    if (!courseId) {
      setModules([]);
      setSelectedModules([]);
      return;
    }
    api<{ modules: Module[] }>(`/api/assignment-bank/modules?courseId=${courseId}`)
      .then((d) => {
        setModules(d.modules);
        const preferred = params.get('moduleId');
        if (preferred && d.modules.some((m) => String(m.id) === preferred)) {
          setSelectedModules([Number(preferred)]);
        } else {
          setSelectedModules(d.modules.map((m) => m.id));
        }
      })
      .catch(console.error);
  }, [courseId, params]);

  useEffect(() => {
    if (!courseId || !selectedModules.length) {
      setInventory({ totals: { EASY: 0, INTERMEDIATE: 0, DIFFICULT: 0 } });
      return;
    }
    const qs = new URLSearchParams({
      courseId,
      moduleIds: selectedModules.join(','),
    });
    api<{ totals: Inventory['totals'] }>(`/api/assignment-bank/inventory?${qs}`)
      .then((d) => setInventory({ totals: d.totals }))
      .catch(console.error);
  }, [courseId, selectedModules]);

  const course = lookups?.courses.find((c) => String(c.id) === courseId);
  const totalQuestions = easy + intermediate + difficult;
  const tz = lookups?.timezone || DEFAULT_TIMEZONE;
  const mixLocked = preset !== 'CUSTOM';

  const autoTitle = useMemo(() => {
    if (!course) return '';
    const names = modules
      .filter((m) => selectedModules.includes(m.id))
      .map((m) => m.name.match(/\b(Module|Unit)\s+\d+/i)?.[0] || m.name);
    if (!names.length) return `${course.name} Assignment`;
    return `${course.name} — ${names.join(' & ')} Assignment`;
  }, [course, modules, selectedModules]);

  const applyPreset = (id: GeneratorPreset) => {
    const p = GENERATOR_PRESET_META[id];
    setPreset(id);
    setEasy(p.easy);
    setIntermediate(p.intermediate);
    setDifficult(p.difficult);
  };

  const generate = async (e: FormEvent) => {
    e.preventDefault();
    if (!courseId || !selectedModules.length) {
      setError('Select a subject and at least one module');
      return;
    }
    if (preset === 'CUSTOM' && totalQuestions < 1) {
      setError('Select at least one question');
      return;
    }
    if (easy > inventory.totals.EASY) {
      setError(`Only ${inventory.totals.EASY} Easy questions are available.`);
      return;
    }
    if (intermediate > inventory.totals.INTERMEDIATE) {
      setError(`Only ${inventory.totals.INTERMEDIATE} Intermediate questions are available.`);
      return;
    }
    if (difficult > inventory.totals.DIFFICULT) {
      setError(`Only ${inventory.totals.DIFFICULT} Difficult questions are available.`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await generateAssignment({
        title: title.trim() || autoTitle,
        instructions: instructions || null,
        courseId: Number(courseId),
        moduleIds: selectedModules,
        preset,
        easyCount: easy,
        intermediateCount: intermediate,
        difficultCount: difficult,
        distribution,
        academicYearId: academicYearId ? Number(academicYearId) : null,
        programId: programId ? Number(programId) : null,
        semesterId: semesterId ? Number(semesterId) : null,
        departmentId: departmentId ? Number(departmentId) : course?.department_id ?? null,
        classSectionId: classSectionId ? Number(classSectionId) : null,
        passPercentage: Number(passPercentage) || 40,
        attemptsAllowed: Number(attempts) || 1,
        showMarksImmediately: false,
        showFeedbackAfterEvaluation: true,
        solutionReleasePolicy: 'MANUAL_RELEASE',
        lateSubmissionAllowed: lateAllowed,
        lateDeadlineAt: lateAllowed && lateDeadline ? zonedLocalToUtcIso(lateDeadline, tz) : null,
        startAt: startAt ? zonedLocalToUtcIso(startAt, tz) : null,
        dueAt: dueAt ? zonedLocalToUtcIso(dueAt, tz) : null,
        // Criteria only — generator picks bank IDs server-side
      });
      toast('Assignment generated — review questions before publishing');
      navigate(`/assignments/${res.assignment.id}?tab=questions`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Create Assignment"
        subtitle="Generate a balanced descriptive assignment from the Assignment Question Bank."
      />

      <form onSubmit={generate}>
        <Surface className="max-w-3xl space-y-5">
          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-secondary">Academic context</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Academic year" optional>
                <Select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}>
                  <option value="">Select year</option>
                  {(lookups?.academicYears || []).map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Program" optional>
                <Select value={programId} onChange={(e) => setProgramId(e.target.value)}>
                  <option value="">Select program</option>
                  {(lookups?.programs || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Semester" optional>
                <Select value={semesterId} onChange={(e) => setSemesterId(e.target.value)}>
                  <option value="">Select semester</option>
                  {(lookups?.semesters || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Section" optional>
                <Select value={classSectionId} onChange={(e) => setClassSectionId(e.target.value)}>
                  <option value="">Select section</option>
                  {(lookups?.sections || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Department" optional>
                <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                  <option value="">Select department</option>
                  {(lookups?.departments || []).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Subject">
                <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
                  <option value="">Select subject</option>
                  {(lookups?.courses || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

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
                    {m.questionCount != null ? (
                      <span className="text-xs text-ink-muted">{m.questionCount} questions</span>
                    ) : null}
                  </label>
                ))}
                {!modules.length ? (
                  <p className="text-sm text-ink-muted">No modules in the Assignment Bank for this subject yet.</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {courseId && selectedModules.length ? (
            <>
              <div className="flex flex-wrap gap-2">
                {PRESET_ORDER.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => applyPreset(id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      preset === id ? 'bg-ink text-white' : 'bg-surface-muted text-ink-secondary'
                    }`}
                  >
                    {GENERATOR_PRESET_META[id].label}
                  </button>
                ))}
              </div>

              <Field label="Question type filter" optional>
                <Select value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
                  <option value="">Any type (recommended)</option>
                  {ASSIGNMENT_QUESTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {ASSIGNMENT_QUESTION_TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </Field>
              {questionType ? (
                <p className="text-xs text-ink-muted">
                  Type preference is shown for planning; generation uses difficulty mix across selectable bank
                  questions.
                </p>
              ) : null}

              <div>
                <p className="mb-2 text-[13px] font-medium text-ink-secondary">Question mix</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <MixStepper
                    label="Easy"
                    value={easy}
                    available={inventory.totals.EASY}
                    onChange={setEasy}
                    disabled={mixLocked}
                  />
                  <MixStepper
                    label="Intermediate"
                    value={intermediate}
                    available={inventory.totals.INTERMEDIATE}
                    onChange={setIntermediate}
                    disabled={mixLocked}
                  />
                  <MixStepper
                    label="Difficult"
                    value={difficult}
                    available={inventory.totals.DIFFICULT}
                    onChange={setDifficult}
                    disabled={mixLocked}
                  />
                </div>
                <p className="mt-3 text-sm font-medium text-ink">{totalQuestions} questions</p>
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

              <button
                type="button"
                className="text-xs font-medium text-accent"
                onClick={() => setShowAdvanced((v) => !v)}
              >
                {showAdvanced ? 'Hide extra settings' : 'More settings'}
              </button>

              {showAdvanced ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Assignment title" optional>
                    <Input value={title} placeholder={autoTitle} onChange={(e) => setTitle(e.target.value)} />
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
                  <Field label="Due" optional>
                    <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
                  </Field>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={lateAllowed}
                        onChange={(e) => setLateAllowed(e.target.checked)}
                      />
                      Allow late submission
                    </label>
                    {lateAllowed ? (
                      <Field label="Late deadline">
                        <Input
                          type="datetime-local"
                          value={lateDeadline}
                          onChange={(e) => setLateDeadline(e.target.value)}
                        />
                      </Field>
                    ) : null}
                    <Field label="Instructions" optional>
                      <Textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Answer in your own words. Paste from documents is supported."
                      />
                    </Field>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => navigate('/assignments')}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !courseId || !selectedModules.length || totalQuestions < 1}
            >
              {loading ? 'Generating…' : `Generate Assignment (${totalQuestions})`}
            </Button>
          </div>
        </Surface>
      </form>
    </div>
  );
}
