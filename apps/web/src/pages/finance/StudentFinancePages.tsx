import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CreditCard, FileText, IndianRupee, Receipt, ScrollText, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { Button, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/utils';
import { StatusPill, StudentEmpty, statusToneFor } from '../lms/studentUi';

type FinanceSummary = {
  totalFees: string;
  paid: string;
  outstanding: string;
  nextDueDate: string | null;
};

type Demand = {
  id: number;
  demandNumber: string;
  demandType: string;
  issueDate: string;
  dueDate: string | null;
  netAmount: string;
  paidAmount: string;
  outstandingAmount: string;
  status: string;
  items: Array<{
    feeHeadName: string;
    netAmount: string;
    paidAmount: string;
    outstandingAmount: string;
    dueDate: string | null;
  }>;
};

function formatInr(amount: string) {
  const n = Number(amount);
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function StudentFeesPage() {
  const [data, setData] = useState<{ summary: FinanceSummary; demands: Demand[] } | null>(null);
  useDocumentTitle('Fees & Payments');

  useEffect(() => {
    api<NonNullable<typeof data>>('/api/student/finance').then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;

  const { summary, demands } = data;
  const activeDemands = demands.filter((d) => !['PAID', 'CANCELLED'].includes(d.status));

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Fees & Payments"
        subtitle="View your fee obligations, pay online, and download receipts."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Surface className="p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Total Fees</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{formatInr(summary.totalFees)}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Paid</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-success">{formatInr(summary.paid)}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Outstanding</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-warning">{formatInr(summary.outstanding)}</p>
        </Surface>
      </div>

      {summary.nextDueDate && Number(summary.outstanding) > 0 ? (
        <Surface className="flex flex-wrap items-center justify-between gap-3 border-warning/30 bg-warning-soft/30 p-4">
          <div>
            <p className="text-sm font-medium">Next Due Date</p>
            <p className="text-lg font-semibold">{formatDate(summary.nextDueDate)}</p>
          </div>
          {Number(summary.outstanding) > 0 ? (
            <Link to="/lms/fees/pay">
              <Button>Pay Now</Button>
            </Link>
          ) : null}
        </Surface>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link to="/lms/fees/details" className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm hover:border-border-strong">
          <ScrollText className="h-4 w-4" /> Fee Details
        </Link>
        <Link to="/lms/fees/history" className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm hover:border-border-strong">
          <Receipt className="h-4 w-4" /> Payment History
        </Link>
        <Link to="/lms/fees/scholarships" className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm hover:border-border-strong">
          <IndianRupee className="h-4 w-4" /> Scholarships
        </Link>
        <Link to="/lms/fees/no-due" className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm hover:border-border-strong">
          <ShieldCheck className="h-4 w-4" /> No-Due Status
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Active Demands</h2>
        {activeDemands.length === 0 ? (
          <StudentEmpty title="All clear" body="You have no outstanding fee demands." />
        ) : (
          <div className="space-y-3">
            {activeDemands.map((d) => (
              <Surface key={d.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs text-ink-muted">{d.demandNumber}</p>
                    <p className="font-medium">{d.demandType.replace(/_/g, ' ')}</p>
                    {d.dueDate ? <p className="text-xs text-ink-muted">Due {formatDate(d.dueDate)}</p> : null}
                  </div>
                  <div className="text-right">
                    <StatusPill tone={statusToneFor(d.status)}>{d.status.replace(/_/g, ' ')}</StatusPill>
                    <p className="mt-1 text-lg font-semibold tabular-nums">{formatInr(d.outstandingAmount)}</p>
                    <p className="text-xs text-ink-muted">of {formatInr(d.netAmount)}</p>
                  </div>
                </div>
              </Surface>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function StudentFeeDetailsPage() {
  const [demands, setDemands] = useState<Demand[]>([]);
  useDocumentTitle('Fee Details');

  useEffect(() => {
    api<{ demands: Demand[] }>('/api/student/finance/demands').then((d) => setDemands(d.demands)).catch(() => setDemands([]));
  }, []);

  const rows = demands.flatMap((d) =>
    d.items.map((item) => ({
      demandNumber: d.demandNumber,
      ...item,
      demandStatus: d.status,
    })),
  );

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Fee Details" subtitle="Breakdown by fee head" />
      {rows.length === 0 ? (
        <StudentEmpty title="No fee records" body="Fee details will appear once demands are generated." />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-4 py-3">Fee Head</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="px-4 py-3">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{r.feeHeadName}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatInr(r.netAmount)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatInr(r.paidAmount)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatInr(r.outstandingAmount)}</td>
                  <td className="px-4 py-3">{r.dueDate ? formatDate(r.dueDate) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function StudentPaymentHistoryPage() {
  const [payments, setPayments] = useState<Array<{
    id: number;
    paymentNumber: string;
    amount: string;
    paymentDate: string;
    paymentMethod: string;
    status: string;
  }>>([]);
  const [receipts, setReceipts] = useState<Array<{ id: number; receiptNumber: string; amount: string; receiptDate: string; status: string }>>([]);
  useDocumentTitle('Payment History');

  useEffect(() => {
    Promise.all([
      api<{ payments: typeof payments }>('/api/student/finance/payments'),
      api<{ receipts: typeof receipts }>('/api/student/finance/receipts'),
    ]).then(([p, r]) => {
      setPayments(p.payments);
      setReceipts(r.receipts);
    });
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Payment History" subtitle="All payments and receipts" />
      {payments.length === 0 ? (
        <StudentEmpty title="No payments yet" body="Your payment history will appear here." />
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const receipt = receipts.find((r) => r.receiptDate === p.paymentDate && r.amount === p.amount);
            return (
              <Surface key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-mono text-xs text-ink-muted">{p.paymentNumber}</p>
                  <p className="font-medium tabular-nums">{formatInr(p.amount)}</p>
                  <p className="text-xs text-ink-muted">{formatDate(p.paymentDate)} · {p.paymentMethod.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill tone={statusToneFor(p.status)}>{p.status}</StatusPill>
                  {receipt && receipt.status === 'ISSUED' ? (
                    <Link to={`/lms/fees/receipt/${receipt.id}`}>
                      <Button variant="secondary" size="sm">View Receipt</Button>
                    </Link>
                  ) : null}
                </div>
              </Surface>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StudentPayNowPage() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  useDocumentTitle('Pay Fees');

  useEffect(() => {
    api<{ demands: Demand[] }>('/api/student/finance/demands').then((d) => {
      setDemands(d.demands.filter((x) => !['PAID', 'CANCELLED'].includes(x.status)));
    });
  }, []);

  async function pay() {
    if (!demands.length) return;
    setPaying(true);
    setError('');
    try {
      const order = await api<{ orderId: string; provider: string; paymentId: number }>(
        '/api/student/finance/payments/initiate',
        { method: 'POST', body: JSON.stringify({ demandIds: demands.map((d) => d.id) }) },
      );
      await api('/api/student/finance/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
          provider: order.provider,
          eventId: `mock_${order.orderId}`,
          orderId: order.orderId,
          paymentData: { status: 'success' },
        }),
      });
      window.location.href = '/lms/fees/history';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setPaying(false);
    }
  }

  const total = demands.reduce((acc, d) => acc + Number(d.outstandingAmount), 0);

  return (
    <div className="animate-fade-in max-w-lg space-y-4">
      <PageHeader title="Pay Now" subtitle="Review and confirm payment" />
      <Surface className="space-y-3 p-4">
        {demands.map((d) => (
          <div key={d.id} className="flex justify-between text-sm">
            <span>{d.demandNumber}</span>
            <span className="tabular-nums font-medium">{formatInr(d.outstandingAmount)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-3 font-semibold">
          <span>Total Payable</span>
          <span className="tabular-nums">{formatInr(String(total))}</span>
        </div>
      </Surface>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button onClick={pay} disabled={paying || total <= 0} className="w-full">
        <CreditCard className="mr-2 h-4 w-4" />
        {paying ? 'Processing…' : `Pay ${formatInr(String(total))}`}
      </Button>
      <p className="text-xs text-ink-muted">Payment is verified server-side. Receipt will be generated automatically.</p>
    </div>
  );
}

export function StudentReceiptPage() {
  const [receipt, setReceipt] = useState<{
    receiptNumber: string;
    receiptDate: string;
    amount: string;
    paymentMethod: string;
    transactionReference: string | null;
    outstandingBalance: string;
    status: string;
    snapshot: {
      studentName?: string;
      usn?: string;
      programName?: string;
      semesterLabel?: string;
      collegeName?: string;
      collegeAddress?: string;
    } | null;
    items: Array<{ description: string; amount: string }>;
  } | null>(null);
  const { id } = useParams();
  useDocumentTitle('Receipt');

  useEffect(() => {
    if (!id) return;
    api<NonNullable<typeof receipt>>(`/api/student/finance/receipts/${id}`).then(setReceipt);
  }, [id]);

  if (!receipt) return <Skeleton className="h-40 w-full" />;

  const snap = receipt.snapshot ?? {};

  return (
    <div className="animate-fade-in mx-auto max-w-2xl">
      <div className="mb-4 flex justify-end gap-2 print:hidden">
        <Button variant="secondary" onClick={() => window.print()}>Print Receipt</Button>
        <Link to="/lms/fees/history"><Button variant="secondary">Back</Button></Link>
      </div>
      <Surface className="p-8 print:border-none print:shadow-none">
        {receipt.status === 'VOID' ? (
          <p className="mb-4 text-center text-sm font-semibold uppercase text-danger">VOID</p>
        ) : null}
        <div className="text-center">
          <h1 className="text-lg font-bold">{snap.collegeName ?? 'Institution'}</h1>
          {snap.collegeAddress ? <p className="text-xs text-ink-muted">{snap.collegeAddress}</p> : null}
          <p className="mt-4 text-sm font-semibold uppercase tracking-widest">Fee Receipt</p>
          <p className="font-mono text-sm">{receipt.receiptNumber}</p>
        </div>
        <div className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
          <p><span className="text-ink-muted">Student:</span> {snap.studentName}</p>
          <p><span className="text-ink-muted">USN:</span> {snap.usn}</p>
          <p><span className="text-ink-muted">Program:</span> {snap.programName}</p>
          <p><span className="text-ink-muted">Semester:</span> {snap.semesterLabel}</p>
          <p><span className="text-ink-muted">Date:</span> {formatDate(receipt.receiptDate)}</p>
          <p><span className="text-ink-muted">Mode:</span> {receipt.paymentMethod.replace(/_/g, ' ')}</p>
          {receipt.transactionReference ? (
            <p className="sm:col-span-2"><span className="text-ink-muted">Reference:</span> {receipt.transactionReference}</p>
          ) : null}
        </div>
        <table className="mt-6 w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs uppercase text-ink-muted"><th className="py-2">Fee Head</th><th className="py-2 text-right">Amount</th></tr></thead>
          <tbody>
            {receipt.items.map((item, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-2">{item.description}</td>
                <td className="py-2 text-right tabular-nums">{formatInr(item.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td className="py-3 font-semibold">Total Paid</td><td className="py-3 text-right font-semibold tabular-nums">{formatInr(receipt.amount)}</td></tr>
            <tr><td className="text-ink-muted">Outstanding Balance</td><td className="text-right tabular-nums text-ink-muted">{formatInr(receipt.outstandingBalance)}</td></tr>
          </tfoot>
        </table>
      </Surface>
    </div>
  );
}

export function StudentScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Array<{
    schemeName: string;
    academicYearId: number;
    expectedAmount: string | null;
    sanctionedAmount: string | null;
    receivedAmount: string;
    status: string;
  }>>([]);
  useDocumentTitle('Scholarships');

  useEffect(() => {
    api<{ scholarships: typeof scholarships }>('/api/student/finance/scholarships').then((d) => setScholarships(d.scholarships));
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Scholarships" subtitle="Your scholarship applications and sanctions" />
      {scholarships.length === 0 ? (
        <StudentEmpty title="No scholarships" body="Scholarship records will appear here when assigned." />
      ) : (
        <div className="space-y-3">
          {scholarships.map((s, i) => (
            <Surface key={i} className="p-4">
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-medium">{s.schemeName}</p>
                  {s.sanctionedAmount ? <p className="text-sm tabular-nums">Sanctioned: {formatInr(s.sanctionedAmount)}</p> : null}
                  {s.receivedAmount && Number(s.receivedAmount) > 0 ? (
                    <p className="text-sm tabular-nums text-success">Received: {formatInr(s.receivedAmount)}</p>
                  ) : null}
                </div>
                <StatusPill tone={statusToneFor(s.status)}>{s.status}</StatusPill>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}

export function StudentNoDuePage() {
  const [data, setData] = useState<{
    domains: Array<{ domain: string; label: string; status: string }>;
    overallClear: boolean;
  } | null>(null);
  useDocumentTitle('No-Due Status');

  useEffect(() => {
    api<NonNullable<typeof data>>('/api/student/finance/no-due').then(setData);
  }, []);

  const tone = (status: string) => {
    if (status === 'CLEAR' || status === 'WAIVED') return 'success' as const;
    if (status === 'DUE') return 'danger' as const;
    if (status === 'PENDING_INTEGRATION') return 'warning' as const;
    return 'muted' as const;
  };

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="No-Due Status" subtitle="Clearance status across departments" />
      {!data ? <Skeleton className="h-32" /> : (
        <>
          <Surface className={`p-4 ${data.overallClear ? 'border-success/30 bg-success-soft/20' : 'border-warning/30 bg-warning-soft/20'}`}>
            <p className="font-semibold">{data.overallClear ? 'Overall Clear' : 'Clearance Pending'}</p>
            <p className="text-sm text-ink-muted">Finance clearance is live. Other modules integrate as they become available.</p>
          </Surface>
          <div className="space-y-2">
            {data.domains.map((d) => (
              <Surface key={d.domain} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-ink-muted" />
                  <span className="font-medium">{d.label}</span>
                </div>
                <StatusPill tone={tone(d.status)}>
                  {d.status === 'PENDING_INTEGRATION' ? 'Pending Integration' : d.status.replace(/_/g, ' ')}
                </StatusPill>
              </Surface>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
