import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, Field, PageHeader, Select, Surface, useToast } from '../../components/ui';
import type { CopoCatalog } from '../../types/copo';
import {
  ACADEMIC_MAPPING_TYPES,
  ACADEMIC_MAPPING_TYPE_LABELS,
  domainsFromType,
  labelForType,
  type AcademicMappingType,
  typeFromLegacyKind,
  type OperationalMappingKind,
} from './mappingKind';

type TypeAvailability = {
  type: AcademicMappingType;
  label: string;
  available: boolean;
  missing: string[];
};

type Preview = {
  found: boolean;
  reason?: string;
  message?: string;
  mappingType?: AcademicMappingType;
  availability?: { po: boolean; pso: boolean; sdg: boolean };
  available?: string[];
  missing?: string[];
  mappingTypes?: TypeAvailability[];
  needsAcademicReview?: boolean;
  course?: { id: number; name: string; code: string; schemeName?: string | null };
  counts?: {
    courseOutcomes: number;
    domains?: Record<
      string,
      { targetCount: number; targetCoverage: number; activeCorrelations: number }
    >;
    activeCorrelations: number;
    high: number;
    medium: number;
    low: number;
  };
};

export function CreateCopoMappingPage({
  basePath = '/copo',
  kind,
}: {
  basePath?: string;
  /** @deprecated Legacy route prop — ignored in favour of Mapping Type dropdown. */
  kind?: OperationalMappingKind;
}) {
  useDocumentTitle('Create Academic Mapping');
  const navigate = useNavigate();
  const { toast } = useToast();
  const rootPath = basePath.replace(/\/(pso|sdg)$/, '');
  const [catalog, setCatalog] = useState<CopoCatalog | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    academicYearId: '',
    programId: '',
    semesterId: '',
    schemeId: '',
    courseId: '',
    mappingType: (kind ? typeFromLegacyKind(kind) : 'CO_PO') as AcademicMappingType,
  });

  useEffect(() => {
    api<CopoCatalog>('/api/copo/catalog')
      .then((c) => {
        setCatalog(c);
        const year = c.academicYears.find((y) => y.isCurrent) ?? c.academicYears[0];
        setForm((f) => ({ ...f, academicYearId: year ? String(year.id) : '' }));
      })
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load context', 'error'));
  }, [toast]);

  const [availabilityByCourse, setAvailabilityByCourse] = useState<
    Map<number, { po: boolean; pso: boolean; sdg: boolean; issues: string[]; mappingTypes?: TypeAvailability[] }>
  >(new Map());

  useEffect(() => {
    api<{
      subjects: Array<{
        courseId: number;
        po: boolean;
        pso: boolean;
        sdg: boolean;
        issues: string[];
        mappingTypes?: TypeAvailability[];
      }>;
    }>('/api/copo/academic-mappings/availability')
      .then((res) => {
        const map = new Map<
          number,
          { po: boolean; pso: boolean; sdg: boolean; issues: string[]; mappingTypes?: TypeAvailability[] }
        >();
        for (const row of res.subjects) {
          const prev = map.get(row.courseId);
          if (!prev) {
            map.set(row.courseId, {
              po: row.po,
              pso: row.pso,
              sdg: row.sdg,
              issues: row.issues,
              mappingTypes: row.mappingTypes,
            });
          } else {
            map.set(row.courseId, {
              po: prev.po || row.po,
              pso: prev.pso || row.pso,
              sdg: prev.sdg || row.sdg,
              issues: [...new Set([...prev.issues, ...row.issues])],
              mappingTypes: row.mappingTypes || prev.mappingTypes,
            });
          }
        }
        setAvailabilityByCourse(map);
      })
      .catch(() => undefined);
  }, []);

  const subjects = useMemo(() => {
    return (catalog?.subjects || []).filter((s) => {
      if (form.programId && s.programs?.length && !s.programs.some((p) => String(p.id) === form.programId)) return false;
      if (form.semesterId && String(s.semesterId || '') !== form.semesterId) return false;
      if (form.schemeId && String(s.schemeId || '') !== form.schemeId) return false;
      return true;
    });
  }, [catalog, form.programId, form.semesterId, form.schemeId]);

  const subjectAvail = form.courseId ? availabilityByCourse.get(Number(form.courseId)) : undefined;
  const typeOptions: TypeAvailability[] =
    preview?.mappingTypes ||
    subjectAvail?.mappingTypes ||
    ACADEMIC_MAPPING_TYPES.map((type) => {
      const need = domainsFromType(type);
      const ready = subjectAvail || { po: false, pso: false, sdg: false };
      const missing: string[] = [];
      if (need.po && !ready.po) missing.push('CO–PO Master Mapping');
      if (need.pso && !ready.pso) missing.push('CO–PSO Master Mapping');
      if (need.sdg && !ready.sdg) missing.push('CO–SDG Master Mapping');
      return {
        type,
        label: ACADEMIC_MAPPING_TYPE_LABELS[type],
        available: !subjectAvail ? true : missing.length === 0,
        missing,
      };
    });

  const runPreview = async (courseId: string, nextForm = form) => {
    if (!courseId || !nextForm.academicYearId) return;
    const needsPso = domainsFromType(nextForm.mappingType).pso;
    if (needsPso && !nextForm.programId) {
      setPreview({
        found: false,
        reason: 'NO_PROGRAM',
        message: 'Program selection is required before PSO resolution.',
        mappingType: nextForm.mappingType,
      });
      return;
    }
    try {
      const body = {
        courseId: Number(courseId),
        academicYearId: Number(nextForm.academicYearId),
        programId: nextForm.programId ? Number(nextForm.programId) : null,
        semesterId: nextForm.semesterId ? Number(nextForm.semesterId) : null,
        schemeId: nextForm.schemeId ? Number(nextForm.schemeId) : null,
        mappingType: nextForm.mappingType,
      };
      const res = await api<Preview>('/api/copo/academic-mappings/preview', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setPreview(res);
      if (res.mappingTypes && courseId) {
        const ready = res.availability || { po: false, pso: false, sdg: false };
        setAvailabilityByCourse((prev) => {
          const next = new Map(prev);
          next.set(Number(courseId), {
            po: ready.po,
            pso: ready.pso,
            sdg: ready.sdg,
            issues: res.missing?.length ? res.missing.map(String) : [],
            mappingTypes: res.mappingTypes,
          });
          return next;
        });
      }
    } catch (e) {
      setPreview({
        found: false,
        message: e instanceof Error ? e.message : 'Preview failed',
        mappingType: nextForm.mappingType,
      });
    }
  };

  useEffect(() => {
    if (form.courseId) void runPreview(form.courseId, form);
    else setPreview(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.courseId, form.mappingType, form.programId, form.academicYearId, form.schemeId]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.courseId || !form.academicYearId) {
      toast('Academic year and subject are required', 'error');
      return;
    }
    if (preview && !preview.found) {
      toast(preview.message || 'This mapping combination cannot be generated.', 'error');
      return;
    }
    setBusy(true);
    try {
      const body = {
        courseId: Number(form.courseId),
        academicYearId: Number(form.academicYearId),
        programId: form.programId ? Number(form.programId) : null,
        semesterId: form.semesterId ? Number(form.semesterId) : null,
        schemeId: form.schemeId ? Number(form.schemeId) : null,
        mappingType: form.mappingType,
      };
      const res = await api<{ mapping: { id: number } }>('/api/copo/academic-mappings', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast('Academic mapping generated', 'success');
      navigate(`${rootPath}/mappings/${res.mapping.id}`);
    } catch (err) {
      const anyErr = err as Error & { status?: number; details?: { existingMappingId?: number }; code?: string };
      const existingId = anyErr.details?.existingMappingId;
      if (existingId && (anyErr.status === 409 || String(anyErr.message).toLowerCase().includes('already exists'))) {
        toast('Opening existing mapping for this academic context', 'info');
        navigate(`${rootPath}/mappings/${existingId}`);
        return;
      }
      toast(err instanceof Error ? err.message : 'Could not create mapping', 'error');
    } finally {
      setBusy(false);
    }
  };

  const selectedSubject = subjects.find((s) => String(s.id) === form.courseId);
  const domains = domainsFromType(form.mappingType);
  const domainCounts = preview?.counts?.domains || {};

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Create Academic Mapping"
        subtitle="Select academic context, subject, and mapping type. Master data is loaded from the database — not generated."
      />
      <form onSubmit={onSubmit} className="space-y-5">
        <Surface>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Academic Year">
              <Select
                value={form.academicYearId}
                onChange={(e) => setForm((f) => ({ ...f, academicYearId: e.target.value }))}
                required
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
                    {p.code || p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Semester">
              <Select
                value={form.semesterId}
                onChange={(e) => setForm((f) => ({ ...f, semesterId: e.target.value, courseId: '' }))}
              >
                <option value="">Any semester</option>
                {(catalog?.semesters || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Subject">
              <Select
                value={form.courseId}
                onChange={(e) => {
                  const courseId = e.target.value;
                  const subj = subjects.find((s) => String(s.id) === courseId);
                  setForm((f) => ({
                    ...f,
                    courseId,
                    schemeId: subj?.schemeId ? String(subj.schemeId) : f.schemeId,
                    semesterId: subj?.semesterId ? String(subj.semesterId) : f.semesterId,
                  }));
                }}
                required
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Scheme">
              <Select
                value={form.schemeId}
                onChange={(e) => setForm((f) => ({ ...f, schemeId: e.target.value }))}
              >
                <option value="">From subject</option>
                {(catalog?.schemes || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name || s.code}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Mapping Type">
              <Select
                value={form.mappingType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mappingType: e.target.value as AcademicMappingType }))
                }
              >
                {typeOptions.map((opt) => (
                  <option key={opt.type} value={opt.type} disabled={!opt.available && Boolean(form.courseId)}>
                    {opt.label}
                    {!opt.available && form.courseId ? ' (unavailable)' : ''}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            Faculty is taken from your signed-in account. Mapping type options depend on available master data for the
            selected subject.
          </p>
        </Surface>

        {form.courseId ? (
          <Surface>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Master Data Found</h3>
            {selectedSubject || preview?.course ? (
              <p className="mt-2 text-lg font-semibold text-ink">
                {(preview?.course?.name || selectedSubject?.name || '').toUpperCase()}
              </p>
            ) : null}
            <p className="text-sm text-ink-secondary">
              {preview?.course?.code || selectedSubject?.code}
              {preview?.course?.schemeName || selectedSubject?.schemeName
                ? ` · ${preview?.course?.schemeName || selectedSubject?.schemeName} Scheme`
                : ''}
            </p>

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className={subjectAvail?.po || preview?.availability?.po ? 'text-emerald-700' : 'text-ink-muted'}>
                {(subjectAvail?.po || preview?.availability?.po) ? '✓' : '✕'} PO
              </span>
              <span className={subjectAvail?.pso || preview?.availability?.pso ? 'text-emerald-700' : 'text-ink-muted'}>
                {(subjectAvail?.pso || preview?.availability?.pso) ? '✓' : '✕'} PSO
              </span>
              <span className={subjectAvail?.sdg || preview?.availability?.sdg ? 'text-emerald-700' : 'text-ink-muted'}>
                {(subjectAvail?.sdg || preview?.availability?.sdg) ? '✓' : '✕'} SDG
              </span>
            </div>

            {preview?.found ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs uppercase text-ink-muted">Course Outcomes</p>
                  <p className="text-2xl font-semibold">{preview.counts?.courseOutcomes ?? '—'}</p>
                </div>
                {domains.po ? (
                  <div>
                    <p className="text-xs uppercase text-ink-muted">Program Outcomes</p>
                    <p className="text-2xl font-semibold">
                      {(domainCounts.PO as { targetCount?: number } | undefined)?.targetCount ?? '—'}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {(domainCounts.PO as { activeCorrelations?: number } | undefined)?.activeCorrelations ?? 0} PO
                      relationships
                    </p>
                  </div>
                ) : null}
                {domains.pso ? (
                  <div>
                    <p className="text-xs uppercase text-ink-muted">Program Specific Outcomes</p>
                    <p className="text-2xl font-semibold">
                      {(domainCounts.PSO as { targetCount?: number } | undefined)?.targetCount ?? '—'}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {(domainCounts.PSO as { activeCorrelations?: number } | undefined)?.activeCorrelations ?? 0} PSO
                      relationships
                    </p>
                  </div>
                ) : null}
                {domains.sdg ? (
                  <div>
                    <p className="text-xs uppercase text-ink-muted">Relevant SDGs</p>
                    <p className="text-2xl font-semibold">
                      {(domainCounts.SDG as { targetCoverage?: number } | undefined)?.targetCoverage ??
                        (domainCounts.SDG as { targetCount?: number } | undefined)?.targetCount ??
                        '—'}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {(domainCounts.SDG as { activeCorrelations?: number } | undefined)?.activeCorrelations ?? 0} SDG
                      relationships
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {preview?.found && preview.counts ? (
              <p className="mt-3 text-sm text-ink-secondary">
                High {preview.counts.high} · Medium {preview.counts.medium} · Low {preview.counts.low}
                {preview.needsAcademicReview ? ' · Some mappings need academic review' : ''}
              </p>
            ) : null}

            {preview && !preview.found ? (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                <p className="font-semibold">This mapping combination cannot be generated.</p>
                <p className="mt-1">{preview.message}</p>
                {preview.missing?.length ? (
                  <p className="mt-2">
                    <strong>Missing:</strong> {preview.missing.join(', ')}
                  </p>
                ) : null}
                {typeOptions.filter((t) => t.available).length ? (
                  <p className="mt-2">
                    <strong>Available:</strong>{' '}
                    {typeOptions
                      .filter((t) => t.available)
                      .map((t) => t.label)
                      .join(', ')}
                  </p>
                ) : null}
                <p className="mt-2 text-ink-secondary">Select another mapping type above.</p>
              </div>
            ) : null}
          </Surface>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate(rootPath)}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || (preview != null && !preview.found)}>
            {busy ? 'Generating…' : `Generate ${labelForType(form.mappingType)} Mapping`}
          </Button>
        </div>
      </form>
    </div>
  );
}
