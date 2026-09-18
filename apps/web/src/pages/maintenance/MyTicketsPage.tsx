import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Surface, Button, Tabs, Skeleton } from '../../components/ui';
import { maintApi, type Ticket } from '../../lib/maintenanceApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { TicketTable } from './components';

export function MyTicketsPage() {
  useDocumentTitle('My Service Requests');
  const nav = useNavigate();
  const [rows, setRows] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('OPEN');

  const load = useCallback(() => {
    setLoading(true);
    maintApi.tickets({ statusGroup: tab, pageSize: 100 }).then((r) => setRows(r.rows)).catch(() => setRows([])).finally(() => setLoading(false));
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader
        title="My Service Requests"
        subtitle="Every request you raise flows to the right Facilities or IT team, tracked against SLA until you confirm it is fixed."
        actions={<Button onClick={() => nav('/maintenance/new')}>Raise a request</Button>}
      />
      <div className="mb-4">
        <Tabs tabs={[{ id: 'OPEN', label: 'Open' }, { id: 'CLOSED', label: 'Closed' }]} value={tab} onChange={setTab} />
      </div>
      {loading ? <Skeleton className="h-40" /> : (
        <Surface className="!p-0 overflow-hidden">
          <TicketTable rows={rows} empty={tab === 'OPEN' ? 'You have no open requests. Raise one when something needs service.' : 'No closed requests yet.'} />
        </Surface>
      )}
    </div>
  );
}
