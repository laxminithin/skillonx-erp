import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  HealthBadge,
  KpiGrid,
  PageState,
  Panel,
  StatusBadge,
  formatWhen,
  useResource,
} from './platformUi';

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

type Dashboard = {
  tenants: { total: number; active: number; onboarding: number; suspended: number; archived: number; draft: number };
  activeUsers: number;
  activeStudents: number;
  modulesEnabled: number;
  health: string;
  tenantsWithConfigIssues: number;
  recentChanges?: Array<{
    id: number;
    action: string;
    actorName: string | null;
    resourceType: string;
    createdAt: string;
    success: boolean;
  }>;
};

export function PlatformDashboardPage() {
  useDocumentTitle('Platform Dashboard');
  const { data, error, loading } = useResource<Dashboard>('/api/platform/dashboard');
  const kpis = [
    { key: 'tenants', label: 'Tenants', value: data?.tenants.total ?? '—', href: '/platform/tenants' },
    { key: 'active', label: 'Active', value: data?.tenants.active ?? '—', href: '/platform/tenants?status=ACTIVE' },
    { key: 'onboarding', label: 'Onboarding', value: data?.tenants.onboarding ?? '—', href: '/platform/tenants?status=ONBOARDING' },
    { key: 'suspended', label: 'Suspended', value: data?.tenants.suspended ?? '—', href: '/platform/tenants?status=SUSPENDED' },
    { key: 'users', label: 'Active users', value: data?.activeUsers ?? '—', href: '/platform/users' },
    { key: 'modules', label: 'Module footprint', value: data?.modulesEnabled ?? '—', href: '/platform/modules' },
    { key: 'issues', label: 'Config issues', value: data?.tenantsWithConfigIssues ?? '—' },
    { key: 'health', label: 'Platform health', value: data?.health ?? '—', href: '/platform/health' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Platform Dashboard"
        subtitle="Govern tenants, identity, modules and configuration across the SkillonX platform."
        actions={
          <Link
            to="/platform/tenants/new"
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-accent px-3.5 text-sm font-medium text-white shadow-xs hover:bg-accent-hover"
          >
            New tenant
          </Link>
        }
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <KpiGrid items={kpis} loading={loading} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Health" actions={<Link className="text-sm text-primary" to="/platform/health">Open →</Link>}>
          {data ? <HealthBadge status={data.health} /> : <p className="text-sm text-ink-muted">Loading…</p>}
          <p className="mt-2 text-sm text-ink-secondary">Live checks for database and mail only — no fabricated services.</p>
        </Panel>
        <Panel title="Recent privileged changes" actions={<Link className="text-sm text-primary" to="/platform/audit">Audit →</Link>}>
          {!data?.recentChanges?.length ? (
            <EmptyState title="No recent changes" />
          ) : (
            <ul className="divide-y divide-border">
              {data.recentChanges.slice(0, 8).map((e) => (
                <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
                  <span>
                    <span className="font-medium text-ink">{e.action}</span>
                    <span className="text-ink-muted"> · {e.actorName || 'system'}</span>
                  </span>
                  <span className="text-xs text-ink-muted">{formatWhen(e.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tenants list                                                               */
/* -------------------------------------------------------------------------- */

type TenantRow = {
  id: number;
  name: string;
  code: string;
  status: string;
  timezone: string;
  modulesEnabled: number;
  hasActiveAdmin: boolean;
  facultyCount: number;
  studentCount: number;
};

export function PlatformTenantsPage() {
  useDocumentTitle('Tenants');
  const { data, error, loading } = useResource<{ tenants: TenantRow[] }>('/api/platform/tenants');
  const [q, setQ] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '');
  const [status, setStatus] = useState(() => new URLSearchParams(window.location.search).get('status') ?? '');
  const filtered = useMemo(() => {
    const rows = data?.tenants ?? [];
    return rows.filter((t) => {
      if (status && t.status !== status) return false;
      if (!q.trim()) return true;
      const s = q.trim().toLowerCase();
      return t.name.toLowerCase().includes(s) || t.code.toLowerCase().includes(s);
    });
  }, [data, q, status]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Tenants / Colleges"
        subtitle="Search institutions, review lifecycle state, and open a tenant workspace."
        actions={
          <Link
            to="/platform/tenants/new"
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-accent px-3.5 text-sm font-medium text-white shadow-xs hover:bg-accent-hover"
          >
            New tenant
          </Link>
        }
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input className="sm:max-w-xs" placeholder="Search name or code" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select className="sm:max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['ONBOARDING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED', 'DRAFT'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
      <PageState loading={loading} error={error} empty={!filtered.length} emptyTitle="No tenants match">
        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-[11px] uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Institution</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Modules</th>
                <th className="px-3 py-2 font-medium">Primary admin</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border/70">
                  <td className="px-3 py-3">
                    <p className="font-medium text-ink">{t.name}</p>
                    <p className="text-xs text-ink-muted">{t.code}</p>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-3 py-3 tabular-nums">{t.modulesEnabled}</td>
                  <td className="px-3 py-3">{t.hasActiveAdmin ? 'Configured' : 'Missing'}</td>
                  <td className="px-3 py-3 text-right">
                    <Link className="text-primary" to={`/platform/tenants/${t.id}`}>
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {filtered.map((t) => (
            <Link key={t.id} to={`/platform/tenants/${t.id}`} className="block">
              <Surface className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{t.name}</p>
                    <p className="text-xs text-ink-muted">{t.code}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <p className="mt-2 text-xs text-ink-secondary">
                  Modules {t.modulesEnabled} · Admin {t.hasActiveAdmin ? 'yes' : 'missing'}
                </p>
              </Surface>
            </Link>
          ))}
        </div>
      </PageState>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Create tenant                                                              */
/* -------------------------------------------------------------------------- */

export function PlatformTenantCreatePage() {
  useDocumentTitle('New Tenant');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    timezone: 'Asia/Kolkata',
    domain: '',
    address: '',
    adminName: '',
    adminEmail: '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const out = await api<{ tenant: { id: number } }>('/api/platform/tenants', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          domain: form.domain || null,
          address: form.address || null,
        }),
      });
      toast('Tenant created with administrator and default modules', 'success');
      navigate(`/platform/tenants/${out.tenant.id}`);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Create tenant"
        subtitle="Transactional provisioning of college, primary admin, and default modules."
        actions={
          <Link className="text-sm text-primary" to="/platform/tenants">
            ← Back
          </Link>
        }
      />
      <Surface className="mx-auto max-w-xl p-5">
        <form className="grid gap-3" onSubmit={submit}>
          {(
            [
              ['name', 'Institution name', 'text'],
              ['code', 'Code (unique)', 'text'],
              ['timezone', 'Timezone', 'text'],
              ['domain', 'Domain (optional)', 'text'],
              ['address', 'Address (optional)', 'text'],
              ['adminName', 'Primary admin name', 'text'],
              ['adminEmail', 'Primary admin email', 'email'],
            ] as const
          ).map(([key, label, type]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block text-ink-secondary">{label}</span>
              <Input
                type={type}
                required={key !== 'domain' && key !== 'address'}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </label>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating…' : 'Create tenant'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/platform/tenants')}>
              Cancel
            </Button>
          </div>
        </form>
      </Surface>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modules registry                                                           */
/* -------------------------------------------------------------------------- */

type ModuleDef = { key: string; name: string; category: string; description: string; requires: string[]; core: boolean };

export function PlatformModulesPage() {
  useDocumentTitle('Modules');
  const { data, error, loading } = useResource<{ modules: ModuleDef[] }>('/api/platform/modules');
  const modules = data?.modules ?? [];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Module registry"
        subtitle="Canonical platform modules and dependency graph. Enable or disable per tenant from the tenant workspace."
      />
      <PageState loading={loading} error={error} empty={!modules.length}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((m) => {
            const dependents = modules.filter((x) => x.requires.includes(m.key)).map((x) => x.name);
            return (
              <Surface key={m.key} className="flex flex-col p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base text-ink">{m.name}</h3>
                  {m.core ? <Badge className="bg-accent-soft text-accent">Core</Badge> : null}
                  <Badge className="bg-slate-100 text-slate-700">{m.category}</Badge>
                </div>
                <p className="mt-2 text-sm text-ink-secondary">{m.description}</p>
                <p className="mt-3 text-xs text-ink-muted">
                  Requires: {m.requires.length ? m.requires.join(', ') : '—'}
                </p>
                <p className="text-xs text-ink-muted">Dependents: {dependents.length ? dependents.join(', ') : '—'}</p>
              </Surface>
            );
          })}
        </div>
      </PageState>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Feature flags                                                              */
/* -------------------------------------------------------------------------- */

type Flag = {
  key: string;
  description: string;
  enabled: boolean;
  rollout: string;
  overrides: Array<{ collegeId: number; enabled: boolean }>;
};

export function PlatformFeatureFlagsPage() {
  useDocumentTitle('Feature Flags');
  const { data, error, loading, reload } = useResource<{ flags: Flag[] }>('/api/platform/feature-flags');
  const { toast } = useToast();
  const [pending, setPending] = useState<Flag | null>(null);
  const [busy, setBusy] = useState(false);

  async function toggle(flag: Flag) {
    setBusy(true);
    try {
      await api(`/api/platform/feature-flags/${encodeURIComponent(flag.key)}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled: !flag.enabled }),
      });
      toast('Feature flag updated', 'success');
      setPending(null);
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
        title="Feature Flags"
        subtitle="Global and tenant overrides for product surfaces. Flags never grant capabilities or bypass RBAC."
      />
      <PageState loading={loading} error={error} empty={!data?.flags?.length}>
        <div className="space-y-3">
          {(data?.flags ?? []).map((f) => (
            <Surface key={f.key} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-ink">{f.key}</p>
                  <p className="text-sm text-ink-secondary">{f.description}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Rollout {f.rollout} · Overrides {f.overrides.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={f.enabled ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}>
                    {f.enabled ? 'ON' : 'OFF'}
                  </Badge>
                  <Button variant="secondary" size="sm" onClick={() => setPending(f)}>
                    {f.enabled ? 'Disable globally' : 'Enable globally'}
                  </Button>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      </PageState>
      <ConfirmModal
        open={!!pending}
        title="Change global feature flag?"
        description={
          pending
            ? `This will ${pending.enabled ? 'disable' : 'enable'} “${pending.key}” for all tenants without an override. Feature flags do not grant permissions.`
            : ''
        }
        confirmLabel={pending?.enabled ? 'Disable' : 'Enable'}
        danger={pending?.enabled}
        loading={busy}
        onClose={() => setPending(null)}
        onConfirm={() => pending && toggle(pending)}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  collegeId: number | null;
  collegeName?: string | null;
  isActive: boolean;
};

export function PlatformUsersPage() {
  useDocumentTitle('Users');
  const [q, setQ] = useState('');
  const path = `/api/platform/users?limit=100${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}`;
  const { data, error, loading, reload } = useResource<{ users: UserRow[] }>(path);
  const { toast } = useToast();
  const [roleEdit, setRoleEdit] = useState<{ id: number; role: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function setActive(id: number, isActive: boolean) {
    try {
      await api(`/api/platform/users/${id}/active`, { method: 'POST', body: JSON.stringify({ isActive }) });
      toast(isActive ? 'User activated' : 'User disabled', 'success');
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function saveRole() {
    if (!roleEdit) return;
    setBusy(true);
    try {
      await api(`/api/platform/users/${roleEdit.id}/role`, {
        method: 'POST',
        body: JSON.stringify({ role: roleEdit.role }),
      });
      toast('Role updated', 'success');
      setRoleEdit(null);
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Identity" subtitle="Search platform and tenant users. Secrets are never shown." />
      <Input className="max-w-sm" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
      <PageState loading={loading} error={error} empty={!data?.users?.length} emptyTitle="No users found">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-[11px] uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Tenant</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {(data?.users ?? []).map((u) => (
                <tr key={u.id} className="border-b border-border/70">
                  <td className="px-3 py-3">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-ink-muted">{u.email}</p>
                  </td>
                  <td className="px-3 py-3">{u.role}</td>
                  <td className="px-3 py-3">{u.collegeName || (u.collegeId ? `#${u.collegeId}` : 'Platform')}</td>
                  <td className="px-3 py-3">{u.isActive ? 'Active' : 'Disabled'}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setRoleEdit({ id: u.id, role: u.role })}>
                        Role
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setActive(u.id, !u.isActive)}>
                        {u.isActive ? 'Disable' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 md:hidden">
          {(data?.users ?? []).map((u) => (
            <Surface key={u.id} className="space-y-2 p-4">
              <p className="font-medium">{u.name}</p>
              <p className="text-xs text-ink-muted">{u.email}</p>
              <p className="text-sm">
                {u.role} · {u.isActive ? 'Active' : 'Disabled'}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setRoleEdit({ id: u.id, role: u.role })}>
                  Role
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setActive(u.id, !u.isActive)}>
                  {u.isActive ? 'Disable' : 'Activate'}
                </Button>
              </div>
            </Surface>
          ))}
        </div>
      </PageState>
      <ConfirmModal
        open={!!roleEdit}
        title="Change user role"
        description="Backend remains authoritative for last-Super-Admin and escalation rules."
        confirmLabel="Save role"
        loading={busy}
        onClose={() => setRoleEdit(null)}
        onConfirm={saveRole}
      />
      {roleEdit ? (
        <div className="fixed bottom-4 left-1/2 z-40 w-[min(92vw,24rem)] -translate-x-1/2 rounded-xl border border-border bg-surface p-3 shadow-lg">
          <label className="block text-sm">
            <span className="mb-1 block text-ink-secondary">New role</span>
            <Select value={roleEdit.role} onChange={(e) => setRoleEdit({ ...roleEdit, role: e.target.value })}>
              {['SUPER_ADMIN', 'COLLEGE_ADMIN', 'ACCOUNTANT', 'COE', 'PRINCIPAL', 'HOD', 'FACULTY', 'MANAGEMENT', 'HR_EXECUTIVE'].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </label>
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Roles & capabilities                                                       */
/* -------------------------------------------------------------------------- */

export function PlatformRolesPage() {
  useDocumentTitle('Roles & Capabilities');
  const { data, error, loading, reload } = useResource<{
    capabilities: Array<{ key: string; description: string; domain: string }>;
    roles: Record<string, string[]>;
  }>('/api/platform/capabilities');
  const { toast } = useToast();
  const roles = Object.keys(data?.roles ?? {}).sort();
  const [expanded, setExpanded] = useState<string | null>('SUPER_ADMIN');

  async function revoke(role: string, capability: string) {
    try {
      await api('/api/platform/rbac/revoke', { method: 'POST', body: JSON.stringify({ role, capability }) });
      toast('Capability revoked', 'success');
      reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Roles & Capabilities"
        subtitle="Platform capabilities mapped onto existing roles. SUPER_ADMIN is protected."
      />
      <PageState loading={loading} error={error}>
        <div className="space-y-3">
          {roles.map((role) => {
            const caps = data?.roles[role] ?? [];
            const open = expanded === role;
            return (
              <Surface key={role} className="p-4">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 text-left"
                  onClick={() => setExpanded(open ? null : role)}
                >
                  <div>
                    <p className="font-medium text-ink">{role}</p>
                    <p className="text-xs text-ink-muted">{caps.length} capabilities</p>
                  </div>
                  {role === 'SUPER_ADMIN' ? <Badge className="bg-accent-soft text-accent">Protected</Badge> : null}
                </button>
                {open ? (
                  <ul className="mt-3 space-y-2 border-t border-border pt-3">
                    {caps.map((c) => (
                      <li key={c} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span>
                          <code className="text-xs">{c}</code>
                          <span className="ml-2 text-ink-muted">
                            {data?.capabilities.find((x) => x.key === c)?.description}
                          </span>
                        </span>
                        {role !== 'SUPER_ADMIN' ? (
                          <Button size="sm" variant="secondary" onClick={() => revoke(role, c)}>
                            Revoke
                          </Button>
                        ) : null}
                      </li>
                    ))}
                    {!caps.length ? <EmptyState title="No mapped capabilities" /> : null}
                  </ul>
                ) : null}
              </Surface>
            );
          })}
        </div>
        <Panel title="Capability catalogue">
          <div className="grid gap-2 sm:grid-cols-2">
            {(data?.capabilities ?? []).map((c) => (
              <div key={c.key} className="rounded-lg border border-border/70 px-3 py-2 text-sm">
                <p className="font-medium">{c.key}</p>
                <p className="text-xs text-ink-muted">{c.description}</p>
              </div>
            ))}
          </div>
        </Panel>
      </PageState>
    </div>
  );
}
