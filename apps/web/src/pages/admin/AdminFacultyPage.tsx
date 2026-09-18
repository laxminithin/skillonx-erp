import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { MoreHorizontal, Plus, UserPlus } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../auth/AuthContext';
import {
  Avatar,
  Badge,
  Button,
  ConfirmDangerModal,
  DataTable,
  Drawer,
  DropdownMenu,
  Field,
  FilterBar,
  IconButton,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Select,
  useToast,
} from '../../components/ui';
import { formatDateTime } from '../../lib/utils';

type Faculty = {
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
  lastLoginAt?: string | null;
  permissions?: Record<string, boolean>;
};

type Institution = { id: number; name: string; code: string };
type Department = { id: number; name: string; code: string };

const ROLE_OPTIONS = [
  { value: 'FACULTY', label: 'Faculty' },
  { value: 'ACCOUNTANT', label: 'Accountant' },
  { value: 'COE', label: 'Controller of Examinations' },
  { value: 'HOD', label: 'Head of Department' },
  { value: 'PRINCIPAL', label: 'Principal' },
  { value: 'IQAC_COORDINATOR', label: 'IQAC Coordinator' },
  { value: 'NBA_COORDINATOR', label: 'NBA Coordinator' },
  { value: 'COLLEGE_ADMIN', label: 'College Administrator' },
];

const PERMISSION_LABELS: Record<string, string> = {
  createSurvey: 'Create Survey',
  publishSurvey: 'Publish Survey',
  viewResponses: 'View Responses',
  exportReports: 'Export Reports',
  manageQuestionBank: 'Manage Question Bank',
  viewStudentInformation: 'View Student Information',
};

const defaultPermissions = {
  createSurvey: true,
  publishSurvey: true,
  viewResponses: true,
  exportReports: true,
  manageQuestionBank: true,
  viewStudentInformation: true,
};

export function AdminFacultyPage() {
  useDocumentTitle('Faculty', 'Admin');
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [role, setRole] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerFaculty, setDrawerFaculty] = useState<Faculty | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Faculty | null>(null);
  const [busy, setBusy] = useState(false);
  const [credentials, setCredentials] = useState<{ temporaryPassword?: string; setupToken?: string } | null>(
    null,
  );

  const [form, setForm] = useState({
    name: '',
    email: '',
    employeeId: '',
    phone: '',
    collegeId: user?.collegeId ?? 0,
    departmentId: '',
    designation: '',
    role: 'FACULTY',
    isActive: true,
    authMode: 'TEMP_PASSWORD' as 'TEMP_PASSWORD' | 'SETUP_LINK',
    permissions: { ...defaultPermissions },
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (status !== 'all') params.set('status', status);
      if (role) params.set('role', role);
      const [fRes, iRes] = await Promise.all([
        api<{ faculty: Faculty[] }>(`/api/admin/faculty?${params}`),
        api<{ institutions: Institution[] }>('/api/admin/institutions'),
      ]);
      setFaculty(fRes.faculty);
      setInstitutions(iRes.institutions);
      if (!form.collegeId && iRes.institutions[0]) {
        setForm((prev) => ({ ...prev, collegeId: iRes.institutions[0].id }));
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load faculty', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, role]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      load();
    }, 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    if (!form.collegeId) return;
    api<{ departments: Department[] }>(`/api/admin/departments?collegeId=${form.collegeId}`)
      .then((r) => setDepartments(r.departments))
      .catch(() => setDepartments([]));
  }, [form.collegeId]);

  const roleOptions = useMemo(() => {
    if (user?.role === 'SUPER_ADMIN') {
      return [...ROLE_OPTIONS, { value: 'SUPER_ADMIN', label: 'Platform Administrator' }];
    }
    return ROLE_OPTIONS;
  }, [user?.role]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await api<{
        faculty: Faculty;
        credentials: { mode: string; temporaryPassword?: string; setupToken?: string };
      }>('/api/admin/faculty', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          employeeId: form.employeeId || null,
          phone: form.phone || null,
          collegeId: Number(form.collegeId),
          departmentId: form.departmentId ? Number(form.departmentId) : null,
          designation: form.designation || null,
          role: form.role,
          isActive: form.isActive,
          authMode: form.authMode,
          permissions: form.permissions,
        }),
      });
      setCreateOpen(false);
      setCredentials({
        temporaryPassword: result.credentials.temporaryPassword,
        setupToken: result.credentials.setupToken,
      });
      toast('Faculty account created');
      setForm((prev) => ({
        ...prev,
        name: '',
        email: '',
        employeeId: '',
        phone: '',
        designation: '',
        departmentId: '',
        role: 'FACULTY',
        permissions: { ...defaultPermissions },
      }));
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create faculty', 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (f: Faculty, activate: boolean) => {
    setBusy(true);
    try {
      await api(`/api/admin/faculty/${f.id}/${activate ? 'activate' : 'deactivate'}`, {
        method: 'POST',
      });
      toast(activate ? 'Faculty activated' : 'Faculty deactivated');
      setDeactivateTarget(null);
      setDrawerFaculty(null);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Action failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (f: Faculty) => {
    try {
      const res = await api<{ temporaryPassword: string; message: string }>(
        `/api/admin/faculty/${f.id}/reset-password`,
        { method: 'POST' },
      );
      setCredentials({ temporaryPassword: res.temporaryPassword });
      toast('Temporary password generated');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Reset failed', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Faculty"
        subtitle="Create and manage faculty accounts, roles, and access permissions."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Add Faculty
          </Button>
        }
      />

      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Search faculty, email, employee ID…" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-[140px]">
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-[180px]">
          <option value="">All roles</option>
          {roleOptions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </FilterBar>

      <DataTable
        loading={loading}
        rows={faculty}
        emptyTitle="No faculty members yet"
        emptyBody="Create faculty accounts so they can start building and managing surveys."
        emptyAction={
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus size={16} />
            Add Faculty
          </Button>
        }
        onRowClick={(row) => setDrawerFaculty(row)}
        columns={[
          {
            key: 'faculty',
            header: 'Faculty',
            render: (row) => (
              <div className="flex items-center gap-3">
                <Avatar name={row.name} />
                <div className="min-w-0">
                  <p className="font-medium text-ink">{row.name}</p>
                  <p className="truncate text-xs text-ink-muted">{row.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'employeeId',
            header: 'Employee ID',
            render: (row) => <span className="text-ink-secondary">{row.employeeId || '—'}</span>,
          },
          {
            key: 'department',
            header: 'Department',
            render: (row) => row.departmentName || '—',
          },
          {
            key: 'institution',
            header: 'Institution',
            render: (row) => row.collegeName || '—',
          },
          {
            key: 'role',
            header: 'Role',
            render: (row) => (
              <span className="text-ink-secondary">
                {ROLE_OPTIONS.find((r) => r.value === row.role)?.label || row.role}
              </span>
            ),
          },
          {
            key: 'surveys',
            header: 'Surveys',
            className: 'w-24',
            render: (row) => <span className="tabular-nums">{row.surveyCount}</span>,
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <Badge className={row.isActive ? 'bg-accent-soft text-accent' : 'bg-surface-muted text-ink-muted'}>
                {row.isActive ? 'Active' : 'Inactive'}
              </Badge>
            ),
          },
          {
            key: 'lastActive',
            header: 'Last Active',
            render: (row) => (
              <span className="text-ink-muted">{formatDateTime(row.lastLoginAt)}</span>
            ),
          },
        ]}
        rowActions={(row) => (
          <DropdownMenu
            trigger={
              <IconButton label="Actions">
                <MoreHorizontal size={16} />
              </IconButton>
            }
            items={[
              { label: 'Open profile', onClick: () => navigate(`/admin/faculty/${row.id}`) },
              { label: 'Quick view', onClick: () => setDrawerFaculty(row) },
              { label: 'Reset password', onClick: () => resetPassword(row) },
              row.isActive
                ? {
                    label: 'Deactivate',
                    danger: true,
                    onClick: () => setDeactivateTarget(row),
                  }
                : { label: 'Activate', onClick: () => toggleActive(row, true) },
            ]}
          />
        )}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Faculty"
        description="Create a faculty account and assign institutional access."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button form="create-faculty" type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create Faculty'}
            </Button>
          </>
        }
      >
        <form id="create-faculty" onSubmit={onCreate} className="space-y-5">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Personal Information
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full Name">
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label="Employee ID" optional>
                <Input
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label="Phone Number" optional>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Institution
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="College">
                <Select
                  required
                  value={form.collegeId}
                  onChange={(e) =>
                    setForm({ ...form, collegeId: Number(e.target.value), departmentId: '' })
                  }
                >
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Department" optional>
                <Select
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Designation" optional>
                <Input
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  placeholder="Associate Professor"
                />
              </Field>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Access
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Role">
                <Select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Account Status">
                <Select
                  value={form.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </Field>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-ink-secondary">
                  <input
                    type="checkbox"
                    className="accent-accent"
                    checked={Boolean(form.permissions[key as keyof typeof form.permissions])}
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
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Authentication
            </p>
            <Select
              value={form.authMode}
              onChange={(e) =>
                setForm({
                  ...form,
                  authMode: e.target.value as 'TEMP_PASSWORD' | 'SETUP_LINK',
                })
              }
            >
              <option value="TEMP_PASSWORD">Generate Temporary Password</option>
              <option value="SETUP_LINK">Send Account Setup Link</option>
            </Select>
            <p className="mt-1.5 text-xs text-ink-muted">
              A secure temporary credential will be generated. Avoid inventing weak passwords manually.
            </p>
          </div>
        </form>
      </Modal>

      <Drawer
        open={Boolean(drawerFaculty)}
        onClose={() => setDrawerFaculty(null)}
        title={drawerFaculty?.name || 'Faculty'}
        description={drawerFaculty?.departmentName || 'No department assigned'}
        footer={
          drawerFaculty ? (
            <>
              <Button variant="secondary" onClick={() => setDrawerFaculty(null)}>
                Close
              </Button>
              <Button onClick={() => navigate(`/admin/faculty/${drawerFaculty.id}`)}>
                Open Full Profile
              </Button>
            </>
          ) : null
        }
      >
        {drawerFaculty ? (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Avatar name={drawerFaculty.name} size="lg" />
              <div>
                <p className="font-semibold text-ink">{drawerFaculty.name}</p>
                <Badge
                  className={
                    drawerFaculty.isActive
                      ? 'mt-1 bg-accent-soft text-accent'
                      : 'mt-1 bg-surface-muted text-ink-muted'
                  }
                >
                  {drawerFaculty.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-ink-muted">Email</dt>
                <dd>{drawerFaculty.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Institution</dt>
                <dd>{drawerFaculty.collegeName || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Surveys</dt>
                <dd className="tabular-nums">{drawerFaculty.surveyCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Last Active</dt>
                <dd>{formatDateTime(drawerFaculty.lastLoginAt)}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </Drawer>

      <ConfirmDangerModal
        open={Boolean(deactivateTarget)}
        title={deactivateTarget ? `Deactivate ${deactivateTarget.name}?` : 'Deactivate faculty?'}
        description="They will no longer be able to sign in or create surveys. Existing surveys and responses will remain unchanged."
        confirmLabel="Deactivate Faculty"
        loading={busy}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => deactivateTarget && toggleActive(deactivateTarget, false)}
      />

      <Modal
        open={Boolean(credentials)}
        onClose={() => setCredentials(null)}
        title="Faculty credentials"
        description="Share these securely with the faculty member. They will not be shown again."
        footer={
          <Button onClick={() => setCredentials(null)}>Done</Button>
        }
      >
        {credentials?.temporaryPassword ? (
          <div className="rounded-[var(--radius-md)] bg-surface-muted px-3 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">
              Temporary password
            </p>
            <p className="mt-1 font-mono text-base text-ink">{credentials.temporaryPassword}</p>
          </div>
        ) : null}
        {credentials?.setupToken ? (
          <div className="mt-3 rounded-[var(--radius-md)] bg-surface-muted px-3 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">
              Setup token
            </p>
            <p className="mt-1 break-all font-mono text-sm text-ink">{credentials.setupToken}</p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
