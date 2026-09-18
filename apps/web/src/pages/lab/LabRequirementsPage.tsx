import { useEffect, useState, useCallback } from 'react';
import { PageHeader, Surface, Button, Input, Select, Textarea, Field, Modal, StatusBadge, Badge, EmptyState, Skeleton, useToast } from '../../components/ui';
import { labApi, canLab, type LabRequirement } from '../../lib/labApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { useLabMeta, useLabs, money, fmtDate } from './shared';

export function LabRequirementsPage() {
  useDocumentTitle('Lab Requirements');
  const meta = useLabMeta();
  const labs = useLabs();
  const { toast } = useToast();
  const [rows, setRows] = useState<LabRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    labApi.requirements({ status }).then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
  }, [status]);
  useEffect(() => { load(); }, [load]);
  const canCreate = canLab(meta, 'lab.requirement.create');
  const canApprove = canLab(meta, 'lab.requirement.approve');

  const decide = async (id: number, decision: 'APPROVE' | 'REJECT' | 'FULFILL') => {
    try { await labApi.decideRequirement(id, { decision }); load(); toast(decision === 'REJECT' ? 'Rejected' : decision === 'FULFILL' ? 'Fulfilled' : 'Approved'); }
    catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };

  return (
    <div>
      <PageHeader title="Requirements" subtitle="Lab requirement & purchase requests — In-charge → HOD → Principal → Stores handoff" actions={canCreate ? <Button onClick={() => setCreating(true)}>New requirement</Button> : undefined} />
      <Surface className="mb-4 !p-3"><Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className="w-auto">
        <option value="">Any status</option>{['SUBMITTED', 'INCHARGE_APPROVED', 'HOD_APPROVED', 'PRINCIPAL_APPROVED', 'REJECTED', 'FULFILLED'].map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
      </Select></Surface>
      {loading ? <Skeleton className="h-40" /> : rows.length === 0 ? <EmptyState title="No requirements" body="No requirement requests yet." /> : (
        <Surface className="!p-0 overflow-hidden"><div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead><tr className="border-b border-border bg-surface-muted/50 text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-2.5">Item</th><th className="px-4 py-2.5">Lab</th><th className="px-4 py-2.5">Type</th><th className="px-4 py-2.5">Qty</th>
              <th className="px-4 py-2.5">Est. cost</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5"></th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="px-4 py-2.5 font-medium text-ink">{r.item}</td>
                  <td className="px-4 py-2.5 text-ink-muted">{r.labName}</td>
                  <td className="px-4 py-2.5"><Badge>{r.requestType.replaceAll('_', ' ')}</Badge></td>
                  <td className="px-4 py-2.5 tabular-nums">{r.quantity}</td>
                  <td className="px-4 py-2.5">{money(r.estimatedCost)}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-2.5 text-right">{canApprove && !['REJECTED', 'FULFILLED', 'PRINCIPAL_APPROVED'].includes(r.status) && (
                    <div className="flex justify-end gap-1">
                      <Button size="sm" onClick={() => decide(r.id, 'APPROVE')}>Approve</Button>
                      <Button size="sm" variant="danger-soft" onClick={() => decide(r.id, 'REJECT')}>Reject</Button>
                    </div>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></Surface>
      )}
      {creating && <RequirementForm labs={labs} types={['NEW_ASSET', 'REPLACEMENT', 'CONSUMABLES', 'SOFTWARE', 'REPAIR', 'UPGRADE']} onClose={() => setCreating(false)} onDone={() => { setCreating(false); load(); toast('Requirement submitted'); }} />}
    </div>
  );
}

function RequirementForm({ labs, types, onClose, onDone }: { labs: { id: number; name: string }[]; types: string[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({ labId: '', requestType: 'CONSUMABLES', item: '', quantity: '1', priority: 'NORMAL', estimatedCost: '', reason: '', academicJustification: '' });
  const submit = async () => {
    if (!f.labId || !f.item) { toast('Lab and item required', 'error'); return; }
    try { await labApi.createRequirement({ labId: Number(f.labId), requestType: f.requestType, item: f.item, quantity: Number(f.quantity), priority: f.priority, estimatedCost: f.estimatedCost ? Number(f.estimatedCost) : null, reason: f.reason || null, academicJustification: f.academicJustification || null }); onDone(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };
  return (
    <Modal open title="New requirement" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Submit</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Lab"><Select value={f.labId} onChange={(e) => setF((v) => ({ ...v, labId: e.target.value }))}><option value="">Select…</option>{labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
        <Field label="Type"><Select value={f.requestType} onChange={(e) => setF((v) => ({ ...v, requestType: e.target.value }))}>{types.map((t) => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}</Select></Field>
        <Field label="Item"><Input value={f.item} onChange={(e) => setF((v) => ({ ...v, item: e.target.value }))} /></Field>
        <Field label="Quantity"><Input type="number" value={f.quantity} onChange={(e) => setF((v) => ({ ...v, quantity: e.target.value }))} /></Field>
        <Field label="Priority"><Select value={f.priority} onChange={(e) => setF((v) => ({ ...v, priority: e.target.value }))}><option>LOW</option><option>NORMAL</option><option>HIGH</option><option>URGENT</option></Select></Field>
        <Field label="Estimated cost"><Input type="number" value={f.estimatedCost} onChange={(e) => setF((v) => ({ ...v, estimatedCost: e.target.value }))} /></Field>
      </div>
      <div className="mt-3 grid gap-3">
        <Field label="Reason"><Textarea value={f.reason} onChange={(e) => setF((v) => ({ ...v, reason: e.target.value }))} rows={2} /></Field>
        <Field label="Academic justification"><Textarea value={f.academicJustification} onChange={(e) => setF((v) => ({ ...v, academicJustification: e.target.value }))} rows={2} /></Field>
      </div>
    </Modal>
  );
}
