import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { Check, ShieldCheck, X } from 'lucide-react';
import { useAuth, type User } from '../auth/AuthContext';
import { api } from '../lib/api';
import {
  Avatar,
  Badge,
  Button,
  Field,
  Input,
  PageHeader,
  PasswordInput,
  Surface,
  Tabs,
  useToast,
} from '../components/ui';
import { PASSWORD_RULES, isPasswordValid } from '../lib/password';
import { formatInTimeZone } from '../lib/timezone';
import { cn } from '../lib/utils';

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'preferences', label: 'Preferences' },
];

export function ProfilePage() {
  useDocumentTitle('My Profile');
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab')! : 'profile';

  if (!user) return null;

  return (
    <div className="animate-fade-in">
      <PageHeader title="My Profile" subtitle="Manage your account details and security." />

      <div className="mb-6 flex items-center gap-4">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-ink">{user.name}</p>
          <p className="truncate text-sm text-ink-muted">
            {user.roleLabel || user.role}
            {user.departmentName ? ` · ${user.departmentName}` : ''}
          </p>
        </div>
      </div>

      <Tabs value={tab} onChange={(id) => setParams(id === 'profile' ? {} : { tab: id })} tabs={TABS} />

      <div className="mt-5 max-w-3xl">
        {tab === 'profile' ? <ProfileTab /> : null}
        {tab === 'security' ? <SecurityTab /> : null}
        {tab === 'preferences' ? <PreferencesTab /> : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ReadonlyRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5">
      <span className="text-xs font-medium uppercase tracking-[0.06em] text-ink-muted">{label}</span>
      <span className="text-sm text-ink">{value || '—'}</span>
    </div>
  );
}

function ProfileTab() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: user?.name ?? '', phone: user?.phone ?? '' });
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  useEffect(() => {
    setForm({ name: user?.name ?? '', phone: user?.phone ?? '' });
  }, [user?.name, user?.phone]);

  if (!user) return null;

  const validate = () => {
    const next: { name?: string; phone?: string } = {};
    if (form.name.trim().length < 2) next.name = 'Name must be at least 2 characters.';
    if (form.phone && !/^[0-9+()\-\s]*$/.test(form.phone)) next.phone = 'Enter a valid phone number.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const res = await api<{ user: User }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: form.name.trim(), phone: form.phone.trim() || null }),
      });
      updateUser(res.user);
      setEditing(false);
      toast('Profile updated successfully');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Unable to update profile', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Surface>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Personal Information</h2>
            <p className="text-xs text-ink-muted">Details you can keep up to date.</p>
          </div>
          {!editing ? (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              Edit Profile
            </Button>
          ) : null}
        </div>

        {editing ? (
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
              />
            </Field>
            <Field label="Phone" error={errors.phone} optional>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                autoComplete="tel"
                placeholder="+91 98765 43210"
              />
            </Field>
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setForm({ name: user.name, phone: user.phone ?? '' });
                  setErrors({});
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid gap-x-8 sm:grid-cols-2">
            <ReadonlyRow label="Full Name" value={user.name} />
            <ReadonlyRow label="Email" value={user.email} />
            <ReadonlyRow label="Phone" value={user.phone} />
            <ReadonlyRow label="Employee ID" value={user.employeeId} />
            <ReadonlyRow label="Designation" value={user.designation} />
          </div>
        )}
      </Surface>

      <Surface>
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">Institutional Information</h2>
          <Badge className="bg-surface-muted text-ink-muted">Managed by administrator</Badge>
        </div>
        <p className="mb-3 text-xs text-ink-muted">
          Contact your administrator to change your institution, department, or role.
        </p>
        <div className="grid gap-x-8 sm:grid-cols-2">
          <ReadonlyRow label="Institution" value={user.collegeName} />
          <ReadonlyRow label="Department" value={user.departmentName} />
          <ReadonlyRow label="Role" value={user.roleLabel || user.role} />
          <ReadonlyRow
            label="Account Status"
            value={user.isActive === false ? 'Inactive' : 'Active'}
          />
        </div>
      </Surface>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SecurityTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const tz = user?.timezone || 'Asia/Kolkata';
  const meetsPolicy = isPasswordValid(form.newPassword);
  const matches = form.newPassword.length > 0 && form.newPassword === form.confirmPassword;
  const distinct = form.newPassword.length > 0 && form.newPassword !== form.currentPassword;
  const canSubmit =
    form.currentPassword.length > 0 && meetsPolicy && matches && distinct && !busy;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!meetsPolicy) return setError('Your new password does not meet the requirements below.');
    if (!matches) return setError('New passwords do not match.');
    if (!distinct) return setError('Your new password must be different from your current password.');

    setBusy(true);
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setDone(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast('Password updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to change password');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Surface className="max-w-lg">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <ShieldCheck size={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">Password updated</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Your password has been changed successfully. Your current session stays signed in.
            </p>
            <Button className="mt-4" variant="secondary" size="sm" onClick={() => setDone(false)}>
              Done
            </Button>
          </div>
        </div>
      </Surface>
    );
  }

  return (
    <div className="space-y-5">
      <Surface className="max-w-lg">
        <h2 className="text-sm font-semibold text-ink">Change Password</h2>
        <p className="mt-0.5 text-xs text-ink-muted">
          Choose a strong password you don&apos;t use elsewhere.
        </p>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Field label="Current Password">
            <PasswordInput
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              autoComplete="current-password"
            />
          </Field>
          <Field label="New Password">
            <PasswordInput
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              autoComplete="new-password"
            />
          </Field>

          {form.newPassword ? (
            <ul className="space-y-1.5 rounded-[var(--radius-md)] bg-surface-muted/60 px-3 py-2.5">
              {PASSWORD_RULES.map((rule) => {
                const ok = rule.test(form.newPassword);
                return (
                  <li
                    key={rule.id}
                    className={cn(
                      'flex items-center gap-2 text-xs',
                      ok ? 'text-success' : 'text-ink-muted',
                    )}
                  >
                    {ok ? <Check size={13} /> : <X size={13} />}
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          ) : null}

          <Field label="Confirm New Password">
            <PasswordInput
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              autoComplete="new-password"
            />
          </Field>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <Button type="submit" disabled={!canSubmit}>
            {busy ? 'Updating…' : 'Update Password'}
          </Button>
        </form>
      </Surface>

      <Surface className="max-w-lg">
        <h2 className="text-sm font-semibold text-ink">Account activity</h2>
        <div className="mt-2 grid gap-x-8 sm:grid-cols-2">
          <ReadonlyRow
            label="Last Password Change"
            value={
              user?.lastPasswordChangeAt
                ? formatInTimeZone(user.lastPasswordChangeAt, tz)
                : 'Not changed yet'
            }
          />
          <ReadonlyRow
            label="Last Login"
            value={user?.lastLoginAt ? formatInTimeZone(user.lastLoginAt, tz) : '—'}
          />
        </div>
      </Surface>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function PreferencesTab() {
  const { user } = useAuth();
  const tz = user?.timezone || 'Asia/Kolkata';
  const now = useMemo(() => new Date(), []);
  const zoneLabel = tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta' ? `IST (${tz})` : tz;

  return (
    <Surface className="max-w-lg">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">Preferences</h2>
        <Badge className="bg-surface-muted text-ink-muted">Managed by administrator</Badge>
      </div>
      <p className="mb-3 text-xs text-ink-muted">
        Survey scheduling and timestamps across the workspace use the institution timezone.
      </p>
      <div className="grid gap-x-8 sm:grid-cols-2">
        <ReadonlyRow label="Institution Timezone" value={zoneLabel} />
        <ReadonlyRow label="Date Format" value="18 Aug 2026 · 11:47 PM" />
        <ReadonlyRow label="Current Time" value={formatInTimeZone(now, tz)} />
      </div>
    </Surface>
  );
}
