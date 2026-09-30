import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { PageHeader, Skeleton, Surface, Button } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { StatusPill } from '../lms/studentUi';

export function AlumniRecognitionSelfPage() {
  useDocumentTitle('My Recognition');
  const [recognition, setRecognition] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [contributions, setContributions] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  function load() {
    setLoading(true);
    setError('');
    Promise.all([
      api('/api/alumni/recognition/mine'),
      api<{ offerings: any[] }>('/api/alumni/recognition/opportunities'),
      api<{ communities: any[] }>('/api/alumni/recognition/communities'),
      api('/api/alumni/recognition/contributions'),
    ])
      .then(([mine, opps, comms, contrib]) => {
        setRecognition(mine);
        setOpportunities(opps.offerings || []);
        setCommunities(comms.communities || []);
        setContributions(contrib);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load recognition'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function registerInterest(id: number) {
    setBusy(`opp-${id}`);
    try {
      await api(`/api/alumni/recognition/opportunities/${id}/interest`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Interest registration failed');
    } finally {
      setBusy('');
    }
  }

  async function joinCommunity(id: number) {
    setBusy(`comm-${id}`);
    try {
      await api(`/api/alumni/recognition/communities/${id}/join`, { method: 'POST', body: JSON.stringify({}) });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Join failed');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recognition & Value"
        subtitle="Your institutional recognition, value opportunities, communities, and contribution history."
        actions={(
          <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni/360">
            My 360
          </Link>
        )}
      />

      {error ? <Surface className="text-sm text-danger">{error}</Surface> : null}
      {loading ? <Skeleton className="h-48 w-full" /> : null}

      {!loading ? (
        <>
          <Surface className="space-y-3" data-testid="self-recognition">
            <h2 className="text-sm font-semibold">Recognition</h2>
            {(recognition?.recognitions || []).length === 0 ? (
              <p className="text-sm text-ink-muted">No issued recognitions yet.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {recognition.recognitions.map((r: any) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-ink-muted">{r.category} · {r.awardDate || '—'}</p>
                    </div>
                    <StatusPill tone="success">{r.status}</StatusPill>
                  </li>
                ))}
              </ul>
            )}
            {(recognition?.certificates || []).length ? (
              <div>
                <p className="text-xs font-medium text-ink-muted">Certificates</p>
                <ul className="mt-1 text-sm">
                  {recognition.certificates.map((c: any) => (
                    <li key={c.id}>{c.certificateType} · {c.referenceCode}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Surface>

          <Surface className="space-y-3" data-testid="self-opportunities">
            <h2 className="text-sm font-semibold">Opportunities for Me</h2>
            {opportunities.length === 0 ? (
              <p className="text-sm text-ink-muted">No open value offerings right now.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {opportunities.map((o: any) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <p className="font-medium">{o.title}</p>
                      <p className="text-xs text-ink-muted">{o.category} · {o.status}</p>
                    </div>
                    <Button size="sm" disabled={busy === `opp-${o.id}`} onClick={() => registerInterest(o.id)}>
                      Express interest
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Surface>

          <Surface className="space-y-3" data-testid="self-community">
            <h2 className="text-sm font-semibold">Community</h2>
            {communities.length === 0 ? (
              <p className="text-sm text-ink-muted">No communities available.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {communities.map((c: any) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-ink-muted">{c.type}{c.city ? ` · ${c.city}` : ''}</p>
                    </div>
                    <Button size="sm" variant="ghost" disabled={busy === `comm-${c.id}`} onClick={() => joinCommunity(c.id)}>
                      Opt in
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {(recognition?.communities || []).length ? (
              <div>
                <p className="text-xs font-medium text-ink-muted">My memberships</p>
                <ul className="mt-1 text-sm">
                  {recognition.communities.map((m: any) => (
                    <li key={m.id}>{m.communityName || `Community #${m.communityId}`} · {m.status}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Surface>

          <Surface className="space-y-3" data-testid="self-contributions">
            <h2 className="text-sm font-semibold">My Contributions</h2>
            <p className="text-xs text-ink-muted">{contributions?.note || 'Factual contribution history — no reciprocity score.'}</p>
            {(contributions?.contributions || []).length === 0 ? (
              <p className="text-sm text-ink-muted">No verified contributions in the current window.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {contributions.contributions.map((c: any, idx: number) => (
                  <li key={`${c.kind}-${idx}`} className="py-2">
                    {c.label} · count {c.count}
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        </>
      ) : null}
    </div>
  );
}
