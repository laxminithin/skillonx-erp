import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

type Dashboard = {
  capacity: { totalBeds: number; usableBeds: number; occupiedBeds: number; availableBeds: number; occupancyPercent: number };
  applicationsPending: number;
  waitlistedStudents: number;
  allocationPending: number;
  residentsActive: number;
  residentsCurrentlyOutside: number;
  lateReturns: number;
  openComplaints: number;
  pendingVacating: number;
};

export function HostelWardenDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  useDocumentTitle('Hostel Management');

  useEffect(() => {
    api<Dashboard>('/api/hostel/dashboard').then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Hostel Management" subtitle="Warden operations dashboard" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Occupancy</p><p className="mt-1 text-2xl font-semibold">{data.capacity.occupancyPercent}%</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Occupied / Usable</p><p className="mt-1 text-2xl font-semibold">{data.capacity.occupiedBeds}/{data.capacity.usableBeds}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Available Beds</p><p className="mt-1 text-2xl font-semibold">{data.capacity.availableBeds}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Active Residents</p><p className="mt-1 text-2xl font-semibold">{data.residentsActive}</p></Surface>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Pending Applications</p><p className="mt-1 text-xl font-semibold">{data.applicationsPending}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Waitlisted</p><p className="mt-1 text-xl font-semibold">{data.waitlistedStudents}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Outside Now</p><p className="mt-1 text-xl font-semibold">{data.residentsCurrentlyOutside}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Late Returns</p><p className="mt-1 text-xl font-semibold">{data.lateReturns}</p></Surface>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/hostel/applications"><Button variant="secondary">Applications</Button></Link>
        <Link to="/hostel/residents"><Button variant="secondary">Residents</Button></Link>
        <Link to="/hostel/rooms"><Button variant="secondary">Rooms & Beds</Button></Link>
        <Link to="/hostel/complaints"><Button variant="secondary">Complaints ({data.openComplaints})</Button></Link>
        <Link to="/hostel/vacating"><Button variant="secondary">Vacating ({data.pendingVacating})</Button></Link>
        <Link to="/hostel/gate"><Button variant="secondary">Gate Panel</Button></Link>
        <Link to="/hostel/operations"><Button variant="secondary">Mess Operations</Button></Link>
        <Link to="/hostel/management"><Button variant="secondary">Management Analytics</Button></Link>
      </div>
    </div>
  );
}

export function HostelApplicationsPage() {
  const [apps, setApps] = useState<any[]>([]);
  useDocumentTitle('Hostel Applications');
  const load = () => api<{ applications: any[] }>('/api/hostel/applications/pending').then((d) => setApps(d.applications)).catch(() => setApps([]));
  useEffect(() => { load(); }, []);
  const review = (id: number, action: string) => api(`/api/hostel/applications/${id}/review`, { method: 'POST', body: JSON.stringify({ action }) }).then(load);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Pending Applications" />
      <Surface className="divide-y">
        {apps.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div><p className="font-medium">{a.studentName} · {a.usn}</p><p className="text-sm text-ink-muted">{a.applicationNumber} · {a.preferredRoomType}</p></div>
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

export function HostelResidentsPage() {
  const [residents, setResidents] = useState<any[]>([]);
  useDocumentTitle('Residents');
  useEffect(() => { api<{ residents: any[] }>('/api/hostel/residents').then((d) => setResidents(d.residents)).catch(() => setResidents([])); }, []);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Residents" />
      <Surface className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-ink-muted"><th className="p-3">USN</th><th className="p-3">Name</th><th className="p-3">Room</th><th className="p-3">Bed</th><th className="p-3">Status</th></tr></thead>
        <tbody>{residents.map((r) => <tr key={r.id} className="border-b"><td className="p-3">{r.usn}</td><td className="p-3">{r.studentName}</td><td className="p-3">{r.roomNumber ?? '—'}</td><td className="p-3">{r.bedCode ?? '—'}</td><td className="p-3">{r.status}</td></tr>)}</tbody>
      </table></Surface>
    </div>
  );
}

export function HostelRoomsPage() {
  const [hostels, setHostels] = useState<any[]>([]);
  const [occupancy, setOccupancy] = useState<any[]>([]);
  const [selectedHostel, setSelectedHostel] = useState<number | null>(null);
  useDocumentTitle('Rooms & Beds');
  useEffect(() => { api<{ hostels: any[] }>('/api/hostel/hostels').then((d) => { setHostels(d.hostels); if (d.hostels[0]) setSelectedHostel(d.hostels[0].id); }).catch(() => {}); }, []);
  useEffect(() => { if (selectedHostel) api<{ occupancy: any[] }>(`/api/hostel/rooms/occupancy?hostelId=${selectedHostel}`).then((d) => setOccupancy(d.occupancy)).catch(() => setOccupancy([])); }, [selectedHostel]);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Room Occupancy" />
      {hostels.length > 1 && (
        <select className="rounded-lg border border-border px-3 py-2 text-sm" value={selectedHostel ?? ''} onChange={(e) => setSelectedHostel(Number(e.target.value))}>
          {hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      )}
      {occupancy.map((block) => (
        <Surface key={block.id} className="p-4">
          <h2 className="font-semibold mb-2">Block {block.code}</h2>
          {block.floors?.map((floor: any) => (
            <div key={floor.id} className="mb-4">
              <p className="text-sm text-ink-muted mb-1">Floor {floor.floorNumber}</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {floor.rooms?.map((room: any) => (
                  <div key={room.id} className="rounded border border-border p-2 text-sm">
                    <p className="font-medium">{room.roomNumber}</p>
                    {room.beds?.map((bed: any) => <p key={bed.id} className="text-ink-muted">{bed.bedCode}: {bed.studentName ?? 'Available'}</p>)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Surface>
      ))}
    </div>
  );
}

export function HostelComplaintsStaffPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  useDocumentTitle('Complaints');
  const load = () => api<{ complaints: any[] }>('/api/hostel/complaints').then((d) => setComplaints(d.complaints)).catch(() => setComplaints([]));
  useEffect(() => { load(); }, []);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Complaints" />
      <Surface className="divide-y">{complaints.map((c) => (
        <div key={c.id} className="flex justify-between p-4 text-sm">
          <span>{c.studentName} · {c.category}: {c.description?.slice(0, 80)}</span>
          <Button size="sm" variant="secondary" onClick={() => api(`/api/hostel/complaints/${c.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'IN_PROGRESS' }) }).then(load)}>Assign</Button>
        </div>
      ))}</Surface>
    </div>
  );
}

export function HostelVacatingPage() {
  const [items, setItems] = useState<any[]>([]);
  useDocumentTitle('Vacating');
  const load = () => api<{ vacating: any[] }>('/api/hostel/vacating').then((d) => setItems(d.vacating)).catch(() => setItems([]));
  useEffect(() => { load(); }, []);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Vacating Requests" />
      <Surface className="divide-y">{items.map((v) => (
        <div key={v.id} className="p-4 text-sm">
          <p className="font-medium">{v.studentName} · {v.usn}</p>
          <p className="text-ink-muted">Keys: {v.keysReturned ? '✓' : '✗'} · Assets: {v.assetsVerified ? '✓' : '✗'} · Damage: {v.damageChecked ? '✓' : '✗'}</p>
        </div>
      ))}</Surface>
    </div>
  );
}

export function HostelGateDashboardPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [outside, setOutside] = useState<any[]>([]);
  const [token, setToken] = useState('');
  const [verified, setVerified] = useState<any>(null);
  useDocumentTitle('Gate Panel');
  useEffect(() => { api<{ residents: any[] }>('/api/hostel/gate/outside').then((d) => setOutside(d.residents)).catch(() => setOutside([])); }, []);
  const search = () => { if (query) api<{ residents: any[] }>(`/api/hostel/gate/residents/search?q=${encodeURIComponent(query)}`).then((d) => setResults(d.residents)); };
  const verify = () => { if (token) api(`/api/hostel/gate/outpass/verify/${token}`).then(setVerified).catch(() => setVerified(null)); };
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Security / Gate" subtitle="Fast operational panel" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Surface className="space-y-3 p-4">
          <h2 className="font-semibold">Resident Search</h2>
          <div className="flex gap-2"><input className="flex-1 rounded border px-3 py-2 text-sm" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="USN or name" /><Button onClick={search}>Search</Button></div>
          {results.map((r) => <p key={r.residentId} className="text-sm">{r.usn} · {r.studentName} · {r.roomNumber}</p>)}
        </Surface>
        <Surface className="space-y-3 p-4">
          <h2 className="font-semibold">Outpass Scan</h2>
          <div className="flex gap-2"><input className="flex-1 rounded border px-3 py-2 text-sm" value={token} onChange={(e) => setToken(e.target.value)} placeholder="QR token" /><Button onClick={verify}>Verify</Button></div>
          {verified && <p className="text-sm">{verified.studentName} · {verified.outpassNumber} · {verified.status}</p>}
        </Surface>
      </div>
      <Surface className="p-4">
        <h2 className="font-semibold mb-2">Residents Outside ({outside.length})</h2>
        <ul className="text-sm space-y-1">{outside.map((r) => <li key={r.outpassId}>{r.usn} · {r.studentName} · Return: {new Date(r.expectedReturnAt).toLocaleString()}</li>)}</ul>
      </Surface>
    </div>
  );
}

export function HostelOperationsDashboardPage() {
  const [data, setData] = useState<any>(null);
  useDocumentTitle('Mess Operations');
  useEffect(() => { api('/api/hostel/operations/dashboard').then(setData).catch(() => setData(null)); }, []);
  if (!data) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Mess / Operations" />
      <Surface className="p-4">
        <h2 className="font-semibold mb-2">Today's Menu</h2>
        {data.menu?.meals?.map((m: any, i: number) => <p key={i} className="text-sm">{m.mealType}: {m.items}</p>)}
      </Surface>
      <Surface className="p-4">
        <h2 className="font-semibold mb-2">Mess Plans</h2>
        <ul className="text-sm">{data.plans?.map((p: any) => <li key={p.id}>{p.name} · {p.planType}</li>)}</ul>
      </Surface>
    </div>
  );
}

export function HostelManagementDashboardPage() {
  const [data, setData] = useState<any>(null);
  useDocumentTitle('Hostel Analytics');
  useEffect(() => { api('/api/hostel/management/dashboard').then(setData).catch(() => setData(null)); }, []);
  if (!data) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Management Analytics" subtitle="Read-only institutional view" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Hostels</p><p className="text-2xl font-semibold">{data.totalHostels}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Occupancy</p><p className="text-2xl font-semibold">{data.capacity?.occupancyPercent}%</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Applications</p><p className="text-2xl font-semibold">{data.applications}</p></Surface>
        <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Residents</p><p className="text-2xl font-semibold">{data.residents}</p></Surface>
      </div>
      <p className="text-xs text-ink-muted">Read-only analytics panel. Operational changes require warden access.</p>
    </div>
  );
}
