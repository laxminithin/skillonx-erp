import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../../lib/api';
import { Surface, Skeleton, EmptyState } from '../../components/ui';
import { cn } from '../../lib/utils';

/** Small resource hook shared across executive pages. */
export function useResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!path) return;
    let live = true;
    setLoading(true);
    api<T>(path)
      .then((d) => live && (setData(d), setError(null)))
      .catch((err: Error) => live && setError(err.message || 'Unable to load'))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [path]);
  return { data, error, loading, setData };
}

export function formatValue(value: number | string | null, unit?: string): string {
  if (value == null) return 'No data';
  if (unit === 'percent') return `${value}%`;
  if (unit === 'currency') {
    const n = Number(value);
    return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN')}` : String(value);
  }
  if (typeof value === 'number') return value.toLocaleString('en-IN');
  return String(value);
}

/** Executive KPI cards with provenance + drilldown affordance. */
export function KpiCards({
  kpis,
  loading,
}: {
  kpis: Array<{ key: string; label: string; value: number | string | null; unit?: string; noData?: boolean; sourceDomain?: string }>;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <Surface key={i} className="p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-3 h-8 w-20" />
          </Surface>
        ))}
      </div>
    );
  }
  if (!kpis.length) return <EmptyState title="No metrics available" />;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {kpis.map((k) => (
        <Surface key={k.key} className="flex flex-col justify-between p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">{k.label}</p>
          <p
            className={cn(
              'mt-2 text-[1.6rem] font-semibold tabular-nums tracking-tight',
              k.noData ? 'text-ink-muted' : 'text-ink',
            )}
          >
            {formatValue(k.value, k.unit)}
          </p>
          {k.sourceDomain ? (
            <p className="mt-1 text-[10px] uppercase tracking-wide text-ink-muted/70">{k.sourceDomain}</p>
          ) : null}
        </Surface>
      ))}
    </div>
  );
}

export function SeverityDot({ severity }: { severity: 'HIGH' | 'MEDIUM' | 'LOW' | string }) {
  return (
    <span
      className={cn(
        'mr-2 inline-block h-2 w-2 shrink-0 rounded-full',
        severity === 'HIGH' && 'bg-danger',
        severity === 'MEDIUM' && 'bg-warning',
        (severity === 'LOW' || severity === 'NORMAL') && 'bg-info',
      )}
    />
  );
}

export function ExecPanel({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
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

export function Unavailable({ label = 'Not available for this institution' }: { label?: string }) {
  return <EmptyState title={label} />;
}
