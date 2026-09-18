import { useEffect, useState, useCallback } from 'react';
import { PageHeader, Surface, Button, Input, Select, Textarea, Field, Modal, Tabs, StatusBadge, Badge, EmptyState, Skeleton, useToast } from '../../components/ui';
import { labApi, canLab, type LabFault, type LabRepair } from '../../lib/labApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { useLabMeta, useLabs, money, fmtDate } from './shared';

const FAULT_STATES = ['OPEN', 'ACKNOWLEDGED', 'UNDER_DIAGNOSIS', 'UNDER_REPAIR', 'RESOLVED', 'CLOSED'];

export function LabFaultsPage() {
  useDocumentTitle('Faults & Repairs');
  const meta = useLabMeta();
  const labs = useLabs();
  const { toast } = useToast();
  const [tab, setTab] = useState('faults');
  const [faults, setFaults] = useState<LabFault[]>([]);
  const [repairs, setRepairs] = useState<LabRepair[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFault, setNewFault] = useState(false);
  const [newRepair, setNewRepair] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([labApi.faults(), labApi.repairs()]).then(([f, r]) => { setFaults(f); setRepairs(r); }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);
  const canFault = canLab(meta, 'lab.fault.manage');
  const canRepair = canLab(meta, 'lab.repair.manage');
  const canApprove = canLab(meta, 'lab.repair.approve');

  return (
    <div>
      <PageHeader title="Faults & Repairs" subtitle="Breakdown log and repair lifecycle — ready to hand off to central Maintenance" actions={
        <div className="flex gap-2">
          {canFault && <Button variant="secondary" onClick={() => setNewFault(true)}>Log fault</Button>}
          {canRepair && <Button onClick={() => setNewRepair(true)}>Raise repair</Button>}
        </div>
      } />
      <div className="mb-4"><Tabs tabs={[{ id: 'faults', label: `Faults (${faults.length})` }, { id: 'repairs', label: `Repairs (${repairs.length})` }]} value={tab} onChange={setTab} /></div>

      {loading ? <Skeleton className="h-40" /> : tab === 'faults' ? (
        faults.length === 0 ? <EmptyState title="No faults" body="No faults logged." /> : (
          <Surface className="!p-0 overflow-hidden"><div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-b border-border bg-surface-muted/50 text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-2.5">Lab</th><th className="px-4 py-2.5">Asset</th><th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5">Severity</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5"></th>
              </tr></thead>
              <tbody>
                {faults.map((f) => (
                  <tr key={f.id} className="border-b border-border/60">
                    <td className="px-4 py-2.5">{f.labName}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{f.assetTag ?? '—'}</td>
                    <td className="px-4 py-2.5 max-w-[280px] truncate">{f.description}</td>
                    <td className="px-4 py-2.5"><Badge className={f.severity === 'CRITICAL' || f.severity === 'HIGH' ? 'bg-danger-soft text-danger' : ''}>{f.severity}</Badge></td>
                    <td className="px-4 py-2.5"><StatusBadge status={f.status} /></td>
                    <td className="px-4 py-2.5 text-right">{canFault && f.status !== 'CLOSED' && (
                      <Select value={f.status} onChange={async (e) => { try { await labApi.updateFault(f.id, { status: e.target.value }); load(); toast('Updated'); } catch (er) { toast(er instanceof Error ? er.message : 'Failed', 'error'); } }} className="w-auto">
                        {FAULT_STATES.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
                      </Select>
                    )}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></Surface>
        )
      ) : (
        repairs.length === 0 ? <EmptyState title="No repairs" body="No repair requests." /> : (
          <Surface className="!p-0 overflow-hidden"><div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead><tr className="border-b border-border bg-surface-muted/50 text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-2.5">Lab</th><th className="px-4 py-2.5">Asset</th><th className="px-4 py-2.5">Action</th>
                <th className="px-4 py-2.5">Est. cost</th><th className="px-4 py-2.5">Approval</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5"></th>
              </tr></thead>
              <tbody>
                {repairs.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="px-4 py-2.5">{r.labName}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.assetTag ?? '—'}</td>
                    <td className="px-4 py-2.5 max-w-[240px] truncate">{r.requestedAction}</td>
                    <td className="px-4 py-2.5">{money(r.estimatedCost)}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={r.approvalStatus} /></td>
                    <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-2.5 text-right"><div className="flex justify-end gap-1">
                      {canApprove && r.approvalStatus === 'PENDING' && <>
                        <Button size="sm" onClick={async () => { try { await labApi.updateRepair(r.id, { approvalStatus: 'APPROVED' }); load(); toast('Approved'); } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); } }}>Approve</Button>
                        <Button size="sm" variant="danger-soft" onClick={async () => { try { await labApi.updateRepair(r.id, { approvalStatus: 'REJECTED' }); load(); } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); } }}>Reject</Button>
                      </>}
                      {canRepair && r.approvalStatus === 'APPROVED' && r.status === 'REQUESTED' && <Button size="sm" variant="secondary" onClick={async () => { try { await labApi.updateRepair(r.id, { status: 'IN_PROGRESS' }); load(); } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); } }}>Start</Button>}
                      {canRepair && r.status === 'IN_PROGRESS' && <Button size="sm" onClick={async () => { try { await labApi.updateRepair(r.id, { status: 'COMPLETED', postRepairCondition: 'GOOD' }); load(); toast('Completed'); } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); } }}>Complete</Button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></Surface>
        )
      )}

      {newFault && <FaultForm labs={labs} onClose={() => setNewFault(false)} onDone={() => { setNewFault(false); load(); toast('Fault logged'); }} />}
      {newRepair && <RepairForm labs={labs} onClose={() => setNewRepair(false)} onDone={() => { setNewRepair(false); load(); toast('Repair raised'); }} />}
    </div>
  );
}

function FaultForm({ labs, onClose, onDone }: { labs: { id: number; name: string }[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({ labId: '', assetId: '', description: '', severity: 'MEDIUM', faultCategory: 'GENERAL', impact: '' });
  const submit = async () => {
    if (!f.labId || !f.description) { toast('Lab and description required', 'error'); return; }
    try { await labApi.createFault({ labId: Number(f.labId), assetId: f.assetId ? Number(f.assetId) : null, description: f.description, severity: f.severity, faultCategory: f.faultCategory, impact: f.impact || null }); onDone(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };
  return (
    <Modal open title="Log fault" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Log</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Lab"><Select value={f.labId} onChange={(e) => setF((v) => ({ ...v, labId: e.target.value }))}><option value="">Select…</option>{labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
        <Field label="Asset ID (optional)"><Input value={f.assetId} onChange={(e) => setF((v) => ({ ...v, assetId: e.target.value }))} /></Field>
        <Field label="Severity"><Select value={f.severity} onChange={(e) => setF((v) => ({ ...v, severity: e.target.value }))}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></Select></Field>
        <Field label="Category"><Input value={f.faultCategory} onChange={(e) => setF((v) => ({ ...v, faultCategory: e.target.value }))} /></Field>
      </div>
      <div className="mt-3 grid gap-3">
        <Field label="Description"><Textarea value={f.description} onChange={(e) => setF((v) => ({ ...v, description: e.target.value }))} rows={2} /></Field>
        <Field label="Operational impact"><Input value={f.impact} onChange={(e) => setF((v) => ({ ...v, impact: e.target.value }))} /></Field>
      </div>
    </Modal>
  );
}

function RepairForm({ labs, onClose, onDone }: { labs: { id: number; name: string }[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({ labId: '', assetId: '', requestedAction: '', priority: 'NORMAL', vendor: '', estimatedCost: '' });
  const submit = async () => {
    if (!f.labId || !f.requestedAction) { toast('Lab and action required', 'error'); return; }
    try { await labApi.createRepair({ labId: Number(f.labId), assetId: f.assetId ? Number(f.assetId) : null, requestedAction: f.requestedAction, priority: f.priority, vendor: f.vendor || null, estimatedCost: f.estimatedCost ? Number(f.estimatedCost) : null }); onDone(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };
  return (
    <Modal open title="Raise repair request" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Raise</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Lab"><Select value={f.labId} onChange={(e) => setF((v) => ({ ...v, labId: e.target.value }))}><option value="">Select…</option>{labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
        <Field label="Asset ID (optional)"><Input value={f.assetId} onChange={(e) => setF((v) => ({ ...v, assetId: e.target.value }))} /></Field>
        <Field label="Priority"><Select value={f.priority} onChange={(e) => setF((v) => ({ ...v, priority: e.target.value }))}><option>LOW</option><option>NORMAL</option><option>HIGH</option><option>URGENT</option></Select></Field>
        <Field label="Vendor"><Input value={f.vendor} onChange={(e) => setF((v) => ({ ...v, vendor: e.target.value }))} /></Field>
        <Field label="Estimated cost"><Input type="number" value={f.estimatedCost} onChange={(e) => setF((v) => ({ ...v, estimatedCost: e.target.value }))} /></Field>
      </div>
      <div className="mt-3"><Field label="Requested action"><Textarea value={f.requestedAction} onChange={(e) => setF((v) => ({ ...v, requestedAction: e.target.value }))} rows={2} /></Field></div>
    </Modal>
  );
}
