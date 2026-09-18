import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  Copy,
  FileText,
  Loader2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { api, downloadCopoExport } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import {
  Button,
  Field,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  Surface,
  Tabs,
  Textarea,
  useToast,
} from '../../components/ui';
import { cn } from '../../lib/utils';
import type {
  CopoCatalog,
  CopoWorkspace,
  MappingItem,
  ProgramOutcome,
  ProgramSpecificOutcome,
  SdgGoal,
  UnifiedWorkspace,
} from '../../types/copo';
import { Legend, OfficialPending, strengthClass } from '../../components/copo/CopoChrome';

type TabId = 'po' | 'pso' | 'sdg' | 'alignment';
type Kind = 'PO' | 'PSO' | 'SDG';

function tabToKind(tab: TabId): Kind | null {
  if (tab === 'po') return 'PO';
  if (tab === 'pso') return 'PSO';
  if (tab === 'sdg') return 'SDG';
  return null;
}

function sliceOf(unified: UnifiedWorkspace | null, tab: TabId): CopoWorkspace | null {
  if (!unified) return null;
  if (tab === 'pso') return unified.pso;
  if (tab === 'sdg') return unified.sdg;
  return unified.po;
}

function cellTarget(item: MappingItem, kind: Kind) {
  if (kind === 'PSO') return item.programSpecificOutcomeId ?? item.targetId;
  if (kind === 'SDG') return item.sdgId ?? item.targetId;
  return item.programOutcomeId ?? item.targetId;
}

function cellValue(items: MappingItem[], coId: number, targetId: number, kind: Kind) {
  return items.find((i) => i.courseOutcomeId === coId && Number(cellTarget(i, kind)) === targetId) ?? null;
}

function nextStrength(current: number | null): number | null {
  if (current == null) return 1;
  if (current === 1) return 2;
  if (current === 2) return 3;
  return null;
}

function lastTabKey(courseId: string) {
  return `outcome-mapping-tab:${courseId}`;
}

export function CopoMappingPage({ basePath = '/copo' }: { basePath?: string }) {
  useDocumentTitle('Outcome Mapping');
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [catalog, setCatalog] = useState<CopoCatalog | null>(null);
  const [unified, setUnified] = useState<UnifiedWorkspace | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [expandCos, setExpandCos] = useState(true);
  const [infoTarget, setInfoTarget] = useState<{ code: string; title?: string | null; statement?: string | null; source?: string | null } | null>(null);
  const [justification, setJustification] = useState<{ coId: number; targetId: number; text: string } | null>(null);
  const [justificationBusy, setJustificationBusy] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<{
      courseOutcomeId: number;
      programOutcomeId: number;
      programSpecificOutcomeId?: number;
      sdgId?: number;
      coCode: string;
      poCode: string;
      suggested: 1 | 2 | 3;
      confidence: string;
      selected?: boolean;
    }>
  >([]);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyPreview, setCopyPreview] = useState<{ previous: { id: number; versionNumber: number } | null } | null>(null);
  const [addSdgOpen, setAddSdgOpen] = useState(false);
  const [submitAllOpen, setSubmitAllOpen] = useState(false);
  const [submitAllPreview, setSubmitAllPreview] = useState<{
    ready: Array<{ mappingKind: string }>;
    blocked: Array<{ mappingKind: string; reason: string }>;
    skipped: Array<{ mappingKind: string; reason: string }>;
  } | null>(null);

  const schemeId = params.get('schemeId') || '';
  const programId = params.get('programId') || '';
  const semesterId = params.get('semesterId') || '';
  const courseId = params.get('courseId') || '';
  const academicYearId = params.get('yearId') || '';
  const tab = (params.get('tab') as TabId) || 'po';

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'courseId' && key !== 'yearId' && key !== 'tab') next.delete('courseId');
    setParams(next);
  };

  const setTab = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next);
    if (courseId) localStorage.setItem(lastTabKey(courseId), id);
  };

  useEffect(() => {
    api<CopoCatalog>('/api/copo/catalog')
      .then(setCatalog)
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load catalog', 'error'));
  }, [toast]);

  useEffect(() => {
    if (!courseId || params.get('tab')) return;
    const stored = localStorage.getItem(lastTabKey(courseId));
    if (stored === 'po' || stored === 'pso' || stored === 'sdg' || stored === 'alignment') setTab(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const loadWorkspace = useCallback(async () => {
    if (!courseId) {
      setUnified(null);
      return;
    }
    const qs = new URLSearchParams({ courseId });
    if (programId) qs.set('programId', programId);
    if (academicYearId) qs.set('academicYearId', academicYearId);
    if (schemeId) qs.set('schemeId', schemeId);
    const data = await api<UnifiedWorkspace>(`/api/copo/outcome-workspace?${qs}`);
    setUnified(data);
  }, [courseId, programId, academicYearId, schemeId]);

  useEffect(() => {
    loadWorkspace().catch((e) => toast(e instanceof Error ? e.message : 'Failed to load mapping', 'error'));
  }, [loadWorkspace, toast]);

  const subjects = useMemo(() => {
    return (catalog?.subjects ?? []).filter((s) => {
      if (schemeId && String(s.schemeId) !== schemeId) return false;
      if (semesterId && String(s.semesterId) !== semesterId) return false;
      if (programId && s.programs?.length && !s.programs.some((p) => String(p.id) === programId)) return false;
      return true;
    });
  }, [catalog, schemeId, semesterId, programId]);

  const kind = tabToKind(tab) || 'PO';
  const workspace = sliceOf(unified, tab === 'alignment' ? 'po' : tab);

  const columns: Array<{ id: number; code: string; title?: string | null; statement?: string | null; source?: string | null; color?: string | null }> =
    tab === 'pso'
      ? (workspace?.programSpecificOutcomes || []).map((p: ProgramSpecificOutcome) => ({
          id: p.id,
          code: p.code,
          title: p.shortTitle,
          statement: p.officialStatement || 'Official / Approved PSO Data Pending',
          source: p.source,
        }))
      : tab === 'sdg'
        ? (workspace?.visibleSdgs || []).map((s: SdgGoal) => ({
            id: s.id,
            code: s.code,
            title: s.officialTitle,
            statement: s.officialDescription,
            source: s.source,
            color: s.colorHex,
          }))
        : (workspace?.programOutcomes || []).map((p: ProgramOutcome) => ({
            id: p.id,
            code: p.code,
            title: p.shortTitle,
            statement: p.officialStatement || 'Official Data Pending',
            source: p.source,
          }));

  const ensureVersion = async (forKind: Kind = kind) => {
    const slice = forKind === 'PSO' ? unified?.pso : forKind === 'SDG' ? unified?.sdg : unified?.po;
    if (slice?.mapping.id) return slice.mapping.id;
    await api<CopoWorkspace>('/api/copo/workspace', {
      method: 'POST',
      body: JSON.stringify({
        courseId: Number(courseId),
        programId: programId ? Number(programId) : null,
        academicYearId: academicYearId ? Number(academicYearId) : null,
        schemeId: schemeId ? Number(schemeId) : null,
        mappingKind: forKind,
      }),
    });
    const qs = new URLSearchParams({ courseId });
    if (programId) qs.set('programId', programId);
    if (academicYearId) qs.set('academicYearId', academicYearId);
    if (schemeId) qs.set('schemeId', schemeId);
    const next = await api<UnifiedWorkspace>(`/api/copo/outcome-workspace?${qs}`);
    setUnified(next);
    const created = forKind === 'PSO' ? next.pso : forKind === 'SDG' ? next.sdg : next.po;
    return created.mapping.id!;
  };

  const patchCell = async (coId: number, targetId: number, strength: number | null) => {
    const id = await ensureVersion();
    setSaveState('saving');
    try {
      await api<CopoWorkspace>(`/api/copo/mappings/${id}/cells`, {
        method: 'PATCH',
        body: JSON.stringify({
          courseOutcomeId: coId,
          programOutcomeId: kind === 'PO' ? targetId : undefined,
          programSpecificOutcomeId: kind === 'PSO' ? targetId : undefined,
          sdgId: kind === 'SDG' ? targetId : undefined,
          strength,
        }),
      });
      await loadWorkspace();
      setSaveState('saved');
    } catch (err) {
      setSaveState('idle');
      toast(err instanceof Error ? err.message : 'Could not save mapping', 'error');
    }
  };

  const onCellClick = async (coId: number, targetId: number) => {
    if (!workspace?.permissions.canEdit) return;
    const current = cellValue(workspace.items, coId, targetId, kind)?.strength ?? null;
    await patchCell(coId, targetId, nextStrength(current));
  };

  const onCellKey = async (e: React.KeyboardEvent, coId: number, targetId: number) => {
    if (!workspace?.permissions.canEdit) return;
    if (e.key === '1' || e.key === '2' || e.key === '3') {
      e.preventDefault();
      await patchCell(coId, targetId, Number(e.key));
    }
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0' || e.key === '-') {
      e.preventDefault();
      await patchCell(coId, targetId, null);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = cellValue(workspace.items, coId, targetId, kind);
      if (item?.strength) setJustification({ coId, targetId, text: item.justification || '' });
    }
  };

  const saveJustification = async () => {
    if (!justification || !workspace?.mapping.id) return;
    setJustificationBusy(true);
    try {
      await api<CopoWorkspace>(`/api/copo/mappings/${workspace.mapping.id}/justifications`, {
        method: 'PATCH',
        body: JSON.stringify({
          courseOutcomeId: justification.coId,
          programOutcomeId: kind === 'PO' ? justification.targetId : undefined,
          programSpecificOutcomeId: kind === 'PSO' ? justification.targetId : undefined,
          sdgId: kind === 'SDG' ? justification.targetId : undefined,
          justification: justification.text,
        }),
      });
      await loadWorkspace();
      setJustification(null);
      toast('Justification saved');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save justification', 'error');
    } finally {
      setJustificationBusy(false);
    }
  };

  const submit = async () => {
    const id = await ensureVersion();
    try {
      await api<CopoWorkspace>(`/api/copo/mappings/${id}/submit`, { method: 'POST', body: '{}' });
      await loadWorkspace();
      toast('Submitted for review');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Submit failed', 'error');
    }
  };

  const mappedCell = justification && workspace
    ? {
        co: workspace.courseOutcomes.find((c) => c.id === justification.coId),
        target: columns.find((c) => c.id === justification.targetId),
        item: cellValue(workspace.items, justification.coId, justification.targetId, kind),
      }
    : null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Outcome Mapping"
        subtitle="Map official course outcomes to POs, PSOs, and SDGs in one workspace. Versions stay independent."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {saveState === 'saving' ? (
              <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                <Loader2 size={14} className="animate-spin" /> Saving…
              </span>
            ) : saveState === 'saved' ? (
              <span className="inline-flex items-center gap-1 text-xs text-accent">
                <Check size={14} /> Saved
              </span>
            ) : null}
            {workspace?.mapping.id ? (
              <Button
                variant="secondary"
                onClick={() =>
                  downloadCopoExport(`/api/copo/reports/${workspace.mapping.id}/xlsx`, 'outcome-mapping.xlsx').catch((e) =>
                    toast(e instanceof Error ? e.message : 'Export failed', 'error'),
                  )
                }
              >
                Export Excel
              </Button>
            ) : null}
            {unified?.permissions.canSubmit ? (
              <>
                {workspace?.mapping.status !== 'SUBMITTED' && workspace?.mapping.status !== 'APPROVED' ? (
                  <Button variant="secondary" onClick={submit}>
                    Submit current mapping
                  </Button>
                ) : null}
                <Button
                  onClick={async () => {
                    const preview = await api<typeof submitAllPreview>('/api/copo/outcome-workspace/submit-all', {
                      method: 'POST',
                      body: JSON.stringify({
                        courseId: Number(courseId),
                        programId: programId ? Number(programId) : null,
                        academicYearId: academicYearId ? Number(academicYearId) : null,
                        schemeId: schemeId ? Number(schemeId) : null,
                        confirm: false,
                      }),
                    });
                    setSubmitAllPreview(preview);
                    setSubmitAllOpen(true);
                  }}
                >
                  Submit all outcome mappings
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      <Surface className="sticky top-[var(--header-height)] z-20 mb-4">
        <div className="grid gap-3 md:grid-cols-5">
          <Field label="Scheme">
            <Select value={schemeId} onChange={(e) => setFilter('schemeId', e.target.value)}>
              <option value="">All schemes</option>
              {catalog?.schemes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Program">
            <Select value={programId} onChange={(e) => setFilter('programId', e.target.value)}>
              <option value="">All programs</option>
              {catalog?.programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Semester">
            <Select value={semesterId} onChange={(e) => setFilter('semesterId', e.target.value)}>
              <option value="">All semesters</option>
              {catalog?.semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  Semester {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subject">
            <Select value={courseId} onChange={(e) => setFilter('courseId', e.target.value)}>
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Academic year">
            <Select value={academicYearId} onChange={(e) => setFilter('yearId', e.target.value)}>
              <option value="">Current / unspecified</option>
              {catalog?.academicYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                  {y.isCurrent ? ' (current)' : ''}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Surface>

      {!courseId ? (
        <Surface>
          <p className="text-sm text-ink-muted">Select a subject to load official COs and the PO / PSO / SDG mapping workspace.</p>
        </Surface>
      ) : null}

      {unified ? (
        <div className="space-y-4">
          <Surface>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                  Scheme: {unified.course.schemeName || 'Official Data Pending'} · Program: {unified.program?.name || 'Select a program'} · Semester:{' '}
                  {unified.course.semesterLabel || '—'}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-ink">
                  {unified.course.code} — {unified.course.name}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">Academic Year: {unified.academicYear?.label || '—'}</p>
              </div>
              <StatusBadge status={unified.progress.overall} />
            </div>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              <div>PO Mapping · {unified.progress.po.label} · {unified.progress.po.status.replaceAll('_', ' ')}</div>
              <div>PSO Mapping · {unified.progress.pso.label} · {unified.progress.pso.status.replaceAll('_', ' ')}</div>
              <div>SDG Mapping · {unified.progress.sdg.label} · {unified.progress.sdg.status.replaceAll('_', ' ')}</div>
            </div>
          </Surface>

          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'po', label: `PO Mapping${unified.progress.po.status === 'APPROVED' ? ' ✓' : ''}` },
              { id: 'pso', label: `PSO Mapping${unified.progress.pso.status === 'APPROVED' ? ' ✓' : ''}` },
              { id: 'sdg', label: `SDG Mapping${unified.progress.sdg.status === 'APPROVED' ? ' ✓' : ''}` },
              { id: 'alignment', label: 'CO summary' },
            ]}
          />

          {tab === 'alignment' ? (
            <Surface>
              <h3 className="text-sm font-semibold">Course Outcome Alignment</h3>
              <p className="mt-1 text-xs text-ink-muted">Accreditation view of the same official COs. Alignment only — not attainment.</p>
              <ul className="mt-4 space-y-4">
                {unified.alignment.map((row) => (
                  <li key={row.courseOutcome.id} className="rounded-[var(--radius-md)] border border-border p-3">
                    <p className="font-medium">
                      {row.courseOutcome.code} {row.courseOutcome.bloomsLabel ? `· ${row.courseOutcome.bloomsLabel}` : ''}
                    </p>
                    <p className="mt-1 text-sm text-ink-secondary">{row.courseOutcome.statement}</p>
                    <p className="mt-2 text-xs text-ink-muted">
                      PO: {row.po.map((p) => `${p.code}(${p.strength})`).join(', ') || '–'}
                    </p>
                    <p className="text-xs text-ink-muted">
                      PSO: {row.pso.map((p) => `${p.code}(${p.strength})`).join(', ') || '–'}
                    </p>
                    <p className="text-xs text-ink-muted">
                      SDG: {row.sdg.map((p) => `${p.code}(${p.strength})`).join(', ') || 'No SDG Mapping'}
                    </p>
                  </li>
                ))}
              </ul>
            </Surface>
          ) : workspace ? (
            <>
              <OfficialPending show={workspace.officialDataPending.outcomes} label="Official COs pending" />
              {tab === 'po' ? (
                <OfficialPending show={workspace.officialDataPending.programmeOutcomes} label="Official POs pending" />
              ) : null}
              {tab === 'pso' ? (
                <OfficialPending
                  show={Boolean(workspace.officialDataPending.programSpecificOutcomes)}
                  label="Official / Approved PSO Data Pending"
                />
              ) : null}

              {workspace.qualityFlags.length ? (
                <Surface className="border-warning/30">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-warning">
                    <AlertTriangle size={16} /> Mapping quality check
                  </div>
                  <ul className="space-y-1 text-sm text-ink-secondary">
                    {workspace.qualityFlags.map((f, i) => (
                      <li key={`${f.code}-${i}`}>{f.message}</li>
                    ))}
                  </ul>
                </Surface>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Legend />
                <div className="flex flex-wrap gap-2">
                  {tab === 'sdg' ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          const id = await ensureVersion('SDG');
                          await api(`/api/copo/mappings/${id}/relevant-sdgs`, {
                            method: 'PATCH',
                            body: JSON.stringify({
                              sdgIds: workspace.relevantSdgIds || [],
                              showAll: !workspace.showAllSdgs,
                            }),
                          });
                          await loadWorkspace();
                        }}
                      >
                        {workspace.showAllSdgs ? 'Show relevant SDGs' : 'Show all 17 SDGs'}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setAddSdgOpen(true)}>
                        <Plus size={14} /> Add SDG
                      </Button>
                    </>
                  ) : null}
                  <Button variant="secondary" size="sm" onClick={() => setExpandCos((v) => !v)}>
                    {expandCos ? 'Collapse COs' : 'Expand COs'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setReviewOpen(true)}>
                    Review justifications
                  </Button>
                  {workspace.permissions.canEdit ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          const id = await ensureVersion();
                          const data = await api<{ suggestions: typeof suggestions }>(`/api/copo/mappings/${id}/suggestions`);
                          setSuggestions(data.suggestions.map((s) => ({ ...s, selected: false })));
                          setSuggestOpen(true);
                        }}
                      >
                        <Sparkles size={14} /> Suggest mapping
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          const id = await ensureVersion();
                          const data = await api<{ previous: { id: number; versionNumber: number } | null }>(
                            `/api/copo/mappings/${id}/copy-preview`,
                          );
                          setCopyPreview(data);
                          setCopyOpen(true);
                        }}
                      >
                        <Copy size={14} /> Copy previous mapping
                      </Button>
                    </>
                  ) : null}
                  {workspace.mapping.id ? (
                    <Link to={`${basePath}/reports/${workspace.mapping.id}/print`}>
                      <Button variant="secondary" size="sm">
                        <FileText size={14} /> Print / PDF
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>

              {tab === 'sdg' ? (
                <p className="text-xs text-ink-muted">
                  A CO with no SDG mapping is valid. Do not add SDG 4 to every outcome simply because this is a course.
                </p>
              ) : null}

              <Surface className="!p-0 overflow-hidden">
                <div className="overflow-auto">
                  <table className="min-w-full border-separate border-spacing-0 text-sm">
                    <thead>
                      <tr>
                        <th className="sticky left-0 z-10 min-w-[280px] border-b border-border bg-surface px-3 py-3 text-left font-medium text-ink">
                          Course Outcome
                        </th>
                        {columns.map((col) => (
                          <th key={col.id} className="min-w-[72px] border-b border-border bg-surface px-1 py-3 text-center">
                            <button
                              type="button"
                              className="font-semibold text-accent hover:underline"
                              title={`${col.code} — ${col.title || ''}\n${col.statement || ''}`}
                              onClick={() => setInfoTarget(col)}
                            >
                              {col.code}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {workspace.courseOutcomes.map((co) => (
                        <tr key={co.id} className="align-top">
                          <td className="sticky left-0 z-10 border-b border-border bg-surface px-3 py-3">
                            <div className="font-medium text-ink">
                              {co.code}
                              {co.bloomsLabel ? <span className="ml-2 text-xs font-normal text-ink-muted">{co.bloomsLabel}</span> : null}
                            </div>
                            {expandCos ? <p className="mt-1 text-xs leading-relaxed text-ink-secondary">{co.statement}</p> : null}
                          </td>
                          {columns.map((col) => {
                            const item = cellValue(workspace.items, co.id, col.id, kind);
                            const strength = item?.strength ?? null;
                            const missing = Boolean(strength && !item?.justification);
                            return (
                              <td key={col.id} className="border-b border-border px-1 py-2 text-center">
                                <button
                                  type="button"
                                  disabled={!workspace.permissions.canEdit}
                                  onClick={() => onCellClick(co.id, col.id)}
                                  onKeyDown={(e) => onCellKey(e, co.id, col.id)}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    if (strength) setJustification({ coId: co.id, targetId: col.id, text: item?.justification || '' });
                                  }}
                                  className={cn(
                                    'relative h-10 w-10 rounded-[var(--radius-sm)] text-sm font-semibold tabular-nums transition disabled:opacity-60',
                                    strengthClass(strength),
                                  )}
                                  aria-label={`${co.code} to ${col.code} ${strength ?? 'not mapped'}`}
                                >
                                  {strength ?? '–'}
                                  {missing ? <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-warning" /> : null}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {tab === 'pso' && columns.length === 0 ? (
                    <p className="px-4 py-8 text-sm text-ink-muted">Official / Approved PSO Data Pending for the selected program.</p>
                  ) : null}
                  {tab === 'sdg' && columns.length === 0 ? (
                    <p className="px-4 py-8 text-sm text-ink-muted">No relevant SDGs selected. Use Add SDG, or show all 17 SDGs.</p>
                  ) : null}
                </div>
              </Surface>

              <Surface>
                <h3 className="text-sm font-semibold text-ink">Mapping summary</h3>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>COs: {workspace.summary.courseOutcomeCount}</div>
                  <div>Mapped relationships: {workspace.summary.mappedRelationships}</div>
                  <div>High: {workspace.summary.high}</div>
                  <div>Moderate: {workspace.summary.moderate}</div>
                  <div>Low: {workspace.summary.low}</div>
                  <div>Missing justifications: {workspace.summary.missingJustifications}</div>
                </dl>
                <p className="mt-3 text-xs text-ink-muted">This is mapping / alignment, not attainment.</p>
              </Surface>
            </>
          ) : null}
        </div>
      ) : null}

      <Modal open={Boolean(infoTarget)} onClose={() => setInfoTarget(null)} title={infoTarget ? `${infoTarget.code} — ${infoTarget.title || ''}` : 'Definition'}>
        <p className="text-sm leading-relaxed text-ink-secondary">{infoTarget?.statement || 'Official Data Pending'}</p>
        {infoTarget?.source ? <p className="mt-3 text-xs text-ink-muted">Source: {infoTarget.source}</p> : null}
      </Modal>

      <Modal
        open={Boolean(justification && mappedCell?.co)}
        onClose={() => setJustification(null)}
        title={mappedCell?.co && mappedCell.target ? `${mappedCell.co.code} → ${mappedCell.target.code}` : 'Justification'}
        description={mappedCell?.item?.strength ? `Strength: ${mappedCell.item.strength}` : undefined}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setJustification(null)}>
              Close
            </Button>
            <Button onClick={saveJustification} disabled={justificationBusy}>
              Save
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink-secondary">{mappedCell?.co?.statement}</p>
        <Field label="Mapping justification">
          <Textarea
            value={justification?.text || ''}
            onChange={(e) => justification && setJustification({ ...justification, text: e.target.value })}
            placeholder="Explain the curricular contribution. Do not merely repeat official statements."
          />
        </Field>
        <div className="mt-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              if (!justification || !workspace?.mapping.id) return;
              setJustificationBusy(true);
              try {
                const data = await api<{ draft: string }>(
                  `/api/copo/mappings/${workspace.mapping.id}/justification-draft?courseOutcomeId=${justification.coId}&targetId=${justification.targetId}`,
                );
                setJustification({ ...justification, text: data.draft });
              } finally {
                setJustificationBusy(false);
              }
            }}
            disabled={justificationBusy}
          >
            Suggest justification
          </Button>
        </div>
      </Modal>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Review mapping justifications" size="xl">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase text-ink-muted">
              <th className="py-2">Mapping</th>
              <th className="py-2">Strength</th>
              <th className="py-2">Justification</th>
            </tr>
          </thead>
          <tbody>
            {(workspace?.items || [])
              .filter((i) => i.strength)
              .map((item) => {
                const co = workspace?.courseOutcomes.find((c) => c.id === item.courseOutcomeId);
                const col = columns.find((c) => c.id === Number(cellTarget(item, kind)));
                return (
                  <tr key={item.id} className="border-t border-border">
                    <td className="py-2">
                      {co?.code} → {col?.code}
                    </td>
                    <td className="py-2">{item.strength}</td>
                    <td className="py-2 max-w-md text-ink-secondary">{item.justification || 'Missing'}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </Modal>

      <Modal
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        title="AI Suggested — Not Approved"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSuggestOpen(false)}>
              Close
            </Button>
            <Button
              onClick={async () => {
                if (!workspace?.mapping.id) return;
                const items = suggestions.filter((s) => s.selected).map((s) => ({
                  courseOutcomeId: s.courseOutcomeId,
                  programOutcomeId: kind === 'PO' ? s.programOutcomeId : undefined,
                  programSpecificOutcomeId: kind === 'PSO' ? s.programSpecificOutcomeId || s.programOutcomeId : undefined,
                  sdgId: kind === 'SDG' ? s.sdgId || s.programOutcomeId : undefined,
                  strength: s.suggested,
                }));
                if (!items.length) return;
                await api(`/api/copo/mappings/${workspace.mapping.id}/suggestions/accept`, {
                  method: 'POST',
                  body: JSON.stringify({ items }),
                });
                await loadWorkspace();
                setSuggestOpen(false);
                toast('Accepted suggestions remain draft until you submit');
              }}
            >
              Accept all reviewed
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink-muted">Suggestions are a draft aid and are never auto-approved.</p>
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase text-ink-muted">
              <th className="py-2">Accept</th>
              <th className="py-2">CO</th>
              <th className="py-2">Target</th>
              <th className="py-2">Suggested</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s, i) => (
              <tr key={`${s.courseOutcomeId}-${s.programOutcomeId}`} className="border-t border-border">
                <td className="py-2">
                  <input
                    type="checkbox"
                    checked={Boolean(s.selected)}
                    onChange={(e) =>
                      setSuggestions((prev) => prev.map((row, idx) => (idx === i ? { ...row, selected: e.target.checked } : row)))
                    }
                  />
                </td>
                <td className="py-2">{s.coCode}</td>
                <td className="py-2">{s.poCode}</td>
                <td className="py-2">{s.suggested}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      <Modal
        open={copyOpen}
        onClose={() => setCopyOpen(false)}
        title="Copy previous mapping"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCopyOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!copyPreview?.previous || !workspace?.mapping.id}
              onClick={async () => {
                if (!copyPreview?.previous || !workspace?.mapping.id) return;
                const result = await api<{ copied: number; skipped: number }>(`/api/copo/mappings/${workspace.mapping.id}/copy`, {
                  method: 'POST',
                  body: JSON.stringify({ fromVersionId: copyPreview.previous.id }),
                });
                await loadWorkspace();
                setCopyOpen(false);
                toast(`Copied ${result.copied} relationships (${result.skipped} skipped)`);
              }}
            >
              Copy compatible cells
            </Button>
          </>
        }
      >
        {copyPreview?.previous ? (
          <p className="text-sm text-ink-secondary">
            Previous version {copyPreview.previous.versionNumber} is copied only where scheme, program, CO statements, and PSO/SDG
            versions match. Different schemes are never copied.
          </p>
        ) : (
          <p className="text-sm text-ink-muted">No previous compatible mapping was found for this subject.</p>
        )}
      </Modal>

      <Modal
        open={addSdgOpen}
        onClose={() => setAddSdgOpen(false)}
        title="Add relevant SDG"
        footer={
          <Button variant="secondary" onClick={() => setAddSdgOpen(false)}>
            Close
          </Button>
        }
      >
        <ul className="max-h-80 space-y-2 overflow-auto text-sm">
          {(workspace?.sdgs || [])
            .filter((s) => !(workspace?.relevantSdgIds || []).includes(s.id))
            .map((sdg) => (
              <li key={sdg.id}>
                <button
                  type="button"
                  className="w-full rounded-[var(--radius-md)] border border-border px-3 py-2 text-left hover:border-accent"
                  onClick={async () => {
                    const id = await ensureVersion('SDG');
                    await api(`/api/copo/mappings/${id}/relevant-sdgs`, {
                      method: 'PATCH',
                      body: JSON.stringify({ sdgIds: [...(workspace?.relevantSdgIds || []), sdg.id], showAll: false }),
                    });
                    await loadWorkspace();
                    setAddSdgOpen(false);
                  }}
                >
                  <span className="font-medium">{sdg.code}</span> — {sdg.officialTitle}
                  <p className="mt-1 text-xs text-ink-muted">{sdg.officialDescription}</p>
                </button>
              </li>
            ))}
        </ul>
      </Modal>

      <Modal
        open={submitAllOpen}
        onClose={() => setSubmitAllOpen(false)}
        title="Submit all outcome mappings"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSubmitAllOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!submitAllPreview?.ready.length || Boolean(submitAllPreview?.blocked.length)}
              onClick={async () => {
                try {
                  await api('/api/copo/outcome-workspace/submit-all', {
                    method: 'POST',
                    body: JSON.stringify({
                      courseId: Number(courseId),
                      programId: programId ? Number(programId) : null,
                      academicYearId: academicYearId ? Number(academicYearId) : null,
                      schemeId: schemeId ? Number(schemeId) : null,
                      confirm: true,
                    }),
                  });
                  await loadWorkspace();
                  setSubmitAllOpen(false);
                  toast('Ready mappings submitted');
                } catch (err) {
                  toast(err instanceof Error ? err.message : 'Submit failed', 'error');
                }
              }}
            >
              Submit ready mappings
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink-muted">Incomplete mappings are not submitted silently.</p>
        {submitAllPreview?.ready.map((r) => (
          <p key={r.mappingKind} className="text-sm">
            Ready: {r.mappingKind}
          </p>
        ))}
        {submitAllPreview?.blocked.map((r) => (
          <p key={r.mappingKind} className="text-sm text-warning">
            Blocked: {r.mappingKind} — {r.reason}
          </p>
        ))}
        {submitAllPreview?.skipped.map((r) => (
          <p key={r.mappingKind} className="text-sm text-ink-muted">
            Skipped: {r.mappingKind} — {r.reason}
          </p>
        ))}
      </Modal>
    </div>
  );
}
