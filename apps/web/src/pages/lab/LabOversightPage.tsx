import { useEffect, useState } from 'react';
import { PageHeader, StatStrip, Surface, SectionTitle, Badge, StatusBadge, EmptyState, Skeleton } from '../../components/ui';
import { labApi, type LabOversight } from '../../lib/labApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

export function LabOversightPage() {
  useDocumentTitle('Lab Oversight');
  const [data, setData] = useState<LabOversight | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { labApi.oversight().then(setData).catch((e) => setError(e.message)); }, []);

  if (error) return <div><PageHeader title="Lab Oversight" /><EmptyState title="Unavailable" body={error} /></div>;
  const s = data?.summary ?? {};

  return (
    <div>
      <PageHeader title="Lab Oversight" subtitle={data ? `${data.scope === 'INSTITUTION' ? 'Institution-wide' : 'Department'} laboratory health` : 'Laboratory health analytics'} />
      <StatStrip loading={!data} items={[
        { label: 'Labs', value: s.labs ?? 0 },
        { label: 'Assets', value: s.assets ?? 0 },
        { label: 'Faulty', value: s.faulty ?? 0 },
        { label: 'Repair backlog', value: s.repairBacklog ?? 0 },
        { label: 'Low stock', value: s.lowStockItems ?? 0 },
        { label: 'Avg readiness', value: `${s.avgReadinessPct ?? 0}%` },
      ]} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Surface>
          <SectionTitle title="Department comparison" />
          {!data ? <Skeleton className="h-32" /> : data.departments.length === 0 ? <p className="text-sm text-ink-muted">No departments in scope.</p> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-sm">
              <thead><tr className="border-b border-border text-left text-xs uppercase text-ink-muted">
                <th className="py-2 pr-3">Department</th><th className="py-2 pr-3">Labs</th><th className="py-2 pr-3">Assets</th><th className="py-2 pr-3">Faulty</th><th className="py-2">Low stock</th>
              </tr></thead>
              <tbody>{data.departments.map((d: any) => (
                <tr key={d.department} className="border-b border-border/60"><td className="py-2 pr-3">{d.department}</td><td className="py-2 pr-3 tabular-nums">{d.labs}</td><td className="py-2 pr-3 tabular-nums">{d.assets}</td><td className="py-2 pr-3 tabular-nums">{d.faulty}</td><td className="py-2 tabular-nums">{d.lowStock}</td></tr>
              ))}</tbody>
            </table></div>
          )}
        </Surface>

        <Surface>
          <SectionTitle title="Lab health" />
          {!data ? <Skeleton className="h-32" /> : data.labs.length === 0 ? <p className="text-sm text-ink-muted">No labs in scope.</p> : (
            <div className="space-y-3">{data.labs.map((l: any) => (
              <div key={l.labId}>
                <div className="flex items-center justify-between text-sm"><span className="font-medium">{l.labName}</span><span className="tabular-nums text-ink-muted">{l.readinessPct}%</span></div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${l.readinessPct}%` }} /></div>
                <div className="mt-1 flex gap-2 text-[11px] text-ink-muted">{l.departmentName && <span>{l.departmentName}</span>}{l.faulty > 0 && <span className="text-warning">{l.faulty} faulty</span>}{l.openFaults > 0 && <span>{l.openFaults} open faults</span>}{l.lowStock > 0 && <span>{l.lowStock} low stock</span>}</div>
              </div>
            ))}</div>
          )}
        </Surface>

        <Surface>
          <SectionTitle title="Pending approvals" />
          {!data ? <Skeleton className="h-24" /> : data.pendingApprovals.length === 0 ? <p className="text-sm text-ink-muted">No pending approvals.</p> : (
            <ul className="space-y-2 text-sm">{data.pendingApprovals.map((p: any) => (
              <li key={p.id} className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                <span><span className="font-medium">{p.item}</span> <span className="text-ink-muted">· {p.labName}</span></span>
                <StatusBadge status={p.status} />
              </li>
            ))}</ul>
          )}
        </Surface>

        <Surface>
          <SectionTitle title="Open faults" />
          {!data ? <Skeleton className="h-24" /> : data.faults.length === 0 ? <p className="text-sm text-ink-muted">No open faults.</p> : (
            <ul className="space-y-2 text-sm">{data.faults.slice(0, 10).map((f: any) => (
              <li key={f.id} className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                <span className="truncate">{f.description}</span>
                <Badge className={f.severity === 'HIGH' || f.severity === 'CRITICAL' ? 'bg-danger-soft text-danger shrink-0' : 'shrink-0'}>{f.severity}</Badge>
              </li>
            ))}</ul>
          )}
        </Surface>
      </div>
    </div>
  );
}
