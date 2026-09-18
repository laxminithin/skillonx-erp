import { useEffect, useState } from 'react';
import { PageHeader, Surface, Skeleton, SectionTitle, Badge } from '../../components/ui';
import { maintApi, type Reports } from '../../lib/maintenanceApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

export function MaintenanceReportsPage() {
  useDocumentTitle('Maintenance Reports');
  const [r, setR] = useState<Reports | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { maintApi.reports().then(setR).catch(() => setR(null)).finally(() => setLoading(false)); }, []);

  if (loading) return <Skeleton className="h-64" />;
  if (!r) return <Surface><p className="text-sm text-ink-muted">Unable to load reports.</p></Surface>;

  const s = r.summary;
  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Operational health of the service desk. Deterministic counts — no black-box scoring." />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Open tickets" value={s.open} />
        <Stat label="SLA compliance" value={s.slaCompliance != null ? `${s.slaCompliance}%` : '—'} sub={`${s.slaSampleSize} resolved`} />
        <Stat label="Avg resolution" value={s.avgResolutionHours != null ? `${s.avgResolutionHours}h` : '—'} />
        <Stat label="Reopened" value={s.reopened} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Table title="By category" head={['Category', 'Kind', 'Count']} rows={r.byCategory.map((x) => [x.category, x.kind ?? '—', String(x.count)])} />
        <Table title="By team" head={['Team', 'Open', 'Resolved', 'Total']} rows={r.byTeam.map((x) => [x.team, String(x.open), String(x.resolved), String(x.total)])} />
        <Table title="Top locations" head={['Room', 'Building', 'Count']} rows={r.byLocation.map((x) => [x.room, x.building ?? '—', String(x.count)])} />
        <div className="space-y-4">
          <Surface>
            <SectionTitle title="IT vs Facilities" />
            <div className="flex gap-2">{r.itVsFacilities.map((x) => <Badge key={x.kind}>{x.kind}: {x.count}</Badge>)}</div>
          </Surface>
          <Surface>
            <SectionTitle title="Recurring issues (evidence)" />
            {r.recurring.byAsset.length === 0 && r.recurring.byRoomCategory.length === 0 ? (
              <p className="text-sm text-ink-muted">No repeated failures detected yet.</p>
            ) : (
              <div className="space-y-1.5 text-sm">
                {r.recurring.byAsset.map((x) => <div key={x.assetRef} className="flex justify-between"><span>Asset {x.assetRef}</span><Badge className="bg-warning-soft text-warning">{x.failures} failures</Badge></div>)}
                {r.recurring.byRoomCategory.map((x, i) => <div key={i} className="flex justify-between"><span>{x.room} — {x.category}</span><Badge className="bg-warning-soft text-warning">{x.occurrences}×</Badge></div>)}
              </div>
            )}
          </Surface>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return <Surface className="!p-4"><div className="text-2xl font-semibold">{value}</div><div className="text-xs text-ink-muted">{label}{sub ? ` · ${sub}` : ''}</div></Surface>;
}
function Table({ title, head, rows }: { title: string; head: string[]; rows: string[][] }) {
  return (
    <Surface className="!p-0 overflow-hidden">
      <div className="p-4 pb-2"><SectionTitle title={title} /></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-surface-muted/50 text-left text-xs uppercase tracking-wide text-ink-muted">{head.map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td className="px-4 py-4 text-ink-muted" colSpan={head.length}>No data.</td></tr> : rows.map((row, i) => (
              <tr key={i} className="border-b border-border/60">{row.map((cell, j) => <td key={j} className="px-4 py-2">{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </Surface>
  );
}
