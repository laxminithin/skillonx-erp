import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api, downloadCopoExport } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, EmptyState, Field, PageHeader, Select, StatusBadge, Surface, Skeleton, useToast } from '../../components/ui';
import type { CopoCatalog } from '../../types/copo';

type PlanRow = {
  id: number;
  subjectName: string;
  courseCode: string;
  academicYearLabel?: string | null;
  programName?: string | null;
  semesterLabel?: string | null;
  schemeLabel?: string | null;
  status: string;
  totalItems: number;
  delivered: number;
  assessed: number;
  completed: number;
  updatedAt: string;
  facultyName?: string;
};

export function BeyondSyllabusPlansPage({
  basePath = '/beyond-syllabus',
  admin = false,
}: {
  basePath?: string;
  admin?: boolean;
}) {
  useDocumentTitle(admin ? 'Beyond-Syllabus Monitoring' : 'Content Beyond Syllabus');
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<CopoCatalog | null>(null);
  const [rows, setRows] = useState<PlanRow[]>([]);
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
      const path = admin ? '/api/beyond-syllabus/admin/monitoring' : '/api/beyond-syllabus';
      const res = await api<{ plans: PlanRow[] }>(`${path}${qs.toString() ? `?${qs}` : ''}`);
      setRows(res.plans || []);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not load plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api<CopoCatalog>('/api/beyond-syllabus/catalog')
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
        title={admin ? 'Beyond-Syllabus Monitoring' : 'Content Beyond Syllabus'}
        subtitle={
          admin
            ? 'Institution-wide enrichment delivery across faculty plans.'
            : 'Plan, deliver, assess, and evidence content taught beyond the prescribed syllabus.'
        }
        actions={
          !admin ? (
            <Link to={`${basePath}/create`}>
              <Button>
                <Plus size={16} />
                Create Plan
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
            <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
              <option value="">All</option>
              <option value="DRAFT">Draft</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </Field>
        </div>
      </Surface>

      {loading ? (
        <Skeleton className="h-40" />
      ) : !rows.length ? (
        <EmptyState
          title="No Beyond-Syllabus plans yet"
          body="Create a plan from master enrichment recommendations for your subject."
          action={
            !admin ? (
              <Link to={`${basePath}/create`}>
                <Button>Create Plan</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Surface key={row.id} className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-ink">{row.subjectName}</h2>
                <p className="mt-1 text-sm text-ink-secondary">
                  {row.courseCode}
                  {row.programName ? ` · ${row.programName}` : ''}
                  {row.semesterLabel ? ` · ${row.semesterLabel}` : ''}
                  {row.academicYearLabel ? ` · ${row.academicYearLabel}` : ''}
                </p>
                {admin && row.facultyName ? (
                  <p className="mt-1 text-xs text-ink-muted">Faculty: {row.facultyName}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-secondary">
                  <span>Topics {row.totalItems}</span>
                  <span>Delivered {row.delivered}</span>
                  <span>Assessed {row.assessed}</span>
                  <span>Completed {row.completed}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={row.status} />
                <div className="flex gap-2">
                  <Link to={`${basePath}/${row.id}`}>
                    <Button variant="secondary">Open</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      downloadCopoExport(`/api/beyond-syllabus/${row.id}/export`, 'beyond-syllabus.xlsx').catch((e) =>
                        toast(e instanceof Error ? e.message : 'Export failed', 'error'),
                      )
                    }
                  >
                    Export
                  </Button>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}
