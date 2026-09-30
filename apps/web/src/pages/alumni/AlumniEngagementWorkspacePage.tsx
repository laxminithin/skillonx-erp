import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { StatusPill } from '../lms/studentUi';

const VIEWS = [
  { id: 'OVERVIEW', label: 'Overview' },
  { id: 'CALENDAR', label: 'Calendar' },
  { id: 'PROGRAMS', label: 'Programs' },
  { id: 'CAMPAIGNS', label: 'Campaigns' },
  { id: 'MANUAL_OUTREACH', label: 'Manual Outreach' },
  { id: 'RESPONSES', label: 'Responses' },
  { id: 'APPROVALS', label: 'Approvals' },
  { id: 'TEMPLATES', label: 'Templates' },
] as const;

export function AlumniEngagementWorkspacePage() {
  useDocumentTitle('Alumni Engagement');
  const [params, setParams] = useSearchParams();
  const view = (params.get('view') || 'OVERVIEW').toUpperCase();
  const [data, setData] = useState<any>(null);
  const [programs, setPrograms] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [calendar, setCalendar] = useState<any>(null);
  const [campaignDetail, setCampaignDetail] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  function setView(v: string) {
    setParams({ view: v });
    setCampaignDetail(null);
  }

  useEffect(() => {
    setLoading(true);
    setError('');
    const load = async () => {
      if (view === 'PROGRAMS') {
        const res = await api<{ programs: any[] }>('/api/alumni-admin/engagement/programs');
        setPrograms(res.programs || []);
        setData(null);
      } else if (view === 'CAMPAIGNS') {
        const res = await api<{ campaigns: any[] }>('/api/alumni-admin/engagement/campaigns');
        setCampaigns(res.campaigns || []);
        setData(null);
      } else if (view === 'TEMPLATES') {
        const res = await api<{ templates: any[] }>('/api/alumni-admin/engagement/templates');
        setTemplates(res.templates || []);
        setData(null);
      } else if (view === 'CALENDAR') {
        const res = await api('/api/alumni-admin/engagement/calendar?view=MONTH');
        setCalendar(res);
        setData(null);
      } else {
        const res = await api(`/api/alumni-admin/engagement?view=${view}`);
        setData(res);
      }
    };
    load()
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load engagement workspace'))
      .finally(() => setLoading(false));
  }, [view]);

  async function openCampaign(id: number) {
    setBusy('campaign');
    try {
      const detail = await api(`/api/alumni-admin/engagement/campaigns/${id}`);
      setCampaignDetail(detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load campaign');
    } finally {
      setBusy('');
    }
  }

  async function snapshotAudience(id: number) {
    setBusy('snapshot');
    try {
      await api(`/api/alumni-admin/engagement/campaigns/${id}/snapshot-audience`, { method: 'POST', body: JSON.stringify({}) });
      await openCampaign(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Snapshot failed');
    } finally {
      setBusy('');
    }
  }

  async function approve(id: number, decision: 'APPROVED' | 'REJECTED') {
    setBusy('approve');
    try {
      await api(`/api/alumni-admin/engagement/campaigns/${id}/approvals`, {
        method: 'POST',
        body: JSON.stringify({ decision }),
      });
      await openCampaign(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approval failed');
    } finally {
      setBusy('');
    }
  }

  async function manualExecute(recipientId: number, outcome: string) {
    setBusy(`exec-${recipientId}`);
    try {
      await api(`/api/alumni-admin/engagement/recipients/${recipientId}/manual-execute`, {
        method: 'POST',
        body: JSON.stringify({ outcome }),
      });
      const res = await api(`/api/alumni-admin/engagement?view=MANUAL_OUTREACH`);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Execution failed');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Alumni Engagement"
        subtitle="Consent-aware orchestration — prepare, assign, manually execute, and track. No fake delivery telemetry."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/recognition">Recognition</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/impact">Impact</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/matching">Matching</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/intelligence">Intelligence</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/crm">CRM</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin">Alumni admin</Link>
          </div>
        )}
      />

      {data?.metrics ? (
        <div className="grid gap-2 grid-cols-2 md:grid-cols-5 text-sm">
          {[
            ['Active programs', data.metrics.activePrograms],
            ['Upcoming campaigns', data.metrics.upcomingCampaigns],
            ['Pending approvals', data.metrics.pendingApprovals],
            ['Responses needing action', data.metrics.responsesRequiringAction],
            ['Overdue follow-ups', data.metrics.overdueFollowups],
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

      {error ? <Surface className="text-sm text-danger">{error}</Surface> : null}
      {loading ? <Skeleton className="h-48 w-full" /> : null}

      {!loading && view === 'OVERVIEW' && data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Surface className="space-y-2">
            <h3 className="font-medium">Today&apos;s outreach</h3>
            {(data.todaysOutreach || []).length === 0 ? (
              <p className="text-sm text-ink-muted">No eligible outreach queued.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.todaysOutreach.map((item: any) => (
                  <li key={item.recipientId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <p className="font-medium">{item.alumniName}</p>
                      <p className="text-xs text-ink-muted">{item.channel} · {item.purpose} · last contact {item.lastContactDays ?? '—'}d</p>
                    </div>
                    <StatusPill tone="muted">{item.action}</StatusPill>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
          <Surface className="space-y-2">
            <h3 className="font-medium">Upcoming campaigns</h3>
            {(data.upcomingCampaigns || []).length === 0 ? (
              <p className="text-sm text-ink-muted">None scheduled.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {data.upcomingCampaigns.map((c: any) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-ink-muted">{c.program_name} · {c.status}</p>
                    </div>
                    <button type="button" className="rounded border border-border px-2 py-1 text-xs" onClick={() => openCampaign(c.id)}>Open</button>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
          {(data.channels || []).length ? (
            <Surface className="lg:col-span-2 space-y-2">
              <h3 className="font-medium">Channel capability</h3>
              <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 text-sm">
                {data.channels.map((ch: any) => (
                  <li key={ch.channel} className="rounded border border-border p-2">
                    <p className="font-medium">{ch.channel}</p>
                    <StatusPill tone={ch.capability === 'UNAVAILABLE' ? 'danger' : 'muted'}>{ch.capability}</StatusPill>
                    <p className="mt-1 text-xs text-ink-muted">{ch.reason}</p>
                  </li>
                ))}
              </ul>
            </Surface>
          ) : null}
        </div>
      ) : null}

      {!loading && view === 'CALENDAR' && calendar ? (
        <Surface className="space-y-3 overflow-x-auto">
          <p className="text-xs text-ink-muted">{calendar.view} · {calendar.range?.start?.slice(0, 10)} → {calendar.range?.end?.slice(0, 10)}</p>
          {!calendar.items?.length ? (
            <p className="text-sm text-ink-muted">No engagement items in range.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {calendar.items.map((item: any) => (
                <li key={`${item.kind}-${item.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-ink-muted">{item.kind} · {item.status || ''} · {String(item.start || '').slice(0, 10)}</p>
                  </div>
                  <StatusPill tone="muted">{item.kind}</StatusPill>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      ) : null}

      {!loading && view === 'PROGRAMS' ? (
        <Surface className="space-y-3 overflow-x-auto">
          {!programs.length ? <p className="text-sm text-ink-muted">No programs yet.</p> : (
            <ul className="divide-y divide-border text-sm">
              {programs.map((p) => (
                <li key={p.id} className="py-3">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-ink-muted">{p.category} · {p.status} · {p.valueExchange} · {p.academicYear || '—'}</p>
                  {p.valueToAlumni ? <p className="mt-1 text-xs">Value to alumni: {p.valueToAlumni}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Surface>
      ) : null}

      {!loading && view === 'CAMPAIGNS' ? (
        <Surface className="space-y-3 overflow-x-auto">
          {!campaigns.length ? <p className="text-sm text-ink-muted">No campaigns yet.</p> : (
            <ul className="divide-y divide-border text-sm">
              {campaigns.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-ink-muted">{c.programName} · {c.channel} · {c.status} · {c.channelCapability?.capability}</p>
                  </div>
                  <button type="button" className="rounded border border-border px-2 py-1 text-xs" onClick={() => openCampaign(c.id)}>Detail</button>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      ) : null}

      {!loading && view === 'MANUAL_OUTREACH' && data ? (
        <Surface className="space-y-3 overflow-x-auto">
          <p className="text-xs text-ink-muted">{data.note}</p>
          {!(data.items || []).length ? <p className="text-sm text-ink-muted">Queue empty.</p> : (
            <ul className="divide-y divide-border text-sm">
              {data.items.map((item: any) => (
                <li key={item.recipientId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{item.alumniName}</p>
                    <p className="text-xs text-ink-muted">
                      Channel: {item.channel} · Purpose: {item.purpose} · Last contact: {item.lastContactDays ?? '—'} days
                    </p>
                    <p className="text-xs text-ink-muted">{item.eligibility}: {(item.reasons || []).slice(0, 2).join('; ')}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {['NO_ANSWER', 'RESPONDED', 'INTERESTED', 'NOT_INTERESTED', 'FOLLOW_UP', 'WRONG_CONTACT'].map((o) => (
                      <button
                        key={o}
                        type="button"
                        disabled={busy === `exec-${item.recipientId}`}
                        className="rounded border border-border px-2 py-1 text-xs hover:bg-surface-muted"
                        onClick={() => manualExecute(item.recipientId, o)}
                      >
                        {o.replace(/_/g, ' ')}
                      </button>
                    ))}
                    <Link className="rounded border border-border px-2 py-1 text-xs" to={`/alumni-admin/profiles/${item.alumniProfileId}/360`}>360</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      ) : null}

      {!loading && view === 'RESPONSES' && data ? (
        <Surface className="overflow-x-auto">
          <ul className="divide-y divide-border text-sm">
            {(data.items || []).map((r: any) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">{r.alumniName || `Alumni #${r.alumniProfileId}`}</p>
                  <p className="text-xs text-ink-muted">{r.actionType} · {r.choice} · {r.campaignName || '—'}</p>
                </div>
                {r.requiresStaffAction ? <StatusPill tone="danger">Needs action</StatusPill> : <StatusPill tone="muted">Recorded</StatusPill>}
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}

      {!loading && view === 'APPROVALS' && data ? (
        <Surface className="overflow-x-auto">
          <ul className="divide-y divide-border text-sm">
            {(data.items || []).map((a: any) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">{a.campaign_name}</p>
                  <p className="text-xs text-ink-muted">{a.program_name} · {a.step}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="rounded border border-border px-2 py-1 text-xs" onClick={() => approve(a.campaign_id, 'APPROVED')}>Approve</button>
                  <button type="button" className="rounded border border-border px-2 py-1 text-xs" onClick={() => approve(a.campaign_id, 'REJECTED')}>Reject</button>
                </div>
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}

      {!loading && view === 'TEMPLATES' ? (
        <Surface className="overflow-x-auto">
          <ul className="divide-y divide-border text-sm">
            {templates.map((t) => (
              <li key={t.id} className="py-3">
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-ink-muted">{t.category} · {t.channel}</p>
                <p className="mt-1 text-xs whitespace-pre-wrap text-ink-muted">{String(t.body).slice(0, 240)}</p>
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}

      {campaignDetail ? (
        <Surface className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium">Campaign: {campaignDetail.campaign?.name}</h3>
            <button type="button" className="text-xs underline" onClick={() => setCampaignDetail(null)}>Close</button>
          </div>
          <p className="text-xs text-ink-muted">
            {campaignDetail.campaign?.status} · {campaignDetail.campaign?.channel} · {campaignDetail.campaign?.channelCapability?.capability}
          </p>
          <p className="text-xs text-ink-muted">{campaignDetail.note}</p>
          {campaignDetail.funnel ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {Object.entries(campaignDetail.funnel).map(([k, v]) => (
                <div key={k} className="rounded border border-border p-2">
                  <p className="text-xs text-ink-muted">{k}</p>
                  <p className="font-semibold">{String(v)}</p>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!!busy} className="rounded border border-border px-3 py-1.5 text-sm" onClick={() => snapshotAudience(campaignDetail.campaign.id)}>
              Snapshot audience
            </button>
            <button type="button" disabled={!!busy} className="rounded border border-border px-3 py-1.5 text-sm" onClick={() => approve(campaignDetail.campaign.id, 'APPROVED')}>
              Approve next step
            </button>
          </div>
          <ul className="divide-y divide-border text-sm max-h-80 overflow-auto">
            {(campaignDetail.recipients || []).slice(0, 50).map((r: any) => (
              <li key={r.id} className="py-2 flex flex-wrap justify-between gap-2">
                <span>Alumni #{r.alumniProfileId} · {r.eligibility} · {r.contactStatus} · {r.funnelStage}</span>
                <span className="text-xs text-ink-muted">{(r.reasons || []).slice(0, 2).join('; ')}</span>
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}
    </div>
  );
}
