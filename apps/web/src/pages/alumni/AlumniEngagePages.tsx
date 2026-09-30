import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

/** Login-less engagement response page (token-bound). */
export function AlumniEngageResponsePage() {
  useDocumentTitle('Alumni response');
  const { token } = useParams();
  const [peek, setPeek] = useState<any>(null);
  const [choice, setChoice] = useState('');
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api(`/api/alumni-auth/engage/${encodeURIComponent(token)}`, { auth: false })
      .then(setPeek)
      .catch((e) => setError(e instanceof Error ? e.message : 'Invalid link'))
      .finally(() => setLoading(false));
  }, [token]);

  async function submit() {
    if (!token || !choice) return;
    setError('');
    try {
      const res = await api<{ message: string }>('/api/alumni-auth/engage', {
        auth: false,
        method: 'POST',
        body: JSON.stringify({ token, choice, form }),
      });
      setDone(res.message || 'Response recorded.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    }
  }

  if (loading) return <div className="p-6"><Skeleton className="h-40 w-full" /></div>;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 sm:p-8">
      <PageHeader
        title={peek?.institutionName || 'Alumni engagement'}
        subtitle={peek ? `Hi ${peek.alumniFirstName} — ${peek.campaignName || peek.actionType}` : 'Secure response'}
      />
      {error ? <Surface className="text-sm text-danger">{error}</Surface> : null}
      {done ? <Surface className="text-sm">{done}</Surface> : null}
      {!done && peek ? (
        <Surface className="space-y-4">
          <p className="text-sm text-ink-muted">This link is single-purpose and expires {String(peek.expiresAt || '').slice(0, 16)}.</p>
          <div className="flex flex-wrap gap-2">
            {(peek.options || []).map((o: string) => (
              <button
                key={o}
                type="button"
                onClick={() => setChoice(o)}
                className={`rounded border px-3 py-2 text-sm ${choice === o ? 'border-ink bg-ink text-white' : 'border-border'}`}
              >
                {o.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          {(peek.formFields || []).length && (choice === 'YES' || choice === 'UPDATE' || choice === 'MAYBE_LATER') ? (
            <div className="space-y-2">
              {peek.formFields.map((f: string) => (
                <label key={f} className="block text-sm">
                  <span className="text-ink-muted">{f}</span>
                  <input
                    className="mt-1 w-full rounded border border-border bg-surface px-3 py-2"
                    value={form[f] || ''}
                    onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                  />
                </label>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            disabled={!choice}
            onClick={submit}
            className="rounded border border-ink bg-ink px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Submit response
          </button>
        </Surface>
      ) : null}
    </div>
  );
}

export function AlumniPreferenceCentrePage() {
  useDocumentTitle('Communication preferences');
  const [prefs, setPrefs] = useState<any>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ preferences: any }>('/api/alumni/360/preferences')
      .then((r) => setPrefs(r.preferences))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setError('');
    setSaved(false);
    try {
      const res = await api<{ preferences: any }>('/api/alumni/360/preferences', {
        method: 'PATCH',
        body: JSON.stringify(prefs),
      });
      setPrefs(res.preferences);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    }
  }

  function toggle(key: string) {
    setPrefs((p: any) => ({ ...p, [key]: !p[key] }));
  }

  if (loading) return <div className="p-6"><Skeleton className="h-40 w-full" /></div>;

  const channelKeys = [
    ['commEmailOptIn', 'Email'],
    ['commWhatsappOptIn', 'WhatsApp'],
    ['commSmsOptIn', 'SMS'],
    ['commPhoneOptIn', 'Phone'],
  ] as const;
  const topicKeys = [
    ['prefInstitutionUpdatesOptIn', 'Institution updates'],
    ['prefEventsOptIn', 'Events'],
    ['prefMentorshipOptIn', 'Mentorship'],
    ['prefRecruitmentOptIn', 'Recruitment'],
    ['prefNetworkingOptIn', 'Networking'],
    ['prefResearchOptIn', 'Research'],
    ['prefEntrepreneurshipOptIn', 'Entrepreneurship'],
    ['prefContributionOptIn', 'Contribution'],
  ] as const;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader title="Preference centre" subtitle="Manage how the institution may contact you. Changes are recorded with consent evidence." />
      {error ? <Surface className="text-sm text-danger">{error}</Surface> : null}
      {saved ? <Surface className="text-sm">Preferences saved.</Surface> : null}
      {prefs ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Surface className="space-y-2">
            <h3 className="font-medium">Channels</h3>
            {channelKeys.map(([k, label]) => (
              <label key={k} className="flex items-center justify-between gap-2 text-sm">
                <span>{label}</span>
                <input type="checkbox" checked={Boolean(prefs[k])} onChange={() => toggle(k)} />
              </label>
            ))}
          </Surface>
          <Surface className="space-y-2">
            <h3 className="font-medium">Topics</h3>
            {topicKeys.map(([k, label]) => (
              <label key={k} className="flex items-center justify-between gap-2 text-sm">
                <span>{label}</span>
                <input type="checkbox" checked={Boolean(prefs[k])} onChange={() => toggle(k)} />
              </label>
            ))}
          </Surface>
          <Surface className="md:col-span-2 space-y-3">
            <label className="flex items-center justify-between gap-2 text-sm font-medium">
              <span>Global unsubscribe / opt-out</span>
              <input type="checkbox" checked={Boolean(prefs.globalCommOptOut)} onChange={() => toggle('globalCommOptOut')} />
            </label>
            {prefs.globalCommOptOut ? (
              <input
                className="w-full rounded border border-border px-3 py-2 text-sm"
                placeholder="Optional reason"
                value={prefs.globalOptOutReason || ''}
                onChange={(e) => setPrefs({ ...prefs, globalOptOutReason: e.target.value })}
              />
            ) : null}
            <button type="button" onClick={save} className="rounded border border-ink bg-ink px-4 py-2 text-sm text-white">Save preferences</button>
          </Surface>
        </div>
      ) : null}
    </div>
  );
}
