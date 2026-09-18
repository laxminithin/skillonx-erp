import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader, Surface, Skeleton, Badge, SectionTitle } from '../../components/ui';
import { maintApi, type ManagerDashboard, type Ticket, SLA_TONE, PRIORITY_TONE } from '../../lib/maintenanceApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { STATUS_LABEL } from './shared';

export function ManagerDashboardPage() {
  useDocumentTitle('Maintenance Manager');
  const [d, setD] = useState<ManagerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { maintApi.managerDashboard().then(setD).catch(() => setD(null)).finally(() => setLoading(false)); }, []);

  if (loading) return <Skeleton className="h-64" />;
  if (!d) return <Surface><p className="text-sm text-ink-muted">Unable to load the dashboard.</p></Surface>;

  const c = d.counts;
  const stats: { label: string; value: number; tone?: string }[] = [
    { label: 'Open', value: c.open },
    { label: 'Unassigned', value: c.unassigned, tone: c.unassigned ? 'text-warning' : undefined },
    { label: 'Critical', value: c.critical, tone: c.critical ? 'text-danger' : undefined },
    { label: 'SLA breached', value: c.slaBreached, tone: c.slaBreached ? 'text-danger' : undefined },
    { label: 'Approaching', value: c.slaApproaching, tone: c.slaApproaching ? 'text-warning' : undefined },
    { label: 'Reopened', value: c.reopened },
    { label: 'Waiting parts', value: c.waitingParts },
    { label: 'Resolved today', value: c.resolvedToday, tone: 'text-success' },
  ];

  return (
    <div>
      <PageHeader title="Maintenance Manager" subtitle="What needs attention now — the central Facilities & IT service queue." />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Surface key={s.label} className="!p-4">
            <div className={`text-2xl font-semibold ${s.tone ?? ''}`}>{s.value}</div>
            <div className="text-xs text-ink-muted">{s.label}</div>
          </Surface>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActionList title="Unassigned / triage" tickets={d.actionRequired.unassigned} empty="Triage queue clear." />
        <ActionList title="SLA breached" tickets={d.actionRequired.slaBreached} empty="No breaches." tone="danger" />
        <ActionList title="Critical" tickets={d.actionRequired.critical} empty="No critical tickets." tone="danger" />
        <ActionList title="Approaching SLA" tickets={d.actionRequired.slaApproaching} empty="None approaching." tone="warning" />
        <ActionList title="Reopened" tickets={d.actionRequired.reopened} empty="None reopened." tone="warning" />
        <ActionList title="Waiting on parts / approval" tickets={[...d.actionRequired.waitingParts, ...d.actionRequired.waitingApproval]} empty="No blockers." />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Surface>
          <SectionTitle title="Queue by team" />
          <div className="space-y-1.5">
            {d.byTeam.length === 0 && <p className="text-sm text-ink-muted">No open tickets.</p>}
            {d.byTeam.map((t) => (
              <div key={`${t.teamId}`} className="flex items-center justify-between text-sm">
                <span>{t.teamName} {t.kind && <span className="text-xs text-ink-muted">({t.kind})</span>}</span>
                <Badge>{t.open} open</Badge>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <SectionTitle title="Queue health" />
            <div className="flex flex-wrap gap-2">
              {Object.entries(d.queueHealth).map(([s, n]) => <Badge key={s}>{STATUS_LABEL[s] ?? s}: {n}</Badge>)}
            </div>
          </div>
        </Surface>
        <Surface>
          <SectionTitle title="Recent activity" />
          <ol className="space-y-2 text-sm">
            {d.recentActivity.map((a) => (
              <li key={a.id} className="flex justify-between gap-2">
                <span><Link to={`/maintenance/tickets/${a.ticketId}`} className="text-brand hover:underline">{a.ticketNo}</Link> — {a.type.replaceAll('_', ' ').toLowerCase()}{a.note ? `: ${a.note}` : ''}</span>
                <span className="shrink-0 text-xs text-ink-muted">{a.actorName ?? 'System'}</span>
              </li>
            ))}
          </ol>
        </Surface>
      </div>
    </div>
  );
}

function ActionList({ title, tickets, empty, tone }: { title: string; tickets: Ticket[]; empty: string; tone?: 'danger' | 'warning' }) {
  return (
    <Surface>
      <div className="mb-2 flex items-center justify-between">
        <SectionTitle title={title} />
        <Badge className={tone === 'danger' ? 'bg-danger-soft text-danger' : tone === 'warning' ? 'bg-warning-soft text-warning' : ''}>{tickets.length}</Badge>
      </div>
      {tickets.length === 0 ? <p className="text-sm text-ink-muted">{empty}</p> : (
        <ul className="space-y-1.5">
          {tickets.slice(0, 8).map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
              <Link to={`/maintenance/tickets/${t.id}`} className="min-w-0 flex-1 truncate">
                <span className="font-medium text-brand">{t.ticketNo}</span> <span className="text-ink-muted">{t.title}</span>
              </Link>
              <span className="flex shrink-0 gap-1">
                <Badge className={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>
                {t.sla.overall === 'BREACHED' && <Badge className={SLA_TONE.BREACHED}>breached</Badge>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}
