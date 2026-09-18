import { useEffect, useState } from 'react';
import { PageHeader, Surface, Skeleton, SectionTitle } from '../../components/ui';
import { maintApi, type TechnicianDashboard } from '../../lib/maintenanceApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { TicketTable } from './components';

export function TechnicianWorkPage() {
  useDocumentTitle('My Assigned Work');
  const [d, setD] = useState<TechnicianDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { maintApi.technicianDashboard().then(setD).catch(() => setD(null)).finally(() => setLoading(false)); }, []);

  if (loading) return <Skeleton className="h-64" />;
  if (!d) return <Surface><p className="text-sm text-ink-muted">Unable to load your work queue.</p></Surface>;

  const c = d.counts;
  return (
    <div>
      <PageHeader title="My Assigned Work" subtitle="Tickets assigned to you or your team." />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[['Assigned', c.assigned], ['Overdue', c.overdue], ['Due today', c.dueToday], ['High priority', c.highPriority], ['Waiting', c.waiting]].map(([l, v]) => (
          <Surface key={l as string} className="!p-4"><div className="text-2xl font-semibold">{v}</div><div className="text-xs text-ink-muted">{l}</div></Surface>
        ))}
      </div>
      <div className="space-y-4">
        {d.overdue.length > 0 && <Section title="Overdue" rows={d.overdue} />}
        {d.dueToday.length > 0 && <Section title="Due today" rows={d.dueToday} />}
        <Section title="All assigned" rows={d.assigned} empty="Nothing assigned to you right now." />
        {d.recentlyCompleted.length > 0 && <Section title="Recently completed" rows={d.recentlyCompleted} />}
      </div>
    </div>
  );
}

function Section({ title, rows, empty }: { title: string; rows: import('../../lib/maintenanceApi').Ticket[]; empty?: string }) {
  return (
    <div>
      <SectionTitle title={`${title} (${rows.length})`} />
      <Surface className="!p-0 overflow-hidden"><TicketTable rows={rows} empty={empty} /></Surface>
    </div>
  );
}
