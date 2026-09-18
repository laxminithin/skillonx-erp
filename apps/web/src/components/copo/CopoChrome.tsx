import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge, Surface } from '../ui';
import { cn } from '../../lib/utils';

export function CopoTile({
  to,
  title,
  subtitle,
  icon,
}: {
  to: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-xs transition hover:border-accent/40 hover:shadow-sm"
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent">
        {icon}
      </div>
      <h2 className="text-base font-semibold text-ink group-hover:text-accent">{title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
    </Link>
  );
}

export function MappingStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}

export function strengthClass(strength: number | null | undefined) {
  if (strength === 3) return 'bg-accent text-white';
  if (strength === 2) return 'bg-accent/55 text-white';
  if (strength === 1) return 'bg-accent/20 text-accent';
  return 'bg-surface-muted text-ink-muted';
}

export function OfficialPending({ show, label = 'Official Data Pending' }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <Surface className="border-warning/30 bg-warning-soft/60">
      <p className="text-sm font-medium text-warning">{label}</p>
      <p className="mt-1 text-sm text-ink-muted">
        Authoritative syllabus text has not been loaded for this selection. Faculty should not invent CO or PO statements.
      </p>
    </Surface>
  );
}

export function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-ink-secondary">
      <span className={cn('rounded-full px-2 py-1', strengthClass(3))}>3 High Correlation</span>
      <span className={cn('rounded-full px-2 py-1', strengthClass(2))}>2 Medium Correlation</span>
      <span className={cn('rounded-full px-2 py-1', strengthClass(1))}>1 Low Correlation</span>
      <span className={cn('rounded-full px-2 py-1', strengthClass(null))}>— No Mapping</span>
    </div>
  );
}
