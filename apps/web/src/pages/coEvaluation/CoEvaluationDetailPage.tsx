import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, downloadCopoExport } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import {
  Button,
  Field,
  Input,
  PageHeader,
  StatusBadge,
  Surface,
  Textarea,
  useToast,
} from '../../components/ui';

type MatrixComponent = {
  id: number;
  assessmentComponentId: string;
  componentCode?: string | null;
  displayName: string;
  category?: string | null;
  officialMaxMarks: number | null;
  displayOrder: number;
  includeInMatrix: boolean;
  lecturerEditable: boolean;
};

type MatrixCo = {
  id: number;
  coCode: string;
  coStatement?: string | null;
  displayOrder: number;
  masterMarksDistribution: number | null;
  currentMarksDistribution: number | null;
  masterEvaluationPercent: number | null;
  currentEvaluationPercent: number | null;
  marksDistributionEditable: boolean;
  evaluationPercentEditable: boolean;
  marksDistributionChangeJustification?: string | null;
  evaluationPercentChangeJustification?: string | null;
  coSourceStatus?: string | null;
  verificationStatus?: string | null;
  modified: boolean;
};

type MatrixCell = {
  id: number;
  coRowId: number;
  componentRowId: number;
  coCode: string;
  assessmentComponentId: string;
  masterValue: number | null;
  currentValue: number | null;
  lecturerEditable: boolean;
  masterJustification?: string | null;
  changeJustification?: string | null;
  mappingBasis?: string | null;
  sourceOrigin?: string | null;
  verificationStatus?: string | null;
  modified: boolean;
};

type Validation = {
  okForFinalize: boolean;
  componentTotals: Array<{
    assessmentComponentId: string;
    displayName: string;
    allocated: number;
    expected: number | null;
    delta: number | null;
    status: string;
  }>;
  evaluationPercentTotal: number;
  evaluationPercentStatus: string;
  allocatedMarks: number;
  expectedMarks: number | null;
  modifiedCellCount: number;
  issues: Array<{
    code: string;
    severity: string;
    message: string;
    coCode?: string;
    assessmentComponentId?: string;
  }>;
};

type Evaluation = {
  id: number;
  status: string;
  subjectName: string;
  courseCode: string;
  schemeLabel?: string | null;
  programName?: string | null;
  semesterLabel?: string | null;
  academicYearLabel?: string | null;
  courseType?: string | null;
  facultyName?: string | null;
  verificationStatus?: string | null;
  sourceStatus?: string | null;
  finalizedAt?: string | null;
  updatedAt?: string | null;
  snapshotMeta?: Record<string, unknown> | null;
  assessmentStructure?: {
    structure?: Record<string, unknown> | null;
    courseComponents?: Array<Record<string, unknown>>;
    sources?: Array<Record<string, unknown>>;
  } | null;
  components: MatrixComponent[];
  cos: MatrixCo[];
  cells: MatrixCell[];
  justifications: Array<{
    coCode: string;
    assessmentComponentId: string;
    componentName: string;
    standardValue: number | null;
    currentValue: number | null;
    masterJustification?: string | null;
    lecturerChangeJustification?: string | null;
    sourceStatus?: string | null;
    modified: boolean;
  }>;
  validation: Validation;
  summary: {
    courseOutcomes: number;
    assessmentComponents: number;
    allocatedMarks: number;
    expectedMarks: number | null;
    evaluationAllocation: number;
    modifiedValues: number;
    status: string;
  };
};

type AuditEvent = {
  id: number;
  action: string;
  createdAt: string;
  cellId?: number | null;
  coRowId?: number | null;
  actor: string;
  metadata?: Record<string, unknown> | null;
};

function dash(n: number | null | undefined) {
  if (n == null || !Number.isFinite(Number(n)) || Number(n) === 0) return '—';
  return String(n);
}

export function CoEvaluationDetailPage({ basePath = '/co-evaluation' }: { basePath?: string }) {
  const { id } = useParams();
  const { toast } = useToast();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [tab, setTab] = useState<'overview' | 'matrix' | 'justifications' | 'source' | 'audit'>('matrix');
  const [structureOpen, setStructureOpen] = useState(false);
  const [drawerCell, setDrawerCell] = useState<MatrixCell | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editJustification, setEditJustification] = useState('');
  const [percentEdit, setPercentEdit] = useState<{ coRowId: number; value: string; justification: string } | null>(
    null,
  );
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api<{ evaluation: Evaluation }>(`/api/co-evaluation/${id}`);
      setEvaluation(res.evaluation);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not load CO Evaluation', 'error');
    }
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (tab !== 'audit' || !id) return;
    api<{ events: AuditEvent[] }>(`/api/co-evaluation/${id}/audit`)
      .then((res) => setAudit(res.events || []))
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load activity log', 'error'));
  }, [tab, id, toast]);

  useDocumentTitle(evaluation ? `${evaluation.subjectName} · CO Evaluation` : 'CO Evaluation');

  const matrixComponents = useMemo(
    () => (evaluation?.components || []).filter((c) => c.includeInMatrix),
    [evaluation],
  );

  const cellMap = useMemo(() => {
    const map = new Map<string, MatrixCell>();
    for (const cell of evaluation?.cells || []) {
      map.set(`${cell.coCode}|${cell.assessmentComponentId}`, cell);
    }
    return map;
  }, [evaluation]);

  useEffect(() => {
    if (!drawerCell || !evaluation) return;
    const fresh = evaluation.cells.find((c) => c.id === drawerCell.id);
    if (fresh) setDrawerCell(fresh);
  }, [evaluation, drawerCell?.id]);

  if (!evaluation) {
    return <div className="animate-fade-in p-8 text-sm text-ink-muted">Loading CO Evaluation…</div>;
  }

  const isDraft = evaluation.status === 'DRAFT';
  const isFinalized = evaluation.status === 'FINALIZED';

  const openCell = (cell: MatrixCell) => {
    setDrawerCell(cell);
    setEditValue(cell.currentValue == null || cell.currentValue === 0 ? '' : String(cell.currentValue));
    setEditJustification(cell.changeJustification || '');
  };

  const saveCell = async () => {
    if (!drawerCell) return;
    const next = editValue.trim() === '' ? 0 : Number(editValue);
    if (!Number.isFinite(next) || next < 0) {
      toast('Enter a valid marks value', 'error');
      return;
    }
    const master = Number(drawerCell.masterValue || 0);
    const changed = Math.abs(master - next) > 0.05;
    if (changed && !editJustification.trim()) {
      toast('Change justification is required when modifying a standard value', 'error');
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ evaluation: Evaluation }>(
        `/api/co-evaluation/${evaluation.id}/cells/${drawerCell.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            currentValue: next,
            changeJustification: changed ? editJustification.trim() : editJustification.trim() || null,
          }),
        },
      );
      setEvaluation(res.evaluation);
      toast('Cell updated');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save cell', 'error');
    } finally {
      setBusy(false);
    }
  };

  const resetCell = async () => {
    if (!drawerCell) return;
    setBusy(true);
    try {
      const res = await api<{ evaluation: Evaluation }>(
        `/api/co-evaluation/${evaluation.id}/cells/${drawerCell.id}/reset`,
        { method: 'POST', body: JSON.stringify({}) },
      );
      setEvaluation(res.evaluation);
      toast('Cell reset to standard');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not reset cell', 'error');
    } finally {
      setBusy(false);
    }
  };

  const savePercent = async () => {
    if (!percentEdit) return;
    const next = Number(percentEdit.value);
    if (!Number.isFinite(next) || next < 0 || next > 100) {
      toast('Enter a valid evaluation % between 0 and 100', 'error');
      return;
    }
    const co = evaluation.cos.find((c) => c.id === percentEdit.coRowId);
    if (!co) return;
    const master = Number(co.masterEvaluationPercent || 0);
    const changed = Math.abs(master - next) > 0.05;
    if (changed && !percentEdit.justification.trim()) {
      toast('Change justification is required when modifying evaluation %', 'error');
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ evaluation: Evaluation }>(
        `/api/co-evaluation/${evaluation.id}/cos/${percentEdit.coRowId}/percent`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            currentEvaluationPercent: next,
            changeJustification: changed ? percentEdit.justification.trim() : null,
          }),
        },
      );
      setEvaluation(res.evaluation);
      setPercentEdit(null);
      toast('Evaluation % updated');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not update %', 'error');
    } finally {
      setBusy(false);
    }
  };

  const resetAll = async () => {
    if (!window.confirm('Reset all values to the academic standard? Lecturer changes will be cleared.')) return;
    setBusy(true);
    try {
      const res = await api<{ evaluation: Evaluation }>(`/api/co-evaluation/${evaluation.id}/reset`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setEvaluation(res.evaluation);
      toast('Reset to standard');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Reset failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const saveDraft = async () => {
    setBusy(true);
    try {
      const res = await api<{ evaluation: Evaluation }>(`/api/co-evaluation/${evaluation.id}/save-draft`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setEvaluation(res.evaluation);
      toast('Draft saved');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save draft', 'error');
    } finally {
      setBusy(false);
    }
  };

  const finalize = async () => {
    if (!evaluation.validation.okForFinalize) {
      toast('Resolve validation issues before finalizing', 'error');
      return;
    }
    if (!window.confirm('Finalize this CO Evaluation? Values will be locked until reopened.')) return;
    setBusy(true);
    try {
      const res = await api<{ evaluation: Evaluation }>(`/api/co-evaluation/${evaluation.id}/finalize`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setEvaluation(res.evaluation);
      toast('CO Evaluation finalized');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Cannot finalize', 'error');
    } finally {
      setBusy(false);
    }
  };

  const reopen = async () => {
    if (!window.confirm('Reopen this finalized evaluation as a draft?')) return;
    setBusy(true);
    try {
      const res = await api<{ evaluation: Evaluation }>(`/api/co-evaluation/${evaluation.id}/reopen`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setEvaluation(res.evaluation);
      toast('Evaluation reopened');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not reopen', 'error');
    } finally {
      setBusy(false);
    }
  };

  const snap = evaluation.assessmentStructure;
  const issues = evaluation.validation.issues || [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={evaluation.subjectName}
        subtitle={`CO Evaluation · ${evaluation.courseCode}${evaluation.schemeLabel ? ` · ${evaluation.schemeLabel}` : ''}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={`${basePath}/${evaluation.id}/print`} target="_blank">
              <Button variant="secondary" size="sm">
                Print
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                downloadCopoExport(`/api/co-evaluation/${evaluation.id}/export`, 'co-evaluation.xlsx').catch((e) =>
                  toast(e instanceof Error ? e.message : 'Export failed', 'error'),
                )
              }
            >
              Export
            </Button>
            {isDraft ? (
              <>
                <Button variant="secondary" size="sm" disabled={busy} onClick={resetAll}>
                  Reset to Standard
                </Button>
                <Button variant="secondary" size="sm" disabled={busy} onClick={saveDraft}>
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  disabled={busy || !evaluation.validation.okForFinalize}
                  onClick={finalize}
                  title={
                    evaluation.validation.okForFinalize
                      ? undefined
                      : 'Resolve validation issues before finalizing'
                  }
                >
                  Finalize
                </Button>
              </>
            ) : null}
            {isFinalized ? (
              <Button size="sm" variant="secondary" disabled={busy} onClick={reopen}>
                Reopen
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="text-sm text-ink-secondary">
          {[evaluation.programName, evaluation.semesterLabel, evaluation.academicYearLabel]
            .filter(Boolean)
            .join(' · ')}
          <div className="mt-1 text-xs text-ink-muted">
            Prepared by {evaluation.facultyName || '—'}
            {evaluation.courseType ? ` · ${evaluation.courseType}` : ''}
          </div>
        </div>
        <StatusBadge status={evaluation.status} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Course Outcomes" value={evaluation.summary.courseOutcomes} />
        <Stat label="Assessment Components" value={evaluation.summary.assessmentComponents} />
        <Stat
          label="Allocated Marks"
          value={
            evaluation.summary.expectedMarks == null
              ? evaluation.summary.allocatedMarks
              : `${evaluation.summary.allocatedMarks}/${evaluation.summary.expectedMarks}`
          }
        />
        <Stat
          label="Evaluation Allocation %"
          value={`${Number(evaluation.summary.evaluationAllocation || 0).toFixed(1)}%`}
        />
        <Stat label="Modified Values" value={evaluation.summary.modifiedValues} />
        <Stat label="Status" value={evaluation.summary.status} />
      </div>

      {issues.length ? (
        <Surface className="mb-4 space-y-2">
          <h3 className="text-sm font-semibold text-ink">Validation</h3>
          <ul className="space-y-1 text-sm">
            {issues.map((issue, idx) => (
              <li
                key={`${issue.code}-${idx}`}
                className={issue.severity === 'error' ? 'text-danger' : 'text-ink-secondary'}
              >
                {issue.severity === 'error' ? 'Error' : 'Warning'} · {issue.message}
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}

      <Surface className="mb-4">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => setStructureOpen((o) => !o)}
        >
          <div>
            <h3 className="text-sm font-semibold text-ink">Official Assessment Structure</h3>
            <p className="mt-0.5 text-xs text-ink-muted">
              {structureOpen ? 'Hide official CIE/SEE structure' : 'Expand to view official structure'}
            </p>
          </div>
          <span className="text-xs text-ink-muted">{structureOpen ? 'Hide' : 'Show'}</span>
        </button>
        {structureOpen ? (
          <div className="mt-4 space-y-3 border-t border-border pt-4 text-sm">
            {snap?.structure ? (
              <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(snap.structure)
                  .filter(([k]) => !['id', 'college_id', 'created_at', 'updated_at', 'import_batch'].includes(k))
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[11px] uppercase tracking-wide text-ink-muted">
                        {k.replace(/_/g, ' ')}
                      </dt>
                      <dd className="mt-0.5 font-medium text-ink">{v == null || v === '' ? '—' : String(v)}</dd>
                    </div>
                  ))}
              </dl>
            ) : (
              <p className="text-ink-muted">No assessment structure snapshot on this evaluation.</p>
            )}
            {(snap?.courseComponents || []).length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-surface-muted text-ink-muted">
                    <tr>
                      <th className="px-2 py-1.5">Component</th>
                      <th className="px-2 py-1.5">Max Marks</th>
                      <th className="px-2 py-1.5">Mandatory</th>
                      <th className="px-2 py-1.5">Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(snap?.courseComponents || []).map((c, idx) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="px-2 py-1.5">{String(c.component_name || c.component_id || '—')}</td>
                        <td className="px-2 py-1.5">{c.max_marks == null ? '—' : String(c.max_marks)}</td>
                        <td className="px-2 py-1.5">{c.mandatory ? 'Yes' : 'No'}</td>
                        <td className="px-2 py-1.5">{String(c.verification_status || '—')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ) : null}
      </Surface>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-2 text-sm">
        {(
          [
            ['overview', 'Overview'],
            ['matrix', 'Evaluation Matrix'],
            ['justifications', 'Justifications'],
            ['source', 'Source'],
            ['audit', 'Activity Log'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`rounded-md px-3 py-1.5 ${tab === key ? 'bg-accent-soft text-accent font-medium' : 'text-ink-secondary hover:bg-surface-muted'}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <Surface className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Course Type" value={evaluation.courseType || '—'} />
            <Stat label="CO Count" value={evaluation.summary.courseOutcomes} />
            <Stat label="Components" value={evaluation.summary.assessmentComponents} />
            <Stat
              label="Allocation"
              value={
                evaluation.summary.expectedMarks == null
                  ? String(evaluation.summary.allocatedMarks)
                  : `${evaluation.summary.allocatedMarks} / ${evaluation.summary.expectedMarks}`
              }
            />
            <Stat
              label="Evaluation %"
              value={`${Number(evaluation.summary.evaluationAllocation || 0).toFixed(2)}%`}
            />
            <Stat label="Review / Source" value={evaluation.verificationStatus || evaluation.sourceStatus || '—'} />
            <Stat label="Modified Cells" value={evaluation.summary.modifiedValues} />
            <Stat label="Ready to Finalize" value={evaluation.validation.okForFinalize ? 'Yes' : 'No'} />
          </div>
        </Surface>
      ) : null}

      {tab === 'matrix' ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-surface-muted text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="whitespace-nowrap px-3 py-2">CO</th>
                {matrixComponents.map((c) => (
                  <th key={c.id} className="whitespace-nowrap px-3 py-2">
                    <div>{c.displayName}</div>
                    {c.officialMaxMarks != null ? (
                      <div className="mt-0.5 font-normal normal-case text-ink-muted">Max {c.officialMaxMarks}</div>
                    ) : null}
                  </th>
                ))}
                <th className="whitespace-nowrap px-3 py-2">Marks Distribution</th>
                <th className="whitespace-nowrap px-3 py-2">% Assigned</th>
              </tr>
            </thead>
            <tbody>
              {evaluation.cos.map((co) => (
                <tr key={co.id} className="border-t border-border">
                  <td className="px-3 py-2 align-top">
                    <div className="font-semibold text-ink" title={co.coStatement || undefined}>
                      {co.coCode}
                    </div>
                    {co.coStatement ? (
                      <div className="mt-0.5 line-clamp-2 text-xs text-ink-muted" title={co.coStatement}>
                        {co.coStatement}
                      </div>
                    ) : null}
                  </td>
                  {matrixComponents.map((comp) => {
                    const cell = cellMap.get(`${co.coCode}|${comp.assessmentComponentId}`);
                    if (!cell) {
                      return (
                        <td key={comp.id} className="px-3 py-2 text-ink-muted">
                          —
                        </td>
                      );
                    }
                    return (
                      <td key={comp.id} className="px-3 py-2">
                        <button
                          type="button"
                          className={`group relative min-w-[3rem] rounded-md px-2 py-1 text-left hover:bg-surface-muted ${
                            cell.modified ? 'ring-1 ring-border' : ''
                          }`}
                          onClick={() => openCell(cell)}
                        >
                          <span className="font-medium text-ink">{dash(cell.currentValue)}</span>
                          {cell.modified ? (
                            <span className="mt-0.5 block text-[10px] text-ink-muted">Modified from Standard</span>
                          ) : null}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 font-medium text-ink">{dash(co.currentMarksDistribution)}</td>
                  <td className="px-3 py-2">
                    {isDraft && co.evaluationPercentEditable ? (
                      <button
                        type="button"
                        className="rounded-md px-2 py-1 font-medium text-ink hover:bg-surface-muted"
                        onClick={() =>
                          setPercentEdit({
                            coRowId: co.id,
                            value:
                              co.currentEvaluationPercent == null ? '' : String(co.currentEvaluationPercent),
                            justification: co.evaluationPercentChangeJustification || '',
                          })
                        }
                      >
                        {dash(co.currentEvaluationPercent)}
                        {co.modified && co.currentEvaluationPercent !== co.masterEvaluationPercent ? (
                          <span className="mt-0.5 block text-[10px] font-normal text-ink-muted">Modified</span>
                        ) : null}
                      </button>
                    ) : (
                      <span className="font-medium text-ink">{dash(co.currentEvaluationPercent)}</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-border bg-surface-muted/50 font-semibold">
                <td className="px-3 py-2 text-ink">TOTAL</td>
                {matrixComponents.map((comp) => {
                  const total = evaluation.validation.componentTotals.find(
                    (t) => t.assessmentComponentId === comp.assessmentComponentId,
                  );
                  return (
                    <td key={comp.id} className="px-3 py-2 text-ink">
                      {total
                        ? total.expected == null
                          ? total.allocated
                          : `${total.allocated}/${total.expected}`
                        : '—'}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-ink">
                  {evaluation.summary.expectedMarks == null
                    ? evaluation.summary.allocatedMarks
                    : `${evaluation.summary.allocatedMarks}/${evaluation.summary.expectedMarks}`}
                </td>
                <td className="px-3 py-2 text-ink">
                  {Number(evaluation.validation.evaluationPercentTotal || 0).toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'justifications' ? (
        <Surface className="space-y-3">
          {evaluation.justifications.length ? (
            evaluation.justifications.map((j, idx) => (
              <div key={`${j.coCode}-${j.assessmentComponentId}-${idx}`} className="border-t border-border pt-3 first:border-0 first:pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-ink">
                    {j.coCode} → {j.componentName}
                  </span>
                  {j.modified ? <StatusBadge status="MODIFIED" /> : null}
                </div>
                <div className="mt-1 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-ink-muted">Standard</div>
                    <div>{dash(j.standardValue)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink-muted">Current</div>
                    <div>{dash(j.currentValue)}</div>
                  </div>
                </div>
                {j.masterJustification ? (
                  <p className="mt-2 text-sm text-ink-secondary">
                    <span className="font-medium text-ink">Master justification · </span>
                    {j.masterJustification}
                  </p>
                ) : null}
                {j.lecturerChangeJustification ? (
                  <p className="mt-1 text-sm text-ink-secondary">
                    <span className="font-medium text-ink">Lecturer change · </span>
                    {j.lecturerChangeJustification}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-ink-muted">No justifications recorded.</p>
          )}
        </Surface>
      ) : null}

      {tab === 'source' ? (
        <Surface className="space-y-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-muted">Verification Status</dt>
              <dd className="mt-1 font-medium text-ink">
                {(evaluation.verificationStatus || '—').replace(/_/g, ' ')}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-muted">Source Status</dt>
              <dd className="mt-1 font-medium text-ink">{(evaluation.sourceStatus || '—').replace(/_/g, ' ')}</dd>
            </div>
          </dl>
          {evaluation.snapshotMeta ? (
            <div>
              <h3 className="text-sm font-semibold text-ink">Snapshot meta</h3>
              <pre className="mt-2 overflow-x-auto rounded-md bg-surface-muted p-3 text-xs text-ink-secondary">
                {JSON.stringify(evaluation.snapshotMeta, null, 2)}
              </pre>
            </div>
          ) : null}
          {(snap?.sources || []).length ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-ink">Source notes</h3>
              {(snap?.sources || []).map((s, idx) => (
                <div key={idx} className="border-t border-border pt-2 text-ink-secondary">
                  <div className="font-medium text-ink">
                    {String(s.source_id || s.source_type || `Source ${idx + 1}`)}
                  </div>
                  <div className="text-xs">
                    {[s.source_file, s.source_page_section, s.verification_status]
                      .filter(Boolean)
                      .map(String)
                      .join(' · ')}
                  </div>
                  {s.field_value != null ? <div className="mt-1 text-xs">{String(s.field_value)}</div> : null}
                </div>
              ))}
            </div>
          ) : null}
        </Surface>
      ) : null}

      {tab === 'audit' ? (
        <Surface className="space-y-3">
          {audit.length ? (
            audit.map((ev) => (
              <div key={ev.id} className="border-t border-border pt-3 text-sm first:border-0 first:pt-0">
                <div className="font-medium text-ink">{String(ev.action).replace(/_/g, ' ')}</div>
                <div className="text-xs text-ink-muted">
                  {ev.actor} · {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : '—'}
                </div>
                {ev.metadata ? (
                  <pre className="mt-1 overflow-x-auto text-xs text-ink-secondary">
                    {JSON.stringify(ev.metadata)}
                  </pre>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-ink-muted">No activity recorded yet.</p>
          )}
        </Surface>
      ) : null}

      {drawerCell ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={() => setDrawerCell(null)}>
          <aside
            className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-surface p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {drawerCell.coCode} ·{' '}
                  {matrixComponents.find((c) => c.assessmentComponentId === drawerCell.assessmentComponentId)
                    ?.displayName || drawerCell.assessmentComponentId}
                </div>
                <h2 className="mt-1 text-lg font-semibold text-ink">Cell detail</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDrawerCell(null)}>
                Close
              </Button>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-ink-muted">Master value</dt>
                <dd className="font-medium">{dash(drawerCell.masterValue)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Current value</dt>
                <dd className="font-medium">{dash(drawerCell.currentValue)}</dd>
              </div>
            </dl>

            {drawerCell.masterJustification ? (
              <p className="mt-4 text-sm text-ink-secondary">
                <span className="font-medium text-ink">Master justification</span>
                <br />
                {drawerCell.masterJustification}
              </p>
            ) : null}

            {drawerCell.changeJustification ? (
              <p className="mt-3 text-sm text-ink-secondary">
                <span className="font-medium text-ink">Lecturer change justification</span>
                <br />
                {drawerCell.changeJustification}
              </p>
            ) : null}

            {drawerCell.modified ? (
              <p className="mt-3 text-xs text-ink-muted">Modified from Standard</p>
            ) : null}

            {isDraft && drawerCell.lecturerEditable ? (
              <div className="mt-5 space-y-3 border-t border-border pt-4">
                <Field label="Current value">
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                  />
                </Field>
                <Field
                  label="Change justification"
                  hint="Required when the value differs from the academic standard."
                >
                  <Textarea
                    value={editJustification}
                    onChange={(e) => setEditJustification(e.target.value)}
                    placeholder="Explain why this allocation differs from standard…"
                  />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={busy} onClick={saveCell}>
                    Save
                  </Button>
                  <Button size="sm" variant="secondary" disabled={busy} onClick={resetCell}>
                    Reset this value
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm text-ink-muted">
                {isDraft
                  ? 'This cell is not lecturer-editable.'
                  : 'Editing is available only while the evaluation is in DRAFT.'}
              </p>
            )}
          </aside>
        </div>
      ) : null}

      {percentEdit ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4" onClick={() => setPercentEdit(null)}>
          <div
            className="w-full max-w-md rounded-[var(--radius-lg)] bg-surface p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-ink">Edit evaluation %</h2>
            <div className="mt-4 space-y-3">
              <Field label="% Assigned">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  value={percentEdit.value}
                  onChange={(e) => setPercentEdit((p) => (p ? { ...p, value: e.target.value } : p))}
                />
              </Field>
              <Field label="Change justification" hint="Required when changed from master %.">
                <Textarea
                  value={percentEdit.justification}
                  onChange={(e) => setPercentEdit((p) => (p ? { ...p, justification: e.target.value } : p))}
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={busy} onClick={savePercent}>
                  Save
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setPercentEdit(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Surface className="!p-3">
      <div className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold text-ink">{value}</div>
    </Surface>
  );
}
