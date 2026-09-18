import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, downloadCopoExport } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, Modal, PageHeader, StatusBadge, Surface, Textarea, useToast } from '../../components/ui';
import { Legend, OfficialPending, strengthClass } from '../../components/copo/CopoChrome';
import { cn } from '../../lib/utils';
import type { CopoWorkspace, CourseOutcome, ProgramOutcome } from '../../types/copo';

function cellOf(data: CopoWorkspace, coId: number, poId: number) {
  return data.items.find((i) => i.courseOutcomeId === coId && Number(i.programOutcomeId || i.targetId) === poId) ?? null;
}

export function CopoSubjectPage({ basePath = '/copo' }: { basePath?: string }) {
  const { courseId } = useParams();
  const { toast } = useToast();
  const [data, setData] = useState<CopoWorkspace | null>(null);
  const [poInfo, setPoInfo] = useState<ProgramOutcome | null>(null);
  const [detail, setDetail] = useState<{ co: CourseOutcome; po: ProgramOutcome } | null>(null);
  const [editCo, setEditCo] = useState<CourseOutcome | null>(null);
  const [editText, setEditText] = useState('');

  const load = () => {
    if (!courseId) return;
    api<CopoWorkspace>(`/api/copo/workspace?courseId=${courseId}&kind=PO`)
      .then(setData)
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load mapping', 'error'));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useDocumentTitle(data ? `${data.course.name} CO–PO` : 'CO–PO Mapping');

  const mappedPos = useMemo(() => {
    if (!data) return 0;
    return new Set(data.items.filter((i) => i.strength).map((i) => Number(i.programOutcomeId || i.targetId))).size;
  }, [data]);

  if (!data) return <p className="text-sm text-ink-muted">Loading master mapping…</p>;

  const academicStatus =
    data.mapping.status === 'APPROVED' ? 'VERIFIED' : data.mapping.status === 'NEEDS_REVISION' ? 'NEEDS_REVIEW' : data.mapping.status || 'IMPORTED';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={data.course.name}
        subtitle={`${data.course.code} · ${data.course.schemeName || data.course.schemeCode || 'Scheme pending'}${data.program ? ` · ${data.program.name}` : ''}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={basePath}>
              <Button variant="secondary">All subjects</Button>
            </Link>
            {data.mapping.id ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() =>
                    downloadCopoExport(
                      `/api/copo/reports/${data.mapping.id}/xlsx`,
                      `${data.course.name.replace(/\s+/g, '-')}-CO-PO-Mapping.xlsx`,
                    ).catch((e) => toast(e instanceof Error ? e.message : 'Export failed', 'error'))
                  }
                >
                  Export Excel
                </Button>
                <a href={`${basePath}/reports/${data.mapping.id}/print`} target="_blank" rel="noreferrer">
                  <Button variant="secondary">Print</Button>
                </a>
              </>
            ) : null}
          </div>
        }
      />

      <OfficialPending show={Boolean(data.officialDataPending?.outcomes || data.officialDataPending?.programmeOutcomes)} />

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Surface>
          <p className="text-xs uppercase text-ink-muted">Course Outcomes</p>
          <p className="mt-1 text-2xl font-semibold">{data.courseOutcomes.length}</p>
        </Surface>
        <Surface>
          <p className="text-xs uppercase text-ink-muted">Mapped POs</p>
          <p className="mt-1 text-2xl font-semibold">{mappedPos}</p>
        </Surface>
        <Surface>
          <p className="text-xs uppercase text-ink-muted">Active correlations</p>
          <p className="mt-1 text-2xl font-semibold">{data.summary.mappedRelationships}</p>
        </Surface>
        <Surface>
          <p className="text-xs uppercase text-ink-muted">Status</p>
          <div className="mt-2">
            <StatusBadge status={academicStatus} />
          </div>
        </Surface>
      </div>

      <p className="mb-6 text-sm text-ink-secondary">
        Correlation strength: High {data.summary.high} · Medium {data.summary.moderate} · Low {data.summary.low}
      </p>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Course Outcomes</h2>
      <div className="mb-8 space-y-3">
        {data.courseOutcomes.map((co) => (
          <Surface key={co.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-sm font-semibold text-accent">{co.code}</p>
              {data.permissions.canManageMasters ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditCo(co);
                    setEditText(co.statement);
                  }}
                >
                  Edit statement
                </Button>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink">{co.statement}</p>
            <p className="mt-2 text-xs text-ink-muted">
              {co.bloomsLabel || co.bloomsLevel || ''}
              {co.source ? ` · Source: ${co.source}` : ''}
              {co.sourcePage ? ` · ${co.sourcePage}` : ''}
            </p>
          </Surface>
        ))}
        {!data.courseOutcomes.length ? (
          <Surface>
            <p className="text-sm text-ink-muted">Official course outcomes are not available for this subject yet.</p>
          </Surface>
        ) : null}
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">CO–PO Mapping Matrix</h2>
      <Legend />
      <div className="mt-3 overflow-x-auto rounded-[var(--radius-lg)] border border-border">
        <table className="min-w-max border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-surface px-3 py-2 text-left shadow-[2px_0_0_0_var(--border)]">CO</th>
              {data.programOutcomes.map((po) => (
                <th key={po.id} className="sticky top-0 bg-surface px-1 py-2 text-center font-medium">
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-xs text-accent hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-accent"
                    onClick={() => setPoInfo(po)}
                    title={po.shortTitle || po.code}
                  >
                    {po.code}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.courseOutcomes.map((co) => (
              <tr key={co.id} className="border-t border-border">
                <th className="sticky left-0 z-10 bg-surface px-3 py-2 text-left font-medium shadow-[2px_0_0_0_var(--border)]">
                  {co.code}
                </th>
                {data.programOutcomes.map((po) => {
                  const item = cellOf(data, co.id, po.id);
                  const value = item?.strength ?? null;
                  return (
                    <td key={po.id} className="px-1 py-1 text-center">
                      <button
                        type="button"
                        className={cn('inline-flex h-9 w-11 items-center justify-center rounded-md text-xs font-semibold', strengthClass(value))}
                        onClick={() => setDetail({ co, po })}
                      >
                        {value ?? '—'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-muted">3 — High Correlation · 2 — Medium Correlation · 1 — Low Correlation · — — No Mapping</p>

      <Modal open={Boolean(poInfo)} onClose={() => setPoInfo(null)} title={poInfo?.code || 'PO'} footer={<Button onClick={() => setPoInfo(null)}>Close</Button>}>
        {poInfo ? (
          <div className="space-y-2 text-sm">
            <p className="font-medium">{poInfo.shortTitle}</p>
            <p className="leading-relaxed">{poInfo.officialStatement || 'Official PO statement pending.'}</p>
            {poInfo.source ? <p className="text-xs text-ink-muted">Source: {poInfo.source}</p> : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.co.code} → ${detail.po.code}` : 'Mapping'}
        footer={<Button onClick={() => setDetail(null)}>Close</Button>}
      >
        {detail ? (
          <div className="space-y-3 text-sm">
            <p>
              Correlation:{' '}
              {(() => {
                const v = cellOf(data, detail.co.id, detail.po.id)?.strength;
                if (v === 3) return '3 — High';
                if (v === 2) return '2 — Medium';
                if (v === 1) return '1 — Low';
                return '— — No Mapping';
              })()}
            </p>
            <div>
              <p className="text-xs uppercase text-ink-muted">CO</p>
              <p>{detail.co.statement}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-ink-muted">PO</p>
              <p>
                {detail.po.shortTitle} — {detail.po.officialStatement}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-ink-muted">Source</p>
              <p>{cellOf(data, detail.co.id, detail.po.id)?.justification ? 'Master CO–PO Mapper' : 'Master CO–PO Mapper'}</p>
              {cellOf(data, detail.co.id, detail.po.id)?.justification ? (
                <p className="mt-2 leading-relaxed">{cellOf(data, detail.co.id, detail.po.id)?.justification}</p>
              ) : (
                <p className="mt-2 text-ink-muted">No rationale is recorded in the master mapper for this cell.</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(editCo)}
        onClose={() => setEditCo(null)}
        title={`Edit ${editCo?.code || 'CO'}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditCo(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!editCo) return;
                await api(`/api/copo/course-outcomes/${editCo.id}`, {
                  method: 'PATCH',
                  body: JSON.stringify({ statement: editText, mode: 'IN_PLACE' }),
                });
                toast('Course outcome updated');
                setEditCo(null);
                load();
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-xs uppercase text-ink-muted">Imported value</p>
          <p className="leading-relaxed">{editCo?.statement}</p>
          <p className="text-xs uppercase text-ink-muted">Current value</p>
          <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={5} />
        </div>
      </Modal>
    </div>
  );
}
