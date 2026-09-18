import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../auth/AuthContext';
import {
  Button,
  DataTable,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  FilterBar,
  Surface,
  Tabs,
  useToast,
} from '../../components/ui';

type Institution = {
  id: number;
  name: string;
  code: string;
  domain?: string | null;
  address?: string | null;
  isActive: boolean;
  departmentCount: number;
  facultyCount: number;
  studentCount: number;
  surveyCount: number;
};

export function AdminInstitutionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', domain: '', address: '' });
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api<{ institutions: Institution[] }>('/api/admin/institutions')
      .then((r) => setInstitutions(r.institutions))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = institutions.filter((i) => {
    if (!q) return true;
    const term = q.toLowerCase();
    return i.name.toLowerCase().includes(term) || i.code.toLowerCase().includes(term);
  });

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/admin/institutions', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          domain: form.domain || null,
          address: form.address || null,
        }),
      });
      toast('Institution created');
      setCreateOpen(false);
      setForm({ name: '', code: '', domain: '', address: '' });
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Create failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Institutions"
        subtitle="Manage colleges and multi-institution platform structure."
        actions={
          user?.role === 'SUPER_ADMIN' ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              Add Institution
            </Button>
          ) : null
        }
      />

      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Search institutions…" />
      </FilterBar>

      <DataTable
        loading={loading}
        rows={filtered}
        emptyTitle="No institutions"
        emptyBody="Add an institution to begin configuring academic structure."
        onRowClick={(row) => navigate(`/admin/institutions/${row.id}`)}
        columns={[
          {
            key: 'name',
            header: 'Institution',
            render: (row) => (
              <div>
                <p className="font-medium text-ink">{row.name}</p>
                <p className="text-xs text-ink-muted">{row.code}</p>
              </div>
            ),
          },
          { key: 'departments', header: 'Departments', render: (r) => r.departmentCount },
          { key: 'faculty', header: 'Faculty', render: (r) => r.facultyCount },
          { key: 'students', header: 'Students', render: (r) => r.studentCount },
          { key: 'surveys', header: 'Surveys', render: (r) => r.surveyCount },
          {
            key: 'status',
            header: 'Status',
            render: (r) => (r.isActive ? 'Active' : 'Inactive'),
          },
        ]}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Institution"
        description="Create a college for multi-institution management."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button form="create-institution" type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="create-institution" onSubmit={onCreate} className="space-y-3">
          <Field label="Institution Name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Institution Code">
            <Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </Field>
          <Field label="Domain" optional>
            <Input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
          </Field>
          <Field label="Address" optional>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}

export function AdminInstitutionDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState<{
    institution: Institution & { address?: string | null; domain?: string | null };
    departments: Array<{ id: number; name: string; code: string }>;
    faculty: Array<{ id: number; name: string; email: string; departmentName?: string | null }>;
    recentSurveys: Array<{ id: number; title: string; status: string; createdBy?: string }>;
  } | null>(null);

  useEffect(() => {
    api<NonNullable<typeof data>>(`/api/admin/institutions/${id}`)
      .then(setData)
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));
  }, [id, toast]);

  if (!data) return <p className="text-ink-muted">Loading…</p>;

  return (
    <div className="animate-fade-in">
      <PageHeader
        breadcrumb={
          <Link to="/admin/institutions" className="hover:text-accent">
            Institutions
          </Link>
        }
        title={data.institution.name}
        subtitle={data.institution.code}
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'departments', label: 'Departments' },
          { id: 'faculty', label: 'Faculty' },
          { id: 'surveys', label: 'Surveys' },
          { id: 'settings', label: 'Settings' },
        ]}
      />

      <div className="mt-5">
        {tab === 'overview' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Departments', data.institution.departmentCount],
              ['Faculty', data.institution.facultyCount],
              ['Students', data.institution.studentCount],
              ['Surveys', data.institution.surveyCount],
            ].map(([label, value]) => (
              <Surface key={String(label)} className="!p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-ink-muted">{label}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
              </Surface>
            ))}
          </div>
        ) : null}

        {tab === 'departments' ? (
          <Surface className="!p-0">
            <ul className="divide-y divide-border">
              {data.departments.map((d) => (
                <li key={d.id} className="flex justify-between px-5 py-3 text-sm">
                  <span className="font-medium">{d.name}</span>
                  <span className="text-ink-muted">{d.code}</span>
                </li>
              ))}
            </ul>
          </Surface>
        ) : null}

        {tab === 'faculty' ? (
          <Surface className="!p-0">
            <ul className="divide-y divide-border">
              {data.faculty.map((f) => (
                <li key={f.id} className="px-5 py-3">
                  <Link to={`/admin/faculty/${f.id}`} className="font-medium hover:text-accent">
                    {f.name}
                  </Link>
                  <p className="text-xs text-ink-muted">
                    {f.email} · {f.departmentName || 'No department'}
                  </p>
                </li>
              ))}
            </ul>
          </Surface>
        ) : null}

        {tab === 'surveys' ? (
          <Surface className="!p-0">
            <ul className="divide-y divide-border">
              {data.recentSurveys.map((s) => (
                <li key={s.id} className="flex justify-between px-5 py-3 text-sm">
                  <span>{s.title}</span>
                  <span className="text-ink-muted">{s.createdBy}</span>
                </li>
              ))}
            </ul>
          </Surface>
        ) : null}

        {tab === 'settings' ? (
          <Surface>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-ink-muted">Domain</dt>
                <dd>{data.institution.domain || '—'}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Address</dt>
                <dd>{data.institution.address || '—'}</dd>
              </div>
            </dl>
          </Surface>
        ) : null}
      </div>
    </div>
  );
}
