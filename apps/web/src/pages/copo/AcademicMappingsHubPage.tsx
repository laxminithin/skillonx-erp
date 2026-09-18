import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, ConfirmDangerModal, EmptyState, Field, Input, PageHeader, Select, StatusBadge, Surface, useToast } from '../../components/ui';
import type { CopoCatalog } from '../../types/copo';
import {
  ACADEMIC_MAPPING_TYPES,
  ACADEMIC_MAPPING_TYPE_LABELS,
  labelForType,
  type AcademicMappingType,
} from './mappingKind';

type ListRow = {
  id: number;
  mappingType?: AcademicMappingType;
  mappingTypeLabel?: string;
  courseId: number;
  subjectCode: string;
  subjectName: string;
  schemeName?: string | null;
  programName?: string | null;
  academicYearLabel?: string | null;
  status: string;
  createdByName?: string;
};

export function AcademicMappingsHubPage({
  basePath = '/copo',
  admin = false,
}: {
  basePath?: string;
  admin?: boolean;
}) {
  useDocumentTitle(admin ? 'Academic Mappings' : 'My Academic Mappings');
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<CopoCatalog | null>(null);
  const [rows, setRows] = useState<ListRow[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({
    academicYearId: '',
    programId: '',
    mappingType: '',
    status: '',
    subjectQ: '',
  });

  const load = () => {
    const qs = new URLSearchParams();
    if (filters.academicYearId) qs.set('academicYearId', filters.academicYearId);
    if (filters.programId) qs.set('programId', filters.programId);
    if (filters.mappingType) qs.set('mappingType', filters.mappingType);
    if (filters.status) qs.set('status', filters.status);
    const q = qs.toString();
    api<{ mappings: ListRow[] }>(`/api/copo/academic-mappings${q ? `?${q}` : ''}`)
      .then((res) => setRows(res.mappings || []))
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load mappings', 'error'));
  };

  useEffect(() => {
    api<CopoCatalog>('/api/copo/catalog')
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
  }, [filters.academicYearId, filters.programId, filters.mappingType, filters.status]);

  const remove = async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await api(`/api/copo/academic-mappings/${deleteId}`, { method: 'DELETE' });
      toast('Mapping deleted');
      setDeleteId(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not delete mapping', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const displayStatus = (raw: string) => {
    if (raw === 'APPROVED' || raw === 'FINALIZED') return 'FINALIZED';
    if (raw === 'ARCHIVED') return 'ARCHIVED';
    return raw === 'DRAFT' || raw === 'NEEDS_REVISION' ? 'DRAFT' : raw;
  };

  const filtered = useMemo(() => {
    const q = filters.subjectQ.trim().toLowerCase();
    return rows.filter((r) => {
      if (r.status === 'ARCHIVED') return false;
      if (!q) return true;
      return (
        r.subjectName.toLowerCase().includes(q) ||
        r.subjectCode.toLowerCase().includes(q) ||
        (r.programName || '').toLowerCase().includes(q)
      );
    });
  }, [rows, filters.subjectQ]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={admin ? 'Academic Mappings' : 'My Academic Mappings'}
        subtitle="Create one academic mapping per subject — choose CO–PO, CO–PSO, CO–SDG, or any combination."
        actions={
          <Link to={`${basePath}/create`}>
            <Button>
              <Plus size={16} />
              Create Mapping
            </Button>
          </Link>
        }
      />

      <Surface className="mb-5">
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
              onChange={(e) => setFilters((f) => ({ ...f, programId: e.target.value }))}
            >
              <option value="">All programs</option>
              {(catalog?.programs || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code || p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Mapping Type">
            <Select
              value={filters.mappingType}
              onChange={(e) => setFilters((f) => ({ ...f, mappingType: e.target.value }))}
            >
              <option value="">All types</option>
              {ACADEMIC_MAPPING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ACADEMIC_MAPPING_TYPE_LABELS[t]}
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
              <option value="DRAFT">Draft</option>
              <option value="FINALIZED">Finalized</option>
            </Select>
          </Field>
          <Field label="Subject">
            <Input
              placeholder="Search subject…"
              value={filters.subjectQ}
              onChange={(e) => setFilters((f) => ({ ...f, subjectQ: e.target.value }))}
            />
          </Field>
        </div>
      </Surface>

      {!filtered.length ? (
        <EmptyState
          title="No academic mappings yet"
          body="Create a mapping, select a subject and mapping type, and the system will load master CO / PO / PSO / SDG data."
          action={
            <Link to={`${basePath}/create`}>
              <Button>Create Mapping</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const status = displayStatus(row.status);
            const typeLabel = row.mappingTypeLabel || labelForType(row.mappingType);
            return (
              <Surface key={row.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-ink">{row.subjectName}</p>
                  <p className="mt-0.5 text-sm text-ink-secondary">
                    {typeLabel}
                    {row.academicYearLabel ? ` · ${row.academicYearLabel}` : ''}
                    {row.programName ? ` · ${row.programName}` : ''}
                    {row.subjectCode ? ` · ${row.subjectCode}` : ''}
                  </p>
                  {admin && row.createdByName ? (
                    <p className="mt-1 text-xs text-ink-muted">Prepared by {row.createdByName}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={status} />
                  <Link to={`${basePath}/mappings/${row.id}`}>
                    <Button variant="secondary">{status === 'DRAFT' ? 'Continue' : 'Open'}</Button>
                  </Link>
                  <Button variant="danger-soft" size="sm" onClick={() => setDeleteId(row.id)}>
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              </Surface>
            );
          })}
        </div>
      )}
      <ConfirmDangerModal
        open={deleteId != null}
        title="Delete this mapping?"
        description="This removes the academic mapping from your list so you can create a new one for the same subject if needed."
        confirmLabel="Delete Mapping"
        loading={deleting}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          void remove();
        }}
      />
    </div>
  );
}
