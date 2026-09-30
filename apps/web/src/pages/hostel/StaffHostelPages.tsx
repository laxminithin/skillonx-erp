import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, Search } from 'lucide-react';
import { api } from '../../lib/api';
import { Badge, Button, Input, PageHeader, Select, Skeleton, StatusBadge, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

type Dashboard = {
  capacity: { totalBeds: number; usableBeds: number; occupiedBeds: number; availableBeds: number; reservedBeds?: number; maintenanceBeds?: number; blockedBeds?: number; occupancyPercent: number };
  applicationsPending: number;
  waitlistedStudents: number;
  allocationPending: number;
  residentsActive: number;
  residentsCurrentlyOutside: number;
  activeOutpasses: number;
  lateReturns: number;
  pendingLeave: number;
  visitorsCurrentlyInside: number;
  openComplaints: number;
  pendingVacating: number;
};

type Resident = {
  id: number;
  studentId: number;
  usn: string;
  studentName: string;
  hostelName: string;
  residentNumber: string;
  status: string;
  roomNumber?: string | null;
  bedCode?: string | null;
  admittedAt?: string | null;
};

type ResidentProfile = {
  resident: { id: number; status: string; residentNumber: string; admittedAt: string | null; hostelName: string };
  student: { usn: string; name: string; email?: string; phone?: string; guardianName?: string; guardianPhone?: string; emergencyContactName?: string; emergencyContactPhone?: string; programName?: string; semesterName?: string };
  room: any;
  movement: { currentPresence: string; expectedReturnAt?: string | null; activeOutpass?: any; recent: any[] };
  finance: { totalOutstanding: string; items: any[] };
  clearance: { hostel: { status: string; reasons: string[] }; overallClear: boolean };
  complaints: any[];
  history: any[];
};

const money = (value: unknown) => `₹${Number(value ?? 0).toLocaleString('en-IN')}`;
const dateTime = (value?: string | null) => value ? new Date(value).toLocaleString() : '—';
const label = (value?: string | null) => value ? String(value).replaceAll('_', ' ') : '—';

function EmptyState({ children }: { children: string }) {
  return <p className="p-4 text-sm text-ink-muted">{children}</p>;
}

function MetricCard({ label: cardLabel, value, tone }: { label: string; value: number | string; tone?: 'danger' | 'warning' }) {
  return (
    <Surface className="p-4">
      <p className="text-xs font-semibold uppercase text-ink-muted">{cardLabel}</p>
      <p className={tone === 'danger' ? 'mt-1 text-2xl font-semibold text-danger' : tone === 'warning' ? 'mt-1 text-2xl font-semibold text-warning' : 'mt-1 text-2xl font-semibold'}>
        {value}
      </p>
    </Surface>
  );
}

function ActionCard({ to, label: cardLabel, count, urgent }: { to: string; label: string; count: number; urgent?: boolean }) {
  return (
    <Link to={to}>
      <Surface className="flex h-full items-center justify-between gap-3 p-4 transition hover:border-accent">
        <div>
          <p className="text-sm font-medium">{cardLabel}</p>
          <p className={urgent ? 'mt-1 text-2xl font-semibold text-danger' : 'mt-1 text-2xl font-semibold'}>{count}</p>
        </div>
        <ArrowRight size={18} className="text-ink-muted" />
      </Surface>
    </Link>
  );
}

function UnsupportedPanel({ title, detail, sensitive }: { title: string; detail: string; sensitive?: boolean }) {
  return (
    <Surface className="space-y-3 p-5">
      <div className="flex items-start gap-3">
        {sensitive ? <AlertTriangle className="mt-0.5 text-warning" size={18} /> : <CheckCircle2 className="mt-0.5 text-ink-muted" size={18} />}
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 max-w-3xl text-sm text-ink-muted">{detail}</p>
        </div>
      </div>
    </Surface>
  );
}

export function HostelWardenDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  useDocumentTitle('Warden Portal');

  useEffect(() => {
    api<Dashboard>('/api/hostel/dashboard').then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Warden Portal" subtitle="Daily hostel operations, queues, rooms, residents, movement, and clearance." />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase text-ink-muted">Action Required</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ActionCard to="/hostel/applications" label="Pending allocations" count={data.applicationsPending + data.allocationPending} />
          <ActionCard to="/hostel/leaves" label="Leave / outing requests" count={data.pendingLeave} />
          <ActionCard to="/hostel/overdue" label="Overdue returns" count={data.lateReturns} urgent />
          <ActionCard to="/hostel/complaints" label="Open complaints" count={data.openComplaints} />
          <ActionCard to="/hostel/vacating" label="Pending no-due" count={data.pendingVacating} />
          <ActionCard to="/hostel/visitors" label="Visitors inside" count={data.visitorsCurrentlyInside} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase text-ink-muted">Hostel Pulse</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Capacity" value={data.capacity.totalBeds} />
          <MetricCard label="Occupied Beds" value={data.capacity.occupiedBeds} />
          <MetricCard label="Available Beds" value={data.capacity.availableBeds} />
          <MetricCard label="Residents" value={data.residentsActive} />
          <MetricCard label="Occupancy" value={`${data.capacity.occupancyPercent}%`} />
          <MetricCard label="Reserved Beds" value={data.capacity.reservedBeds ?? 0} />
          <MetricCard label="Maintenance Beds" value={data.capacity.maintenanceBeds ?? 0} tone="warning" />
          <MetricCard label="Blocked Beds" value={data.capacity.blockedBeds ?? 0} tone="danger" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Surface className="p-5">
          <h2 className="font-semibold">Today&apos;s Hostel Status</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MetricCard label="Outside Now" value={data.residentsCurrentlyOutside} />
            <MetricCard label="Active Outpasses" value={data.activeOutpasses} />
            <MetricCard label="Expected / Late Review" value={data.lateReturns} tone={data.lateReturns ? 'danger' : undefined} />
            <MetricCard label="Waitlisted Students" value={data.waitlistedStudents} />
          </div>
        </Surface>
        <UnsupportedPanel
          title="Attendance Status"
          detail="Daily hostel attendance is not exposed by the current Hostel API. The portal keeps the slot visible but does not fabricate present/absent counts."
        />
      </section>

      <Surface className="p-5">
        <h2 className="font-semibold">Recent Activity</h2>
        <p className="mt-2 text-sm text-ink-muted">Hostel audit data exists in the backend. A warden-facing recent activity feed endpoint is not exposed yet, so this dashboard links to the authoritative queues instead.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/hostel/residents"><Button variant="secondary">Residents</Button></Link>
          <Link to="/hostel/rooms"><Button variant="secondary">Rooms & Beds</Button></Link>
          <Link to="/hostel/gate"><Button variant="secondary">Entry / Exit</Button></Link>
          <Link to="/hostel/fees"><Button variant="secondary">Fee Status</Button></Link>
        </div>
      </Surface>
    </div>
  );
}

export function HostelApplicationsPage({ mode = 'pending' }: { mode?: 'pending' | 'waitlist' }) {
  const [apps, setApps] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  useDocumentTitle(mode === 'waitlist' ? 'Hostel Waiting List' : 'Pending Allocation');
  const load = () => {
    if (mode === 'waitlist') return api<{ waitlist: any[] }>('/api/hostel/waitlist').then((d) => setWaitlist(d.waitlist)).catch(() => setWaitlist([]));
    return api<{ applications: any[] }>('/api/hostel/applications/pending').then((d) => setApps(d.applications)).catch(() => setApps([]));
  };
  useEffect(() => { load(); }, [mode]);
  const review = (id: number, action: string) => api(`/api/hostel/applications/${id}/review`, { method: 'POST', body: JSON.stringify({ action }) }).then(load);

  if (mode === 'waitlist') {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Waiting List" subtitle="Authoritative waitlist entries from Hostel applications." />
        <Surface className="overflow-hidden">
          {waitlist.map((w) => (
            <div key={w.id} className="grid gap-2 border-b p-4 text-sm md:grid-cols-[1fr_120px_140px] md:items-center">
              <div><p className="font-medium">{w.studentName} · {w.usn}</p><p className="text-ink-muted">{w.applicationNumber} · {label(w.roomTypePreference)}</p></div>
              <span>Position {w.position ?? '—'}</span>
              <StatusBadge status={w.status} />
            </div>
          ))}
          {waitlist.length === 0 ? <EmptyState>No active waitlist entries.</EmptyState> : null}
        </Surface>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="New / Pending Allocation" subtitle="Review hostel applications and move them to approval, waitlist, or rejection." />
      <Surface className="divide-y">
        {apps.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div><p className="font-medium">{a.studentName} · {a.usn}</p><p className="text-sm text-ink-muted">{a.applicationNumber} · {label(a.preferredRoomType)}</p></div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => review(a.id, 'APPROVE')}>Approve</Button>
              <Button size="sm" variant="secondary" onClick={() => review(a.id, 'WAITLIST')}>Waitlist</Button>
              <Button size="sm" variant="ghost" onClick={() => review(a.id, 'REJECT')}>Reject</Button>
            </div>
          </div>
        ))}
        {apps.length === 0 ? <EmptyState>No pending hostel applications.</EmptyState> : null}
      </Surface>
    </div>
  );
}

export function HostelResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [profile, setProfile] = useState<ResidentProfile | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  useDocumentTitle('Residents');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), pageSize: '25' });
      if (query.trim()) params.set('search', query.trim());
      api<{ residents: Resident[]; pagination: typeof pagination }>(`/api/hostel/residents?${params}`)
        .then((data) => { setResidents(data.residents); setPagination(data.pagination); })
        .catch(() => { setResidents([]); setPagination({ page, pageSize: 25, total: 0, totalPages: 0 }); })
        .finally(() => setLoading(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [page, query]);
  useEffect(() => {
    if (!id) { setProfile(null); return; }
    api<ResidentProfile>(`/api/hostel/residents/${id}`).then(setProfile).catch(() => setProfile(null));
  }, [id]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Resident Directory" subtitle="Search residents by student, USN, hostel, room, bed, or status." />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Surface className="overflow-hidden">
          <div className="border-b p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
              <Input className="pl-9" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search name, USN, resident, room, or bed" />
            </div>
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-ink-muted"><th className="p-3">Student</th><th className="p-3">Hostel</th><th className="p-3">Room</th><th className="p-3">Bed</th><th className="p-3">Status</th></tr></thead>
              <tbody>{residents.map((r) => (
                <tr key={r.id} className="cursor-pointer border-b hover:bg-surface-muted" onClick={() => navigate(`/hostel/residents/${r.id}`)}>
                  <td className="p-3"><p className="font-medium">{r.studentName}</p><p className="text-xs text-ink-muted">{r.usn}</p></td>
                  <td className="p-3">{r.hostelName}</td><td className="p-3">{r.roomNumber ?? '—'}</td><td className="p-3">{r.bedCode ?? '—'}</td><td className="p-3"><StatusBadge status={r.status} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="divide-y md:hidden">
            {residents.map((r) => (
              <button key={r.id} type="button" onClick={() => navigate(`/hostel/residents/${r.id}`)} className="w-full p-4 text-left text-sm">
                <p className="font-medium">{r.studentName} · {r.usn}</p>
                <p className="text-ink-muted">{r.hostelName} · Room {r.roomNumber ?? '—'} · Bed {r.bedCode ?? '—'}</p>
              </button>
            ))}
          </div>
          {!loading && residents.length === 0 ? <EmptyState>{query.trim() ? 'No residents match your search.' : 'No residents exist in your assigned hostels.'}</EmptyState> : null}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm">
            <span>{pagination.total} {pagination.total === 1 ? 'resident' : 'residents'} · Page {pagination.totalPages === 0 ? 0 : pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <Button size="sm" variant="secondary" disabled={loading || page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          </div>
        </Surface>

        <Surface className="p-5">
          {!profile ? (
            <p className="text-sm text-ink-muted">Select a resident to view hostel profile, movement, dues, complaints, and allocation history.</p>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">{profile.student.name}</h2>
                <p className="text-sm text-ink-muted">{profile.student.usn} · {profile.student.programName ?? 'Programme not linked'} · {profile.student.semesterName ?? 'Semester not linked'}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard label="Presence" value={label(profile.movement.currentPresence)} />
                <MetricCard label="Outstanding" value={money(profile.finance.totalOutstanding)} tone={Number(profile.finance.totalOutstanding) > 0 ? 'warning' : undefined} />
              </div>
              <div className="space-y-2 text-sm">
                <h3 className="font-semibold">Hostel</h3>
                <p>{profile.room?.hostelName ?? profile.resident.hostelName} · Block {profile.room?.blockCode ?? '—'} · Floor {profile.room?.floorNumber ?? '—'} · Room {profile.room?.roomNumber ?? '—'} · Bed {profile.room?.bedCode ?? '—'}</p>
                <p className="text-ink-muted">Admitted: {dateTime(profile.resident.admittedAt)} · Status: {label(profile.resident.status)}</p>
              </div>
              <div className="space-y-2 text-sm">
                <h3 className="font-semibold">Contact</h3>
                <p>{profile.student.phone ?? 'No phone'} · {profile.student.email ?? 'No email'}</p>
                <p className="text-ink-muted">Emergency: {profile.student.emergencyContactName ?? profile.student.guardianName ?? '—'} · {profile.student.emergencyContactPhone ?? profile.student.guardianPhone ?? '—'}</p>
              </div>
              <div className="space-y-2 text-sm">
                <h3 className="font-semibold">No-Due</h3>
                <StatusBadge status={profile.clearance.hostel.status} />
                {profile.clearance.hostel.reasons?.length ? <p className="text-ink-muted">{profile.clearance.hostel.reasons.map(label).join(', ')}</p> : null}
              </div>
              <div className="space-y-2 text-sm">
                <h3 className="font-semibold">Recent Complaints</h3>
                {profile.complaints.length ? profile.complaints.map((c) => <p key={c.id}>{label(c.category)} · <StatusBadge status={c.status} /></p>) : <p className="text-ink-muted">No recent complaints.</p>}
              </div>
              <div className="space-y-2 text-sm">
                <h3 className="font-semibold">Allocation History</h3>
                {profile.history.slice(0, 4).map((h) => <p key={h.id}>{h.hostelName} · {h.roomNumber} · {h.bedCode} · {label(h.status)}</p>)}
              </div>
            </div>
          )}
        </Surface>
      </div>
    </div>
  );
}

export function HostelRoomsPage({ mode = 'overview' }: { mode?: 'overview' | 'vacancies' | 'transfers' }) {
  const [hostels, setHostels] = useState<any[]>([]);
  const [occupancy, setOccupancy] = useState<any[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedHostel, setSelectedHostel] = useState<number | null>(null);
  const [transfer, setTransfer] = useState({ residentId: '', bedId: '', reason: '' });
  const [transferState, setTransferState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  useDocumentTitle(mode === 'transfers' ? 'Room Transfers' : mode === 'vacancies' ? 'Vacancies' : 'Rooms & Beds');

  useEffect(() => { api<{ hostels: any[] }>('/api/hostel/hostels').then((d) => { setHostels(d.hostels); if (d.hostels[0]) setSelectedHostel(Number(d.hostels[0].id)); }).catch(() => {}); }, []);
  useEffect(() => { if (selectedHostel) api<{ occupancy: any[] }>(`/api/hostel/rooms/occupancy?hostelId=${selectedHostel}`).then((d) => setOccupancy(d.occupancy)).catch(() => setOccupancy([])); }, [selectedHostel]);
  useEffect(() => {
    if (mode === 'transfers') api<{ residents: Resident[] }>('/api/hostel/residents?pageSize=100').then((d) => setResidents(d.residents)).catch(() => setResidents([]));
  }, [mode]);

  const rooms = occupancy.flatMap((block) => block.floors?.flatMap((floor: any) => floor.rooms?.map((room: any) => ({ block, floor, room })) ?? []) ?? []);
  const vacancies = rooms.flatMap(({ block, floor, room }) => (room.beds ?? []).filter((b: any) => b.status === 'AVAILABLE').map((bed: any) => ({ block, floor, room, bed })));
  async function confirmTransfer() {
    if (!transfer.residentId || !transfer.bedId) return;
    setTransferState('saving');
    try {
      await api('/api/hostel/transfers', {
        method: 'POST',
        body: JSON.stringify({
          residentId: Number(transfer.residentId),
          newBedId: Number(transfer.bedId),
          transferType: 'WARDEN_APPROVED',
          reason: transfer.reason.trim() || undefined,
        }),
      });
      if (selectedHostel) {
        const data = await api<{ occupancy: any[] }>(`/api/hostel/rooms/occupancy?hostelId=${selectedHostel}`);
        setOccupancy(data.occupancy);
      }
      const data = await api<{ residents: Resident[] }>('/api/hostel/residents?pageSize=100');
      setResidents(data.residents);
      setTransfer({ residentId: '', bedId: '', reason: '' });
      setTransferState('saved');
    } catch {
      setTransferState('error');
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={mode === 'transfers' ? 'Room Transfers' : mode === 'vacancies' ? 'Vacancies' : 'Rooms & Beds'} subtitle="Hostel, block, floor, room, and bed occupancy." />
      {hostels.length > 1 ? (
        <Select className="max-w-sm" value={selectedHostel ?? ''} onChange={(e) => setSelectedHostel(Number(e.target.value))}>
          {hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </Select>
      ) : null}
      {mode === 'transfers' ? (
        <Surface className="space-y-4 p-5">
          <div>
            <h2 className="font-semibold">Confirm Room Transfer</h2>
            <p className="mt-1 text-sm text-ink-muted">Select an active resident and an available target bed. The transfer closes the current allocation atomically.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Resident</span>
              <Select value={transfer.residentId} onChange={(e) => setTransfer({ ...transfer, residentId: e.target.value })}>
                <option value="">Select resident</option>
                {residents.filter((r) => r.status === 'ACTIVE').map((r) => <option key={r.id} value={r.id}>{r.studentName} · {r.usn} · {r.roomNumber ?? 'No room'} / {r.bedCode ?? 'No bed'}</option>)}
              </Select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">New available bed</span>
              <Select value={transfer.bedId} onChange={(e) => setTransfer({ ...transfer, bedId: e.target.value })}>
                <option value="">Select bed</option>
                {vacancies.map(({ block, floor, room, bed }) => <option key={bed.id} value={bed.id}>{block.name ?? block.code} · Floor {floor.floorNumber} · Room {room.roomNumber} · {bed.bedCode}</option>)}
              </Select>
            </label>
          </div>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Reason</span>
            <Input value={transfer.reason} onChange={(e) => setTransfer({ ...transfer, reason: e.target.value })} placeholder="Optional transfer reason" />
          </label>
          <div className="flex items-center gap-3">
            <Button disabled={!transfer.residentId || !transfer.bedId || transferState === 'saving'} onClick={confirmTransfer}>Confirm transfer</Button>
            {transferState === 'saved' ? <span className="text-sm text-success">Transfer completed.</span> : null}
            {transferState === 'error' ? <span className="text-sm text-danger">Transfer failed. Check resident and bed availability.</span> : null}
          </div>
        </Surface>
      ) : null}
      {mode === 'vacancies' ? (
        <Surface className="divide-y">
          {vacancies.map(({ block, floor, room, bed }) => (
            <div key={bed.id} className="grid gap-2 p-4 text-sm md:grid-cols-4">
              <span>{block.name ?? block.code}</span><span>Floor {floor.floorNumber}</span><span>Room {room.roomNumber}</span><Badge className="bg-success-soft text-success">{bed.bedCode}</Badge>
            </div>
          ))}
          {vacancies.length === 0 ? <EmptyState>No available beds in the selected hostel.</EmptyState> : null}
        </Surface>
      ) : null}
      <div className="space-y-4">
        {occupancy.map((block) => (
          <Surface key={block.id} className="p-4">
            <h2 className="font-semibold">{block.name ?? `Block ${block.code}`}</h2>
            <div className="mt-4 space-y-4">
              {block.floors?.map((floor: any) => (
                <div key={floor.id}>
                  <p className="mb-2 text-sm font-medium text-ink-muted">Floor {floor.floorNumber}</p>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {floor.rooms?.map((room: any) => {
                      const beds = room.beds ?? [];
                      const occupied = beds.filter((b: any) => b.status === 'OCCUPIED').length;
                      return (
                        <div key={room.id} className="rounded-[var(--radius-md)] border border-border p-3 text-sm">
                          <div className="mb-2 flex items-center justify-between gap-2"><p className="font-medium">Room {room.roomNumber}</p><StatusBadge status={room.status} /></div>
                          <p className="mb-2 text-xs text-ink-muted">{label(room.roomType)} · {occupied}/{beds.length} occupied</p>
                          <div className="grid grid-cols-2 gap-2">
                            {beds.map((bed: any) => (
                              <div key={bed.id} className="rounded border border-border p-2">
                                <p className="font-medium">{bed.bedCode}</p>
                                <p className="text-xs text-ink-muted">{bed.studentName ?? label(bed.status)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

export function HostelLeaveQueuePage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [outpasses, setOutpasses] = useState<any[]>([]);
  useDocumentTitle('Leave / Outing');
  const load = () => {
    api<{ leaves: any[] }>('/api/hostel/leaves').then((d) => setLeaves(d.leaves)).catch(() => setLeaves([]));
    api<{ outpasses: any[] }>('/api/hostel/outpasses?status=REQUESTED').then((d) => setOutpasses(d.outpasses)).catch(() => setOutpasses([]));
  };
  useEffect(() => { load(); }, []);
  const reviewLeave = (id: number, action: string) => api(`/api/hostel/leaves/${id}/review`, { method: 'POST', body: JSON.stringify({ action }) }).then(load);
  const reviewOutpass = (id: number, action: string) => api(`/api/hostel/outpasses/${id}/review`, { method: 'POST', body: JSON.stringify({ action }) }).then(load);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Leave / Outing" subtitle="Pending leave requests and outing outpasses." />
      <Surface className="divide-y">
        <p className="p-4 text-sm font-semibold">Leave Requests</p>
        {leaves.map((l) => <QueueRow key={`l-${l.id}`} item={l} primary={`${l.student_name} · ${l.usn}`} secondary={`${label(l.leave_type)} · ${dateTime(l.from_at)} to ${dateTime(l.to_at)}`} onApprove={() => reviewLeave(l.id, 'APPROVE')} onReject={() => reviewLeave(l.id, 'REJECT')} />)}
        {leaves.length === 0 ? <EmptyState>No pending leave requests.</EmptyState> : null}
      </Surface>
      <Surface className="divide-y">
        <p className="p-4 text-sm font-semibold">Outing Requests</p>
        {outpasses.map((o) => <QueueRow key={`o-${o.id}`} item={o} primary={`${o.student_name} · ${o.usn}`} secondary={`${o.purpose ?? 'Outing'} · Return ${dateTime(o.expected_return_at)}`} onApprove={() => reviewOutpass(o.id, 'APPROVE')} onReject={() => reviewOutpass(o.id, 'REJECT')} />)}
        {outpasses.length === 0 ? <EmptyState>No pending outing requests.</EmptyState> : null}
      </Surface>
    </div>
  );
}

function QueueRow({ primary, secondary, onApprove, onReject }: { item: any; primary: string; secondary: string; onApprove: () => void; onReject: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
      <div><p className="font-medium">{primary}</p><p className="text-ink-muted">{secondary}</p></div>
      <div className="flex gap-2"><Button size="sm" onClick={onApprove}>Approve</Button><Button size="sm" variant="ghost" onClick={onReject}>Reject</Button></div>
    </div>
  );
}

export function HostelOverdueReturnsPage() {
  const [items, setItems] = useState<any[]>([]);
  useDocumentTitle('Overdue Returns');
  useEffect(() => { api<{ residents: any[] }>('/api/hostel/gate/overdue').then((d) => setItems(d.residents)).catch(() => setItems([])); }, []);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Overdue Returns" subtitle="High-priority movement exceptions from active outpasses." />
      <Surface className="divide-y">
        {items.map((r) => (
          <div key={r.outpassId} className="grid gap-2 p-4 text-sm md:grid-cols-[1fr_180px_140px] md:items-center">
            <div><p className="font-medium">{r.studentName} · {r.usn}</p><p className="text-ink-muted">{r.outpassNumber}</p></div>
            <span>{dateTime(r.expectedReturnAt)}</span>
            <Badge className="bg-danger-soft text-danger">{r.minutesOverdue} min late</Badge>
          </div>
        ))}
        {items.length === 0 ? <EmptyState>No overdue returns.</EmptyState> : null}
      </Surface>
    </div>
  );
}

export function HostelAttendancePage() {
  useDocumentTitle('Hostel Attendance');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Hostel Attendance" subtitle="Daily or night attendance should be fast and bulk-markable." />
      <UnsupportedPanel title="Attendance Not Wired" detail="No authoritative Hostel attendance API is present in the audited route surface. The portal does not mark synthetic attendance. Add a backend attendance service before enabling bulk marking." />
    </div>
  );
}

export function HostelComplaintsStaffPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  useDocumentTitle('Complaints');
  const load = () => api<{ complaints: any[] }>(`/api/hostel/complaints${status ? `?status=${status}` : ''}`).then((d) => setComplaints(d.complaints)).catch(() => setComplaints([]));
  useEffect(() => { load(); }, [status]);
  const update = (id: number, next: string) => api(`/api/hostel/complaints/${id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) }).then(load);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Complaints" subtitle="Operational complaint queue for room, facility, mess, internet, and safety issues." actions={<Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option><option value="OPEN">Open</option><option value="ASSIGNED">Assigned</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option></Select>} />
      <Surface className="divide-y">
        {complaints.map((c) => (
          <div key={c.id} className="grid gap-3 p-4 text-sm lg:grid-cols-[1fr_120px_240px] lg:items-center">
            <div><p className="font-medium">{c.studentName ?? 'Resident'} · {label(c.category)}</p><p className="text-ink-muted">{c.description}</p></div>
            <StatusBadge status={c.status} />
            <div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => update(c.id, 'IN_PROGRESS')}>Assign</Button><Button size="sm" onClick={() => update(c.id, 'RESOLVED')}>Resolve</Button><Button size="sm" variant="ghost" onClick={() => update(c.id, 'CLOSED')}>Close</Button></div>
          </div>
        ))}
        {complaints.length === 0 ? <EmptyState>No complaints in this view.</EmptyState> : null}
      </Surface>
    </div>
  );
}

export function HostelVacatingPage() {
  const [items, setItems] = useState<any[]>([]);
  useDocumentTitle('No-Due Clearance');
  const load = () => api<{ vacating: any[] }>('/api/hostel/vacating').then((d) => setItems(d.vacating)).catch(() => setItems([]));
  useEffect(() => { load(); }, []);
  const complete = (id: number) => api(`/api/hostel/vacating/${id}/complete`, { method: 'POST' }).then(load);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="No-Due Clearance" subtitle="Hostel-only vacating and clearance checklist. Finance remains the source of truth for dues." />
      <Surface className="divide-y">
        {items.map((v) => (
          <div key={v.id} className="grid gap-3 p-4 text-sm lg:grid-cols-[1fr_1fr_120px] lg:items-center">
            <div><p className="font-medium">{v.studentName} · {v.usn}</p><p className="text-ink-muted">{v.reason ?? 'Vacating request'}</p></div>
            <p className="text-ink-muted">Keys {v.keysReturned ? 'done' : 'pending'} · Assets {v.assetsVerified ? 'done' : 'pending'} · Damage {v.damageChecked ? 'done' : 'pending'} · Finance {v.financeChecked ? 'done' : 'pending'}</p>
            <Button size="sm" onClick={() => complete(v.id)}>Complete</Button>
          </div>
        ))}
        {items.length === 0 ? <EmptyState>No pending hostel clearance cases.</EmptyState> : null}
      </Surface>
    </div>
  );
}

export function HostelGateDashboardPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [outside, setOutside] = useState<any[]>([]);
  useDocumentTitle('Entry / Exit');
  useEffect(() => { api<{ residents: any[] }>('/api/hostel/gate/outside').then((d) => setOutside(d.residents)).catch(() => setOutside([])); }, []);
  const search = () => { if (query.trim()) api<{ residents: any[] }>(`/api/hostel/gate/residents/search?q=${encodeURIComponent(query)}`).then((d) => setResults(d.residents)); };
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Entry / Exit" subtitle="Movement visibility for residents outside and quick resident lookup." />
      <Surface className="space-y-3 p-4">
        <h2 className="font-semibold">Resident Search</h2>
        <div className="flex flex-col gap-2 sm:flex-row"><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="USN or name" /><Button onClick={search}>Search</Button></div>
        <div className="grid gap-2 md:grid-cols-2">{results.map((r) => <div key={r.residentId} className="rounded border border-border p-3 text-sm">{r.usn} · {r.studentName}<p className="text-ink-muted">{r.hostelName} · Room {r.roomNumber ?? '—'} · Bed {r.bedCode ?? '—'}</p></div>)}</div>
      </Surface>
      <Surface className="divide-y">
        <p className="p-4 text-sm font-semibold">Residents Outside ({outside.length})</p>
        {outside.map((r) => <div key={r.outpassId} className="flex flex-wrap justify-between gap-2 p-4 text-sm"><span>{r.usn} · {r.studentName}</span><span className="text-ink-muted">Expected return {dateTime(r.expectedReturnAt)}</span></div>)}
        {outside.length === 0 ? <EmptyState>No residents are currently outside on active outpass.</EmptyState> : null}
      </Surface>
    </div>
  );
}

export function HostelVisitorsPage() {
  const [visitors, setVisitors] = useState<any[]>([]);
  useDocumentTitle('Visitors');
  useEffect(() => { api<{ visitors: any[] }>('/api/hostel/gate/visitors/active').then((d) => setVisitors(d.visitors)).catch(() => setVisitors([])); }, []);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Visitors" subtitle="Currently checked-in hostel visitors." />
      <Surface className="divide-y">
        {visitors.map((v) => <div key={v.id} className="p-4 text-sm"><p className="font-medium">{v.name ?? v.visitor_name}</p><p className="text-ink-muted">{v.relationship ?? 'Visitor'} · {v.purpose ?? 'Purpose not recorded'}</p></div>)}
        {visitors.length === 0 ? <EmptyState>No active visitors.</EmptyState> : null}
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
      <PageHeader title="Mess Operations" subtitle="Mess plans and menu surface where the current Hostel API supports them." />
      <Surface className="p-4"><h2 className="font-semibold">Today&apos;s Menu</h2>{data.menu?.meals?.length ? data.menu.meals.map((m: any, i: number) => <p key={i} className="mt-2 text-sm">{label(m.mealType)}: {m.items}</p>) : <p className="mt-2 text-sm text-ink-muted">No menu published.</p>}</Surface>
      <Surface className="divide-y"><p className="p-4 text-sm font-semibold">Mess Plans</p>{data.plans?.map((p: any) => <div key={p.id} className="p-4 text-sm">{p.name} · {label(p.planType)}</div>)}</Surface>
    </div>
  );
}

export function HostelFeesPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selected, setSelected] = useState('');
  const [profile, setProfile] = useState<ResidentProfile | null>(null);
  useDocumentTitle('Hostel Fee Status');
  useEffect(() => { api<{ residents: Resident[] }>('/api/hostel/residents?pageSize=100').then((d) => setResidents(d.residents)).catch(() => setResidents([])); }, []);
  useEffect(() => { if (selected) api<ResidentProfile>(`/api/hostel/residents/${selected}`).then(setProfile).catch(() => setProfile(null)); else setProfile(null); }, [selected]);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Fee Status" subtitle="Read-only hostel dues from Finance. Wardens cannot edit ledgers or mark payments." />
      <Surface className="space-y-4 p-4">
        <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Select resident</option>
          {residents.map((r) => <option key={r.id} value={r.id}>{r.studentName} · {r.usn} · {r.roomNumber ?? 'No room'}</option>)}
        </Select>
        {profile ? (
          <div className="space-y-3">
            <MetricCard label="Outstanding Hostel Dues" value={money(profile.finance.totalOutstanding)} tone={Number(profile.finance.totalOutstanding) > 0 ? 'warning' : undefined} />
            <div className="divide-y rounded border border-border">
              {profile.finance.items.map((item) => <div key={item.demandId} className="grid gap-2 p-3 text-sm md:grid-cols-4"><span>{label(item.demandType)}</span><span>Amount {money(item.amount)}</span><span>Paid {money(item.paid)}</span><span>Outstanding {money(item.outstanding)}</span></div>)}
              {profile.finance.items.length === 0 ? <EmptyState>No hostel fee demands found for this resident.</EmptyState> : null}
            </div>
          </div>
        ) : <p className="text-sm text-ink-muted">Choose a resident to view Finance-backed hostel dues.</p>}
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
      <PageHeader title="Management Analytics" subtitle="Read-only institutional view." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Hostels" value={data.totalHostels} />
        <MetricCard label="Occupancy" value={`${data.capacity?.occupancyPercent ?? 0}%`} />
        <MetricCard label="Applications" value={data.applications} />
        <MetricCard label="Residents" value={data.residents} />
      </div>
    </div>
  );
}

export function HostelGenericCapabilityPage({ capability, status, sensitive }: { capability: string; status: string; sensitive?: boolean }) {
  useDocumentTitle(`Hostel ${capability}`);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={capability} />
      <UnsupportedPanel title={`${capability} Capability`} detail={status} sensitive={sensitive} />
    </div>
  );
}

export function HostelReportsPage() {
  const [report, setReport] = useState<any>(null);
  useDocumentTitle('Hostel Reports');
  useEffect(() => { api('/api/hostel/reports/summary').then(setReport).catch(() => setReport(null)); }, []);
  async function exportResidents() {
    const token = localStorage.getItem('survey_token');
    const context = localStorage.getItem('portal_context');
    const response = await fetch('/api/hostel/reports/residents.csv', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(context ? { 'X-Portal-Context': context } : {}),
      },
    });
    if (!response.ok) return;
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'hostel-residents.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }
  if (!report) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Hostel Reports" subtitle={`Scoped operational summary generated ${dateTime(report.generatedAt)}.`} actions={<Button onClick={exportResidents}>Export residents CSV</Button>} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Residents" value={report.residents.active} />
        <MetricCard label="Occupancy" value={`${report.occupancy.occupancyPercent}%`} />
        <MetricCard label="Available Beds" value={report.occupancy.availableBeds} />
        <MetricCard label="Pending Allocation" value={report.applications.allocationPending} />
        <MetricCard label="Waitlisted" value={report.waitlist} />
        <MetricCard label="Pending Leave" value={report.movement.pendingLeave} />
        <MetricCard label="Open Complaints" value={report.complaints.open} />
        <MetricCard label="Pending No-Due" value={report.clearance.pendingVacating} />
      </div>
      {report.limitations?.map((item: string) => <Surface key={item} className="p-4 text-sm text-ink-muted">{item}</Surface>)}
    </div>
  );
}

type MaintenanceTicket = {
  id: number;
  ticketNo: string;
  title: string;
  status: string;
  priority: string;
  building?: string | null;
};

export function HostelMaintenancePage() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [building, setBuilding] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useDocumentTitle('Hostel Maintenance');

  async function loadTickets() {
    const result = await api<{ rows: MaintenanceTicket[] }>('/api/maintenance/tickets?sourceModule=HOSTEL&pageSize=100');
    setTickets(result.rows);
  }

  useEffect(() => { loadTickets().catch(() => setTickets([])); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api('/api/maintenance/tickets', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description: description || undefined,
          building: building || undefined,
          categoryCode: 'HOSTEL_FACILITY',
          sourceModule: 'HOSTEL',
        }),
      });
      setTitle('');
      setDescription('');
      setBuilding('');
      await loadTickets();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to raise maintenance ticket.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Maintenance" subtitle="Raise and track Hostel-sourced tickets through the campus Maintenance service." />
      <Surface className="p-4">
        <form className="grid gap-3 md:grid-cols-2" onSubmit={submit}>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Issue title" required minLength={3} />
          <Input value={building} onChange={(event) => setBuilding(event.target.value)} placeholder="Building or block" />
          <div className="md:col-span-2">
            <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description and location details" />
          </div>
          {error ? <p className="text-sm text-danger md:col-span-2">{error}</p> : null}
          <div className="md:col-span-2"><Button type="submit" disabled={saving}>{saving ? 'Raising ticket...' : 'Raise ticket'}</Button></div>
        </form>
      </Surface>
      <Surface className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead><tr className="border-b border-border"><th className="p-3">Ticket</th><th className="p-3">Issue</th><th className="p-3">Location</th><th className="p-3">Priority</th><th className="p-3">Status</th></tr></thead>
          <tbody>{tickets.map((ticket) => <tr key={ticket.id} className="border-b border-border last:border-0"><td className="p-3 font-medium">{ticket.ticketNo}</td><td className="p-3">{ticket.title}</td><td className="p-3">{ticket.building ?? '—'}</td><td className="p-3">{label(ticket.priority)}</td><td className="p-3"><StatusBadge status={ticket.status} /></td></tr>)}</tbody>
        </table>
        {tickets.length === 0 ? <EmptyState>No Hostel maintenance tickets raised by this account.</EmptyState> : null}
      </Surface>
    </div>
  );
}
