import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, downloadCopoExport } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, ConfirmDangerModal, Field, PageHeader, Select, StatusBadge, Surface, Textarea, useToast } from '../../components/ui';
import { cn } from '../../lib/utils';
import { Trash2 } from 'lucide-react';
import {
  CombinedMappingMatrix,
  type MatrixDomain,
  type MatrixGroup,
  type MatrixTarget,
} from '../../components/academic/CombinedMappingMatrix';
import {
  ACADEMIC_MAPPING_TYPES,
  ACADEMIC_MAPPING_TYPE_LABELS,
  domainsFromType,
  labelForType,
  printBasePath,
  type AcademicMappingType,
  type OperationalMappingKind,
} from './mappingKind';

type TargetCol = MatrixTarget & { number?: number };

type Cell = {
  id: number;
  domain?: OperationalMappingKind;
  courseOutcomeId: number;
  programOutcomeId?: number | null;
  programSpecificOutcomeId?: number | null;
  sdgId?: number | null;
  targetId?: number | null;
  masterValue: 1 | 2 | 3 | null;
  currentValue: 1 | 2 | 3 | null;
  modifiedFromMaster: boolean;
  rationale?: string | null;
  overrideJustification?: string | null;
  mappingOrigin?: string | null;
  verificationStatus?: string | null;
};

type MappingDetail = {
  mapping: {
    id: number;
    mappingType?: AcademicMappingType;
    mappingTypeLabel?: string;
    mappingKind?: OperationalMappingKind;
    includePo?: boolean;
    includePso?: boolean;
    includeSdg?: boolean;
    status: string;
    createdAt: string;
    finalizedAt?: string | null;
    createdByName?: string;
    showAllSdgs?: boolean;
  };
  context: {
    subjectName: string;
    subjectCode: string;
    schemeName?: string | null;
    academicYearLabel?: string | null;
    programName?: string | null;
  };
  courseOutcomes: Array<{ id: number; code: string; statement: string }>;
  programOutcomes: TargetCol[];
  programSpecificOutcomes?: TargetCol[];
  sdgs?: TargetCol[];
  relevantSdgIds?: number[];
  groups?: MatrixGroup[];
  cells: Cell[];
  summary: {
    courseOutcomes: number;
    programOutcomes?: number;
    programSpecificOutcomes?: number;
    relevantSdgs?: number;
    poCoverage?: number;
    psoCoverage?: number;
    sdgCoverage?: number;
    activeCorrelations: number;
    high: number;
    medium: number;
    low: number;
  };
  permissions: { canEdit: boolean; canFinalize: boolean; canReset: boolean; canDelete?: boolean };
};

type TabId = 'overview' | 'matrix' | 'outcomes';

function strengthLabel(domain: OperationalMappingKind, value: number | null) {
  if (value == null) return 'No Mapping';
  if (domain === 'SDG') {
    if (value === 3) return '3 — Strong Relevance';
    if (value === 2) return '2 — Moderate Relevance';
    return '1 — Low Relevance';
  }
  if (value === 3) return '3 — High Correlation';
  if (value === 2) return '2 — Medium Correlation';
  return '1 — Low Correlation';
}

export function CopoMappingInstancePage({
  basePath = '/copo',
}: {
  basePath?: string;
  kind?: OperationalMappingKind;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const rootPath = printBasePath(basePath);
  const [data, setData] = useState<MappingDetail | null>(null);
  const [tab, setTab] = useState<TabId>('matrix');
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [inspect, setInspect] = useState<{ title: string; body: ReactNode } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [upgradeType, setUpgradeType] = useState<AcademicMappingType | ''>('');
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = () => {
    if (!id) return;
    api<MappingDetail>(`/api/copo/academic-mappings/${id}`)
      .then((res) => {
        setData(res);
        setSelectedCell(null);
      })
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load mapping', 'error'));
  };
  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const flags = useMemo(() => {
    if (!data) return { po: false, pso: false, sdg: false };
    if (data.mapping.mappingType) return domainsFromType(data.mapping.mappingType);
    return {
      po: Boolean(data.mapping.includePo ?? data.programOutcomes?.length),
      pso: Boolean(data.mapping.includePso ?? data.programSpecificOutcomes?.length),
      sdg: Boolean(data.mapping.includeSdg ?? data.sdgs?.length),
    };
  }, [data]);

  const groups = useMemo((): MatrixGroup[] => {
    if (data?.groups?.length) return data.groups;
    if (!data) return [];
    const built: MatrixGroup[] = [];
    if (flags.po && data.programOutcomes.length) {
      built.push({
        type: 'PO',
        label: 'PROGRAM OUTCOMES',
        colSpan: data.programOutcomes.length,
        targets: data.programOutcomes,
      });
    }
    if (flags.pso && (data.programSpecificOutcomes || []).length) {
      const targets = data.programSpecificOutcomes || [];
      built.push({
        type: 'PSO',
        label: 'PROGRAM SPECIFIC OUTCOMES',
        colSpan: targets.length,
        targets,
      });
    }
    if (flags.sdg) {
      const all = data.sdgs || [];
      const active = new Set(
        data.cells.filter((c) => c.domain === 'SDG' && c.currentValue != null).map((c) => Number(c.targetId ?? c.sdgId)),
      );
      let targets = all;
      if (!data.mapping.showAllSdgs) {
        if (active.size) targets = all.filter((s) => active.has(s.id));
        else if (data.relevantSdgIds?.length) {
          const rel = new Set(data.relevantSdgIds);
          targets = all.filter((s) => rel.has(s.id));
        }
      }
      if (targets.length) {
        built.push({
          type: 'SDG',
          label: 'SUSTAINABLE DEVELOPMENT GOALS',
          colSpan: targets.length,
          targets,
        });
      }
    }
    return built;
  }, [data, flags]);

  const typeLabel = data?.mapping.mappingTypeLabel || labelForType(data?.mapping.mappingType);
  useDocumentTitle(data ? `${data.context.subjectName} Academic Mapping` : 'Academic Mapping');

  const upgradeOptions = useMemo(() => {
    if (!data?.mapping.mappingType) return [];
    const current = domainsFromType(data.mapping.mappingType);
    return ACADEMIC_MAPPING_TYPES.filter((t) => {
      const next = domainsFromType(t);
      if (t === data.mapping.mappingType) return false;
      if (current.po && !next.po) return false;
      if (current.pso && !next.pso) return false;
      if (current.sdg && !next.sdg) return false;
      return next.po !== current.po || next.pso !== current.pso || next.sdg !== current.sdg;
    });
  }, [data]);

  const openCell = (cell: Cell | undefined, domain: MatrixDomain, coId: number, targetId: number) => {
    const resolved =
      cell ||
      ({
        id: 0,
        domain,
        courseOutcomeId: coId,
        targetId,
        masterValue: null,
        currentValue: null,
        modifiedFromMaster: false,
      } as Cell);
    setSelectedCell({ ...resolved, domain: resolved.domain || domain, targetId: resolved.targetId ?? targetId });
    setEditValue(resolved.currentValue == null ? '' : String(resolved.currentValue));
    setOverrideReason(resolved.overrideJustification || '');
    setInspect(null);
  };

  const editable = Boolean(data?.permissions.canEdit);

  const saveCell = async () => {
    if (!id || !selectedCell || !data) return;
    const value = editValue === '' ? null : (Number(editValue) as 1 | 2 | 3);
    const master = selectedCell.masterValue;
    const modified = master !== value;
    if (modified && value != null && !overrideReason.trim()) {
      toast('Please provide a change justification when modifying a master value', 'error');
      return;
    }
    const domain = selectedCell.domain || 'PO';
    const body: Record<string, unknown> = {
      courseOutcomeId: selectedCell.courseOutcomeId,
      value,
      overrideJustification: modified ? overrideReason.trim() || null : null,
    };
    if (domain === 'PSO') body.programSpecificOutcomeId = selectedCell.targetId;
    else if (domain === 'SDG') body.sdgId = selectedCell.targetId;
    else body.programOutcomeId = selectedCell.targetId;
    setBusy(true);
    try {
      const next = await api<MappingDetail>(`/api/copo/academic-mappings/${id}/value`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setData(next);
      const refreshed =
        next.cells.find(
          (c) =>
            (c.domain || 'PO') === domain &&
            c.courseOutcomeId === selectedCell.courseOutcomeId &&
            Number(c.targetId) === Number(selectedCell.targetId),
        ) || null;
      setSelectedCell(refreshed);
      toast('Mapping updated', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Update failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <p className="text-sm text-ink-muted">Loading mapping…</p>;

  const printHref = `${rootPath}/mappings/${data.mapping.id}/print`;
  const coForSelected = selectedCell
    ? data.courseOutcomes.find((c) => c.id === selectedCell.courseOutcomeId)
    : null;
  const targetForSelected = (() => {
    if (!selectedCell) return null;
    const domain = selectedCell.domain || 'PO';
    if (domain === 'PSO') return (data.programSpecificOutcomes || []).find((t) => t.id === selectedCell.targetId);
    if (domain === 'SDG') return (data.sdgs || []).find((t) => t.id === selectedCell.targetId);
    return data.programOutcomes.find((t) => t.id === selectedCell.targetId);
  })();

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'matrix', label: 'Combined Mapping' },
    { id: 'outcomes', label: 'Outcome Statements' },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={data.context.subjectName}
        subtitle={`${data.context.subjectCode} · ${data.context.schemeName || 'Scheme'} · ${data.context.academicYearLabel || 'Academic Year'}${data.context.programName ? ` · ${data.context.programName}` : ''}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={rootPath}>
              <Button variant="secondary">All Mappings</Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() =>
                downloadCopoExport(
                  `/api/copo/reports/${data.mapping.id}/xlsx`,
                  `${(data.context.subjectName || 'mapping').replace(/\s+/g, '-')}-Academic-Mapping.xlsx`,
                ).catch((e) => toast(e instanceof Error ? e.message : 'Export failed', 'error'))
              }
            >
              Export Excel
            </Button>
            <a href={printHref} target="_blank" rel="noreferrer">
              <Button variant="secondary">Print</Button>
            </a>
            {data.permissions.canDelete !== false ? (
              <Button variant="danger-soft" disabled={busy} onClick={() => setDeleteOpen(true)}>
                <Trash2 size={14} /> Delete
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusBadge status={data.mapping.status} />
        <span className="rounded-md bg-surface-muted px-2 py-1 text-xs font-medium text-ink-secondary">{typeLabel}</span>
        <span className="text-xs text-ink-muted">Prepared by {data.mapping.createdByName || '—'}</span>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Surface>
          <p className="text-xs uppercase text-ink-muted">Course Outcomes</p>
          <p className="mt-1 text-2xl font-semibold">{data.summary.courseOutcomes}</p>
        </Surface>
        {flags.po ? (
          <Surface>
            <p className="text-xs uppercase text-ink-muted">PO Coverage</p>
            <p className="mt-1 text-2xl font-semibold">
              {data.summary.poCoverage ?? 0} / {data.summary.programOutcomes ?? data.programOutcomes.length}
            </p>
          </Surface>
        ) : null}
        {flags.pso ? (
          <Surface>
            <p className="text-xs uppercase text-ink-muted">PSO Coverage</p>
            <p className="mt-1 text-2xl font-semibold">
              {data.summary.psoCoverage ?? 0} /{' '}
              {data.summary.programSpecificOutcomes ?? (data.programSpecificOutcomes || []).length}
            </p>
          </Surface>
        ) : null}
        {flags.sdg ? (
          <Surface>
            <p className="text-xs uppercase text-ink-muted">Relevant SDGs</p>
            <p className="mt-1 text-2xl font-semibold">{data.summary.relevantSdgs ?? 0}</p>
          </Surface>
        ) : null}
        <Surface>
          <p className="text-xs uppercase text-ink-muted">Total Relationships</p>
          <p className="mt-1 text-2xl font-semibold">{data.summary.activeCorrelations}</p>
        </Surface>
      </div>

      <div className="mb-5 flex flex-wrap gap-1 border-b border-border pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cn(
              'rounded-t-md px-3 py-2 text-sm font-medium',
              tab === t.id ? 'bg-surface text-accent shadow-[inset_0_-2px_0_0_currentColor]' : 'text-ink-muted hover:text-ink',
            )}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="space-y-5">
          <Surface>
            <p className="text-sm text-ink-secondary">
              One academic mapping for this subject. All selected outcome families appear in a single combined matrix —
              not separate CO–PO / CO–PSO / CO–SDG tables.
            </p>
          </Surface>
          {data.mapping.status === 'DRAFT' && upgradeOptions.length ? (
            <Surface>
              <h3 className="text-sm font-semibold">Upgrade Mapping</h3>
              <p className="mt-1 text-sm text-ink-secondary">
                Add domains to this draft without losing reviewed values.
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <Field label="New mapping type">
                  <Select value={upgradeType} onChange={(e) => setUpgradeType(e.target.value as AcademicMappingType | '')}>
                    <option value="">Select upgrade…</option>
                    {upgradeOptions.map((t) => (
                      <option key={t} value={t}>
                        {ACADEMIC_MAPPING_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button
                  disabled={!upgradeType || busy}
                  onClick={async () => {
                    if (!upgradeType) return;
                    setBusy(true);
                    try {
                      const next = await api<MappingDetail>(`/api/copo/academic-mappings/${data.mapping.id}/upgrade`, {
                        method: 'POST',
                        body: JSON.stringify({ mappingType: upgradeType }),
                      });
                      setData(next);
                      setUpgradeType('');
                      setTab('matrix');
                      toast('Mapping upgraded', 'success');
                    } catch (e) {
                      toast(e instanceof Error ? e.message : 'Upgrade failed', 'error');
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Upgrade
                </Button>
              </div>
            </Surface>
          ) : null}
        </div>
      ) : null}

      {tab === 'matrix' ? (
        <CombinedMappingMatrix
          courseOutcomes={data.courseOutcomes}
          groups={groups}
          cells={data.cells}
          includeSdg={flags.sdg}
          showAllSdgs={data.mapping.showAllSdgs}
          onToggleShowAllSdgs={async (showAll) => {
            const next = await api<MappingDetail>(`/api/copo/academic-mappings/${data.mapping.id}/show-all-sdgs`, {
              method: 'POST',
              body: JSON.stringify({ showAll }),
            });
            setData(next);
          }}
          onCellClick={(cell, domain, coId, targetId) => openCell(cell as Cell | undefined, domain, coId, targetId)}
          onInspectCo={(co) => setInspect({ title: co.code, body: <p className="text-sm text-ink-secondary">{co.statement}</p> })}
          onInspectTarget={(domain, target) =>
            setInspect({
              title: target.code,
              body: (
                <div className="space-y-2 text-sm text-ink-secondary">
                  <p className="text-xs uppercase text-ink-muted">{domain}</p>
                  <p className="font-medium text-ink">{target.shortTitle || target.officialTitle || target.code}</p>
                  <p>{target.officialStatement || target.officialDescription || '—'}</p>
                </div>
              ),
            })
          }
        />
      ) : null}

      {tab === 'outcomes' ? (
        <div className="space-y-5">
          <Surface>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Course Outcomes</h3>
            <div className="mt-3 space-y-3">
              {data.courseOutcomes.map((co) => (
                <div key={co.id}>
                  <p className="text-sm font-semibold text-accent">{co.code}</p>
                  <p className="text-sm text-ink-secondary">{co.statement}</p>
                </div>
              ))}
            </div>
          </Surface>
          {flags.po ? (
            <Surface>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Program Outcomes</h3>
              <div className="mt-3 space-y-2">
                {data.programOutcomes.map((t) => (
                  <div key={t.id}>
                    <p className="text-sm font-semibold text-accent">{t.code}</p>
                    <p className="text-sm text-ink-secondary">{t.officialStatement || t.shortTitle || '—'}</p>
                  </div>
                ))}
              </div>
            </Surface>
          ) : null}
          {flags.pso ? (
            <Surface>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Program Specific Outcomes</h3>
              <div className="mt-3 space-y-2">
                {(data.programSpecificOutcomes || []).map((t) => (
                  <div key={t.id}>
                    <p className="text-sm font-semibold text-accent">{t.code}</p>
                    <p className="text-sm text-ink-secondary">{t.officialStatement || t.shortTitle || '—'}</p>
                  </div>
                ))}
              </div>
            </Surface>
          ) : null}
          {flags.sdg ? (
            <Surface>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
                Relevant Sustainable Development Goals
              </h3>
              <div className="mt-3 space-y-2">
                {(groups.find((g) => g.type === 'SDG')?.targets || []).map((t) => (
                  <div key={t.id}>
                    <p className="text-sm font-semibold text-accent">{t.code}</p>
                    <p className="text-sm text-ink-secondary">
                      {t.officialStatement || t.officialDescription || t.shortTitle || t.officialTitle || '—'}
                    </p>
                  </div>
                ))}
              </div>
            </Surface>
          ) : null}
        </div>
      ) : null}

      {inspect ? (
        <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-border bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">{inspect.title}</p>
            <Button variant="secondary" size="sm" onClick={() => setInspect(null)}>
              Close
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">{inspect.body}</div>
        </div>
      ) : null}

      {selectedCell ? (
        <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-border bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold">
                {coForSelected?.code || 'CO'} → {targetForSelected?.code || 'Target'}
              </p>
              <p className="text-xs text-ink-muted">
                {strengthLabel(selectedCell.domain || 'PO', selectedCell.currentValue)}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setSelectedCell(null)}>
              Close
            </Button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
            <div>
              <p className="text-xs uppercase text-ink-muted">Course Outcome</p>
              <p className="mt-1 text-ink-secondary">{coForSelected?.statement || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-ink-muted">
                {selectedCell.domain === 'PSO'
                  ? 'Program Specific Outcome'
                  : selectedCell.domain === 'SDG'
                    ? 'Sustainable Development Goal'
                    : 'Program Outcome'}
              </p>
              <p className="mt-1 font-medium">{targetForSelected?.code}</p>
              <p className="text-ink-secondary">
                {targetForSelected?.officialStatement ||
                  targetForSelected?.officialDescription ||
                  targetForSelected?.shortTitle ||
                  '—'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-ink-muted">Master Justification</p>
              <p className="mt-1 text-ink-secondary">
                {selectedCell.rationale?.trim() || 'Justification not available in master data.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs uppercase text-ink-muted">Master Value</p>
                <p className="mt-1 font-semibold">{selectedCell.masterValue ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-ink-muted">Current Value</p>
                <p className="mt-1 font-semibold">{selectedCell.currentValue ?? '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase text-ink-muted">Source / Origin</p>
              <p className="mt-1">{selectedCell.mappingOrigin || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-ink-muted">Verification</p>
              <p className="mt-1 font-medium">{selectedCell.verificationStatus || '—'}</p>
            </div>
            {selectedCell.overrideJustification ? (
              <div>
                <p className="text-xs uppercase text-ink-muted">Change Justification</p>
                <p className="mt-1 text-ink-secondary">{selectedCell.overrideJustification}</p>
              </div>
            ) : null}
            {editable ? (
              <div className="space-y-3 border-t border-border pt-3">
                <Field label="Change Mapping">
                  <Select value={editValue} onChange={(e) => setEditValue(e.target.value)}>
                    <option value="">— No Mapping</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </Select>
                </Field>
                {(editValue === '' ? null : Number(editValue)) !== selectedCell.masterValue ? (
                  <Field label="Change Justification">
                    <Textarea
                      rows={3}
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Explain why this differs from the master value…"
                    />
                  </Field>
                ) : null}
                <Button disabled={busy} onClick={saveCell}>
                  Save Cell
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        {data.permissions.canReset ? (
          <Button
            variant="secondary"
            onClick={async () => {
              await api(`/api/copo/academic-mappings/${data.mapping.id}/reset`, { method: 'POST', body: '{}' });
              load();
              toast('Reset to master values', 'success');
            }}
          >
            Reset to Master
          </Button>
        ) : null}
        <Button
          variant="secondary"
          onClick={async () => {
            await api(`/api/copo/academic-mappings/${data.mapping.id}/save-draft`, { method: 'POST', body: '{}' });
            load();
            toast('Draft saved', 'success');
          }}
        >
          Save Draft
        </Button>
        {data.permissions.canFinalize ? (
          <Button
            onClick={async () => {
              await api(`/api/copo/academic-mappings/${data.mapping.id}/finalize`, { method: 'POST', body: '{}' });
              load();
              toast('Mapping finalized', 'success');
            }}
          >
            Finalize
          </Button>
        ) : null}
      </div>
      <ConfirmDangerModal
        open={deleteOpen}
        title="Delete this mapping?"
        description="This removes the academic mapping from your list so you can create a new one for the same subject if needed."
        confirmLabel="Delete Mapping"
        loading={busy}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setBusy(true);
          try {
            await api(`/api/copo/academic-mappings/${data.mapping.id}`, { method: 'DELETE' });
            toast('Mapping deleted');
            navigate(rootPath);
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Could not delete mapping', 'error');
            setDeleteOpen(false);
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
