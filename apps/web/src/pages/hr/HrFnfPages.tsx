/**
 * HRMS Final Settlement / Full & Final — HR, HOD clearance, employee self-service.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Input, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

type Dash = {
  pendingCases: number;
  clearancePending: number;
  readyForCalculation: number;
  calculated: number;
  awaitingApproval: number;
  awaitingFinancePosting: number;
  settled: number;
  onHold: number;
  netPayables: string | null;
  netRecoverables: string | null;
};

type CaseRow = {
  id: number;
  caseNumber: string;
  status: string;
  separationType?: string;
  lastWorkingDate?: string;
  financePostingStatus?: string;
  employeeName?: string;
  employeeNumber?: string;
  netAmount?: string;
  settlementDirection?: string;
};

type Clearance = {
  id: number;
  domain: string;
  status: string;
  sourceModule?: string;
  dueAmount?: string;
  blocking: boolean;
  remarks?: string | null;
};

type Component = {
  id: number;
  side: string;
  code: string;
  name: string;
  source: string;
  basis?: string;
  quantity?: number | null;
  rate?: string | null;
  amount: string;
};

function money(n: number | string | null | undefined) {
  if (n == null || n === '') return '—';
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusPill({ value }: { value: string }) {
  return (
    <span className="inline-block rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide bg-surface-muted text-ink">
      {value}
    </span>
  );
}

function FnFNav() {
  return (
    <div className="flex flex-wrap gap-2">
      <Link to="/hr/fnf"><Button variant="secondary" size="sm">Dashboard</Button></Link>
      <Link to="/hr/fnf/cases"><Button variant="secondary" size="sm">Cases</Button></Link>
      <Link to="/hr/fnf/clearance"><Button variant="secondary" size="sm">Clearance</Button></Link>
      <Link to="/hr/fnf/approvals"><Button variant="secondary" size="sm">Approvals</Button></Link>
      <Link to="/hr/fnf/finance"><Button variant="secondary" size="sm">Finance Posting</Button></Link>
      <Link to="/hr/fnf/documents"><Button variant="secondary" size="sm">Documents</Button></Link>
      <Link to="/hr/fnf/reports"><Button variant="secondary" size="sm">Reports</Button></Link>
    </div>
  );
}

export function HrFnfDashboardPage() {
  const [dash, setDash] = useState<Dash | null>(null);
  useDocumentTitle('Final Settlement');
  useEffect(() => {
    api<Dash>('/api/hr/fnf/dashboard').then(setDash).catch(() => setDash(null));
  }, []);
  if (!dash) return <Skeleton className="h-40 w-full" />;
  const cards = [
    { label: 'Pending Cases', value: dash.pendingCases },
    { label: 'Clearance Pending', value: dash.clearancePending },
    { label: 'Ready for Calculation', value: dash.readyForCalculation },
    { label: 'Awaiting Approval', value: dash.awaitingApproval },
    { label: 'Awaiting Finance Posting', value: dash.awaitingFinancePosting },
    { label: 'Settled', value: dash.settled },
    { label: 'On Hold', value: dash.onHold },
    { label: 'Net Payables', value: dash.netPayables != null ? money(dash.netPayables) : '—' },
    { label: 'Net Recoverables', value: dash.netRecoverables != null ? money(dash.netRecoverables) : '—' },
  ];
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Final Settlement" subtitle="Separation closure, clearance, calculation and Finance handoff" />
      <FnFNav />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Surface key={c.label} className="p-4">
            <p className="text-xs uppercase text-ink-muted">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</p>
          </Surface>
        ))}
      </div>
    </div>
  );
}

export function HrFnfCasesPage() {
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [sepId, setSepId] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useDocumentTitle('F&F Cases');
  const load = useCallback(() => {
    api<CaseRow[]>('/api/hr/fnf/cases').then(setRows).catch(() => setRows([]));
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Settlement Cases" actions={<FnFNav />} />
      <Surface className="flex flex-wrap items-end gap-2 p-4">
        <div>
          <p className="text-xs text-ink-muted">Separation request ID</p>
          <Input value={sepId} onChange={(e) => setSepId(e.target.value)} className="w-40" />
        </div>
        <Button
          disabled={busy || !sepId}
          onClick={async () => {
            setBusy(true);
            try {
              const created = await api<{ id: number }>('/api/hr/fnf/cases', {
                method: 'POST',
                body: JSON.stringify({ separationRequestId: Number(sepId) }),
              });
              navigate(`/hr/fnf/cases/${created.id}`);
            } catch {
              setBusy(false);
            }
          }}
        >
          Create case
        </Button>
      </Surface>
      <div className="hidden overflow-x-auto rounded border border-border md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Case</th>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">LWD</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Net</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link className="font-mono text-xs underline" to={`/hr/fnf/cases/${r.id}`}>{r.caseNumber}</Link>
                </td>
                <td className="px-4 py-3">{r.employeeName}<div className="text-xs text-ink-muted">{r.employeeNumber}</div></td>
                <td className="px-4 py-3">{r.lastWorkingDate ? String(r.lastWorkingDate).slice(0, 10) : '—'}</td>
                <td className="px-4 py-3"><StatusPill value={r.status} /></td>
                <td className="px-4 py-3 tabular-nums">{money(r.netAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((r) => (
          <Surface key={r.id} className="p-4">
            <Link className="font-mono text-xs underline" to={`/hr/fnf/cases/${r.id}`}>{r.caseNumber}</Link>
            <p className="mt-1 font-medium">{r.employeeName}</p>
            <p className="text-xs text-ink-muted">{r.lastWorkingDate ? String(r.lastWorkingDate).slice(0, 10) : '—'}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <StatusPill value={r.status} />
              <span className="tabular-nums text-sm">{money(r.netAmount)}</span>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

export function HrFnfCaseDetailPage() {
  const { id } = useParams();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [reason, setReason] = useState('');
  useDocumentTitle('Settlement case');
  const load = useCallback(() => {
    if (!id) return;
    api<Record<string, unknown>>(`/api/hr/fnf/cases/${id}`).then(setData).catch(() => setData(null));
  }, [id]);
  useEffect(() => { load(); }, [load]);
  async function act(path: string, body?: unknown) {
    await api(`/api/hr/fnf/cases/${id}/${path}`, {
      method: 'POST',
      body: body ? JSON.stringify(body) : '{}',
    });
    load();
  }
  if (!data) return <Skeleton className="h-40 w-full" />;
  const clearances = (data.clearances as Clearance[]) ?? [];
  const payables = (data.payables as Component[]) ?? [];
  const recoveries = (data.recoveries as Component[]) ?? [];
  const tabs = ['overview', 'separation', 'clearance', 'payables', 'recoveries', 'calculation', 'approvals', 'finance', 'documents', 'audit'];
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title={String(data.caseNumber ?? 'Case')}
        subtitle={`${data.employeeName ?? ''} · ${data.employeeNumber ?? ''}`}
        actions={<Link to="/hr/fnf/cases"><Button variant="secondary">All cases</Button></Link>}
      />
      <div className="flex flex-wrap gap-2">
        <StatusPill value={String(data.status)} />
        <span className="text-sm text-ink-muted">LWD {String(data.lastWorkingDate ?? '—').slice(0, 10)}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => act('sync')}>Sync sources</Button>
        <Button size="sm" onClick={() => act('calculate')}>Calculate</Button>
        <Button size="sm" onClick={() => act('review')}>Submit review</Button>
        <Button size="sm" onClick={() => act('approve')}>Approve</Button>
        <Button size="sm" onClick={() => act('post')}>Post to Finance</Button>
        <Button size="sm" onClick={() => act('settle')}>Mark settled</Button>
        <Button size="sm" onClick={() => act('close')}>Close</Button>
        <Button size="sm" onClick={() => act('documents')}>Release documents</Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t}
            className={`min-h-9 shrink-0 rounded px-3 py-1 text-sm capitalize ${tab === t ? 'bg-accent text-white' : 'bg-surface-muted'}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'overview' && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Gross payable</p><p className="text-xl tabular-nums">{money(data.grossPayable as string)}</p></Surface>
          <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Recoveries</p><p className="text-xl tabular-nums">{money(data.totalRecoveries as string)}</p></Surface>
          <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Net</p><p className="text-xl tabular-nums">{money(data.netAmount as string)}</p><p className="text-xs">{String(data.settlementDirection ?? '')}</p></Surface>
        </div>
      )}
      {tab === 'separation' && (
        <Surface className="space-y-2 p-4 text-sm">
          <p>Type: {String(data.separationType)}</p>
          <p>Notice required: {String(data.noticeRequiredDays ?? '—')} days</p>
          <p>Served: {String(data.noticeServedDays ?? '—')} · Shortfall: {String(data.noticeShortfallDays ?? '—')}</p>
          <p>Waived: {data.noticeWaived ? 'Yes' : 'No'}</p>
        </Surface>
      )}
      {tab === 'clearance' && <ClearanceTable items={clearances} onDecide={(domain, status) => act(`clearance/${domain}`, { status, remarks: 'Updated from UI' })} />}
      {tab === 'payables' && <ComponentTable items={payables} empty="No payables" />}
      {tab === 'recoveries' && <ComponentTable items={recoveries} empty="No recoveries" />}
      {tab === 'calculation' && (
        <Surface className="p-4">
          <p className="text-sm font-semibold">PAYABLES {money(data.grossPayable as string)}</p>
          <ComponentTable items={payables} empty="None" />
          <p className="mt-4 text-sm font-semibold">RECOVERIES {money(data.totalRecoveries as string)}</p>
          <ComponentTable items={recoveries} empty="None" />
          <p className="mt-4 text-lg font-semibold">NET SETTLEMENT {money(data.netAmount as string)}</p>
        </Surface>
      )}
      {tab === 'approvals' && (
        <Surface className="space-y-3 p-4">
          <p className="text-sm">Created by #{String(data.createdBy ?? '—')} · Approved by #{String(data.approvedBy ?? '—')}</p>
          <Input placeholder="Reject / reopen reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => act('reject', { reason: reason || 'Rejected from UI' })}>Reject</Button>
            <Button size="sm" onClick={() => act('reopen', { reason: reason || 'Reopened from UI' })}>Reopen</Button>
            <Button size="sm" onClick={() => act('hold', { reason: reason || 'On hold' })}>Hold</Button>
          </div>
        </Surface>
      )}
      {tab === 'finance' && (
        <Surface className="space-y-2 p-4 text-sm">
          <p>Posting status: {String(data.financePostingStatus)}</p>
          <p>Posting key: {String(data.financePostingKey ?? '—')}</p>
          <Button size="sm" onClick={() => act('post')}>Post to Finance</Button>
        </Surface>
      )}
      {tab === 'documents' && (
        <Surface className="space-y-2 p-4">
          {((data.documents as Array<{ id: number; docType: string; releaseStatus: string }>) ?? []).map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm">
              <span>{d.docType}</span>
              <StatusPill value={d.releaseStatus} />
              <Link className="underline" to={`/hr/fnf/cases/${id}?doc=${d.docType}`}>View</Link>
            </div>
          ))}
          <Button size="sm" onClick={() => act('documents')}>Release documents</Button>
        </Surface>
      )}
      {tab === 'audit' && <FnfAudit id={Number(id)} />}
    </div>
  );
}

function ClearanceTable({ items, onDecide }: { items: Clearance[]; onDecide: (domain: string, status: string) => void }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded border border-border md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Domain</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Blocking</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3">{c.domain}</td>
                <td className="px-4 py-3">{c.sourceModule}</td>
                <td className="px-4 py-3"><StatusPill value={c.status} /></td>
                <td className="px-4 py-3 tabular-nums">{money(c.dueAmount)}</td>
                <td className="px-4 py-3">{c.blocking ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="secondary" onClick={() => onDecide(c.domain, 'CLEARED')}>Clear</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {items.map((c) => (
          <Surface key={c.id} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{c.domain}</p>
              <StatusPill value={c.status} />
            </div>
            <p className="text-xs text-ink-muted">{c.sourceModule} · due {money(c.dueAmount)}</p>
            <Button className="mt-2" size="sm" variant="secondary" onClick={() => onDecide(c.domain, 'CLEARED')}>Clear</Button>
          </Surface>
        ))}
      </div>
    </>
  );
}

function ComponentTable({ items, empty }: { items: Component[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-ink-muted">{empty}</p>;
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
          <tr>
            <th className="px-3 py-2">Code</th>
            <th className="px-3 py-2">Source</th>
            <th className="px-3 py-2">Basis</th>
            <th className="px-3 py-2">Qty</th>
            <th className="px-3 py-2">Rate</th>
            <th className="px-3 py-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id} className="border-t border-border">
              <td className="px-3 py-2">{c.name}</td>
              <td className="px-3 py-2">{c.source}</td>
              <td className="px-3 py-2">{c.basis}</td>
              <td className="px-3 py-2 tabular-nums">{c.quantity ?? '—'}</td>
              <td className="px-3 py-2 tabular-nums">{money(c.rate)}</td>
              <td className="px-3 py-2 tabular-nums">{money(c.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FnfAudit({ id }: { id: number }) {
  const [rows, setRows] = useState<Array<{ id: number; action: string; reason?: string; createdAt?: string }>>([]);
  useEffect(() => {
    api<typeof rows>(`/api/hr/fnf/cases/${id}/audit`).then(setRows).catch(() => setRows([]));
  }, [id]);
  return (
    <Surface className="p-4">
      {rows.map((r) => (
        <p key={r.id} className="border-b border-border py-2 text-sm">{r.action} · {r.reason ?? ''}</p>
      ))}
    </Surface>
  );
}

export function HrFnfClearancePage() {
  const [rows, setRows] = useState<CaseRow[]>([]);
  useDocumentTitle('F&F Clearance');
  useEffect(() => {
    api<CaseRow[]>('/api/hr/fnf/cases?status=CLEARANCE_PENDING').then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Clearance" actions={<FnFNav />} />
      <CaseCards rows={rows} />
    </div>
  );
}

export function HrFnfApprovalsPage() {
  const [rows, setRows] = useState<CaseRow[]>([]);
  useDocumentTitle('F&F Approvals');
  useEffect(() => {
    api<CaseRow[]>('/api/hr/fnf/cases').then((all) => setRows(all.filter((r) => ['CALCULATED', 'REVIEW'].includes(r.status)))).catch(() => setRows([]));
  }, []);
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Approvals" actions={<FnFNav />} />
      <CaseCards rows={rows} />
    </div>
  );
}

export function HrFnfFinancePage() {
  const [rows, setRows] = useState<CaseRow[]>([]);
  useDocumentTitle('F&F Finance posting');
  useEffect(() => {
    api<CaseRow[]>('/api/hr/fnf/cases').then((all) => setRows(all.filter((r) => r.status === 'APPROVED'))).catch(() => setRows([]));
  }, []);
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Finance Posting" actions={<FnFNav />} />
      <CaseCards rows={rows} />
    </div>
  );
}

export function HrFnfDocumentsPage() {
  const [rows, setRows] = useState<CaseRow[]>([]);
  useDocumentTitle('F&F Documents');
  useEffect(() => {
    api<CaseRow[]>('/api/hr/fnf/cases').then((all) => setRows(all.filter((r) => ['APPROVED', 'FINANCE_POSTED', 'SETTLED', 'CLOSED'].includes(r.status)))).catch(() => setRows([]));
  }, []);
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Documents" actions={<FnFNav />} />
      <CaseCards rows={rows} />
    </div>
  );
}

export function HrFnfReportsPage() {
  const [kind, setKind] = useState('register');
  const [data, setData] = useState<unknown>(null);
  useDocumentTitle('F&F Reports');
  useEffect(() => {
    const path = {
      register: '/api/hr/fnf/reports/register',
      clearance: '/api/hr/fnf/reports/pending-clearance',
      recoveries: '/api/hr/fnf/reports/outstanding-recoveries',
      payables: '/api/hr/fnf/reports/payables',
      receivables: '/api/hr/fnf/reports/receivables',
      encashment: '/api/hr/fnf/reports/leave-encashment',
      notice: '/api/hr/fnf/reports/notice-pay',
      aging: '/api/hr/fnf/reports/aging',
      posting: '/api/hr/fnf/reports/finance-posting',
      closed: '/api/hr/fnf/reports/closed',
    }[kind];
    if (!path) return;
    api(path).then(setData).catch(() => setData([]));
  }, [kind]);
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Final Settlement Reports" actions={<FnFNav />} />
      <select className="rounded border border-border bg-surface px-3 py-2 text-sm" value={kind} onChange={(e) => setKind(e.target.value)}>
        <option value="register">Settlement register</option>
        <option value="clearance">Pending clearance</option>
        <option value="recoveries">Outstanding recoveries</option>
        <option value="payables">Employee payables</option>
        <option value="receivables">Employee receivables</option>
        <option value="encashment">Leave encashment</option>
        <option value="notice">Notice pay</option>
        <option value="aging">Aging</option>
        <option value="posting">Finance posting</option>
        <option value="closed">Closed separations</option>
      </select>
      <Surface className="overflow-x-auto p-4">
        <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(data, null, 2)}</pre>
      </Surface>
    </div>
  );
}

function CaseCards({ rows }: { rows: CaseRow[] }) {
  if (!rows.length) return <p className="text-sm text-ink-muted">No cases in this view.</p>;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rows.map((r) => (
        <Surface key={r.id} className="p-4">
          <Link className="font-mono text-xs underline" to={`/hr/fnf/cases/${r.id}`}>{r.caseNumber}</Link>
          <p className="mt-1 font-medium">{r.employeeName}</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <StatusPill value={r.status} />
            <span className="tabular-nums text-sm">{money(r.netAmount)}</span>
          </div>
        </Surface>
      ))}
    </div>
  );
}

export function HrMySeparationPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [doc, setDoc] = useState<Record<string, unknown> | null>(null);
  useDocumentTitle('My Separation');
  useEffect(() => {
    api<Record<string, unknown> | null>('/api/hr/me/fnf').then(setData).catch(() => setData(null));
  }, []);
  if (data === null) {
    return (
      <div className="animate-fade-in space-y-4">
        <PageHeader title="My Exit / Separation" />
        <p className="text-sm text-ink-muted">No final settlement case yet. Submit a resignation from My HR if you are exiting.</p>
        <Link to="/hr/resignation"><Button variant="secondary">Resignation</Button></Link>
      </div>
    );
  }
  const clearances = (data.clearances as Clearance[]) ?? [];
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="My Exit / Separation" />
      <Surface className="space-y-2 p-4">
        <p>Last working date: {String(data.lastWorkingDate ?? '—').slice(0, 10)}</p>
        <p>Status: <StatusPill value={String(data.status)} /></p>
        {data.netAmount != null ? <p>Net settlement: {money(data.netAmount as string)} ({String(data.settlementDirection ?? '')})</p> : null}
      </Surface>
      <Surface className="p-4">
        <h2 className="text-sm font-semibold">Clearance progress</h2>
        <div className="mt-2 space-y-2">
          {clearances.map((c) => (
            <div key={c.domain} className="flex items-center justify-between gap-2 text-sm">
              <span>{c.domain}</span>
              <StatusPill value={c.status} />
            </div>
          ))}
        </div>
      </Surface>
      <div className="flex flex-wrap gap-2">
        {['STATEMENT', 'RELIEVING_LETTER', 'EXPERIENCE_CERTIFICATE'].map((t) => (
          <Button key={t} variant="secondary" size="sm" onClick={() => api<Record<string, unknown>>(`/api/hr/me/fnf/documents/${t}`).then(setDoc).catch(() => setDoc(null))}>
            {t.replace('_', ' ')}
          </Button>
        ))}
      </div>
      {doc ? (
        <Surface className="p-4">
          <h2 className="text-sm font-semibold">Settlement statement</h2>
          <pre className="mt-2 whitespace-pre-wrap text-sm">{String(doc.body ?? '')}</pre>
        </Surface>
      ) : null}
    </div>
  );
}

export function HodFnfClearancePage() {
  const [rows, setRows] = useState<Array<{ settlementId: number; caseNumber: string; employeeName: string; status: string; lastWorkingDate?: string }>>([]);
  useDocumentTitle('Department clearance');
  useEffect(() => {
    api<typeof rows>('/api/hr/fnf/hod/clearances').then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title="Department Clearance Inbox"
        subtitle="Confirm academic handover. Salary details are not shown."
        actions={<Button variant="secondary" onClick={() => api<typeof rows>('/api/hr/fnf/hod/clearances').then(setRows).catch(() => setRows([]))}>Refresh</Button>}
      />
      <div className="space-y-3">
        {rows.map((r) => (
          <Surface key={r.settlementId} className="p-4">
            <Link className="font-medium underline" to={`/hod/clearance/${r.settlementId}`}>{r.employeeName}</Link>
            <p className="text-xs text-ink-muted">{r.caseNumber} · LWD {String(r.lastWorkingDate ?? '').slice(0, 10)}</p>
            <StatusPill value={r.status} />
          </Surface>
        ))}
        {!rows.length ? <p className="text-sm text-ink-muted">No pending department clearances.</p> : null}
      </div>
    </div>
  );
}

export function HodFnfClearanceDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  useDocumentTitle('Clearance detail');
  useEffect(() => {
    if (!id) return;
    api<Record<string, unknown>>(`/api/hr/fnf/hod/clearances/${id}`).then(setData).catch(() => setData(null));
  }, [id]);
  if (!data) return <Skeleton className="h-32 w-full" />;
  const emp = data.employee as { name?: string; employeeNumber?: string } | undefined;
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Department clearance" subtitle={emp?.name} />
      <Surface className="space-y-3 p-4">
        <p className="text-sm">{emp?.employeeNumber} · LWD {String(data.lastWorkingDate ?? '').slice(0, 10)}</p>
        <p className="text-sm">Separation: {String(data.separationType)}</p>
        <Button
          onClick={async () => {
            await api(`/api/hr/fnf/hod/clearances/${id}`, {
              method: 'POST',
              body: JSON.stringify({ status: 'CLEARED', remarks: 'Department handover complete' }),
            });
            const next = await api<Record<string, unknown>>(`/api/hr/fnf/hod/clearances/${id}`);
            setData(next);
          }}
        >
          Confirm department clearance
        </Button>
      </Surface>
    </div>
  );
}
