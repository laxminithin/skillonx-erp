import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, EmptyState, Field, FilterChip, Input, PageHeader, Skeleton, Surface, Textarea } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/utils';
import { StatusPill, statusToneFor } from '../lms/studentUi';

function formatInr(amount: string | number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount));
}

function useFinanceBasePath() {
  const path = useLocation().pathname;
  if (path.startsWith('/accountant')) return '/accountant';
  if (path.startsWith('/admin/finance')) return '/admin/finance';
  return '/finance';
}

export function FinanceDashboardPage() {
  const basePath = useFinanceBasePath();
  const [data, setData] = useState<{
    expectedCollection: string;
    collected: string;
    outstanding: string;
    todayCollection: string;
    overdueAmount: string;
    scholarshipReceivable: string;
    refundPending: string;
    todayByMode: Array<{ method: string; amount: string }>;
    actionRequired?: Array<{ label: string; count: number }>;
    recentTransactions?: Array<{
      id: number;
      paymentNumber: string;
      studentName: string;
      usn: string;
      amount: string;
      paymentDate: string;
      paymentMethod: string;
      status: string;
    }>;
  } | null>(null);
  useDocumentTitle('Finance Dashboard');

  useEffect(() => {
    api<NonNullable<typeof data>>('/api/finance/dashboard').then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;

  const cards = [
    { label: 'Expected Collection', value: data.expectedCollection },
    { label: 'Collected', value: data.collected, tone: 'text-success' },
    { label: 'Outstanding', value: data.outstanding, tone: 'text-warning' },
    { label: "Today's Collection", value: data.todayCollection },
    { label: 'Overdue', value: data.overdueAmount, tone: 'text-danger' },
    { label: 'Scholarship Receivable', value: data.scholarshipReceivable },
    { label: 'Refund Pending', value: data.refundPending },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Finance Dashboard" subtitle="Collection overview and key metrics" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Surface key={c.label} className="min-w-0 p-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted">{c.label}</p>
            <p className={`mt-1 text-xl font-semibold tabular-nums ${c.tone ?? ''}`}>{formatInr(c.value)}</p>
          </Surface>
        ))}
      </div>
      {data.todayByMode.length > 0 ? (
        <Surface className="min-w-0 p-4">
          <h2 className="mb-3 text-sm font-semibold">Today by Payment Mode</h2>
          <div className="flex flex-wrap gap-4">
            {data.todayByMode.map((m) => (
              <div key={m.method}>
                <p className="text-xs text-ink-muted">{m.method.replace(/_/g, ' ')}</p>
                <p className="font-semibold tabular-nums">{formatInr(m.amount)}</p>
              </div>
            ))}
          </div>
        </Surface>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <Surface className="min-w-0 p-4">
          <h2 className="mb-3 text-sm font-semibold">Action Required</h2>
          <div className="space-y-2">
            {(data.actionRequired ?? []).map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-[var(--radius-md)] bg-surface-muted px-3 py-2">
                <span className="text-sm text-ink-secondary">{item.label}</span>
                <span className="font-semibold tabular-nums">{item.count}</span>
              </div>
            ))}
          </div>
        </Surface>
        <Surface className="min-w-0 p-4">
          <h2 className="mb-3 text-sm font-semibold">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-ink-muted">
                <tr><th className="py-2">Payment</th><th className="py-2">Student</th><th className="py-2 text-right">Amount</th><th className="py-2">Status</th></tr>
              </thead>
              <tbody>
                {(data.recentTransactions ?? []).map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="py-2 font-mono text-xs">{p.paymentNumber}</td>
                    <td className="py-2">{p.studentName}<p className="text-xs text-ink-muted">{p.usn}</p></td>
                    <td className="py-2 text-right tabular-nums">{formatInr(p.amount)}</td>
                    <td className="py-2"><StatusPill tone={statusToneFor(p.status)}>{p.status}</StatusPill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to={`${basePath}/fee-structures`}><Button variant="secondary">Fee Structures</Button></Link>
        <Link to={`${basePath}/students`}><Button variant="secondary">Student Accounts</Button></Link>
        <Link to={`${basePath}/payments`}><Button variant="secondary">Payments</Button></Link>
        <Link to={`${basePath}/receipts`}><Button variant="secondary">Receipts</Button></Link>
        <Link to={`${basePath}/reports`}><Button variant="secondary">Reports</Button></Link>
      </div>
    </div>
  );
}

export function FinanceFeeStructuresPage() {
  const [structures, setStructures] = useState<Array<{
    id: number;
    name: string;
    code: string;
    status: string;
    programName: string | null;
    semesterLabel: string | null;
    academicYearLabel: string | null;
  }>>([]);
  useDocumentTitle('Fee Structures');

  useEffect(() => {
    api<{ structures: typeof structures }>('/api/finance/fee-structures').then((d) => setStructures(d.structures));
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Fee Structures" subtitle="Program and semester fee schedules" />
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Program</th>
              <th className="px-4 py-3">Semester</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {structures.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{s.code}</td>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{s.programName ?? '—'}</td>
                <td className="px-4 py-3">{s.semesterLabel ?? '—'}</td>
                <td className="px-4 py-3">{s.academicYearLabel ?? '—'}</td>
                <td className="px-4 py-3"><StatusPill tone={statusToneFor(s.status)}>{s.status}</StatusPill></td>
                <td className="px-4 py-3">
                  {s.status === 'DRAFT' ? (
                    <Button size="sm" variant="secondary" onClick={async () => {
                      await api(`/api/finance/fee-structures/${s.id}/activate`, { method: 'POST' });
                      window.location.reload();
                    }}>Activate</Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FinancePaymentsPage() {
  const [payments, setPayments] = useState<Array<{
    id: number;
    paymentNumber: string;
    studentName: string;
    usn: string;
    amount: string;
    paymentDate: string;
    paymentMethod: string;
    status: string;
  }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  useDocumentTitle('Payments');

  useEffect(() => {
    api<{ payments: typeof payments }>('/api/finance/payments').then((d) => setPayments(d.payments));
  }, []);

  async function recordPayment() {
    await api('/api/finance/payments/manual', {
      method: 'POST',
      body: JSON.stringify({
        studentId: Number(studentId),
        amount: Number(amount),
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: method,
      }),
    });
    setShowForm(false);
    const d = await api<{ payments: typeof payments }>('/api/finance/payments');
    setPayments(d.payments);
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title="Payments"
        subtitle="Record and review student payments"
        actions={<Button onClick={() => setShowForm(!showForm)}>Record Payment</Button>}
      />
      {showForm ? (
        <Surface className="grid gap-3 p-4 sm:grid-cols-2">
          <Input placeholder="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
          <Input placeholder="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
            {['CASH', 'UPI', 'CARD', 'CHEQUE', 'DD', 'BANK_TRANSFER', 'NET_BANKING'].map((m) => (
              <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <Button onClick={recordPayment}>Save Payment</Button>
        </Surface>
      ) : null}
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Payment #</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">USN</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{p.paymentNumber}</td>
                <td className="px-4 py-3">{p.studentName}</td>
                <td className="px-4 py-3">{p.usn}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatInr(p.amount)}</td>
                <td className="px-4 py-3">{formatDate(p.paymentDate)}</td>
                <td className="px-4 py-3">{p.paymentMethod.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3"><StatusPill tone={statusToneFor(p.status)}>{p.status}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FinanceReceiptsPage() {
  const [receipts, setReceipts] = useState<Array<{
    id: number;
    receiptNumber: string;
    amount: string;
    receiptDate: string;
    paymentMethod: string;
    status: string;
  }>>([]);
  useDocumentTitle('Receipts');

  useEffect(() => {
    api<{ receipts: typeof receipts }>('/api/finance/receipts').then((d) => setReceipts(d.receipts));
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Receipts" subtitle="Issued fee receipts" />
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Receipt #</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((r) => (
              <tr key={r.id} className={`border-t border-border ${r.status === 'VOID' ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3 font-mono text-xs">{r.receiptNumber}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatInr(r.amount)}</td>
                <td className="px-4 py-3">{formatDate(r.receiptDate)}</td>
                <td className="px-4 py-3">{r.paymentMethod.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3"><StatusPill tone={r.status === 'VOID' ? 'danger' : 'success'}>{r.status}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FinanceReportsPage() {
  const [outstanding, setOutstanding] = useState<Array<{
    studentName: string;
    usn: string;
    outstanding: string;
    dueDate: string;
    status: string;
  }>>([]);
  const [daily, setDaily] = useState<{ grandTotal: string; totalsByMode: Array<{ method: string; amount: string }> } | null>(null);
  useDocumentTitle('Finance Reports');

  useEffect(() => {
    Promise.all([
      api<{ studentName: string; usn: string; outstanding: string; dueDate: string; status: string }[]>('/api/finance/reports/outstanding'),
      api<NonNullable<typeof daily>>('/api/finance/reports/daily-collection'),
    ]).then(([o, d]) => {
      setOutstanding(o);
      setDaily(d);
    });
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Reports" subtitle="Collection and outstanding summaries" />
      {daily ? (
        <Surface className="p-4">
          <h2 className="mb-2 font-semibold">Daily Collection — {formatDate(new Date().toISOString().slice(0, 10))}</h2>
          <p className="text-2xl font-semibold tabular-nums">{formatInr(daily.grandTotal)}</p>
          <div className="mt-3 flex flex-wrap gap-4">
            {daily.totalsByMode.map((m) => (
              <div key={m.method}><p className="text-xs text-ink-muted">{m.method}</p><p className="font-medium tabular-nums">{formatInr(m.amount)}</p></div>
            ))}
          </div>
        </Surface>
      ) : null}
      <Surface className="p-4">
        <h2 className="mb-3 font-semibold">Outstanding Students</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-ink-muted">
              <tr><th className="py-2">Student</th><th className="py-2">USN</th><th className="py-2 text-right">Outstanding</th><th className="py-2">Due</th><th className="py-2">Status</th></tr>
            </thead>
            <tbody>
              {outstanding.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-2">{r.studentName}</td>
                  <td className="py-2">{r.usn}</td>
                  <td className="py-2 text-right tabular-nums">{formatInr(r.outstanding)}</td>
                  <td className="py-2">{r.dueDate ? formatDate(r.dueDate) : '—'}</td>
                  <td className="py-2"><StatusPill tone={statusToneFor(r.status)}>{r.status}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}

export function FinanceRefundsPage() {
  const [refunds, setRefunds] = useState<Array<{ id: number; studentName: string; usn: string; amount: string; reasonCode: string; status: string; createdAt: string }>>([]);
  useDocumentTitle('Refunds');

  useEffect(() => {
    api<{ refunds: typeof refunds }>('/api/finance/refunds').then((d) => setRefunds(d.refunds));
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Refunds" subtitle="Requested, approved, and processed refunds" />
      <FinanceSimpleTable
        headers={['Student', 'USN', 'Reason', 'Amount', 'Requested', 'Status']}
        rows={refunds.map((r) => [r.studentName, r.usn, r.reasonCode.replace(/_/g, ' '), formatInr(r.amount), formatDate(r.createdAt), r.status])}
      />
    </div>
  );
}

export function FinanceScholarshipsPage() {
  const [rows, setRows] = useState<Array<{ id: number; studentName: string; usn: string; schemeName: string; expectedAmount: string; sanctionedAmount: string | null; status: string }>>([]);
  useDocumentTitle('Scholarships');

  useEffect(() => {
    api<{ scholarships: typeof rows }>('/api/finance/scholarships').then((d) => setRows(d.scholarships));
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Scholarships" subtitle="Student scholarship tracking and sanctioned receivables" />
      <FinanceSimpleTable
        headers={['Student', 'USN', 'Scheme', 'Expected', 'Sanctioned', 'Status']}
        rows={rows.map((r) => [r.studentName, r.usn, r.schemeName, formatInr(r.expectedAmount), r.sanctionedAmount ? formatInr(r.sanctionedAmount) : '-', r.status])}
      />
    </div>
  );
}

type StaffApplication = {
  id: number;
  studentName: string;
  usn: string;
  schemeName: string;
  benefitType: string;
  status: string;
  eligibilityStatus: string;
  requestedAmount: string | null;
  sanctionedAmount: string | null;
  submittedAt: string | null;
  internalRemarks?: string | null;
  studentScholarshipId?: number | null;
};

const APPLICATION_STATUS_FILTERS = ['SUBMITTED', 'UNDER_VERIFICATION', 'VERIFIED', 'APPROVED', 'SANCTIONED', 'RETURNED', 'COMPLETED', 'REJECTED'];

export function FinanceScholarshipApplicationsPage() {
  const basePath = useFinanceBasePath();
  const [status, setStatus] = useState('SUBMITTED');
  const [rows, setRows] = useState<StaffApplication[]>([]);
  useDocumentTitle('Scholarship Applications');

  function load() {
    api<{ applications: StaffApplication[] }>(`/api/finance/scholarship-applications?status=${status}`).then((d) => setRows(d.applications));
  }

  useEffect(load, [status]);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Scholarship Applications" subtitle="Verify, approve, and sanction student scholarship applications" />
      <div className="flex flex-wrap gap-2">
        {APPLICATION_STATUS_FILTERS.map((s) => (
          <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>
            {s.replace(/_/g, ' ')}
          </FilterChip>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No applications" body={`No applications are currently ${status.replace(/_/g, ' ').toLowerCase()}.`} />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Link
              key={r.id}
              to={`${basePath}/scholarship-applications/${r.id}`}
              className="block rounded-[var(--radius-lg)] border border-border bg-surface p-4 hover:border-border-strong"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{r.studentName} · {r.usn}</p>
                  <p className="text-sm text-ink-muted">{r.schemeName} ({r.benefitType.replace(/_/g, ' ')})</p>
                </div>
                <div className="text-right">
                  <StatusPill tone={statusToneFor(r.status)}>{r.status.replace(/_/g, ' ')}</StatusPill>
                  <p className="mt-1 text-xs text-ink-muted">Eligibility: {r.eligibilityStatus.replace(/_/g, ' ')}</p>
                  {r.requestedAmount ? <p className="text-sm tabular-nums">Requested: {formatInr(r.requestedAmount)}</p> : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function FinanceScholarshipApplicationDetailPage() {
  const { id } = useParams();
  const basePath = useFinanceBasePath();
  const [app, setApp] = useState<StaffApplication | null>(null);
  const [documents, setDocuments] = useState<Array<{ id: number; category: string; originalFilename: string; status: string }>>([]);
  const [remarks, setRemarks] = useState('');
  const [amount, setAmount] = useState('');
  const [evidence, setEvidence] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useDocumentTitle('Application Detail');

  function load() {
    if (!id) return;
    api<StaffApplication>(`/api/finance/scholarship-applications/${id}`).then(setApp);
    api<{ documents: typeof documents }>(`/api/finance/scholarship-applications/${id}/documents`).then((d) => setDocuments(d.documents));
  }

  useEffect(load, [id]);

  async function act(action: string, body?: Record<string, unknown>) {
    if (!id) return;
    setBusy(true);
    setError('');
    try {
      await api(`/api/finance/scholarship-applications/${id}/${action}`, { method: 'POST', body: JSON.stringify(body ?? {}) });
      setRemarks('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  if (!app) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader title={`${app.studentName} · ${app.usn}`} subtitle={app.schemeName} />
        <Link to={`${basePath}/scholarship-applications`}><Button variant="secondary" size="sm">Back to queue</Button></Link>
      </div>

      <Surface className="space-y-2 p-4">
        <div className="flex justify-between"><span className="text-ink-muted">Status</span><StatusPill tone={statusToneFor(app.status)}>{app.status.replace(/_/g, ' ')}</StatusPill></div>
        <div className="flex justify-between"><span className="text-ink-muted">Eligibility</span><span>{app.eligibilityStatus.replace(/_/g, ' ')}</span></div>
        {app.requestedAmount ? <div className="flex justify-between"><span className="text-ink-muted">Requested</span><span className="tabular-nums">{formatInr(app.requestedAmount)}</span></div> : null}
        {app.sanctionedAmount ? <div className="flex justify-between"><span className="text-ink-muted">Sanctioned</span><span className="tabular-nums">{formatInr(app.sanctionedAmount)}</span></div> : null}
        {app.internalRemarks ? <p className="text-sm text-ink-muted">Notes: {app.internalRemarks}</p> : null}
      </Surface>

      <Surface className="p-4">
        <h2 className="mb-3 font-semibold">Evidence Documents</h2>
        {documents.length === 0 ? (
          <p className="text-sm text-ink-muted">No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {documents.map((d) => (
              <li key={d.id} className="flex justify-between">
                <span>{d.category.replace(/_/g, ' ')}: {d.originalFilename}</span>
                <span className="text-ink-muted">{d.status}</span>
              </li>
            ))}
          </ul>
        )}
      </Surface>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Surface className="space-y-3 p-4">
        <h2 className="font-semibold">Actions</h2>
        <Textarea placeholder="Remarks (required to return or reject)" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
        <div className="flex flex-wrap gap-2">
          {app.status === 'SUBMITTED' ? (
            <Button disabled={busy} onClick={() => act('start-verification')}>Start Verification</Button>
          ) : null}
          {app.status === 'UNDER_VERIFICATION' ? (
            <>
              <Button disabled={busy} onClick={() => act('verify', { remarks })}>Mark Verified</Button>
              <Button disabled={busy} variant="secondary" onClick={() => act('return', { remarks })}>Return to Student</Button>
            </>
          ) : null}
          {app.status === 'VERIFIED' ? (
            <Button disabled={busy} onClick={() => act('approve', { remarks })}>Approve</Button>
          ) : null}
          {['SUBMITTED', 'UNDER_VERIFICATION', 'VERIFIED'].includes(app.status) ? (
            <Button disabled={busy} variant="secondary" onClick={() => act('reject', { remarks })}>Reject</Button>
          ) : null}
        </div>

        {app.status === 'APPROVED' ? (
          <div className="flex items-end gap-2 border-t border-border pt-3">
            <Field label="Sanctioned Amount">
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Button disabled={busy || !amount} onClick={() => act('sanction', { sanctionedAmount: Number(amount) })}>Sanction</Button>
          </div>
        ) : null}

        {app.status === 'SANCTIONED' ? (
          <div className="flex items-end gap-2 border-t border-border pt-3">
            <Field label="Evidence Reference (e.g. DBT transaction ID)">
              <Input value={evidence} onChange={(e) => setEvidence(e.target.value)} />
            </Field>
            <Button disabled={busy || !evidence} onClick={() => act('complete', { evidenceReference: evidence })}>Mark Completed</Button>
          </div>
        ) : null}

        {!['REJECTED', 'WITHDRAWN', 'CANCELLED', 'COMPLETED'].includes(app.status) ? (
          <Button disabled={busy} variant="secondary" onClick={() => act('cancel', { remarks: remarks || 'Cancelled by staff' })}>Cancel Application</Button>
        ) : null}
      </Surface>
    </div>
  );
}

export function FinanceReconciliationPage() {
  const [data, setData] = useState<{
    gatewayOrders: Array<{ orderId: string; provider: string; paymentNumber: string; studentName: string; usn: string; amount: string; status: string; createdAt: string }>;
    failedPayments: Array<{ paymentNumber: string; studentName: string; usn: string; amount: string; paymentMethod: string; transactionReference: string | null }>;
    duplicatedReferences: Array<{ transactionReference: string; count: number }>;
  } | null>(null);
  useDocumentTitle('Reconciliation');

  useEffect(() => {
    api<NonNullable<typeof data>>('/api/finance/reconciliation').then(setData);
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Reconciliation" subtitle="Gateway exceptions, failed payments, and duplicate references" />
      <Surface className="p-4">
        <h2 className="mb-3 font-semibold">Gateway Exceptions</h2>
        <FinanceSimpleTable
          headers={['Order', 'Provider', 'Student', 'USN', 'Amount', 'Status']}
          rows={data.gatewayOrders.map((g) => [g.orderId, g.provider, g.studentName, g.usn, formatInr(g.amount), g.status])}
        />
      </Surface>
      <Surface className="p-4">
        <h2 className="mb-3 font-semibold">Failed Payments</h2>
        <FinanceSimpleTable
          headers={['Payment', 'Student', 'USN', 'Mode', 'Amount', 'Reference']}
          rows={data.failedPayments.map((p) => [p.paymentNumber, p.studentName, p.usn, p.paymentMethod.replace(/_/g, ' '), formatInr(p.amount), p.transactionReference ?? '-'])}
        />
      </Surface>
      <Surface className="p-4">
        <h2 className="mb-3 font-semibold">Duplicate References</h2>
        <FinanceSimpleTable
          headers={['Reference', 'Count']}
          rows={data.duplicatedReferences.map((r) => [r.transactionReference, String(r.count)])}
        />
      </Surface>
    </div>
  );
}

export function FinanceStudentDetailPage() {
  const { studentId } = useParams();
  const [data, setData] = useState<{
    student: { name: string; usn: string; programName: string };
    summary: { totalFees: string; paid: string; outstanding: string };
    demands: Array<Record<string, string>>;
    payments: Array<Record<string, string>>;
    receipts: Array<Record<string, string>>;
    scholarships: Array<Record<string, string>>;
    concessions: Array<Record<string, string>>;
    refunds: Array<Record<string, string>>;
    noDue: { status: string; domains: Array<{ domain: string; status: string; outstandingAmount?: string; message?: string }> };
    auditHistory: Array<{ action: string; entityType: string; entityId: number; createdAt: string }>;
  } | null>(null);
  useDocumentTitle('Student Finance');

  useEffect(() => {
    if (!studentId) return;
    api<NonNullable<typeof data>>(`/api/finance/students/${studentId}`).then(setData);
  }, [studentId]);

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title={data.student.name} subtitle={`${data.student.usn} · ${data.student.programName}`} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Surface className="p-4"><p className="text-xs text-ink-muted">Total</p><p className="text-xl font-semibold tabular-nums">{formatInr(data.summary.totalFees)}</p></Surface>
        <Surface className="p-4"><p className="text-xs text-ink-muted">Paid</p><p className="text-xl font-semibold tabular-nums text-success">{formatInr(data.summary.paid)}</p></Surface>
        <Surface className="p-4"><p className="text-xs text-ink-muted">Outstanding</p><p className="text-xl font-semibold tabular-nums text-warning">{formatInr(data.summary.outstanding)}</p></Surface>
      </div>
      <Surface className="p-4">
        <h2 className="mb-3 font-semibold">No-Due Status</h2>
        <div className="flex flex-wrap gap-2">
          {data.noDue.domains.map((d) => (
            <StatusPill key={d.domain} tone={statusToneFor(d.status)}>{d.domain}: {d.status}</StatusPill>
          ))}
        </div>
      </Surface>
      <LedgerSection title="Demands" headers={['Demand', 'Total', 'Paid', 'Outstanding', 'Due', 'Status']} rows={data.demands.map((d) => [String(d.demandNumber ?? '-'), formatInr(String(d.netAmount ?? d.totalDemand ?? 0)), formatInr(String(d.paidAmount ?? d.paid ?? 0)), formatInr(String(d.outstandingAmount ?? d.outstanding ?? 0)), d.dueDate ? formatDate(String(d.dueDate)) : '-', String(d.status ?? '-')])} />
      <LedgerSection title="Payments" headers={['Payment', 'Date', 'Mode', 'Amount', 'Status']} rows={data.payments.map((p) => [String(p.paymentNumber ?? '-'), p.paymentDate ? formatDate(String(p.paymentDate)) : '-', String(p.paymentMethod ?? '-').replace(/_/g, ' '), formatInr(String(p.amount ?? 0)), String(p.status ?? '-')])} />
      <LedgerSection title="Receipts" headers={['Receipt', 'Date', 'Mode', 'Amount', 'Status']} rows={data.receipts.map((r) => [String(r.receiptNumber ?? '-'), r.receiptDate ? formatDate(String(r.receiptDate)) : '-', String(r.paymentMethod ?? '-').replace(/_/g, ' '), formatInr(String(r.amount ?? 0)), String(r.status ?? '-')])} />
      <LedgerSection title="Scholarships & Concessions" headers={['Type', 'Reference', 'Amount', 'Status']} rows={[
        ...data.scholarships.map((s) => ['Scholarship', String(s.schemeName ?? '-'), formatInr(String(s.sanctionedAmount ?? s.expectedAmount ?? 0)), String(s.status ?? '-')]),
        ...data.concessions.map((c) => ['Concession', String(c.concessionType ?? '-'), c.amount ? formatInr(String(c.amount)) : `${String(c.percentage ?? 0)}%`, String(c.status ?? '-')]),
      ]} />
      <LedgerSection title="Refunds" headers={['Reason', 'Amount', 'Status', 'Created']} rows={data.refunds.map((r) => [String(r.reasonCode ?? '-'), formatInr(String(r.amount ?? 0)), String(r.status ?? '-'), r.createdAt ? formatDate(String(r.createdAt)) : '-'])} />
      <LedgerSection title="Audit History" headers={['Action', 'Entity', 'When']} rows={data.auditHistory.map((a) => [a.action, `${a.entityType} #${a.entityId}`, formatDate(a.createdAt)])} />
    </div>
  );
}

export function FinanceStudentSearchPage() {
  const basePath = useFinanceBasePath();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Array<{ studentId: number; name: string; usn: string; outstanding: string }>>([]);
  useDocumentTitle('Search Students');

  async function search() {
    const d = await api<{ students: typeof results }>(`/api/finance/students/search?q=${encodeURIComponent(q)}`);
    setResults(d.students);
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Student Search" subtitle="Find students by USN, name, or email" />
      <div className="flex gap-2">
        <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} />
        <Button onClick={search}>Search</Button>
      </div>
      <div className="space-y-2">
        {results.map((s) => (
          <Link key={s.studentId} to={`${basePath}/students/${s.studentId}`} className="block rounded-[var(--radius-lg)] border border-border bg-surface p-4 hover:border-border-strong">
            <div className="flex justify-between">
              <div><p className="font-medium">{s.name}</p><p className="text-sm text-ink-muted">{s.usn}</p></div>
              <p className="tabular-nums font-semibold">{formatInr(s.outstanding)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function LedgerSection({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <Surface className="p-4">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <FinanceSimpleTable headers={headers} rows={rows} />
    </Surface>
  );
}

function FinanceSimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
          <tr>{headers.map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, i) => (
            <tr key={i} className="border-t border-border">
              {row.map((cell, ci) => <td key={`${i}-${ci}`} className="px-3 py-2">{cell}</td>)}
            </tr>
          )) : (
            <tr><td className="px-3 py-6 text-center text-ink-muted" colSpan={headers.length}>No records</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
