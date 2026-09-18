import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, Field, Input, PageHeader, Select, Surface, Textarea, useToast } from '../../components/ui';
import { cn } from '../../lib/utils';
import type { CopoCatalog } from '../../types/copo';

const STEPS = [
  { id: 'SETUP', label: 'Setup' },
  { id: 'PORTIONS', label: 'Portions' },
  { id: 'PATTERN', label: 'Pattern' },
  { id: 'BLUEPRINT', label: 'Blueprint' },
  { id: 'QUESTIONS', label: 'Questions' },
  { id: 'SCHEME', label: 'Scheme & Solution' },
  { id: 'REVIEW', label: 'Review' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

type Topic = { id: number; name: string; selected: boolean; hours: number };
type Module = {
  id: number;
  name: string;
  selected: boolean;
  coveragePercent: number;
  completed: boolean;
  hours: number;
  coCode: string | null;
  topics: Topic[];
};

type Preview = {
  course?: {
    name: string;
    code: string;
    scheme?: string | null;
    courseType?: string | null;
    courseTypeLabel?: string | null;
    faculty?: string | null;
    department?: string | null;
    credits?: number | null;
  };
  examOptions?: Array<{ value: string; label: string; maxMarks?: number | null }>;
  cos?: Array<{ code: string; statement?: string | null; bloomsLevel?: string | null }>;
  portions?: { modules: Module[]; coverageWarning: boolean; coverageWarningMessage: string | null; incompleteModules?: Array<{ name: string; coveragePercent: number }> };
  pattern?: { code: string; name: string; requiredAnswerMarks: number; sections: Array<{ key: string; label: string; requiredMarks: number; allowedSplits: number[][]; defaultSplit: number[] }> };
  eligibleQuestionCount?: number | null;
  blueprint: {
    maxMarks: number;
    requiredAnswerMarks?: number;
    durationMinutes: number | null;
    patternLabel: string;
    coTargets: Array<{ coCode: string; marks: number }>;
    moduleTargets?: Array<{ moduleId: number | null; moduleName: string; marks: number; coCode?: string | null }>;
    rbtTargets?: Array<{ level: string; marks: number }>;
  };
};

type Detail = {
  paper: {
    id: number;
    title: string;
    subjectName: string;
    courseCode: string;
    examType: string;
    examTypeLabel?: string;
    status: string;
    maxMarks: number;
    requiredAnswerMarks?: number;
    printedMarks?: number;
    durationMinutes?: number | null;
    examDate?: string | null;
    workflowStep?: StepId;
    academicYearLabel?: string | null;
    academicYearId?: number | null;
    programId?: number | null;
    programName?: string | null;
    semesterId?: number | null;
    semesterLabel?: string | null;
    facultyName?: string | null;
    departmentName?: string | null;
    courseType?: string | null;
    courseId?: number;
  };
  blueprint: Preview['blueprint'] & {
    selectedModuleIds?: number[];
    selectedTopicIds?: number[] | null;
    allowOrChoices?: boolean;
    slots?: Array<{ key: string; questionNumber: number; subLetter?: string | null; marks: number; moduleName?: string | null; coCode?: string | null }>;
  };
  items: Array<{
    id: number;
    questionNumber: number;
    subLetter?: string | null;
    orAlternative?: string | null;
    questionText: string;
    maxMarks: number;
    moduleOrUnit?: string | null;
    primaryCo?: string | null;
    rbtLevel?: string | null;
    bloomLevel?: string | null;
    sourceKind: string;
    provenance?: { sourceBadge?: string | null; fallbackReason?: string | null } | null;
    scheme?: Array<{ code?: string; label: string; maxMarks: number }>;
    modelAnswer?: string | null;
    expectedKeyPoints?: string | null;
  }>;
  validation: { ok: boolean; errors: string[] };
  paperValidation?: {
    canFinalize: boolean;
    issues: Array<{ severity: string; message: string; questionLabel?: string | null }>;
    requiredAnswerMarks: number;
    printedMarks: number;
  };
  coverage: {
    totalMarks: number;
    byCo: Array<{ coCode: string; marks: number }>;
    byModule?: Array<{ moduleName: string; marks: number }>;
    byRbt?: Array<{ level: string; marks: number }>;
  };
  orBalance?: Array<{ groupId: string; marksBalanced: boolean; coCompatible: boolean; rbtCompatible: boolean; difficultyCompatible: boolean; ok: boolean }>;
  sourceSummary?: {
    total: number;
    vtuSeePyq: number;
    moduleQuestionBank: number;
    seeComponents?: number;
    moduleBankComponents?: number;
    label: string;
    fallbackReasons: string[];
  };
  draftSavedAt?: string | null;
};

type EligibleQuestion = {
  id: number;
  kind: string;
  questionText: string;
  marks: number;
  moduleName?: string | null;
  coCode?: string | null;
  rbtLevel?: string | null;
  examYear?: number | null;
  examType?: string | null;
  timesPreviouslyUsed?: number;
  appearanceCount?: number;
  sourceKind?: string | null;
  sourceBadge?: string | null;
};

function sourceBadgeForItem(item: { sourceKind?: string | null; provenance?: { sourceBadge?: string | null } | null }) {
  if (item.provenance?.sourceBadge) return item.provenance.sourceBadge;
  const s = String(item.sourceKind || '').toUpperCase();
  if (s === 'MODULE_QUESTION_BANK') return 'Module Question Bank';
  if (s === 'VTU_SEE_PYQ') return 'VTU SEE';
  return null;
}

function stepIndex(id: StepId) {
  return STEPS.findIndex((s) => s.id === id);
}

export function CreateInternalPaperPage() {
  useDocumentTitle('Create Internal Question Paper');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id: routeId } = useParams();
  const [params] = useSearchParams();
  const [catalog, setCatalog] = useState<CopoCatalog | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [paperId, setPaperId] = useState<number | null>(routeId ? Number(routeId) : null);
  const [step, setStep] = useState<StepId>('SETUP');
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [replacements, setReplacements] = useState<Record<number, EligibleQuestion[]>>({});
  const [eligibleBank, setEligibleBank] = useState<{
    count: number;
    reviewCount: number;
    questions: EligibleQuestion[];
    needsReview: Array<{ id: number; questionText: string; verificationStatus?: string | null }>;
  } | null>(null);
  const [coverageGap, setCoverageGap] = useState<{
    seeCandidates?: number;
    moduleBankCandidates?: number;
    required?: number;
    slotLabel?: string | null;
    moduleName?: string | null;
    reason?: string | null;
    suggestedActions?: string[];
    eligibleQuestions?: number;
    availableUsableMarks?: number;
  } | null>(null);
  const [form, setForm] = useState({
    academicYearId: '',
    programId: '',
    semesterId: '',
    courseId: '',
    examType: 'IA-1',
    examDate: '',
  });
  const [includeOr, setIncludeOr] = useState(true);
  const [buildMode, setBuildMode] = useState<'GENERATE' | 'MANUAL' | 'HYBRID'>('GENERATE');

  const loadCatalogYear = form.academicYearId;

  useEffect(() => {
    let cancelled = false;
    const qs = loadCatalogYear ? `?academicYearId=${loadCatalogYear}` : '';
    api<CopoCatalog>(`/api/question-papers/catalog${qs}`)
      .then((c) => {
        if (cancelled) return;
        setCatalog(c);
        setForm((f) => {
          if (f.academicYearId) return f;
          const year = c.academicYears.find((y) => y.isCurrent) ?? c.academicYears[0];
          return year ? { ...f, academicYearId: String(year.id) } : f;
        });
      })
      .catch((e) => {
        if (!cancelled) toast(e instanceof Error ? e.message : 'Could not load catalog', 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [loadCatalogYear, toast]);

  const loadDetail = useCallback(
    async (id: number) => {
      const d = await api<Detail>(`/api/question-papers/internal/${id}`);
      setDetail(d);
      setSavedAt(d.draftSavedAt || null);
      if (d.paper.workflowStep) setStep(d.paper.workflowStep);
      if (d.blueprint?.allowOrChoices) setIncludeOr(true);
      setForm((f) => ({
        academicYearId: d.paper.academicYearId ? String(d.paper.academicYearId) : f.academicYearId,
        programId: d.paper.programId ? String(d.paper.programId) : f.programId,
        semesterId: d.paper.semesterId ? String(d.paper.semesterId) : f.semesterId,
        courseId: d.paper.courseId ? String(d.paper.courseId) : f.courseId,
        examType: d.paper.examType || f.examType,
        examDate: d.paper.examDate ? String(d.paper.examDate).slice(0, 10) : f.examDate,
      }));
      return d;
    },
    [],
  );

  useEffect(() => {
    if (paperId) loadDetail(paperId).catch((e) => toast(e instanceof Error ? e.message : 'Could not load draft', 'error'));
  }, [paperId, loadDetail, toast]);

  const subjects = useMemo(() => {
    return (catalog?.subjects || []).filter((s) => {
      if (!form.semesterId || !form.programId) return false;
      if (s.programs?.length && !s.programs.some((p) => String(p.id) === form.programId)) return false;
      if (String(s.semesterId || '') !== form.semesterId) return false;
      return true;
    });
  }, [catalog, form.programId, form.semesterId]);

  useEffect(() => {
    if (!form.courseId || !form.academicYearId) {
      setPreview(null);
      return;
    }
    api<Preview>('/api/question-papers/internal/preview', {
      method: 'POST',
      body: JSON.stringify({
        courseId: Number(form.courseId),
        academicYearId: Number(form.academicYearId),
        programId: form.programId ? Number(form.programId) : null,
        semesterId: form.semesterId ? Number(form.semesterId) : null,
        examType: form.examType,
        examDate: form.examDate || null,
        mode: 'MANUAL',
        selectedModuleIds: preview?.portions?.modules.filter((m) => m.selected).map((m) => m.id),
      }),
    })
      .then(setPreview)
      .catch(() => setPreview(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.courseId, form.academicYearId, form.programId, form.semesterId, form.examType]);

  const modules = preview?.portions?.modules || [];
  const selectedModules = modules.filter((m) => m.selected);
  const headerBits = [
    preview?.course ? `${preview.course.name} • ${preview.course.code}` : detail ? `${detail.paper.subjectName} • ${detail.paper.courseCode}` : null,
    (preview && form.examType) || detail?.paper.examTypeLabel || detail?.paper.examType,
    detail || preview ? `${detail?.paper.requiredAnswerMarks || preview?.blueprint.requiredAnswerMarks || 50} Marks` : null,
    selectedModules.length ? `Modules ${selectedModules.map((m) => m.name.replace(/^Module\s+/i, 'M')).join(' & ')}` : null,
  ].filter(Boolean);

  const markSaved = () => setSavedAt(new Date().toISOString());

  const patch = async (body: Record<string, unknown>) => {
    if (!paperId) return;
    const d = await api<Detail>(`/api/question-papers/internal/${paperId}`, { method: 'PATCH', body: JSON.stringify(body) });
    setDetail(d);
    markSaved();
    return d;
  };

  const refreshPreviewWithScope = async (next: Module[]) => {
    if (!form.courseId) return;
    const p = await api<Preview>('/api/question-papers/internal/preview', {
      method: 'POST',
      body: JSON.stringify({
        courseId: Number(form.courseId),
        academicYearId: Number(form.academicYearId),
        programId: form.programId ? Number(form.programId) : null,
        semesterId: form.semesterId ? Number(form.semesterId) : null,
        examType: form.examType,
        mode: 'MANUAL',
        includeOr,
        selectedModuleIds: next.filter((m) => m.selected).map((m) => m.id),
        selectedTopicIds: next.flatMap((m) => m.topics.filter((t) => t.selected).map((t) => t.id)),
      }),
    });
    setPreview(p);
  };

  const onSetupContinue = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.courseId) return;
    setBusy(true);
    try {
      if (!paperId) {
        const created = await api<Detail>('/api/question-papers/internal', {
          method: 'POST',
          body: JSON.stringify({
            courseId: Number(form.courseId),
            academicYearId: Number(form.academicYearId),
            programId: form.programId ? Number(form.programId) : null,
            semesterId: form.semesterId ? Number(form.semesterId) : null,
            examType: form.examType,
            examDate: form.examDate || null,
            mode: 'MANUAL',
            workflowStep: 'PORTIONS',
            seedPreviousYearQuestionId: params.get('useQuestion') ? Number(params.get('useQuestion')) : null,
          }),
        });
        setPaperId(created.paper.id);
        setDetail(created);
        markSaved();
        navigate(`/internal-question-papers/${created.paper.id}/edit`, { replace: true });
      } else {
        await patch({ examDate: form.examDate || null, workflowStep: 'PORTIONS' });
      }
      setStep('PORTIONS');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save setup', 'error');
    } finally {
      setBusy(false);
    }
  };

  const onPortionsContinue = async (force = false) => {
    if (!selectedModules.length) {
      toast('Select the modules included in this internal', 'error');
      return;
    }
    if (preview?.portions?.coverageWarning && !force) {
      setCoverageOpen(true);
      return;
    }
    setBusy(true);
    try {
      await patch({
        selectedModuleIds: selectedModules.map((m) => m.id),
        selectedTopicIds: selectedModules.flatMap((m) => m.topics.filter((t) => t.selected).map((t) => t.id)),
        coverageWarningAcknowledged: force || !preview?.portions?.coverageWarning,
        workflowStep: 'PATTERN',
      });
      setCoverageOpen(false);
      setStep('PATTERN');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save portions', 'error');
    } finally {
      setBusy(false);
    }
  };

  const go = async (next: StepId, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    try {
      await patch({ workflowStep: next, includeOr, buildMode, ...extra });
      setStep(next);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save', 'error');
    } finally {
      setBusy(false);
    }
  };

  const generate = async () => {
    if (!paperId) return;
    setBusy(true);
    try {
      await patch({ includeOr, buildMode, workflowStep: 'QUESTIONS' });
      if (buildMode === 'MANUAL') {
        const bank = await api<NonNullable<typeof eligibleBank>>(`/api/question-papers/internal/${paperId}/eligible`);
        setEligibleBank(bank);
        toast(`${bank.count} eligible previous-year questions in this syllabus scope`, 'success');
        return;
      }
      const d = await api<Detail>(`/api/question-papers/internal/${paperId}/generate`, {
        method: 'POST',
        body: JSON.stringify({ mode: buildMode, includeOr }),
      });
      setDetail(d);
      setCoverageGap(null);
      markSaved();
      toast('Question paper generated', 'success');
    } catch (err) {
      const e = err as Error & {
        code?: string;
        details?: {
          seeCandidates?: number;
          moduleBankCandidates?: number;
          required?: number;
          slotLabel?: string | null;
          moduleName?: string | null;
          reason?: string | null;
          suggestedActions?: string[];
          eligibleQuestions?: number;
          availableUsableMarks?: number;
        };
      };
      if (
        e.code === 'INSUFFICIENT_QUESTION_COVERAGE' ||
        e.code === 'INSUFFICIENT_PYQ_COVERAGE' ||
        /Insufficient Question Coverage|Insufficient PYQ Coverage|Insufficient eligible/i.test(e.message)
      ) {
        setCoverageGap(e.details || {});
      }
      toast(e.message || 'Generation failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const generateSchemes = async () => {
    if (!paperId) return;
    setBusy(true);
    try {
      const d = await api<Detail>(`/api/question-papers/internal/${paperId}/schemes/generate`, { method: 'POST' });
      setDetail(d);
      markSaved();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not generate scheme', 'error');
    } finally {
      setBusy(false);
    }
  };

  const finalize = async () => {
    if (!paperId) return;
    setBusy(true);
    try {
      await api(`/api/question-papers/internal/${paperId}/finalize`, { method: 'POST' });
      toast('Internal paper finalized', 'success');
      navigate(`/internal-question-papers/${paperId}`);
    } catch (err) {
      const e = err as Error & { details?: { issues?: Array<{ message: string }> } };
      toast(e.details?.issues?.[0]?.message || e.message || 'Finalization blocked', 'error');
      await loadDetail(paperId);
    } finally {
      setBusy(false);
    }
  };

  const idx = stepIndex(step);
  const critical = detail?.paperValidation?.issues.filter((i) => i.severity === 'CRITICAL') || detail?.validation.errors.map((message) => ({ message, severity: 'CRITICAL' })) || [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        breadcrumb={
          <Link to="/internal-question-papers" className="hover:text-accent">
            Internal Question Papers
          </Link>
        }
        title="Create Internal Question Paper"
        subtitle="Academic decisions first. The system filters the bank, maps outcomes, and checks the paper."
        actions={
          savedAt ? <span className="text-xs text-ink-muted">Draft saved</span> : null
        }
      />

      {headerBits.length ? (
        <p className="mb-4 text-sm font-medium text-ink-secondary">{headerBits.join(' · ')}</p>
      ) : null}

      <ol className="mb-6 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              disabled={i > idx && !paperId}
              onClick={() => i <= idx && setStep(s.id)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium',
                s.id === step ? 'bg-accent text-white' : i < idx ? 'bg-accent/15 text-accent' : 'bg-surface-muted text-ink-muted',
              )}
            >
              {i + 1} {s.label}
            </button>
          </li>
        ))}
      </ol>

      {step === 'SETUP' ? (
        <form onSubmit={onSetupContinue} className="grid gap-6 lg:grid-cols-2">
          <Surface className="space-y-3">
            <Field label="Academic Year">
              <Select value={form.academicYearId} onChange={(e) => setForm((f) => ({ ...f, academicYearId: e.target.value }))} required>
                <option value="">Select</option>
                {(catalog?.academicYears || []).map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Internal Examination">
              <Select value={form.examType} onChange={(e) => setForm((f) => ({ ...f, examType: e.target.value }))}>
                {(preview?.examOptions?.length
                  ? preview.examOptions
                  : [
                      { value: 'IA-1', label: 'Internal Assessment 1' },
                      { value: 'IA-2', label: 'Internal Assessment 2' },
                      { value: 'IA-3', label: 'Internal Assessment 3' },
                    ]
                ).map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Examination Date">
              <Input type="date" value={form.examDate} onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))} />
            </Field>
            <Field label="Semester">
              <Select value={form.semesterId} onChange={(e) => setForm((f) => ({ ...f, semesterId: e.target.value, courseId: '' }))}>
                <option value="">Select</option>
                {(catalog?.semesters || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label || `Semester ${s.number}`}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Branch / Programme">
              <Select value={form.programId} onChange={(e) => setForm((f) => ({ ...f, programId: e.target.value, courseId: '' }))}>
                <option value="">Select</option>
                {(catalog?.programs || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code ? `${p.code} — ${p.name}` : p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Subject">
              <Select value={form.courseId} onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))} required>
                <option value="">
                  {!form.semesterId || !form.programId ? 'Select semester and branch first' : 'Select subject'}
                </option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.code}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" disabled={busy || !form.courseId}>
              Continue to portions
            </Button>
          </Surface>
          <Surface>
            <h2 className="mb-3 font-semibold">Subject master</h2>
            {preview?.course ? (
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-ink-muted">Subject code</dt>
                <dd>{preview.course.code}</dd>
                <dt className="text-ink-muted">Scheme</dt>
                <dd>{preview.course.scheme || '—'}</dd>
                <dt className="text-ink-muted">Course type</dt>
                <dd>{preview.course.courseTypeLabel || preview.course.courseType || '—'}</dd>
                <dt className="text-ink-muted">Faculty</dt>
                <dd>{preview.course.faculty || '—'}</dd>
                <dt className="text-ink-muted">Department</dt>
                <dd>{preview.course.department || '—'}</dd>
              </dl>
            ) : (
              <p className="text-sm text-ink-muted">Select academic year, semester, branch and subject. The question bank is not shown yet.</p>
            )}
            {preview?.cos?.length ? (
              <div className="mt-4">
                <p className="text-xs font-semibold">Course outcomes</p>
                <ul className="mt-1 space-y-1 text-xs text-ink-secondary">
                  {preview.cos.map((c) => (
                    <li key={c.code}>
                      <strong>{c.code}</strong> {c.statement}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Surface>
        </form>
      ) : null}

      {step === 'PORTIONS' ? (
        <div className="space-y-4">
          <Surface>
            <h2 className="mb-1 font-semibold">Select modules covered</h2>
            <p className="mb-4 text-sm text-ink-muted">
              SkillOnX queries only READY previous-year questions from the selected module banks (Module 1 = historical Q1/Q2, Module 2 = Q3/Q4, and so on). Cross-module questions are rejected on the server.
            </p>
            <div className="space-y-4">
              {modules.map((m) => (
                <div key={m.id} className="rounded-lg border border-border p-3">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={m.selected}
                      onChange={(e) => {
                        const next = modules.map((x) =>
                          x.id === m.id
                            ? { ...x, selected: e.target.checked, topics: x.topics.map((t) => ({ ...t, selected: e.target.checked })) }
                            : x,
                        );
                        setPreview((p) => (p?.portions ? { ...p, portions: { ...p.portions, modules: next } } : p));
                        void refreshPreviewWithScope(next);
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">
                          {m.name}
                          {m.coCode ? <span className="ml-2 text-xs text-ink-muted">{m.coCode}</span> : null}
                        </p>
                        <span className={cn('text-xs', m.completed ? 'text-accent' : m.coveragePercent >= 80 ? 'text-ink-secondary' : 'text-warning')}>
                          Coverage {m.coveragePercent}% {m.completed ? 'Completed ✓' : ''}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted">{m.hours} teaching hours</p>
                      {m.selected ? (
                        <button
                          type="button"
                          className="mt-2 text-xs text-accent"
                          onClick={() =>
                            setExpandedModules((ids) => (ids.includes(m.id) ? ids.filter((id) => id !== m.id) : [...ids, m.id]))
                          }
                        >
                          {expandedModules.includes(m.id) ? 'Hide topics' : 'Adjust topics'}
                        </button>
                      ) : null}
                      {(m.selected && (expandedModules.includes(m.id) || !m.topics.every((t) => t.selected))) ? (
                        <ul className="mt-2 space-y-1 text-sm">
                          {m.topics.map((t) => (
                            <li key={t.id}>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={t.selected}
                                  onChange={(e) => {
                                    const next = modules.map((x) =>
                                      x.id === m.id
                                        ? { ...x, topics: x.topics.map((tt) => (tt.id === t.id ? { ...tt, selected: e.target.checked } : tt)) }
                                        : x,
                                    );
                                    setPreview((p) => (p?.portions ? { ...p, portions: { ...p.portions, modules: next } } : p));
                                    void refreshPreviewWithScope(next);
                                  }}
                                />
                                {t.name}
                              </label>
                            </li>
                          ))}
                        </ul>
                      ) : m.topics.length ? (
                        <p className="mt-1 text-xs text-ink-muted">Topics: {m.topics.map((t) => t.name).join(' · ')}</p>
                      ) : null}
                    </div>
                  </label>
                </div>
              ))}
            </div>
            {preview?.eligibleQuestionCount != null ? (
              <p className="mt-3 text-sm">{preview.eligibleQuestionCount} eligible questions available in the selected scope.</p>
            ) : null}
          </Surface>
          {coverageOpen ? (
            <Surface className="border-warning/40">
              <p className="font-medium">Some selected portions are not yet marked as delivered in the Lesson Plan.</p>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {(preview?.portions?.incompleteModules || []).map((m) => (
                  <li key={m.name}>
                    {m.name} — {m.coveragePercent}%
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setCoverageOpen(false)}>
                  Review coverage
                </Button>
                <Button type="button" disabled={busy} onClick={() => onPortionsContinue(true)}>
                  Continue anyway
                </Button>
              </div>
            </Surface>
          ) : (
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setStep('SETUP')}>
                Back
              </Button>
              <Button type="button" disabled={busy} onClick={() => onPortionsContinue(false)}>
                Continue to pattern
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {step === 'PATTERN' ? (
        <div className="space-y-4">
          <Surface>
            <h2 className="mb-3 font-semibold">{preview?.pattern?.name || 'STANDARD IA — 50 MARKS'}</h2>
            <p className="mb-4 text-sm">Student must answer 3 main questions. Required answer marks 50. Printed marks may be higher if OR choices are included.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {(preview?.pattern?.sections || [
                { key: 'Q1', label: 'Question 1', requiredMarks: 20 },
                { key: 'Q2', label: 'Question 2', requiredMarks: 20 },
                { key: 'Q3', label: 'Question 3', requiredMarks: 10 },
              ]).map((s) => (
                <div key={s.key} className="rounded-lg border border-border p-4 text-center">
                  <p className="text-xs text-ink-muted">{s.label}</p>
                  <p className="text-2xl font-semibold">{s.requiredMarks}</p>
                  <p className="text-xs">Marks</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm font-medium">20 + 20 + 10 = 50</p>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeOr} onChange={(e) => setIncludeOr(e.target.checked)} />
              Include OR alternatives (printed marks may exceed 50)
            </label>
          </Surface>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep('PORTIONS')}>
              Back
            </Button>
            <Button type="button" disabled={busy} onClick={() => go('BLUEPRINT', { includeOr })}>
              Continue to blueprint
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'BLUEPRINT' ? (
        <div className="space-y-4">
          <Surface>
            <h2 className="mb-3 font-semibold">Internal Assessment Blueprint</h2>
            <p className="text-sm">
              {detail?.paper.subjectName || preview?.course?.name} — {detail?.paper.courseCode || preview?.course?.code}
            </p>
            <p className="text-sm text-ink-muted">
              Scope: {selectedModules.map((m) => m.name).join(', ') || (detail?.blueprint.moduleTargets || []).map((m) => m.moduleName).join(', ')}
            </p>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="py-1">Question</th>
                  <th>Marks</th>
                  <th>Module</th>
                  <th>CO</th>
                  <th>RBT</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((n) => {
                  const slots = (detail?.blueprint.slots || []).filter((s) => s.questionNumber === n && !String(s.key).includes('-B'));
                  if (!slots.length) {
                    const marks = n === 3 ? 10 : 20;
                    return (
                      <tr key={n}>
                        <td className="py-1">Q{n}</td>
                        <td>{marks}</td>
                        <td>—</td>
                        <td>—</td>
                        <td>L2/L3</td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={n}>
                      <td className="py-1">Q{n}</td>
                      <td>{slots.reduce((sum, s) => sum + s.marks, 0)}</td>
                      <td>{[...new Set(slots.map((s) => s.moduleName).filter(Boolean))].join(' / ') || '—'}</td>
                      <td>{[...new Set(slots.map((s) => s.coCode).filter(Boolean))].join(' / ') || '—'}</td>
                      <td>L2/L3</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Surface>
          <div className="grid gap-4 lg:grid-cols-2">
            <Surface>
              <h3 className="mb-2 text-sm font-semibold">Module distribution</h3>
              {(detail?.blueprint.moduleTargets || []).map((m) => (
                <div key={m.moduleName} className="mb-2">
                  <div className="flex justify-between text-xs">
                    <span>{m.moduleName}</span>
                    <span>{m.marks} marks</span>
                  </div>
                  <div className="h-2 rounded bg-surface-muted">
                    <div className="h-2 rounded bg-accent" style={{ width: `${(m.marks / (detail?.paper.maxMarks || 50)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </Surface>
            <Surface>
              <h3 className="mb-2 text-sm font-semibold">CO coverage</h3>
              {(detail?.blueprint.coTargets || []).map((c) => (
                <div key={c.coCode} className="mb-2">
                  <div className="flex justify-between text-xs">
                    <span>{c.coCode}</span>
                    <span>{c.marks} marks</span>
                  </div>
                  <div className="h-2 rounded bg-surface-muted">
                    <div className="h-2 rounded bg-accent" style={{ width: `${(c.marks / (detail?.paper.maxMarks || 50)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </Surface>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep('PATTERN')}>
              Back
            </Button>
            <Button type="button" disabled={busy} onClick={() => go('QUESTIONS')}>
              Continue to questions
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'QUESTIONS' ? (
        <div className="space-y-4">
          <Surface>
            <h2 className="mb-3 font-semibold">Build Question Paper</h2>
            <div className="flex flex-wrap gap-2">
              {(['GENERATE', 'MANUAL'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setBuildMode(m)}
                  className={cn('rounded-full px-3 py-1 text-xs', buildMode === m ? 'bg-accent text-white' : 'bg-surface-muted')}
                >
                  {m === 'GENERATE' ? 'Build from PYQ Bank' : 'Select from PYQ Bank'}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Button type="button" disabled={busy} onClick={generate}>
                {buildMode === 'MANUAL' ? 'Browse eligible PYQ bank' : 'Build from PYQ Bank'}
              </Button>
            </div>
            {coverageGap ? (
              <div className="mt-3 rounded-md border border-warning/40 bg-warning/5 p-3 text-sm">
                <p className="font-semibold">Insufficient Question Coverage</p>
                {coverageGap.moduleName || coverageGap.slotLabel ? (
                  <p className="mt-1 text-ink-muted">
                    {coverageGap.moduleName ? `Module: ${coverageGap.moduleName}` : null}
                    {coverageGap.moduleName && coverageGap.slotLabel ? ' · ' : null}
                    {coverageGap.slotLabel ? `Required: ${coverageGap.slotLabel}` : null}
                  </p>
                ) : (
                  <p className="mt-1 text-ink-muted">Neither VTU SEE PYQ nor the Module Question Bank can satisfy the required slot.</p>
                )}
                <p className="mt-1">
                  SEE eligible: {coverageGap.seeCandidates ?? coverageGap.eligibleQuestions ?? '—'} · Module Question Bank eligible:{' '}
                  {coverageGap.moduleBankCandidates ?? '—'} · Required marks: {coverageGap.required ?? '—'}
                </p>
                {coverageGap.reason ? <p className="mt-1 text-xs text-ink-muted">{coverageGap.reason}</p> : null}
                <ul className="mt-2 list-disc pl-5 text-xs text-ink-muted">
                  {(coverageGap.suggestedActions || [
                    'Add / review Module Question Bank questions for the selected module',
                    'Load additional VTU SEE previous-year papers',
                    'Review pending extracted questions',
                  ]).map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Surface>
          {eligibleBank ? (
            <Surface>
              <h3 className="mb-2 text-sm font-semibold">
                Eligible previous-year questions ({eligibleBank.count})
              </h3>
              {eligibleBank.reviewCount ? (
                <p className="mb-2 text-xs text-warning">
                  {eligibleBank.reviewCount} questions in scope need faculty verification (CO_MAPPING_BLOCKED / NEEDS_REVIEW / incomplete scheme or solution) and cannot be used until ready.
                </p>
              ) : null}
              <ul className="space-y-2">
                {eligibleBank.questions.map((q) => (
                  <li key={`${q.kind}-${q.id}`} className="rounded border border-border p-2 text-sm">
                    <p>{q.questionText}</p>
                    <p className="text-xs text-ink-muted">
                      {q.examType || 'PYQ'} {q.examYear || ''} · {q.marks} marks · {q.moduleName} · {q.coCode} · {q.rbtLevel} · asked {q.timesPreviouslyUsed ?? q.appearanceCount ?? 1} times
                    </p>
                    <Button
                      size="sm"
                      className="mt-1"
                      disabled={busy}
                      onClick={async () => {
                        if (!paperId) return;
                        setBusy(true);
                        try {
                          const d = await api<Detail>(`/api/question-papers/internal/${paperId}/add`, {
                            method: 'POST',
                            body: JSON.stringify({ kind: q.kind, id: q.id }),
                          });
                          setDetail(d);
                          markSaved();
                        } catch (err) {
                          toast(err instanceof Error ? err.message : 'Could not add question', 'error');
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Add to paper
                    </Button>
                  </li>
                ))}
              </ul>
            </Surface>
          ) : null}
          {detail?.sourceSummary && detail.items.length ? (
            <Surface>
              <h3 className="mb-1 text-sm font-semibold">Question Selection Summary</h3>
              <p className="text-sm">
                VTU SEE: {detail.sourceSummary.seeComponents ?? detail.sourceSummary.vtuSeePyq} components · Module Question Bank:{' '}
                {detail.sourceSummary.moduleBankComponents ?? detail.sourceSummary.moduleQuestionBank} components
              </p>
              {detail.sourceSummary.fallbackReasons.length ? (
                <ul className="mt-2 list-disc pl-5 text-xs text-ink-muted">
                  {detail.sourceSummary.fallbackReasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              ) : null}
            </Surface>
          ) : null}
          {(detail?.items || []).map((item) => (
            <Surface key={item.id}>
              <p className="text-xs text-ink-muted">
                Q{item.questionNumber}
                {item.subLetter ? `(${item.subLetter})` : ''}
                {item.orAlternative === 'B' ? ' OR' : ''} · {item.maxMarks} Marks · {item.moduleOrUnit} · {item.primaryCo} ·{' '}
                {item.rbtLevel || item.bloomLevel}
                {sourceBadgeForItem(item) ? ` · ${sourceBadgeForItem(item)}` : ''}
              </p>
              <p className="mt-1 text-sm">{item.questionText}</p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={async () => {
                    if (!paperId) return;
                    const r = await api<{
                      alternatives: Array<{
                        id: number;
                        kind: string;
                        questionText: string;
                        marks: number;
                        moduleName?: string | null;
                        coCode?: string | null;
                        rbtLevel?: string | null;
                        examYear?: number | null;
                        examType?: string | null;
                        timesPreviouslyUsed?: number;
                        appearanceCount?: number;
                        sourceBadge?: string | null;
                        sourceKind?: string | null;
                      }>;
                    }>(`/api/question-papers/internal/${paperId}/items/${item.id}/replacements`);
                    setReplacements((prev) => ({ ...prev, [item.id]: r.alternatives }));
                  }}
                >
                  Replace question
                </Button>
              </div>
              {replacements[item.id]?.length ? (
                <ul className="mt-2 space-y-2 text-sm">
                  {replacements[item.id].map((alt) => (
                    <li key={`${alt.kind}-${alt.id}`} className="rounded border border-border p-2">
                      <p>{alt.questionText}</p>
                      <p className="text-xs text-ink-muted">
                        {alt.sourceBadge || alt.examType || 'PYQ'} {alt.examYear || ''} · {alt.marks} marks · {alt.moduleName} · {alt.coCode} ·{' '}
                        {alt.rbtLevel} · asked {alt.timesPreviouslyUsed ?? alt.appearanceCount ?? 1} times
                      </p>
                      <Button
                        size="sm"
                        className="mt-1"
                        disabled={busy}
                        onClick={async () => {
                          if (!paperId) return;
                          setBusy(true);
                          try {
                            const d = await api<Detail>(`/api/question-papers/internal/${paperId}/items/${item.id}/replace`, {
                              method: 'POST',
                              body: JSON.stringify({ kind: alt.kind, id: alt.id }),
                            });
                            setDetail(d);
                            setReplacements((prev) => ({ ...prev, [item.id]: [] }));
                            markSaved();
                          } catch (err) {
                            toast(err instanceof Error ? err.message : 'Replace failed', 'error');
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Use this question
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Surface>
          ))}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep('BLUEPRINT')}>
              Back
            </Button>
            <Button type="button" disabled={busy || !detail?.items.length} onClick={() => go('SCHEME')}>
              Continue to scheme
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'SCHEME' ? (
        <div className="space-y-4">
          <Surface className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Scheme of evaluation & model solution</h2>
              <p className="text-sm text-ink-muted">Scheme totals must equal question marks before finalization.</p>
            </div>
            <Button type="button" disabled={busy} onClick={generateSchemes}>
              Load textbook-backed scheme & solution
            </Button>
          </Surface>
          {(detail?.items || []).map((item) => (
            <SchemeEditor
              key={item.id}
              item={item}
              paperId={paperId!}
              busy={busy}
              onSaved={async () => {
                if (paperId) await loadDetail(paperId);
                markSaved();
              }}
            />
          ))}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep('QUESTIONS')}>
              Back
            </Button>
            <Button type="button" disabled={busy} onClick={() => go('REVIEW')}>
              Continue to review
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'REVIEW' ? (
        <div className="space-y-4">
          {detail?.sourceSummary ? (
            <Surface>
              <h2 className="mb-2 font-semibold">Question Selection Summary</h2>
              <p className="text-sm">
                VTU SEE: {detail.sourceSummary.seeComponents ?? detail.sourceSummary.vtuSeePyq} components · Module Question Bank:{' '}
                {detail.sourceSummary.moduleBankComponents ?? detail.sourceSummary.moduleQuestionBank} components
              </p>
              {detail.sourceSummary.fallbackReasons.length ? (
                <ul className="mt-2 list-disc pl-5 text-xs text-ink-muted">
                  <li>Fallback used in:</li>
                  {detail.sourceSummary.fallbackReasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-ink-muted">No Module Question Bank fallback was required.</p>
              )}
            </Surface>
          ) : null}
          <Surface>
            <h2 className="mb-2 font-semibold">Paper validation</h2>
            {critical.length === 0 && detail?.items.length ? (
              <p className="text-sm text-accent">Ready to finalize.</p>
            ) : (
              <ul className="list-disc pl-5 text-sm text-danger">
                {critical.length ? critical.map((i) => <li key={i.message}>{i.message}</li>) : <li>Generate questions, schemes and solutions before finalizing.</li>}
              </ul>
            )}
            {(detail?.paperValidation?.issues || []).filter((i) => i.severity === 'WARNING').map((i) => (
              <p key={i.message} className="mt-1 text-xs text-warning">
                {i.message}
              </p>
            ))}
          </Surface>
          {detail?.orBalance?.length ? (
            <Surface>
              <h3 className="mb-2 text-sm font-semibold">OR pair balance</h3>
              {detail.orBalance.map((b) => (
                <p key={b.groupId} className="text-sm">
                  {b.groupId}: {b.marksBalanced ? '✓ Marks balanced' : '✗ Marks'} {b.coCompatible ? '✓ CO compatible' : '✗ CO'}{' '}
                  {b.rbtCompatible ? '✓ RBT compatible' : '✗ RBT'} {b.difficultyCompatible ? '✓ Difficulty compatible' : '✗ Difficulty'}
                </p>
              ))}
            </Surface>
          ) : null}
          <Surface>
            <h3 className="mb-2 text-sm font-semibold">RBT distribution (selected answers)</h3>
            <div className="flex flex-wrap gap-3 text-sm">
              {['L1', 'L2', 'L3', 'L4', 'L5', 'L6'].map((lvl) => (
                <span key={lvl}>
                  {lvl} — {detail?.coverage.byRbt?.find((r) => r.level === lvl)?.marks || 0}
                </span>
              ))}
            </div>
          </Surface>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep('SCHEME')}>
              Back
            </Button>
            {paperId ? (
              <>
                <Link to={`/internal-question-papers/${paperId}/print?variant=PAPER`}>
                  <Button variant="secondary">Preview paper</Button>
                </Link>
                <Link to={`/internal-question-papers/${paperId}/print?variant=SCHEME`}>
                  <Button variant="secondary">Preview scheme</Button>
                </Link>
                <Link to={`/internal-question-papers/${paperId}/print?variant=SOLUTION`}>
                  <Button variant="secondary">Preview solution</Button>
                </Link>
              </>
            ) : null}
            <Button type="button" disabled={busy || critical.length > 0 || !detail?.items.length} onClick={finalize}>
              Finalize Internal Paper
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SchemeEditor({
  item,
  paperId,
  busy,
  onSaved,
}: {
  item: Detail['items'][number];
  paperId: number;
  busy: boolean;
  onSaved: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [modelAnswer, setModelAnswer] = useState(item.modelAnswer || '');
  const [expectedKeyPoints, setExpectedKeyPoints] = useState(item.expectedKeyPoints || '');
  const [rows, setRows] = useState(
    item.scheme?.length
      ? item.scheme.map((s, i) => ({ code: s.code || `c${i + 1}`, label: s.label, maxMarks: String(s.maxMarks) }))
      : [{ code: 'full', label: 'Complete answer', maxMarks: String(item.maxMarks) }],
  );
  const total = rows.reduce((s, r) => s + Number(r.maxMarks || 0), 0);
  return (
    <Surface>
      <p className="text-xs text-ink-muted">
        Q{item.questionNumber}
        {item.subLetter ? `(${item.subLetter})` : ''} — {item.maxMarks} Marks
      </p>
      {rows.map((row, i) => (
        <div key={i} className="mt-2 grid gap-2 sm:grid-cols-3">
          <Input value={row.label} onChange={(e) => setRows((prev) => prev.map((p, j) => (j === i ? { ...p, label: e.target.value } : p)))} />
          <Input value={row.maxMarks} onChange={(e) => setRows((prev) => prev.map((p, j) => (j === i ? { ...p, maxMarks: e.target.value } : p)))} />
        </div>
      ))}
      <p className={total === item.maxMarks ? 'mt-1 text-xs text-ink-muted' : 'mt-1 text-xs text-danger'}>
        Scheme total {total} / {item.maxMarks}
      </p>
      <Field label="Model solution">
        <Textarea value={modelAnswer} onChange={(e) => setModelAnswer(e.target.value)} />
      </Field>
      <Field label="Expected key points">
        <Textarea value={expectedKeyPoints} onChange={(e) => setExpectedKeyPoints(e.target.value)} />
      </Field>
      <Button
        size="sm"
        className="mt-2"
        disabled={busy || total !== item.maxMarks || !modelAnswer.trim()}
        onClick={async () => {
          try {
            await api(`/api/question-papers/internal/${paperId}/items/${item.id}/scheme`, {
              method: 'POST',
              body: JSON.stringify({
                modelAnswer,
                expectedKeyPoints,
                components: rows.map((r, i) => ({
                  code: r.code || `c${i + 1}`,
                  label: r.label || `Component ${i + 1}`,
                  maxMarks: Number(r.maxMarks),
                })),
              }),
            });
            await onSaved();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Save failed', 'error');
          }
        }}
      >
        Save scheme and solution
      </Button>
    </Surface>
  );
}
