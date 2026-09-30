import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Input, PageHeader, Select, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

type Paged<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages: number };

function Status({ value }: { value?: string | null }) {
  return <span className="rounded-full bg-surface-muted px-2 py-1 text-[11px] font-medium text-ink-secondary">{value ?? 'NA'}</span>;
}

function Money({ value }: { value: number }) {
  return <span>Rs {value.toLocaleString('en-IN')}</span>;
}

function usePaged<T>(path: string, fallback: Paged<T>) {
  const [data, setData] = useState<Paged<T>>(fallback);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    api<Paged<T>>(path)
      .then((d) => { if (alive) setData(d); })
      .catch(() => { if (alive) setData(fallback); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [path]);
  return { data, loading };
}

const emptyPage = <T,>(): Paged<T> => ({ items: [], page: 1, pageSize: 25, total: 0, totalPages: 1 });

function CompactTable<T>({ columns, rows, empty }: { columns: string[]; rows: T[]; empty: string; }) {
  return (
    <Surface className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface-muted text-xs uppercase text-ink-muted">
            <tr>{columns.map((c) => <th key={c} className="px-4 py-3 font-semibold">{c}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows as any}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? <p className="p-4 text-sm text-ink-muted">{empty}</p> : null}
    </Surface>
  );
}

function Kpi({ label, value, to }: { label: string; value: number | string; to?: string }) {
  const body = (
    <Surface className="h-full p-4 transition hover:border-border-strong">
      <p className="text-xs uppercase text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </Surface>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export function TransportAdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  useDocumentTitle('Transport Officer Portal');

  useEffect(() => {
    api('/api/transport/dashboard').then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;
  const attention = [
    { label: 'Pending applications', value: data.applicationsPending, to: '/transport/applications' },
    { label: 'Pending route changes', value: data.pendingRouteChanges, to: '/transport/passengers' },
    { label: 'Open complaints', value: data.openComplaints, to: '/transport/complaints' },
    { label: 'Delayed trips', value: data.delayedTrips, to: '/transport/trips' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Transport Officer Portal" subtitle="Operational control for routes, fleet, passengers, passes, and transport clearance." />
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase text-ink-muted">Action required</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {attention.map((item) => <Kpi key={item.label} {...item} />)}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase text-ink-muted">Transport pulse</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Active routes" value={data.activeRoutes} to="/transport/routes" />
          <Kpi label="Active stops" value={data.activeStops} to="/transport/routes" />
          <Kpi label="Vehicles" value={data.vehicles} to="/transport/vehicles" />
          <Kpi label="Active pass holders" value={data.activeTransportStudents} to="/transport/passengers" />
        </div>
      </section>
      <Surface className="p-4">
        <h2 className="text-sm font-semibold">Current operations</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Kpi label="Trips today" value={data.tripsToday} to="/transport/trips" />
          <Kpi label="Cancelled trips" value={data.cancelledTrips} to="/transport/trips" />
          <Kpi label="Waitlisted" value={data.waitlisted} to="/transport/applications" />
        </div>
        <p className="mt-3 text-xs text-ink-muted">{data.liveTrackingNote}</p>
      </Surface>
    </div>
  );
}

export function TransportApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [status, setStatus] = useState('SUBMITTED');
  useDocumentTitle('Transport Applications');
  const load = () => api<{ applications: any[] }>(`/api/transport/applications?status=${status}`).then((d) => setApps(d.applications)).catch(() => setApps([]));
  useEffect(() => { load(); }, [status]);
  const review = (id: number, decision: string) => api(`/api/transport/applications/${id}/review`, { method: 'POST', body: JSON.stringify({ decision }) }).then(load);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Applications" subtitle="Review submitted transport applications. Assignment and pass activation remain backend-enforced." />
      <div className="max-w-xs"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option>SUBMITTED</option><option>UNDER_REVIEW</option><option>APPROVED</option><option>WAITLISTED</option><option>ASSIGNED</option><option>REJECTED</option></Select></div>
      <div className="space-y-3 sm:hidden">
        {apps.map((a) => (
          <Surface key={a.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{a.studentName}</p>
                <p className="text-xs text-ink-muted">{a.usn} - {a.applicationNumber}</p>
              </div>
              <Status value={a.status} />
            </div>
            <p className="mt-3 text-sm text-ink-muted">{a.serviceType} - stops {a.pickupStopPreferenceId ?? 'Pickup'} / {a.dropStopPreferenceId ?? 'Drop'}</p>
            {['SUBMITTED', 'UNDER_REVIEW'].includes(a.status) ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Button size="sm" onClick={() => review(a.id, 'APPROVE')}>Approve</Button>
                <Button size="sm" variant="secondary" onClick={() => review(a.id, 'WAITLIST')}>Waitlist</Button>
                <Button size="sm" variant="ghost" onClick={() => review(a.id, 'REJECT')}>Reject</Button>
              </div>
            ) : <p className="mt-3 text-xs text-ink-muted">Reviewed</p>}
          </Surface>
        ))}
        {apps.length === 0 ? <Surface className="p-4 text-sm text-ink-muted">No applications for this status.</Surface> : null}
      </div>
      <div className="hidden sm:block">
        <CompactTable columns={['Student', 'Application', 'Stops', 'Service', 'Status', 'Actions']} rows={apps.map((a) => (
          <tr key={a.id}>
            <td className="px-4 py-3"><p className="font-medium">{a.studentName}</p><p className="text-xs text-ink-muted">{a.usn}</p></td>
            <td className="px-4 py-3">{a.applicationNumber}</td>
            <td className="px-4 py-3 text-ink-muted">{a.pickupStopPreferenceId ?? 'Pickup'} / {a.dropStopPreferenceId ?? 'Drop'}</td>
            <td className="px-4 py-3">{a.serviceType}</td>
            <td className="px-4 py-3"><Status value={a.status} /></td>
            <td className="px-4 py-3">
              {['SUBMITTED', 'UNDER_REVIEW'].includes(a.status) ? (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => review(a.id, 'APPROVE')}>Approve</Button>
                  <Button size="sm" variant="secondary" onClick={() => review(a.id, 'WAITLIST')}>Waitlist</Button>
                  <Button size="sm" variant="ghost" onClick={() => review(a.id, 'REJECT')}>Reject</Button>
                </div>
              ) : <span className="text-xs text-ink-muted">Reviewed</span>}
            </td>
          </tr>
        ))} empty="No applications for this status." />
      </div>
    </div>
  );
}

export function TransportRoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  useDocumentTitle('Transport Routes');
  useEffect(() => { api<{ routes: any[] }>('/api/transport/routes').then((d) => setRoutes(d.routes)).catch(() => setRoutes([])); }, []);
  useEffect(() => {
    if (!routes[0]) return;
    api(`/api/transport/routes/${routes[0].id}`).then(setSelected).catch(() => setSelected(null));
  }, [routes]);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Routes & Stops" subtitle="Authoritative route records and ordered stop projections." />
      <div className="space-y-3 sm:hidden">
        {routes.map((r) => (
          <Surface key={r.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{r.code} - {r.name}</p>
                <p className="text-sm text-ink-muted">{r.origin} to {r.destination}</p>
              </div>
              <Status value={r.status} />
            </div>
            <Button className="mt-3 w-full" size="sm" variant="secondary" onClick={() => api(`/api/transport/routes/${r.id}`).then(setSelected)}>View stops</Button>
          </Surface>
        ))}
        {routes.length === 0 ? <Surface className="p-4 text-sm text-ink-muted">No routes configured.</Surface> : null}
      </div>
      <div className="hidden sm:block">
        <CompactTable columns={['Code', 'Route', 'Path', 'Status', 'Stops']} rows={routes.map((r) => (
          <tr key={r.id}>
            <td className="px-4 py-3 font-medium">{r.code}</td>
            <td className="px-4 py-3">{r.name}</td>
            <td className="px-4 py-3 text-ink-muted">{r.origin} to {r.destination}</td>
            <td className="px-4 py-3"><Status value={r.status} /></td>
            <td className="px-4 py-3"><Button size="sm" variant="secondary" onClick={() => api(`/api/transport/routes/${r.id}`).then(setSelected)}>View stops</Button></td>
          </tr>
        ))} empty="No routes configured." />
      </div>
      {selected ? (
        <Surface className="p-4">
          <h2 className="font-semibold">{selected.code} - {selected.name}</h2>
          <div className="mt-3 grid gap-2">
            {selected.stops?.map((s: any) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm">
                <span>{s.sequenceNumber}. {s.stopCode} - {s.stopName}</span>
                <span className="text-ink-muted">{s.scheduledPickupTime ?? 'Pickup NA'} / {s.scheduledDropTime ?? 'Drop NA'}</span>
              </div>
            ))}
          </div>
        </Surface>
      ) : null}
    </div>
  );
}

export function TransportVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any>(null);
  useDocumentTitle('Transport Fleet');
  useEffect(() => {
    api<{ vehicles: any[] }>('/api/transport/vehicles').then((d) => setVehicles(d.vehicles)).catch(() => setVehicles([]));
    api('/api/transport/compliance').then(setCompliance).catch(() => setCompliance(null));
  }, []);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Fleet" subtitle="Vehicles, operational state, compliance alerts, and capacity." />
      <CompactTable columns={['Vehicle', 'Type', 'Capacity', 'Operational', 'Status']} rows={vehicles.map((v) => (
        <tr key={v.id}>
          <td className="px-4 py-3 font-medium">{v.vehicleNumber}</td>
          <td className="px-4 py-3">{v.vehicleType}</td>
          <td className="px-4 py-3">{v.totalCapacity}</td>
          <td className="px-4 py-3"><Status value={v.operationalStatus} /></td>
          <td className="px-4 py-3"><Status value={v.status} /></td>
        </tr>
      ))} empty="No vehicles configured." />
      <Surface className="p-4">
        <h2 className="text-sm font-semibold">Compliance alerts</h2>
        <p className="mt-2 text-sm text-ink-muted">{compliance?.alerts?.length ? `${compliance.alerts.length} expiring or expired records need attention.` : 'No vehicle compliance alerts.'}</p>
      </Surface>
    </div>
  );
}

export function TransportPersonnelPage() {
  const [search, setSearch] = useState('');
  const path = useMemo(() => `/api/transport/personnel?search=${encodeURIComponent(search)}`, [search]);
  const { data } = usePaged<any>(path, emptyPage());
  useDocumentTitle('Transport Personnel');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Personnel" subtitle="Drivers, conductors, attendants, and transport staff without duplicating HR records." />
      <Input placeholder="Search personnel" value={search} onChange={(e) => setSearch(e.target.value)} />
      <CompactTable columns={['Name', 'Type', 'Phone', 'License', 'Status']} rows={data.items.map((p) => (
        <tr key={p.id}>
          <td className="px-4 py-3 font-medium">{p.name}</td>
          <td className="px-4 py-3">{p.personnelType}</td>
          <td className="px-4 py-3">{p.phone ?? 'NA'}</td>
          <td className="px-4 py-3 text-ink-muted">{p.licenseNumber ?? 'NA'}</td>
          <td className="px-4 py-3"><Status value={p.status} /></td>
        </tr>
      ))} empty="No transport personnel found." />
    </div>
  );
}

export function TransportPassengersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const path = useMemo(() => `/api/transport/members?status=${status}&search=${encodeURIComponent(search)}`, [status, search]);
  const { data } = usePaged<any>(path, emptyPage());
  useDocumentTitle('Transport Members');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Passengers / Members" subtitle="Active student transport membership and assignment projection." />
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]"><Input placeholder="Search name, USN, or member number" value={search} onChange={(e) => setSearch(e.target.value)} /><Select value={status} onChange={(e) => setStatus(e.target.value)}><option>ACTIVE</option><option>PENDING</option><option>CANCELLATION_PENDING</option><option>CANCELLED</option></Select></div>
      <CompactTable columns={['Member', 'Student', 'Route', 'Stop', 'Pass', 'Status']} rows={data.items.map((m) => (
        <tr key={m.id}>
          <td className="px-4 py-3 font-medium">{m.memberNumber}</td>
          <td className="px-4 py-3"><p>{m.studentName}</p><p className="text-xs text-ink-muted">{m.usn}</p></td>
          <td className="px-4 py-3">{m.routeCode ? `${m.routeCode} - ${m.routeName}` : 'Unassigned'}</td>
          <td className="px-4 py-3">{m.pickupStopName ?? 'NA'}</td>
          <td className="px-4 py-3">{m.passNumber ?? 'NA'}</td>
          <td className="px-4 py-3"><Status value={m.status} /></td>
        </tr>
      ))} empty="No transport members found." />
    </div>
  );
}

export function TransportPassesPage() {
  const [status, setStatus] = useState('ACTIVE');
  const { data } = usePaged<any>(`/api/transport/passes?status=${status}`, emptyPage());
  useDocumentTitle('Transport Passes');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Passes" subtitle="Pass status projection from the authoritative pass lifecycle." />
      <div className="max-w-xs"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option>ACTIVE</option><option>PENDING</option><option>EXPIRED</option><option>REVOKED</option><option>CANCELLED</option></Select></div>
      <CompactTable columns={['Pass', 'Student', 'Route', 'Valid Until', 'Status']} rows={data.items.map((p) => (
        <tr key={p.id}>
          <td className="px-4 py-3 font-medium">{p.passNumber}</td>
          <td className="px-4 py-3"><p>{p.studentName}</p><p className="text-xs text-ink-muted">{p.usn}</p></td>
          <td className="px-4 py-3">{p.routeCode ? `${p.routeCode} - ${p.routeName}` : 'NA'}</td>
          <td className="px-4 py-3">{p.validUntil ? String(p.validUntil).slice(0, 10) : 'NA'}</td>
          <td className="px-4 py-3"><Status value={p.status} /></td>
        </tr>
      ))} empty="No passes found." />
    </div>
  );
}

export function TransportTripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  useDocumentTitle('Transport Trips');
  const load = () => api<{ trips: any[] }>('/api/transport/trips').then((d) => setTrips(d.trips)).catch(() => setTrips([]));
  useEffect(() => { load(); }, []);
  const generate = () => api('/api/transport/trips/generate', { method: 'POST', body: '{}' }).then(load);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Trips" subtitle="Daily trip generation and current trip status." actions={<Button variant="secondary" onClick={generate}>Generate today</Button>} />
      <CompactTable columns={['Route', 'Type', 'Date', 'Start', 'Status']} rows={trips.map((t) => (
        <tr key={t.id}>
          <td className="px-4 py-3 font-medium">{t.route_name}</td>
          <td className="px-4 py-3">{t.trip_type}</td>
          <td className="px-4 py-3">{String(t.trip_date).slice(0, 10)}</td>
          <td className="px-4 py-3">{t.scheduled_start_at ? String(t.scheduled_start_at).slice(11, 16) : 'NA'}</td>
          <td className="px-4 py-3"><Status value={t.status} /></td>
        </tr>
      ))} empty="No trips for today." />
    </div>
  );
}

export function TransportComplaintsStaffPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  useDocumentTitle('Transport Complaints');
  useEffect(() => { api<{ complaints: any[] }>('/api/transport/complaints').then((d) => setComplaints(d.complaints)).catch(() => setComplaints([])); }, []);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Complaints" subtitle="Student transport complaints requiring operational follow-up." />
      <CompactTable columns={['Student', 'Category', 'Description', 'Status']} rows={complaints.map((c) => (
        <tr key={c.id}>
          <td className="px-4 py-3 font-medium">{c.studentName ?? 'Student'}</td>
          <td className="px-4 py-3">{c.category}</td>
          <td className="px-4 py-3 text-ink-muted">{c.description}</td>
          <td className="px-4 py-3"><Status value={c.status} /></td>
        </tr>
      ))} empty="No transport complaints." />
    </div>
  );
}

export function TransportFinanceStatusPage() {
  const [search, setSearch] = useState('');
  const { data } = usePaged<any>(`/api/transport/finance-status?search=${encodeURIComponent(search)}`, emptyPage());
  useDocumentTitle('Transport Fee Status');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Transport Fee Status" subtitle="Read-only Finance projection. Payments, receipts, refunds, and ledgers remain owned by Finance." />
      <Input placeholder="Search student or USN" value={search} onChange={(e) => setSearch(e.target.value)} />
      <CompactTable columns={['Student', 'Demand', 'Net', 'Paid', 'Outstanding', 'Status']} rows={data.items.map((d) => (
        <tr key={d.id}>
          <td className="px-4 py-3"><p className="font-medium">{d.studentName}</p><p className="text-xs text-ink-muted">{d.usn}</p></td>
          <td className="px-4 py-3">{d.demandType}</td>
          <td className="px-4 py-3"><Money value={d.netAmount} /></td>
          <td className="px-4 py-3"><Money value={d.paidAmount} /></td>
          <td className="px-4 py-3"><Money value={d.outstandingAmount} /></td>
          <td className="px-4 py-3"><Status value={d.status} /></td>
        </tr>
      ))} empty="No transport finance demands found." />
    </div>
  );
}

export function TransportClearancePage() {
  const { data } = usePaged<any>('/api/transport/clearance', emptyPage());
  useDocumentTitle('Transport No-Due');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Transport No-Due" subtitle="Transport clearance status only. Other departments remain outside this portal." />
      <CompactTable columns={['Student', 'Member', 'Transport Clearance', 'Reasons']} rows={data.items.map((c) => (
        <tr key={c.id}>
          <td className="px-4 py-3"><p className="font-medium">{c.studentName}</p><p className="text-xs text-ink-muted">{c.usn}</p></td>
          <td className="px-4 py-3"><Status value={c.memberStatus} /></td>
          <td className="px-4 py-3"><Status value={c.clearanceStatus} /></td>
          <td className="px-4 py-3 text-ink-muted">{c.reasons?.length ? c.reasons.join(', ') : 'None'}</td>
        </tr>
      ))} empty="No transport clearance records found." />
    </div>
  );
}

export function TransportReportsPage() {
  const [data, setData] = useState<any>(null);
  useDocumentTitle('Transport Reports');
  useEffect(() => { api('/api/transport/management/dashboard').then(setData).catch(() => setData(null)); }, []);
  if (!data) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Reports" subtitle="Route occupancy, stop demand, and transport pulse from authoritative records." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Active students" value={data.activeTransportStudents} />
        <Kpi label="Routes" value={data.activeRoutes} />
        <Kpi label="Vehicles" value={data.vehicles} />
        <Kpi label="Trips today" value={data.tripsToday} />
      </div>
      <CompactTable columns={['Route', 'Passengers', 'Capacity', 'Available', 'Utilization']} rows={(data.routeDemand ?? []).map((r: any) => (
        <tr key={`${r.routeCode}-${r.routeName}`}>
          <td className="px-4 py-3 font-medium">{r.routeCode} - {r.routeName}</td>
          <td className="px-4 py-3">{r.passengerCount}</td>
          <td className="px-4 py-3">{r.vehicleCapacity}</td>
          <td className="px-4 py-3">{r.availableCapacity}</td>
          <td className="px-4 py-3">{r.utilizationPercent}%</td>
        </tr>
      ))} empty="No route occupancy data." />
    </div>
  );
}

export function TransportManagementDashboardPage() {
  return <TransportReportsPage />;
}

export function TransportOperationsDashboardPage() {
  return <TransportTripsPage />;
}

export function DriverTripPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [manifest, setManifest] = useState<any>(null);
  useDocumentTitle('Driver Trip');
  useEffect(() => { api<{ trips: any[] }>('/api/transport/trip/today').then((d) => setTrips(d.trips)).catch(() => setTrips([])); }, []);
  const loadManifest = (tripId: number) => api(`/api/transport/trip/${tripId}/manifest`).then(setManifest);
  const startTrip = (tripId: number) => api(`/api/transport/trip/${tripId}/start`, { method: 'POST' });
  const completeTrip = (tripId: number) => api(`/api/transport/trip/${tripId}/complete`, { method: 'POST' });
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Today's Assignment" subtitle="Driver / conductor panel" />
      <Surface className="divide-y">
        {trips.map((t) => (
          <div key={t.id} className="space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><p className="font-medium">{t.routeName}</p><p className="text-sm text-ink-muted">{t.tripType} - {t.vehicleNumber}</p></div>
              <Status value={t.status} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => loadManifest(t.id)}>Manifest</Button>
              <Button size="sm" onClick={() => startTrip(t.id)}>Start</Button>
              <Button size="sm" variant="ghost" onClick={() => completeTrip(t.id)}>Complete</Button>
            </div>
          </div>
        ))}
        {trips.length === 0 ? <p className="p-4 text-sm text-ink-muted">No assigned trips today.</p> : null}
      </Surface>
      {manifest && (
        <Surface className="divide-y">
          <p className="p-4 text-sm font-semibold">Passenger manifest</p>
          {manifest.passengers?.map((p: any) => (
            <div key={p.studentId} className="flex items-center justify-between p-4 text-sm">
              <span>{p.name} - {p.usn}</span>
              <Status value={p.boardingStatus} />
            </div>
          ))}
        </Surface>
      )}
    </div>
  );
}
