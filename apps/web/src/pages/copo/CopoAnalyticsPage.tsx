import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, downloadCopoExport } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, Field, PageHeader, Select, Surface, Tabs, useToast } from '../../components/ui';
import type { CopoCatalog } from '../../types/copo';

type Coverage = {
  disclaimer?: string;
  rows?: Array<{
    po?: { id: number; code: string; shortTitle?: string | null; officialTextPending?: boolean };
    pso?: { id: number; code: string; shortTitle?: string | null; officialTextPending?: boolean };
    sdg?: { id: number; code: string; officialTitle?: string };
    subjectsContributing: number;
    contributingCos?: number;
    high: number;
    moderate: number;
    low: number;
    drilldown: Array<{
      courseId: number;
      subjectCode: string;
      subjectName: string;
      semesterLabel?: string | null;
      coCode: string;
      mappingVersionId: number;
      strength: number;
      justification?: string | null;
    }>;
  }>;
  grid?: Array<{ sdg: { code: string; officialTitle: string }; semesters: Record<string, boolean> }>;
  semesters?: number[];
  matrix?: Array<{
    po?: { code: string };
    pso?: { code: string };
    cells: Array<{ sdgCode: string; label: string }>;
  }>;
  sdgs?: Array<{ code: string }>;
};

export function CopoAnalyticsPage({ basePath = '/copo' }: { basePath?: string }) {
  useDocumentTitle('Mapping Analytics');
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<CopoCatalog | null>(null);
  const [schemeId, setSchemeId] = useState('');
  const [programId, setProgramId] = useState('');
  const [yearId, setYearId] = useState('');
  const [openPo, setOpenPo] = useState<number | null>(null);
  const [view, setView] = useState('po');
  const [data, setData] = useState<Coverage | null>(null);

  useEffect(() => {
    api<CopoCatalog>('/api/copo/catalog').then(setCatalog).catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
  }, [toast]);

  const load = () => {
    if (!schemeId || !programId) return;
    const qs = new URLSearchParams({ schemeId, programId });
    if (yearId) qs.set('academicYearId', yearId);
    const path =
      view === 'pso'
        ? `/api/copo/coverage/pso?${qs}`
        : view === 'sdg'
          ? `/api/copo/coverage/sdg?${qs}`
          : view === 'sdg-map'
            ? `/api/copo/coverage/sdg-semester?${qs}`
            : view === 'po-sdg'
              ? `/api/copo/coverage/derived-po-sdg?${qs}`
              : view === 'pso-sdg'
                ? `/api/copo/coverage/derived-pso-sdg?${qs}`
                : `/api/copo/coverage?${qs}`;
    api<Coverage>(path)
      .then(setData)
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Outcome mapping analytics"
        subtitle="Approved mappings only. Coverage and derived views are alignment, not attainment."
        actions={
          <Button
            variant="secondary"
            disabled={!schemeId || !programId}
            onClick={() =>
              downloadCopoExport(
                view === 'pso'
                  ? `/api/copo/reports/pso-coverage.xlsx?schemeId=${schemeId}&programId=${programId}${yearId ? `&academicYearId=${yearId}` : ''}`
                  : view === 'sdg'
                    ? `/api/copo/reports/sdg-coverage.xlsx?schemeId=${schemeId}&programId=${programId}${yearId ? `&academicYearId=${yearId}` : ''}`
                    : `/api/copo/reports/coverage.xlsx?schemeId=${schemeId}&programId=${programId}${yearId ? `&academicYearId=${yearId}` : ''}`,
                'coverage.xlsx',
              )
            }
          >
            Export Excel
          </Button>
        }
      />
      <Tabs
        value={view}
        onChange={setView}
        tabs={[
          { id: 'po', label: 'PO coverage' },
          { id: 'pso', label: 'PSO coverage' },
          { id: 'sdg', label: 'SDG coverage' },
          { id: 'sdg-map', label: 'Semester SDG map' },
          { id: 'po-sdg', label: 'Derived PO–SDG' },
          { id: 'pso-sdg', label: 'Derived PSO–SDG' },
        ]}
      />
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Field label="Scheme">
          <Select value={schemeId} onChange={(e) => setSchemeId(e.target.value)}>
            <option value="">Select</option>
            {catalog?.schemes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Program">
          <Select value={programId} onChange={(e) => setProgramId(e.target.value)}>
            <option value="">Select</option>
            {catalog?.programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Academic year">
          <Select value={yearId} onChange={(e) => setYearId(e.target.value)}>
            <option value="">All years</option>
            {catalog?.academicYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end">
          <Button onClick={load} disabled={!schemeId || !programId}>
            Load coverage
          </Button>
        </div>
      </div>
      {data?.disclaimer ? <p className="mb-3 text-xs text-ink-muted">{data.disclaimer}</p> : null}
      {data?.grid && data.semesters ? (
        <Surface className="!p-0 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-ink-muted">
                <th className="px-4 py-3">SDG</th>
                {data.semesters.map((s) => (
                  <th key={s} className="px-4 py-3">
                    Sem {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.grid.map((row) => (
                <tr key={row.sdg.code} className="border-b border-border/70">
                  <td className="px-4 py-3">
                    {row.sdg.code} — {row.sdg.officialTitle}
                  </td>
                  {data.semesters!.map((s) => (
                    <td key={s} className="px-4 py-3">
                      {row.semesters[String(s)] ? '✓' : '–'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      ) : data?.matrix ? (
        <Surface className="!p-0 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-ink-muted">
                <th className="px-4 py-3">{view === 'pso-sdg' ? 'PSO' : 'PO'}</th>
                {(data.sdgs || []).map((s) => (
                  <th key={s.code} className="px-4 py-3">
                    {s.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.matrix.map((row) => (
                <tr key={row.po?.code || row.pso?.code} className="border-b border-border/70">
                  <td className="px-4 py-3">{row.po?.code || row.pso?.code}</td>
                  {row.cells.map((cell) => (
                    <td key={cell.sdgCode} className="px-4 py-3">
                      {cell.label}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      ) : (
      <Surface className="!p-0 overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-ink-muted">
              <th className="px-4 py-3">{view === 'sdg' ? 'SDG' : view === 'pso' ? 'PSO' : 'PO'}</th>
              <th className="px-4 py-3">Subjects contributing</th>
              <th className="px-4 py-3">Contributing COs</th>
              <th className="px-4 py-3">High</th>
              <th className="px-4 py-3">Moderate</th>
              <th className="px-4 py-3">Low</th>
            </tr>
          </thead>
          <tbody>
            {(data?.rows || []).map((row) => {
              const target = row.po || row.pso || row.sdg;
              const id = target && 'id' in target ? Number(target.id) : 0;
              const label = row.po
                ? `${row.po.code} ${row.po.shortTitle || (row.po.officialTextPending ? '· Official Data Pending' : '')}`
                : row.pso
                  ? `${row.pso.code} ${row.pso.shortTitle || (row.pso.officialTextPending ? '· Official / Approved PSO Data Pending' : '')}`
                  : row.sdg
                    ? `${row.sdg.code} — ${row.sdg.officialTitle || ''}`
                    : '';
              return (
              <Fragment key={id || label}>
                <tr className="border-b border-border/70">
                  <td className="px-4 py-3">
                    <button className="font-medium text-accent" onClick={() => setOpenPo(openPo === id ? null : id)}>
                      {label}
                    </button>
                  </td>
                  <td className="px-4 py-3">{row.subjectsContributing}</td>
                  <td className="px-4 py-3">{row.contributingCos ?? '—'}</td>
                  <td className="px-4 py-3">{row.high}</td>
                  <td className="px-4 py-3">{row.moderate}</td>
                  <td className="px-4 py-3">{row.low}</td>
                </tr>
                {openPo === id
                  ? row.drilldown.map((d) => (
                      <tr key={`${d.mappingVersionId}-${d.coCode}`} className="bg-surface-muted/60 text-xs">
                        <td className="px-8 py-2" colSpan={6}>
                          {d.semesterLabel} ·{' '}
                          <Link className="text-accent" to={`${basePath}/mapping?courseId=${d.courseId}`}>
                            {d.subjectCode} {d.subjectName}
                          </Link>{' '}
                          · {d.coCode} · strength {d.strength}
                          {d.justification ? ` — ${d.justification}` : ''}
                        </td>
                      </tr>
                    ))
                  : null}
              </Fragment>
            );
            })}
          </tbody>
        </table>
      </Surface>
      )}
    </div>
  );
}
