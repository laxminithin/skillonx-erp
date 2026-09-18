import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  FileInput,
  FileText,
  GitCompare,
  PackageCheck,
  Plus,
  ReceiptText,
  RefreshCw,
  ShoppingCart,
  Truck,
  Warehouse,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Badge, Button, Field, Input, Select, StatusBadge, Surface, Textarea } from '../../components/ui';
import { cn } from '../../lib/utils';

type AnyRow = Record<string, any>;

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Warehouse },
  { id: 'indents', label: 'Indents', icon: ClipboardList },
  { id: 'approvals', label: 'Approvals', icon: ClipboardCheck },
  { id: 'vendors', label: 'Vendors', icon: Truck },
  { id: 'rfq', label: 'RFQ / Quotations', icon: GitCompare },
  { id: 'po', label: 'Purchase Orders', icon: ShoppingCart },
  { id: 'grn', label: 'Goods Receipts', icon: PackageCheck },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'movements', label: 'Issues / Returns / Transfers', icon: ArrowRightLeft },
  { id: 'reports', label: 'Reports', icon: FileBarChart },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function numberish(value: any) {
  return Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function MiniMetric({ label, value }: { label: string; value: any }) {
  return (
    <Surface className="p-4">
      <p className="text-xs font-medium uppercase text-ink-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{numberish(value)}</p>
    </Surface>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="rounded-[var(--radius-md)] border border-dashed border-border p-6 text-center text-sm text-ink-muted">{label}</div>;
}

function DataTable({ columns, rows }: { columns: Array<[string, string]>; rows: AnyRow[] }) {
  if (!rows.length) return <Empty label="No records in this view" />;
  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-surface-muted">
          <tr>
            {columns.map(([key, label]) => (
              <th key={key} className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase text-ink-muted">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-surface">
          {rows.map((row, index) => (
            <tr key={row.id ?? index}>
              {columns.map(([key]) => (
                <td key={key} className="whitespace-nowrap px-3 py-2 text-ink-secondary">
                  {key === 'status' || key.endsWith('Status') || key === 'inspectionStatus' ? <StatusBadge status={String(row[key] ?? 'DRAFT')} /> : String(row[key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function useProcurementData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnyRow>({});
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashboard, masters, indents, pos, grns, inventory, ledger, reports, reconciliation] = await Promise.all([
        api<AnyRow>('/api/procurement/dashboard'),
        api<AnyRow>('/api/procurement/masters'),
        api<AnyRow>('/api/procurement/indents'),
        api<AnyRow>('/api/procurement/purchase-orders'),
        api<AnyRow>('/api/procurement/grns'),
        api<AnyRow>('/api/procurement/inventory'),
        api<AnyRow>('/api/procurement/ledger?limit=100'),
        api<AnyRow>('/api/procurement/reports'),
        api<AnyRow>('/api/procurement/reconciliation'),
      ]);
      setData({ dashboard, masters, indents, pos, grns, inventory, ledger, reports, reconciliation });
    } catch (err: any) {
      setError(err.message ?? 'Unable to load procurement workspace');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);
  return { loading, error, data, load };
}

function MasterForms({ masters, onDone }: { masters: AnyRow; onDone: () => void }) {
  const [unit, setUnit] = useState({ code: 'NOS', name: 'Nos' });
  const [category, setCategory] = useState({ code: 'STATIONERY', name: 'Stationery' });
  const [store, setStore] = useState({ code: 'CENTRAL', name: 'Central Store', storeType: 'CENTRAL' });
  const [item, setItem] = useState({ itemCode: '', name: '', unitId: '', categoryId: '', itemType: 'CONSUMABLE', reorderLevel: '0' });
  const [vendor, setVendor] = useState({ vendorCode: '', name: '', email: '', phone: '', taxIdentifier: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (path: string, body: AnyRow) => {
    setBusy(true);
    try {
      await api(path, { method: 'POST', body: JSON.stringify(body) });
      await onDone();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Surface className="p-4">
        <h3 className="text-base font-semibold">Item Master Setup</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Unit code"><Input value={unit.code} onChange={(e) => setUnit({ ...unit, code: e.target.value })} /></Field>
          <Field label="Unit name"><Input value={unit.name} onChange={(e) => setUnit({ ...unit, name: e.target.value })} /></Field>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => submit('/api/procurement/units', unit)}><Plus size={16} /> Save unit</Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Category code"><Input value={category.code} onChange={(e) => setCategory({ ...category, code: e.target.value })} /></Field>
          <Field label="Category name"><Input value={category.name} onChange={(e) => setCategory({ ...category, name: e.target.value })} /></Field>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => submit('/api/procurement/categories', category)}><Plus size={16} /> Save category</Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Item code"><Input value={item.itemCode} onChange={(e) => setItem({ ...item, itemCode: e.target.value })} /></Field>
          <Field label="Item name"><Input value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} /></Field>
          <Field label="Unit"><Select value={item.unitId} onChange={(e) => setItem({ ...item, unitId: e.target.value })}><option value="">Select</option>{(masters.units ?? []).map((u: AnyRow) => <option key={u.id} value={u.id}>{u.code}</option>)}</Select></Field>
          <Field label="Category"><Select value={item.categoryId} onChange={(e) => setItem({ ...item, categoryId: e.target.value })}><option value="">None</option>{(masters.categories ?? []).map((c: AnyRow) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Type"><Select value={item.itemType} onChange={(e) => setItem({ ...item, itemType: e.target.value })}><option>CONSUMABLE</option><option>NON_CONSUMABLE</option><option>SPARE</option><option>EQUIPMENT</option><option>ASSET_TRACKABLE</option></Select></Field>
          <Field label="Reorder level"><Input type="number" value={item.reorderLevel} onChange={(e) => setItem({ ...item, reorderLevel: e.target.value })} /></Field>
          <Button type="button" disabled={busy || !item.itemCode || !item.name || !item.unitId} onClick={() => submit('/api/procurement/items', { ...item, unitId: Number(item.unitId), categoryId: item.categoryId ? Number(item.categoryId) : null, reorderLevel: Number(item.reorderLevel) })}><Plus size={16} /> Create item</Button>
        </div>
      </Surface>
      <Surface className="p-4">
        <h3 className="text-base font-semibold">Stores & Vendors</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Store code"><Input value={store.code} onChange={(e) => setStore({ ...store, code: e.target.value })} /></Field>
          <Field label="Store name"><Input value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} /></Field>
          <Field label="Store type"><Input value={store.storeType} onChange={(e) => setStore({ ...store, storeType: e.target.value })} /></Field>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => submit('/api/procurement/stores', store)}><Warehouse size={16} /> Create store</Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Vendor code"><Input value={vendor.vendorCode} onChange={(e) => setVendor({ ...vendor, vendorCode: e.target.value })} /></Field>
          <Field label="Vendor name"><Input value={vendor.name} onChange={(e) => setVendor({ ...vendor, name: e.target.value })} /></Field>
          <Field label="Email" optional><Input value={vendor.email} onChange={(e) => setVendor({ ...vendor, email: e.target.value })} /></Field>
          <Field label="Phone" optional><Input value={vendor.phone} onChange={(e) => setVendor({ ...vendor, phone: e.target.value })} /></Field>
          <Field label="Tax ID" optional><Input value={vendor.taxIdentifier} onChange={(e) => setVendor({ ...vendor, taxIdentifier: e.target.value })} /></Field>
          <Button type="button" disabled={busy || !vendor.vendorCode || !vendor.name} onClick={() => submit('/api/procurement/vendors', { ...vendor, email: vendor.email || null, phone: vendor.phone || null, taxIdentifier: vendor.taxIdentifier || null })}><Truck size={16} /> Create vendor</Button>
        </div>
      </Surface>
    </div>
  );
}

function WorkflowForms({ masters, onDone }: { masters: AnyRow; onDone: () => void }) {
  const [indent, setIndent] = useState({ itemId: '', quantity: '1', consumerModule: 'DEPARTMENT', purpose: '', requiredDate: today(), deliveryStoreId: '' });
  const [po, setPo] = useState({ vendorId: '', itemId: '', quantity: '1', rate: '0', deliveryStoreId: '', expectedDate: today() });
  const [issue, setIssue] = useState({ storeId: '', itemId: '', quantity: '1', consumerModule: 'DEPARTMENT', issueDate: today(), purpose: '' });
  const [transfer, setTransfer] = useState({ fromStoreId: '', toStoreId: '', itemId: '', quantity: '1', transferDate: today() });
  const [busy, setBusy] = useState(false);
  const submit = async (path: string, body: AnyRow) => {
    setBusy(true);
    try {
      await api(path, { method: 'POST', body: JSON.stringify(body) });
      await onDone();
    } finally {
      setBusy(false);
    }
  };
  const itemOptions = (masters.items ?? []).map((i: AnyRow) => <option key={i.id} value={i.id}>{i.itemCode} - {i.name}</option>);
  const storeOptions = (masters.stores ?? []).map((s: AnyRow) => <option key={s.id} value={s.id}>{s.name}</option>);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Surface className="p-4">
        <h3 className="text-base font-semibold">Indent / Requisition</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Item"><Select value={indent.itemId} onChange={(e) => setIndent({ ...indent, itemId: e.target.value })}><option value="">Select</option>{itemOptions}</Select></Field>
          <Field label="Quantity"><Input type="number" value={indent.quantity} onChange={(e) => setIndent({ ...indent, quantity: e.target.value })} /></Field>
          <Field label="Consumer"><Select value={indent.consumerModule} onChange={(e) => setIndent({ ...indent, consumerModule: e.target.value })}><option>DEPARTMENT</option><option>LAB</option><option>HOSTEL</option><option>TRANSPORT</option><option>MAINTENANCE</option><option>ADMINISTRATION</option><option>IT</option></Select></Field>
          <Field label="Delivery store" optional><Select value={indent.deliveryStoreId} onChange={(e) => setIndent({ ...indent, deliveryStoreId: e.target.value })}><option value="">None</option>{storeOptions}</Select></Field>
          <Field label="Required date"><Input type="date" value={indent.requiredDate} onChange={(e) => setIndent({ ...indent, requiredDate: e.target.value })} /></Field>
          <Field label="Purpose"><Textarea value={indent.purpose} onChange={(e) => setIndent({ ...indent, purpose: e.target.value })} /></Field>
          <Button disabled={busy || !indent.itemId} onClick={() => submit('/api/procurement/indents', { consumerModule: indent.consumerModule, purpose: indent.purpose || null, requiredDate: indent.requiredDate, deliveryStoreId: indent.deliveryStoreId ? Number(indent.deliveryStoreId) : null, items: [{ itemId: Number(indent.itemId), quantity: Number(indent.quantity) }] })}><FileInput size={16} /> Submit indent</Button>
        </div>
      </Surface>
      <Surface className="p-4">
        <h3 className="text-base font-semibold">Purchase Order Draft</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Vendor"><Select value={po.vendorId} onChange={(e) => setPo({ ...po, vendorId: e.target.value })}><option value="">Select</option>{(masters.vendors ?? []).map((v: AnyRow) => <option key={v.id} value={v.id}>{v.name}</option>)}</Select></Field>
          <Field label="Item"><Select value={po.itemId} onChange={(e) => setPo({ ...po, itemId: e.target.value })}><option value="">Select</option>{itemOptions}</Select></Field>
          <Field label="Quantity"><Input type="number" value={po.quantity} onChange={(e) => setPo({ ...po, quantity: e.target.value })} /></Field>
          <Field label="Rate"><Input type="number" value={po.rate} onChange={(e) => setPo({ ...po, rate: e.target.value })} /></Field>
          <Field label="Delivery store"><Select value={po.deliveryStoreId} onChange={(e) => setPo({ ...po, deliveryStoreId: e.target.value })}><option value="">Select</option>{storeOptions}</Select></Field>
          <Field label="Expected date"><Input type="date" value={po.expectedDate} onChange={(e) => setPo({ ...po, expectedDate: e.target.value })} /></Field>
          <Button disabled={busy || !po.vendorId || !po.itemId} onClick={() => submit('/api/procurement/purchase-orders', { vendorId: Number(po.vendorId), deliveryStoreId: po.deliveryStoreId ? Number(po.deliveryStoreId) : null, expectedDate: po.expectedDate, items: [{ itemId: Number(po.itemId), quantity: Number(po.quantity), rate: Number(po.rate) }] })}><FileText size={16} /> Create PO</Button>
        </div>
      </Surface>
      <Surface className="p-4">
        <h3 className="text-base font-semibold">Stock Issue</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Store"><Select value={issue.storeId} onChange={(e) => setIssue({ ...issue, storeId: e.target.value })}><option value="">Select</option>{storeOptions}</Select></Field>
          <Field label="Item"><Select value={issue.itemId} onChange={(e) => setIssue({ ...issue, itemId: e.target.value })}><option value="">Select</option>{itemOptions}</Select></Field>
          <Field label="Quantity"><Input type="number" value={issue.quantity} onChange={(e) => setIssue({ ...issue, quantity: e.target.value })} /></Field>
          <Field label="Consumer"><Select value={issue.consumerModule} onChange={(e) => setIssue({ ...issue, consumerModule: e.target.value })}><option>DEPARTMENT</option><option>LAB</option><option>HOSTEL</option><option>TRANSPORT</option><option>MAINTENANCE</option><option>ADMINISTRATION</option><option>IT</option></Select></Field>
          <Field label="Issue date"><Input type="date" value={issue.issueDate} onChange={(e) => setIssue({ ...issue, issueDate: e.target.value })} /></Field>
          <Field label="Purpose"><Textarea value={issue.purpose} onChange={(e) => setIssue({ ...issue, purpose: e.target.value })} /></Field>
          <Button disabled={busy || !issue.storeId || !issue.itemId} onClick={() => submit('/api/procurement/issues', { storeId: Number(issue.storeId), consumerModule: issue.consumerModule, issueDate: issue.issueDate, purpose: issue.purpose || null, items: [{ itemId: Number(issue.itemId), quantity: Number(issue.quantity) }] })}><ReceiptText size={16} /> Issue stock</Button>
        </div>
      </Surface>
      <Surface className="p-4">
        <h3 className="text-base font-semibold">Store Transfer</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="From store"><Select value={transfer.fromStoreId} onChange={(e) => setTransfer({ ...transfer, fromStoreId: e.target.value })}><option value="">Select</option>{storeOptions}</Select></Field>
          <Field label="To store"><Select value={transfer.toStoreId} onChange={(e) => setTransfer({ ...transfer, toStoreId: e.target.value })}><option value="">Select</option>{storeOptions}</Select></Field>
          <Field label="Item"><Select value={transfer.itemId} onChange={(e) => setTransfer({ ...transfer, itemId: e.target.value })}><option value="">Select</option>{itemOptions}</Select></Field>
          <Field label="Quantity"><Input type="number" value={transfer.quantity} onChange={(e) => setTransfer({ ...transfer, quantity: e.target.value })} /></Field>
          <Field label="Transfer date"><Input type="date" value={transfer.transferDate} onChange={(e) => setTransfer({ ...transfer, transferDate: e.target.value })} /></Field>
          <Button disabled={busy || !transfer.fromStoreId || !transfer.toStoreId || !transfer.itemId} onClick={() => submit('/api/procurement/transfers', { fromStoreId: Number(transfer.fromStoreId), toStoreId: Number(transfer.toStoreId), transferDate: transfer.transferDate, items: [{ itemId: Number(transfer.itemId), quantity: Number(transfer.quantity) }] })}><ArrowRightLeft size={16} /> Transfer</Button>
        </div>
      </Surface>
    </div>
  );
}

export function ProcurementPage() {
  const [active, setActive] = useState('dashboard');
  const { loading, error, data, load } = useProcurementData();
  const metrics = data.dashboard?.metrics ?? {};
  const masters = data.masters ?? {};
  const pendingIndents = useMemo(() => (data.indents?.indents ?? []).filter((i: AnyRow) => ['SUBMITTED', 'RETURNED'].includes(i.status)), [data.indents]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase text-accent">Stores & Purchase / Procurement</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Institutional Procurement Workspace</h1>
        </div>
        <Button variant="secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={16} /> Refresh</Button>
      </div>
      {error ? <Surface className="border-danger/30 bg-danger-soft p-4 text-sm text-danger">{error}</Surface> : null}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActive(tab.id)} className={cn('inline-flex h-9 shrink-0 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-sm font-medium', active === tab.id ? 'border-accent bg-accent text-white' : 'border-border bg-surface text-ink-secondary hover:bg-surface-muted')}>
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>
      {active === 'dashboard' ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MiniMetric label="Active items" value={metrics.activeItems} />
            <MiniMetric label="Pending indents" value={metrics.pendingIndents} />
            <MiniMetric label="POs awaiting delivery" value={metrics.posAwaitingDelivery} />
            <MiniMetric label="Low stock" value={metrics.lowStock} />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Surface className="p-4">
              <h3 className="mb-3 text-base font-semibold">Recent Stock Movements</h3>
              <DataTable columns={[['movementType', 'Type'], ['itemName', 'Item'], ['storeName', 'Store'], ['quantity', 'Qty'], ['balanceAfter', 'Balance']]} rows={data.dashboard?.recentMovements ?? []} />
            </Surface>
            <Surface className="p-4">
              <h3 className="text-base font-semibold">Freeze Gate Signals</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between"><span>Ledger reconciliation</span><Badge className={data.reconciliation?.ok ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}>{data.reconciliation?.ok ? 'PASS' : 'CHECK'}</Badge></div>
                <div className="flex items-center justify-between"><span>Finance handoffs pending</span><span>{numberish(metrics.financeHandoffsPending)}</span></div>
                <div className="flex items-center justify-between"><span>GRNs pending inspection</span><span>{numberish(metrics.grnsPendingInspection)}</span></div>
                <div className="flex items-center justify-between"><span>Open RFQs</span><span>{numberish(metrics.openRfqs)}</span></div>
              </div>
            </Surface>
          </div>
        </>
      ) : null}
      {active === 'indents' ? <><WorkflowForms masters={masters} onDone={load} /><DataTable columns={[['indentNo', 'Indent'], ['consumerModule', 'Consumer'], ['purpose', 'Purpose'], ['estimatedTotal', 'Estimated'], ['status', 'Status']]} rows={data.indents?.indents ?? []} /></> : null}
      {active === 'approvals' ? <DataTable columns={[['indentNo', 'Indent'], ['consumerModule', 'Consumer'], ['purpose', 'Purpose'], ['status', 'Status']]} rows={pendingIndents} /> : null}
      {active === 'vendors' ? <><MasterForms masters={masters} onDone={load} /><DataTable columns={[['vendorCode', 'Code'], ['name', 'Vendor'], ['contactPerson', 'Contact'], ['email', 'Email'], ['verificationStatus', 'Verification']]} rows={masters.vendors ?? []} /></> : null}
      {active === 'rfq' ? <Surface className="p-4"><h3 className="mb-3 text-base font-semibold">Quotation Comparison</h3><Empty label="RFQ issue, quotation recording, comparison, and selection are available through secured API endpoints; connect institutional RFQ forms as purchasing policy stabilizes." /></Surface> : null}
      {active === 'po' ? <><WorkflowForms masters={masters} onDone={load} /><DataTable columns={[['poNo', 'PO'], ['vendorName', 'Vendor'], ['totalAmount', 'Total'], ['revisionNo', 'Rev'], ['status', 'Status']]} rows={data.pos?.purchaseOrders ?? []} /></> : null}
      {active === 'grn' ? <DataTable columns={[['grnNo', 'GRN'], ['poId', 'PO ID'], ['deliveryReference', 'Delivery Ref'], ['invoiceReference', 'Invoice Ref'], ['inspectionStatus', 'Inspection']]} rows={data.grns?.grns ?? []} /> : null}
      {active === 'inventory' ? <><MasterForms masters={masters} onDone={load} /><DataTable columns={[['itemCode', 'Code'], ['itemName', 'Item'], ['storeName', 'Store'], ['quantity', 'Qty'], ['unitCode', 'Unit'], ['lowStock', 'Low stock']]} rows={data.inventory?.balances ?? []} /></> : null}
      {active === 'movements' ? <><WorkflowForms masters={masters} onDone={load} /><DataTable columns={[['movementType', 'Type'], ['itemName', 'Item'], ['storeName', 'Store'], ['quantity', 'Qty'], ['balanceAfter', 'Balance'], ['sourceType', 'Source']]} rows={data.ledger?.movements ?? []} /></> : null}
      {active === 'reports' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Surface className="p-4"><h3 className="mb-3 text-base font-semibold">Vendor Purchase History</h3><DataTable columns={[['vendorName', 'Vendor'], ['orders', 'Orders'], ['total', 'Total']]} rows={data.reports?.purchaseHistory ?? []} /></Surface>
          <Surface className="p-4"><h3 className="mb-3 text-base font-semibold">Department / Consumer Consumption</h3><DataTable columns={[['consumerModule', 'Consumer'], ['issues', 'Issues']]} rows={data.reports?.consumption ?? []} /></Surface>
        </div>
      ) : null}
    </div>
  );
}
