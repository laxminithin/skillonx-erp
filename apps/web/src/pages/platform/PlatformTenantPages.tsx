import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Surface,
  useToast,
} from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import {
  ConfirmModal,
  PageState,
  Panel,
  StatusBadge,
  formatWhen,
  useResource,
} from './platformUi';

type TenantDetail = {
  id: number;
  name: string;
  code: string;
  status: string;
  timezone: string;
  domain: string | null;
  address: string | null;
  modules: Array<{ key: string; name: string; enabled: boolean; core: boolean; requires: string[] }>;
  admins: Array<{ id: number; name: string; email: string; isActive: boolean }>;
};

type ConfigIssue = { severity: string; code: string; message: string; remediation: string };

const TABS = ['Overview', 'Onboarding', 'Modules', 'Settings', 'Branding', 'Administrators', 'Diagnostics', 'Audit'] as const;

export function PlatformTenantDetailPage() {
  const { id } = useParams();
  const tenantId = Number(id);
  useDocumentTitle('Tenant');
  const { toast } = useToast();
  const { data, error, loading, reload } = useResource<TenantDetail>(
    Number.isFinite(tenantId) ? `/api/platform/tenants/${tenantId}` : null,
  );
  const { data: issuesData, reload: reloadIssues } = useResource<{ issues: ConfigIssue[] }>(
    Number.isFinite(tenantId) ? `/api/platform/tenants/${tenantId}/config-validation` : null,
  );
  const { data: diag, reload: reloadDiag } = useResource<{
    configIssues: ConfigIssue[];
    hasActiveAdmin: boolean;
    recentAudit: Array<{ id: number; action: string; actorName: string | null; createdAt: string }>;
  }>(Number.isFinite(tenantId) ? `/api/platform/tenants/${tenantId}/diagnostics` : null);
  const { data: settings, reload: reloadSettings } = useResource<{
    timezone: string;
    locale: string;
    dateFormat: string;
    employeeIdPrefix: string | null;
    receiptPrefix: string | null;
    notifyEmailEnabled: boolean;
    notifySmsEnabled: boolean;
  }>(Number.isFinite(tenantId) ? `/api/platform/tenants/${tenantId}/settings` : null);
  const { data: branding, reload: reloadBranding } = useResource<{
    displayName: string;
    shortName: string | null;
    logoUrl: string | null;
    reportHeader: string | null;
    portalTitle: string | null;
    accentColor: string | null;
  }>(Number.isFinite(tenantId) ? `/api/platform/tenants/${tenantId}/branding` : null);
  const { data: auditData } = useResource<{ entries: Array<{ id: number; action: string; actorName: string | null; createdAt: string; success: boolean }> }>(
    Number.isFinite(tenantId) ? `/api/platform/audit?collegeId=${tenantId}&limit=40` : null,
  );

  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview');
  const [statusTarget, setStatusTarget] = useState<string | null>(null);
  const [moduleTarget, setModuleTarget] = useState<{ key: string; enabled: boolean; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Record<string, string | boolean>>({});
  const [brandForm, setBrandForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!settings) return;
    setSettingsForm({
      timezone: settings.timezone,
      locale: settings.locale,
      dateFormat: settings.dateFormat,
      employeeIdPrefix: settings.employeeIdPrefix ?? '',
      receiptPrefix: settings.receiptPrefix ?? '',
      notifyEmailEnabled: settings.notifyEmailEnabled,
      notifySmsEnabled: settings.notifySmsEnabled,
    });
  }, [settings]);

  useEffect(() => {
    if (!branding) return;
    setBrandForm({
      displayName: branding.displayName ?? '',
      shortName: branding.shortName ?? '',
      logoUrl: branding.logoUrl ?? '',
      reportHeader: branding.reportHeader ?? '',
      portalTitle: branding.portalTitle ?? '',
      accentColor: branding.accentColor ?? '',
    });
  }, [branding]);

  async function applyStatus() {
    if (!statusTarget) return;
    setBusy(true);
    try {
      await api(`/api/platform/tenants/${tenantId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: statusTarget }),
      });
      toast(`Tenant set to ${statusTarget}`, 'success');
      setStatusTarget(null);
      reload();
      reloadDiag();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function applyModule() {
    if (!moduleTarget) return;
    setBusy(true);
    try {
      await api(`/api/platform/tenants/${tenantId}/modules`, {
        method: 'POST',
        body: JSON.stringify({ module: moduleTarget.key, enabled: moduleTarget.enabled }),
      });
      toast(moduleTarget.enabled ? 'Module enabled' : 'Module disabled — data preserved', 'success');
      setModuleTarget(null);
      reload();
      reloadIssues();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api(`/api/platform/tenants/${tenantId}/settings`, {
        method: 'PUT',
        body: JSON.stringify({
          timezone: settingsForm.timezone,
          locale: settingsForm.locale,
          dateFormat: settingsForm.dateFormat,
          employeeIdPrefix: String(settingsForm.employeeIdPrefix || '') || null,
          receiptPrefix: String(settingsForm.receiptPrefix || '') || null,
          notifyEmailEnabled: Boolean(settingsForm.notifyEmailEnabled),
          notifySmsEnabled: Boolean(settingsForm.notifySmsEnabled),
        }),
      });
      toast('Settings saved', 'success');
      reloadSettings();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function saveBranding(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api(`/api/platform/tenants/${tenantId}/branding`, {
        method: 'PUT',
        body: JSON.stringify({
          displayName: brandForm.displayName || null,
          shortName: brandForm.shortName || null,
          logoUrl: brandForm.logoUrl || null,
          reportHeader: brandForm.reportHeader || null,
          portalTitle: brandForm.portalTitle || null,
          accentColor: brandForm.accentColor || null,
        }),
      });
      toast('Branding saved', 'success');
      reloadBranding();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  const nextActions =
    data?.status === 'ONBOARDING' || data?.status === 'DRAFT'
      ? [['ACTIVE', 'Activate']]
      : data?.status === 'ACTIVE'
        ? [['SUSPENDED', 'Suspend']]
        : data?.status === 'SUSPENDED'
          ? [['ACTIVE', 'Reactivate']]
          : data?.status === 'ARCHIVED'
            ? [['ACTIVE', 'Restore']]
            : [];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={data?.name || 'Tenant'}
        subtitle={data ? `${data.code} · ${data.timezone}` : 'Tenant workspace'}
        breadcrumb={<Link to="/platform/tenants">← Tenants</Link>}
        actions={
          <div className="flex flex-wrap gap-2">
            {nextActions.map(([status, label]) => (
              <Button key={status} variant={status === 'SUSPENDED' ? 'danger' : 'secondary'} onClick={() => setStatusTarget(status)}>
                {label}
              </Button>
            ))}
          </div>
        }
      />
      <PageState loading={loading} error={error} empty={!data}>
        {data ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={data.status} />
              <span className="text-sm text-ink-secondary">{data.domain || 'No custom domain'}</span>
            </div>
            <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${tab === t ? 'bg-accent text-white' : 'bg-surface-muted text-ink-secondary'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === 'Overview' ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <Panel title="Institution">
                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-ink-muted">Code</dt>
                      <dd className="font-medium">{data.code}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">Status</dt>
                      <dd>
                        <StatusBadge status={data.status} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">Address</dt>
                      <dd>{data.address || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">Enabled modules</dt>
                      <dd>{data.modules.filter((m) => m.enabled).length}</dd>
                    </div>
                  </dl>
                </Panel>
                <Panel title="Quick links">
                  <div className="flex flex-col gap-2 text-sm">
                    <button type="button" className="text-left text-primary" onClick={() => setTab('Onboarding')}>
                      Onboarding checklist →
                    </button>
                    <button type="button" className="text-left text-primary" onClick={() => setTab('Modules')}>
                      Module governance →
                    </button>
                    <button type="button" className="text-left text-primary" onClick={() => setTab('Diagnostics')}>
                      Diagnostics →
                    </button>
                    <Link className="text-primary" to="/platform/integrations">
                      Integrations →
                    </Link>
                  </div>
                </Panel>
              </div>
            ) : null}

            {tab === 'Onboarding' ? (
              <Panel title="Configuration checklist">
                <p className="mb-3 text-sm text-ink-secondary">Server-side validator results — not reimplemented in the browser.</p>
                {!(issuesData?.issues?.length) ? (
                  <EmptyState title="No outstanding issues" />
                ) : (
                  <ul className="space-y-3">
                    {issuesData!.issues.map((i) => (
                      <li key={i.code} className="rounded-lg border border-border p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={
                              i.severity === 'ERROR'
                                ? 'bg-red-50 text-red-800'
                                : i.severity === 'WARNING'
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                            }
                          >
                            {i.severity}
                          </Badge>
                          <span className="font-medium">{i.message}</span>
                        </div>
                        <p className="mt-1 text-sm text-ink-secondary">{i.remediation}</p>
                        <p className="mt-1 text-xs text-ink-muted">{i.code}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            ) : null}

            {tab === 'Modules' ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.modules.map((m) => (
                  <Surface key={m.key} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-ink-muted">{m.key}</p>
                        {m.requires.length ? <p className="mt-1 text-xs text-ink-secondary">Requires {m.requires.join(', ')}</p> : null}
                      </div>
                      <Badge className={m.enabled ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}>
                        {m.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    {!m.core ? (
                      <Button
                        className="mt-3"
                        size="sm"
                        variant="secondary"
                        onClick={() => setModuleTarget({ key: m.key, enabled: !m.enabled, name: m.name })}
                      >
                        {m.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    ) : (
                      <p className="mt-3 text-xs text-ink-muted">Core module — cannot be disabled.</p>
                    )}
                  </Surface>
                ))}
              </div>
            ) : null}

            {tab === 'Settings' ? (
              <Surface className="max-w-xl p-5">
                {!settings ? (
                  <p className="text-sm text-ink-muted">Loading settings…</p>
                ) : (
                  <form className="grid gap-3" onSubmit={saveSettings}>
                    {(
                      [
                        ['timezone', 'Timezone'],
                        ['locale', 'Locale'],
                        ['dateFormat', 'Date format'],
                        ['employeeIdPrefix', 'Employee ID prefix'],
                        ['receiptPrefix', 'Receipt prefix'],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="block text-sm">
                        <span className="mb-1 block text-ink-secondary">{label}</span>
                        {key === 'dateFormat' ? (
                          <Select
                            value={String(settingsForm.dateFormat ?? '')}
                            onChange={(e) => setSettingsForm((f) => ({ ...f, dateFormat: e.target.value }))}
                          >
                            {['DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY-MM-DD'].map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Input
                            value={String(settingsForm[key] ?? '')}
                            onChange={(e) => setSettingsForm((f) => ({ ...f, [key]: e.target.value }))}
                          />
                        )}
                      </label>
                    ))}
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(settingsForm.notifyEmailEnabled)}
                        onChange={(e) => setSettingsForm((f) => ({ ...f, notifyEmailEnabled: e.target.checked }))}
                      />
                      Email notifications enabled
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(settingsForm.notifySmsEnabled)}
                        onChange={(e) => setSettingsForm((f) => ({ ...f, notifySmsEnabled: e.target.checked }))}
                      />
                      SMS notifications enabled
                    </label>
                    <Button type="submit">Save settings</Button>
                  </form>
                )}
              </Surface>
            ) : null}

            {tab === 'Branding' ? (
              <Surface className="max-w-xl p-5">
                {!branding ? (
                  <p className="text-sm text-ink-muted">Loading branding…</p>
                ) : (
                  <>
                    <p className="mb-3 text-sm text-ink-secondary">Plain text and https logo URL only — no HTML or CSS injection.</p>
                    <form className="grid gap-3" onSubmit={saveBranding}>
                      {(
                        [
                          ['displayName', 'Display name'],
                          ['shortName', 'Short name'],
                          ['logoUrl', 'Logo URL'],
                          ['reportHeader', 'Report header'],
                          ['portalTitle', 'Portal title'],
                          ['accentColor', 'Accent colour (#RRGGBB)'],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="block text-sm">
                          <span className="mb-1 block text-ink-secondary">{label}</span>
                          <Input value={brandForm[key] ?? ''} onChange={(e) => setBrandForm((f) => ({ ...f, [key]: e.target.value }))} />
                        </label>
                      ))}
                      {brandForm.accentColor ? (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="h-6 w-6 rounded border border-border" style={{ background: brandForm.accentColor }} />
                          Preview
                        </div>
                      ) : null}
                      <Button type="submit">Save branding</Button>
                    </form>
                  </>
                )}
              </Surface>
            ) : null}

            {tab === 'Administrators' ? (
              <Panel title="College administrators">
                {!data.admins.length ? (
                  <EmptyState title="No administrators" />
                ) : (
                  <ul className="divide-y divide-border">
                    {data.admins.map((a) => (
                      <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                        <span>
                          <span className="font-medium">{a.name}</span>
                          <span className="text-ink-muted"> · {a.email}</span>
                        </span>
                        <Badge className={a.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}>
                          {a.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            ) : null}

            {tab === 'Diagnostics' ? (
              <div className="space-y-4">
                <Panel title="Support diagnostics">
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-ink-muted">Lifecycle</dt>
                      <dd>
                        <StatusBadge status={data.status} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">Primary admin</dt>
                      <dd>{diag?.hasActiveAdmin ? 'Present' : 'Missing'}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">Enabled modules</dt>
                      <dd>{data.modules.filter((m) => m.enabled).map((m) => m.key).join(', ') || '—'}</dd>
                    </div>
                  </dl>
                </Panel>
                <Panel title="Config issues">
                  {(diag?.configIssues ?? issuesData?.issues ?? []).length ? (
                    <ul className="space-y-2 text-sm">
                      {(diag?.configIssues ?? issuesData?.issues ?? []).map((i) => (
                        <li key={i.code}>
                          <strong>{i.severity}</strong> — {i.message} ({i.remediation})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState title="No issues" />
                  )}
                </Panel>
              </div>
            ) : null}

            {tab === 'Audit' ? (
              <Panel title="Tenant audit">
                {!auditData?.entries?.length ? (
                  <EmptyState title="No audit entries" />
                ) : (
                  <ul className="divide-y divide-border text-sm">
                    {auditData.entries.map((e) => (
                      <li key={e.id} className="flex flex-wrap justify-between gap-2 py-2">
                        <span>
                          {e.action} · {e.actorName || 'system'}
                        </span>
                        <span className="text-xs text-ink-muted">{formatWhen(e.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            ) : null}
          </>
        ) : null}
      </PageState>

      <ConfirmModal
        open={!!statusTarget}
        title={`${statusTarget} tenant?`}
        description="Lifecycle changes are audited. Suspension blocks tenant-member login but never deletes records."
        confirmLabel="Confirm"
        danger={statusTarget === 'SUSPENDED'}
        loading={busy}
        onClose={() => setStatusTarget(null)}
        onConfirm={applyStatus}
      />
      <ConfirmModal
        open={!!moduleTarget}
        title={moduleTarget?.enabled ? `Enable ${moduleTarget?.name}?` : `Disable ${moduleTarget?.name}?`}
        description={
          moduleTarget?.enabled
            ? 'Dependencies must already be enabled.'
            : 'Disabling preserves all module data. Dependents must be disabled first.'
        }
        confirmLabel="Confirm"
        danger={!moduleTarget?.enabled}
        loading={busy}
        onClose={() => setModuleTarget(null)}
        onConfirm={applyModule}
      />
    </div>
  );
}
