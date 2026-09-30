import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { StatusPill } from '../lms/studentUi';

const VIEWS = [
  { id: 'MY_ALUMNI', label: 'My Alumni' },
  { id: 'MY_FOLLOWUPS', label: 'My Follow-ups' },
  { id: 'DUE_TODAY', label: 'Due Today' },
  { id: 'OVERDUE', label: 'Overdue' },
  { id: 'RECENTLY_CONTACTED', label: 'Recently Contacted' },
  { id: 'NO_RESPONSE', label: 'No Response' },
  { id: 'ACTIVE_OPPORTUNITIES', label: 'Active Opportunities' },
  { id: 'OUTCOMES_AWAITING_VERIFICATION', label: 'Outcomes Awaiting Verification' },
  { id: 'DORMANT_RELATIONSHIPS', label: 'Dormant Relationships' },
] as const;

type Workspace = {
  view: string;
  items: any[];
  metrics: Record<string, number>;
  note?: string;
};

export function AlumniCrmWorkspacePage() {
  useDocumentTitle('Alumni CRM');
  const [view, setView] = useState<string>('MY_FOLLOWUPS');
  const [stage, setStage] = useState('');
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ view });
    if (stage) params.set('relationshipStage', stage);
    api<Workspace>(`/api/alumni-admin/crm/workspace?${params}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load CRM workspace'))
      .finally(() => setLoading(false));
  }, [view, stage]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Alumni Relationship CRM"
        subtitle="Operational workspace — follow-ups, outreach, opportunities, and outcomes. Alumni 360 remains the profile entry point."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/intelligence">Intelligence</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin">Alumni admin</Link>
          </div>
        )}
      />

      {data?.metrics ? (
        <div className="grid gap-2 grid-cols-2 md:grid-cols-5 text-sm">
          {[
            ['Contacted', data.metrics.alumniContacted],
            ['Response rate', `${data.metrics.responseRate}%`],
            ['Open follow-ups', data.metrics.openFollowups],
            ['Overdue', data.metrics.overdueFollowups],
            ['Active opps', data.metrics.activeOpportunities],
            ['Verified outcomes', data.metrics.verifiedOutcomes],
          ].map(([label, value]) => (
            <Surface key={String(label)} className="p-3">
              <p className="text-xs text-ink-muted">{label}</p>
              <p className="mt-1 text-lg font-semibold">{value}</p>
            </Surface>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`rounded-[var(--radius-md)] border px-3 py-1.5 text-sm ${view === v.id ? 'border-ink bg-ink text-white' : 'border-border hover:bg-surface-muted'}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {(view === 'MY_ALUMNI' || view === 'RECENTLY_CONTACTED' || view === 'DORMANT_RELATIONSHIPS') && (
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-muted">Stage</span>
          <select
            className="rounded-[var(--radius-md)] border border-border bg-surface px-2 py-1.5"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option value="">All</option>
            {['IDENTIFIED', 'REACHABLE', 'CONTACTED', 'RESPONDED', 'ENGAGED', 'OPPORTUNITY_IDENTIFIED', 'ACTION_IN_PROGRESS', 'OUTCOME_ACHIEVED', 'REPEAT_ENGAGEMENT'].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </label>
      )}

      {error ? <Surface className="text-sm text-danger">{error}</Surface> : null}
      {loading ? <Skeleton className="h-48 w-full" /> : null}

      {!loading && data ? (
        <Surface className="space-y-3 overflow-x-auto">
          <p className="text-xs text-ink-muted">{data.note}</p>
          {!data.items.length ? (
            <p className="text-sm text-ink-muted">No records in this view.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.items.map((item: any) => {
                const id = item.alumniProfileId || item.id;
                const name = item.alumniName || item.title || item.reason || `Record #${item.id}`;
                return (
                  <li key={`${view}-${item.id}-${id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-ink-muted">
                        {[item.alumniUsn, item.relationshipStage || item.status || item.outcomeStatus || item.verificationStatus, item.dueDate, item.opportunityType]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.status || item.relationshipStage ? (
                        <StatusPill tone={String(item.status).includes('OVERDUE') ? 'danger' : 'muted'}>
                          {item.status || item.relationshipStage}
                        </StatusPill>
                      ) : null}
                      {item.alumniProfileId ? (
                        <Link
                          className="rounded-[var(--radius-md)] border border-border px-2 py-1 text-xs font-medium hover:bg-surface-muted"
                          to={`/alumni-admin/profiles/${item.alumniProfileId}/360`}
                        >
                          Open 360
                        </Link>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Surface>
      ) : null}
    </div>
  );
}
