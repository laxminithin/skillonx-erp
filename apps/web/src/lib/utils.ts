export const SURVEY_TYPE_LABELS: Record<string, string> = {
  FACULTY_FEEDBACK: 'Faculty Feedback',
  COURSE_END: 'Course End Survey',
  SEMESTER_END: 'Semester End Survey',
  SUBJECT_FEEDBACK: 'Subject Feedback',
  LABORATORY: 'Laboratory Feedback',
  TRAINING: 'Training Feedback',
  EVENT: 'Event Feedback',
  PLACEMENT_TRAINING: 'Placement Training Survey',
  INFRASTRUCTURE: 'Infrastructure Survey',
  CUSTOM: 'Custom Survey',
};

export const AVAILABILITY_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  ACTIVE: 'Active',
  ENDED: 'Ended',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived',
  PUBLISHED: 'Published',
};

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

/**
 * Copy text to the clipboard, falling back to a hidden textarea + execCommand
 * when the async Clipboard API is unavailable (older browsers, non-secure
 * contexts). Resolves to whether the copy succeeded.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

// Product-standard presentation: "18 Aug 2026" and "18 Aug 2026 · 11:47 PM".
// en-GB gives day-month-year ordering regardless of the viewer's locale.
export function formatDate(value?: string | Date | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatISODate(value?: string | Date | null) {
  if (!value) return '—';
  const raw = typeof value === 'string' ? value.slice(0, 10) : null;
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-').map(Number);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(y, m - 1, d));
  }
  return formatDate(value);
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const formatted = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  return formatted.replace(',', ' ·').replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());
}

export function statusTone(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-accent-soft text-accent';
    case 'SCHEDULED':
    case 'PUBLISHED':
      return 'bg-info-soft text-info';
    case 'DRAFT':
      return 'bg-surface-muted text-ink-muted';
    case 'ENDED':
      return 'bg-warning-soft text-warning';
    case 'CLOSED':
      return 'bg-warning-soft text-warning';
    case 'APPROVED':
    case 'COMPLETED':
    case 'FINALIZED':
    case 'GREEN':
    case 'TARGET_ACHIEVED':
      return 'bg-accent-soft text-accent';
    case 'PENDING':
      return 'bg-warning-soft text-warning';
    case 'REJECTED':
    case 'WITHDRAWN':
      return 'bg-danger-soft text-danger';
    case 'AMBER':
    case 'EVIDENCE_INCOMPLETE':
    case 'READY_FOR_REASSESSMENT':
      return 'bg-warning-soft text-warning';
    case 'RED':
    case 'TARGET_NOT_ACHIEVED':
      return 'bg-danger-soft text-danger';
    case 'IN_PROGRESS':
      return 'bg-surface-muted text-ink-muted';
    case 'PLANNED':
      return 'bg-info-soft text-info';
    case 'RESCHEDULED':
      return 'bg-warning-soft text-warning';
    case 'SKIPPED':
      return 'bg-surface-muted text-ink-muted';
    case 'ARCHIVED':
      return 'bg-surface-muted text-ink-muted';
    case 'SUBMITTED':
      return 'bg-info-soft text-info';
    case 'NEEDS_REVISION':
      return 'bg-warning-soft text-warning';
    case 'NOT_STARTED':
      return 'bg-surface-muted text-ink-muted';
    default:
      return 'bg-surface-muted text-ink-muted';
  }
}

export function greetingForNow(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function humanizeStatus(status: string) {
  return (
    AVAILABILITY_STATUS_LABELS[status] ||
    status.charAt(0) + status.slice(1).toLowerCase().replaceAll('_', ' ')
  );
}
