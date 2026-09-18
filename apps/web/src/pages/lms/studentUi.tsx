import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { EmptyState, Surface } from '../../components/ui';

export function ProgressBar({
  value,
  label,
  className,
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={className}>
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>{label || 'Progress'}</span>
        <span className="tabular-nums font-medium text-ink">{pct}%</span>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function StatusPill({
  children,
  tone = 'muted',
}: {
  children: ReactNode;
  tone?: 'muted' | 'success' | 'warning' | 'danger' | 'accent';
}) {
  const styles = {
    muted: 'bg-surface-muted text-ink-secondary',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    accent: 'bg-accent-soft text-accent',
  }[tone];
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide', styles)}>
      {children}
    </span>
  );
}

export function statusToneFor(status: string): 'muted' | 'success' | 'warning' | 'danger' | 'accent' {
  const s = status.toUpperCase();
  if (['EVALUATED', 'RETURNED', 'COMPLETED', 'RESULT_RELEASED', 'STRONG', 'SUBMITTED'].includes(s)) return 'success';
  if (['LATE', 'DEVELOPING', 'DUE_SOON', 'RESULT_PENDING', 'DRAFT', 'UPCOMING'].includes(s)) return 'warning';
  if (['NEEDS ATTENTION', 'NEEDS_ATTENTION', 'REJECTED'].includes(s)) return 'danger';
  if (['AVAILABLE', 'ACTIVE', 'NOT STARTED', 'NOT_STARTED'].includes(s)) return 'accent';
  return 'muted';
}

export function StudentEmpty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <Surface>
      <EmptyState title={title} body={body} />
      {action}
    </Surface>
  );
}

export function SubjectCard({
  courseId,
  name,
  code,
  facultyName,
  courseType,
  credits,
  progress,
  pendingTasks,
  nextActivity,
}: {
  courseId: number;
  name: string;
  code: string;
  facultyName?: string | null;
  courseType?: string | null;
  credits?: number | null;
  progress: number;
  pendingTasks?: number;
  nextActivity?: { title: string } | null;
}) {
  return (
    <Link
      to={`/lms/subjects/${courseId}`}
      className="flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-xs transition hover:border-border-strong hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{code}</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-ink">{name}</h3>
          <p className="mt-1 text-sm text-ink-muted">
            {facultyName || 'Faculty to be assigned'}
            {courseType ? ` · ${courseType}` : ''}
            {credits != null ? ` · ${credits} credits` : ''}
          </p>
        </div>
        {pendingTasks ? (
          <StatusPill tone="warning">
            {pendingTasks} pending
          </StatusPill>
        ) : null}
      </div>
      <ProgressBar className="mt-4" value={progress} />
      {nextActivity?.title && nextActivity.title !== 'Continue learning' ? (
        <p className="mt-3 text-sm text-ink-secondary">{nextActivity.title}</p>
      ) : null}
      <span className="mt-4 text-sm font-medium text-accent">Open subject</span>
    </Link>
  );
}

export function formatRemaining(due?: string | Date | null) {
  if (!due) return null;
  const ms = new Date(due).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms < 0) return 'Overdue';
  const hours = Math.round(ms / 3600000);
  if (hours < 24) return `${hours}h remaining`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} remaining`;
}
