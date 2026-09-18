import { useEffect, useState, useCallback } from 'react';
import { PageHeader, Surface, Button, Input, Select, Field, Drawer, Modal, StatusBadge, Badge, SearchInput, EmptyState, Skeleton, useToast } from '../../components/ui';
import { labApi, canLab, type LabAsset, type LabMeta } from '../../lib/labApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { useLabMeta, useLabs, money, fmtDate } from './shared';

export function LabAssetsPage() {
  useDocumentTitle('Lab Assets');
  const meta = useLabMeta();
  const labs = useLabs();
  const { toast } = useToast();
  const [rows, setRows] = useState<LabAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [labId, setLabId] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    labApi.assets({ q, labId, status, category, pageSize: 100 })
      .then((r) => { setRows(r.rows); setTotal(r.total); })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [q, labId, status, category]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const canManage = canLab(meta, 'lab.asset.manage');

  return (
    <div>
      <PageHeader
        title="Assets"
        subtitle={`Laboratory asset register — ${total} item${total === 1 ? '' : 's'}`}
        actions={canManage ? <Button onClick={() => setCreating(true)}>Add asset</Button> : undefined}
      />

      <Surface className="mb-4 !p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search tag, serial or name…" />
          <Select value={labId} onChange={(e) => setLabId(e.target.value)} aria-label="Filter by lab" className="w-auto">
            <option value="">All labs</option>
            {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className="w-auto">
            <option value="">Any status</option>
            {(meta?.operationalStatuses ?? []).map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
          </Select>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category" className="w-auto">
            <option value="">Any category</option>
            {(meta?.categories ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </Surface>

      {loading ? (
        <Surface className="!p-0"><div className="space-y-2 p-4"><Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" /></div></Surface>
      ) : rows.length === 0 ? (
        <EmptyState title="No assets found" body="Adjust filters or register a new asset." />
      ) : (
        <Surface className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-b border-border bg-surface-muted/50 text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="px-4 py-2.5">Tag</th><th className="px-4 py-2.5">Name</th><th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Lab</th><th className="px-4 py-2.5">Condition</th><th className="px-4 py-2.5">Status</th>
              </tr></thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="cursor-pointer border-b border-border/60 hover:bg-surface-muted/40" onClick={() => setDetailId(a.id)}>
                    <td className="px-4 py-2.5 font-mono text-xs">{a.assetTag}</td>
                    <td className="px-4 py-2.5 font-medium text-ink">{a.name}</td>
                    <td className="px-4 py-2.5"><Badge>{a.category}</Badge></td>
                    <td className="px-4 py-2.5 text-ink-muted">{a.labName ?? '—'}</td>
                    <td className="px-4 py-2.5">{a.condition}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={a.operationalStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      )}

      {detailId != null && (
        <AssetDetail id={detailId} meta={meta} canManage={canManage} onClose={() => setDetailId(null)} onChanged={load} />
      )}
      {creating && (
        <AssetCreate meta={meta} labs={labs} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load(); toast('Asset registered'); }} />
      )}
    </div>
  );
}

function AssetDetail({ id, meta, canManage, onClose, onChanged }: { id: number; meta: LabMeta | null; canManage: boolean; onClose: () => void; onChanged: () => void }) {
  const { toast } = useToast();
  const [asset, setAsset] = useState<LabAsset | null>(null);
  const [statusForm, setStatusForm] = useState({ operationalStatus: '', condition: '', note: '' });
  const load = useCallback(() => { labApi.asset(id).then(setAsset).catch(() => setAsset(null)); }, [id]);
  useEffect(() => { load(); }, [load]);

  const submitStatus = async () => {
    try {
      await labApi.changeAssetStatus(id, {
        operationalStatus: statusForm.operationalStatus || undefined,
        condition: statusForm.condition || undefined,
        note: statusForm.note || undefined,
      });
      toast('Asset updated'); setStatusForm({ operationalStatus: '', condition: '', note: '' }); load(); onChanged();
    } catch (e) { toast(e instanceof Error ? e.message : 'Update failed', 'error'); }
  };

  return (
    <Drawer open title={asset ? asset.name : 'Asset'} description={asset?.assetTag} onClose={onClose} width="lg">
      {!asset ? <Skeleton className="h-40" /> : (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2"><StatusBadge status={asset.operationalStatus} /><Badge>{asset.category}</Badge><Badge>{asset.condition}</Badge></div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Serial" value={asset.serialNumber} /><Info label="Lab" value={asset.labName} />
            <Info label="Make / Model" value={[asset.make, asset.model].filter(Boolean).join(' ') || null} />
            <Info label="Custodian" value={asset.custodianName} />
            <Info label="Purchase date" value={fmtDate(asset.purchaseDate)} /><Info label="Cost" value={money(asset.cost)} />
            <Info label="Warranty ends" value={fmtDate(asset.warrantyEnd)} /><Info label="AMC ends" value={fmtDate(asset.amcEnd)} />
            {asset.assetClass === 'COMPUTER' && (<>
              <Info label="Hostname" value={asset.hostname} /><Info label="System #" value={asset.systemNumber} />
              <Info label="Processor" value={asset.processor} /><Info label="RAM" value={asset.ram} />
              <Info label="Storage" value={asset.storage} /><Info label="OS" value={asset.os} />
            </>)}
          </dl>

          {canManage && (
            <div className="rounded-[var(--radius-md)] border border-border p-3">
              <p className="mb-2 text-sm font-semibold">Change status / condition</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Operational status"><Select value={statusForm.operationalStatus} onChange={(e) => setStatusForm((f) => ({ ...f, operationalStatus: e.target.value }))}>
                  <option value="">— keep —</option>{(meta?.operationalStatuses ?? []).map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
                </Select></Field>
                <Field label="Condition"><Select value={statusForm.condition} onChange={(e) => setStatusForm((f) => ({ ...f, condition: e.target.value }))}>
                  <option value="">— keep —</option>{(meta?.conditions ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
                </Select></Field>
              </div>
              <div className="mt-2"><Field label="Note"><Input value={statusForm.note} onChange={(e) => setStatusForm((f) => ({ ...f, note: e.target.value }))} placeholder="Reason for change" /></Field></div>
              <div className="mt-3 flex justify-end"><Button size="sm" onClick={submitStatus} disabled={!statusForm.operationalStatus && !statusForm.condition}>Apply</Button></div>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-semibold">History</p>
            {(asset.history ?? []).length === 0 ? <p className="text-sm text-ink-muted">No history.</p> : (
              <ul className="space-y-1.5 text-sm">
                {(asset.history ?? []).map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5">
                    <span className="text-ink-secondary">{h.action.replaceAll('_', ' ').toLowerCase()}{h.toStatus ? ` → ${h.toStatus}` : ''}{h.note ? ` · ${h.note}` : ''}</span>
                    <span className="shrink-0 text-xs text-ink-muted">{fmtDate(h.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}

function AssetCreate({ meta, labs, onClose, onCreated }: { meta: LabMeta | null; labs: { id: number; name: string }[]; onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({ labId: '', assetTag: '', name: '', category: 'EQUIPMENT', assetClass: 'ASSET', serialNumber: '', make: '', model: '' });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!f.labId || !f.assetTag || !f.name) { toast('Lab, tag and name are required', 'error'); return; }
    setSaving(true);
    try {
      await labApi.createAsset({ ...f, labId: Number(f.labId) });
      onCreated();
    } catch (e) { toast(e instanceof Error ? e.message : 'Create failed', 'error'); } finally { setSaving(false); }
  };
  return (
    <Modal open title="Register asset" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={saving}>Save</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Lab"><Select value={f.labId} onChange={(e) => setF((v) => ({ ...v, labId: e.target.value }))}><option value="">Select…</option>{labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
        <Field label="Asset tag"><Input value={f.assetTag} onChange={(e) => setF((v) => ({ ...v, assetTag: e.target.value }))} placeholder="e.g. CSE-PC-12" /></Field>
        <Field label="Name"><Input value={f.name} onChange={(e) => setF((v) => ({ ...v, name: e.target.value }))} /></Field>
        <Field label="Category"><Select value={f.category} onChange={(e) => setF((v) => ({ ...v, category: e.target.value }))}>{(meta?.categories ?? []).map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
        <Field label="Class"><Select value={f.assetClass} onChange={(e) => setF((v) => ({ ...v, assetClass: e.target.value }))}><option value="ASSET">Asset</option><option value="COMPUTER">Computer</option><option value="ACCESSORY">Accessory</option></Select></Field>
        <Field label="Serial number"><Input value={f.serialNumber} onChange={(e) => setF((v) => ({ ...v, serialNumber: e.target.value }))} /></Field>
        <Field label="Make"><Input value={f.make} onChange={(e) => setF((v) => ({ ...v, make: e.target.value }))} /></Field>
        <Field label="Model"><Input value={f.model} onChange={(e) => setF((v) => ({ ...v, model: e.target.value }))} /></Field>
      </div>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><dt className="text-xs uppercase tracking-wide text-ink-muted">{label}</dt><dd className="mt-0.5 text-ink">{value || '—'}</dd></div>;
}
