import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Input, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/utils';

type EmployeeListItem = {
  id: number;
  displayName: string;
  employeeNumber: string;
  employmentStatus: string;
  departmentName?: string;
  designationName?: string;
  employmentTypeName?: string;
  reportingManagerName?: string;
  employeeCategory?: string;
  dateOfJoining?: string;
};

const TABS = [
  'Overview',
  'Personal',
  'Emergency',
  'Employment',
  'Service History',
  'Onboarding',
  'Probation',
  'Contracts',
  'Career Actions',
  'Documents',
  'Separation',
  'Operational',
] as const;

function StatusBadge({ status }: { status: string }) {
  return <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium">{status}</span>;
}

export function HrAdminEmployee360Page() {
  const { id } = useParams();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [personalForm, setPersonalForm] = useState({ personalPhone: '', nationality: '', maritalStatus: '', currentAddress: '' });
  const [emergencyForm, setEmergencyForm] = useState({ name: '', relationship: '', phone: '', isPrimary: true });
  const [actionForm, setActionForm] = useState({ type: 'promotion', effectiveDate: '', designationId: '', departmentId: '', reason: '' });
  useDocumentTitle(data ? String(data.displayName) : 'Employee 360');

  const load = () => {
    if (!id) return;
    api<Record<string, unknown>>(`/api/hr/admin/employees/${id}/360`).then((d) => {
      setData(d);
      const pp = d.personalProfile as Record<string, unknown> | null;
      if (pp) {
        setPersonalForm({
          personalPhone: String(pp.personalPhone ?? ''),
          nationality: String(pp.nationality ?? ''),
          maritalStatus: String(pp.maritalStatus ?? ''),
          currentAddress: String(pp.currentAddress ?? ''),
        });
      }
    }).catch(() => setData(null));
  };

  useEffect(load, [id]);

  async function act(path: string, method = 'POST', body?: unknown) {
    setBusy(true);
    setMessage('');
    try {
      await api(path, { method, body: body ? JSON.stringify(body) : undefined });
      setMessage('Saved.');
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (!id) return;
    if (!confirm('Mark employee as joined? Mandatory onboarding must be complete.')) return;
    await act(`/api/hr/admin/employees/${id}/join`, 'POST', {});
  }

  async function savePersonal() {
    if (!id) return;
    await act(`/api/hr/admin/employees/${id}/personal-profile`, 'PUT', personalForm);
  }

  async function addEmergency() {
    if (!id || !emergencyForm.name) return;
    await act(`/api/hr/admin/employees/${id}/emergency-contacts`, 'POST', emergencyForm);
    setEmergencyForm({ name: '', relationship: '', phone: '', isPrimary: false });
  }

  async function runCareerAction() {
    if (!id || !actionForm.effectiveDate) return;
    const base = `/api/hr/admin/employees/${id}`;
    const body = { effectiveDate: actionForm.effectiveDate, reason: actionForm.reason };
    if (actionForm.type === 'promotion' && actionForm.designationId) {
      await act(`${base}/promotions`, 'POST', { ...body, newDesignationId: Number(actionForm.designationId) });
    } else if (actionForm.type === 'transfer' && actionForm.departmentId) {
      await act(`${base}/transfers`, 'POST', { ...body, toDepartmentId: Number(actionForm.departmentId) });
    } else if (actionForm.type === 'designation' && actionForm.designationId) {
      await act(`${base}/designation-change`, 'POST', { ...body, newDesignationId: Number(actionForm.designationId) });
    } else if (actionForm.type === 'suspend') {
      await act(`${base}/suspend`, 'POST', body);
    } else if (actionForm.type === 'reinstate') {
      await act(`${base}/reinstate`, 'POST', body);
    }
  }

  if (!data) return <Skeleton className="h-64 w-full" />;

  const serviceHistory = (data.serviceHistory as Array<{ eventType: string; effectiveDate: string; notes?: string }>) ?? [];
  const ops = data.operationalAssignments as Record<string, unknown[]> | undefined;
  const onboarding = data.onboarding as { status: string; tasks?: Array<{ id: number; title?: string; task_code?: string; status: string; is_mandatory?: boolean; owner_role?: string }> } | null;
  const contracts = (data.contracts as Array<Record<string, unknown>>) ?? [];
  const probation = (data.probation as Array<Record<string, unknown>>) ?? [];
  const separation = data.separation as Record<string, unknown> | null;
  const documents = (data.documents as Array<Record<string, unknown>>) ?? [];
  const emergencyContacts = (data.emergencyContacts as Array<Record<string, unknown>>) ?? [];
  const employmentRecords = (data.employmentRecords as Array<Record<string, unknown>>) ?? [];
  const careerActions = (data.careerActions as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="animate-fade-in space-y-4 pb-8">
      <PageHeader
        title={String(data.displayName)}
        subtitle={`${String(data.employeeNumber)} · ${String(data.designationName ?? '—')} · ${String(data.departmentName ?? '—')}`}
      />
      <Surface className="flex flex-wrap items-center gap-3 p-4">
        <StatusBadge status={String(data.employmentStatus)} />
        <span className="text-sm text-ink-muted">{String(data.employeeCategory ?? '')}</span>
        {String(data.employmentStatus) === 'PRE_JOINING' ? (
          <Button size="sm" disabled={busy} onClick={handleJoin}>Mark as Joined</Button>
        ) : null}
        <Link to="/hr/admin/employees" className="text-sm text-accent hover:underline">← Back to list</Link>
      </Surface>

      <div className="flex gap-1 overflow-x-auto border-b border-border pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`shrink-0 rounded-t px-3 py-2 text-xs sm:text-sm ${tab === t ? 'bg-accent text-white' : 'bg-surface-muted text-ink-muted'}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' ? (
        <Surface className="grid gap-3 p-5 text-sm sm:grid-cols-2">
          <p><span className="text-ink-muted">Category</span><br />{String(data.employeeCategory ?? '—')}</p>
          <p><span className="text-ink-muted">Joining</span><br />{data.dateOfJoining ? formatDate(String(data.dateOfJoining)) : '—'}</p>
          <p><span className="text-ink-muted">Reporting Manager</span><br />{String(data.reportingManagerName ?? '—')}</p>
          <p><span className="text-ink-muted">Employment Type</span><br />{String(data.employmentTypeName ?? '—')}</p>
          <p><span className="text-ink-muted">Notice Period</span><br />{data.noticePeriodDays ? `${data.noticePeriodDays} days` : '—'}</p>
          <p><span className="text-ink-muted">Last Working Date</span><br />{data.lastWorkingDate ? formatDate(String(data.lastWorkingDate)) : '—'}</p>
          {data.facultyLink ? (
            <p className="sm:col-span-2"><span className="text-ink-muted">Linked Faculty</span><br />{String((data.facultyLink as { email: string }).email)}</p>
          ) : null}
        </Surface>
      ) : null}

      {tab === 'Personal' ? (
        <Surface className="space-y-3 p-5">
          <p className="text-sm text-ink-muted">Sensitive personal profile (metadata only — no binary photo upload).</p>
          <label className="block text-sm">Personal phone<Input value={personalForm.personalPhone} onChange={(e) => setPersonalForm({ ...personalForm, personalPhone: e.target.value })} /></label>
          <label className="block text-sm">Nationality<Input value={personalForm.nationality} onChange={(e) => setPersonalForm({ ...personalForm, nationality: e.target.value })} /></label>
          <label className="block text-sm">Marital status<Input value={personalForm.maritalStatus} onChange={(e) => setPersonalForm({ ...personalForm, maritalStatus: e.target.value })} /></label>
          <label className="block text-sm">Current address<textarea className="mt-1 w-full rounded border border-border px-3 py-2" rows={2} value={personalForm.currentAddress} onChange={(e) => setPersonalForm({ ...personalForm, currentAddress: e.target.value })} /></label>
          <Button size="sm" disabled={busy} onClick={savePersonal}>Save personal profile</Button>
        </Surface>
      ) : null}

      {tab === 'Emergency' ? (
        <Surface className="space-y-4 p-5">
          {emergencyContacts.length === 0 ? <p className="text-sm text-ink-muted">No emergency contacts.</p> : null}
          <ul className="space-y-2 text-sm">
            {emergencyContacts.map((c) => (
              <li key={String(c.id)} className="rounded border border-border p-3">
                <strong>{String(c.name)}</strong> ({String(c.relationship)}) · {String(c.phone)}
                {c.is_primary ? <span className="ml-2 text-xs text-accent">Primary</span> : null}
              </li>
            ))}
          </ul>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="Name" value={emergencyForm.name} onChange={(e) => setEmergencyForm({ ...emergencyForm, name: e.target.value })} />
            <Input placeholder="Relationship" value={emergencyForm.relationship} onChange={(e) => setEmergencyForm({ ...emergencyForm, relationship: e.target.value })} />
            <Input placeholder="Phone" value={emergencyForm.phone} onChange={(e) => setEmergencyForm({ ...emergencyForm, phone: e.target.value })} />
            <Button size="sm" disabled={busy} onClick={addEmergency}>Add contact</Button>
          </div>
        </Surface>
      ) : null}

      {tab === 'Employment' ? (
        <Surface className="space-y-2 p-5 text-sm">
          {employmentRecords.length === 0 ? <p className="text-ink-muted">No employment records.</p> : (
            employmentRecords.map((r) => (
              <div key={String(r.id)} className="border-b border-border py-2">
                <StatusBadge status={String(r.status ?? 'ACTIVE')} />
                <span className="ml-2">{formatDate(String(r.effective_from))} → {r.effective_to ? formatDate(String(r.effective_to)) : 'present'}</span>
              </div>
            ))
          )}
        </Surface>
      ) : null}

      {tab === 'Service History' ? (
        <Surface className="space-y-3 p-5">
          {serviceHistory.length === 0 ? <p className="text-sm text-ink-muted">No service events yet.</p> : (
            <ol className="space-y-2 border-l-2 border-border pl-4">
              {serviceHistory.map((e, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium">{e.eventType}</span>
                  <span className="ml-2 text-ink-muted">{formatDate(e.effectiveDate)}</span>
                  {e.notes ? <p className="text-ink-muted">{e.notes}</p> : null}
                </li>
              ))}
            </ol>
          )}
        </Surface>
      ) : null}

      {tab === 'Onboarding' ? (
        <Surface className="space-y-3 p-5 text-sm">
          {onboarding ? (
            <>
              <p>Status: <StatusBadge status={onboarding.status} /></p>
              <ul className="space-y-2">
                {(onboarding.tasks ?? []).map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border p-2">
                    <span>{t.title ?? t.task_code} {t.is_mandatory ? <span className="text-xs text-danger">mandatory</span> : null}</span>
                    <span className="text-ink-muted">{t.owner_role ?? 'HR'} · {t.status}</span>
                    {t.status !== 'COMPLETED' && id ? (
                      <Button size="sm" disabled={busy} onClick={() => act(`/api/hr/admin/onboarding/${id}/tasks/${t.id}/complete`, 'POST')}>Complete</Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : <p className="text-ink-muted">No onboarding record.</p>}
        </Surface>
      ) : null}

      {tab === 'Probation' ? (
        <Surface className="space-y-2 p-5 text-sm">
          {probation.length === 0 ? <p className="text-ink-muted">No probation reviews.</p> : probation.map((p) => (
            <div key={String(p.id)} className="border-b border-border py-2">
              <StatusBadge status={String(p.status ?? 'ACTIVE')} />
              <span className="ml-2">End: {p.current_end_date ? formatDate(String(p.current_end_date)) : '—'}</span>
              {p.manager_recommendation ? <span className="ml-2">Manager: {String(p.manager_recommendation)}</span> : null}
            </div>
          ))}
        </Surface>
      ) : null}

      {tab === 'Contracts' ? (
        <Surface className="space-y-2 p-5 text-sm">
          {contracts.length === 0 ? <p className="text-ink-muted">No contracts.</p> : contracts.map((c) => (
            <div key={String(c.id)} className="border-b border-border py-2">
              <StatusBadge status={String(c.status)} />
              <span className="ml-2">{formatDate(String(c.start_date))} – {formatDate(String(c.end_date))}</span>
              <span className="ml-2 text-ink-muted">{String(c.contract_type)}</span>
            </div>
          ))}
        </Surface>
      ) : null}

      {tab === 'Career Actions' ? (
        <Surface className="space-y-4 p-5">
          <div className="grid gap-2 sm:grid-cols-2">
            <select className="rounded border border-border bg-surface px-3 py-2 text-sm" value={actionForm.type} onChange={(e) => setActionForm({ ...actionForm, type: e.target.value })}>
              <option value="promotion">Promotion</option>
              <option value="transfer">Transfer</option>
              <option value="designation">Designation change</option>
              <option value="suspend">Suspension</option>
              <option value="reinstate">Reinstatement</option>
            </select>
            <Input type="date" value={actionForm.effectiveDate} onChange={(e) => setActionForm({ ...actionForm, effectiveDate: e.target.value })} />
            <Input placeholder="Designation ID" value={actionForm.designationId} onChange={(e) => setActionForm({ ...actionForm, designationId: e.target.value })} />
            <Input placeholder="Department ID (transfer)" value={actionForm.departmentId} onChange={(e) => setActionForm({ ...actionForm, departmentId: e.target.value })} />
            <textarea className="rounded border border-border px-3 py-2 text-sm" placeholder="Reason" value={actionForm.reason} onChange={(e) => setActionForm({ ...actionForm, reason: e.target.value })} />
            <Button size="sm" disabled={busy} onClick={runCareerAction}>Apply action</Button>
          </div>
          <p className="text-xs text-ink-muted">Academic assignments are not altered by lifecycle actions — separate academic reassignment may be required.</p>
          {careerActions.length ? careerActions.map((a) => (
            <div key={String(a.id)} className="text-sm">{String(a.action_type)} · {String(a.status)} · {formatDate(String(a.effective_date))}</div>
          )) : null}
        </Surface>
      ) : null}

      {tab === 'Documents' ? (
        <Surface className="space-y-2 p-5 text-sm">
          <p className="text-xs text-ink-muted">Document metadata and verification only — secure binary upload is not available.</p>
          {documents.length === 0 ? <p className="text-ink-muted">No documents.</p> : documents.map((d) => (
            <div key={String(d.id)} className="border-b border-border py-2">
              {String(d.document_type ?? d.title ?? 'Document')}
              <StatusBadge status={String(d.verification_status ?? 'PENDING')} />
            </div>
          ))}
        </Surface>
      ) : null}

      {tab === 'Separation' ? (
        <Surface className="space-y-3 p-5 text-sm">
          {separation ? (
            <>
              <p>Status: <StatusBadge status={String(separation.status)} /></p>
              <p>Type: {String(separation.separation_type ?? '—')}</p>
              <p>Requested LWD: {separation.requested_last_working_date ? formatDate(String(separation.requested_last_working_date)) : '—'}</p>
              <p>Approved LWD: {separation.last_working_date || separation.approved_last_working_date ? formatDate(String(separation.last_working_date ?? separation.approved_last_working_date)) : '—'}</p>
            </>
          ) : <p className="text-ink-muted">No active separation request.</p>}
        </Surface>
      ) : null}

      {tab === 'Operational' ? (
        <Surface className="space-y-4 p-5 text-sm">
          {(['academic', 'hostel', 'transport', 'library', 'placement'] as const).map((domain) => {
            const items = ops?.[domain] ?? [];
            return (
              <div key={domain}>
                <p className="font-semibold capitalize">{domain}</p>
                {items.length === 0 ? <p className="text-ink-muted">None</p> : (
                  <ul className="mt-1 list-disc pl-5">
                    {items.slice(0, 5).map((item, idx) => (
                      <li key={idx}>{JSON.stringify(item).slice(0, 120)}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </Surface>
      ) : null}

      {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
    </div>
  );
}

export function HrCreateEmployeePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    officialEmail: '',
    employeeCategory: 'NON_TEACHING',
    departmentId: '',
    designationId: '',
    employmentTypeId: '',
    authMode: 'NO_LOGIN',
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useDocumentTitle('Add Employee');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const created = await api<{ id: number }>('/api/hr/admin/employees', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          departmentId: form.departmentId ? Number(form.departmentId) : null,
          designationId: form.designationId ? Number(form.designationId) : null,
          employmentTypeId: form.employmentTypeId ? Number(form.employmentTypeId) : null,
          employmentStatus: 'PRE_JOINING',
        }),
      });
      navigate(`/hr/admin/employees/${created.id}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-in mx-auto max-w-xl space-y-4">
      <PageHeader title="Add Employee" subtitle="Create canonical employee record" />
      <Surface className="p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm">First name<Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></label>
          <label className="block text-sm">Last name<Input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></label>
          <label className="block text-sm">Official email<Input type="email" value={form.officialEmail} onChange={(e) => setForm({ ...form, officialEmail: e.target.value })} /></label>
          <label className="block text-sm">
            Category
            <select className="mt-1 w-full rounded border border-border bg-surface px-3 py-2" value={form.employeeCategory} onChange={(e) => setForm({ ...form, employeeCategory: e.target.value })}>
              <option value="FACULTY">Faculty</option>
              <option value="NON_TEACHING">Non-Teaching</option>
              <option value="CONTRACTUAL">Contractual</option>
            </select>
          </label>
          <label className="block text-sm">Department ID<Input value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} /></label>
          <label className="block text-sm">Designation ID<Input value={form.designationId} onChange={(e) => setForm({ ...form, designationId: e.target.value })} /></label>
          <label className="block text-sm">Employment Type ID<Input value={form.employmentTypeId} onChange={(e) => setForm({ ...form, employmentTypeId: e.target.value })} /></label>
          <label className="block text-sm">
            Auth
            <select className="mt-1 w-full rounded border border-border bg-surface px-3 py-2" value={form.authMode} onChange={(e) => setForm({ ...form, authMode: e.target.value })}>
              <option value="NO_LOGIN">No Login Yet</option>
              <option value="CREATE_LOGIN">Create Login</option>
              <option value="LINK_EXISTING">Link Existing User</option>
            </select>
          </label>
          <Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create Employee'}</Button>
        </form>
        {message ? <p className="mt-3 text-sm text-danger">{message}</p> : null}
      </Surface>
    </div>
  );
}

export function HrOnboardingPage() {
  const [items, setItems] = useState<Array<{ employee_id: number; display_name: string; employee_number: string; status: string }>>([]);
  useDocumentTitle('Onboarding');
  useEffect(() => {
    api<typeof items>('/api/hr/admin/onboarding').then(setItems).catch(() => setItems([]));
  }, []);
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Onboarding" subtitle="Pre-joining checklist tracking" />
      <div className="overflow-x-auto rounded border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Number</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.employee_id} className="border-t border-border">
                <td className="px-4 py-3">{o.display_name}</td>
                <td className="px-4 py-3 font-mono text-xs">{o.employee_number}</td>
                <td className="px-4 py-3">{o.status}</td>
                <td className="px-4 py-3">
                  <Link to={`/hr/admin/employees/${o.employee_id}`} className="text-accent hover:underline">Open 360</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function HrServiceHistoryPage() {
  const [rows, setRows] = useState<Array<{ eventType: string; effectiveDate: string; notes?: string }>>([]);
  useDocumentTitle('Service History');
  useEffect(() => {
    api<typeof rows>('/api/hr/me/service-history').then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="My Service History" />
      <Surface className="space-y-2 p-5">
        {rows.length === 0 ? (
          <p className="text-sm text-ink-muted">No service history yet.</p>
        ) : (
          rows.map((r, i) => (
            <div key={i} className="border-b border-border py-2 text-sm last:border-0">
              <span className="font-medium">{r.eventType}</span>
              <span className="ml-2 text-ink-muted">{formatDate(r.effectiveDate)}</span>
            </div>
          ))
        )}
      </Surface>
    </div>
  );
}

export function HrResignationPage() {
  const [lwd, setLwd] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [existing, setExisting] = useState<Record<string, unknown> | null>(null);
  useDocumentTitle('Resignation');

  useEffect(() => {
    api<Record<string, unknown> | null>('/api/hr/me/resignation').then(setExisting).catch(() => setExisting(null));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/api/hr/me/resignation', {
        method: 'POST',
        body: JSON.stringify({ proposedLastWorkingDate: lwd, reason }),
      });
      setMessage('Resignation submitted.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Submit failed');
    }
  }

  return (
    <div className="animate-fade-in mx-auto max-w-lg space-y-4">
      <PageHeader title="Submit Resignation" />
      {existing ? (
        <Surface className="p-4 text-sm">
          <p>Status: {String(existing.status)}</p>
          {existing.requested_last_working_date ? (
            <p>Proposed LWD: {formatDate(String(existing.requested_last_working_date))}</p>
          ) : null}
        </Surface>
      ) : (
        <Surface className="p-5">
          <form onSubmit={submit} className="space-y-3">
            <label className="block text-sm">Proposed last working day<Input type="date" required value={lwd} onChange={(e) => setLwd(e.target.value)} /></label>
            <label className="block text-sm">Reason<textarea className="mt-1 w-full rounded border border-border px-3 py-2" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
            <Button type="submit">Submit</Button>
          </form>
        </Surface>
      )}
      {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
    </div>
  );
}

export function HrAdminEmployeesListEnhanced({ items, setItems }: { items: EmployeeListItem[]; setItems: (v: EmployeeListItem[]) => void }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    api<{ items: EmployeeListItem[] }>(`/api/hr/admin/employees?${params}`).then((d) => setItems(d.items)).catch(() => setItems([]));
  }, [search, status, setItems]);

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      <select className="rounded border border-border bg-surface px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="PROBATION">Probation</option>
        <option value="PRE_JOINING">Pre-Joining</option>
        <option value="ON_NOTICE">On Notice</option>
        <option value="SEPARATED">Separated</option>
      </select>
      <Link to="/hr/admin/employees/new"><Button size="sm">Add Employee</Button></Link>
    </div>
  );
}
