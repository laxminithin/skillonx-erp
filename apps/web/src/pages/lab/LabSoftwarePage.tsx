import { useEffect, useState, useCallback } from 'react';
import { PageHeader, Surface, Button, Input, Select, Textarea, Field, Modal, Tabs, StatusBadge, Badge, EmptyState, Skeleton, useToast } from '../../components/ui';
import { labApi, canLab, type LabSoftware, type LabSoftwareRequest } from '../../lib/labApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { useLabMeta, useLabs, fmtDate } from './shared';

export function LabSoftwarePage() {
  useDocumentTitle('Lab Software');
  const meta = useLabMeta();
  const labs = useLabs();
  const { toast } = useToast();
  const [tab, setTab] = useState('inventory');
  const [sw, setSw] = useState<LabSoftware[]>([]);
  const [reqs, setReqs] = useState<LabSoftwareRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSw, setNewSw] = useState(false);
  const [newReq, setNewReq] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([labApi.software(), labApi.softwareRequests()]).then(([s, r]) => { setSw(s); setReqs(r); }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);
  const canManage = canLab(meta, 'lab.software.manage');
  const canRequest = canLab(meta, 'lab.software.request') || canManage;

  return (
    <div>
      <PageHeader title="Software" subtitle="Lab software inventory and installation requests (metadata only — no license secrets)" actions={
        <div className="flex gap-2">
          {canRequest && <Button variant="secondary" onClick={() => setNewReq(true)}>Request install</Button>}
          {canManage && <Button onClick={() => setNewSw(true)}>Add software</Button>}
        </div>
      } />
      <div className="mb-4"><Tabs tabs={[{ id: 'inventory', label: `Inventory (${sw.length})` }, { id: 'requests', label: `Requests (${reqs.length})` }]} value={tab} onChange={setTab} /></div>

      {loading ? <Skeleton className="h-40" /> : tab === 'inventory' ? (
        sw.length === 0 ? <EmptyState title="No software" body="No software recorded." /> : (
          <Surface className="!p-0 overflow-hidden"><div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-b border-border bg-surface-muted/50 text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-2.5">Name</th><th className="px-4 py-2.5">Version</th><th className="px-4 py-2.5">Lab</th>
                <th className="px-4 py-2.5">License</th><th className="px-4 py-2.5">Seats</th><th className="px-4 py-2.5">Expiry</th><th className="px-4 py-2.5">Status</th>
              </tr></thead>
              <tbody>
                {sw.map((s) => (
                  <tr key={s.id} className="border-b border-border/60">
                    <td className="px-4 py-2.5 font-medium text-ink">{s.name}</td><td className="px-4 py-2.5">{s.version ?? '—'}</td>
                    <td className="px-4 py-2.5 text-ink-muted">{s.labName}</td><td className="px-4 py-2.5"><Badge>{s.licenseType}</Badge></td>
                    <td className="px-4 py-2.5">{s.licenseCount ?? '—'}</td><td className="px-4 py-2.5">{fmtDate(s.expiryDate)}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={s.installationStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></Surface>
        )
      ) : (
        reqs.length === 0 ? <EmptyState title="No requests" body="No software installation requests." /> : (
          <Surface className="!p-0 overflow-hidden"><div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-b border-border bg-surface-muted/50 text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-2.5">Software</th><th className="px-4 py-2.5">Lab</th><th className="px-4 py-2.5">Requested by</th>
                <th className="px-4 py-2.5">Needed by</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5"></th>
              </tr></thead>
              <tbody>
                {reqs.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="px-4 py-2.5 font-medium text-ink">{r.softwareName} {r.version ? <span className="text-ink-muted">{r.version}</span> : null}</td>
                    <td className="px-4 py-2.5 text-ink-muted">{r.labName}</td><td className="px-4 py-2.5">{r.requesterName ?? '—'}</td>
                    <td className="px-4 py-2.5">{fmtDate(r.neededBy)}</td><td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-2.5 text-right">{canManage && !['COMPLETED', 'REJECTED'].includes(r.status) && (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" onClick={async () => { try { await labApi.reviewSoftwareRequest(r.id, { status: 'COMPLETED', resolution: 'Installed' }); load(); toast('Marked installed'); } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); } }}>Complete</Button>
                        <Button size="sm" variant="danger-soft" onClick={async () => { try { await labApi.reviewSoftwareRequest(r.id, { status: 'REJECTED' }); load(); } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); } }}>Reject</Button>
                      </div>
                    )}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></Surface>
        )
      )}

      {newSw && <SoftwareForm labs={labs} onClose={() => setNewSw(false)} onDone={() => { setNewSw(false); load(); toast('Software added'); }} />}
      {newReq && <RequestForm labs={labs} onClose={() => setNewReq(false)} onDone={() => { setNewReq(false); load(); toast('Request raised'); }} />}
    </div>
  );
}

function SoftwareForm({ labs, onClose, onDone }: { labs: { id: number; name: string }[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({ labId: '', name: '', version: '', licenseType: 'FREE', licenseCount: '', expiryDate: '' });
  const submit = async () => {
    if (!f.labId || !f.name) { toast('Lab and name required', 'error'); return; }
    try { await labApi.createSoftware({ labId: Number(f.labId), name: f.name, version: f.version || null, licenseType: f.licenseType, licenseCount: f.licenseCount ? Number(f.licenseCount) : null, expiryDate: f.expiryDate || null }); onDone(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };
  return (
    <Modal open title="Add software" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Lab"><Select value={f.labId} onChange={(e) => setF((v) => ({ ...v, labId: e.target.value }))}><option value="">Select…</option>{labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
        <Field label="Name"><Input value={f.name} onChange={(e) => setF((v) => ({ ...v, name: e.target.value }))} /></Field>
        <Field label="Version"><Input value={f.version} onChange={(e) => setF((v) => ({ ...v, version: e.target.value }))} /></Field>
        <Field label="License type"><Select value={f.licenseType} onChange={(e) => setF((v) => ({ ...v, licenseType: e.target.value }))}><option>FREE</option><option>PROPRIETARY</option><option>SUBSCRIPTION</option><option>ACADEMIC</option><option>TRIAL</option></Select></Field>
        <Field label="Seats"><Input type="number" value={f.licenseCount} onChange={(e) => setF((v) => ({ ...v, licenseCount: e.target.value }))} /></Field>
        <Field label="Expiry"><Input type="date" value={f.expiryDate} onChange={(e) => setF((v) => ({ ...v, expiryDate: e.target.value }))} /></Field>
      </div>
    </Modal>
  );
}

function RequestForm({ labs, onClose, onDone }: { labs: { id: number; name: string }[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({ labId: '', softwareName: '', version: '', reason: '', neededBy: '' });
  const submit = async () => {
    if (!f.labId || !f.softwareName) { toast('Lab and software required', 'error'); return; }
    try { await labApi.createSoftwareRequest({ labId: Number(f.labId), softwareName: f.softwareName, version: f.version || null, reason: f.reason || null, neededBy: f.neededBy || null }); onDone(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };
  return (
    <Modal open title="Request software install" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Request</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Lab"><Select value={f.labId} onChange={(e) => setF((v) => ({ ...v, labId: e.target.value }))}><option value="">Select…</option>{labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
        <Field label="Software"><Input value={f.softwareName} onChange={(e) => setF((v) => ({ ...v, softwareName: e.target.value }))} /></Field>
        <Field label="Version"><Input value={f.version} onChange={(e) => setF((v) => ({ ...v, version: e.target.value }))} /></Field>
        <Field label="Needed by"><Input type="date" value={f.neededBy} onChange={(e) => setF((v) => ({ ...v, neededBy: e.target.value }))} /></Field>
      </div>
      <div className="mt-3"><Field label="Reason"><Textarea value={f.reason} onChange={(e) => setF((v) => ({ ...v, reason: e.target.value }))} rows={2} /></Field></div>
    </Modal>
  );
}
