import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui';
import { PRIORITY_TONE, SLA_TONE, type Ticket, relDue } from '../../lib/maintenanceApi';
import { STATUS_LABEL } from './shared';

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge className={PRIORITY_TONE[priority] ?? ''}>{priority}</Badge>;
}

export function StatusPill({ status }: { status: string }) {
  return <Badge>{STATUS_LABEL[status] ?? status}</Badge>;
}

export function SlaBadge({ ticket }: { ticket: Ticket }) {
  const s = ticket.sla.overall;
  const label = s === 'BREACHED' ? 'SLA breached' : s === 'APPROACHING' ? `Due ${relDue(ticket.sla.resolveDueAt)}` : s === 'PAUSED' ? 'SLA paused' : s === 'MET' ? 'On time' : s === 'WITHIN' ? `Due ${relDue(ticket.sla.resolveDueAt)}` : '—';
  if (s === 'NONE') return <span className="text-xs text-ink-muted">—</span>;
  return <Badge className={SLA_TONE[s] ?? ''}>{label}</Badge>;
}

export function TicketTable({ rows, empty }: { rows: Ticket[]; empty?: string }) {
  if (rows.length === 0) return <p className="px-4 py-8 text-center text-sm text-ink-muted">{empty ?? 'No tickets.'}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-muted/50 text-left text-xs uppercase tracking-wide text-ink-muted">
            <th className="px-4 py-2.5">Ticket</th>
            <th className="px-4 py-2.5">Category</th>
            <th className="px-4 py-2.5">Priority</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5">SLA</th>
            <th className="px-4 py-2.5">Team</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-b border-border/60 hover:bg-surface-muted/30">
              <td className="px-4 py-2.5">
                <Link to={`/maintenance/tickets/${t.id}`} className="font-medium text-brand hover:underline">{t.ticketNo}</Link>
                <div className="max-w-[280px] truncate text-xs text-ink-muted">{t.title}</div>
              </td>
              <td className="px-4 py-2.5">{t.categoryName ?? '—'}</td>
              <td className="px-4 py-2.5"><PriorityBadge priority={t.priority} /></td>
              <td className="px-4 py-2.5"><StatusPill status={t.status} /></td>
              <td className="px-4 py-2.5"><SlaBadge ticket={t} /></td>
              <td className="px-4 py-2.5 text-xs">{t.teamName ?? '—'}{t.assigneeName ? ` · ${t.assigneeName}` : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
