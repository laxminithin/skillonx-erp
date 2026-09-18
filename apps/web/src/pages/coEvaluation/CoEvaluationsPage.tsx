import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api, downloadCopoExport } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, EmptyState, Field, PageHeader, Select, StatusBadge, Surface, Skeleton, useToast } from '../../components/ui';
import type { CopoCatalog } from '../../types/copo';

type EvaluationRow = {
  id: number;
  subjectName: string;
  courseCode: string;
  academicYearLabel?: string | null;
  programName?: string | null;
  semesterLabel?: string | null;
  schemeLabel?: string | null;
  courseType?: string | null;
  status: string;
  coCount: number;
  modifiedValues: number;
  updatedAt: string;
  facultyName?: string;
  verificationStatus?: string | null;
};

export function CoEvaluationsPage({
  basePath = '/co-evaluation',
  admin = false,
}: {
  basePath?: string;
  admin?: boolean;
}) {
  useDocumentTitle(admin ? 'CO Evaluation Monitoring' : 'My CO Evaluations');
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<CopoCatalog | null>(null);
  const [rows, setRows] = useState<EvaluationRow[]>([]);
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
      const path = admin ? '/api/co-evaluation/admin/monitoring' : '/api/co-evaluation';
      const res = await api<{ evaluations: EvaluationRow[] }>(`${path}${qs.toString() ? `?${qs}` : ''}`);
      setRows(res.evaluations || []);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not load CO Evaluations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api<CopoCatalog>('/api/co-evaluation/catalog')
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
        title={admin ? 'CO Evaluation Monitoring' : 'My CO Evaluations'}
        subtitle={
          admin
            ? 'Institution-wide view of faculty CO Evaluation execution.'
            : 'Generate CO Evaluation matrices from the academic master, then adjust allocations with justification.'
        }
        actions={
          !admin ? (
            <Link to={`${basePath}/create`}>
              <Button>
                <Plus size={16} />
                Create Evaluation
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
              {['DRAFT', 'FINALIZED', 'ARCHIVED'].map((s) => (
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
          title={admin ? 'No CO Evaluations match these filters.' : 'No CO Evaluations yet.'}
          body={
            admin
              ? 'Try adjusting filters or ask faculty to generate CO Evaluations from the academic master.'
              : 'Create a CO Evaluation to allocate assessment marks across Course Outcomes.'
          }
          action={
            !admin ? (
              <Link to={`${basePath}/create`}>
                <Button>Create Evaluation</Button>
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
                  {row.schemeLabel || row.courseType ? (
                    <p className="mt-1 text-xs text-ink-muted">
                      {[row.schemeLabel, row.courseType].filter(Boolean).join(' · ')}
                    </p>
                  ) : null}
                  {admin && row.facultyName ? (
                    <p className="mt-1 text-xs text-ink-muted">Faculty · {row.facultyName}</p>
                  ) : null}
                </div>
                <StatusBadge status={row.status} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-muted">COs</div>
                  <div className="mt-1 text-sm font-semibold text-ink">{row.coCount}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-muted">Modified</div>
                  <div className="mt-1 text-sm font-semibold text-ink">{row.modifiedValues}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-muted">Updated</div>
                  <div className="mt-1 text-sm font-semibold text-ink">
                    {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '—'}
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
                    downloadCopoExport(`/api/co-evaluation/${row.id}/export`, 'co-evaluation.xlsx').catch((e) =>
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
