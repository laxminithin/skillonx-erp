import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, Surface, Button, Input, Select, Field, Modal, StatusBadge, Badge, FilterChip, EmptyState, Skeleton, useToast } from '../../components/ui';
import { labApi, canLab, type LabIssue } from '../../lib/labApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { useLabMeta, useLabs, fmtDate } from './shared';

export function LabIssuesPage() {
  useDocumentTitle('Issue & Return');
  const meta = useLabMeta();
  const labs = useLabs();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [rows, setRows] = useState<LabIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [overdueOnly, setOverdueOnly] = useState(params.get('overdueOnly') === '1');
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [returnItem, setReturnItem] = useState<LabIssue | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    labApi.issues({ overdueOnly: overdueOnly ? 1 : undefined, status }).then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
  }, [overdueOnly, status]);
  useEffect(() => { load(); }, [load]);
  const canManage = canLab(meta, 'lab.issue.manage');

  return (
    <div>
      <PageHeader title="Issue & Return" subtitle="Reusable assets and accessories issued to faculty, students, labs or departments" actions={canManage ? <Button onClick={() => setCreating(true)}>Issue item</Button> : undefined} />
      <Surface className="mb-4 !p-3"><div className="flex flex-wrap items-center gap-2">
        <FilterChip active={overdueOnly} onClick={() => setOverdueOnly((v) => !v)}>Overdue only</FilterChip>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className="w-auto"><option value="">Any status</option><option value="ISSUED">Issued</option><option value="RETURNED">Returned</option><option value="LOST">Lost</option></Select>
      </div></Surface>
      {loading ? <Skeleton className="h-40" /> : rows.length === 0 ? <EmptyState title="No issues" body="Nothing has been issued yet." /> : (
        <Surface className="!p-0 overflow-hidden"><div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b border-border bg-surface-muted/50 text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-2.5">Item</th><th className="px-4 py-2.5">Recipient</th><th className="px-4 py-2.5">Issued</th>
              <th className="px-4 py-2.5">Due</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5"></th>
            </tr></thead>
            <tbody>
              {rows.map((i) => (
                <tr key={i.id} className="border-b border-border/60">
                  <td className="px-4 py-2.5 font-medium text-ink">{i.assetTag ? <span className="font-mono text-xs">{i.assetTag} </span> : null}{i.description ?? i.assetTag ?? '—'}</td>
                  <td className="px-4 py-2.5"><Badge>{i.recipientType}</Badge> {i.recipientName ?? ''}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{fmtDate(i.issueDate)}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{i.overdue ? <span className="text-danger">{fmtDate(i.expectedReturn)}</span> : fmtDate(i.expectedReturn)}</td>
                  <td className="px-4 py-2.5">{i.overdue ? <Badge className="bg-danger-soft text-danger">Overdue</Badge> : <StatusBadge status={i.status} />}</td>
                  <td className="px-4 py-2.5 text-right">{canManage && i.status === 'ISSUED' && <Button size="sm" variant="secondary" onClick={() => setReturnItem(i)}>Return</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></Surface>
      )}

      {creating && <IssueCreate labs={labs} conditions={meta?.conditions ?? []} onClose={() => setCreating(false)} onDone={() => { setCreating(false); load(); toast('Issued'); }} />}
      {returnItem && <ReturnItem item={returnItem} conditions={meta?.conditions ?? []} onClose={() => setReturnItem(null)} onDone={() => { setReturnItem(null); load(); toast('Returned'); }} />}
    </div>
  );
}

function IssueCreate({ labs, conditions, onClose, onDone }: { labs: { id: number; name: string }[]; conditions: string[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ labId: '', itemKind: 'ACCESSORY', description: '', recipientType: 'FACULTY', recipientFacultyId: '', recipientStudentId: '', issueDate: today, expectedReturn: '', conditionOut: 'GOOD', assetId: '' });
  const submit = async () => {
    if (!f.labId) { toast('Lab required', 'error'); return; }
    try {
      await labApi.createIssue({
        labId: Number(f.labId), itemKind: f.itemKind, description: f.description || null,
        assetId: f.assetId ? Number(f.assetId) : null, recipientType: f.recipientType,
        recipientFacultyId: f.recipientType === 'FACULTY' && f.recipientFacultyId ? Number(f.recipientFacultyId) : null,
        recipientStudentId: f.recipientType === 'STUDENT' && f.recipientStudentId ? Number(f.recipientStudentId) : null,
        issueDate: f.issueDate, expectedReturn: f.expectedReturn || null, conditionOut: f.conditionOut,
      });
      onDone();
    } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };
  return (
    <Modal open title="Issue item" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Issue</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Lab"><Select value={f.labId} onChange={(e) => setF((v) => ({ ...v, labId: e.target.value }))}><option value="">Select…</option>{labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
        <Field label="Kind"><Select value={f.itemKind} onChange={(e) => setF((v) => ({ ...v, itemKind: e.target.value }))}><option value="ACCESSORY">Accessory</option><option value="ASSET">Asset</option><option value="STOCK">Stock</option></Select></Field>
        {f.itemKind === 'ASSET' && <Field label="Asset ID"><Input value={f.assetId} onChange={(e) => setF((v) => ({ ...v, assetId: e.target.value }))} /></Field>}
        <Field label="Description"><Input value={f.description} onChange={(e) => setF((v) => ({ ...v, description: e.target.value }))} /></Field>
        <Field label="Recipient"><Select value={f.recipientType} onChange={(e) => setF((v) => ({ ...v, recipientType: e.target.value }))}><option value="FACULTY">Faculty</option><option value="STUDENT">Student</option><option value="LAB">Lab</option><option value="DEPARTMENT">Department</option></Select></Field>
        {f.recipientType === 'FACULTY' && <Field label="Faculty ID"><Input value={f.recipientFacultyId} onChange={(e) => setF((v) => ({ ...v, recipientFacultyId: e.target.value }))} /></Field>}
        {f.recipientType === 'STUDENT' && <Field label="Student ID"><Input value={f.recipientStudentId} onChange={(e) => setF((v) => ({ ...v, recipientStudentId: e.target.value }))} /></Field>}
        <Field label="Issue date"><Input type="date" value={f.issueDate} onChange={(e) => setF((v) => ({ ...v, issueDate: e.target.value }))} /></Field>
        <Field label="Expected return"><Input type="date" value={f.expectedReturn} onChange={(e) => setF((v) => ({ ...v, expectedReturn: e.target.value }))} /></Field>
        <Field label="Condition out"><Select value={f.conditionOut} onChange={(e) => setF((v) => ({ ...v, conditionOut: e.target.value }))}>{conditions.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
      </div>
    </Modal>
  );
}

function ReturnItem({ item, conditions, onClose, onDone }: { item: LabIssue; conditions: string[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [conditionIn, setConditionIn] = useState('GOOD');
  const [status, setStatus] = useState<'RETURNED' | 'LOST'>('RETURNED');
  const submit = async () => {
    try { await labApi.returnIssue(item.id, { conditionIn, status }); onDone(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };
  return (
    <Modal open title="Receive return" description={item.description ?? item.assetTag ?? ''} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Confirm</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Outcome"><Select value={status} onChange={(e) => setStatus(e.target.value as any)}><option value="RETURNED">Returned</option><option value="LOST">Lost</option></Select></Field>
        {status === 'RETURNED' && <Field label="Condition in"><Select value={conditionIn} onChange={(e) => setConditionIn(e.target.value)}>{conditions.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>}
      </div>
    </Modal>
  );
}
