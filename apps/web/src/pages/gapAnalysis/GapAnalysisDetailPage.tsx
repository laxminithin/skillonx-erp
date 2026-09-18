import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, downloadCopoExport } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import {
  Button,
  Field,
  Input,
  PageHeader,
  Select,
  StatusBadge,
  Surface,
  Textarea,
  useToast,
} from '../../components/ui';

type GapItem = {
  id: number;
  gapId: string;
  serialNo: number;
  gapType: string;
  gapStatement: string;
  gapJustification?: string | null;
  moduleUnit?: string | null;
  relatedTopic?: string | null;
  priority?: string | null;
  expectedCoverageLevel: number | null;
  expectedCoverageLabel: string | null;
  actualCoverageLevel: number | null;
  actualCoverageLabel: string | null;
  coveragePercent: number | null;
  suggestedActionType?: string | null;
  suggestedActionTitle?: string | null;
  suggestedActionLabel?: string | null;
  verificationStatus?: string | null;
  mappingOrigin?: string | null;
  sourceBasis?: string | null;
  needsReview?: boolean;
  applicability: string;
  notApplicableReason?: string | null;
  itemStatus: string;
  closureNote?: string | null;
  relatedCos: Array<{ coCode: string; coStatement?: string | null }>;
  outcomes: Array<{
    coCode?: string | null;
    outcomeType: string;
    outcomeCode: string;
    strength?: number | null;
    derivedFrom?: string | null;
  }>;
  actions: Array<{
    id: number;
    title: string;
    actionType: string;
    actionTypeLabel?: string;
    status: string;
    plannedDate?: string | null;
    actualDate?: string | null;
    expectedOutcome?: string | null;
    actualOutcome?: string | null;
  }>;
  evidence: Array<{ id: number; title: string; evidenceType: string }>;
  lessonPlan?: { planned: boolean; completed: boolean; module?: string | null; topic?: string | null };
};

type Analysis = {
  id: number;
  subjectName: string;
  courseCode: string;
  schemeLabel?: string | null;
  programName?: string | null;
  semesterLabel?: string | null;
  academicYearLabel?: string | null;
  preparedBy?: string | null;
  status: string;
  summary: {
    totalGaps: number;
    applicable: number;
    closed: number;
    open: number;
    notApplicable: number;
    covered: number;
    partiallyCovered: number;
    notCovered: number;
    coveragePercent: number | null;
    actionsTotal: number;
    actionsCompleted: number;
    evidenceCount: number;
    byType: Record<string, number>;
  };
  assessment?: { questionBankCount: number; quizUsageCount: number };
  items: GapItem[];
};

const COVERAGE_OPTIONS = [
  { value: 0, label: 'Not Covered' },
  { value: 1, label: 'Introduced' },
  { value: 2, label: 'Partially Covered' },
  { value: 3, label: 'Adequately Covered' },
  { value: 4, label: 'Extensively Covered' },
];

const ACTION_TYPES = [
  'HANDS_ON_LAB',
  'CASE_STUDY',
  'WORKSHOP',
  'GUEST_LECTURE',
  'ASSIGNMENT',
  'QUIZ_ASSESSMENT',
  'MINI_PROJECT',
  'SEMINAR',
  'TUTORIAL',
  'SELF_LEARNING',
  'OTHER',
];

export function GapAnalysisDetailPage({ basePath = '/gap-analysis' }: { basePath?: string }) {
  const { id } = useParams();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [tab, setTab] = useState<'overview' | 'gaps' | 'actions' | 'evidence' | 'report'>('gaps');
  const [drawerItem, setDrawerItem] = useState<GapItem | null>(null);
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionForm, setActionForm] = useState({
    actionType: 'HANDS_ON_LAB',
    title: '',
    plannedDate: '',
    expectedOutcome: '',
    description: '',
  });
  const [closeForm, setCloseForm] = useState({
    closureNote: '',
    actualCoverageLevel: '3',
    alternativeCoverageExplanation: '',
  });
  const [naReason, setNaReason] = useState('');
  const [evidenceForm, setEvidenceForm] = useState({
    evidenceType: 'ATTENDANCE',
    title: '',
    externalUrl: '',
    actionId: '',
  });

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api<{ analysis: Analysis }>(`/api/gap-analysis/${id}`);
      setAnalysis(res.analysis);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not load Gap Analysis', 'error');
    }
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useDocumentTitle(analysis ? `${analysis.subjectName} · Gap Analysis` : 'Gap Analysis');

  const filteredItems = useMemo(() => {
    if (!analysis) return [];
    if (!moduleFilter) return analysis.items;
    return analysis.items.filter((i) => String(i.moduleUnit || '').includes(moduleFilter));
  }, [analysis, moduleFilter]);

  const modules = useMemo(() => {
    if (!analysis) return [];
    return [...new Set(analysis.items.map((i) => i.moduleUnit).filter(Boolean))] as string[];
  }, [analysis]);

  if (!analysis) {
    return <div className="animate-fade-in p-8 text-sm text-ink-muted">Loading Gap Analysis…</div>;
  }

  const patchCoverage = async (itemId: number, actualCoverageLevel: number) => {
    try {
      const res = await api<{ analysis: Analysis }>(`/api/gap-analysis/${analysis.id}/items/${itemId}/coverage`, {
        method: 'PATCH',
        body: JSON.stringify({ actualCoverageLevel }),
      });
      setAnalysis(res.analysis);
      toast('Coverage updated');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Update failed', 'error');
    }
  };

  const markNa = async (item: GapItem) => {
    if (!naReason.trim()) {
      toast('Reason is required for Not Applicable', 'error');
      return;
    }
    try {
      const res = await api<{ analysis: Analysis }>(
        `/api/gap-analysis/${analysis.id}/items/${item.id}/applicability`,
        {
          method: 'PATCH',
          body: JSON.stringify({ applicability: 'NOT_APPLICABLE', reason: naReason }),
        },
      );
      setAnalysis(res.analysis);
      setDrawerItem(res.analysis.items.find((i) => i.id === item.id) || null);
      setNaReason('');
      toast('Marked Not Applicable');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Update failed', 'error');
    }
  };

  const addAction = async (item: GapItem, fromMaster = false) => {
    const title = fromMaster
      ? item.suggestedActionTitle || item.suggestedActionLabel || 'Recommended action'
      : actionForm.title;
    if (!title.trim()) {
      toast('Action title is required', 'error');
      return;
    }
    try {
      const res = await api<{ analysis: Analysis }>(`/api/gap-analysis/${analysis.id}/items/${item.id}/actions`, {
        method: 'POST',
        body: JSON.stringify({
          actionType: fromMaster ? item.suggestedActionType || 'OTHER' : actionForm.actionType,
          title,
          plannedDate: actionForm.plannedDate || null,
          expectedOutcome: actionForm.expectedOutcome || null,
          description: actionForm.description || null,
          fromMasterRecommendation: fromMaster,
        }),
      });
      setAnalysis(res.analysis);
      setDrawerItem(res.analysis.items.find((i) => i.id === item.id) || null);
      setActionForm({ actionType: 'HANDS_ON_LAB', title: '', plannedDate: '', expectedOutcome: '', description: '' });
      toast('Action added');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not add action', 'error');
    }
  };

  const completeAction = async (actionId: number) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await api<{ analysis: Analysis }>(`/api/gap-analysis/${analysis.id}/actions/${actionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'COMPLETED', actualDate: today }),
      });
      setAnalysis(res.analysis);
      if (drawerItem) setDrawerItem(res.analysis.items.find((i) => i.id === drawerItem.id) || null);
      toast('Action completed');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not complete action', 'error');
    }
  };

  const closeGap = async (item: GapItem) => {
    try {
      const res = await api<{ analysis: Analysis }>(`/api/gap-analysis/${analysis.id}/items/${item.id}/close`, {
        method: 'POST',
        body: JSON.stringify({
          closureNote: closeForm.closureNote,
          actualCoverageLevel: Number(closeForm.actualCoverageLevel),
          finalCoverageLevel: Number(closeForm.actualCoverageLevel),
          alternativeCoverageExplanation: closeForm.alternativeCoverageExplanation || null,
        }),
      });
      setAnalysis(res.analysis);
      setDrawerItem(res.analysis.items.find((i) => i.id === item.id) || null);
      toast('Gap closed');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not close gap', 'error');
    }
  };

  const reopenGap = async (item: GapItem) => {
    try {
      const res = await api<{ analysis: Analysis }>(`/api/gap-analysis/${analysis.id}/items/${item.id}/reopen`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setAnalysis(res.analysis);
      setDrawerItem(res.analysis.items.find((i) => i.id === item.id) || null);
      toast('Gap reopened');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not reopen', 'error');
    }
  };

  const addEvidence = async (item?: GapItem | null) => {
    if (!evidenceForm.title.trim() || !evidenceForm.externalUrl.trim()) {
      toast('Evidence title and URL are required', 'error');
      return;
    }
    try {
      const res = await api<{ analysis: Analysis }>(`/api/gap-analysis/${analysis.id}/evidence`, {
        method: 'POST',
        body: JSON.stringify({
          evidenceType: evidenceForm.evidenceType,
          title: evidenceForm.title,
          externalUrl: evidenceForm.externalUrl,
          itemId: item?.id ?? null,
          actionId: evidenceForm.actionId ? Number(evidenceForm.actionId) : null,
        }),
      });
      setAnalysis(res.analysis);
      if (item) setDrawerItem(res.analysis.items.find((i) => i.id === item.id) || null);
      setEvidenceForm({ evidenceType: 'ATTENDANCE', title: '', externalUrl: '', actionId: '' });
      toast('Evidence added');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not add evidence', 'error');
    }
  };

  const completeAnalysis = async () => {
    try {
      const res = await api<{ analysis: Analysis }>(`/api/gap-analysis/${analysis.id}/complete`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setAnalysis(res.analysis);
      toast('Gap Analysis completed');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Cannot complete', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={analysis.subjectName}
        subtitle={`Gap Analysis · ${analysis.courseCode}${analysis.schemeLabel ? ` · ${analysis.schemeLabel}` : ''}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={`${basePath}/${analysis.id}/print`} target="_blank">
              <Button variant="secondary" size="sm">
                Print
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                downloadCopoExport(`/api/gap-analysis/${analysis.id}/export`, 'gap-analysis.xlsx').catch((e) =>
                  toast(e instanceof Error ? e.message : 'Export failed', 'error'),
                )
              }
            >
              Export
            </Button>
            {analysis.status !== 'COMPLETED' && analysis.status !== 'ARCHIVED' ? (
              <Button size="sm" onClick={completeAnalysis}>
                Mark Completed
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="text-sm text-ink-secondary">
          {[analysis.programName, analysis.semesterLabel, analysis.academicYearLabel].filter(Boolean).join(' · ')}
          <div className="mt-1 text-xs text-ink-muted">Prepared by {analysis.preparedBy || '—'}</div>
        </div>
        <StatusBadge status={analysis.status} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Total Gaps" value={analysis.summary.totalGaps} />
        <Stat label="Covered" value={analysis.summary.covered} />
        <Stat label="Partially" value={analysis.summary.partiallyCovered} />
        <Stat label="Not Covered" value={analysis.summary.notCovered} />
        <Stat label="Closed" value={analysis.summary.closed} />
        <Stat
          label="Coverage"
          value={analysis.summary.coveragePercent == null ? '—' : `${analysis.summary.coveragePercent}%`}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-2 text-sm">
        {(
          [
            ['overview', 'Overview'],
            ['gaps', 'Gap Analysis'],
            ['actions', 'Actions'],
            ['evidence', 'Evidence'],
            ['report', 'Report'],
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
            <Stat label="Master Gaps" value={analysis.summary.totalGaps} />
            <Stat label="Applicable" value={analysis.summary.applicable} />
            <Stat label="Closed" value={analysis.summary.closed} />
            <Stat label="Open" value={analysis.summary.open} />
            <Stat
              label="Coverage Satisfaction"
              value={analysis.summary.coveragePercent == null ? '—' : `${analysis.summary.coveragePercent}%`}
            />
            <Stat
              label="Actions Completed"
              value={`${analysis.summary.actionsCompleted} / ${analysis.summary.actionsTotal}`}
            />
            <Stat label="Evidence Items" value={analysis.summary.evidenceCount} />
            <Stat
              label="Assessment Context"
              value={`${analysis.assessment?.questionBankCount ?? 0} Q · ${analysis.assessment?.quizUsageCount ?? 0} quizzes`}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Gap type breakdown</h3>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-ink-secondary">
              {Object.entries(analysis.summary.byType || {}).map(([type, count]) => (
                <span key={type}>
                  {type.replace(/_/g, ' ')} · <strong className="text-ink">{count}</strong>
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Module-wise</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {modules.map((m) => (
                <button
                  key={m}
                  type="button"
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-ink-secondary hover:bg-surface-muted"
                  onClick={() => {
                    setModuleFilter(m);
                    setTab('gaps');
                  }}
                >
                  {m} · {analysis.items.filter((i) => i.moduleUnit === m).length} gap
                  {analysis.items.filter((i) => i.moduleUnit === m).length === 1 ? '' : 's'}
                </button>
              ))}
            </div>
          </div>
        </Surface>
      ) : null}

      {tab === 'gaps' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="max-w-xs">
              <option value="">All modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface-muted text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-3 py-2">Sl</th>
                  <th className="px-3 py-2">Gap</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Module</th>
                  <th className="px-3 py-2">CO</th>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">Expected</th>
                  <th className="px-3 py-2">Actual</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-t border-border hover:bg-surface-muted/60"
                    onClick={() => setDrawerItem(item)}
                  >
                    <td className="px-3 py-2 text-ink-muted">{item.serialNo}</td>
                    <td className="max-w-xs px-3 py-2">
                      <div className="font-medium text-ink line-clamp-2">{item.gapStatement}</div>
                      {item.needsReview ? (
                        <div className="mt-1 text-[11px] text-ink-muted">
                          Source · {(item.verificationStatus || item.mappingOrigin || '').replace(/_/g, ' ')}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-xs">{String(item.gapType).replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2 text-xs">{item.moduleUnit || '—'}</td>
                    <td className="px-3 py-2 text-xs">{item.relatedCos.map((c) => c.coCode).join(', ') || '—'}</td>
                    <td className="px-3 py-2 text-xs">{item.priority || '—'}</td>
                    <td className="px-3 py-2 text-xs">{item.expectedCoverageLabel || '—'}</td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <Select
                        className="min-w-[9rem] text-xs"
                        value={item.actualCoverageLevel ?? ''}
                        disabled={item.itemStatus === 'CLOSED' || item.applicability === 'NOT_APPLICABLE'}
                        onChange={(e) => patchCoverage(item.id, Number(e.target.value))}
                      >
                        <option value="">Select…</option>
                        {COVERAGE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-xs">{item.actions[0]?.title || item.suggestedActionTitle || '—'}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={item.itemStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="cursor-pointer rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-xs space-y-2"
                onClick={() => setDrawerItem(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setDrawerItem(item);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Gap {String(item.serialNo).padStart(2, '0')}
                  </div>
                  <StatusBadge status={item.itemStatus} />
                </div>
                <div className="text-xs text-ink-muted">
                  {String(item.gapType).replace(/_/g, ' ')}
                  {item.priority ? ` · ${item.priority}` : ''}
                </div>
                <p className="text-sm font-medium text-ink">{item.gapStatement}</p>
                <p className="text-xs text-ink-secondary">
                  {[item.moduleUnit, item.relatedCos.map((c) => c.coCode).join(', ')].filter(Boolean).join(' · ')}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-ink-muted">Expected</div>
                    <div>{item.expectedCoverageLabel || '—'}</div>
                  </div>
                  <div>
                    <div className="text-ink-muted">Actual</div>
                    <div>{item.actualCoverageLabel || '—'}</div>
                  </div>
                </div>
                <div className="text-xs text-ink-secondary">
                  Action · {item.actions[0]?.title || item.suggestedActionTitle || '—'}
                </div>
                <Button size="sm" variant="secondary">
                  Open
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'actions' ? (
        <Surface className="space-y-3">
          {analysis.items.flatMap((item) =>
            item.actions.map((action) => (
              <div key={action.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 last:border-0">
                <div>
                  <div className="text-sm font-medium text-ink">{action.title}</div>
                  <div className="text-xs text-ink-muted">
                    {item.gapId} · {action.actionTypeLabel || action.actionType} · {action.status}
                  </div>
                </div>
                {action.status !== 'COMPLETED' && action.status !== 'CANCELLED' ? (
                  <Button size="sm" variant="secondary" onClick={() => completeAction(action.id)}>
                    Mark Completed
                  </Button>
                ) : null}
              </div>
            )),
          )}
          {!analysis.items.some((i) => i.actions.length) ? (
            <p className="text-sm text-ink-muted">No gap-filling actions yet. Open a gap to add one.</p>
          ) : null}
        </Surface>
      ) : null}

      {tab === 'evidence' ? (
        <Surface className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Evidence type">
              <Select
                value={evidenceForm.evidenceType}
                onChange={(e) => setEvidenceForm((f) => ({ ...f, evidenceType: e.target.value }))}
              >
                {['ATTENDANCE', 'LAB_SHEET', 'PHOTOS', 'QUIZ_RESULT', 'EVENT_REPORT', 'LINK', 'OTHER_DOCUMENT'].map(
                  (t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, ' ')}
                    </option>
                  ),
                )}
              </Select>
            </Field>
            <Field label="Title">
              <Input
                value={evidenceForm.title}
                onChange={(e) => setEvidenceForm((f) => ({ ...f, title: e.target.value }))}
              />
            </Field>
            <Field label="URL">
              <Input
                value={evidenceForm.externalUrl}
                onChange={(e) => setEvidenceForm((f) => ({ ...f, externalUrl: e.target.value }))}
                placeholder="https://…"
              />
            </Field>
          </div>
          <Button size="sm" onClick={() => addEvidence(null)}>
            Add Evidence
          </Button>
          <div className="divide-y divide-border">
            {analysis.items.flatMap((item) =>
              item.evidence.map((e) => (
                <div key={e.id} className="py-2 text-sm">
                  <div className="font-medium text-ink">{e.title}</div>
                  <div className="text-xs text-ink-muted">
                    {item.gapId} · {e.evidenceType}
                  </div>
                </div>
              )),
            )}
          </div>
        </Surface>
      ) : null}

      {tab === 'report' ? (
        <Surface className="space-y-3 text-sm text-ink-secondary">
          <p>
            Print uses the shared academic title-page design. Prepared By remains{' '}
            <strong className="text-ink">{analysis.preparedBy}</strong>.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to={`${basePath}/${analysis.id}/print`} target="_blank">
              <Button>Open Print View</Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() =>
                downloadCopoExport(`/api/gap-analysis/${analysis.id}/export`, 'gap-analysis.xlsx').catch((e) =>
                  toast(e instanceof Error ? e.message : 'Export failed', 'error'),
                )
              }
            >
              Download Excel
            </Button>
          </div>
        </Surface>
      ) : null}

      {drawerItem ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={() => setDrawerItem(null)}>
          <aside
            className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-surface p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{drawerItem.gapId}</div>
                <h2 className="mt-1 text-lg font-semibold text-ink">{drawerItem.gapStatement}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDrawerItem(null)}>
                Close
              </Button>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-ink-muted">Type</dt>
                <dd>{String(drawerItem.gapType).replace(/_/g, ' ')}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Priority</dt>
                <dd>{drawerItem.priority || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Module / Topic</dt>
                <dd>
                  {[drawerItem.moduleUnit, drawerItem.relatedTopic].filter(Boolean).join(' · ') || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Expected Coverage</dt>
                <dd>{drawerItem.expectedCoverageLabel || '—'}</dd>
              </div>
            </dl>

            {drawerItem.gapJustification ? (
              <p className="mt-4 text-sm text-ink-secondary">{drawerItem.gapJustification}</p>
            ) : null}

            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  try {
                    const res = await api<{
                      prefill: { title: string; relatedGapId: string; primaryCo?: string | null };
                      added: boolean;
                    }>('/api/beyond-syllabus/from-gap', {
                      method: 'POST',
                      body: JSON.stringify({
                        gapAnalysisId: Number(id),
                        gapItemId: drawerItem.id,
                      }),
                    });
                    toast(
                      `Beyond-Syllabus prefill ready for ${res.prefill.relatedGapId}${
                        res.prefill.primaryCo ? ` · ${res.prefill.primaryCo}` : ''
                      }. Open Content Beyond Syllabus to add it to a plan.`,
                    );
                    window.open('/beyond-syllabus/create', '_blank');
                  } catch (e) {
                    toast(e instanceof Error ? e.message : 'Could not prepare Beyond-Syllabus item', 'error');
                  }
                }}
              >
                + Add to Beyond Syllabus
              </Button>
            </div>

            {drawerItem.needsReview ? (
              <p className="mt-3 text-xs text-ink-muted">
                Source status · {(drawerItem.verificationStatus || drawerItem.mappingOrigin || '').replace(/_/g, ' ')}
              </p>
            ) : null}

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-ink">Related COs</h3>
              <ul className="mt-2 space-y-2 text-sm">
                {drawerItem.relatedCos.map((c) => (
                  <li key={c.coCode}>
                    <span className="font-medium">{c.coCode}</span>
                    {c.coStatement ? <span className="text-ink-secondary"> — {c.coStatement}</span> : null}
                  </li>
                ))}
                {!drawerItem.relatedCos.length ? <li className="text-ink-muted">No CO links</li> : null}
              </ul>
            </div>

            {drawerItem.outcomes.length ? (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-ink">Academic Traceability</h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Gap → {drawerItem.relatedCos.map((c) => c.coCode).join(', ') || 'CO'} → outcomes
                </p>
                <ul className="mt-2 space-y-1 text-sm text-ink-secondary">
                  {drawerItem.outcomes.map((o, idx) => (
                    <li key={`${o.outcomeType}-${o.outcomeCode}-${idx}`}>
                      {o.outcomeType} {o.outcomeCode}
                      {o.strength != null ? ` (${o.strength})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {drawerItem.lessonPlan ? (
              <div className="mt-4 text-sm text-ink-secondary">
                <h3 className="text-sm font-semibold text-ink">Lesson Plan Coverage</h3>
                <p className="mt-1">
                  Planned: {drawerItem.lessonPlan.planned ? 'Yes' : 'No'} · Completed:{' '}
                  {drawerItem.lessonPlan.completed ? 'Yes' : 'No'}
                </p>
              </div>
            ) : null}

            {drawerItem.suggestedActionTitle ? (
              <div className="mt-4 rounded-md bg-surface-muted p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Recommended Action</div>
                <div className="mt-1 text-sm text-ink">{drawerItem.suggestedActionTitle}</div>
                {drawerItem.itemStatus !== 'CLOSED' && drawerItem.applicability === 'APPLICABLE' ? (
                  <Button className="mt-2" size="sm" variant="secondary" onClick={() => addAction(drawerItem, true)}>
                    Use Recommendation
                  </Button>
                ) : null}
              </div>
            ) : null}

            {drawerItem.applicability === 'APPLICABLE' && drawerItem.itemStatus !== 'CLOSED' ? (
              <div className="mt-5 space-y-3 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-ink">Add Action</h3>
                <Field label="Type">
                  <Select
                    value={actionForm.actionType}
                    onChange={(e) => setActionForm((f) => ({ ...f, actionType: e.target.value }))}
                  >
                    {ACTION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Title">
                  <Input
                    value={actionForm.title}
                    onChange={(e) => setActionForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </Field>
                <Field label="Planned date">
                  <Input
                    type="date"
                    value={actionForm.plannedDate}
                    onChange={(e) => setActionForm((f) => ({ ...f, plannedDate: e.target.value }))}
                  />
                </Field>
                <Field label="Expected outcome">
                  <Textarea
                    value={actionForm.expectedOutcome}
                    onChange={(e) => setActionForm((f) => ({ ...f, expectedOutcome: e.target.value }))}
                  />
                </Field>
                <Button size="sm" onClick={() => addAction(drawerItem, false)}>
                  Save Action
                </Button>
              </div>
            ) : null}

            <div className="mt-4 space-y-2">
              {drawerItem.actions.map((a) => (
                <div key={a.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-ink-muted">
                    {a.status}
                    {a.plannedDate ? ` · Planned ${a.plannedDate}` : ''}
                    {a.actualDate ? ` · Actual ${a.actualDate}` : ''}
                  </div>
                  {a.status !== 'COMPLETED' && a.status !== 'CANCELLED' ? (
                    <Button className="mt-2" size="sm" variant="secondary" onClick={() => completeAction(a.id)}>
                      Complete Action
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>

            {drawerItem.itemStatus !== 'CLOSED' && drawerItem.applicability === 'APPLICABLE' ? (
              <div className="mt-5 space-y-3 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-ink">Close Gap</h3>
                <Field label="Final coverage">
                  <Select
                    value={closeForm.actualCoverageLevel}
                    onChange={(e) => setCloseForm((f) => ({ ...f, actualCoverageLevel: e.target.value }))}
                  >
                    {COVERAGE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Closure note">
                  <Textarea
                    value={closeForm.closureNote}
                    onChange={(e) => setCloseForm((f) => ({ ...f, closureNote: e.target.value }))}
                  />
                </Field>
                <Field label="Alternative coverage explanation (if no completed action)">
                  <Textarea
                    value={closeForm.alternativeCoverageExplanation}
                    onChange={(e) =>
                      setCloseForm((f) => ({ ...f, alternativeCoverageExplanation: e.target.value }))
                    }
                  />
                </Field>
                <Button size="sm" onClick={() => closeGap(drawerItem)}>
                  Close Gap
                </Button>
              </div>
            ) : null}

            {drawerItem.itemStatus === 'CLOSED' && analysis.status !== 'COMPLETED' && analysis.status !== 'ARCHIVED' ? (
              <Button className="mt-4" size="sm" variant="secondary" onClick={() => reopenGap(drawerItem)}>
                Reopen Gap
              </Button>
            ) : null}

            {drawerItem.applicability === 'APPLICABLE' && drawerItem.itemStatus !== 'CLOSED' ? (
              <div className="mt-5 space-y-2 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-ink">Mark Not Applicable</h3>
                <Textarea
                  value={naReason}
                  onChange={(e) => setNaReason(e.target.value)}
                  placeholder="Reason (required)"
                />
                <Button size="sm" variant="secondary" onClick={() => markNa(drawerItem)}>
                  Mark Not Applicable
                </Button>
              </div>
            ) : null}

            <div className="mt-5 space-y-2 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-ink">Evidence</h3>
              {drawerItem.evidence.map((e) => (
                <div key={e.id} className="text-sm text-ink-secondary">
                  {e.title} · {e.evidenceType}
                </div>
              ))}
              <Field label="Title">
                <Input
                  value={evidenceForm.title}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, title: e.target.value }))}
                />
              </Field>
              <Field label="URL">
                <Input
                  value={evidenceForm.externalUrl}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, externalUrl: e.target.value }))}
                />
              </Field>
              <Button size="sm" variant="secondary" onClick={() => addEvidence(drawerItem)}>
                Add Evidence
              </Button>
            </div>
          </aside>
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
