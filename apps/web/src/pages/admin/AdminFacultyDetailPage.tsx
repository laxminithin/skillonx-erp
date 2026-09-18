import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  Avatar,
  Badge,
  Button,
  ConfirmDangerModal,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  StatusBadge,
  Surface,
  Tabs,
  useToast,
} from '../../components/ui';
import { copyToClipboard, formatDate, formatDateTime, SURVEY_TYPE_LABELS } from '../../lib/utils';

type FacultyDetail = {
  id: number;
  name: string;
  email: string;
  employeeId?: string | null;
  phone?: string | null;
  designation?: string | null;
  role: string;
  isActive: boolean;
  collegeId: number;
  collegeName?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  surveyCount: number;
  responseCount?: number;
  lastLoginAt?: string | null;
  createdAt?: string;
  permissions: Record<string, boolean>;
  surveys: Array<{
    id: number;
    title: string;
    surveyType: string;
    status: string;
    createdAt: string;
    responses: number;
  }>;
};

const PERMISSION_LABELS: Record<string, string> = {
  createSurvey: 'Create Survey',
  publishSurvey: 'Publish Survey',
  viewResponses: 'View Responses',
  exportReports: 'Export Reports',
  manageQuestionBank: 'Manage Question Bank',
  viewStudentInformation: 'View Student Information',
};

export function AdminFacultyDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState<FacultyDetail | null>(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    employeeId: '',
    phone: '',
    designation: '',
    role: 'FACULTY',
    permissions: {} as Record<string, boolean>,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api<{ faculty: FacultyDetail }>(`/api/admin/faculty/${id}`);
      setFaculty(res.faculty);
      setForm({
        name: res.faculty.name,
        email: res.faculty.email,
        employeeId: res.faculty.employeeId || '',
        phone: res.faculty.phone || '',
        designation: res.faculty.designation || '',
        role: res.faculty.role,
        permissions: { ...res.faculty.permissions },
      });
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ faculty: FacultyDetail }>(`/api/admin/faculty/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          employeeId: form.employeeId || null,
          phone: form.phone || null,
          designation: form.designation || null,
          role: form.role,
          permissions: form.permissions,
        }),
      });
      setFaculty(res.faculty);
      setEditing(false);
      toast('Faculty updated');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading || !faculty) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        breadcrumb={
          <Link to="/admin/faculty" className="hover:text-accent">
            Faculty
          </Link>
        }
        title={faculty.name}
        subtitle={`${faculty.departmentName || 'No department'} · ${faculty.collegeName || ''}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {faculty.isActive ? (
              <Button variant="danger-soft" onClick={() => setDeactivateOpen(true)}>
                Deactivate Faculty
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  await api(`/api/admin/faculty/${faculty.id}/activate`, { method: 'POST' });
                  toast('Faculty activated');
                  load();
                }}
              >
                Activate Faculty
              </Button>
            )}
            <Button variant="secondary" onClick={() => setEditing((v) => !v)}>
              {editing ? 'Cancel edit' : 'Edit Details'}
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Avatar name={faculty.name} size="lg" />
        <div>
          <Badge className={faculty.isActive ? 'bg-accent-soft text-accent' : 'bg-surface-muted text-ink-muted'}>
            {faculty.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <p className="mt-1 text-sm text-ink-muted">{faculty.designation || faculty.role}</p>
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'surveys', label: 'Surveys' },
          { id: 'activity', label: 'Activity' },
          { id: 'access', label: 'Access' },
        ]}
      />

      <div className="mt-5">
        {tab === 'overview' ? (
          editing ? (
            <Surface>
              <form onSubmit={save} className="grid max-w-2xl gap-4 sm:grid-cols-2">
                <Field label="Full Name">
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </Field>
                <Field label="Employee ID" optional>
                  <Input
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  />
                </Field>
                <Field label="Phone" optional>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Field>
                <Field label="Designation" optional>
                  <Input
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  />
                </Field>
                <Field label="Role">
                  <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="FACULTY">Faculty</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="COE">Controller of Examinations</option>
                    <option value="HOD">Head of Department</option>
                    <option value="PRINCIPAL">Principal</option>
                    <option value="IQAC_COORDINATOR">IQAC Coordinator</option>
                    <option value="NBA_COORDINATOR">NBA Coordinator</option>
                    <option value="COLLEGE_ADMIN">College Administrator</option>
                  </Select>
                </Field>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={busy}>
                    {busy ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Surface>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['Email', faculty.email],
                ['Employee ID', faculty.employeeId || '—'],
                ['Department', faculty.departmentName || '—'],
                ['Phone', faculty.phone || '—'],
                ['Created', formatDate(faculty.createdAt)],
                ['Last Login', formatDateTime(faculty.lastLoginAt)],
                ['Surveys', String(faculty.surveyCount)],
                ['Responses Collected', String(faculty.responseCount ?? 0)],
              ].map(([label, value]) => (
                <Surface key={label} className="!p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">{label}</p>
                  <p className="mt-2 text-sm font-medium text-ink">{value}</p>
                </Surface>
              ))}
            </div>
          )
        ) : null}

        {tab === 'surveys' ? (
          <Surface className="!p-0 overflow-hidden">
            {faculty.surveys?.length ? (
              <ul className="divide-y divide-border">
                {faculty.surveys.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <div>
                      <p className="font-medium text-ink">{s.title}</p>
                      <p className="text-xs text-ink-muted">
                        {SURVEY_TYPE_LABELS[s.surveyType] || s.surveyType} · {formatDate(s.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-ink-muted tabular-nums">{s.responses} resp.</span>
                      <StatusBadge status={s.status} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-ink-muted">No surveys created yet.</p>
            )}
          </Surface>
        ) : null}

        {tab === 'activity' ? (
          <Surface>
            <p className="text-sm text-ink-muted">
              Last login: <span className="font-medium text-ink">{formatDateTime(faculty.lastLoginAt)}</span>
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Account created: <span className="font-medium text-ink">{formatDate(faculty.createdAt)}</span>
            </p>
          </Surface>
        ) : null}

        {tab === 'access' ? (
          <div className="space-y-5">
            <Surface>
              <h3 className="mb-3 text-sm font-semibold text-ink">Permissions</h3>
              <form onSubmit={save} className="space-y-3">
                {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 text-sm text-ink">
                    <input
                      type="checkbox"
                      className="accent-accent"
                      checked={Boolean(form.permissions[key])}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          permissions: { ...form.permissions, [key]: e.target.checked },
                        })
                      }
                    />
                    {label}
                  </label>
                ))}
                <Button type="submit" disabled={busy} className="mt-2">
                  {busy ? 'Saving…' : 'Save Permissions'}
                </Button>
              </form>
            </Surface>

            <Surface>
              <h3 className="text-sm font-semibold text-ink">Security</h3>
              <p className="mt-1 max-w-lg text-sm text-ink-muted">
                Generate a temporary password for {faculty.name}. Share it securely — they can set
                their own password from Profile → Security after signing in. You can never view an
                existing password.
              </p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => setResetOpen(true)}
                disabled={!faculty.isActive}
              >
                Reset Password
              </Button>
              {!faculty.isActive ? (
                <p className="mt-2 text-xs text-ink-muted">
                  Reactivate this account before resetting its password.
                </p>
              ) : null}
            </Surface>
          </div>
        ) : null}
      </div>

      <ConfirmDangerModal
        open={deactivateOpen}
        title={`Deactivate ${faculty.name}?`}
        description="They will no longer be able to sign in or create surveys. Existing surveys and responses will remain unchanged."
        confirmLabel="Deactivate Faculty"
        loading={busy}
        onClose={() => setDeactivateOpen(false)}
        onConfirm={async () => {
          setBusy(true);
          try {
            await api(`/api/admin/faculty/${faculty.id}/deactivate`, { method: 'POST' });
            toast('Faculty deactivated');
            setDeactivateOpen(false);
            navigate('/admin/faculty');
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Failed', 'error');
          } finally {
            setBusy(false);
          }
        }}
      />

      <ConfirmDangerModal
        open={resetOpen}
        title={`Reset password for ${faculty.name}?`}
        description="A new temporary password will be generated. The current password stops working immediately. Share the new password securely."
        confirmLabel="Generate Temporary Password"
        loading={busy}
        onClose={() => setResetOpen(false)}
        onConfirm={async () => {
          setBusy(true);
          try {
            const res = await api<{ temporaryPassword: string }>(
              `/api/admin/faculty/${faculty.id}/reset-password`,
              { method: 'POST' },
            );
            setResetOpen(false);
            setTempPassword(res.temporaryPassword);
            toast('Temporary password generated');
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Failed to reset password', 'error');
          } finally {
            setBusy(false);
          }
        }}
      />

      <Modal
        open={Boolean(tempPassword)}
        title="Temporary password"
        description={`Share this securely with ${faculty.name}. It won't be shown again.`}
        onClose={() => setTempPassword(null)}
        footer={
          <Button
            onClick={async () => {
              const ok = tempPassword ? await copyToClipboard(tempPassword) : false;
              toast(ok ? 'Copied to clipboard' : 'Copy failed — select and copy manually', ok ? 'success' : 'error');
            }}
          >
            Copy Password
          </Button>
        }
      >
        <div className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-4 py-3 font-mono text-sm tracking-wide text-ink">
          {tempPassword}
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          They should sign in with this password and set their own from Profile → Security.
        </p>
      </Modal>
    </div>
  );
}
