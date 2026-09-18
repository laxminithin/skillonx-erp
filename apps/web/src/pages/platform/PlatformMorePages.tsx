import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Badge, Button, EmptyState, Input, PageHeader, Select, Surface, Textarea, useToast } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { ConfirmModal, HealthBadge, PageState, Panel, formatWhen, useResource } from './platformUi';

/* -------------------------------------------------------------------------- */
/* Masters                                                                    */
/* -------------------------------------------------------------------------- */

type Template = {
  id: number;
  domain: string;
  key: string;
  name: string;
  version: number;
  status: string;
  payload: unknown;
};

export function PlatformMastersPage() {
  useDocumentTitle('Master Data');
  const { data, error, loading, reload } = useResource<{ templates: Template[] }>('/api/platform/masters');
  const { data: tenants } = useResource<{ tenants: Array<{ id: number; name: string; code: string }> }>('/api/platform/tenants');
  const { toast } = useToast();
  const [collegeId, setCollegeId] = useState('');
  const [adoptionsPath, setAdoptionsPath] = useState<string | null>(null);
  const { data: adoptions, reload: reloadAdoptions } = useResource<{
    adoptions: Array<{ key: string; version: number; snapshot: unknown; adoptedAt: string }>;
  }>(adoptionsPath);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  useEffect(() => {
    setAdoptionsPath(collegeId ? `/api/platform/tenants/${collegeId}/masters` : null);
  }, [collegeId]);

  const latestByKey = new Map<string, Template>();
  for (const t of data?.templates ?? []) {
    const cur = latestByKey.get(t.key);
    if (!cur || t.version > cur.version) latestByKey.set(t.key, t);
  }
  const latest = [...latestByKey.values()].sort((a, b) => a.domain.localeCompare(b.domain) || a.key.localeCompare(b.key));

  async function adopt(key: string) {
    if (!collegeId) {
      toast('Select a tenant first', 'warning');
      return;
    }
    setBusyKey(key);
    try {
      const out = await api<{ unchanged: boolean; version: number }>('/api/platform/masters/adopt', {
        method: 'POST',
        body: JSON.stringify({ collegeId: Number(collegeId), key }),
      });
      toast(out.unchanged ? 'Already adopted — snapshot unchanged' : `Adopted version ${out.version} (copy-on-adopt)`, 'success');
      reloadAdoptions();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusyKey(null);
    }
  }

  async function versionTemplate(t: Template) {
    setBusyKey(t.key);
    try {
      const payload = typeof t.payload === 'object' && t.payload ? { ...(t.payload as object), _note: `versioned ${Date.now()}` } : { value: t.payload };
      await api(`/api/platform/masters/${encodeURIComponent(t.key)}/version`, {
        method: 'POST',
        body: JSON.stringify({ payload }),
      });
      toast('New platform template version published. Tenant copies are not rewritten.', 'success');
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Master Data Governance"
        subtitle="PLATFORM TEMPLATE vs TENANT COPY. Adoption is copy-on-adopt — later template versions never mutate historical tenant snapshots."
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select className="sm:max-w-sm" value={collegeId} onChange={(e) => setCollegeId(e.target.value)}>
          <option value="">Select tenant for adoption…</option>
          {(tenants?.tenants ?? []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.code})
            </option>
          ))}
        </Select>
      </div>
      <PageState loading={loading} error={error} empty={!latest.length}>
        <div className="grid gap-3 lg:grid-cols-2">
          {latest.map((t) => (
            <Surface key={t.key} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-accent-soft text-accent">PLATFORM TEMPLATE</Badge>
                <Badge className="bg-slate-100 text-slate-700">{t.domain}</Badge>
                <Badge className={t.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}>{t.status}</Badge>
              </div>
              <h3 className="mt-2 font-display text-base text-ink">{t.name}</h3>
              <p className="text-xs text-ink-muted">
                {t.key} · v{t.version}
              </p>
              <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-surface-muted p-2 text-[11px] text-ink-secondary">
                {JSON.stringify(t.payload, null, 2)}
              </pre>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" disabled={busyKey === t.key} onClick={() => versionTemplate(t)}>
                  Publish new version
                </Button>
                <Button size="sm" disabled={!collegeId || busyKey === t.key} onClick={() => adopt(t.key)}>
                  Adopt into tenant
                </Button>
              </div>
            </Surface>
          ))}
        </div>
      </PageState>
      {collegeId ? (
        <Panel title="Tenant copies (immutable snapshots)">
          {!adoptions?.adoptions?.length ? (
            <EmptyState title="No adoptions for this tenant" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {adoptions.adoptions.map((a) => (
                <Surface key={a.key} className="p-4">
                  <Badge className="bg-slate-100 text-slate-700">TENANT COPY</Badge>
                  <p className="mt-2 font-medium">{a.key}</p>
                  <p className="text-xs text-ink-muted">
                    Adopted v{a.version} · {formatWhen(a.adoptedAt)}
                  </p>
                  <pre className="mt-2 max-h-28 overflow-auto rounded-lg bg-surface-muted p-2 text-[11px]">{JSON.stringify(a.snapshot, null, 2)}</pre>
                </Surface>
              ))}
            </div>
          )}
        </Panel>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Integrations                                                               */
/* -------------------------------------------------------------------------- */

type Integration = {
  key: string;
  name?: string;
  configured: boolean;
  secretMask: string | null;
  config: Record<string, unknown> | null;
  updatedAt?: string;
  status?: string;
};

export function PlatformIntegrationsPage() {
  useDocumentTitle('Integrations');
  const { data, error, loading, reload } = useResource<{ integrations: Integration[] }>('/api/platform/integrations');
  const { toast } = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [secret, setSecret] = useState('');
  const [host, setHost] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(key: string) {
    setBusy(true);
    try {
      const body: Record<string, unknown> = { config: host ? { host } : undefined };
      if (secret.trim()) body.secret = secret.trim();
      await api(`/api/platform/integrations/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      toast('Integration updated — secret write-only', 'success');
      setEditing(null);
      setSecret('');
      setHost('');
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Integrations"
        subtitle="Secrets are never readable. Leave the secret blank to keep the existing credential."
      />
      <PageState loading={loading} error={error} empty={!data?.integrations?.length}>
        <div className="space-y-3">
          {(data?.integrations ?? []).map((i) => (
            <Surface key={i.key} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-ink">{i.name || i.key}</p>
                  <p className="text-sm text-ink-secondary">
                    {i.configured ? `Configured · mask ${i.secretMask || '••••'}` : 'Not configured'}
                  </p>
                  <p className="text-xs text-ink-muted">Updated {formatWhen(i.updatedAt)}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setEditing(editing === i.key ? null : i.key)}>
                  {editing === i.key ? 'Close' : 'Configure'}
                </Button>
              </div>
              {editing === i.key ? (
                <div className="mt-3 grid max-w-md gap-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-ink-secondary">Host / endpoint (optional)</span>
                    <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.example.com" />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-ink-secondary">Replacement secret (write-only)</span>
                    <Input
                      type="password"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      placeholder="Leave blank to keep existing"
                      autoComplete="new-password"
                    />
                  </label>
                  <Button disabled={busy} onClick={() => save(i.key)}>
                    Save
                  </Button>
                </div>
              ) : null}
            </Surface>
          ))}
        </div>
      </PageState>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Health                                                                     */
/* -------------------------------------------------------------------------- */

export function PlatformHealthPage() {
  useDocumentTitle('Platform Health');
  const { data, error, loading } = useResource<{
    overall: string;
    checks: Array<{ service: string; status: string; latencyMs?: number; message?: string; checkedAt?: string }>;
  }>('/api/platform/health');

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Platform Health" subtitle="Real dependency checks only — database and SMTP when configured." />
      <PageState loading={loading} error={error}>
        <div className="mb-4">
          <HealthBadge status={data?.overall || 'UNKNOWN'} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(data?.checks ?? []).map((c) => (
            <Surface key={c.service} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium capitalize">{c.service}</p>
                <HealthBadge status={c.status} />
              </div>
              <p className="mt-2 text-sm text-ink-secondary">{c.message || 'No additional detail'}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {c.latencyMs != null ? `${c.latencyMs} ms · ` : ''}
                {formatWhen(c.checkedAt)}
              </p>
            </Surface>
          ))}
        </div>
      </PageState>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Audit                                                                      */
/* -------------------------------------------------------------------------- */

export function PlatformAuditPage() {
  useDocumentTitle('Audit');
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const qs = new URLSearchParams({ limit: '100' });
  if (action) qs.set('action', action);
  if (resourceType) qs.set('resourceType', resourceType);
  const { data, error, loading } = useResource<{
    entries: Array<{
      id: number;
      action: string;
      actorName: string | null;
      actorRole: string;
      resourceType: string;
      resourceId: string | null;
      collegeId: number | null;
      success: boolean;
      createdAt: string;
    }>;
  }>(`/api/platform/audit?${qs.toString()}`);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Privileged audit history" subtitle="Searchable trail of Super Admin governance actions." />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input className="sm:max-w-xs" placeholder="Filter action" value={action} onChange={(e) => setAction(e.target.value)} />
        <Input
          className="sm:max-w-xs"
          placeholder="Filter resource type"
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
        />
      </div>
      <PageState loading={loading} error={error} empty={!data?.entries?.length} emptyTitle="No audit entries">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-[11px] uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Actor</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Resource</th>
                <th className="px-3 py-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {(data?.entries ?? []).map((e) => (
                <tr key={e.id} className="border-b border-border/70">
                  <td className="px-3 py-2 text-xs text-ink-muted">{formatWhen(e.createdAt)}</td>
                  <td className="px-3 py-2">
                    {e.actorName || 'system'}
                    <span className="text-ink-muted"> · {e.actorRole}</span>
                  </td>
                  <td className="px-3 py-2">{e.action}</td>
                  <td className="px-3 py-2">
                    {e.resourceType}
                    {e.resourceId ? ` #${e.resourceId}` : ''}
                    {e.collegeId != null ? ` · tenant ${e.collegeId}` : ''}
                  </td>
                  <td className="px-3 py-2">{e.success ? 'OK' : 'Failed'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 md:hidden">
          {(data?.entries ?? []).map((e) => (
            <Surface key={e.id} className="p-3 text-sm">
              <p className="font-medium">{e.action}</p>
              <p className="text-xs text-ink-muted">
                {e.actorName} · {formatWhen(e.createdAt)}
              </p>
              <p className="text-xs">
                {e.resourceType} {e.success ? 'OK' : 'Failed'}
              </p>
            </Surface>
          ))}
        </div>
      </PageState>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Announcements                                                              */
/* -------------------------------------------------------------------------- */

type Announcement = {
  id: number;
  title: string;
  message: string;
  audience: string;
  severity: string;
  status: string;
  publishAt: string | null;
  expiryAt: string | null;
  targets: number[];
  createdAt: string;
};

export function PlatformAnnouncementsPage() {
  useDocumentTitle('Announcements');
  const { data, error, loading, reload } = useResource<{ announcements: Announcement[] }>('/api/platform/announcements');
  const { data: tenants } = useResource<{ tenants: Array<{ id: number; name: string }> }>('/api/platform/tenants');
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: '',
    message: '',
    audience: 'ALL' as 'ALL' | 'SELECTED',
    severity: 'INFO',
    collegeIds: [] as number[],
  });
  const [expireId, setExpireId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/platform/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          message: form.message,
          audience: form.audience,
          severity: form.severity,
          collegeIds: form.audience === 'SELECTED' ? form.collegeIds : undefined,
        }),
      });
      toast('Announcement drafted', 'success');
      setForm({ title: '', message: '', audience: 'ALL', severity: 'INFO', collegeIds: [] });
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function publish(id: number) {
    try {
      await api(`/api/platform/announcements/${id}/publish`, { method: 'POST' });
      toast('Published', 'success');
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function expire() {
    if (expireId == null) return;
    setBusy(true);
    try {
      await api(`/api/platform/announcements/${expireId}/expire`, { method: 'POST' });
      toast('Expired', 'success');
      setExpireId(null);
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  function toggleCollege(id: number) {
    setForm((f) => ({
      ...f,
      collegeIds: f.collegeIds.includes(id) ? f.collegeIds.filter((x) => x !== id) : [...f.collegeIds, id],
    }));
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Platform Announcements" subtitle="Target all tenants or an explicit selected set. Untargeted colleges never see SELECTED notices." />
      <Surface className="p-5">
        <form className="grid max-w-xl gap-3" onSubmit={create}>
          <label className="block text-sm">
            <span className="mb-1 block text-ink-secondary">Title</span>
            <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink-secondary">Message</span>
            <Textarea required rows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-ink-secondary">Audience</span>
              <Select value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value as 'ALL' | 'SELECTED' }))}>
                <option value="ALL">All tenants</option>
                <option value="SELECTED">Selected tenants</option>
              </Select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-ink-secondary">Severity</span>
              <Select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}>
                {['INFO', 'WARNING', 'CRITICAL'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          {form.audience === 'SELECTED' ? (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
              {(tenants?.tenants ?? []).map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.collegeIds.includes(t.id)} onChange={() => toggleCollege(t.id)} />
                  {t.name}
                </label>
              ))}
            </div>
          ) : null}
          <Button type="submit" disabled={busy}>
            Create draft
          </Button>
        </form>
      </Surface>
      <PageState loading={loading} error={error} empty={!data?.announcements?.length} emptyTitle="No announcements">
        <div className="space-y-3">
          {(data?.announcements ?? []).map((a) => (
            <Surface key={a.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-slate-100 text-slate-700">{a.status}</Badge>
                    <Badge className="bg-slate-100 text-slate-700">{a.severity}</Badge>
                    <Badge className="bg-accent-soft text-accent">{a.audience}</Badge>
                  </div>
                  <h3 className="mt-2 font-medium text-ink">{a.title}</h3>
                  <p className="mt-1 text-sm text-ink-secondary whitespace-pre-wrap">{a.message}</p>
                  <p className="mt-2 text-xs text-ink-muted">
                    Targets: {a.audience === 'ALL' ? 'all tenants' : a.targets.join(', ') || 'none'} · {formatWhen(a.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {a.status === 'DRAFT' ? (
                    <Button size="sm" onClick={() => publish(a.id)}>
                      Publish
                    </Button>
                  ) : null}
                  {a.status === 'PUBLISHED' ? (
                    <Button size="sm" variant="secondary" onClick={() => setExpireId(a.id)}>
                      Expire
                    </Button>
                  ) : null}
                </div>
              </div>
            </Surface>
          ))}
        </div>
      </PageState>
      <ConfirmModal
        open={expireId != null}
        title="Expire announcement?"
        description="Expired announcements leave tenant feeds immediately."
        confirmLabel="Expire"
        danger
        loading={busy}
        onClose={() => setExpireId(null)}
        onConfirm={expire}
      />
    </div>
  );
}
