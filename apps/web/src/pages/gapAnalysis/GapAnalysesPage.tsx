import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api, downloadCopoExport } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, EmptyState, Field, PageHeader, Select, StatusBadge, Surface, Skeleton, useToast } from '../../components/ui';
import type { CopoCatalog } from '../../types/copo';

type AnalysisRow = {
  id: number;
  subjectName: string;
  courseCode: string;
  academicYearLabel?: string | null;
  programName?: string | null;
  semesterLabel?: string | null;
  schemeLabel?: string | null;
  status: string;
  totalGaps: number;
  closed: number;
  open: number;
  coveragePercent: number | null;
  updatedAt: string;
  facultyName?: string;
};

export function GapAnalysesPage({
  basePath = '/gap-analysis',
  admin = false,
}: {
  basePath?: string;
  admin?: boolean;
}) {
  useDocumentTitle(admin ? 'Gap Analysis Monitoring' : 'My Gap Analyses');
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<CopoCatalog | null>(null);
  const [rows, setRows] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    academicYearId: '',
    programId: '',
    semesterId: '',
    courseId: '',
    status: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filters.academicYearId) qs.set('academicYearId', filters.academicYearId);
      if (filters.programId) qs.set('programId', filters.programId);
      if (filters.semesterId) qs.set('semesterId', filters.semesterId);
      if (filters.courseId) qs.set('courseId', filters.courseId);
      if (filters.status) qs.set('status', filters.status);
      const path = admin ? '/api/gap-analysis/admin/monitoring' : '/api/gap-analysis';
      const res = await api<{ analyses: AnalysisRow[] }>(`${path}${qs.toString() ? `?${qs}` : ''}`);
      setRows(res.analyses || []);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not load Gap Analyses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api<CopoCatalog>('/api/gap-analysis/catalog')
      .then((c) => {
        setCatalog(c);
        const year = c.academicYears.find((y) => y.isCurrent) ?? c.academicYears[0];
        if (year) setFilters((f) => ({ ...f, academicYearId: f.academicYearId || String(year.id) }));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.academicYearId, filters.programId, filters.semesterId, filters.courseId, filters.status, admin]);

  const subjects = useMemo(() => {
    return (catalog?.subjects || []).filter((s) => {
      if (filters.programId && s.programs?.length && !s.programs.some((p) => String(p.id) === filters.programId)) {
        return false;
      }
      if (filters.semesterId && String(s.semesterId || '') !== filters.semesterId) return false;
      return true;
    });
  }, [catalog, filters.programId, filters.semesterId]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={admin ? 'Gap Analysis Monitoring' : 'My Gap Analyses'}
        subtitle={
          admin
            ? 'Institution-wide view of faculty Gap Analysis execution.'
            : 'Review curriculum gaps from the academic master, then record coverage, actions, and evidence.'
        }
        actions={
          !admin ? (
            <Link to={`${basePath}/create`}>
              <Button>
                <Plus size={16} />
                Create Gap Analysis
              </Button>
            </Link>
          ) : undefined
        }
      />

      <Surface className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Academic Year">
            <Select
              value={filters.academicYearId}
              onChange={(e) => setFilters((f) => ({ ...f, academicYearId: e.target.value }))}
            >
              <option value="">All years</option>
              {(catalog?.academicYears || []).map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Program">
            <Select
              value={filters.programId}
              onChange={(e) => setFilters((f) => ({ ...f, programId: e.target.value, courseId: '' }))}
            >
              <option value="">All programs</option>
              {(catalog?.programs || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Semester">
            <Select
              value={filters.semesterId}
              onChange={(e) => setFilters((f) => ({ ...f, semesterId: e.target.value, courseId: '' }))}
            >
              <option value="">All semesters</option>
              {(catalog?.semesters || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label || `Semester ${s.number}`}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subject">
            <Select
              value={filters.courseId}
              onChange={(e) => setFilters((f) => ({ ...f, courseId: e.target.value }))}
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="">All statuses</option>
              {['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'].map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Surface>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : !rows.length ? (
        <EmptyState
          title={admin ? 'No Gap Analyses match these filters.' : 'No Gap Analyses yet.'}
          body={
            admin
              ? 'Try adjusting filters or ask faculty to generate Gap Analyses from the academic master.'
              : 'Create a Gap Analysis to review curriculum coverage and enrichment activities for your subject.'
          }
          action={
            !admin ? (
              <Link to={`${basePath}/create`}>
                <Button>Create Gap Analysis</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <Surface key={row.id} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-ink">{row.subjectName}</h2>
                  <p className="mt-0.5 text-sm text-ink-secondary">{row.courseCode}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {[row.academicYearLabel, row.programName, row.semesterLabel].filter(Boolean).join(' · ')}
                  </p>
                  {admin && row.facultyName ? (
                    <p className="mt-1 text-xs text-ink-muted">Faculty · {row.facultyName}</p>
                  ) : null}
                </div>
                <StatusBadge status={row.status} />
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-muted">Gaps</div>
                  <div className="mt-1 text-sm font-semibold text-ink">{row.totalGaps}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-muted">Closed</div>
                  <div className="mt-1 text-sm font-semibold text-ink">{row.closed}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-muted">Open</div>
                  <div className="mt-1 text-sm font-semibold text-ink">{row.open}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-muted">Coverage</div>
                  <div className="mt-1 text-sm font-semibold text-ink">
                    {row.coveragePercent == null ? '—' : `${row.coveragePercent}%`}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`${basePath}/${row.id}`}>
                  <Button size="sm">Open</Button>
                </Link>
                <Link to={`${basePath}/${row.id}/print`} target="_blank">
                  <Button size="sm" variant="secondary">
                    Print
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    downloadCopoExport(`/api/gap-analysis/${row.id}/export`, 'gap-analysis.xlsx').catch((e) =>
                      toast(e instanceof Error ? e.message : 'Export failed', 'error'),
                    )
                  }
                >
                  Export
                </Button>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}
