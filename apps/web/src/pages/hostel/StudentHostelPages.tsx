import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, Field, Input, PageHeader, Skeleton, Surface, Textarea } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { StatusPill, statusToneFor, StudentEmpty } from '../lms/studentUi';

type HostelAccess = {
  visibility: string;
  canApply: boolean;
  canAccessResidentFeatures: boolean;
  applicationId?: number;
  residentId?: number;
  hostelId?: number;
};

type HostelHome = {
  access: HostelAccess;
  application: any;
  room: any;
  mess: any;
  dues: { totalOutstanding: string; items: any[] };
};

const visibilityLabels: Record<string, string> = {
  APPLICATION_AVAILABLE: 'Apply for Hostel',
  APPLICATION_DRAFT: 'Continue Application',
  APPLICATION_PENDING: 'Application Status',
  WAITLISTED: 'Waitlist Status',
  APPROVED: 'Admission Status',
  ALLOCATION_PENDING: 'Room Allocation Pending',
  RESIDENT: 'Hostel Home',
  VACATING: 'Vacating Status',
  FORMER_RESIDENT: 'Hostel History',
};

export function StudentHostelHomePage() {
  const [data, setData] = useState<HostelHome | null>(null);
  useDocumentTitle('Hostel');

  useEffect(() => {
    api<HostelHome>('/api/student/hostel').then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;

  const { access, application, room, mess, dues } = data;

  if (access.visibility === 'HIDDEN') {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Hostel" subtitle="Campus accommodation" />
        <StudentEmpty title="Hostel unavailable" body="Hostel applications are currently closed or you are not eligible." />
      </div>
    );
  }

  if (['APPLICATION_AVAILABLE', 'APPLICATION_DRAFT'].includes(access.visibility)) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Hostel" subtitle={visibilityLabels[access.visibility]} />
        <Surface className="p-6 text-center">
          <p className="text-ink-muted mb-4">Apply for hostel accommodation for the current academic year.</p>
          <Link to="/lms/hostel/apply">
            <Button>{access.visibility === 'APPLICATION_DRAFT' ? 'Continue Application' : 'Apply for Hostel'}</Button>
          </Link>
        </Surface>
      </div>
    );
  }

  if (['APPLICATION_PENDING', 'WAITLISTED', 'APPROVED', 'ALLOCATION_PENDING'].includes(access.visibility)) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Hostel Application" subtitle={visibilityLabels[access.visibility]} />
        {application && (
          <Surface className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Application No: {application.applicationNumber}</h2>
              <StatusPill tone={statusToneFor(application.status)}>{application.status.replace(/_/g, ' ')}</StatusPill>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div><span className="text-ink-muted">Academic Year:</span> {application.academicYear ?? '—'}</div>
              <div><span className="text-ink-muted">Preferred Hostel:</span> {application.preferredHostelName ?? '—'}</div>
              <div><span className="text-ink-muted">Room Preference:</span> {application.preferredRoomType?.replace(/_/g, ' ') ?? '—'}</div>
              <div><span className="text-ink-muted">Mess:</span> {application.messRequired ? 'Required' : 'Not required'}</div>
              {application.submittedAt && <div><span className="text-ink-muted">Submitted:</span> {new Date(application.submittedAt).toLocaleDateString()}</div>}
            </div>
            {access.visibility === 'ALLOCATION_PENDING' && (
              <p className="text-sm text-ink-muted">Your application is approved. Room allocation is pending.</p>
            )}
          </Surface>
        )}
        {Number(dues.totalOutstanding) > 0 && (
          <Surface className="p-4">
            <p className="text-sm">Outstanding hostel dues: ₹{dues.totalOutstanding}</p>
            <Link to="/lms/fees" className="mt-2 inline-block"><Button variant="secondary" size="sm">Pay via Finance</Button></Link>
          </Surface>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Hostel" subtitle={room?.hostelName ?? 'Your accommodation'} />
      {room && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Room</p><p className="mt-1 text-xl font-semibold">{room.roomNumber}</p></Surface>
          <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Bed</p><p className="mt-1 text-xl font-semibold">{room.bedCode}</p></Surface>
          <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Block</p><p className="mt-1 text-xl font-semibold">{room.blockCode}</p></Surface>
          <Surface className="p-4"><p className="text-xs uppercase text-ink-muted">Resident No</p><p className="mt-1 break-words text-lg font-semibold">{room.residentNumber}</p></Surface>
        </div>
      )}
      {mess?.messPlan && (
        <Surface className="p-4"><p className="text-sm"><span className="text-ink-muted">Mess Plan:</span> {mess.messPlan.name}</p></Surface>
      )}
      {Number(dues.totalOutstanding) > 0 && (
        <Surface className="p-4 flex items-center justify-between">
          <span className="text-sm">Outstanding: ₹{dues.totalOutstanding}</span>
          <Link to="/lms/fees"><Button variant="secondary" size="sm">Pay Dues</Button></Link>
        </Surface>
      )}
      {access.canAccessResidentFeatures && (
        <div className="flex flex-wrap gap-2">
          <Link to="/lms/hostel/room"><Button variant="secondary">My Room</Button></Link>
          <Link to="/lms/hostel/outpass"><Button variant="secondary">Outpass & Leave</Button></Link>
          <Link to="/lms/hostel/mess"><Button variant="secondary">Mess</Button></Link>
          <Link to="/lms/hostel/visitors"><Button variant="secondary">Visitors</Button></Link>
          <Link to="/lms/hostel/complaints"><Button variant="secondary">Complaints</Button></Link>
          <Link to="/lms/hostel/clearance"><Button variant="secondary">Clearance</Button></Link>
        </div>
      )}
      {access.visibility === 'VACATING' && (
        <Surface className="p-4"><p className="text-sm text-ink-muted">Vacating in progress. Complete clearance checklist with the warden.</p></Surface>
      )}
      {access.visibility === 'FORMER_RESIDENT' && (
        <div className="flex flex-wrap gap-2">
          <Link to="/lms/hostel/history"><Button variant="secondary">Allocation History</Button></Link>
          <Link to="/lms/hostel/clearance"><Button variant="secondary">Clearance Status</Button></Link>
        </div>
      )}
    </div>
  );
}

export function StudentHostelApplyPage() {
  const [form, setForm] = useState({ preferredRoomType: 'TRIPLE', messRequired: true, rulesAccepted: false, declarationAccepted: false, additionalNote: '' });
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  useDocumentTitle('Apply for Hostel');

  useEffect(() => {
    api<{ application: any }>('/api/student/hostel/application').then((d) => {
      if (d.application) {
        setApplicationId(d.application.id);
        setForm((f) => ({
          ...f,
          ...d.application,
          additionalNote: d.application.additionalNote ?? '',
          rulesAccepted: d.application.rulesAccepted,
          declarationAccepted: d.application.declarationAccepted,
        }));
      }
    }).catch(() => {});
  }, []);

  const save = async (submit = false) => {
    const path = applicationId ? `/api/student/hostel/application/${applicationId}` : '/api/student/hostel/application';
    const method = applicationId ? 'PATCH' : 'POST';
    const result = await api<any>(path, { method, body: JSON.stringify(form) });
    setApplicationId(result.id);
    if (submit && result.id) {
      await api(`/api/student/hostel/application/${result.id}/submit`, { method: 'POST' });
      setMessage('Application submitted successfully.');
    } else {
      setMessage('Draft saved.');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Hostel Application" subtitle="Hostel-specific information only" />
      <Surface className="space-y-4 p-4">
        <p className="text-sm text-ink-muted">Your academic details are already on file. Provide hostel preferences below.</p>
        <Field label="Room preference">
          <select className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" value={form.preferredRoomType} onChange={(e) => setForm({ ...form, preferredRoomType: e.target.value })}>
            <option value="SINGLE">Single</option>
            <option value="DOUBLE">Double</option>
            <option value="TRIPLE">Triple Sharing</option>
            <option value="FOUR_SHARING">Four Sharing</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.messRequired} onChange={(e) => setForm({ ...form, messRequired: e.target.checked })} /> Mess required</label>
        <Field label="Additional note (optional)"><Textarea value={form.additionalNote} onChange={(e) => setForm({ ...form, additionalNote: e.target.value })} rows={3} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.rulesAccepted} onChange={(e) => setForm({ ...form, rulesAccepted: e.target.checked })} /> I accept hostel rules</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.declarationAccepted} onChange={(e) => setForm({ ...form, declarationAccepted: e.target.checked })} /> I declare the information is correct</label>
        {message && <p className="text-sm text-green-600">{message}</p>}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => save(false)}>Save Draft</Button>
          <Button onClick={() => save(true)} disabled={!form.rulesAccepted || !form.declarationAccepted}>Submit Application</Button>
        </div>
      </Surface>
    </div>
  );
}

export function StudentHostelRoomPage() {
  const [room, setRoom] = useState<any>(null);
  useDocumentTitle('My Room');
  useEffect(() => { api<{ room: any }>('/api/student/hostel/room').then((d) => setRoom(d.room)).catch(() => setRoom(null)); }, []);
  if (!room) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="My Room" subtitle={`${room.hostelName} · ${room.blockName}`} />
      <Surface className="grid gap-3 p-4 sm:grid-cols-2">
        <div><span className="text-ink-muted text-sm">Room</span><p className="font-semibold">{room.roomNumber}</p></div>
        <div><span className="text-ink-muted text-sm">Bed</span><p className="font-semibold">{room.bedCode}</p></div>
        <div><span className="text-ink-muted text-sm">Type</span><p>{room.roomType?.replace(/_/g, ' ')}</p></div>
        <div><span className="text-ink-muted text-sm">Admitted</span><p>{room.admittedAt ? new Date(room.admittedAt).toLocaleDateString() : '—'}</p></div>
      </Surface>
      {room.roommates?.length > 0 && (
        <Surface className="p-4">
          <h2 className="text-sm font-semibold mb-2">Roommates</h2>
          <ul className="space-y-1 text-sm">{room.roommates.map((r: any, i: number) => <li key={i}>{r.name} · {r.usn} · Bed {r.bedCode}</li>)}</ul>
        </Surface>
      )}
    </div>
  );
}

export function StudentHostelOutpassPage() {
  const [outpasses, setOutpasses] = useState<any[]>([]);
  const [form, setForm] = useState({ purpose: '', destination: '', expectedExitAt: '', expectedReturnAt: '' });
  useDocumentTitle('Outpass & Leave');
  const load = () => api<{ outpasses: any[] }>('/api/student/hostel/outpasses').then((d) => setOutpasses(d.outpasses)).catch(() => setOutpasses([]));
  useEffect(() => { load(); }, []);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Outpass" subtitle="Request exit permission" />
      <Surface className="space-y-3 p-4">
        <Field label="Purpose"><Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></Field>
        <Field label="Destination"><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Expected exit"><Input type="datetime-local" value={form.expectedExitAt} onChange={(e) => setForm({ ...form, expectedExitAt: e.target.value })} /></Field>
          <Field label="Expected return"><Input type="datetime-local" value={form.expectedReturnAt} onChange={(e) => setForm({ ...form, expectedReturnAt: e.target.value })} /></Field>
        </div>
        <Button onClick={() => api('/api/student/hostel/outpasses', { method: 'POST', body: JSON.stringify(form) }).then(load)}>Request Outpass</Button>
      </Surface>
      <Surface className="p-4">
        <h2 className="text-sm font-semibold mb-2">My Outpasses</h2>
        <ul className="space-y-2 text-sm">{outpasses.map((o) => (
          <li key={o.id} className="flex justify-between"><span>{o.outpassNumber} — {o.purpose}</span><StatusPill tone={statusToneFor(o.status)}>{o.status}</StatusPill></li>
        ))}</ul>
      </Surface>
    </div>
  );
}

export function StudentHostelMessPage() {
  const [menu, setMenu] = useState<any>(null);
  useDocumentTitle('Mess');
  useEffect(() => { api('/api/student/hostel/mess/menu').then(setMenu).catch(() => setMenu(null)); }, []);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Mess" subtitle="Today's menu" />
      {!menu ? <Skeleton className="h-32 w-full" /> : (
        <Surface className="p-4">
          <p className="text-sm text-ink-muted mb-3">{menu.date}</p>
          <div className="space-y-3">{menu.meals?.map((m: any, i: number) => (
            <div key={i}><p className="font-medium text-sm">{m.mealType}</p><p className="text-sm text-ink-muted">{m.items}</p></div>
          ))}</div>
        </Surface>
      )}
    </div>
  );
}

export function StudentHostelComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [form, setForm] = useState({ category: 'PLUMBING', description: '' });
  useDocumentTitle('Complaints');
  const load = () => api<{ complaints: any[] }>('/api/student/hostel/complaints').then((d) => setComplaints(d.complaints)).catch(() => setComplaints([]));
  useEffect(() => { load(); }, []);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Complaints" subtitle="Report hostel issues" />
      <Surface className="space-y-3 p-4">
        <Field label="Category">
          <select className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {['PLUMBING', 'ELECTRICAL', 'CLEANING', 'FURNITURE', 'INTERNET', 'MESS', 'OTHER'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} /></Field>
        <Button onClick={() => api('/api/student/hostel/complaints', { method: 'POST', body: JSON.stringify(form) }).then(() => { setForm({ category: 'PLUMBING', description: '' }); load(); })}>Submit Complaint</Button>
      </Surface>
      <Surface className="p-4">
        <ul className="space-y-2 text-sm">{complaints.map((c) => (
          <li key={c.id} className="flex justify-between"><span>{c.category}: {c.description.slice(0, 60)}</span><StatusPill tone={statusToneFor(c.status)}>{c.status}</StatusPill></li>
        ))}</ul>
      </Surface>
    </div>
  );
}

export function StudentHostelClearancePage() {
  const [clearance, setClearance] = useState<any>(null);
  useDocumentTitle('Hostel Clearance');
  useEffect(() => { api('/api/student/hostel/clearance').then(setClearance).catch(() => setClearance(null)); }, []);
  if (!clearance) return <Skeleton className="h-32 w-full" />;
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Hostel Clearance" />
      <Surface className="p-4">
        <StatusPill tone={clearance.overallClear ? 'success' : 'warning'}>{clearance.hostel?.status}</StatusPill>
        {clearance.hostel?.reasons?.length > 0 && (
          <ul className="mt-3 text-sm text-ink-muted">{clearance.hostel.reasons.map((r: string) => <li key={r}>{r.replace(/_/g, ' ')}</li>)}</ul>
        )}
      </Surface>
    </div>
  );
}

export function StudentHostelHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  useDocumentTitle('Hostel History');
  useEffect(() => { api<{ history: any[] }>('/api/student/hostel/history').then((d) => setHistory(d.history)).catch(() => setHistory([])); }, []);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Hostel History" />
      <Surface className="p-4">
        <ul className="space-y-2 text-sm">{history.map((h) => (
          <li key={h.id}>{h.hostelName} · Room {h.roomNumber} · Bed {h.bedCode} · {h.status} · {new Date(h.startAt).toLocaleDateString()}</li>
        ))}</ul>
      </Surface>
    </div>
  );
}

export function StudentHostelVisitorsPage() {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', relationship: '', purpose: '' });
  useDocumentTitle('Visitors');
  const load = () => api<{ visitors: any[] }>('/api/student/hostel/visitors').then((d) => setVisitors(d.visitors)).catch(() => setVisitors([]));
  useEffect(() => { load(); }, []);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Visitors" subtitle="Request visitor pre-approval" />
      <Surface className="space-y-3 p-4">
        <Field label="Visitor name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Relationship"><Input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} /></Field>
        <Field label="Purpose"><Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></Field>
        <Button onClick={() => api('/api/student/hostel/visitors', { method: 'POST', body: JSON.stringify(form) }).then(load)}>Request Visitor</Button>
      </Surface>
      <Surface className="p-4"><ul className="space-y-2 text-sm">{visitors.map((v) => <li key={v.id}>{v.visitorName} — <StatusPill tone={statusToneFor(v.status)}>{v.status}</StatusPill></li>)}</ul></Surface>
    </div>
  );
}
