import { useCallback, useEffect, useState } from 'react';
import { PageHeader, Surface, Select, Input, Skeleton, Button } from '../../components/ui';
import { maintApi, type Ticket } from '../../lib/maintenanceApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { useMaintMeta } from './shared';
import { TicketTable } from './components';

export function CentralQueuePage() {
  useDocumentTitle('Central Queue');
  const meta = useMaintMeta();
  const [rows, setRows] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState({ statusGroup: 'OPEN', status: '', priority: '', categoryId: '', sourceModule: '', slaState: '', q: '' });
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    maintApi.tickets({ ...f, page, pageSize: 25 }).then((r) => { setRows(r.rows); setTotal(r.total); }).catch(() => setRows([])).finally(() => setLoading(false));
  }, [f, page]);
  useEffect(() => { load(); }, [load]);
  const upd = (k: string, v: string) => { setPage(1); setF((s) => ({ ...s, [k]: v })); };

  return (
    <div>
      <PageHeader title="Central Queue" subtitle={`${total} tickets · route, assign and track every service request in one place.`} />
      <Surface className="mb-4">
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Select value={f.statusGroup} onChange={(e) => upd('statusGroup', e.target.value)}><option value="">Any state</option><option value="OPEN">Open</option><option value="CLOSED">Closed</option></Select>
          <Select value={f.priority} onChange={(e) => upd('priority', e.target.value)}><option value="">Any priority</option>{['LOW', 'NORMAL', 'HIGH', 'CRITICAL'].map((p) => <option key={p}>{p}</option>)}</Select>
          <Select value={f.categoryId} onChange={(e) => upd('categoryId', e.target.value)}><option value="">Any category</option>{meta?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
          <Select value={f.sourceModule} onChange={(e) => upd('sourceModule', e.target.value)}><option value="">Any source</option>{['GENERAL', 'LAB', 'HOSTEL', 'LIBRARY', 'TRANSPORT', 'CLASSROOM', 'ERP'].map((s) => <option key={s}>{s}</option>)}</Select>
          <Select value={f.slaState} onChange={(e) => upd('slaState', e.target.value)}><option value="">Any SLA</option>{['BREACHED', 'APPROACHING', 'WITHIN', 'PAUSED'].map((s) => <option key={s}>{s}</option>)}</Select>
          <Input placeholder="Search #, title…" value={f.q} onChange={(e) => upd('q', e.target.value)} />
        </div>
      </Surface>
      {loading ? <Skeleton className="h-40" /> : (
        <Surface className="!p-0 overflow-hidden">
          <TicketTable rows={rows} empty="No tickets match these filters." />
        </Surface>
      )}
      {total > 25 && (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="text-ink-muted">Page {page} of {Math.ceil(total / 25)}</span>
          <Button size="sm" variant="secondary" disabled={page >= Math.ceil(total / 25)} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
