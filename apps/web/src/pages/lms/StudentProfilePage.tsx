import { FormEvent, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../auth/AuthContext';
import { Badge, Button, Field, Input, PageHeader, PasswordInput, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { statusTone } from '../../lib/utils';

export function StudentProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notice, setNotice] = useState('');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [correction, setCorrection] = useState({ field: 'SECTION', requestedValue: '', reason: '' });
  useDocumentTitle('Profile');

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    const res = await api<{ user: NonNullable<typeof user> }>('/api/student-auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name, phone }),
    });
    updateUser(res.user);
    setNotice('Profile updated.');
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    await api('/api/student-auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwords),
    });
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setNotice('Password changed.');
  };

  const requestCorrection = async (e: FormEvent) => {
    e.preventDefault();
    await api('/api/student-auth/corrections', {
      method: 'POST',
      body: JSON.stringify(correction),
    });
    setNotice('Correction request submitted. Academic fields stay locked until staff review.');
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Profile" subtitle="Your student identity stays the same across semesters." />
      {notice ? <p className="text-sm text-success">{notice}</p> : null}
      <Surface>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-lg font-semibold text-accent">
            {(user?.name ?? 'S')
              .split(' ')
              .map((p) => p[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-ink-muted">{user?.usn}</p>
          </div>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-muted">Email</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Program</dt>
            <dd className="font-medium">{user?.programName || '—'}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Branch</dt>
            <dd className="font-medium">{user?.departmentName || '—'}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Semester</dt>
            <dd className="font-medium">{user?.semesterLabel || '—'}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Section</dt>
            <dd className="font-medium">{user?.sectionLabel || '—'}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Academic year</dt>
            <dd className="font-medium">{user?.academicYearLabel || '—'}</dd>
          </div>
        </dl>
        <Badge className={`mt-4 ${statusTone('ACTIVE')}`}>Permanent student identity</Badge>
      </Surface>

      <Surface>
        <h2 className="text-sm font-semibold">Contact</h2>
        <form onSubmit={saveProfile} className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Mobile">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit">Save contact details</Button>
          </div>
        </form>
      </Surface>

      <Surface>
        <h2 className="text-sm font-semibold">Password</h2>
        <form onSubmit={changePassword} className="mt-3 grid max-w-md gap-3">
          <Field label="Current password">
            <PasswordInput
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              required
            />
          </Field>
          <Field label="New password">
            <PasswordInput
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              required
            />
          </Field>
          <Field label="Confirm password">
            <PasswordInput
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              required
            />
          </Field>
          <Button type="submit">Change password</Button>
        </form>
      </Surface>

      <Surface>
        <h2 className="text-sm font-semibold">Academic correction request</h2>
        <p className="mt-1 text-sm text-ink-muted">
          USN, program, branch, semester, and section cannot be edited freely. Request a correction if your record is wrong.
        </p>
        <form onSubmit={requestCorrection} className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Field">
            <select
              className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm"
              value={correction.field}
              onChange={(e) => setCorrection({ ...correction, field: e.target.value })}
            >
              {['USN', 'PROGRAM', 'BRANCH', 'SEMESTER', 'SECTION', 'SCHEME', 'ACADEMIC_YEAR'].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </Field>
          <Field label="Requested value">
            <Input value={correction.requestedValue} onChange={(e) => setCorrection({ ...correction, requestedValue: e.target.value })} required />
          </Field>
          <Field label="Reason">
            <Input value={correction.reason} onChange={(e) => setCorrection({ ...correction, reason: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" variant="secondary">
              Submit request
            </Button>
          </div>
        </form>
      </Surface>
    </div>
  );
}
