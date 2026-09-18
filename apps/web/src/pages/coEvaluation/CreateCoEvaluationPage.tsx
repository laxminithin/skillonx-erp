import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, Field, PageHeader, Select, Surface, useToast } from '../../components/ui';
import type { CopoCatalog } from '../../types/copo';

type Preview = {
  found: boolean;
  reason?: string;
  message?: string;
  assessmentStructureAvailable?: boolean;
  needsReview?: boolean;
  existingEvaluationId?: number | null;
  diagnostics?: {
    subjectCode?: string;
    subjectName?: string | null;
    scheme?: string | null;
    semester?: string | null;
    missing?: string[];
  };
  course?: {
    id: number;
    name: string;
    code: string;
    schemeName?: string | null;
    courseType?: string | null;
  };
  counts?: {
    courseOutcomes: number;
    assessmentComponents: number;
  };
  standardDistribution?: string;
  verification?: string | null;
};

export function CreateCoEvaluationPage({ basePath = '/co-evaluation' }: { basePath?: string }) {
  useDocumentTitle('Create CO Evaluation');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<CopoCatalog | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    academicYearId: '',
    programId: '',
    semesterId: '',
    schemeId: '',
    courseId: '',
  });

  useEffect(() => {
    api<CopoCatalog>('/api/co-evaluation/catalog')
      .then((c) => {
        setCatalog(c);
        const year = c.academicYears.find((y) => y.isCurrent) ?? c.academicYears[0];
        setForm((f) => ({ ...f, academicYearId: year ? String(year.id) : '' }));
      })
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load context', 'error'));
  }, [toast]);

  const subjects = useMemo(() => {
    return (catalog?.subjects || []).filter((s) => {
      if (form.programId && s.programs?.length && !s.programs.some((p) => String(p.id) === form.programId)) {
        return false;
      }
      if (form.semesterId && String(s.semesterId || '') !== form.semesterId) return false;
      if (form.schemeId && String(s.schemeId || '') !== form.schemeId) return false;
      return true;
    });
  }, [catalog, form.programId, form.semesterId, form.schemeId]);

  const runPreview = async (courseId: string, nextForm = form) => {
    if (!courseId || !nextForm.academicYearId) {
      setPreview(null);
      return;
    }
    try {
      const res = await api<Preview>('/api/co-evaluation/preview', {
        method: 'POST',
        body: JSON.stringify({
          courseId: Number(courseId),
          academicYearId: Number(nextForm.academicYearId),
          programId: nextForm.programId ? Number(nextForm.programId) : null,
          semesterId: nextForm.semesterId ? Number(nextForm.semesterId) : null,
          schemeId: nextForm.schemeId ? Number(nextForm.schemeId) : null,
        }),
      });
      setPreview(res);
    } catch (e) {
      setPreview({
        found: false,
        message: e instanceof Error ? e.message : 'Preview failed',
      });
    }
  };

  useEffect(() => {
    if (form.courseId) runPreview(form.courseId, form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.courseId, form.academicYearId, form.programId, form.semesterId, form.schemeId]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.courseId || !form.academicYearId) return;
    setBusy(true);
    try {
      const res = await api<{ evaluation: { id: number } }>('/api/co-evaluation', {
        method: 'POST',
        body: JSON.stringify({
          courseId: Number(form.courseId),
          academicYearId: Number(form.academicYearId),
          programId: form.programId ? Number(form.programId) : null,
          semesterId: form.semesterId ? Number(form.semesterId) : null,
          schemeId: form.schemeId ? Number(form.schemeId) : null,
        }),
      });
      toast('CO Evaluation generated');
      navigate(`${basePath}/${res.evaluation.id}`);
    } catch (err) {
      const anyErr = err as Error & { status?: number; details?: { existingEvaluationId?: number } };
      if (anyErr.status === 409) {
        const existingId = anyErr.details?.existingEvaluationId;
        toast('CO Evaluation already exists', 'error');
        if (existingId) navigate(`${basePath}/${existingId}`);
      } else {
        toast(err instanceof Error ? err.message : 'Could not generate', 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-fade-in mx-auto max-w-3xl">
      <PageHeader
        title="Create CO Evaluation"
        subtitle="Select academic context. Master CO Evaluation loads automatically when available."
      />

      <form onSubmit={onSubmit} className="space-y-6">
        <Surface className="grid gap-4 sm:grid-cols-2">
          <Field label="Academic Year">
            <Select
              required
              value={form.academicYearId}
              onChange={(e) => setForm((f) => ({ ...f, academicYearId: e.target.value }))}
            >
              <option value="">Select year</option>
              {(catalog?.academicYears || []).map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Program">
            <Select
              value={form.programId}
              onChange={(e) => setForm((f) => ({ ...f, programId: e.target.value, courseId: '' }))}
            >
              <option value="">Select program</option>
              {(catalog?.programs || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Semester">
            <Select
              value={form.semesterId}
              onChange={(e) => setForm((f) => ({ ...f, semesterId: e.target.value, courseId: '' }))}
            >
              <option value="">Select semester</option>
              {(catalog?.semesters || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label || `Semester ${s.number}`}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Scheme">
            <Select
              value={form.schemeId}
              onChange={(e) => setForm((f) => ({ ...f, schemeId: e.target.value, courseId: '' }))}
            >
              <option value="">Select scheme</option>
              {(catalog?.schemes || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subject">
            <Select
              required
              value={form.courseId}
              onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </Select>
          </Field>
        </Surface>

        {preview ? (
          <Surface>
            {preview.found ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                  Master CO Evaluation Found
                </p>
                <h2 className="mt-2 text-lg font-semibold text-ink">{preview.course?.name}</h2>
                <p className="text-sm text-ink-secondary">
                  {preview.course?.code}
                  {preview.course?.schemeName ? ` · ${preview.course.schemeName}` : ''}
                  {preview.course?.courseType ? ` · ${preview.course.courseType}` : ''}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric label="Course Outcomes" value={preview.counts?.courseOutcomes} />
                  <Metric label="Assessment Components" value={preview.counts?.assessmentComponents} />
                  <Metric label="Standard Distribution" value={preview.standardDistribution || '—'} />
                  <Metric label="Verification" value={preview.verification?.replace(/_/g, ' ') || '—'} />
                </div>
                {preview.needsReview ? (
                  <p className="mt-3 text-xs text-ink-muted">
                    Source status includes academic analysis / review-marked items. Lineage is preserved.
                  </p>
                ) : null}
                {preview.existingEvaluationId ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <p className="text-sm text-ink-secondary">CO Evaluation already exists.</p>
                    <Link to={`${basePath}/${preview.existingEvaluationId}`}>
                      <Button type="button" variant="secondary">
                        Open Existing Evaluation
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="mt-5">
                    <Button type="submit" disabled={busy}>
                      {busy ? 'Generating…' : 'Generate Evaluation'}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-ink">
                  {preview.message || 'Academic master data for this subject has not yet been configured.'}
                </p>
                {preview.diagnostics ? (
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-ink-secondary">
                    {preview.diagnostics.subjectCode ? (
                      <div>
                        <dt className="text-[11px] uppercase text-ink-muted">Subject code</dt>
                        <dd>{preview.diagnostics.subjectCode}</dd>
                      </div>
                    ) : null}
                    {preview.diagnostics.scheme ? (
                      <div>
                        <dt className="text-[11px] uppercase text-ink-muted">Scheme</dt>
                        <dd>{preview.diagnostics.scheme}</dd>
                      </div>
                    ) : null}
                    {preview.diagnostics.missing?.length ? (
                      <div className="col-span-2">
                        <dt className="text-[11px] uppercase text-ink-muted">Missing master components</dt>
                        <dd>{preview.diagnostics.missing.join(', ')}</dd>
                      </div>
                    ) : null}
                  </dl>
                ) : preview.assessmentStructureAvailable && preview.reason === 'BLOCKED' ? (
                  <p className="mt-2 text-sm text-ink-muted">
                    Official assessment structure exists, but Course Outcomes are missing or blocked in the CO Master.
                  </p>
                ) : null}
                {preview.existingEvaluationId ? (
                  <Link className="mt-4 inline-block" to={`${basePath}/${preview.existingEvaluationId}`}>
                    <Button type="button" variant="secondary">
                      Open Existing Evaluation
                    </Button>
                  </Link>
                ) : null}
              </div>
            )}
          </Surface>
        ) : null}
      </form>
    </div>
  );
}

function Metric({ label, value }: { label: string; value?: number | string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold text-ink">{value ?? '—'}</div>
    </div>
  );
}
