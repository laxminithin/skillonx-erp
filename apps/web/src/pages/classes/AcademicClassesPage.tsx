import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { api } from '../../lib/api';
import { Button, EmptyState, Field, Modal, PageHeader, Select, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

type AcademicClassCard = {
  id: number;
  displayName: string;
  academicYearLabel: string;
  departmentCode: string;
  departmentName: string;
  semesterLabel: string;
  sectionLabel: string;
  studentCount: number;
  pendingCount: number;
  subjectCount: number;
  facultyCount: number;
};

type Lookups = {
  academicYears: Array<{ id: number; label: string }>;
  programs: Array<{ id: number; name: string; code: string; department_id?: number }>;
  departments: Array<{ id: number; name: string; code: string }>;
  semesters: Array<{ id: number; label: string; number?: number }>;
  sections: Array<{ id: number; label: string; department_id?: number }>;
  schemes: Array<{ id: number; name: string; code: string }>;
  faculty: Array<{ id: number; name: string }>;
};

export function AcademicClassesPage({ basePath = '/classes' }: { basePath?: string }) {
  const [classes, setClasses] = useState<AcademicClassCard[]>([]);
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  useDocumentTitle('Academic Classes');

  const load = () =>
    api<{ classes: AcademicClassCard[] }>('/api/classes')
      .then((r) => setClasses(r.classes))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load classes'));

  useEffect(() => {
    Promise.all([load(), api<Lookups>('/api/meta/lookups').then(setLookups)]).finally(() => setLoading(false));
  }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/classes', {
        method: 'POST',
        body: JSON.stringify({
          academicYearId: Number(form.academicYearId),
          programId: Number(form.programId),
          departmentId: Number(form.departmentId),
          semesterId: Number(form.semesterId),
          schemeId: form.schemeId ? Number(form.schemeId) : null,
          classSectionId: Number(form.classSectionId),
          coordinatorId: form.coordinatorId ? Number(form.coordinatorId) : null,
        }),
      });
      setOpen(false);
      setForm({});
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create class');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Academic Classes"
        subtitle="Students join a class once. Subjects and faculty are mapped to the class."
        actions={<Button onClick={() => setOpen(true)}>Create class</Button>}
      />
      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : !classes.length ? (
        <EmptyState
          icon={<GraduationCap size={22} />}
          title="No academic classes yet"
          body="Create a class such as CSE Semester 3 Section A. Subjects are mapped from the academic master automatically."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((c) => (
            <Link key={c.id} to={`${basePath}/${c.id}`}>
              <Surface className="h-full transition hover:border-accent">
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                  {c.departmentCode} · {c.academicYearLabel}
                </p>
                <h2 className="mt-1 text-lg font-semibold">{c.displayName}</h2>
                <p className="mt-3 text-sm text-ink-muted">
                  {c.studentCount} students · {c.subjectCount} subjects · {c.facultyCount} faculty
                  {c.pendingCount ? ` · ${c.pendingCount} pending` : ''}
                </p>
              </Surface>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create academic class"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button form="create-class" type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create class'}
            </Button>
          </>
        }
      >
        <form id="create-class" onSubmit={create} className="space-y-3">
          <Field label="Academic year">
            <Select required value={form.academicYearId || ''} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}>
              <option value="">Select</option>
              {(lookups?.academicYears || []).map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Program">
            <Select required value={form.programId || ''} onChange={(e) => setForm({ ...form, programId: e.target.value })}>
              <option value="">Select</option>
              {(lookups?.programs || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Branch">
            <Select required value={form.departmentId || ''} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">Select</option>
              {(lookups?.departments || []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} — {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Semester">
            <Select required value={form.semesterId || ''} onChange={(e) => setForm({ ...form, semesterId: e.target.value })}>
              <option value="">Select</option>
              {(lookups?.semesters || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Section">
            <Select required value={form.classSectionId || ''} onChange={(e) => setForm({ ...form, classSectionId: e.target.value })}>
              <option value="">Select</option>
              {(lookups?.sections || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Scheme" optional>
            <Select value={form.schemeId || ''} onChange={(e) => setForm({ ...form, schemeId: e.target.value })}>
              <option value="">None</option>
              {(lookups?.schemes || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Class coordinator" optional>
            <Select value={form.coordinatorId || ''} onChange={(e) => setForm({ ...form, coordinatorId: e.target.value })}>
              <option value="">Assign me</option>
              {(lookups?.faculty || []).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </Field>
        </form>
      </Modal>
    </div>
  );
}
