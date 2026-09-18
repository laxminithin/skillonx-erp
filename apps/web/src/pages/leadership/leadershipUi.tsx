import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { EmptyState, Skeleton, Surface } from '../../components/ui';

export function MetricGrid({
  items,
  loading,
}: {
  items: Array<{ label: string; value: string | number | null | undefined; hint?: string }>;
  loading?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border bg-border sm:grid-cols-3 lg:grid-cols-4">
      {loading
        ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-surface px-4 py-4 sm:px-5 sm:py-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-7 w-16" />
            </div>
          ))
        : items.map((m, i) => (
            <div
              key={m.label}
              className="bg-surface px-4 py-4 sm:px-5 sm:py-5"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">{m.label}</p>
              <p className="mt-2 text-[1.65rem] font-semibold tabular-nums tracking-tight text-ink">
                {m.value == null || m.value === '' ? '—' : m.value}
              </p>
              {m.hint ? <p className="mt-1 text-xs text-ink-muted">{m.hint}</p> : null}
            </div>
          ))}
    </div>
  );
}

export function AlertList({
  alerts,
}: {
  alerts: Array<{ severity: 'high' | 'medium' | 'low'; title: string; count: number }>;
}) {
  if (!alerts.length) {
    return <p className="text-sm text-ink-muted">No outstanding alerts.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {alerts.map((a) => (
        <li key={a.title} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <span
              className={cn(
                'mr-2 inline-block h-2 w-2 rounded-full',
                a.severity === 'high' && 'bg-danger',
                a.severity === 'medium' && 'bg-warning',
                a.severity === 'low' && 'bg-info',
              )}
            />
            <span className="text-sm text-ink">{a.title}</span>
          </div>
          <span className="tabular-nums text-sm font-semibold text-ink">{a.count}</span>
        </li>
      ))}
    </ul>
  );
}

export function ScrollTable({ children }: { children: ReactNode }) {
  return <div className="min-w-0 overflow-x-auto">{children}</div>;
}

export function SimpleTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: Array<Array<ReactNode>>;
  empty: string;
}) {
  if (!rows.length) return <EmptyState title={empty} />;
  return (
    <ScrollTable>
      <table className="min-w-full text-left text-sm">
        <thead className="text-[11px] uppercase tracking-wide text-ink-muted">
          <tr>
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border align-top">
              {row.map((cell, j) => (
                <td key={j} className="max-w-[220px] truncate px-3 py-2.5 text-ink">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollTable>
  );
}

export function Panel({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <Surface className="p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg text-ink">{title}</h2>
        {actions}
      </div>
      {children}
    </Surface>
  );
}
