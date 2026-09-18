import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, downloadCopoExport } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, Field, PageHeader, Select, StatusBadge, Surface, useToast } from '../../components/ui';
import type { CopoCatalog } from '../../types/copo';

type DashRow = {
  courseId: number;
  subjectCode: string;
  subjectName: string;
  semesterLabel?: string | null;
  mappingId: number | null;
  status: string;
  coCount: number;
  mappingPercent: number;
  justificationPercent: number;
  po?: { mappingId: number | null; status: string };
  pso?: { mappingId: number | null; status: string };
  sdg?: { mappingId: number | null; status: string };
};

export function CopoReportsPage({ basePath = '/copo' }: { basePath?: string }) {
  useDocumentTitle('CO–PO Reports');
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<CopoCatalog | null>(null);
  const [rows, setRows] = useState<DashRow[]>([]);
  const [schemeId, setSchemeId] = useState('');
  const [programId, setProgramId] = useState('');
  const [status, setStatus] = useState('');

  const load = () => {
    const qs = new URLSearchParams();
    if (schemeId) qs.set('schemeId', schemeId);
    if (programId) qs.set('programId', programId);
    if (status) qs.set('status', status);
    api<{ subjects: DashRow[] }>(`/api/copo/dashboard?${qs}`)
      .then((r) => setRows(r.subjects))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
  };

  useEffect(() => {
    api<CopoCatalog>('/api/copo/catalog').then(setCatalog).catch(() => undefined);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const coverageQs =
    schemeId && programId
      ? `schemeId=${schemeId}&programId=${programId}`
      : '';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="NBA-ready reports"
        subtitle="Subject matrix, justifications, PO / PSO / SDG coverage, and the consolidated Course Outcome Alignment report. Alignment only — not attainment."
        actions={
          <Button
            variant="secondary"
            onClick={() => downloadCopoExport('/api/copo/reports/blooms.xlsx', 'blooms.xlsx')}
          >
            Bloom’s Excel
          </Button>
        }
      />
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Field label="Scheme">
          <Select value={schemeId} onChange={(e) => setSchemeId(e.target.value)}>
            <option value="">All</option>
            {catalog?.schemes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Program">
          <Select value={programId} onChange={(e) => setProgramId(e.target.value)}>
            <option value="">All</option>
            {catalog?.programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {['NOT_STARTED', 'DRAFT', 'SUBMITTED', 'NEEDS_REVISION', 'APPROVED'].map((s) => (
              <option key={s} value={s}>
                {s.replaceAll('_', ' ')}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end">
          <Button onClick={load}>Apply</Button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Surface>
          <h3 className="text-sm font-semibold">PSO reports</h3>
          <ul className="mt-2 space-y-1 text-sm text-ink-secondary">
            <li>Subject CO–PSO matrix</li>
            <li>CO–PSO mapping with justification</li>
            <li>Program PSO coverage</li>
            <li>Semester-wise PSO contribution</li>
            <li>PSO mapping status</li>
          </ul>
          <Button
            className="mt-3"
            size="sm"
            variant="secondary"
            disabled={!coverageQs}
            onClick={() => downloadCopoExport(`/api/copo/reports/pso-coverage.xlsx?${coverageQs}`, 'pso-coverage.xlsx')}
          >
            PSO coverage Excel
          </Button>
        </Surface>
        <Surface>
          <h3 className="text-sm font-semibold">SDG reports</h3>
          <ul className="mt-2 space-y-1 text-sm text-ink-secondary">
            <li>Subject CO–SDG matrix</li>
            <li>CO–SDG mapping with justification</li>
            <li>Program SDG coverage</li>
            <li>Semester-wise SDG coverage</li>
            <li>SDG-wise subject / CO contribution</li>
          </ul>
          <Button
            className="mt-3"
            size="sm"
            variant="secondary"
            disabled={!coverageQs}
            onClick={() => downloadCopoExport(`/api/copo/reports/sdg-coverage.xlsx?${coverageQs}`, 'sdg-coverage.xlsx')}
          >
            SDG coverage Excel
          </Button>
        </Surface>
        <Surface>
          <h3 className="text-sm font-semibold">Consolidated</h3>
          <p className="mt-2 text-sm text-ink-secondary">
            Course Outcome Alignment report: official COs, Bloom’s, CO–PO / CO–PSO / CO–SDG matrices, justifications, version and approval.
          </p>
          <Link className="mt-3 inline-block text-sm text-accent" to={`${basePath}/analytics`}>
            Open coverage analytics
          </Link>
        </Surface>
      </div>

      <Surface className="!p-0 overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-ink-muted">
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Sem</th>
              <th className="px-4 py-3">COs</th>
              <th className="px-4 py-3">CO–PO</th>
              <th className="px-4 py-3">CO–PSO</th>
              <th className="px-4 py-3">CO–SDG</th>
              <th className="px-4 py-3">Reports</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.courseId} className="border-b border-border/70">
                <td className="px-4 py-3">
                  <Link className="font-medium text-accent" to={`${basePath}/mapping?courseId=${row.courseId}`}>
                    {row.subjectCode} — {row.subjectName}
                  </Link>
                </td>
                <td className="px-4 py-3">{row.semesterLabel || '—'}</td>
                <td className="px-4 py-3">{row.coCount}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.po?.status || row.status} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.pso?.status || 'NOT_STARTED'} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.sdg?.status || 'NOT_STARTED'} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {row.po?.mappingId ? (
                      <Link className="text-accent" to={`${basePath}/reports/${row.po.mappingId}/print`}>
                        PO print
                      </Link>
                    ) : null}
                    {row.pso?.mappingId ? (
                      <Link className="text-accent" to={`${basePath}/reports/${row.pso.mappingId}/print`}>
                        PSO print
                      </Link>
                    ) : null}
                    {row.sdg?.mappingId ? (
                      <Link className="text-accent" to={`${basePath}/reports/${row.sdg.mappingId}/print`}>
                        SDG print
                      </Link>
                    ) : null}
                    <button
                      className="text-accent"
                      onClick={() =>
                        downloadCopoExport(
                          `/api/copo/reports/alignment.xlsx?courseId=${row.courseId}${programId ? `&programId=${programId}` : ''}`,
                          'outcome-alignment.xlsx',
                        )
                      }
                    >
                      Alignment Excel
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Surface>
    </div>
  );
}
