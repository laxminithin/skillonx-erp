import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

export function TransportAdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  useDocumentTitle('Transport Management');

  useEffect(() => {
    api('/api/transport/dashboard').then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Transport Management" subtitle="Transport operations dashboard" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Active Students</p><p className="mt-1 text-2xl font-semibold">{data.activeTransportStudents}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Pending Applications</p><p className="mt-1 text-2xl font-semibold">{data.applicationsPending}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Active Routes</p><p className="mt-1 text-2xl font-semibold">{data.activeRoutes}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Vehicles</p><p className="mt-1 text-2xl font-semibold">{data.vehicles}</p></Surface>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Trips Today</p><p className="mt-1 text-xl font-semibold">{data.tripsToday}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Delayed</p><p className="mt-1 text-xl font-semibold">{data.delayedTrips}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Open Complaints</p><p className="mt-1 text-xl font-semibold">{data.openComplaints}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Waitlisted</p><p className="mt-1 text-xl font-semibold">{data.waitlisted}</p></Surface>
      </div>
      <p className="text-xs text-ink-muted">{data.liveTrackingNote}</p>
      <div className="flex flex-wrap gap-2">
        <Link to="/transport/applications"><Button variant="secondary">Applications</Button></Link>
        <Link to="/transport/routes"><Button variant="secondary">Routes</Button></Link>
        <Link to="/transport/vehicles"><Button variant="secondary">Vehicles</Button></Link>
        <Link to="/transport/trips"><Button variant="secondary">Trips</Button></Link>
        <Link to="/transport/complaints"><Button variant="secondary">Complaints</Button></Link>
        <Link to="/transport/operations"><Button variant="secondary">Operations</Button></Link>
        <Link to="/transport/management"><Button variant="secondary">Management Analytics</Button></Link>
      </div>
    </div>
  );
}

export function TransportApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  useDocumentTitle('Transport Applications');
  const load = () => api<{ applications: any[] }>('/api/transport/applications?status=SUBMITTED').then((d) => setApps(d.applications)).catch(() => setApps([]));
  useEffect(() => { load(); }, []);
  const review = (id: number, decision: string) => api(`/api/transport/applications/${id}/review`, { method: 'POST', body: JSON.stringify({ decision }) }).then(load);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Transport Applications" />
      <Surface className="divide-y">
        {apps.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div><p className="font-medium">{a.studentName} · {a.usn}</p><p className="text-sm text-ink-muted">{a.applicationNumber}</p></div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => review(a.id, 'APPROVE')}>Approve</Button>
              <Button size="sm" variant="secondary" onClick={() => review(a.id, 'WAITLIST')}>Waitlist</Button>
              <Button size="sm" variant="ghost" onClick={() => review(a.id, 'REJECT')}>Reject</Button>
            </div>
          </div>
        ))}
        {apps.length === 0 && <p className="p-4 text-sm text-ink-muted">No pending applications.</p>}
      </Surface>
    </div>
  );
}

export function TransportRoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  useDocumentTitle('Transport Routes');
  useEffect(() => { api<{ routes: any[] }>('/api/transport/routes').then((d) => setRoutes(d.routes)).catch(() => setRoutes([])); }, []);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Routes" />
      <Surface className="divide-y">
        {routes.map((r) => (
          <div key={r.id} className="p-4 text-sm">
            <p className="font-medium">{r.code} — {r.name}</p>
            <p className="text-ink-muted">{r.origin} → {r.destination} · {r.status}</p>
          </div>
        ))}
      </Surface>
    </div>
  );
}

export function TransportVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  useDocumentTitle('Transport Vehicles');
  useEffect(() => { api<{ vehicles: any[] }>('/api/transport/vehicles').then((d) => setVehicles(d.vehicles)).catch(() => setVehicles([])); }, []);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Vehicles" />
      <Surface className="divide-y">
        {vehicles.map((v) => (
          <div key={v.id} className="flex items-center justify-between p-4 text-sm">
            <div><p className="font-medium">{v.vehicleNumber}</p><p className="text-ink-muted">Capacity: {v.totalCapacity}</p></div>
            <span>{v.status}</span>
          </div>
        ))}
      </Surface>
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
      <PageHeader title="Trips" />
      <Button variant="secondary" onClick={generate}>Generate Today&apos;s Trips</Button>
      <Surface className="divide-y">
        {trips.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-4 text-sm">
            <div><p className="font-medium">{t.route_name}</p><p className="text-ink-muted">{t.trip_type} · {t.trip_date}</p></div>
            <span>{t.status}</span>
          </div>
        ))}
      </Surface>
    </div>
  );
}

export function TransportComplaintsStaffPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  useDocumentTitle('Transport Complaints');
  useEffect(() => { api<{ complaints: any[] }>('/api/transport/complaints').then((d) => setComplaints(d.complaints)).catch(() => setComplaints([])); }, []);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Complaints" />
      <Surface className="divide-y">
        {complaints.map((c) => (
          <div key={c.id} className="p-4 text-sm">
            <p className="font-medium">{c.studentName ?? 'Student'} · {c.category}</p>
            <p className="text-ink-muted">{c.description}</p>
          </div>
        ))}
      </Surface>
    </div>
  );
}

export function TransportOperationsDashboardPage() {
  const [data, setData] = useState<any>(null);
  useDocumentTitle('Transport Operations');
  useEffect(() => { api('/api/transport/operations/today').then(setData).catch(() => setData(null)); }, []);
  if (!data) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Transport Operations" subtitle="Today's fleet" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Trips</p><p className="mt-1 text-2xl font-semibold">{data.todayTrips}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Unassigned</p><p className="mt-1 text-2xl font-semibold">{data.unassignedTrips}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Delayed</p><p className="mt-1 text-2xl font-semibold">{data.delayedTrips}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Incidents</p><p className="mt-1 text-2xl font-semibold">{data.activeIncidents}</p></Surface>
      </div>
      {!data.gpsConfigured && <p className="text-xs text-ink-muted">Live Tracking Not Configured</p>}
    </div>
  );
}

export function TransportManagementDashboardPage() {
  const [data, setData] = useState<any>(null);
  useDocumentTitle('Transport Analytics');
  useEffect(() => { api('/api/transport/management/dashboard').then(setData).catch(() => setData(null)); }, []);
  if (!data) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Transport Analytics" subtitle="Executive dashboard (read-only)" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Active Students</p><p className="mt-1 text-2xl font-semibold">{data.activeTransportStudents}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Routes</p><p className="mt-1 text-2xl font-semibold">{data.activeRoutes}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Vehicles</p><p className="mt-1 text-2xl font-semibold">{data.vehicles}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Trips Today</p><p className="mt-1 text-2xl font-semibold">{data.tripsToday}</p></Surface>
      </div>
      <Surface className="divide-y">
        <p className="p-4 text-sm font-semibold">Route Demand</p>
        {data.routeDemand?.map((r: any) => (
          <div key={r.routeId} className="flex items-center justify-between p-4 text-sm">
            <span>{r.routeName}</span>
            <span className="text-ink-muted">{r.passengerCount}/{r.vehicleCapacity} seats</span>
          </div>
        ))}
      </Surface>
    </div>
  );
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
      <PageHeader title="Today's Assignment" subtitle="Driver / Conductor panel" />
      <Surface className="divide-y">
        {trips.map((t) => (
          <div key={t.id} className="space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><p className="font-medium">{t.routeName}</p><p className="text-sm text-ink-muted">{t.tripType} · {t.vehicleNumber}</p></div>
              <span className="text-sm">{t.status}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => loadManifest(t.id)}>Manifest</Button>
              <Button size="sm" onClick={() => startTrip(t.id)}>Start</Button>
              <Button size="sm" variant="ghost" onClick={() => completeTrip(t.id)}>Complete</Button>
            </div>
          </div>
        ))}
      </Surface>
      {manifest && (
        <Surface className="divide-y">
          <p className="p-4 text-sm font-semibold">Passenger Manifest</p>
          {manifest.passengers?.map((p: any) => (
            <div key={p.studentId} className="flex items-center justify-between p-4 text-sm">
              <span>{p.name} · {p.usn}</span>
              <span>{p.boardingStatus}</span>
            </div>
          ))}
        </Surface>
      )}
    </div>
  );
}
