import { useEffect, useState, type ReactNode } from 'react';
import { api } from '../../lib/api';
import { Surface, Skeleton, EmptyState, Badge, Button, Modal } from '../../components/ui';
import { cn } from '../../lib/utils';

export function useResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    api<T>(path)
      .then((d) => live && (setData(d), setError(null)))
      .catch((err: Error) => live && setError(err.message || 'Unable to load'))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [path, tick]);
  return { data, error, loading, setData, reload: () => setTick((t) => t + 1) };
}

export function formatWhen(value: unknown): string {
  if (!value) return '—';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'ACTIVE'
      ? 'bg-emerald-50 text-emerald-800'
      : status === 'ONBOARDING' || status === 'DRAFT'
        ? 'bg-amber-50 text-amber-800'
        : status === 'SUSPENDED'
          ? 'bg-orange-50 text-orange-800'
          : status === 'ARCHIVED'
            ? 'bg-slate-100 text-slate-600'
            : 'bg-slate-100 text-slate-700';
  return <Badge className={cn('font-medium', tone)}>{status}</Badge>;
}

export function HealthBadge({ status }: { status: string }) {
  const tone =
    status === 'HEALTHY'
      ? 'bg-emerald-50 text-emerald-800'
      : status === 'DEGRADED'
        ? 'bg-amber-50 text-amber-800'
        : status === 'UNAVAILABLE'
          ? 'bg-red-50 text-red-800'
          : 'bg-slate-100 text-slate-600';
  return <Badge className={cn('font-medium', tone)}>{status}</Badge>;
}

export function PageState({
  loading,
  error,
  empty,
  emptyTitle = 'Nothing here yet',
  children,
}: {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyTitle?: string;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (error) return <p className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>;
  if (empty) return <EmptyState title={emptyTitle} />;
  return <>{children}</>;
}

export function Panel({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
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

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  danger,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
            {loading ? 'Working…' : confirmLabel}
          </Button>
        </>
      }
    />
  );
}

export function KpiGrid({
  items,
  loading,
}: {
  items: Array<{ key: string; label: string; value: string | number; href?: string }>;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Surface key={i} className="p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-3 h-8 w-20" />
          </Surface>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((k) => {
        const inner = (
          <>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">{k.label}</p>
            <p className="mt-2 text-[1.6rem] font-semibold tabular-nums tracking-tight text-ink">{k.value}</p>
          </>
        );
        return k.href ? (
          <a key={k.key} href={k.href} className="block">
            <Surface className="p-4 transition hover:border-accent/40">{inner}</Surface>
          </a>
        ) : (
          <Surface key={k.key} className="p-4">
            {inner}
          </Surface>
        );
      })}
    </div>
  );
}
