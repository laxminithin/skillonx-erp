import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui';

export type MatrixDomain = 'PO' | 'PSO' | 'SDG';

export type MatrixTarget = {
  id: number;
  code: string;
  shortTitle?: string | null;
  officialStatement?: string | null;
  officialTitle?: string | null;
  officialDescription?: string | null;
};

export type MatrixGroup = {
  type: MatrixDomain;
  label: string;
  colSpan: number;
  targets: MatrixTarget[];
};

export type MatrixCell = {
  id: number;
  domain?: MatrixDomain;
  courseOutcomeId: number;
  targetId?: number | null;
  currentValue: 1 | 2 | 3 | null;
  modifiedFromMaster?: boolean;
};

export type CourseOutcome = { id: number; code: string; statement: string };

type CombinedMappingMatrixProps = {
  courseOutcomes: CourseOutcome[];
  groups: MatrixGroup[];
  cells: MatrixCell[];
  onCellClick: (cell: MatrixCell | undefined, domain: MatrixDomain, coId: number, targetId: number) => void;
  onInspectCo?: (co: CourseOutcome) => void;
  onInspectTarget?: (domain: MatrixDomain, target: MatrixTarget) => void;
  showAllSdgs?: boolean;
  onToggleShowAllSdgs?: (showAll: boolean) => void;
  includeSdg?: boolean;
};

const cellCls = (value: number | null) =>
  cn(
    'inline-flex h-9 min-w-[3.5rem] items-center justify-center rounded-md text-xs font-semibold',
    value === 3
      ? 'bg-emerald-500/15 text-emerald-700'
      : value === 2
        ? 'bg-amber-500/15 text-amber-700'
        : value === 1
          ? 'bg-sky-500/15 text-sky-700'
          : 'bg-slate-100 text-slate-500',
  );

function findCell(
  cells: MatrixCell[],
  domain: MatrixDomain,
  coId: number,
  targetId: number,
) {
  return cells.find(
    (c) =>
      (c.domain || 'PO') === domain &&
      c.courseOutcomeId === coId &&
      Number(c.targetId) === targetId,
  );
}

/**
 * ONE combined academic mapping matrix with colSpan group headers.
 * Horizontal scroll stays inside this container; CO column is sticky.
 */
export function CombinedMappingMatrix({
  courseOutcomes,
  groups,
  cells,
  onCellClick,
  onInspectCo,
  onInspectTarget,
  showAllSdgs,
  onToggleShowAllSdgs,
  includeSdg,
}: CombinedMappingMatrixProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<Record<string, HTMLTableCellElement | null>>({});
  const [narrow, setNarrow] = useState(false);
  const [mobileCoIndex, setMobileCoIndex] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const flatColumns = useMemo(
    () => groups.flatMap((g) => g.targets.map((t) => ({ ...t, domain: g.type }))),
    [groups],
  );

  const scrollToGroup = (type: MatrixDomain) => {
    const el = groupRefs.current[type];
    const scroller = scrollerRef.current;
    if (!el || !scroller) return;
    const left = el.offsetLeft - 72;
    scroller.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  };

  if (!groups.length) {
    return <p className="text-sm text-ink-muted">No mapping columns available.</p>;
  }

  if (narrow) {
    const co = courseOutcomes[mobileCoIndex];
    if (!co) return null;
    return (
      <div className="space-y-4">
        <SurfaceBlock>
          <p className="text-sm font-semibold text-accent">{co.code}</p>
          <p className="mt-1 text-sm text-ink-secondary">{co.statement}</p>
        </SurfaceBlock>
        {groups.map((group) => (
          <SurfaceBlock key={group.type}>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{group.label}</h4>
            <div className="mt-2 space-y-2">
              {group.targets.map((t) => {
                const c = findCell(cells, group.type, co.id, t.id);
                const v = c?.currentValue ?? null;
                return (
                  <button
                    key={`${group.type}-${t.id}`}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 border-t border-border pt-2 text-left"
                    onClick={() => onCellClick(c, group.type, co.id, t.id)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{t.code}</p>
                      <p className="truncate text-xs text-ink-muted">
                        {t.shortTitle || t.officialTitle || t.officialStatement || ''}
                      </p>
                    </div>
                    <span className={cellCls(v)}>{v ?? '—'}</span>
                  </button>
                );
              })}
            </div>
          </SurfaceBlock>
        ))}
        <div className="flex justify-between gap-2">
          <Button
            variant="secondary"
            disabled={mobileCoIndex <= 0}
            onClick={() => setMobileCoIndex((i) => Math.max(0, i - 1))}
          >
            Previous CO
          </Button>
          <span className="self-center text-xs text-ink-muted">
            {mobileCoIndex + 1} / {courseOutcomes.length}
          </span>
          <Button
            variant="secondary"
            disabled={mobileCoIndex >= courseOutcomes.length - 1}
            onClick={() => setMobileCoIndex((i) => Math.min(courseOutcomes.length - 1, i + 1))}
          >
            Next CO
          </Button>
        </div>
        <CombinedLegend includeSdg={Boolean(includeSdg || groups.some((g) => g.type === 'SDG'))} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <Button key={g.type} size="sm" variant="secondary" onClick={() => scrollToGroup(g.type)}>
              {g.type}
            </Button>
          ))}
        </div>
        {includeSdg && onToggleShowAllSdgs ? (
          <div className="flex gap-2">
            <Button size="sm" variant={!showAllSdgs ? 'primary' : 'secondary'} onClick={() => onToggleShowAllSdgs(false)}>
              Relevant SDGs
            </Button>
            <Button size="sm" variant={showAllSdgs ? 'primary' : 'secondary'} onClick={() => onToggleShowAllSdgs(true)}>
              Show All 17 SDGs
            </Button>
          </div>
        ) : null}
      </div>

      <div
        ref={scrollerRef}
        className="overflow-x-auto rounded-[var(--radius-lg)] border border-border"
        style={{ maxWidth: '100%' }}
      >
        <table className="border-collapse text-sm" style={{ minWidth: `${72 + flatColumns.length * 64}px` }}>
          <thead>
            <tr>
              <th
                rowSpan={2}
                className="sticky left-0 top-0 z-30 border-b border-r border-border bg-surface px-3 py-2 text-left shadow-[2px_0_0_0_var(--border)]"
              >
                CO
              </th>
              {groups.map((g) => (
                <th
                  key={g.type}
                  colSpan={g.colSpan}
                  ref={(el) => {
                    groupRefs.current[g.type] = el;
                  }}
                  className="border-b border-border bg-surface-muted/60 px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-muted"
                >
                  {g.label}
                </th>
              ))}
            </tr>
            <tr>
              {groups.map((g) =>
                g.targets.map((t) => (
                  <th
                    key={`${g.type}-${t.id}`}
                    className="sticky top-0 z-20 min-w-[4rem] border-b border-border bg-surface px-1 py-2 text-center font-medium"
                    title={t.officialStatement || t.officialDescription || t.shortTitle || t.code}
                  >
                    <button
                      type="button"
                      className="text-accent hover:underline"
                      onClick={() => onInspectTarget?.(g.type, t)}
                    >
                      {t.code}
                    </button>
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {courseOutcomes.map((co) => (
              <tr key={co.id} className="border-t border-border">
                <th className="sticky left-0 z-10 bg-surface px-3 py-2 text-left font-medium shadow-[2px_0_0_0_var(--border)]">
                  <button
                    type="button"
                    className="text-left text-accent hover:underline"
                    title={co.statement}
                    onClick={() => onInspectCo?.(co)}
                  >
                    {co.code}
                  </button>
                </th>
                {flatColumns.map((col) => {
                  const c = findCell(cells, col.domain, co.id, col.id);
                  const v = c?.currentValue ?? null;
                  return (
                    <td key={`${col.domain}-${col.id}`} className="px-1 py-1 text-center">
                      <button
                        type="button"
                        className={cellCls(v)}
                        onClick={() => onCellClick(c, col.domain, co.id, col.id)}
                        title="View justification"
                      >
                        {v ?? '—'}
                      </button>
                      {c?.modifiedFromMaster ? (
                        <p className="mt-0.5 text-[10px] text-warning">Modified</p>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CombinedLegend includeSdg={Boolean(includeSdg || groups.some((g) => g.type === 'SDG'))} />
    </div>
  );
}

function SurfaceBlock({ children }: { children: ReactNode }) {
  return <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">{children}</div>;
}

function CombinedLegend({ includeSdg }: { includeSdg: boolean }) {
  return (
    <div className="mt-3 grid gap-2 text-xs text-ink-muted sm:grid-cols-2">
      <p>
        <strong className="text-ink-secondary">PO / PSO:</strong> 3 — High Correlation · 2 — Medium Correlation · 1 —
        Low Correlation · — — No Mapping
      </p>
      {includeSdg ? (
        <p>
          <strong className="text-ink-secondary">SDG:</strong> 3 — Strong Relevance · 2 — Moderate Relevance · 1 — Low
          Relevance · — — No Mapping
        </p>
      ) : null}
    </div>
  );
}
