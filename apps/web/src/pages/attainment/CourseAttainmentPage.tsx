import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, Field, PageHeader, Select, Surface, useToast } from '../../components/ui';

type Catalog = {
  courses: Array<{ id: number; code: string; name: string }>;
  academicYears: Array<{ id: number; label: string; isCurrent?: boolean }>;
  standard: { name: string; version: string; formulaVersion: string; defaults: { coTarget: number; directIndirect: string } };
};

type CoPreview = {
  coCode: string;
  status: string;
  statement?: string | null;
  target: number | null;
  final: number | null;
  gap: number | null;
  weakStudentCount?: number;
  studentCount?: number;
};

type PreviewPayload = {
  see?: { method?: string; confidence?: string; estimated?: boolean };
  cos?: CoPreview[];
  run?: { id: number };
};

export function CourseAttainmentPage() {
  useDocumentTitle('Calculate attainment');
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [courseId, setCourseId] = useState('');
  const [yearId, setYearId] = useState('');
  const [seeMethod, setSeeMethod] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);

  useEffect(() => {
    api<Catalog>('/api/attainment/catalog')
      .then((c) => {
        setCatalog(c);
        const year = c.academicYears.find((y) => y.isCurrent) ?? c.academicYears[0];
        if (year) setYearId(String(year.id));
      })
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load catalog', 'error'));
  }, [toast]);

  const body = useMemo(
    () => ({
      courseId: Number(courseId),
      academicYearId: yearId ? Number(yearId) : null,
      seeMethod: seeMethod || null,
    }),
    [courseId, yearId, seeMethod],
  );

  const run = async (commit: boolean) => {
    if (!courseId) return;
    setBusy(true);
    try {
      if (commit) {
        const res = await api<{ run: { id: number } }>('/api/attainment/calculate', { method: 'POST', body: JSON.stringify(body) });
        toast('Attainment saved. Historical runs are kept.');
        window.location.assign(`/attainment/runs/${res.run.id}`);
      } else {
        const res = await api<PreviewPayload>('/api/attainment/preview', { method: 'POST', body: JSON.stringify(body) });
        setPreview(res);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Calculation failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const cos = preview?.cos || [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        breadcrumb={
          <Link to="/attainment" className="hover:text-accent">
            Attainment
          </Link>
        }
        title="Calculate CO attainment"
        subtitle={catalog ? `${catalog.standard.name} · formula ${catalog.standard.formulaVersion}` : 'SkillOnX Academic Standard'}
      />
      <Surface className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Course">
            <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              <option value="">Select course</option>
              {catalog?.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Academic year">
            <Select value={yearId} onChange={(e) => setYearId(e.target.value)}>
              <option value="">Any</option>
              {catalog?.academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="SEE method (optional override)">
            <Select value={seeMethod} onChange={(e) => setSeeMethod(e.target.value)}>
              <option value="">Automatic (highest quality available)</option>
              <option value="ACTUAL">Actual question-wise</option>
              <option value="PAPER_WEIGHTED">Paper-weighted estimate</option>
              <option value="EQUAL_WEIGHT">Equal-weight estimate</option>
            </Select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy || !courseId} variant="secondary" onClick={() => run(false)}>
            Preview
          </Button>
          <Button disabled={busy || !courseId} onClick={() => run(true)}>
            Save attainment run
          </Button>
          <Link to="/attainment/marks">
            <Button variant="tertiary">Enter / import marks</Button>
          </Link>
        </div>
        <p className="text-xs text-ink-muted">
          Default target {catalog?.standard.defaults.coTarget} / 3.00 · Direct:Indirect {catalog?.standard.defaults.directIndirect}. Preview does not write
          history. Saving a new run never overwrites a previous one.
        </p>
      </Surface>

      {cos.length ? (
        <div className="mt-6 space-y-3">
          {cos.map((co) => (
            <Surface key={String(co.coCode)}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {String(co.coCode)} · {String(co.status)}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">{String(co.statement || '')}</p>
                </div>
                <p className="text-sm">
                  Target {co.target ?? '—'} · Actual {co.final ?? '—'} · Gap {co.gap ?? '—'}
                </p>
              </div>
              {co.status === 'RED' ? (
                <p className="mt-2 text-sm">
                  {co.weakStudentCount} / {co.studentCount} students below expected performance.
                </p>
              ) : null}
            </Surface>
          ))}
        </div>
      ) : null}
    </div>
  );
}
