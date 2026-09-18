import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, FileUp, IndianRupee, Search } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../auth/AuthContext';

type Dashboard = {
  actionRequired: Record<string, number>;
  pipeline: Array<{ status: string; count: number }>;
  intake: Array<{ id: number; program: string; approvedIntake: number; selected: number; admitted: number; remaining: number }>;
};

type ApplicationRow = {
  id: number;
  application_number: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  program_name?: string;
  payment_state?: string;
  outstanding_amount?: string;
};

type Workspace = {
  applicant: ApplicationRow & { submitted_at?: string; phone?: string };
  education: Array<Record<string, unknown>>;
  preferences: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  eligibility?: Record<string, unknown> | null;
  selection?: Record<string, unknown> | null;
  offer?: Record<string, unknown> | null;
  conversion?: Record<string, unknown> | null;
  finance?: {
    paymentState: string;
    demandAmount: string;
    amountPaid: string;
    outstandingAmount: string;
    receiptReference?: string | null;
  };
  audit: Array<Record<string, unknown>>;
};

function useAdmissionsDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api<Dashboard>('/api/admissions/dashboard').then(setData).catch((err) => setError(err.message));
  }, []);
  return { data, error };
}

function StatusPill({ value }: { value?: string | null }) {
  return <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{value || 'NONE'}</span>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function AdmissionsDashboardPage() {
  const { data, error } = useAdmissionsDashboard();
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!data) return <div className="text-sm text-slate-500">Loading admissions dashboard...</div>;
  const actionEntries = Object.entries(data.actionRequired);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Admissions Dashboard</h1>
        <p className="text-sm text-slate-500">Live applicant pipeline, action queues, and intake pressure.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actionEntries.map(([key, value]) => (
          <div key={key} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">{key.replace(/([A-Z])/g, ' $1')}</div>
            <div className="mt-2 text-3xl font-semibold text-slate-950">{value}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Panel title="Pipeline">
          <div className="grid gap-2 sm:grid-cols-2">
            {data.pipeline.map((p) => (
              <div key={p.status} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                <span>{p.status.replace(/_/g, ' ')}</span>
                <strong>{p.count}</strong>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Program Intake">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr><th className="py-2">Program</th><th>Intake</th><th>Admitted</th><th>Remaining</th></tr>
              </thead>
              <tbody>
                {data.intake.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="py-2 font-medium">{row.program}</td><td>{row.approvedIntake}</td><td>{row.admitted}</td><td>{row.remaining}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function AdmissionsApplicationsPage({ status }: { status?: string }) {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    api<{ applications: ApplicationRow[] }>(`/api/admissions/applications?${params.toString()}`)
      .then((res) => setRows(res.applications))
      .catch((err) => setError(err.message));
  }, [q, status]);
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Applications</h1>
          <p className="text-sm text-slate-500">Search by application number, name, email, phone, program, status, or payment state.</p>
        </div>
        <label className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 sm:max-w-sm">
          <Search size={16} />
          <input className="w-full bg-transparent text-sm outline-none" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search applications" />
        </label>
      </div>
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-[860px] w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr><th className="p-3">Application</th><th>Name</th><th>Program</th><th>Status</th><th>Payment</th><th>Outstanding</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="p-3 font-medium"><Link className="text-blue-700" to={`/admissions/applications/${row.id}`}>{row.application_number}</Link></td>
                <td>{row.name}<div className="text-xs text-slate-500">{row.email}</div></td>
                <td>{row.program_name || 'Unassigned'}</td>
                <td><StatusPill value={row.status} /></td>
                <td><StatusPill value={row.payment_state || 'NOT_CREATED'} /></td>
                <td>{row.outstanding_amount ?? '0.00'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdmissionsApplicationReviewPage() {
  const { id } = useParams();
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api<Workspace>(`/api/admissions/applications/${id}`).then(setData).catch((err) => setError(err.message));
  }, [id]);
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!data) return <div className="text-sm text-slate-500">Loading application...</div>;
  const finance = data.finance;
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">{data.applicant.name}</h1>
          <p className="text-sm text-slate-500">{data.applicant.application_number} · {data.preferences[0]?.program_name as string || 'Program pending'}</p>
        </div>
        <StatusPill value={data.applicant.status} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Applicant Summary">
          <div className="space-y-2 text-sm"><div>{data.applicant.email}</div><div>{data.applicant.phone || 'No phone'}</div><div>Submitted: {data.applicant.submitted_at || 'Draft'}</div></div>
        </Panel>
        <Panel title="Finance Status">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span>State</span><StatusPill value={finance?.paymentState} />
            <span>Demand</span><strong>{finance?.demandAmount ?? '0.00'}</strong>
            <span>Paid</span><strong>{finance?.amountPaid ?? '0.00'}</strong>
            <span>Outstanding</span><strong>{finance?.outstandingAmount ?? '0.00'}</strong>
          </div>
        </Panel>
        <Panel title="Conversion">
          <div className="text-sm">{data.conversion ? `Student #${data.conversion.student_id}` : 'Not converted'}</div>
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Documents">
          <div className="space-y-2">
            {data.documents.map((doc) => (
              <div key={String(doc.id)} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                <span>{String(doc.file_name)}</span><StatusPill value={String(doc.verification_status)} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Eligibility / Selection / Offer">
          <div className="space-y-2 text-sm">
            <div>Eligibility: <StatusPill value={data.eligibility?.status as string | undefined} /></div>
            <div>Selection: <StatusPill value={data.selection?.status as string | undefined} /></div>
            <div>Offer: <StatusPill value={data.offer?.status as string | undefined} /></div>
          </div>
        </Panel>
      </div>
      <Panel title="Timeline">
        <div className="space-y-2 text-sm">
          {data.audit.map((item) => <div key={String(item.id)} className="rounded-md bg-slate-50 px-3 py-2">{String(item.action)} · {String(item.created_at)}</div>)}
        </div>
      </Panel>
    </div>
  );
}

export function AdmissionsIntakePage() {
  const { data, error } = useAdmissionsDashboard();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-950">Intake & Seats</h1>
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {(data?.intake ?? []).map((row) => (
          <div key={row.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="font-medium">{row.program}</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div><span className="text-slate-500">Intake</span><strong className="block">{row.approvedIntake}</strong></div>
              <div><span className="text-slate-500">Admitted</span><strong className="block">{row.admitted}</strong></div>
              <div><span className="text-slate-500">Left</span><strong className="block">{row.remaining}</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdmissionsReportsPage() {
  return <AdmissionsDashboardPage />;
}

export function ApplicantPortalLoginPage() {
  const { applySession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ applicationNumber: '', email: '', password: '' });
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const result = await api<{ token: string; user: any }>('/api/admissions/portal/login', {
        method: 'POST',
        auth: false,
        body: JSON.stringify(form),
      });
      applySession(result.token, result.user);
      navigate('/applicant');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Applicant Portal</h1>
        <div className="mt-5 space-y-3">
          <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Application number" value={form.applicationNumber} onChange={(e) => setForm({ ...form, applicationNumber: e.target.value })} />
          <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button className="mt-5 w-full rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white">Sign in</button>
      </form>
    </main>
  );
}

export function ApplicantPortalPage() {
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState('');
  const [file, setFile] = useState({ fileName: '', mimeType: 'application/pdf', fileSizeBytes: 1_000, storageKey: '' });
  useEffect(() => {
    api<Workspace>('/api/admissions/portal/application').then(setData).catch((err) => setError(err.message));
  }, []);
  const progress = useMemo(() => {
    const status = data?.applicant.status;
    return ['DRAFT', 'SUBMITTED', 'ELIGIBLE', 'SELECTED', 'OFFERED', 'PAYMENT_PENDING', 'CONVERTED_TO_STUDENT'].indexOf(status || 'DRAFT');
  }, [data]);
  const submitApplication = async () => {
    await api('/api/admissions/portal/application/submit', { method: 'POST' });
    setData(await api<Workspace>('/api/admissions/portal/application'));
  };
  const upload = async (event: FormEvent) => {
    event.preventDefault();
    await api('/api/admissions/portal/application/documents', { method: 'POST', body: JSON.stringify(file) });
    setData(await api<Workspace>('/api/admissions/portal/application'));
  };
  if (error) return <main className="p-4 text-sm text-red-600">{error}</main>;
  if (!data) return <main className="p-4 text-sm text-slate-500">Loading application...</main>;
  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-2xl font-semibold text-slate-950">{data.applicant.name}</h1><p className="text-sm text-slate-500">{data.applicant.application_number}</p></div>
          <StatusPill value={data.applicant.status} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-2 sm:grid-cols-7">
            {['Draft', 'Submitted', 'Eligible', 'Selected', 'Offered', 'Payment', 'Student'].map((label, index) => (
              <div key={label} className={`rounded-md px-3 py-2 text-xs font-medium ${index <= progress ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{label}</div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Application">
            <div className="space-y-2 text-sm">
              <div>Program: {data.preferences[0]?.program_name as string || 'Pending'}</div>
              <div>Email: {data.applicant.email}</div>
              <button onClick={submitApplication} className="mt-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white">Submit application</button>
            </div>
          </Panel>
          <Panel title="Finance">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><IndianRupee size={16} /> State <StatusPill value={data.finance?.paymentState} /></div>
              <div>Demand: {data.finance?.demandAmount ?? '0.00'}</div>
              <div>Paid: {data.finance?.amountPaid ?? '0.00'}</div>
              <div>Outstanding: {data.finance?.outstandingAmount ?? '0.00'}</div>
              {data.conversion ? <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 size={16} /> Student activation is ready.</div> : null}
            </div>
          </Panel>
        </div>
        <Panel title="Documents">
          <form onSubmit={upload} className="mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="File name" value={file.fileName} onChange={(e) => setFile({ ...file, fileName: e.target.value })} />
            <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="MIME type" value={file.mimeType} onChange={(e) => setFile({ ...file, mimeType: e.target.value })} />
            <input className="rounded-md border border-slate-200 px-3 py-2 text-sm" placeholder="Secure storage key" value={file.storageKey} onChange={(e) => setFile({ ...file, storageKey: e.target.value })} />
            <button className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm"><FileUp size={16} /> Upload</button>
          </form>
          <div className="space-y-2">
            {data.documents.map((doc) => (
              <div key={String(doc.id)} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm">
                <span>{String(doc.file_name)}</span><StatusPill value={String(doc.verification_status)} />
              </div>
            ))}
            {!data.documents.length ? <div className="flex items-center gap-2 text-sm text-slate-500"><AlertCircle size={16} /> No documents uploaded yet.</div> : null}
          </div>
        </Panel>
      </div>
    </main>
  );
}
