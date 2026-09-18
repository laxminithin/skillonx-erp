import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader, Surface, Button, Input, Select, Field, Modal, Drawer, Badge, FilterChip, EmptyState, Skeleton, useToast } from '../../components/ui';
import { labApi, canLab, type StockItem } from '../../lib/labApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { useLabMeta, useLabs, fmtDate } from './shared';

export function LabStockPage() {
  useDocumentTitle('Lab Stock');
  const meta = useLabMeta();
  const labs = useLabs();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [rows, setRows] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowOnly, setLowOnly] = useState(params.get('lowOnly') === '1');
  const [labId, setLabId] = useState('');
  const [creating, setCreating] = useState(false);
  const [moveItem, setMoveItem] = useState<StockItem | null>(null);
  const [ledgerId, setLedgerId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    labApi.stock({ lowOnly: lowOnly ? 1 : undefined, labId }).then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
  }, [lowOnly, labId]);
  useEffect(() => { load(); }, [load]);
  const canManage = canLab(meta, 'lab.stock.manage');

  return (
    <div>
      <PageHeader title="Inventory / Stock" subtitle="Consumable stock with an auditable movement ledger" actions={canManage ? <Button onClick={() => setCreating(true)}>New item</Button> : undefined} />
      <Surface className="mb-4 !p-3">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={lowOnly} onClick={() => setLowOnly((v) => !v)}>Low stock only</FilterChip>
          <Select value={labId} onChange={(e) => setLabId(e.target.value)} aria-label="Filter by lab" className="w-auto"><option value="">All labs</option>{labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select>
        </div>
      </Surface>
      {loading ? <Skeleton className="h-40" /> : rows.length === 0 ? <EmptyState title="No stock items" body="Create a consumable item to start tracking." /> : (
        <Surface className="!p-0 overflow-hidden"><div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b border-border bg-surface-muted/50 text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-2.5">Item</th><th className="px-4 py-2.5">Lab</th><th className="px-4 py-2.5">Unit</th>
              <th className="px-4 py-2.5 text-right">In stock</th><th className="px-4 py-2.5 text-right">Min</th><th className="px-4 py-2.5"></th>
            </tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-border/60">
                  <td className="px-4 py-2.5 font-medium text-ink">{s.name} {s.lowStock && <Badge className="ml-1 bg-danger-soft text-danger">Low</Badge>}</td>
                  <td className="px-4 py-2.5 text-ink-muted">{s.labName}</td>
                  <td className="px-4 py-2.5">{s.unit}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{s.currentStock}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-ink-muted">{s.minThreshold}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="tertiary" onClick={() => setLedgerId(s.id)}>Ledger</Button>
                      {canManage && <Button size="sm" variant="secondary" onClick={() => setMoveItem(s)}>Move</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></Surface>
      )}

      {creating && <StockCreate labs={labs} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load(); toast('Item created'); }} />}
      {moveItem && <MoveStock item={moveItem} types={meta?.movementTypes ?? []} onClose={() => setMoveItem(null)} onDone={() => { setMoveItem(null); load(); toast('Movement recorded'); }} />}
      {ledgerId != null && <Ledger id={ledgerId} onClose={() => setLedgerId(null)} />}
    </div>
  );
}

function StockCreate({ labs, onClose, onCreated }: { labs: { id: number; name: string }[]; onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({ labId: '', name: '', unit: 'NOS', openingStock: '0', minThreshold: '0' });
  const submit = async () => {
    if (!f.labId || !f.name) { toast('Lab and name required', 'error'); return; }
    try { await labApi.createStock({ labId: Number(f.labId), name: f.name, unit: f.unit, openingStock: Number(f.openingStock), minThreshold: Number(f.minThreshold) }); onCreated(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };
  return (
    <Modal open title="New stock item" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Create</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Lab"><Select value={f.labId} onChange={(e) => setF((v) => ({ ...v, labId: e.target.value }))}><option value="">Select…</option>{labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
        <Field label="Name"><Input value={f.name} onChange={(e) => setF((v) => ({ ...v, name: e.target.value }))} /></Field>
        <Field label="Unit"><Input value={f.unit} onChange={(e) => setF((v) => ({ ...v, unit: e.target.value }))} /></Field>
        <Field label="Opening stock"><Input type="number" value={f.openingStock} onChange={(e) => setF((v) => ({ ...v, openingStock: e.target.value }))} /></Field>
        <Field label="Min threshold"><Input type="number" value={f.minThreshold} onChange={(e) => setF((v) => ({ ...v, minThreshold: e.target.value }))} /></Field>
      </div>
    </Modal>
  );
}

function MoveStock({ item, types, onClose, onDone }: { item: StockItem; types: string[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({ movementType: 'RECEIPT', quantity: '1', reason: '' });
  const submit = async () => {
    try { await labApi.moveStock(item.id, { movementType: f.movementType, quantity: Number(f.quantity), reason: f.reason || null }); onDone(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };
  return (
    <Modal open title={`Stock movement — ${item.name}`} description={`Current: ${item.currentStock} ${item.unit}`} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Record</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Type"><Select value={f.movementType} onChange={(e) => setF((v) => ({ ...v, movementType: e.target.value }))}>{types.map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
        <Field label="Quantity" hint={f.movementType === 'ADJUSTMENT' ? 'Sets absolute balance' : undefined}><Input type="number" value={f.quantity} onChange={(e) => setF((v) => ({ ...v, quantity: e.target.value }))} /></Field>
      </div>
      <div className="mt-3"><Field label="Reason"><Input value={f.reason} onChange={(e) => setF((v) => ({ ...v, reason: e.target.value }))} /></Field></div>
    </Modal>
  );
}

function Ledger({ id, onClose }: { id: number; onClose: () => void }) {
  const [data, setData] = useState<{ item: StockItem; movements: any[] } | null>(null);
  useEffect(() => { labApi.ledger(id).then(setData).catch(() => setData(null)); }, [id]);
  return (
    <Drawer open title={data ? data.item.name : 'Ledger'} description="Stock movement ledger" onClose={onClose} width="md">
      {!data ? <Skeleton className="h-40" /> : data.movements.length === 0 ? <p className="text-sm text-ink-muted">No movements.</p> : (
        <ul className="space-y-2 text-sm">
          {data.movements.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
              <span><Badge>{m.movementType}</Badge> <span className="ml-1 tabular-nums">{m.quantity}</span> {m.reason ? <span className="text-ink-muted">· {m.reason}</span> : null}</span>
              <span className="shrink-0 text-right"><span className="tabular-nums">bal {m.balanceAfter}</span><br /><span className="text-xs text-ink-muted">{fmtDate(m.createdAt)}</span></span>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
