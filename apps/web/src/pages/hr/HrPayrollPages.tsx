/**
 * HRMS Payroll admin + employee self-service UI.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Input, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

type RunRow = {
  id: number;
  runNumber: string;
  status: string;
  periodLabel: string;
  employeeCount: number;
  validationStatus: string;
  validationErrorCount: number;
  grossTotal: number;
  deductionTotal: number;
  netTotal: number;
  lopDaysTotal: number;
  financePostingStatus: string;
};

type Period = { id: number; label: string; startDate: string; endDate: string; status: string };

function money(n: number | string | null | undefined) {
  return `₹${Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatusPill({ value }: { value: string }) {
  return (
    <span className="inline-block rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide bg-surface-muted text-ink">
      {value}
    </span>
  );
}

export function HrPayrollDashboardPage() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);
  useDocumentTitle('Payroll Dashboard');

  useEffect(() => {
    api<RunRow[]>('/api/hr/payroll/runs')
      .then(setRuns)
      .catch(() => setRuns([]))
      .finally(() => setLoading(false));
  }, []);

  const open = runs.filter((r) => !['LOCKED', 'POSTED', 'CANCELLED'].includes(r.status)).length;
  const locked = runs.filter((r) => r.status === 'LOCKED' || r.status === 'POSTED').length;
  const failed = runs.filter((r) => r.validationStatus === 'FAILED').length;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Payroll"
        subtitle="Runs, salary structures, adjustments and Finance handoff"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/hr/payroll/runs"><Button variant="secondary">Runs</Button></Link>
            <Link to="/hr/payroll/structures"><Button variant="secondary">Structures</Button></Link>
            <Link to="/hr/payroll/adjustments"><Button variant="secondary">Adjustments</Button></Link>
            <Link to="/hr/payroll/reports"><Button variant="secondary">Reports</Button></Link>
          </div>
        }
      />
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Surface className="p-4">
              <p className="text-xs uppercase text-ink-muted">Open runs</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{open}</p>
            </Surface>
            <Surface className="p-4">
              <p className="text-xs uppercase text-ink-muted">Locked / posted</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{locked}</p>
            </Surface>
            <Surface className="p-4">
              <p className="text-xs uppercase text-ink-muted">Validation failed</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{failed}</p>
            </Surface>
            <Surface className="p-4">
              <p className="text-xs uppercase text-ink-muted">Total runs</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{runs.length}</p>
            </Surface>
          </div>
          <Surface className="overflow-hidden p-0">
            <div className="border-b border-border px-4 py-3 text-sm font-medium">Recent runs</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Run</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Net</th>
                    <th className="px-4 py-3">Finance</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.slice(0, 8).map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <Link className="font-mono text-xs text-accent underline" to={`/hr/payroll/runs/${r.id}`}>
                          {r.runNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{r.periodLabel}</td>
                      <td className="px-4 py-3"><StatusPill value={r.status} /></td>
                      <td className="px-4 py-3 tabular-nums">{money(r.netTotal)}</td>
                      <td className="px-4 py-3"><StatusPill value={r.financePostingStatus || 'NOT_POSTED'} /></td>
                    </tr>
                  ))}
                  {runs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">No payroll runs yet.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Surface>
        </>
      )}
    </div>
  );
}

export function HrPayrollRunsPage() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [periodId, setPeriodId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  useDocumentTitle('Payroll Runs');

  const load = useCallback(() => {
    api<RunRow[]>('/api/hr/payroll/runs').then(setRuns).catch(() => setRuns([]));
    api<Period[]>('/api/hr/payroll/periods').then(setPeriods).catch(() => setPeriods([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createRun() {
    if (!periodId) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api<{ id: number }>('/api/hr/payroll/runs', {
        method: 'POST',
        body: JSON.stringify({ periodId: Number(periodId) }),
      });
      navigate(`/hr/payroll/runs/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create run');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title="Payroll Runs"
        subtitle="Create and process monthly payroll"
        actions={<Link to="/hr/payroll"><Button variant="secondary">Dashboard</Button></Link>}
      />
      <Surface className="space-y-3 p-4">
        <p className="text-sm font-medium">Create run</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm">
            <span className="mb-1 block text-ink-muted">Period</span>
            <select
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm"
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
            >
              <option value="">Select period</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </label>
          <Button disabled={!periodId || busy} onClick={createRun}>Create run</Button>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </Surface>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {runs.map((r) => (
          <Surface key={r.id} className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <Link to={`/hr/payroll/runs/${r.id}`} className="font-mono text-xs underline">{r.runNumber}</Link>
              <StatusPill value={r.status} />
            </div>
            <p className="text-sm">{r.periodLabel}</p>
            <p className="text-sm tabular-nums">{money(r.netTotal)}</p>
            <p className="text-xs text-ink-muted">Finance: {r.financePostingStatus}</p>
          </Surface>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded border border-border md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Run</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Employees</th>
              <th className="px-4 py-3">Validation</th>
              <th className="px-4 py-3">Gross</th>
              <th className="px-4 py-3">Net</th>
              <th className="px-4 py-3">Finance</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link className="font-mono text-xs underline" to={`/hr/payroll/runs/${r.id}`}>{r.runNumber}</Link>
                </td>
                <td className="px-4 py-3">{r.periodLabel}</td>
                <td className="px-4 py-3"><StatusPill value={r.status} /></td>
                <td className="px-4 py-3 tabular-nums">{r.employeeCount}</td>
                <td className="px-4 py-3">{r.validationStatus} ({r.validationErrorCount})</td>
                <td className="px-4 py-3 tabular-nums">{money(r.grossTotal)}</td>
                <td className="px-4 py-3 tabular-nums">{money(r.netTotal)}</td>
                <td className="px-4 py-3"><StatusPill value={r.financePostingStatus || 'NOT_POSTED'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function HrPayrollRunDetailPage() {
  const { id } = useParams();
  const runId = Number(id);
  const [run, setRun] = useState<Record<string, unknown> | null>(null);
  const [posting, setPosting] = useState<Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useDocumentTitle('Payroll Run');

  const load = useCallback(() => {
    if (!runId) return;
    api<Record<string, unknown>>(`/api/hr/payroll/runs/${runId}`).then(setRun).catch(() => setRun(null));
    api<Record<string, unknown>>(`/api/hr/payroll/runs/${runId}/posting-batch`)
      .then(setPosting)
      .catch(() => setPosting(null));
  }, [runId]);

  useEffect(() => { load(); }, [load]);

  async function action(path: string, body?: object) {
    setBusy(true);
    setMsg(null);
    try {
      await api(`/api/hr/payroll/runs/${runId}/${path}`, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
      setMsg(`${path} succeeded`);
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  if (!run) return <Skeleton className="h-48 w-full" />;

  const employees = (run.employees as Array<Record<string, unknown>>) || [];

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title={String(run.runNumber)}
        subtitle={String(run.periodLabel)}
        actions={<Link to="/hr/payroll/runs"><Button variant="secondary">All runs</Button></Link>}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Status</p><p className="mt-1 font-semibold">{String(run.status)}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Employees</p><p className="mt-1 text-xl font-semibold tabular-nums">{Number(run.employeeCount)}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Net total</p><p className="mt-1 text-xl font-semibold tabular-nums">{money(Number(run.netTotal))}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Finance</p><p className="mt-1 font-semibold">{String(run.financePostingStatus)}</p></Surface>
      </div>

      <Surface className="flex flex-wrap gap-2 p-4">
        <Button disabled={busy} onClick={() => action('calculate')}>Calculate</Button>
        <Button disabled={busy} variant="secondary" onClick={() => action('approve')}>Approve</Button>
        <Button disabled={busy} variant="secondary" onClick={() => action('lock')}>Lock &amp; release payslips</Button>
        <Button disabled={busy} variant="secondary" onClick={() => action('post-finance')}>Post to Finance</Button>
        <Button disabled={busy} variant="secondary" onClick={() => action('reverse-finance', { reason: 'UI reversal request' })}>Reverse Finance</Button>
      </Surface>
      {msg ? <p className="text-sm text-ink-muted">{msg}</p> : null}

      <Surface className="space-y-2 p-4">
        <p className="text-sm font-medium">Validation</p>
        <p className="text-sm">{String(run.validationStatus)} — {Number(run.validationErrorCount)} errors</p>
        <p className="text-sm">LOP days total: {Number(run.lopDaysTotal)}</p>
        <p className="text-sm">Gross {money(Number(run.grossTotal))} · Deductions {money(Number(run.deductionTotal))}</p>
      </Surface>

      {posting ? (
        <Surface className="space-y-2 p-4" data-testid="finance-handoff">
          <p className="text-sm font-medium">Finance handoff</p>
          <p className="text-sm">Balanced: {String(posting.balanced)} · Debit {money(Number(posting.debitTotal))} · Credit {money(Number(posting.creditTotal))}</p>
          {Array.isArray(posting.validationErrors) && (posting.validationErrors as string[]).length > 0 ? (
            <ul className="list-disc pl-5 text-sm text-danger">
              {(posting.validationErrors as string[]).map((e) => <li key={e}>{e}</li>)}
            </ul>
          ) : null}
        </Surface>
      ) : null}

      <div className="space-y-3 md:hidden">
        {employees.map((e) => (
          <Surface key={String(e.id)} className="space-y-1 p-4">
            <Link className="font-medium underline" to={`/hr/payroll/runs/${runId}/employees/${e.employeeId}`}>
              {String(e.employeeName)}
            </Link>
            <p className="text-xs text-ink-muted">{String(e.employeeNumber)} · LOP {String(e.lopDays ?? 0)}</p>
            <p className="tabular-nums text-sm">{money(Number(e.netAmount))}</p>
            <StatusPill value={String(e.calculationStatus)} />
          </Surface>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded border border-border md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">LOP</th>
              <th className="px-4 py-3">Gross</th>
              <th className="px-4 py-3">Net</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={String(e.id)} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link className="underline" to={`/hr/payroll/runs/${runId}/employees/${e.employeeId}`}>
                    {String(e.employeeName)}
                  </Link>
                  <div className="font-mono text-xs text-ink-muted">{String(e.employeeNumber)}</div>
                </td>
                <td className="px-4 py-3">{String(e.departmentName ?? '—')}</td>
                <td className="px-4 py-3 tabular-nums">{String(e.lopDays ?? 0)}</td>
                <td className="px-4 py-3 tabular-nums">{money(Number(e.grossAmount))}</td>
                <td className="px-4 py-3 tabular-nums">{money(Number(e.netAmount))}</td>
                <td className="px-4 py-3"><StatusPill value={String(e.calculationStatus)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function HrPayrollEmployeeDetailPage() {
  const { id, employeeId } = useParams();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  useDocumentTitle('Employee Payroll');

  useEffect(() => {
    api<Record<string, unknown>>(`/api/hr/payroll/runs/${id}/employees/${employeeId}`)
      .then(setData)
      .catch(() => setData(null));
  }, [id, employeeId]);

  if (!data) return <Skeleton className="h-48 w-full" />;
  const components = (data.components as Array<Record<string, unknown>>) || [];
  const snap = data.inputSnapshot as Record<string, unknown> | null;
  const trace = data.calculationTrace as Record<string, unknown> | null;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title={String(data.employeeName)}
        subtitle={`Payroll calculation · ${String(data.employeeNumber)}`}
        actions={<Link to={`/hr/payroll/runs/${id}`}><Button variant="secondary">Back to run</Button></Link>}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Gross</p><p className="text-xl font-semibold tabular-nums">{money(Number(data.grossAmount))}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Deductions</p><p className="text-xl font-semibold tabular-nums">{money(Number(data.deductionAmount))}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Net</p><p className="text-xl font-semibold tabular-nums">{money(Number(data.netAmount))}</p></Surface>
      </div>
      <Surface className="space-y-2 p-4">
        <p className="text-sm font-medium">Snapshot inputs</p>
        <p className="text-sm">Structure: {(snap?.assignment as { structureCode?: string })?.structureCode ?? '—'} (v{String(data.snapshotVersion)})</p>
        <p className="text-sm">Attendance: working {String(data.workingDays)} · payable {String(data.payableDays)} · LOP {String(data.lopDays)}</p>
      </Surface>
      <Surface className="overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Component</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Base</th>
              <th className="px-4 py-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {components.map((c, i) => (
              <tr key={`${c.code}-${i}`} className="border-t border-border">
                <td className="px-4 py-3">{String(c.code)} — {String(c.name)}</td>
                <td className="px-4 py-3">{String(c.type)}</td>
                <td className="px-4 py-3 tabular-nums">{money(Number(c.baseAmount ?? 0))}</td>
                <td className="px-4 py-3 tabular-nums">{money(Number(c.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Surface>
      {trace && Array.isArray(trace.steps) ? (
        <Surface className="space-y-1 p-4">
          <p className="text-sm font-medium">Calculation trace</p>
          <ul className="list-disc space-y-1 pl-5 text-xs text-ink-muted">
            {(trace.steps as string[]).map((s) => <li key={s}>{s}</li>)}
          </ul>
        </Surface>
      ) : null}
    </div>
  );
}

export function HrSalaryStructuresPage() {
  const [structures, setStructures] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [components, setComponents] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [basicId, setBasicId] = useState<number | ''>('');
  const [basicAmt, setBasicAmt] = useState('30000');
  useDocumentTitle('Salary Structures');

  const load = useCallback(() => {
    api<typeof structures>('/api/hr/payroll/structures').then(setStructures).catch(() => setStructures([]));
    api<typeof components>('/api/hr/payroll/components').then((c) => {
      setComponents(c);
      const basic = c.find((x) => x.code === 'BASIC');
      if (basic) setBasicId(basic.id);
    }).catch(() => setComponents([]));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createStructure() {
    if (!code || !name || !basicId) return;
    const hra = components.find((c) => c.code === 'HRA');
    const pf = components.find((c) => c.code === 'PF');
    const created = await api<{ id: number }>('/api/hr/payroll/structures', {
      method: 'POST',
      body: JSON.stringify({
        code,
        name,
        components: [
          { componentId: basicId, calculationType: 'FIXED', amount: Number(basicAmt) },
          ...(hra ? [{ componentId: hra.id, calculationType: 'PERCENTAGE', percentage: 40, percentageOfComponentId: basicId }] : []),
          ...(pf ? [{ componentId: pf.id, calculationType: 'PERCENTAGE', percentage: 12, percentageOfComponentId: basicId }] : []),
        ],
      }),
    });
    setCode('');
    setName('');
    load();
    const detail = await api<Record<string, unknown>>(`/api/hr/payroll/structures/${created.id}`);
    setSelected(detail);
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Salary Structures" actions={<Link to="/hr/payroll"><Button variant="secondary">Dashboard</Button></Link>} />
      <Surface className="space-y-3 p-4">
        <p className="text-sm font-medium">Create structure</p>
        <div className="grid gap-2 sm:grid-cols-3">
          <Input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Basic amount" value={basicAmt} onChange={(e) => setBasicAmt(e.target.value)} />
        </div>
        <Button onClick={createStructure}>Create</Button>
      </Surface>
      <div className="grid gap-4 lg:grid-cols-2">
        <Surface className="overflow-hidden p-0">
          <ul className="divide-y divide-border">
            {structures.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="flex w-full min-w-0 items-center justify-between gap-2 px-4 py-3 text-left text-sm hover:bg-surface-muted"
                  onClick={() => api<Record<string, unknown>>(`/api/hr/payroll/structures/${s.id}`).then(setSelected)}
                >
                  <span className="shrink-0 font-mono text-xs">{s.code}</span>
                  <span className="truncate">{s.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </Surface>
        <Surface className="min-w-0 space-y-2 overflow-x-auto p-4">
          {selected ? (
            <>
              <p className="break-words font-medium">{String(selected.code)} — {String(selected.name)}</p>
              <ul className="space-y-1 text-sm">
                {((selected.components as Array<Record<string, unknown>>) || []).map((c) => (
                  <li key={String(c.id)} className="flex min-w-0 justify-between gap-2">
                    <span className="truncate">{String(c.code)}</span>
                    <span className="shrink-0 tabular-nums text-ink-muted">
                      {String(c.calculationType)} {c.amount != null ? money(Number(c.amount)) : `${c.percentage}%`}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-ink-muted">Select a structure</p>
          )}
        </Surface>
      </div>
    </div>
  );
}

export function HrPayrollAdjustmentsPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  useDocumentTitle('Payroll Adjustments');
  useEffect(() => {
    api<typeof rows>('/api/hr/payroll/adjustments').then(setRows).catch(() => setRows([]));
  }, []);
  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Adjustments & Arrears" actions={<Link to="/hr/payroll"><Button variant="secondary">Dashboard</Button></Link>} />
      <div className="space-y-3 md:hidden">
        {rows.map((r) => (
          <Surface key={String(r.id)} className="space-y-1 p-4 text-sm">
            <p className="font-medium">{String(r.employeeName)}</p>
            <p>{String(r.adjustmentType)} · {money(Number(r.amount))}</p>
            <p className="text-ink-muted">{String(r.reason)}</p>
          </Surface>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded border border-border md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r.id)} className="border-t border-border">
                <td className="px-4 py-3">{String(r.employeeName)}</td>
                <td className="px-4 py-3">{String(r.adjustmentType)}</td>
                <td className="px-4 py-3 tabular-nums">{money(Number(r.amount))}</td>
                <td className="px-4 py-3">{String(r.status)}</td>
                <td className="px-4 py-3">{String(r.reason)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function HrPayrollReportsPage() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [runId, setRunId] = useState('');
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  useDocumentTitle('Payroll Reports');
  useEffect(() => {
    api<RunRow[]>('/api/hr/payroll/runs').then(setRuns).catch(() => setRuns([]));
  }, []);

  async function load(kind: string) {
    if (!runId) return;
    const path =
      kind === 'arrears'
        ? `/api/hr/payroll/reports/arrears?runId=${runId}`
        : `/api/hr/payroll/reports/${kind}/${runId}`;
    setReport(await api(path));
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Payroll Reports" actions={<Link to="/hr/payroll"><Button variant="secondary">Dashboard</Button></Link>} />
      <Surface className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="text-sm">
          <span className="mb-1 block text-ink-muted">Run</span>
          <select className="rounded border border-border bg-surface px-3 py-2 text-sm" value={runId} onChange={(e) => setRunId(e.target.value)}>
            <option value="">Select</option>
            {runs.map((r) => <option key={r.id} value={r.id}>{r.runNumber} — {r.periodLabel}</option>)}
          </select>
        </label>
        <Button variant="secondary" disabled={!runId} onClick={() => load('register')}>Register</Button>
        <Button variant="secondary" disabled={!runId} onClick={() => load('department-summary')}>Department</Button>
        <Button variant="secondary" disabled={!runId} onClick={() => load('earnings-deductions')}>Earnings</Button>
        <Button variant="secondary" disabled={!runId} onClick={() => load('lop')}>LOP</Button>
        <Button variant="secondary" disabled={!runId} onClick={() => load('arrears')}>Arrears</Button>
        <Button variant="secondary" disabled={!runId} onClick={() => load('finance')}>Finance</Button>
        <Button variant="secondary" disabled={!runId} onClick={() => load('variance')}>Variance</Button>
      </Surface>
      {report ? (
        <Surface className="overflow-x-auto p-4">
          <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(report, null, 2)}</pre>
        </Surface>
      ) : null}
    </div>
  );
}

/** Enhanced employee payslips with detail. */
export function HrPayslipsPage() {
  const [rows, setRows] = useState<Array<{ id: number; payslipNumber: string; periodLabel: string; netAmount: number; grossAmount: number }>>([]);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  useDocumentTitle('My Payroll');
  useEffect(() => {
    api<typeof rows>('/api/hr/me/payslips').then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="My Payroll" subtitle="Payslip history" />
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">No payslips available yet.</p>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {rows.map((r) => (
              <Surface key={r.id} className="space-y-2 p-4">
                <button type="button" className="text-left" onClick={() => api<Record<string, unknown>>(`/api/hr/me/payslips/${r.id}`).then(setDetail)}>
                  <p className="font-mono text-xs">{r.payslipNumber}</p>
                  <p className="text-sm">{r.periodLabel}</p>
                  <p className="tabular-nums font-semibold">{money(r.netAmount)}</p>
                </button>
              </Surface>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded border border-border md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Payslip</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Gross</th>
                  <th className="px-4 py-3">Net</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <button type="button" className="font-mono text-xs underline" onClick={() => api<Record<string, unknown>>(`/api/hr/me/payslips/${r.id}`).then(setDetail)}>
                        {r.payslipNumber}
                      </button>
                    </td>
                    <td className="px-4 py-3">{r.periodLabel}</td>
                    <td className="px-4 py-3 tabular-nums">{money(r.grossAmount)}</td>
                    <td className="px-4 py-3 tabular-nums">{money(r.netAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {detail ? (
        <Surface className="space-y-2 p-4">
          <p className="font-medium">Payslip {String(detail.payslipNumber)}</p>
          <p className="text-sm">Gross {money(Number(detail.grossAmount))} · Deductions {money(Number(detail.deductionAmount))} · Net {money(Number(detail.netAmount))}</p>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs text-ink-muted">{JSON.stringify(detail.breakdown, null, 2)}</pre>
          <Button variant="secondary" onClick={() => setDetail(null)}>Close</Button>
        </Surface>
      ) : null}
    </div>
  );
}

/** Back-compat export used by App route /hr/payroll */
export function HrPayrollPage() {
  return <HrPayrollDashboardPage />;
}
