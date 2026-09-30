import { useCallback, useEffect, useState } from 'react';
import { Badge } from '../../components/ui';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import { EVENT_STATUS_LABEL, eventsApi, type EventStatus, type EventsMeta, type EventsPermission } from '../../lib/eventsApi';

const TONE: Record<string, string> = {
  DRAFT: 'bg-surface-muted text-ink-secondary',
  UNDER_REVIEW: 'bg-info/10 text-info',
  RETURNED: 'bg-warning/10 text-warning',
  APPROVED: 'bg-warning/10 text-warning',
  SCHEDULED: 'bg-success/10 text-success',
  COMPLETED: 'bg-accent/10 text-accent',
  CLOSED: 'bg-surface-muted text-ink-secondary',
  REJECTED: 'bg-danger/10 text-danger',
  CANCELLED: 'bg-danger/10 text-danger',
  REQUESTED: 'bg-info/10 text-info',
  CONFIRMED: 'bg-success/10 text-success',
  REGISTERED: 'bg-success/10 text-success',
  ATTENDED: 'bg-success/10 text-success',
  ABSENT: 'bg-danger/10 text-danger',
  NOT_MARKED: 'bg-surface-muted text-ink-secondary',
};

export function EventStatusBadge({ status }: { status: string }) {
  const label = EVENT_STATUS_LABEL[status as EventStatus] ?? status.charAt(0) + status.slice(1).toLowerCase().replaceAll('_', ' ');
  return <Badge className={cn('border border-transparent', TONE[status] ?? 'bg-surface-muted text-ink-secondary')}>{label}</Badge>;
}

export function useEventsMeta() {
  const [meta, setMeta] = useState<EventsMeta | null>(null);
  useEffect(() => {
    eventsApi.meta().then(setMeta).catch(() => setMeta(null));
  }, []);
  const can = useCallback((p: EventsPermission) => !!meta?.permissions.includes(p), [meta]);
  return { meta, can };
}

export function errorText(err: unknown) {
  const e = err as { message?: string; details?: { conflicts?: Array<{ message: string }> } };
  const conflicts = e?.details?.conflicts;
  if (conflicts?.length) return conflicts.map((c) => c.message).join(' · ');
  return e?.message || 'Something went wrong';
}

export async function downloadWithAuth(path: string, filename: string) {
  const res = await api<Response>(path);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function nowLocalInput(offsetHours = 0) {
  const d = new Date(Date.now() + offsetHours * 3_600_000);
  d.setMinutes(0, 0, 0);
  return `${todayFrom(d)}T${String(d.getHours()).padStart(2, '0')}:00`;
}

function todayFrom(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isPast(wall: string) {
  return new Date(`${wall}:00`).getTime() <= Date.now();
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <nav className="mt-4 flex items-center justify-between gap-3 text-sm text-ink-muted" aria-label="Pagination">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-2">
        <button type="button" className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <button type="button" className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </nav>
  );
}
