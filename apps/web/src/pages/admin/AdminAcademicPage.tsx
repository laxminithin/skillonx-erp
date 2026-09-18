import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../auth/AuthContext';
import {
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Surface,
  Tabs,
  useToast,
} from '../../components/ui';

type AcademicData = {
  years: Array<{ id: number; label: string; is_current: boolean }>;
  semesters: Array<{ id: number; label: string; number?: number }>;
  courses: Array<{ id: number; code: string; name: string; department_name?: string }>;
  sections: Array<{ id: number; label: string; department_name?: string }>;
  programs: Array<{ id: number; code: string; name: string; department_name?: string }>;
  departments: Array<{ id: number; name: string; code: string; faculty_count?: number }>;
};

export function AdminAcademicPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const collegeId = user?.collegeId;
  const [tab, setTab] = useState('departments');
  const [data, setData] = useState<AcademicData | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = () => {
    if (!collegeId) return;
    api<AcademicData>(`/api/admin/academic?collegeId=${collegeId}`)
      .then(setData)
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!collegeId || !modal) return;
    setBusy(true);
    try {
      const endpoints: Record<string, { path: string; body: Record<string, unknown> }> = {
        department: {
          path: '/api/admin/departments',
          body: { collegeId, name: form.name, code: form.code },
        },
        year: {
          path: '/api/admin/academic-years',
          body: { collegeId, label: form.label, isCurrent: form.isCurrent === 'true' },
        },
        semester: {
          path: '/api/admin/semesters',
          body: { collegeId, label: form.label, number: form.number ? Number(form.number) : null },
        },
        course: {
          path: '/api/admin/courses',
          body: {
            collegeId,
            code: form.code,
            name: form.name,
            departmentId: form.departmentId ? Number(form.departmentId) : null,
          },
        },
        section: {
          path: '/api/admin/sections',
          body: {
            collegeId,
            label: form.label,
            departmentId: form.departmentId ? Number(form.departmentId) : null,
          },
        },
        program: {
          path: '/api/admin/programs',
          body: {
            collegeId,
            name: form.name,
            code: form.code,
            departmentId: form.departmentId ? Number(form.departmentId) : null,
          },
        },
      };
      const cfg = endpoints[modal];
      await api(cfg.path, { method: 'POST', body: JSON.stringify(cfg.body) });
      toast('Created successfully');
      setModal(null);
      setForm({});
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Create failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const deptOptions = data?.departments ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Academic Setup"
        subtitle="Manage academic years, departments, programs, semesters, sections, courses, and CO–PO mapping."
        actions={
          <Button
            onClick={() => {
              const map: Record<string, string> = {
                departments: 'department',
                years: 'year',
                semesters: 'semester',
                courses: 'course',
                sections: 'section',
                programs: 'program',
              };
              setModal(map[tab] || 'department');
            }}
          >
            Add {tab === 'departments' ? 'Department' : tab.slice(0, -1)}
          </Button>
        }
      />

      <Surface className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">CO–PO Mapping</h2>
            <p className="text-sm text-ink-muted">Manage imported CO-PO master templates, outcomes, and verification.</p>
          </div>
          <Link to="/admin/copo/master">
            <Button variant="secondary">Open CO-PO Master</Button>
          </Link>
        </div>
      </Surface>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'departments', label: 'Departments' },
          { id: 'programs', label: 'Programs' },
          { id: 'years', label: 'Academic Years' },
          { id: 'semesters', label: 'Semesters' },
          { id: 'sections', label: 'Sections' },
          { id: 'courses', label: 'Courses' },
        ]}
      />

      <div className="mt-5">
        <Surface className="!p-0 overflow-hidden">
          {tab === 'departments' ? (
            <ul className="divide-y divide-border">
              {(data?.departments || []).map((d) => (
                <li key={d.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                  <div>
                    <p className="font-medium text-ink">{d.name}</p>
                    <p className="text-xs text-ink-muted">{d.code}</p>
                  </div>
                  <span className="text-ink-muted tabular-nums">{d.faculty_count ?? 0} faculty</span>
                </li>
              ))}
            </ul>
          ) : null}

          {tab === 'programs' ? (
            <ul className="divide-y divide-border">
              {(data?.programs || []).map((p) => (
                <li key={p.id} className="flex justify-between px-5 py-3.5 text-sm">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-ink-muted">{p.department_name || '—'}</p>
                  </div>
                  <span className="text-ink-muted">{p.code}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {tab === 'years' ? (
            <ul className="divide-y divide-border">
              {(data?.years || []).map((y) => (
                <li key={y.id} className="flex justify-between px-5 py-3.5 text-sm">
                  <span className="font-medium">{y.label}</span>
                  {y.is_current ? <span className="text-accent">Current</span> : null}
                </li>
              ))}
            </ul>
          ) : null}

          {tab === 'semesters' ? (
            <ul className="divide-y divide-border">
              {(data?.semesters || []).map((s) => (
                <li key={s.id} className="flex justify-between px-5 py-3.5 text-sm">
                  <span className="font-medium">Semester {s.label}</span>
                  <span className="text-ink-muted">{s.number ?? '—'}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {tab === 'sections' ? (
            <ul className="divide-y divide-border">
              {(data?.sections || []).map((s) => (
                <li key={s.id} className="flex justify-between px-5 py-3.5 text-sm">
                  <span className="font-medium">Section {s.label}</span>
                  <span className="text-ink-muted">{s.department_name || '—'}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {tab === 'courses' ? (
            <ul className="divide-y divide-border">
              {(data?.courses || []).map((c) => (
                <li key={c.id} className="flex justify-between px-5 py-3.5 text-sm">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-ink-muted">{c.department_name || '—'}</p>
                  </div>
                  <span className="text-ink-muted">{c.code}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Surface>
      </div>

      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={`Add ${modal}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button form="academic-create" type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="academic-create" onSubmit={submit} className="space-y-3">
          {modal === 'department' || modal === 'course' || modal === 'program' ? (
            <>
              <Field label="Name">
                <Input required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Code">
                <Input required value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </Field>
            </>
          ) : null}
          {modal === 'year' || modal === 'semester' || modal === 'section' ? (
            <Field label="Label">
              <Input required value={form.label || ''} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </Field>
          ) : null}
          {modal === 'year' ? (
            <Field label="Current year">
              <Select value={form.isCurrent || 'false'} onChange={(e) => setForm({ ...form, isCurrent: e.target.value })}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </Field>
          ) : null}
          {modal === 'semester' ? (
            <Field label="Number" optional>
              <Input value={form.number || ''} onChange={(e) => setForm({ ...form, number: e.target.value })} />
            </Field>
          ) : null}
          {modal === 'course' || modal === 'section' || modal === 'program' ? (
            <Field label="Department" optional>
              <Select
                value={form.departmentId || ''}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              >
                <option value="">Unassigned</option>
                {deptOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
        </form>
      </Modal>
    </div>
  );
}
