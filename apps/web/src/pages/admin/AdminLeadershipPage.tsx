import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Button, Field, Input, PageHeader, Select, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { SimpleTable } from '../leadership/leadershipUi';

type Assignment = {
  id: number;
  role: string;
  employeeName: string | null;
  employeeNumber: string | null;
  departmentName: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: string;
};

type Employee = { id: number; displayName?: string; firstName?: string; lastName?: string; employeeNumber?: string };
type Department = { id: number; name: string; code: string };

export function AdminLeadershipPage() {
  useDocumentTitle('Academic leadership');
  const [rows, setRows] = useState<Assignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState<'HOD' | 'PRINCIPAL'>('HOD');
  const [departmentId, setDepartmentId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));

  async function reload() {
    const data = await api<Assignment[]>('/api/academic-leadership/admin/assignments');
    setRows(data);
  }

  useEffect(() => {
    reload().catch((err: Error) => setError(err.message));
    api<{ items?: Employee[] } | Employee[]>('/api/hr/admin/employees')
      .then((res) => setEmployees(Array.isArray(res) ? res : res.items ?? []))
      .catch(() => setEmployees([]));
    api<{ departments?: Department[] }>('/api/admin/departments')
      .then((res) => setDepartments(res.departments ?? []))
      .catch(() => setDepartments([]));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api('/api/academic-leadership/admin/assignments', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: Number(employeeId),
          role,
          departmentId: role === 'HOD' ? Number(departmentId) : null,
          effectiveFrom,
        }),
      });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not assign');
    }
  }

  async function end(id: number) {
    const to = new Date().toISOString().slice(0, 10);
    await api(`/api/academic-leadership/admin/assignments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ effectiveTo: to, status: 'ENDED', remarks: 'Ended from admin' }),
    });
    await reload();
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Academic leadership" subtitle="Effective-dated HOD and Principal assignments. Faculty identity is never replaced." />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Surface className="p-5">
        <h2 className="font-display text-lg">New assignment</h2>
        <form className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={create}>
          <Field label="Employee">
            <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
              <option value="">Select</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.displayName || `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim()} {emp.employeeNumber ? `(${emp.employeeNumber})` : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Role">
            <Select value={role} onChange={(e) => setRole(e.target.value as 'HOD' | 'PRINCIPAL')}>
              <option value="HOD">HOD</option>
              <option value="PRINCIPAL">Principal</option>
            </Select>
          </Field>
          {role === 'HOD' ? (
            <Field label="Department">
              <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required>
                <option value="">Select</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} {d.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <p className="self-end text-sm text-ink-muted">College-wide — no department</p>
          )}
          <Field label="Effective from">
            <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} required />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button type="submit">Assign</Button>
          </div>
        </form>
      </Surface>
      <SimpleTable
        headers={['Person', 'Role', 'Department', 'From', 'To', 'Status', '']}
        empty="No assignments yet"
        rows={rows.map((r) => [
          `${r.employeeName || '—'} ${r.employeeNumber ? `· ${r.employeeNumber}` : ''}`,
          r.role,
          r.departmentName || 'College',
          r.effectiveFrom,
          r.effectiveTo || 'Open',
          r.status,
          r.status === 'ACTIVE' ? (
            <Button key="e" size="sm" variant="secondary" onClick={() => end(r.id)}>
              End
            </Button>
          ) : (
            ''
          ),
        ])}
      />
    </div>
  );
}
