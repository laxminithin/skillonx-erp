import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Boxes, PackageX, Wrench, CalendarClock, ClipboardCheck } from 'lucide-react';
import { PageHeader, StatStrip, Surface, SectionTitle, StatusBadge, Badge, EmptyState, Skeleton } from '../../components/ui';
import { labApi, type LabDashboard } from '../../lib/labApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { fmtDate } from './shared';

export function LabDashboardPage() {
  useDocumentTitle('Lab Dashboard');
  const [data, setData] = useState<LabDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    labApi.dashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div>
        <PageHeader title="Lab Dashboard" subtitle="Operational overview of your laboratories" />
        <EmptyState title="Unable to load dashboard" body={error} />
      </div>
    );
  }

  const s = data?.summary ?? {};
  return (
    <div className="min-w-0 max-w-full overflow-x-hidden">
      <PageHeader title="Lab Dashboard" subtitle="What needs attention across your assigned laboratories today." />

      <StatStrip
        loading={!data}
        items={[
          { label: 'Labs', value: s.labs ?? 0 },
          { label: 'Active assets', value: s.activeAssets ?? 0 },
          { label: 'Faulty', value: s.faultyAssets ?? 0 },
          { label: 'Under repair', value: s.underRepair ?? 0 },
          { label: 'Low stock', value: s.lowStockItems ?? 0 },
          { label: 'Readiness', value: `${s.readinessPct ?? 0}%` },
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Action required */}
        <div className="lg:col-span-2 space-y-6">
          <Surface>
            <SectionTitle title="Action required" />
            {!data ? (
              <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <ActionTile icon={<AlertTriangle className="h-4 w-4" />} label="Open faults" count={s.openFaults ?? 0} to="/lab/faults" tone="warning" />
                <ActionTile icon={<Wrench className="h-4 w-4" />} label="Pending repairs" count={s.pendingRepairs ?? 0} to="/lab/faults" tone="warning" />
                <ActionTile icon={<PackageX className="h-4 w-4" />} label="Overdue returns" count={s.overdueItems ?? 0} to="/lab/issues?overdueOnly=1" tone="danger" />
                <ActionTile icon={<Boxes className="h-4 w-4" />} label="Low-stock items" count={s.lowStockItems ?? 0} to="/lab/stock?lowOnly=1" tone="warning" />
                <ActionTile icon={<CalendarClock className="h-4 w-4" />} label="Sessions to prepare" count={s.sessionsNeedingPrep ?? 0} to="/lab/sessions" tone="info" />
                <ActionTile icon={<ClipboardCheck className="h-4 w-4" />} label="Pending requirements" count={s.pendingRequirements ?? 0} to="/lab/requirements" tone="info" />
              </div>
            )}
          </Surface>

          <Surface>
            <SectionTitle title="Today & upcoming lab sessions" action={<Link to="/lab/sessions" className="text-xs text-accent">View all</Link>} />
            {!data ? <Skeleton className="h-24" /> : data.upcomingSessions.length === 0 ? (
              <p className="text-sm text-ink-muted">No practical sessions scheduled in your labs this week.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Lab</th><th className="py-2 pr-3">Course</th>
                    <th className="py-2 pr-3">Faculty</th><th className="py-2 pr-3">Time</th><th className="py-2">Readiness</th>
                  </tr></thead>
                  <tbody>
                    {data.upcomingSessions.slice(0, 8).map((se, i) => (
                      <tr key={`${se.slotId}-${se.sessionDate}-${i}`} className="border-b border-border/60">
                        <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(se.sessionDate)}</td>
                        <td className="py-2 pr-3">{se.labName}</td>
                        <td className="py-2 pr-3">{se.courseTitle ?? '—'}</td>
                        <td className="py-2 pr-3">{se.facultyName ?? '—'}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{String(se.startTime).slice(0, 5)}</td>
                        <td className="py-2"><StatusBadge status={se.readinessStatus} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Surface>
        </div>

        {/* Lab health + recent activity */}
        <div className="space-y-6">
          <Surface>
            <SectionTitle title="Lab health" />
            {!data ? <Skeleton className="h-24" /> : data.labHealth.length === 0 ? (
              <p className="text-sm text-ink-muted">No labs assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {data.labHealth.map((l) => (
                  <div key={l.labId}>
                    <div className="flex items-center justify-between text-sm">
                      <Link to={`/lab/labs`} className="font-medium text-ink hover:text-accent">{l.labName}</Link>
                      <span className="tabular-nums text-ink-muted">{l.readinessPct}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${l.readinessPct}%` }} />
                    </div>
                    <div className="mt-1 flex gap-2 text-[11px] text-ink-muted">
                      <span>{l.available} available</span>
                      {l.faulty > 0 && <span className="text-warning">{l.faulty} faulty</span>}
                      {l.underRepair > 0 && <span>{l.underRepair} repairing</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Surface>

          <Surface>
            <SectionTitle title="Recent activity" />
            {!data ? <Skeleton className="h-24" /> : data.recentActivity.length === 0 ? (
              <p className="text-sm text-ink-muted">No recent activity.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.recentActivity.slice(0, 8).map((a, i) => (
                  <li key={i} className="flex items-center justify-between gap-2">
                    <span className="text-ink-secondary">{a.action.replaceAll('_', ' ').toLowerCase()}</span>
                    <Badge className="shrink-0">{a.entityType.replace('lab_', '')}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        </div>
      </div>
    </div>
  );
}

function ActionTile({ icon, label, count, to, tone }: { icon: React.ReactNode; label: string; count: number; to: string; tone: 'warning' | 'danger' | 'info' }) {
  const toneCls = tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : 'text-info';
  return (
    <Link to={to} className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 transition hover:bg-surface-muted">
      <span className="flex items-center gap-2 text-sm text-ink-secondary"><span className={toneCls}>{icon}</span>{label}</span>
      <span className={`text-lg font-semibold tabular-nums ${count > 0 ? toneCls : 'text-ink-muted'}`}>{count}</span>
    </Link>
  );
}
